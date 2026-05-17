import { escapeIlikeLiteralForPostgrest } from "../_shared/ilike-literal.ts";
import { handleCors, jsonResponse } from "../_shared/http.ts";
import { createAdminClient, requireTenantContext } from "../_shared/supabase.ts";

const allowedRoles = new Set(["admin", "operacao", "financeiro", "atendimento"]);

type InviteEmailPayload = {
  email: string;
  nome: string;
  empresa: string | null;
  tenantId: string;
  role: string;
  appUrl?: string;
};

type SendInviteEmailResult = {
  emailSent: boolean;
  warning: string | null;
};

function normalizePublicOrigin(raw: string | null | undefined) {
  if (!raw?.trim()) {
    return null;
  }

  try {
    const parsed = new URL(raw.trim());
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return null;
    }

    return parsed.origin.replace(/\/+$/, "");
  } catch {
    return null;
  }
}

function resolveAppUrl(request: Request, bodyAppUrl?: unknown) {
  const envCandidates = [
    Deno.env.get("APP_SITE_URL"),
    Deno.env.get("PUBLIC_APP_URL"),
    Deno.env.get("VITE_APP_URL"),
  ];

  for (const candidate of envCandidates) {
    const normalized = normalizePublicOrigin(candidate);
    if (normalized) {
      return normalized;
    }
  }

  const origin = normalizePublicOrigin(request.headers.get("origin"));
  const fromBody = normalizePublicOrigin(typeof bodyAppUrl === "string" ? bodyAppUrl : null);

  if (fromBody) {
    if (origin && fromBody !== origin) {
      throw new Error("URL publica do app nao confere com a origem da requisicao.");
    }

    return fromBody;
  }

  const referer = request.headers.get("referer");
  const fromReferer = referer ? normalizePublicOrigin(referer) : null;
  if (fromReferer) {
    return fromReferer;
  }

  if (origin) {
    return origin;
  }

  const forwardedHost = request.headers.get("x-forwarded-host");
  if (forwardedHost?.trim()) {
    const forwardedProto = request.headers.get("x-forwarded-proto")?.trim() || "https";
    return normalizePublicOrigin(`${forwardedProto}://${forwardedHost.trim()}`);
  }

  throw new Error(
    "Nao foi possivel resolver a URL publica do app para o convite. Defina APP_SITE_URL nos secrets da Edge Function.",
  );
}

async function sendInviteEmail(
  service: ReturnType<typeof createAdminClient>,
  request: Request,
  payload: InviteEmailPayload,
): Promise<SendInviteEmailResult> {
  const redirectTo = `${resolveAppUrl(request, payload.appUrl)}/ativar-acesso`;
  const { error: inviteError } = await service.auth.admin.inviteUserByEmail(payload.email, {
    redirectTo,
    data: {
      nome: payload.nome,
      empresa: payload.empresa,
      tenant_id: payload.tenantId,
      role: payload.role,
      plano: "colaborador",
    },
  });

  if (!inviteError) {
    return { emailSent: true, warning: null };
  }

  const message = inviteError.message.toLowerCase();
  const isEmailLimit = message.includes("email rate limit exceeded") || message.includes("rate limit");

  if (isEmailLimit) {
    return {
      emailSent: false,
      warning:
        "Limite de envio de e-mails do Supabase atingido. Aguarde alguns minutos e use Reenviar e-mail no convite pendente.",
    };
  }

  const alreadyExists =
    message.includes("already been registered") ||
    message.includes("already registered") ||
    message.includes("user already registered");

  if (alreadyExists) {
    return {
      emailSent: false,
      warning:
        "Este e-mail ja possui conta. Peça para usar Recuperar senha na tela de login ou confira a caixa de spam do convite anterior.",
    };
  }

  if (message.includes("database error saving new user")) {
    throw new Error(
      "Falha ao criar o usuario no banco (trigger de cadastro). Aplique a migration 20260517123000_fix_invite_user_creation_trigger.sql no Supabase e tente novamente.",
    );
  }

  throw new Error(inviteError.message);
}

