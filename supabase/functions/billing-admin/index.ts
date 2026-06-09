// Painel super-admin de billing: catálogo de planos + assinaturas por tenant.
// Protegido por platform_admins.

import { handleCors, jsonResponse } from "../_shared/http.ts";
import { recordPlatformAudit } from "../_shared/platform-audit.ts";
import { createAdminClient, requireTenantContext } from "../_shared/supabase.ts";

const METRICS = [
  "customers",
  "whatsapp_instances",
  "users",
  "ai_monthly_tokens",
  "marketing_flow_runs_monthly",
  "storage_gb",
] as const;

const ENTITLEMENT_KEYS = [...METRICS, "support", "custom_api"] as const;

const VALID_STATUS = new Set(["trialing", "active", "past_due", "paused", "canceled", "incomplete"]);
const VALID_PERIODS = new Set(["monthly", "yearly"]);
const VALID_PLAN_STATUS = new Set(["active", "archived"]);

type Metric = (typeof METRICS)[number];

type BillingSubscriptionRow = {
  tenant_id: string;
  plan_id: string;
  status: string;
  billing_period: string;
  current_period_end: string | null;
  gateway_provider: string | null;
  gateway_status: string | null;
  gateway_subscription_id: string | null;
};

function addPeriod(from: Date, billingPeriod: string): Date {
  const next = new Date(from);
  if (billingPeriod === "yearly") {
    next.setUTCFullYear(next.getUTCFullYear() + 1);
  } else {
    next.setUTCMonth(next.getUTCMonth() + 1);
  }
  return next;
}

function normalizePlanId(value: unknown): string {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function parseLimitValue(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "string" && value.trim().toLowerCase() === "unlimited") return null;
  const num = Number(value);
  if (!Number.isFinite(num) || num < 0) return null;
  return Math.trunc(num);
}

function parseEntitlements(raw: unknown): Record<string, unknown> {
  const input = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const out: Record<string, unknown> = {};
  for (const key of ENTITLEMENT_KEYS) {
    if (!(key in input)) continue;
    const value = input[key];
    if (key === "support") {
      const text = typeof value === "string" ? value.trim() : "";
      if (text) out[key] = text;
      continue;
    }
    if (key === "custom_api") {
      out[key] = value === true || value === "true" || value === 1 || value === "1";
      continue;
    }
    out[key] = parseLimitValue(value);
  }
  return out;
}

function parseFeatures(raw: unknown): string[] {
  if (!Array.isArray(raw)) {
    if (typeof raw === "string") {
      return raw
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);
    }
    return [];
  }
  return raw.map((item) => String(item).trim()).filter(Boolean).slice(0, 30);
}

function parsePriceCents(raw: unknown): number | null {
  if (raw === null || raw === undefined || raw === "") return null;
  const num = Number(raw);
  if (!Number.isFinite(num) || num < 0) return null;
  return Math.round(num);
}

async function requirePlatformAdmin(request: Request) {
  const ctx = await requireTenantContext(request);
  const admin = createAdminClient();
  const { data: isAdmin } = await admin
    .from("platform_admins")
    .select("user_id")
    .eq("user_id", ctx.userId)
    .maybeSingle();

  if (!isAdmin) {
    throw new Error("Acesso restrito ao administrador da plataforma.");
  }

  return { ...ctx, admin };
}

async function getUsageForTenant(
  admin: ReturnType<typeof createAdminClient>,
  tenantId: string,
): Promise<Array<{ metric: Metric; used: number; limit_value: number | null }>> {
  const rows = await Promise.all(
    METRICS.map(async (metric) => {
      const [{ data: used, error: usedError }, { data: limit, error: limitError }] = await Promise.all([
        admin.rpc("get_tenant_current_usage", { p_tenant_id: tenantId, p_metric: metric }),
        admin.rpc("get_tenant_plan_limit", { p_tenant_id: tenantId, p_metric: metric }),
      ]);

      if (usedError) throw new Error(usedError.message);
      if (limitError) throw new Error(limitError.message);

      return {
        metric,
        used: Number(used ?? 0),
        limit_value: limit === null || limit === undefined ? null : Number(limit),
      };
    }),
  );

  return rows;
}

