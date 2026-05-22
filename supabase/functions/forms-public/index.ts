// Endpoint público dos formulários de Marketing (embed em sites externos).
//  GET  ?formId=<uuid>  -> config pública do form (variante A/B ponderada) + incrementa views
//  POST { formId, data, meta } -> registra a submissão (scoring + dedup + cria contato/negociação + enriquecimento async)
// Sem JWT (verify_jwt=false). Protegido por allowed_domains, honeypot e rate-limit.

import { handleCors, jsonResponse } from "../_shared/http.ts";
import { createAdminClient } from "../_shared/supabase.ts";
import {
  calculateLeadScore,
  fetchIpEnrichment,
  isPhoneValueValid,
  parseUserAgent,
  pickWeightedVariant,
} from "../_shared/marketing-forms.ts";
import { processPendingDispatches } from "../_shared/email.ts";

type FormFieldLike = { name: string; type: string; required?: boolean; label?: string };

const rateBuckets = new Map<string, number[]>();
const MAX_PER_MINUTE = 20;

function allowRate(key: string): boolean {
  const now = Date.now();
  const windowMs = 60_000;
  const previous = (rateBuckets.get(key) ?? []).filter((t) => now - t < windowMs);
  if (previous.length >= MAX_PER_MINUTE) return false;
  previous.push(now);
  rateBuckets.set(key, previous);
  return true;
}

function hostFromUrl(value: string | null): string | null {
  if (!value) return null;
  try {
    return new URL(value).host.toLowerCase();
  } catch {
    return null;
  }
}

function normalizeDomain(domain: string): string {
  return domain.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
}

function originAllowed(request: Request, allowed: unknown): boolean {
  const list = Array.isArray(allowed) ? allowed.map((d) => normalizeDomain(String(d))).filter(Boolean) : [];
  if (list.length === 0) return true;
  const host = hostFromUrl(request.headers.get("origin")) ?? hostFromUrl(request.headers.get("referer"));
  if (!host) return false;
  return list.some((domain) => host === domain || host.endsWith(`.${domain}`));
}

function clientIp(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "0.0.0.0";
}

function pickValue(data: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const v = data[key];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return "";
}