Deno.serve(async (request) => {
  const corsResponse = handleCors(request);
  if (corsResponse) {
    return corsResponse;
  }

  if (request.method !== "POST") {
    return jsonResponse({ error: "Method not allowed." }, 405);
  }

  try {
    const { admin, tenantId, userId } = await requireTenantContext(request);
    const body = await request.json().catch(() => ({}));
    const nome = String(body.nome ?? "").trim();
    const email = String(body.email ?? "").trim().toLowerCase();
    const role = String(body.role ?? "operacao").trim().toLowerCase();
    const resend = body.resend === true;

    if (!nome || !email) {
      throw new Error("nome e email sao obrigatorios.");
    }

    if (!allowedRoles.has(role)) {
      throw new Error("role invalido.");
    }

    const { data: inviterProfile, error: inviterError } = await admin
      .from("profiles")
      .select("nome, empresa, role")
      .eq("id", userId)
      .single();

    if (inviterError || !inviterProfile) {
      throw new Error("Nao foi possivel validar o perfil do usuario atual.");
    }

    if (inviterProfile.role !== "admin") {
      throw new Error("Somente administradores podem criar acessos de colaboradores.");
    }

    const service = createAdminClient();
    const { data: existingProfile } = await service
      .from("profiles")
      .select("id, tenant_id, email")
      .ilike("email", escapeIlikeLiteralForPostgrest(email))
      .maybeSingle();
    const { data: existingInvite } = await service
      .from("collaborator_invites")
      .select("id, status")
      .eq("tenant_id", tenantId)
      .eq("email", email)
      .maybeSingle();

    if (existingProfile?.tenant_id && existingProfile.tenant_id !== tenantId) {
      throw new Error("Esse email ja esta associado a outro tenant.");
    }

    const { error: inviteUpsertError } = await service
      .from("collaborator_invites")
      .upsert(
        {
          tenant_id: tenantId,
          email,
          nome,
          role,
          status: existingProfile ? "accepted" : "pending",
          invited_by: userId,
          auth_user_id: existingProfile?.id ?? null,
          accepted_at: existingProfile ? new Date().toISOString() : null,
        },
        { onConflict: "tenant_id,email" },
      );

    if (inviteUpsertError) {
      throw new Error(inviteUpsertError.message);
    }

    let emailSent = false;
    let inviteWarning: string | null = null;

    if (existingProfile?.id) {
      const { error: profileUpdateError } = await service
        .from("profiles")
        .update({
          tenant_id: tenantId,
          nome,
          empresa: inviterProfile.empresa,
          role,
          status: "active",
        })
        .eq("id", existingProfile.id);

      if (profileUpdateError) {
        throw new Error(profileUpdateError.message);
      }
    } else {
      const shouldSendEmail = resend || existingInvite?.status !== "pending";

      if (shouldSendEmail) {
        const sendResult = await sendInviteEmail(service, request, {
          email,
          nome,
          empresa: inviterProfile.empresa,
          tenantId,
          role,
          appUrl: typeof body.appUrl === "string" ? body.appUrl : undefined,
        });
        emailSent = sendResult.emailSent;
        inviteWarning = sendResult.warning;
      } else {
        inviteWarning = "Este convite ja existia e o e-mail nao foi reenviado. Use Reenviar e-mail.";
      }
    }

    const { data: invite, error: inviteLoadError } = await service
      .from("collaborator_invites")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("email", email)
      .single();

    if (inviteLoadError || !invite) {
      throw new Error(inviteLoadError?.message ?? "Nao foi possivel carregar o convite criado.");
    }

    return jsonResponse({
      invite,
      emailSent,
      warning: inviteWarning,
    });
  } catch (error) {
    return jsonResponse(
      { error: error instanceof Error ? error.message : "Unexpected error." },
      400,
    );
  }
});
