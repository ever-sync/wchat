import { aiBlockReasonMessage, evaluateAiReplyEligibility } from "../_shared/ai-business-rules.ts";
import { decryptSecret } from "../_shared/crypto.ts";
import { ensureLeadFromChat, getInstanceById, insertMessage, normalizeUazapiMessageId } from "../_shared/domain.ts";
import { handleCors, jsonResponse } from "../_shared/http.ts";
import { createAdminClient } from "../_shared/supabase.ts";
import { sendMessageViaUazapi } from "../_shared/uazapi.ts";

async function verifySignature(secret: string, body: string, signature: string | null): Promise<boolean> {
  if (!signature) return false;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(body));
  const expected = Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("");
  return expected === signature.replace(/^sha256=/, "").toLowerCase();
}

Deno.serve(async (request) => {
  const corsResponse = handleCors(request);
  if (corsResponse) return corsResponse;

  if (request.method !== "POST") {
    return jsonResponse({ error: "Method not allowed." }, 405);
  }

  const rawBody = await request.text();
  let body: Record<string, unknown>;
  try {
    body = JSON.parse(rawBody) as Record<string, unknown>;
  } catch {
    return jsonResponse({ error: "Invalid JSON." }, 400);
  }

  const admin = createAdminClient();
  const chatId = String(body.chat_id ?? "");
  const tenantId = String(body.tenant_id ?? "");

  if (!chatId || !tenantId) {
    return jsonResponse({ error: "chat_id and tenant_id required." }, 400);
  }

  const { data: integration } = await admin
    .from("tenant_integrations")
    .select("n8n_secret, n8n_enabled")
    .eq("tenant_id", tenantId)
    .maybeSingle();

  const serviceKey = Deno.env.get("N8N_SERVICE_KEY");
  const authHeader = request.headers.get("Authorization");
  const signature = request.headers.get("X-WChat-Signature");

  const authorizedByKey = serviceKey && authHeader === `Bearer ${serviceKey}`;
  const authorizedByHmac = integration?.n8n_secret &&
    await verifySignature(integration.n8n_secret, rawBody, signature);

  if (!authorizedByKey && !authorizedByHmac) {
    return jsonResponse({ error: "Unauthorized." }, 401);
  }

  if (!integration?.n8n_enabled) {
    return jsonResponse({ error: "n8n integration disabled." }, 403);
  }

  try {
    const { data: chat, error: chatError } = await admin
      .from("whatsapp_chats")
      .select("*, customers(opt_out)")
      .eq("id", chatId)
      .eq("tenant_id", tenantId)
      .single();

    if (chatError || !chat) {
      return jsonResponse({ error: "Chat not found." }, 404);
    }

    const customersJoin = chat.customers as { opt_out?: boolean } | null | undefined;
    let negotiation: {
      assignee_id?: string | null;
      status?: string | null;
      stage_id?: string | null;
    } | null = null;

    if (chat.primary_negotiation_id) {
      const { data: neg } = await admin
        .from("crm_negotiations")
        .select("assignee_id, status, stage_id")
        .eq("id", chat.primary_negotiation_id)
        .maybeSingle();
      negotiation = neg;
    }

    const aiEligibility = evaluateAiReplyEligibility({
      aiMode: String(chat.ai_mode ?? "off"),
      chatAssigneeId: chat.assignee_id,
      negotiationAssigneeId: negotiation?.assignee_id,
      negotiationStatus: negotiation?.status,
      negotiationStageId: negotiation?.stage_id,
      customerOptOut: Boolean(customersJoin?.opt_out),
    });

    if (!aiEligibility.allowed) {
      const reason = aiEligibility.reason ?? "ai_off";
      return jsonResponse(
        {
          error: "AI blocked by business rules.",
          block_reason: reason,
          message: aiBlockReasonMessage(reason),
          ai_mode: aiEligibility.aiMode,
        },
        409,
      );
    }

    const text = String(body.text ?? "").trim();
    const handoff = body.handoff === true;

    if (text) {
      const instance = await getInstanceById(admin, chat.instance_id);
      const apiKey = await decryptSecret(instance.encrypted_apikey);
      const config = {
        instanceName: instance.uazapi_instance_name,
        baseUrl: instance.uazapi_base_url,
        apiKey,
      };

      const response = await sendMessageViaUazapi(config, {
        messageType: "text",
        remoteJid: chat.remote_jid,
        bodyText: text,
        payload: {},
      });

      const uazapiMessageId =
        normalizeUazapiMessageId(
          String(response.key?.id ?? response.data?.key?.id ?? response.id ?? crypto.randomUUID()),
        ) || crypto.randomUUID();

      await insertMessage(admin, instance, chat.id, {
        uazapiMessageId,
        direction: "outbound",
        messageType: "text",
        status: "sent",
        bodyText: text,
        payloadJson: { source: "n8n" },
        rawEvent: response,
        sentAt: new Date().toISOString(),
        actorType: "ai",
      });

      await admin
        .from("whatsapp_chats")
        .update({
          last_message_preview: text,
          last_message_at: new Date().toISOString(),
        })
        .eq("id", chat.id);
    }

    const setStage = typeof body.set_stage === "string" ? body.set_stage.trim() : null;
    if (setStage && chat.primary_negotiation_id) {
      await admin
        .from("crm_negotiations")
        .update({ stage_id: setStage, last_interaction_at: new Date().toISOString() })
        .eq("id", chat.primary_negotiation_id);
    }

    if (handoff) {
      await admin
        .from("whatsapp_chats")
        .update({ ai_mode: "handoff" })
        .eq("id", chat.id);

      await admin.rpc("auto_assign_chat_system", { p_chat_id: chatId });
    }

    const tagsAdd = body.tags_add;
    if (Array.isArray(tagsAdd) && chat.primary_negotiation_id) {
      for (const tagName of tagsAdd) {
        const name = String(tagName).trim();
        if (!name) continue;

        let tagId: string | null = null;
        const { data: existingTag } = await admin
          .from("tags")
          .select("id")
          .eq("tenant_id", tenantId)
          .eq("scope", "negotiation")
          .ilike("name", name)
          .maybeSingle();

        if (existingTag?.id) {
          tagId = existingTag.id;
        } else {
          const { data: newTag } = await admin
            .from("tags")
            .insert({ tenant_id: tenantId, name, color: "#6366f1", scope: "negotiation" })
            .select("id")
            .single();
          tagId = newTag?.id ?? null;
        }

        if (tagId) {
          await admin.from("entity_tags").upsert(
            {
              tenant_id: tenantId,
              tag_id: tagId,
              entity_type: "negotiation",
              entity_id: chat.primary_negotiation_id,
            },
            { onConflict: "tag_id,entity_type,entity_id", ignoreDuplicates: true },
          );
        }
      }
    }

    if (!chat.primary_negotiation_id && chat.customer_id) {
      await ensureLeadFromChat(admin, chatId);
    }

    return jsonResponse({ success: true, handoff });
  } catch (error) {
    return jsonResponse(
      { error: error instanceof Error ? error.message : "Unexpected error." },
      400,
    );
  }
});
