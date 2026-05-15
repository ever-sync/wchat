import { decryptSecret } from "../_shared/crypto.ts";
import { ensureChat, getInstanceById, isPersonalRemoteJid, processMessagePayload, unwrapArray, unwrapRecords } from "../_shared/domain.ts";
import { handleCors, jsonResponse } from "../_shared/http.ts";
import { createAdminClient, requireTenantContextOrInternal } from "../_shared/supabase.ts";
import { findChats, findMessages } from "../_shared/uazapi.ts";

async function syncInstance(
  admin: ReturnType<typeof createAdminClient>,
  instance: {
    id: string;
    encrypted_apikey: string;
    uazapi_instance_name: string;
    uazapi_base_url: string;
    tenant_id: string;
  },
  chatId?: string,
) {
  const apiKey = await decryptSecret(instance.encrypted_apikey);
  const config = {
    instanceName: instance.uazapi_instance_name,
    baseUrl: instance.uazapi_base_url,
    apiKey,
  };

  const remoteJids = new Set<string>();
  const extractChatRemoteJid = (chat: Record<string, unknown>) =>
    String(
      chat.wa_chatid ??
        chat.chatid ??
        chat.remoteJid ??
        chat.id ??
        "",
    ).trim();
  const extractChatDisplayName = (chat: Record<string, unknown>) =>
    String(
      chat.wa_contactName ??
        chat.name ??
        chat.wa_name ??
        chat.pushName ??
        "Sem nome",
    );
  const extractChatPreview = (chat: Record<string, unknown>) =>
    String(
      chat.wa_lastMessageTextVote ??
        (chat.lastMessage as Record<string, unknown> | undefined)?.conversation ??
        ((chat.lastMessage as Record<string, unknown> | undefined)?.extendedTextMessage as Record<string, unknown> | undefined)?.text ??
        "",
    );
  const extractChatTimestamp = (chat: Record<string, unknown>) => {
    const rawTimestamp = chat.wa_lastMsgTimestamp ?? chat.updatedAt ?? null;
    if (!rawTimestamp) {
      return null;
    }

    if (typeof rawTimestamp === "number") {
      return new Date(rawTimestamp > 1e12 ? rawTimestamp : rawTimestamp * 1000).toISOString();
    }

    const numericValue = Number(rawTimestamp);
    if (Number.isFinite(numericValue)) {
      return new Date(numericValue > 1e12 ? numericValue : numericValue * 1000).toISOString();
    }

    return new Date(String(rawTimestamp)).toISOString();
  };

  if (chatId) {
    const { data: chat } = await admin
      .from("whatsapp_chats")
      .select("remote_jid")
      .eq("id", chatId)
      .eq("instance_id", instance.id)
      .maybeSingle();

    if (chat?.remote_jid) {
      remoteJids.add(chat.remote_jid);
    }
  } else {
    const chatPayload = await findChats(config);
    for (const chat of unwrapArray<Record<string, unknown>>(chatPayload)) {
      const remoteJid = extractChatRemoteJid(chat);
      if (!isPersonalRemoteJid(remoteJid)) continue;
      remoteJids.add(remoteJid);
      await ensureChat(admin, instance, {
        remoteJid,
        displayName: extractChatDisplayName(chat),
        avatarUrl: typeof chat.imagePreview === "string" ? chat.imagePreview : null,
        lastMessagePreview: extractChatPreview(chat),
        lastMessageAt: extractChatTimestamp(chat),
      });
    }
  }

  for (const remoteJid of remoteJids) {
    const messagesPayload = await findMessages(config, remoteJid);
    const messages = unwrapRecords(messagesPayload);
    for (const message of messages) {
      await processMessagePayload(admin, instance, message);
    }
  }

  await admin
    .from("whatsapp_instances")
    .update({
      last_sync_at: new Date().toISOString(),
      last_error: null,
    })
    .eq("id", instance.id);

  return remoteJids.size;
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
    const auth = await requireTenantContextOrInternal(request);
    const admin = createAdminClient();
    const body = await request.json().catch(() => ({}));
    const instanceId = body.instanceId as string | undefined;
    const chatId = body.chatId as string | undefined;

    if (chatId && !instanceId) {
      const { data: chatInstance, error: chatInstanceError } = await admin
        .from("whatsapp_chats")
        .select("instance_id")
        .eq("id", chatId)
        .single();

      if (chatInstanceError || !chatInstance?.instance_id) {
        throw new Error(chatInstanceError?.message ?? "Conversa nÃ£o encontrada.");
      }

      const instance = await getInstanceById(admin, chatInstance.instance_id);
      if (!auth.isInternal && instance.tenant_id !== auth.tenantId) {
        throw new Error("Conversa fora do tenant atual.");
      }

      const syncedChats = await syncInstance(admin, instance, chatId);
      return jsonResponse({ success: true, syncedInstances: 1, syncedChats });
    }

    const instances = [];

    if (instanceId) {
      const instance = await getInstanceById(admin, instanceId);
      if (!auth.isInternal && instance.tenant_id !== auth.tenantId) {
        throw new Error("InstÃ¢ncia fora do tenant atual.");
      }
      instances.push(instance);
    } else if (auth.isInternal) {
      const { data, error } = await admin
        .from("whatsapp_instances")
        .select("*")
        .is("archived_at", null)
        .in("status", ["connected", "connecting"]);

      if (error) {
        throw new Error(error.message);
      }

      instances.push(...(data ?? []));
    } else {
      const { data } = await admin
        .from("whatsapp_instances")
        .select("*")
        .eq("tenant_id", auth.tenantId as string)
        .is("archived_at", null)
        .eq("is_default", true)
        .maybeSingle();

      if (!data) {
        throw new Error("Nenhuma instÃ¢ncia padrÃ£o encontrada.");
      }

      instances.push(data);
    }

    let syncedChats = 0;
    for (const instance of instances) {
      syncedChats += await syncInstance(admin, instance, chatId);
    }

    return jsonResponse({
      success: true,
      syncedInstances: instances.length,
      syncedChats,
    });
  } catch (error) {
    return jsonResponse({ error: error instanceof Error ? error.message : "Unexpected error." }, 400);
  }
});
