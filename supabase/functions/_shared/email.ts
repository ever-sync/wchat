// Render de e-mail por blocos + envio via Resend + processamento da fila.
// Portado de formularios/lib/services/email/{render,providers/resend,dispatcher}.ts para Deno.
import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.49.8";

export interface EmailBlock {
  id?: string;
  type: "header" | "text" | "image" | "button" | "divider" | "footer";
  content?: string;
  logoUrl?: string;
  backgroundColor?: string;
  src?: string;
  alt?: string;
  label?: string;
  url?: string;
  color?: string;
  unsubscribeUrl?: string;
  dividerColor?: string;
  dividerThickness?: number;
  dividerMargin?: number;
}

/** Sanitização leve (sem sanitize-html): remove scripts/handlers/js: urls. */
function sanitize(html: string): string {
  return String(html ?? "")
    .replace(/<\s*\/?\s*(script|style|iframe|object|embed)[^>]*>/gi, "")
    .replace(/\son\w+\s*=\s*"[^"]*"/gi, "")
    .replace(/\son\w+\s*=\s*'[^']*'/gi, "")
    .replace(/javascript:/gi, "");
}

export function replaceTemplateVariables(text: string, variables: Record<string, string>): string {
  return String(text ?? "").replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, key) => variables[key] ?? "");
}

function renderBlock(block: EmailBlock, vars: Record<string, string>): string {
  switch (block.type) {
    case "header":
      return `<div style="background:${block.backgroundColor || "#111827"};padding:24px;text-align:center;">${block.logoUrl ? `<img src="${sanitize(block.logoUrl)}" height="40" alt="logo"/>` : ""}</div>`;
    case "text":
      return `<div style="padding:24px;font-family:Arial,sans-serif;font-size:16px;color:#111827;line-height:1.6;">${sanitize(replaceTemplateVariables(block.content || "", vars))}</div>`;
    case "button":
      return `<div style="padding:16px;text-align:center;"><a href="${replaceTemplateVariables(block.url || "#", vars)}" style="background:${block.color || "#4f46e5"};color:#ffffff;padding:12px 24px;border-radius:8px;text-decoration:none;font-family:Arial,sans-serif;font-weight:600;display:inline-block;">${sanitize(replaceTemplateVariables(block.label || "Clique aqui", vars))}</a></div>`;
    case "image":
      return `<div style="padding:16px;text-align:center;"><img src="${sanitize(block.src || "")}" alt="${sanitize(block.alt || "")}" style="max-width:100%;border-radius:8px;"/></div>`;
    case "divider": {
      const c = block.dividerColor || "#e5e7eb";
      const th = block.dividerThickness ?? 1;
      const m = block.dividerMargin ?? 8;
      return `<hr style="border:none;border-top:${th}px solid ${c};margin:${m}px 24px;"/>`;
    }
    case "footer":
      return `<div style="padding:24px;text-align:center;font-size:12px;color:#6b7280;font-family:Arial,sans-serif;">${sanitize(replaceTemplateVariables(block.content || "", vars))}${block.unsubscribeUrl ? `<br/><a href="${replaceTemplateVariables(block.unsubscribeUrl, vars)}" style="color:#6b7280;">Descadastrar</a>` : ""}</div>`;
    default:
      return "";
  }
}