async function listPlanCatalog(admin: ReturnType<typeof createAdminClient>) {
  const [{ data: plans, error: plansError }, { data: prices, error: pricesError }] = await Promise.all([
    admin
      .from("billing_plans")
      .select("id, name, description, entitlements, features, status, sort_order, created_at, updated_at")
      .order("sort_order", { ascending: true }),
    admin
      .from("billing_plan_prices")
      .select("plan_id, billing_period, currency, amount_cents, active"),
  ]);

  if (plansError) return jsonResponse({ error: plansError.message }, 500);
  if (pricesError) return jsonResponse({ error: pricesError.message }, 500);

  const pricesByPlan = new Map<string, Record<string, { currency: string; amount_cents: number; active: boolean }>>();
  for (const row of prices ?? []) {
    const planId = String(row.plan_id);
    const bucket = pricesByPlan.get(planId) ?? {};
    bucket[String(row.billing_period)] = {
      currency: String(row.currency ?? "brl"),
      amount_cents: Number(row.amount_cents ?? 0),
      active: row.active !== false,
    };
    pricesByPlan.set(planId, bucket);
  }

  return jsonResponse({
    plans: (plans ?? []).map((plan: Record<string, unknown>) => {
      const id = String(plan.id);
      const planPrices = pricesByPlan.get(id) ?? {};
      return {
        id,
        name: String(plan.name ?? id),
        description: plan.description == null ? null : String(plan.description),
        entitlements: plan.entitlements ?? {},
        features: Array.isArray(plan.features) ? plan.features : [],
        status: String(plan.status ?? "active"),
        sort_order: Number(plan.sort_order ?? 0),
        created_at: String(plan.created_at ?? ""),
        updated_at: String(plan.updated_at ?? ""),
        prices: {
          monthly: planPrices.monthly ?? null,
          yearly: planPrices.yearly ?? null,
        },
      };
    }),
  });
}

async function upsertPlanCatalog(
  admin: ReturnType<typeof createAdminClient>,
  ctx: Awaited<ReturnType<typeof requirePlatformAdmin>>,
  body: Record<string, unknown>,
  request: Request,
) {
  const planRaw = body.plan && typeof body.plan === "object" ? (body.plan as Record<string, unknown>) : {};
  const pricesRaw = body.prices && typeof body.prices === "object" ? (body.prices as Record<string, unknown>) : {};

  const planId = normalizePlanId(planRaw.id);
  const name = String(planRaw.name ?? "").trim();
  const description = String(planRaw.description ?? "").trim() || null;
  const sortOrder = Number(planRaw.sort_order ?? 0);
  const status = String(planRaw.status ?? "active").trim();

  if (!planId) return jsonResponse({ error: "ID do plano invalido." }, 400);
  if (!name) return jsonResponse({ error: "Nome do plano obrigatorio." }, 400);
  if (!VALID_PLAN_STATUS.has(status)) return jsonResponse({ error: "Status do plano invalido." }, 400);
  if (!Number.isFinite(sortOrder)) return jsonResponse({ error: "Ordem invalida." }, 400);

  const entitlements = parseEntitlements(planRaw.entitlements);
  const features = parseFeatures(planRaw.features);

  const monthlyCents = parsePriceCents(pricesRaw.monthly ?? pricesRaw.monthly_cents);
  const yearlyCents = parsePriceCents(pricesRaw.yearly ?? pricesRaw.yearly_cents);
  if (monthlyCents === null || yearlyCents === null) {
    return jsonResponse({ error: "Precos mensal e anual sao obrigatorios (em centavos)." }, 400);
  }

  const { data: before } = await admin
    .from("billing_plans")
    .select("id, name, description, entitlements, features, status, sort_order")
    .eq("id", planId)
    .maybeSingle();

  const now = new Date().toISOString();
  const { error: planError } = await admin.from("billing_plans").upsert(
    {
      id: planId,
      name,
      description,
      sort_order: sortOrder,
      status,
      entitlements,
      features,
      updated_at: now,
    },
    { onConflict: "id" },
  );
  if (planError) return jsonResponse({ error: planError.message }, 500);

  for (const period of ["monthly", "yearly"] as const) {
    const amount = period === "monthly" ? monthlyCents : yearlyCents;
    const { error: priceError } = await admin.from("billing_plan_prices").upsert(
      {
        plan_id: planId,
        billing_period: period,
        currency: "brl",
        amount_cents: amount,
        active: status === "active",
        updated_at: now,
      },
      { onConflict: "plan_id,billing_period" },
    );
    if (priceError) return jsonResponse({ error: priceError.message }, 500);
  }

  await admin.rpc("refresh_current_billing_usage", { p_tenant_id: null });
  await recordPlatformAudit(admin, {
    tenantId: ctx.tenantId,
    actor: { userId: ctx.userId, role: ctx.role },
    entityType: "billing_plan",
    entityId: planId,
    summary: before ? `Plano ${planId} atualizado` : `Plano ${planId} criado`,
    changes: {
      name: { from: before?.name ?? null, to: name },
      status: { from: before?.status ?? null, to: status },
      sort_order: { from: before?.sort_order ?? null, to: sortOrder },
      entitlements: { from: before?.entitlements ?? null, to: entitlements },
    },
    metadata: { source: "billing-admin", intent: "upsert_plan" },
    request,
  });

  return jsonResponse({ ok: true, plan_id: planId });
}

