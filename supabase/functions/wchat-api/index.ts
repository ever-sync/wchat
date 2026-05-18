import {
  authenticateApiKey,
  hasApiScope,
  type ApiKeyAuth,
} from "../_shared/api-auth.ts";
import { phoneToRemoteJid, resolveWhatsappInstance } from "../_shared/api-instances.ts";
import {
  apiJsonResponse,
  handleApiCors,
  parseRoute,
  resolveApiPath,
} from "../_shared/api-http.ts";
import { decryptSecret } from "../_shared/crypto.ts";
import { ensureChat, insertOrDedupeOutboundMessage, normalizeUazapiMessageId } from "../_shared/domain.ts";
import { createAdminClient } from "../_shared/supabase.ts";
import { sendMessageViaUazapi } from "../_shared/uazapi.ts";

const MAX_LIMIT = 100;
const DEFAULT_LIMIT = 50;

function clampLimit(raw: string | null): number {
  const n = Number(raw ?? DEFAULT_LIMIT);
  if (!Number.isFinite(n) || n < 1) return DEFAULT_LIMIT;
  return Math.min(Math.floor(n), MAX_LIMIT);
}

function requireScope(auth: ApiKeyAuth, scope: "read" | "write") {
  if (!hasApiScope(auth, scope)) {
    return apiJsonResponse({ error: `Missing scope: ${scope}.` }, 403);
  }
  return null;
}

async function handleHealth(auth: ApiKeyAuth | null) {
  return apiJsonResponse({
    ok: true,
    service: "wchat-api",
    version: "v1",
    authenticated: Boolean(auth),
    tenant_id: auth?.tenantId ?? null,
  });
}

async function handleMe(auth: ApiKeyAuth) {
  const admin = createAdminClient();
  const { data: tenant } = await admin
    .from("tenants")
    .select("id, nome")
    .eq("id", auth.tenantId)
    .maybeSingle();

  return apiJsonResponse({
    tenant: tenant ? { id: tenant.id, nome: tenant.nome } : { id: auth.tenantId },
    api_key: { id: auth.keyId, name: auth.name, scopes: auth.scopes },
  });
}

async function handleListChats(auth: ApiKeyAuth, request: Request) {
  const denied = requireScope(auth, "read");
  if (denied) return denied;

  const url = new URL(request.url);
  const limit = clampLimit(url.searchParams.get("limit"));
  const status = url.searchParams.get("status");
  const admin = createAdminClient();

  let q = admin
    .from("whatsapp_chats")
    .select(
      "id, instance_id, customer_id, remote_jid, display_name, status, resolution, assignee_id, unread_count, last_message_preview, last_message_at, primary_negotiation_id, ai_mode, created_at, updated_at",
    )
    .eq("tenant_id", auth.tenantId)
    .order("last_message_at", { ascending: false, nullsFirst: false })
    .limit(limit);

  if (status) {
    q = q.eq("status", status);
  }

  const { data, error } = await q;
  if (error) {
    return apiJsonResponse({ error: error.message }, 500);
  }

  return apiJsonResponse({ data: data ?? [] });
}

async function handleGetChat(auth: ApiKeyAuth, chatId: string) {
  const denied = requireScope(auth, "read");
  if (denied) return denied;

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("whatsapp_chats")
    .select("*")
    .eq("tenant_id", auth.tenantId)
    .eq("id", chatId)
    .maybeSingle();

  if (error) {
    return apiJsonResponse({ error: error.message }, 500);
  }
  if (!data) {
    return apiJsonResponse({ error: "Chat not found." }, 404);
  }

  return apiJsonResponse({ data });
}

