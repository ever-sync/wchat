// Painel super-admin de billing: lista tenants com plano/uso e permite ajuste
// manual de assinatura. Operacao entre tenants, protegida por platform_admins.

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

const VALID_PLANS = new Set(["starter", "profissional", "enterprise"]);
const VALID_STATUS = new Set(["trialing", "active", "past_due", "paused", "canceled", "incomplete"]);
const VALID_PERIODS = new Set(["monthly", "yearly"]);

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

  if (request.method === "GET") {
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

    const tenantId = String(body.tenant_id ?? "").trim();
    const planId = String(body.plan_id ?? "").trim();
    const status = String(body.status ?? "active").trim();
    const billingPeriod = String(body.billing_period ?? "monthly").trim();

    if (!tenantId) return jsonResponse({ error: "tenant_id obrigatorio." }, 400);
    if (!VALID_PLANS.has(planId)) return jsonResponse({ error: "Plano invalido." }, 400);
    if (!VALID_STATUS.has(status)) return jsonResponse({ error: "Status invalido." }, 400);
    if (!VALID_PERIODS.has(billingPeriod)) return jsonResponse({ error: "Periodo invalido." }, 400);

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