Deno.serve(async (request) => {
  const cors = handleCors(request);
  if (cors) return cors;

  const admin = createAdminClient();
  const url = new URL(request.url);

  // ---------------------------------------------------------------- GET: config
  if (request.method === "GET") {
    const formId = url.searchParams.get("formId") ?? url.searchParams.get("form");
    if (!formId) return jsonResponse({ error: "formId requerido" }, 400);

    const { data, error } = await admin
      .from("marketing_forms")
      .select("id, name, fields, settings, theme, submit_message, submit_redirect_url, is_active")
      .eq("id", formId)
      .maybeSingle();

    if (error) return jsonResponse({ error: error.message }, 500);
    if (!data || data.is_active !== true) {
      return jsonResponse({ error: "Formulário não encontrado ou indisponível." }, 404);
    }

    // Variantes A/B ativas: escolhe uma ponderada e conta a view dela
    let fields = data.fields ?? [];
    let theme = data.theme ?? {};
    let variantId: string | null = null;
    const { data: variants } = await admin
      .from("marketing_form_variants")
      .select("id, fields, theme, weight")
      .eq("form_id", formId)
      .eq("is_active", true);

    if (variants && variants.length > 0) {
      const chosen = pickWeightedVariant(variants as Array<{ id: string; weight: number | null }>);
      if (chosen) {
        const full = (variants as Array<Record<string, unknown>>).find((v) => v.id === chosen.id);
        variantId = chosen.id;
        if (full) {
          fields = full.fields ?? fields;
          theme = full.theme ?? theme;
        }
        admin.rpc("increment_marketing_variant_views", { p_variant_id: chosen.id }).then(() => {}, () => {});
      }
    }

    admin.rpc("increment_marketing_form_views", { p_form_id: formId }).then(() => {}, () => {});

    return jsonResponse({
      form: {
        id: data.id,
        name: data.name,
        fields,
        settings: data.settings ?? {},
        theme,
        submitMessage: data.submit_message ?? "Obrigado!",
        submitRedirectUrl: data.submit_redirect_url ?? null,
        variantId,
      },
    });
  }

  // ---------------------------------------------------------------- POST: submit
  if (request.method === "POST") {
    const ip = clientIp(request);
    const userAgent = request.headers.get("user-agent") ?? "";

    let body: Record<string, unknown>;
    try {
      body = (await request.json()) as Record<string, unknown>;
    } catch {
      return jsonResponse({ error: "JSON inválido" }, 400);
    }

    const formId = String(body.formId ?? body.form ?? "");
    if (!formId) return jsonResponse({ error: "formId requerido" }, 400);

    if (!allowRate(`${formId}:${ip}`)) {
      return jsonResponse({ error: "Muitas tentativas. Aguarde um minuto e tente novamente." }, 429);
    }

    const { data: form, error } = await admin
      .from("marketing_forms")
      .select("id, tenant_id, name, is_active, allowed_domains, fields, email_template_id, submit_message, submit_redirect_url")
      .eq("id", formId)
      .maybeSingle();

    if (error) return jsonResponse({ error: error.message }, 500);
    if (!form || form.is_active !== true) {
      return jsonResponse({ error: "Formulário não encontrado ou indisponível." }, 404);
    }
    if (!originAllowed(request, form.allowed_domains)) {
      return jsonResponse({ error: "Este site não está autorizado a enviar este formulário." }, 403);
    }

    const rawData = body.data && typeof body.data === "object" ? (body.data as Record<string, unknown>) : {};
    const rawMeta = body.meta && typeof body.meta === "object" ? (body.meta as Record<string, unknown>) : {};

    // honeypot
    if (rawData._hp || rawMeta._hp) {
      return jsonResponse({ success: true, message: form.submit_message ?? "Obrigado!" });
    }

    const cleanData: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(rawData)) {
      if (!key.startsWith("_")) cleanData[key] = value;
    }

    // --- Detecção de duplicado (cliente já existente no tenant) ---
    const email = pickValue(cleanData, ["email"]).toLowerCase();
    const phone = pickValue(cleanData, ["phone", "telefone", "celular", "whatsapp"]);
    const phoneDigits = phone.replace(/\D/g, "");
    let isDuplicate = false;
    if (form.tenant_id && (email || phoneDigits)) {
      let dupQuery = admin.from("customers").select("id").eq("tenant_id", form.tenant_id).limit(1);
      if (phoneDigits) {
        dupQuery = dupQuery.filter("telefone", "ilike", `%${phoneDigits.slice(-8)}%`);
      } else if (email) {
        dupQuery = dupQuery.ilike("email", email);
      }
      const { data: dup } = await dupQuery;
      isDuplicate = Array.isArray(dup) && dup.length > 0;
    }

    // --- Lead scoring ---
    const fields = (Array.isArray(form.fields) ? form.fields : []) as FormFieldLike[];
    const requiredFields = fields.filter((f) => f.required && f.type !== "hidden");
    const allRequiredFilled = requiredFields.every((f) => {
      const v = cleanData[f.name];
      return v !== undefined && v !== null && String(v).trim() !== "";
    });
    const filledCount = Object.values(cleanData).filter(
      (v) => v !== undefined && v !== null && String(v).trim() !== "",
    ).length;
    const ua = parseUserAgent(userAgent);
    const utmSource = typeof rawMeta.utm_source === "string" ? rawMeta.utm_source : "";
    const timeToComplete = Number(rawMeta.time_to_complete_seconds) || 0;

    const scoring = calculateLeadScore({
      data: cleanData,
      emailDomain: email ? email.split("@")[1] ?? "" : "",
      phoneValid: isPhoneValueValid(phone),
      timeToCompleteSeconds: timeToComplete,
      deviceType: ua.deviceType,
      isVPN: false,
      isProxy: false,
      allRequiredFieldsFilled: allRequiredFilled,
      isDuplicate,
      hasUtmSource: !!utmSource,
      fieldsFilledCount: filledCount,
      totalFieldsCount: fields.length,
    });

    const meta: Record<string, unknown> = { ...rawMeta };
    delete meta._hp;
    meta.ip_address = ip;
    meta.user_agent = userAgent;
    meta.score = scoring.score;
    meta.score_factors = scoring.factors;
    meta.is_duplicate = isDuplicate;

    const { data: negotiationId, error: rpcError } = await admin.rpc("submit_marketing_form", {
      p_form_id: formId,
      p_data: cleanData,
      p_meta: meta,
    });

    if (rpcError) {
      console.error("[forms-public] submit error:", rpcError.message);
      return jsonResponse({ error: "Não foi possível enviar no momento. Tente novamente." }, 500);
    }

    // Conta submissão da variante A/B
    const variantId = typeof rawMeta.variant_id === "string" ? rawMeta.variant_id : null;
    if (variantId) {
      admin.rpc("increment_marketing_variant_submissions", { p_variant_id: variantId }).then(() => {}, () => {});
    }

    // E-mail transacional (lead recebido) se o form tiver template e o lead tiver e-mail
    if (negotiationId && form.email_template_id && email) {
      void (async () => {
        try {
          const { data: tpl } = await admin
            .from("marketing_email_templates")
            .select("id, subject, blocks, from_name, from_email, reply_to")
            .eq("id", form.email_template_id)
            .maybeSingle();
          if (!tpl) return;

          const variables: Record<string, string> = {};
          for (const [k, v] of Object.entries(cleanData)) {
            if (v != null) variables[k] = String(v);
          }
          variables.email = email;
          variables.name = String(cleanData.name ?? cleanData.nome ?? "Lead");
          variables.form_name = String(form.name ?? "");
          variables.created_at = new Date().toISOString();
          if (tpl.from_name) variables.from_name = String(tpl.from_name);
          if (tpl.from_email) variables.from_email = String(tpl.from_email);
          if (tpl.reply_to) variables.reply_to = String(tpl.reply_to);

          await admin.from("marketing_email_dispatches").upsert(
            {
              tenant_id: form.tenant_id,
              negotiation_id: negotiationId,
              template_id: tpl.id,
              trigger_type: "lead_received",
              email_type: "transactional",
              recipient_email: email,
              subject: tpl.subject || `Recebemos seu contato — ${form.name ?? ""}`,
              blocks: tpl.blocks ?? [],
              variables,
              idempotency_key: `lead_received:${negotiationId}:${email}:${tpl.id}`,
            },
            { onConflict: "idempotency_key", ignoreDuplicates: true },
          );

          await processPendingDispatches(admin, { tenantId: form.tenant_id, limit: 5 });
        } catch (e) {
          console.error("[forms-public] email enqueue error:", e);
        }
      })();
    }

    // Consentimentos LGPD: campos checkbox/radio que parecem termo/consentimento
    if (negotiationId && form.tenant_id) {
      const consentRows = fields
        .filter((f) => {
          if (f.type !== "checkbox" && f.type !== "radio") return false;
          const combined = `${f.name} ${f.label ?? ""}`.toLowerCase();
          return /consent|termo|lgpd|autoriz|aceito/.test(combined);
        })
        .map((f) => {
          const v = rawData[f.name];
          const granted = Array.isArray(v) ? v.length > 0 : v != null && String(v).trim() !== "";
          return granted
            ? {
                tenant_id: form.tenant_id,
                negotiation_id: negotiationId,
                form_id: formId,
                consent_key: f.name,
                consent_text: f.label ?? null,
                granted: true,
                ip_address: ip,
                user_agent: userAgent,
              }
            : null;
        })
        .filter((r): r is NonNullable<typeof r> => r !== null);
      if (consentRows.length > 0) {
        admin.from("marketing_lead_consents").insert(consentRows).then(() => {}, () => {});
      }
    }

    // Enriquecimento de IP/dispositivo (async, não bloqueia a resposta)
    if (negotiationId) {
      void (async () => {
        try {
          const enrichment = await fetchIpEnrichment(ip);
          await admin
            .from("crm_negotiation_marketing")
            .update({
              city: enrichment?.city ?? null,
              region: enrichment?.region ?? null,
              country: enrichment?.country ?? null,
              country_code: enrichment?.countryCode ?? null,
              latitude: enrichment?.latitude ?? null,
              longitude: enrichment?.longitude ?? null,
              timezone: enrichment?.timezone ?? null,
              isp: enrichment?.isp ?? null,
              org: enrichment?.org ?? null,
              is_vpn: enrichment?.isVpn ?? false,
              is_proxy: enrichment?.isProxy ?? false,
              is_hosting: enrichment?.isHosting ?? false,
              browser: ua.browser,
              browser_version: ua.browserVersion,
              os: ua.os,
              device_type: ua.deviceType,
              is_mobile: ua.isMobile,
              enriched_at: new Date().toISOString(),
            })
            .eq("negotiation_id", negotiationId);
        } catch (e) {
          console.error("[forms-public] enrichment error:", e);
        }
      })();
    }

    return jsonResponse({
      success: true,
      message: form.submit_message ?? "Obrigado!",
      redirect_url: form.submit_redirect_url ?? null,
      lead_id: negotiationId,
    });
  }

  return jsonResponse({ error: "Método não suportado" }, 405);
});