async function handleSendMessage(auth: ApiKeyAuth, request: Request) {
  const denied = requireScope(auth, "write");
  if (denied) return denied;

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return apiJsonResponse({ error: "Invalid JSON." }, 400);
  }

  const text = String(body.text ?? body.body_text ?? "").trim();
  const chatId = body.chat_id != null ? String(body.chat_id) : "";
  const phone = body.phone != null ? String(body.phone) : "";
  const remoteJidInput = body.remote_jid != null ? String(body.remote_jid) : "";

  if (!text) {
    return apiJsonResponse({ error: "text is required." }, 400);
  }

  const admin = createAdminClient();
  let chat: Record<string, unknown> | null = null;
  let instanceId = body.instance_id != null ? String(body.instance_id) : "";

  if (chatId) {
    const { data, error } = await admin
      .from("whatsapp_chats")
      .select("*")
      .eq("tenant_id", auth.tenantId)
      .eq("id", chatId)
      .maybeSingle();
    if (error || !data) {
      return apiJsonResponse({ error: "Chat not found." }, 404);
    }
    chat = data as Record<string, unknown>;
    instanceId = String(chat.instance_id);
  }

  const instance = await resolveWhatsappInstance(admin, auth.tenantId, instanceId || null);
  const remoteJid = remoteJidInput ||
    (chat ? String(chat.remote_jid) : "") ||
    (phone ? phoneToRemoteJid(phone) : "");

  if (!remoteJid) {
    return apiJsonResponse({ error: "Provide chat_id, phone, or remote_jid." }, 400);
  }

  const apiKey = await decryptSecret(instance.encrypted_apikey);
  const config = {
    instanceName: instance.uazapi_instance_name,
    baseUrl: instance.uazapi_base_url,
    apiKey,
  };

  const ensuredChat = chat ??
    (await ensureChat(admin, instance, {
      remoteJid,
      displayName: "Cliente",
      lastMessagePreview: text.slice(0, 200),
      lastMessageAt: new Date().toISOString(),
    }));

  const response = await sendMessageViaUazapi(config, {
    messageType: "text",
    remoteJid,
    bodyText: text,
    payload: {},
  });

  const rawProviderId = response.key?.id ?? response.data?.key?.id ?? response.id;
  const uazapiMessageId = normalizeUazapiMessageId(
    typeof rawProviderId === "string" ? rawProviderId : null,
  ) || null;

  const message = await insertOrDedupeOutboundMessage(admin, instance, String(ensuredChat.id), {
    uazapiMessageId,
    direction: "outbound",
    messageType: "text",
    status: "sent",
    bodyText: text,
    payloadJson: { source: "wchat-api" },
    rawEvent: response,
    sentAt: new Date().toISOString(),
    actorType: "system",
  });

  await admin
    .from("whatsapp_chats")
    .update({
      last_message_preview: text.slice(0, 200),
      last_message_at: new Date().toISOString(),
    })
    .eq("id", ensuredChat.id);

  return apiJsonResponse({
    ok: true,
    chat_id: ensuredChat.id,
    message_id: message.id,
    remote_jid: remoteJid,
  });
}

async function handleListCustomers(auth: ApiKeyAuth, request: Request) {
  const denied = requireScope(auth, "read");
  if (denied) return denied;

  const url = new URL(request.url);
  const limit = clampLimit(url.searchParams.get("limit"));
  const q = url.searchParams.get("q")?.trim();
  const admin = createAdminClient();

  let query = admin
    .from("customers")
    .select(
      "id, codigo, nome, telefone, celular, email, phone_e164, phone_digits, phone_jid, status, perfil, rota, cidade, canal, ativo, cadastrado_em, updated_at",
    )
    .eq("tenant_id", auth.tenantId)
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (q) {
    const safe = q.replace(/[%_,]/g, " ");
    query = query.or(`nome.ilike.%${safe}%,telefone.ilike.%${safe}%,email.ilike.%${safe}%`);
  }

  const { data, error } = await query;
  if (error) {
    return apiJsonResponse({ error: error.message }, 500);
  }

  return apiJsonResponse({ data: data ?? [] });
}

async function handleGetCustomer(auth: ApiKeyAuth, customerId: string) {
  const denied = requireScope(auth, "read");
  if (denied) return denied;

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("customers")
    .select("*")
    .eq("tenant_id", auth.tenantId)
    .eq("id", customerId)
    .maybeSingle();

  if (error) {
    return apiJsonResponse({ error: error.message }, 500);
  }
  if (!data) {
    return apiJsonResponse({ error: "Customer not found." }, 404);
  }

  return apiJsonResponse({ data });
}

async function handleCreateCustomer(auth: ApiKeyAuth, request: Request) {
  const denied = requireScope(auth, "write");
  if (denied) return denied;

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return apiJsonResponse({ error: "Invalid JSON." }, 400);
  }

  const nome = String(body.nome ?? body.name ?? "").trim();
  if (!nome) {
    return apiJsonResponse({ error: "nome is required." }, 400);
  }

  const telefone = String(body.telefone ?? body.phone ?? "").trim();
  const admin = createAdminClient();
  const digits = telefone.replace(/\D/g, "");
  const row: Record<string, unknown> = {
    tenant_id: auth.tenantId,
    codigo: String(body.codigo ?? `API-${digits.slice(-8) || crypto.randomUUID().slice(0, 8)}`),
    nome,
    telefone: telefone || "",
    celular: telefone || "",
    email: String(body.email ?? ""),
    origem: String(body.origem ?? "api"),
    perfil: String(body.perfil ?? "B"),
    rota: String(body.rota ?? ""),
    cidade: String(body.cidade ?? ""),
    status: "ativo",
    canal: String(body.canal ?? "api"),
    ativo: true,
    cadastrado_em: new Date().toISOString(),
    source_columns: { source: "wchat-api" },
  };

  if (digits) {
    const e164 = digits.startsWith("55") ? `+${digits}` : `+55${digits.replace(/^0+/, "")}`;
    row.phone_digits = digits.startsWith("55") ? digits : `55${digits}`;
    row.phone_e164 = e164;
    row.phone_jid = `${row.phone_digits}@s.whatsapp.net`;
  }

  const { data, error } = await admin.from("customers").insert(row).select("*").single();
  if (error) {
    return apiJsonResponse({ error: error.message }, 400);
  }

  return apiJsonResponse({ data }, 201);
}

