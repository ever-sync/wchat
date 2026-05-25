// Dispatcher de webhooks de saída (webhook_deliveries).
//  - Cron/interno (x-cron-secret): drena a fila de TODOS os tenants.
//  - App (admin) Bearer JWT:
//      body { webhook_id }  => envia um "ping" de teste síncrono p/ aquele webhook.
//      body vazio/{}        => drena a fila apenas do tenant do usuário ("processar agora").
import { handleCors, jsonResponse } from "../_shared/http.ts";
import {
  createAdminClient,
  isInternalRequest,
  requireTenantContext,
  requireTenantPermission,
} from "../_shared/supabase.ts";

const MAX_BATCH = 50;
const TIMEOUT_MS = 10_000;

async function hmacSha256Hex(secret: string, body: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(body));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function postSigned(url: string, secret: string, event: string, deliveryId: string, body: string) {
  const signature = await hmacSha256Hex(secret, body);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-WChat-Event": event,
        "X-WChat-Delivery": deliveryId,
        "X-WChat-Signature": `sha256=${signature}`,
      },
      body,
      signal: controller.signal,
    });
    return { ok: res.ok, status: res.status, error: res.ok ? null : `HTTP ${res.status}` };
  } catch (e) {
    return { ok: false, status: null as number | null, error: e instanceof Error ? e.message : "erro de rede" };
  } finally {
    clearTimeout(timer);
  }
}

type DeliveryRow = {
  id: string;
  tenant_id: string;
  event: string;
  payload: unknown;
  attempts: number;
  max_attempts: number;
  webhooks: { url: string; secret: string; active: boolean } | null;
};

async function processBatch(
  admin: ReturnType<typeof createAdminClient>,
  opts: { tenantId?: string } = {},
) {
  const nowIso = new Date().toISOString();
  let query = admin
    .from("webhook_deliveries")
    .select("id, tenant_id, event, payload, attempts, max_attempts, webhooks(url, secret, active)")
    .eq("status", "pending")
    .lte("next_attempt_at", nowIso)
    .order("next_attempt_at", { ascending: true })
    .limit(MAX_BATCH);
  if (opts.tenantId) query = query.eq("tenant_id", opts.tenantId);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  const rows = (data ?? []) as unknown as DeliveryRow[];
  if (rows.length === 0) return { processed: 0, success: 0, failed: 0 };

  // Claim: empurra next_attempt_at p/ frente p/ evitar pega dupla por execução concorrente.
  const ids = rows.map((r) => r.id);
  await admin
    .from("webhook_deliveries")
    .update({ next_attempt_at: new Date(Date.now() + 120_000).toISOString() })
    .in("id", ids)
    .eq("status", "pending");

  let success = 0;
  let failed = 0;

  for (const row of rows) {
    const webhook = row.webhooks;
    if (!webhook || !webhook.active) {
      await admin
        .from("webhook_deliveries")
        .update({ status: "error", last_error: "webhook inativo ou removido", attempts: row.attempts + 1 })
        .eq("id", row.id);
      failed++;
      continue;
    }

    const body = JSON.stringify(row.payload);
    const result = await postSigned(webhook.url, webhook.secret, row.event, row.id, body);

    if (result.ok) {
      await admin
        .from("webhook_deliveries")
        .update({
          status: "success",
          attempts: row.attempts + 1,
          response_status: result.status,
          delivered_at: new Date().toISOString(),
          last_error: null,
        })
        .eq("id", row.id);
      success++;
    } else {
      const attempts = row.attempts + 1;
      const exhausted = attempts >= row.max_attempts;
      const backoffSec = Math.min(attempts * attempts * 30, 3600);
      await admin
        .from("webhook_deliveries")
        .update({
          status: exhausted ? "error" : "pending",
          attempts,
          response_status: result.status,
          last_error: result.error,
          next_attempt_at: new Date(Date.now() + backoffSec * 1000).toISOString(),
        })
        .eq("id", row.id);
      failed++;
    }
  }

  return { processed: rows.length, success, failed };
}

Deno.serve(async (request) => {
  const cors = handleCors(request);
  if (cors) return cors;

  try {
    if (isInternalRequest(request)) {
      const admin = createAdminClient();
      const result = await processBatch(admin);
      return jsonResponse({ ok: true, scope: "all", ...result });
    }

    // App: precisa permissão de configuração (gerir/testar webhooks).
    const ctx = await requireTenantPermission(request, "configuracoes", "edit");

    let payload: Record<string, unknown> = {};
    try {
      payload = await request.json();
    } catch {
      payload = {};
    }

    const webhookId = typeof payload.webhook_id === "string" ? payload.webhook_id : null;
    if (webhookId) {
      const { data: webhook, error } = await ctx.admin
        .from("webhooks")
        .select("id, url, secret, active")
        .eq("id", webhookId)
        .eq("tenant_id", ctx.tenantId)
        .maybeSingle();
      if (error) throw new Error(error.message);
      if (!webhook) return jsonResponse({ error: "Webhook não encontrado" }, 404);

      const body = JSON.stringify({
        event: "ping",
        tenant_id: ctx.tenantId,
        occurred_at: new Date().toISOString(),
        data: { message: "Teste de webhook do WChat" },
      });
      const result = await postSigned(webhook.url as string, webhook.secret as string, "ping", "test", body);
      return jsonResponse({ ok: result.ok, status: result.status, error: result.error });
    }

    const result = await processBatch(ctx.admin, { tenantId: ctx.tenantId });
    return jsonResponse({ ok: true, scope: "tenant", ...result });
  } catch (e) {
    return jsonResponse({ error: e instanceof Error ? e.message : "Erro no dispatcher de webhooks" }, 400);
  }
});