function wrapInLayout(content: string): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head><body style="margin:0;padding:0;background:#f3f4f6;"><table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 12px;"><table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);"><tr><td>${content}</td></tr></table></td></tr></table></body></html>`;
}

export function renderEmailBlocks(blocks: EmailBlock[], variables: Record<string, string>): string {
  return wrapInLayout((blocks ?? []).map((b) => renderBlock(b, variables)).join("\n"));
}

export function renderBlocksAsText(blocks: EmailBlock[], variables: Record<string, string>): string {
  return (blocks ?? [])
    .map((b) => {
      if (b.type === "text" || b.type === "footer") return replaceTemplateVariables(b.content || "", variables);
      if (b.type === "button") return `${replaceTemplateVariables(b.label || "Clique aqui", variables)}: ${replaceTemplateVariables(b.url || "", variables)}`;
      return "";
    })
    .filter(Boolean)
    .join("\n\n");
}

interface ResendResult {
  messageId: string | null;
  raw: unknown;
}

async function sendViaResend(input: {
  to: string;
  fromName: string;
  fromEmail: string;
  replyTo?: string | null;
  subject: string;
  html: string;
  text: string;
}): Promise<ResendResult> {
  const apiKey = Deno.env.get("RESEND_API_KEY");
  if (!apiKey) throw new Error("RESEND_API_KEY ausente");

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: `${input.fromName} <${input.fromEmail}>`,
      to: [input.to],
      subject: input.subject,
      html: input.html,
      text: input.text,
      reply_to: input.replyTo ?? undefined,
    }),
  });

  const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) {
    const err = (json.error as { message?: string } | undefined)?.message ?? `Resend HTTP ${res.status}`;
    throw new Error(err);
  }
  return { messageId: (json.id as string) ?? ((json.data as { id?: string })?.id ?? null), raw: json };
}

function backoffMinutes(attempt: number): number {
  return Math.min(60, attempt * attempt * 5); // 5, 20, 45, 60...
}

/** Resolve remetente: variáveis do dispatch -> settings do tenant -> env. */
async function resolveFrom(
  admin: SupabaseClient,
  tenantId: string,
  variables: Record<string, string>,
  cache: Map<string, { name: string; email: string; replyTo: string | null } | null>,
): Promise<{ name: string; email: string; replyTo: string | null } | null> {
  if (variables.from_email) {
    return {
      name: variables.from_name || "Equipe",
      email: variables.from_email,
      replyTo: variables.reply_to ?? null,
    };
  }
  if (!cache.has(tenantId)) {
    const { data } = await admin
      .from("tenant_email_settings")
      .select("default_from_name, default_from_email, default_reply_to, email_enabled")
      .eq("tenant_id", tenantId)
      .maybeSingle();
    if (data && data.email_enabled !== false && data.default_from_email) {
      cache.set(tenantId, {
        name: data.default_from_name || "Equipe",
        email: data.default_from_email,
        replyTo: data.default_reply_to ?? null,
      });
    } else {
      const envFrom = Deno.env.get("MARKETING_EMAIL_FROM"); // "Nome <email@dominio>"
      if (envFrom) {
        const m = envFrom.match(/^\s*(.*?)\s*<([^>]+)>\s*$/);
        cache.set(tenantId, m ? { name: m[1] || "Equipe", email: m[2], replyTo: null } : { name: "Equipe", email: envFrom, replyTo: null });
      } else {
        cache.set(tenantId, null);
      }
    }
  }
  return cache.get(tenantId) ?? null;
}

export interface ProcessResult {
  processed: number;
  sent: number;
  failed: number;
  skipped: number;
}

/** Processa a fila de dispatches pendentes (queued/retrying com next_attempt vencido). */
export async function processPendingDispatches(
  admin: SupabaseClient,
  opts: { tenantId?: string | null; limit?: number } = {},
): Promise<ProcessResult> {
  const limit = opts.limit ?? 25;
  let query = admin
    .from("marketing_email_dispatches")
    .select("*")
    .in("status", ["queued", "retrying"])
    .lte("next_attempt_at", new Date().toISOString())
    .order("next_attempt_at", { ascending: true })
    .limit(limit);
  if (opts.tenantId) query = query.eq("tenant_id", opts.tenantId);

  const { data: rows, error } = await query;
  if (error) throw new Error(error.message);

  const result: ProcessResult = { processed: 0, sent: 0, failed: 0, skipped: 0 };
  const fromCache = new Map<string, { name: string; email: string; replyTo: string | null } | null>();

  for (const row of rows ?? []) {
    const d = row as Record<string, unknown>;
    const id = String(d.id);
    const tenantId = String(d.tenant_id);
    const recipient = String(d.recipient_email);
    result.processed++;

    // suppression
    const { data: suppressed } = await admin
      .from("marketing_email_suppressions")
      .select("id")
      .eq("tenant_id", tenantId)
      .eq("email", recipient.toLowerCase())
      .eq("is_active", true)
      .limit(1);
    if (Array.isArray(suppressed) && suppressed.length > 0) {
      await admin.from("marketing_email_dispatches").update({ status: "skipped", error: "Destinatário na lista de supressão" }).eq("id", id);
      result.skipped++;
      continue;
    }

    const variables = (d.variables as Record<string, string>) ?? {};
    const from = await resolveFrom(admin, tenantId, variables, fromCache);
    const attempts = Number(d.attempts ?? 0) + 1;
    const maxAttempts = Number(d.max_attempts ?? 5);

    if (!from) {
      await admin
        .from("marketing_email_dispatches")
        .update({ status: "failed", attempts, last_attempt_at: new Date().toISOString(), error: "Remetente não configurado (tenant_email_settings ou MARKETING_EMAIL_FROM)" })
        .eq("id", id);
      result.failed++;
      continue;
    }

    try {
      const blocks = (d.blocks as EmailBlock[]) ?? [];
      const sent = await sendViaResend({
        to: recipient,
        fromName: from.name,
        fromEmail: from.email,
        replyTo: from.replyTo,
        subject: replaceTemplateVariables(String(d.subject ?? ""), variables),
        html: renderEmailBlocks(blocks, variables),
        text: renderBlocksAsText(blocks, variables),
      });
      await admin
        .from("marketing_email_dispatches")
        .update({
          status: "sent",
          attempts,
          last_attempt_at: new Date().toISOString(),
          sent_at: new Date().toISOString(),
          provider_message_id: sent.messageId,
          response: sent.raw,
          error: null,
        })
        .eq("id", id);
      result.sent++;
    } catch (e) {
      const message = e instanceof Error ? e.message : "Falha no envio";
      const willRetry = attempts < maxAttempts;
      await admin
        .from("marketing_email_dispatches")
        .update({
          status: willRetry ? "retrying" : "failed",
          attempts,
          last_attempt_at: new Date().toISOString(),
          next_attempt_at: willRetry
            ? new Date(Date.now() + backoffMinutes(attempts) * 60_000).toISOString()
            : new Date().toISOString(),
          error: message,
        })
        .eq("id", id);
      if (willRetry) result.processed += 0;
      else result.failed++;
    }
  }

  return result;
}