async function handlePatchCustomer(auth: ApiKeyAuth, customerId: string, request: Request) {
  const denied = requireScope(auth, "write");
  if (denied) return denied;

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return apiJsonResponse({ error: "Invalid JSON." }, 400);
  }

  const allowed = ["nome", "telefone", "celular", "email", "perfil", "rota", "cidade", "status", "ativo"] as const;
  const patch: Record<string, unknown> = {};
  for (const key of allowed) {
    if (body[key] !== undefined) {
      patch[key] = body[key];
    }
  }
  if (body.name !== undefined && patch.nome === undefined) {
    patch.nome = body.name;
  }

  if (Object.keys(patch).length === 0) {
    return apiJsonResponse({ error: "No fields to update." }, 400);
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("customers")
    .update(patch)
    .eq("tenant_id", auth.tenantId)
    .eq("id", customerId)
    .select("*")
    .maybeSingle();

  if (error) {
    return apiJsonResponse({ error: error.message }, 400);
  }
  if (!data) {
    return apiJsonResponse({ error: "Customer not found." }, 404);
  }

  return apiJsonResponse({ data });
}

async function handleListNegotiations(auth: ApiKeyAuth, request: Request) {
  const denied = requireScope(auth, "read");
  if (denied) return denied;

  const url = new URL(request.url);
  const limit = clampLimit(url.searchParams.get("limit"));
  const customerId = url.searchParams.get("customer_id");
  const admin = createAdminClient();

  let q = admin
    .from("crm_negotiations")
    .select(
      "id, title, funnel_id, stage_id, status, assignee_id, customer_id, star_count, qualification, total_value, last_contact_at, last_interaction_at, created_at, updated_at",
    )
    .eq("tenant_id", auth.tenantId)
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (customerId) {
    q = q.eq("customer_id", customerId);
  }

  const { data, error } = await q;
  if (error) {
    return apiJsonResponse({ error: error.message }, 500);
  }

  return apiJsonResponse({ data: data ?? [] });
}

async function handleCreateNegotiation(auth: ApiKeyAuth, request: Request) {
  const denied = requireScope(auth, "write");
  if (denied) return denied;

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return apiJsonResponse({ error: "Invalid JSON." }, 400);
  }

  const title = String(body.title ?? "").trim();
  const funnelId = String(body.funnel_id ?? "");
  const stageId = String(body.stage_id ?? "");

  if (!title || !funnelId || !stageId) {
    return apiJsonResponse({ error: "title, funnel_id and stage_id are required." }, 400);
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("crm_negotiations")
    .insert({
      tenant_id: auth.tenantId,
      title,
      funnel_id: funnelId,
      stage_id: stageId,
      status: String(body.status ?? "em_andamento"),
      assignee_id: body.assignee_id ?? null,
      customer_id: body.customer_id ?? null,
      star_count: Number(body.star_count ?? 0),
      qualification: Number(body.qualification ?? 0),
      total_value: Number(body.total_value ?? 0),
    })
    .select("*")
    .single();

  if (error) {
    return apiJsonResponse({ error: error.message }, 400);
  }

  return apiJsonResponse({ data }, 201);
}

Deno.serve(async (request) => {
  const cors = handleApiCors(request);
  if (cors) return cors;

  const path = resolveApiPath(request, "wchat-api");
  const route = parseRoute(path);
  const method = request.method.toUpperCase();

  try {
    const auth = await authenticateApiKey(createAdminClient(), request);

    if (route.version !== "v1") {
      return apiJsonResponse({ error: "Unsupported API version." }, 404);
    }

    if (route.resource === "health" && method === "GET") {
      return await handleHealth(auth);
    }

    if (!auth) {
      return apiJsonResponse({ error: "Unauthorized. Use Authorization: Bearer wchat_..." }, 401);
    }

    if (route.resource === "me" && method === "GET") {
      return await handleMe(auth);
    }

    if (route.resource === "chats" && method === "GET" && !route.id) {
      return await handleListChats(auth, request);
    }

    if (route.resource === "chats" && method === "GET" && route.id) {
      return await handleGetChat(auth, route.id);
    }

    if (route.resource === "messages" && route.id === "send" && method === "POST") {
      return await handleSendMessage(auth, request);
    }

    if (route.resource === "customers" && method === "GET" && !route.id) {
      return await handleListCustomers(auth, request);
    }

    if (route.resource === "customers" && method === "GET" && route.id) {
      return await handleGetCustomer(auth, route.id);
    }

    if (route.resource === "customers" && method === "POST" && !route.id) {
      return await handleCreateCustomer(auth, request);
    }

    if (route.resource === "customers" && method === "PATCH" && route.id) {
      return await handlePatchCustomer(auth, route.id, request);
    }

    if (route.resource === "crm" && route.id === "negotiations" && method === "GET" && !route.sub) {
      return await handleListNegotiations(auth, request);
    }

    if (route.resource === "crm" && route.id === "negotiations" && method === "POST" && !route.sub) {
      return await handleCreateNegotiation(auth, request);
    }

    return apiJsonResponse({ error: "Not found.", path, method }, 404);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error.";
    return apiJsonResponse({ error: message }, 500);
  }
});
