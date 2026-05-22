// Painel super-admin do add-on de IA: lista tenants (status/cota/uso) e provisiona
// (ativa/desativa + cota + overage). Opera ENTRE tenants com service role, gated por
// platform_admins (o JWT precisa ser de um admin da plataforma).

import { handleCors, jsonResponse } from "../_shared/http.ts";
import { createAdminClient, requireTenantContext } from "../_shared/supabase.ts";

function monthStartIso(): string {
  const d = new Date();
  d.setUTCDate(1);
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString();
}

Deno.serve(async (request) => {
  const cors = handleCors(request);
  if (cors) return cors;

  let ctx;
  try {
    ctx = await requireTenantContext(request);
  } catch (err) {
    return jsonResponse({ error: err instanceof Error ? err.message : "Unauthorized." }, 401);
  }

  const admin = createAdminClient();
  const { data: isAdmin } = await admin
    .from("platform_admins")
    .select("user_id")
    .eq("user_id", ctx.userId)
    .maybeSingle();
  if (!isAdmin) {
    return jsonResponse({ error: "Acesso restrito ao administrador da plataforma." }, 403);
  }

  if (request.method === "GET") {
    const [{ data: tenants }, { data: subs }, { data: usage }] = await Promise.all([
      admin.from("tenants").select("id, nome").order("nome", { ascending: true }),
      admin.from("tenant_ai_subscription").select("tenant_id, active, monthly_token_quota, overage_allowed, trial_ends_at"),
      admin.from("ai_usage").select("tenant_id, input_tokens, output_tokens").gte("created_at", monthStartIso()),
    ]);

    const usedByTenant = new Map<string, number>();
    for (const u of usage ?? []) {
      const prev = usedByTenant.get(u.tenant_id) ?? 0;
      usedByTenant.set(u.tenant_id, prev + (u.input_tokens ?? 0) + (u.output_tokens ?? 0));
    }
    const subByTenant = new Map<string, Record<string, unknown>>();
    for (const s of subs ?? []) subByTenant.set(s.tenant_id, s);

    const rows = (tenants ?? []).map((t: Record<string, unknown>) => {
      const sub = subByTenant.get(String(t.id));
      return {
        tenant_id: t.id,
        nome: t.nome,
        active: Boolean(sub?.active),
        monthly_token_quota: Number(sub?.monthly_token_quota ?? 0),
        overage_allowed: Boolean(sub?.overage_allowed),
        trial_ends_at: (sub?.trial_ends_at as string | null) ?? null,
        has_subscription: Boolean(sub),
        tokens_used: usedByTenant.get(String(t.id)) ?? 0,
      };
    });
    return jsonResponse({ tenants: rows });
  }

  if (request.method === "POST") {
    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return jsonResponse({ error: "JSON inválido." }, 400);
    }
    const tenantId = String(body.tenant_id ?? "").trim();
    if (!tenantId) return jsonResponse({ error: "tenant_id obrigatório." }, 400);

    const { error } = await admin.from("tenant_ai_subscription").upsert(
      {
        tenant_id: tenantId,
        active: Boolean(body.active),
        monthly_token_quota: Math.max(0, Math.floor(Number(body.monthly_token_quota ?? 0))),
        overage_allowed: Boolean(body.overage_allowed),
        trial_ends_at: body.trial_ends_at ? new Date(String(body.trial_ends_at)).toISOString() : null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "tenant_id" },
    );
    if (error) return jsonResponse({ error: error.message }, 500);
    return jsonResponse({ ok: true });
  }

  return jsonResponse({ error: "Method not allowed." }, 405);
});