Deno.serve(async (request) => {
  const cors = handleCors(request);
  if (cors) return cors;

  let ctx: Awaited<ReturnType<typeof requirePlatformAdmin>>;
  try {
    ctx = await requirePlatformAdmin(request);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unauthorized.";
    return jsonResponse({ error: message }, message.includes("restrito") ? 403 : 401);
  }

  const { admin } = ctx;
  const url = new URL(request.url);

  if (request.method === "GET") {
    if (url.searchParams.get("view") === "catalog") {
      return await listPlanCatalog(admin);
    }

    const [{ data: tenants, error: tenantsError }, { data: subs, error: subsError }, { data: plans, error: plansError }] =
      await Promise.all([
        admin.from("tenants").select("id, nome, created_at").order("nome", { ascending: true }),
        admin
          .from("billing_subscriptions")
          .select("tenant_id, plan_id, status, billing_period, current_period_end, gateway_provider, gateway_status, gateway_subscription_id"),
        admin.from("billing_plans").select("id, name, description, entitlements, features, status").eq("status", "active").order("sort_order"),
      ]);

    if (tenantsError) return jsonResponse({ error: tenantsError.message }, 500);
    if (subsError) return jsonResponse({ error: subsError.message }, 500);
    if (plansError) return jsonResponse({ error: plansError.message }, 500);

    const subByTenant = new Map<string, BillingSubscriptionRow>();
    for (const sub of (subs ?? []) as BillingSubscriptionRow[]) {
      subByTenant.set(sub.tenant_id, sub);
    }

    const rows = await Promise.all(
      (tenants ?? []).map(async (tenant: Record<string, unknown>) => {
        const tenantId = String(tenant.id);
        const usage = await getUsageForTenant(admin, tenantId);
        const exceeded = usage.filter((row) => row.limit_value !== null && row.used > row.limit_value);

        return {
          tenant_id: tenantId,
          nome: String(tenant.nome ?? "Sem nome"),
          created_at: String(tenant.created_at ?? ""),
          subscription: subByTenant.get(tenantId) ?? null,
          usage,
          exceeded_metrics: exceeded.map((row) => row.metric),
        };
      }),
    );

    return jsonResponse({
      plans: (plans ?? []).map((plan: Record<string, unknown>) => ({
        id: String(plan.id),
        name: String(plan.name ?? plan.id),
        description: plan.description == null ? null : String(plan.description),
        entitlements: plan.entitlements ?? {},
        features: plan.features ?? [],
      })),
      tenants: rows,
    });
  }

  if (request.method === "POST") {
    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return jsonResponse({ error: "JSON invalido." }, 400);
    }

    const intent = String(body.intent ?? "set_tenant_plan").trim().toLowerCase();
    if (intent === "upsert_plan") {
      return await upsertPlanCatalog(admin, ctx, body, request);
    }

    const tenantId = String(body.tenant_id ?? "").trim();
    const planId = String(body.plan_id ?? "").trim();
    const status = String(body.status ?? "active").trim();
    const billingPeriod = String(body.billing_period ?? "monthly").trim();

    if (!tenantId) return jsonResponse({ error: "tenant_id obrigatorio." }, 400);
    if (!planId) return jsonResponse({ error: "plan_id obrigatorio." }, 400);
    if (!VALID_STATUS.has(status)) return jsonResponse({ error: "Status invalido." }, 400);
    if (!VALID_PERIODS.has(billingPeriod)) return jsonResponse({ error: "Periodo invalido." }, 400);

    const { data: planExists, error: planExistsError } = await admin
      .from("billing_plans")
      .select("id")
      .eq("id", planId)
      .eq("status", "active")
      .maybeSingle();
    if (planExistsError) return jsonResponse({ error: planExistsError.message }, 500);
    if (!planExists) return jsonResponse({ error: "Plano nao encontrado ou inativo." }, 400);

    const { data: before } = await admin
      .from("billing_subscriptions")
      .select("tenant_id, plan_id, status, billing_period, current_period_end")
      .eq("tenant_id", tenantId)
      .maybeSingle();

    const now = new Date();
    const periodEnd = addPeriod(now, billingPeriod);

    const { error: upsertError } = await admin.from("billing_subscriptions").upsert(
      {
        tenant_id: tenantId,
        plan_id: planId,
        status,
        billing_period: billingPeriod,
        current_period_start: now.toISOString(),
        current_period_end: periodEnd.toISOString(),
        cancel_at_period_end: false,
        metadata: {
          manual_update: true,
          updated_by: ctx.userId,
          updated_at: now.toISOString(),
        },
        updated_at: now.toISOString(),
      },
      { onConflict: "tenant_id" },
    );

    if (upsertError) return jsonResponse({ error: upsertError.message }, 500);

    await admin.from("profiles").update({ plano: planId }).eq("tenant_id", tenantId);
    await admin.rpc("refresh_current_billing_usage", { p_tenant_id: tenantId });
    await recordPlatformAudit(admin, {
      tenantId,
      actor: { userId: ctx.userId, role: ctx.role },
      entityType: "billing_subscription",
      entityId: tenantId,
      summary: `Plano alterado para ${planId} (${status}, ${billingPeriod})`,
      changes: {
        plan_id: { from: before?.plan_id ?? null, to: planId },
        status: { from: before?.status ?? null, to: status },
        billing_period: { from: before?.billing_period ?? null, to: billingPeriod },
        current_period_end: { from: before?.current_period_end ?? null, to: periodEnd.toISOString() },
      },
      metadata: { source: "billing-admin" },
      request,
    });

    return jsonResponse({ ok: true });
  }

  return jsonResponse({ error: "Method not allowed." }, 405);
});
