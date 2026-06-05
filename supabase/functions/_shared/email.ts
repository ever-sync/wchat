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

export async function sendViaResend(input: {
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

function resolvePublicAppUrl(): string {
  const candidates = [
    Deno.env.get("APP_SITE_URL"),
    Deno.env.get("PUBLIC_APP_URL"),
    Deno.env.get("VITE_APP_URL"),
  ];

  for (const candidate of candidates) {
    if (!candidate?.trim()) continue;
    try {
      const parsed = new URL(candidate.trim());
      if (parsed.protocol === "http:" || parsed.protocol === "https:") {
        return parsed.origin.replace(/\/+$/, "");
      }
    } catch {
      // ignore
    }
  }

  return "http://localhost:8080";
}

function renderWelcomeEmailHtml(input: {
  name: string;
  company: string | null;
  appUrl: string;
}): string {
  const greeting = input.name || "Olá";
  const company = input.company?.trim() ? input.company.trim() : "sua operação";
  const inboxUrl = `${input.appUrl}/inbox`;
  const aiUrl = `${input.appUrl}/agente-ia`;
  const configUrl = `${input.appUrl}/configuracoes`;

  return `<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
  </head>
  <body style="margin:0;padding:0;background:#f3f4f6;">
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
      <tr>
        <td align="center" style="padding:32px 12px;">
          <table width="600" cellpadding="0" cellspacing="0" role="presentation" style="max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;font-family:Arial,sans-serif;color:#111827;box-shadow:0 4px 20px rgba(0,0,0,0.08);">
            <tr>
              <td style="padding:32px 32px 20px;background:linear-gradient(135deg,#4f46e5,#6d28d9);color:#ffffff;">
                <div style="font-size:13px;letter-spacing:0.12em;text-transform:uppercase;opacity:0.85;">WChat</div>
                <h1 style="margin:8px 0 0;font-size:30px;line-height:1.2;">Bem-vindo, ${greeting}!</h1>
                <p style="margin:12px 0 0;font-size:16px;line-height:1.6;opacity:0.95;">Sua conta está pronta para operar ${company} com WhatsApp, IA e CRM no mesmo lugar.</p>
              </td>
            </tr>
            <tr>
              <td style="padding:28px 32px 12px;font-size:16px;line-height:1.7;">
                <p style="margin:0 0 16px;">Aqui vai um caminho rápido para começar bem:</p>
                <ol style="margin:0 0 20px;padding-left:22px;">
                  <li style="margin-bottom:10px;">Abra a caixa de entrada e veja as conversas chegando.</li>
                  <li style="margin-bottom:10px;">Conecte seu WhatsApp e organize os canais.</li>
                  <li style="margin-bottom:10px;">Ajuste a IA para responder no seu tom.</li>
                </ol>
                <table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0;">
                  <tr>
                    <td style="padding-right:12px;">
                      <a href="${inboxUrl}" style="display:inline-block;background:#4f46e5;color:#ffffff;text-decoration:none;padding:12px 18px;border-radius:10px;font-weight:bold;">Abrir inbox</a>
                    </td>
                    <td style="padding-right:12px;">
                      <a href="${aiUrl}" style="display:inline-block;background:#ede9fe;color:#5b21b6;text-decoration:none;padding:12px 18px;border-radius:10px;font-weight:bold;">Configurar IA</a>
                    </td>
                    <td>
                      <a href="${configUrl}" style="display:inline-block;background:#f3f4f6;color:#111827;text-decoration:none;padding:12px 18px;border-radius:10px;font-weight:bold;">Acessar configurações</a>
                    </td>
                  </tr>
                </table>
                <p style="margin:0 0 10px;color:#374151;">Se precisar recuperar acesso depois, use a tela de login para pedir redefinição de senha.</p>
              </td>
            </tr>
            <tr>
              <td style="padding:0 32px 30px;font-size:13px;line-height:1.6;color:#6b7280;">
                Se este acesso não parece seu, entre em contato com a equipe da plataforma.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function renderWelcomeEmailText(input: { name: string; company: string | null; appUrl: string }): string {
  const greeting = input.name || "Olá";
  const company = input.company?.trim() ? input.company.trim() : "sua operação";
  return [
    `Bem-vindo, ${greeting}!`,
    "",
    `Sua conta está pronta para operar ${company} com WhatsApp, IA e CRM no mesmo lugar.`,
    "",
    "Primeiros passos:",
    "1. Abra a caixa de entrada e veja as conversas chegando.",
    "2. Conecte seu WhatsApp e organize os canais.",
    "3. Ajuste a IA para responder no seu tom.",
    "",
    `Inbox: ${input.appUrl}/inbox`,
    `IA: ${input.appUrl}/agente-ia`,
    `Configurações: ${input.appUrl}/configuracoes`,
    "",
    "Se precisar recuperar acesso depois, use a tela de login para pedir redefinição de senha.",
  ].join("\n");
}

export interface WelcomeDispatchResult {
  processed: number;
  sent: number;
  failed: number;
  skipped: number;
}

export async function processWelcomeDispatches(
  admin: SupabaseClient,
  opts: { tenantId?: string | null; limit?: number } = {},
): Promise<WelcomeDispatchResult> {
  const limit = opts.limit ?? 50;
  let query = admin
    .from("welcome_email_dispatches")
    .select("*")
    .in("status", ["queued", "retrying"])
    .lte("next_attempt_at", new Date().toISOString())
    .order("next_attempt_at", { ascending: true })
    .limit(limit);
  if (opts.tenantId) query = query.eq("tenant_id", opts.tenantId);

  const { data: rows, error } = await query;
  if (error) throw new Error(error.message);

  const result: WelcomeDispatchResult = { processed: 0, sent: 0, failed: 0, skipped: 0 };
  const fromCache = new Map<string, { name: string; email: string; replyTo: string | null } | null>();
  const appUrl = resolvePublicAppUrl();

  for (const row of rows ?? []) {
    const d = row as Record<string, unknown>;
    const id = String(d.id);
    const tenantId = String(d.tenant_id);
    const recipient = String(d.recipient_email);
    result.processed++;

    const attempts = Number(d.attempts ?? 0) + 1;
    const maxAttempts = Number(d.max_attempts ?? 3);
    const from = await resolveFrom(admin, tenantId, {}, fromCache);

    if (!from) {
      await admin
        .from("welcome_email_dispatches")
        .update({
          status: "failed",
          attempts,
          last_attempt_at: new Date().toISOString(),
          error: "Remetente não configurado (tenant_email_settings ou MARKETING_EMAIL_FROM)",
        })
        .eq("id", id);
      result.failed++;
      continue;
    }

    try {
      const sent = await sendViaResend({
        to: recipient,
        fromName: from.name,
        fromEmail: from.email,
        replyTo: from.replyTo,
        subject: "Bem-vindo ao WChat",
        html: renderWelcomeEmailHtml({
          name: String(d.recipient_name ?? ""),
          company: (d.company == null ? null : String(d.company)) ?? null,
          appUrl,
        }),
        text: renderWelcomeEmailText({
          name: String(d.recipient_name ?? ""),
          company: (d.company == null ? null : String(d.company)) ?? null,
          appUrl,
        }),
      });

      await admin
        .from("welcome_email_dispatches")
        .update({
          status: "sent",
          attempts,
          last_attempt_at: new Date().toISOString(),
          sent_at: new Date().toISOString(),
          error: null,
          provider_message_id: sent.messageId,
          response: sent.raw,
        })
        .eq("id", id);
      result.sent++;
    } catch (e) {
      const message = e instanceof Error ? e.message : "Falha no envio";
      const willRetry = attempts < maxAttempts;
      await admin
        .from("welcome_email_dispatches")
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
      if (!willRetry) result.failed++;
    }
  }

  return result;
}
