import { escapeIlikeLiteralForPostgrest } from "../_shared/ilike-literal.ts";
import { handleCors, jsonResponse } from "../_shared/http.ts";
import { createAdminClient, requireTenantContext } from "../_shared/supabase.ts";

const allowedRoles = new Set(["admin", "operacao", "financeiro", "atendimento"]);

function resolveAppUrl(request: Request) {
  const envUrl =
    Deno.env.get("APP_SITE_URL") ??
    Deno.env.get("PUBLIC_APP_URL") ??
    Deno.env.get("VITE_APP_URL");

  if (envUrl?.trim()) {
    return envUrl.trim().replace(/\/+$/, "");
  }

  const forwardedHost = request.headers.get("x-forwarded-host");
  if (forwardedHost?.trim()) {
    const forwardedProto = request.headers.get("x-forwarded-proto")?.trim() || "https";
    return `${forwardedProto}://${forwardedHost.trim()}`.replace(/\/+$/, "");
  }

  const origin = request.headers.get("origin");
  if (origin?.trim()) {
    return origin.trim().replace(/\/+$/, "");
  }

  throw new Error("Nao foi possivel resolver a URL publica do app para o convite.");
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

    await service
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
      if (existingInvite?.status !== "pending") {
        const redirectTo = `${resolveAppUrl(request)}/ativar-acesso`;
        const { error: inviteError } = await service.auth.admin.inviteUserByEmail(email, {
          redirectTo,
          data: {
            nome,
            empresa: inviterProfile.empresa,
            tenant_id: tenantId,
            role,
            plano: "colaborador",
          },
        });

        if (inviteError) {
          const message = inviteError.message.toLowerCase();
          const isEmailLimit = message.includes("email rate limit exceeded") || message.includes("rate limit");

          if (!isEmailLimit) {
            throw new Error(inviteError.message);
          }
        }
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
      warning:
        existingInvite?.status === "pending"
          ? "Este convite já existia e o e-mail não foi reenviado."
          : null,
    });
  } catch (error) {
    return jsonResponse(
      { error: error instanceof Error ? error.message : "Unexpected error." },
      400,
    );
  }
});
