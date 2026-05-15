/**
 * Script standalone que replica, de forma detalhada, o fluxo principal da
 * integracao com a UAZAPI usado neste projeto.
 *
 * O que ele cobre:
 * 1. Descoberta automatica da versao da API (v1 ou v2)
 * 2. Leitura do estado da instancia
 * 3. Registro e consulta de webhook
 * 4. Sincronizacao de chats
 * 5. Sincronizacao de mensagens por chat
 * 6. Envio de mensagem de texto, media, localizacao, contato e menu
 * 7. Normalizacao basica de eventos recebidos por webhook
 *
 * Uso:
 * UAZAPI_BASE_URL=https://api.uazapi.com \
 * UAZAPI_API_KEY=SEU_TOKEN \
 * UAZAPI_INSTANCE_NAME=minha-instancia \
 * UAZAPI_WEBHOOK_URL=https://seu-dominio/webhook \
 * node scripts/uazapi-integracao-completa.mjs status
 *
 * Exemplos:
 * node scripts/uazapi-integracao-completa.mjs status
 * node scripts/uazapi-integracao-completa.mjs webhook:set
 * node scripts/uazapi-integracao-completa.mjs webhook:get
 * node scripts/uazapi-integracao-completa.mjs chats
 * node scripts/uazapi-integracao-completa.mjs messages 5511999999999@s.whatsapp.net
 * node scripts/uazapi-integracao-completa.mjs send:text 5511999999999@s.whatsapp.net "Ola, tudo bem?"
 * node scripts/uazapi-integracao-completa.mjs send:media 5511999999999@s.whatsapp.net "https://exemplo.com/arquivo.pdf" "Legenda opcional"
 */

const REQUIRED_ENV = ["UAZAPI_BASE_URL", "UAZAPI_API_KEY"];

function assertEnv() {
  const missing = REQUIRED_ENV.filter((key) => !process.env[key]?.trim());
  if (missing.length > 0) {
    throw new Error(`Variaveis obrigatorias ausentes: ${missing.join(", ")}`);
  }
}

function joinUrl(baseUrl, path) {
  return `${baseUrl.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizeChatId(value) {
  return String(value ?? "").trim();
}

function normalizePhoneNumber(value) {
  return String(value ?? "").replace(/\D/g, "");
}

function extractDigitsFromJid(value) {
  if (!value) return null;
  const digits = String(value).replace(/\D/g, "");
  return digits || null;
}

async function requestJson(config, path, method = "GET", body) {
  const headers =
    config.apiVersion === "v2"
      ? {
          token: config.apiKey,
          "Content-Type": "application/json",
        }
      : {
          apikey: config.apiKey,
          "Content-Type": "application/json",
        };

  const response = await fetch(joinUrl(config.baseUrl, path), {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const rawText = await response.text();
  let payload = null;

  if (rawText) {
    try {
      payload = JSON.parse(rawText);
    } catch {
      payload = rawText;
    }
  }

  if (!response.ok) {
    const message =
      payload && typeof payload === "object"
        ? String(payload.message ?? payload.error ?? "")
        : "";
    throw new Error(message || rawText || `Falha na UAZAPI (${response.status})`);
  }

  return payload;
}

function isV2Connected(payload) {
  const status = payload?.status;
  return Boolean(status?.connected || status?.loggedIn);
}

async function tryV1Connection(baseUrl, apiKey, instanceName) {
  const config = {
    instanceName,
    baseUrl,
    apiKey,
    apiVersion: "v1",
  };

  const connectionState = await requestJson(
    config,
    `instance/connectionState/${instanceName}`,
  );

  return { config, connectionState };
}

async function tryV2Connection(baseUrl, apiKey) {
  const config = {
    instanceName: "",
    baseUrl,
    apiKey,
    apiVersion: "v2",
  };

  const connectionState = await requestJson(config, "instance/status");
  const instance = connectionState?.instance ?? {};
  const resolvedName = String(
    instance.name ?? instance.profileName ?? instance.id ?? "uazapi-v2",
  ).trim();

  return {
    config: {
      ...config,
      instanceName: resolvedName,
    },
    connectionState,
  };
}

async function resolveConnectionConfig(baseUrl, apiKey, preferredInstanceName) {
  const candidates = Array.from(
    new Set([preferredInstanceName?.trim(), apiKey.trim()].filter(Boolean)),
  );
  const errors = [];

  try {
    return await tryV2Connection(baseUrl, apiKey);
  } catch (error) {
    errors.push(`v2: ${error.message}`);
  }

  for (const candidate of candidates) {
    try {
      return await tryV1Connection(baseUrl, apiKey, candidate);
    } catch (error) {
      errors.push(`v1:${candidate}: ${error.message}`);
    }
  }

  throw new Error(
    `Nao consegui localizar a instancia na UAZAPI. Tentativas: ${errors.join(" | ")}`,
  );
}

async function ensureResolvedConfig(config) {
  if (config.apiVersion) {
    return config;
  }

  const resolved = await resolveConnectionConfig(
    config.baseUrl,
    config.apiKey,
    config.instanceName,
  );

  return resolved.config;
}

function resolveInstanceStatus(connectionState) {
  if (connectionState?.status && typeof connectionState.status === "object") {
    if (isV2Connected(connectionState)) return "connected";
    if (connectionState.status.resetting) return "connecting";
  }

  const rawState = String(
    connectionState?.instance?.state ??
      connectionState?.instance?.status ??
      connectionState?.state ??
      (typeof connectionState?.status === "string" ? connectionState.status : "") ??
      connectionState?.instanceState ??
      "disconnected",
  ).toLowerCase();

  if (["open", "connected", "online", "ready"].some((value) => rawState.includes(value))) {
    return "connected";
  }

  if (["error", "failed"].some((value) => rawState.includes(value))) {
    return "error";
  }

  if (["close", "closed", "disconnect", "logout"].some((value) => rawState.includes(value))) {
    return "disconnected";
  }

  return "connecting";
}

function resolvePhoneNumber(connectionState, fallback = null) {
  return (
    String(
      connectionState?.instance?.owner ??
        extractDigitsFromJid(String(connectionState?.status?.jid ?? "")) ??
        connectionState?.instance?.number ??
        connectionState?.number ??
        connectionState?.instance?.phone ??
        connectionState?.phone ??
        fallback ??
        "",
    ) || null
  );
}

function resolveQrCode(connectionState) {
  const qrValue =
    connectionState?.instance?.qrcode ??
    connectionState?.qrcode ??
    connectionState?.base64 ??
    connectionState?.instance?.base64 ??
    connectionState?.qr ??
    connectionState?.instance?.qr ??
    null;

  return typeof qrValue === "string" && qrValue.trim() ? qrValue.trim() : null;
}

async function getConnectionState(config) {
  const resolvedConfig = await ensureResolvedConfig(config);

  if (resolvedConfig.apiVersion === "v2") {
    return requestJson(resolvedConfig, "instance/status");
  }

  return requestJson(
    resolvedConfig,
    `instance/connectionState/${resolvedConfig.instanceName}`,
  );
}

async function setWebhook(config, url) {
  const resolvedConfig = await ensureResolvedConfig(config);

  if (resolvedConfig.apiVersion === "v2") {
    return requestJson(resolvedConfig, "webhook", "POST", {
      enabled: true,
      url,
      events: ["connection", "messages", "messages_update", "chats"],
    });
  }

  return requestJson(
    resolvedConfig,
    `webhook/set/${resolvedConfig.instanceName}`,
    "POST",
    {
      url,
      enabled: true,
      local_map: false,
      STATUS_INSTANCE: true,
      MESSAGES_UPSERT: true,
      SEND_MESSAGE: true,
      MESSAGES_UPDATE: true,
      QRCODE_UPDATED: true,
      CHATS_SET: true,
      CHATS_UPSERT: true,
      CHATS_UPDATE: true,
      CONNECTION_UPDATE: true,
      groups_ignore: true,
    },
  );
}

async function findWebhook(config) {
  const resolvedConfig = await ensureResolvedConfig(config);

  if (resolvedConfig.apiVersion === "v2") {
    return requestJson(resolvedConfig, "webhook");
  }

  return requestJson(
    resolvedConfig,
    `webhook/find/${resolvedConfig.instanceName}`,
  );
}

async function findChats(config) {
  const resolvedConfig = await ensureResolvedConfig(config);

  if (resolvedConfig.apiVersion === "v2") {
    return requestJson(resolvedConfig, "chat/find", "POST", {
      limit: 100,
      offset: 0,
      sort: "-wa_lastMsgTimestamp",
    });
  }

  return requestJson(
    resolvedConfig,
    `chat/findChats/${resolvedConfig.instanceName}`,
  );
}

async function findMessages(config, remoteJid) {
  const resolvedConfig = await ensureResolvedConfig(config);

  if (resolvedConfig.apiVersion === "v2") {
    return requestJson(resolvedConfig, "message/find", "POST", {
      chatid: normalizeChatId(remoteJid),
      limit: 100,
    });
  }

  return requestJson(
    resolvedConfig,
    `chat/findMessages/${resolvedConfig.instanceName}`,
    "POST",
    {
      where: {
        key: {
          remoteJid,
        },
      },
      limit: 100,
    },
  );
}

async function updatePresence(config, remoteJid) {
  try {
    const resolvedConfig = await ensureResolvedConfig(config);

    if (resolvedConfig.apiVersion === "v2") {
      await requestJson(resolvedConfig, "send/presence", "POST", {
        number: normalizePhoneNumber(remoteJid),
        type: "composing",
      });
      return;
    }

    await requestJson(
      resolvedConfig,
      `chat/updatePresence/${resolvedConfig.instanceName}`,
      "POST",
      {
        number: remoteJid,
        presence: "composing",
      },
    );
  } catch {
    // Presenca e apenas best effort.
  }
}

async function sendMessageViaUazapi(config, input) {
  const resolvedConfig = await ensureResolvedConfig(config);

  if (input.simulateTypingMs) {
    await updatePresence(resolvedConfig, input.remoteJid);
    await sleep(input.simulateTypingMs);
  }

  const payload = input.payload ?? {};
  const number =
    resolvedConfig.apiVersion === "v2"
      ? normalizePhoneNumber(input.remoteJid)
      : input.remoteJid;

  if (resolvedConfig.apiVersion === "v2") {
    if (["media", "audio", "document"].includes(input.messageType)) {
      return requestJson(resolvedConfig, "send/media", "POST", {
        number,
        type: input.messageType === "document" ? "document" : input.messageType,
        file: input.mediaUrl,
        text: input.bodyText ?? "",
        ...payload,
      });
    }

    if (input.messageType === "location") {
      return requestJson(resolvedConfig, "send/location", "POST", {
        number,
        ...payload,
      });
    }

    if (input.messageType === "contact") {
      return requestJson(resolvedConfig, "send/contact", "POST", {
        number,
        ...payload,
      });
    }

    if (input.messageType === "menu") {
      return requestJson(resolvedConfig, "send/menu", "POST", {
        number,
        text: input.bodyText ?? "",
        ...payload,
      });
    }

    return requestJson(resolvedConfig, "send/text", "POST", {
      number,
      text: input.bodyText ?? "",
      replyid: input.quotedMessageId,
      delay: 200,
      ...payload,
    });
  }

  if (input.messageType === "text") {
    return requestJson(
      resolvedConfig,
      `message/sendText/${resolvedConfig.instanceName}`,
      "POST",
      {
        number,
        textMessage: {
          text: input.bodyText ?? "",
        },
        options: {
          delay: 200,
          quoted: input.quotedMessageId ? { key: { id: input.quotedMessageId } } : undefined,
        },
      },
    );
  }

  if (input.messageType === "poll") {
    return requestJson(
      resolvedConfig,
      `message/sendPoll/${resolvedConfig.instanceName}`,
      "POST",
      {
        ...payload,
        number,
      },
    );
  }

  if (input.messageType === "location") {
    return requestJson(
      resolvedConfig,
      `message/sendLocation/${resolvedConfig.instanceName}`,
      "POST",
      {
        ...payload,
        number,
      },
    );
  }

  if (input.messageType === "contact") {
    return requestJson(
      resolvedConfig,
      `message/sendContact/${resolvedConfig.instanceName}`,
      "POST",
      {
        ...payload,
        remotejid: number,
      },
    );
  }

  if (input.messageType === "menu") {
    return requestJson(
      resolvedConfig,
      `message/sendMenu/${resolvedConfig.instanceName}`,
      "POST",
      {
        ...payload,
        number,
        textMessage: {
          text: input.bodyText ?? "",
        },
      },
    );
  }

  if (["media", "audio", "document"].includes(input.messageType)) {
    return requestJson(
      resolvedConfig,
      `message/sendMedia/${resolvedConfig.instanceName}`,
      "POST",
      {
        number,
        mediatype: input.messageType === "document" ? "document" : input.messageType,
        media: input.mediaUrl,
        fileName: payload.fileName ?? "arquivo",
        caption: input.bodyText ?? "",
        ...payload,
      },
    );
  }

  throw new Error(`messageType nao suportado: ${input.messageType}`);
}

function unwrapArray(payload) {
  if (Array.isArray(payload)) return payload;
  if (payload && typeof payload === "object") {
    if (Array.isArray(payload.data)) return payload.data;
    if (Array.isArray(payload.messages)) return payload.messages;
    if (Array.isArray(payload.chats)) return payload.chats;
    if (Array.isArray(payload.result)) return payload.result;
  }
  return [];
}

function unwrapRecords(payload) {
  const items = unwrapArray(payload);
  if (items.length > 0) return items;
  if (payload && typeof payload === "object" && !Array.isArray(payload)) return [payload];
  return [];
}

function normalizeWebhookEventName(rawEventName) {
  const normalized = String(rawEventName ?? "").trim().toLowerCase();

  if (
    [
      "messages",
      "message.upsert",
      "messages.upsert",
      "messages_upsert",
      "messages_set",
      "messages.set",
      "messages-set",
    ].includes(normalized)
  ) {
    return "MESSAGES_UPSERT";
  }

  if (
    ["messages_update", "message.update", "messages.update", "messages-update"].includes(
      normalized,
    )
  ) {
    return "MESSAGES_UPDATE";
  }

  if (["qrcode.updated", "qrcode_updated", "qrcode", "qr"].includes(normalized)) {
    return "QRCODE_UPDATED";
  }

  if (
    ["connection", "instance.status", "status_instance", "connection_update", "connection.update"].includes(
      normalized,
    )
  ) {
    return "CONNECTION_UPDATE";
  }

  if (
    ["chats", "chat.upsert", "chat.update", "chat.set", "chats.upsert", "chats.update"].includes(
      normalized,
    )
  ) {
    return "CHATS_UPDATE";
  }

  return rawEventName || "UNKNOWN";
}

function normalizeWebhookEvent(payload) {
  const eventCandidate =
    typeof payload.EventType === "string"
      ? payload.EventType
      : typeof payload.event === "string"
        ? payload.event
        : typeof payload.type === "string"
          ? payload.type
          : typeof payload.eventName === "string"
            ? payload.eventName
            : "UNKNOWN";

  return normalizeWebhookEventName(eventCandidate);
}

function extractMessageId(value) {
  const key = value?.key ?? value?.data?.key;
  return key?.id ?? value?.id ?? null;
}

function extractRemoteJid(value) {
  const key = value?.key ?? value?.data?.key;
  return (
    key?.remoteJid ??
    value?.chatid ??
    value?.wa_chatid ??
    value?.sender ??
    value?.remoteJid ??
    null
  );
}

function extractBodyText(value) {
  const message = value?.message ?? value?.data?.message;
  if (!message) return value?.text ?? "";

  return (
    message?.conversation ??
    message?.extendedTextMessage?.text ??
    message?.imageMessage?.caption ??
    message?.videoMessage?.caption ??
    message?.documentMessage?.caption ??
    ""
  );
}

function detectMessageType(value) {
  const message = value?.message ?? value?.data?.message;
  if (!message) return "text";
  if (message.imageMessage || message.videoMessage || message.stickerMessage) return "media";
  if (message.audioMessage) return "audio";
  if (message.documentMessage) return "document";
  if (message.pollCreationMessage) return "poll";
  if (message.listMessage || message.buttonsMessage) return "menu";
  if (message.contactMessage || message.contactsArrayMessage) return "contact";
  if (message.locationMessage) return "location";
  return "text";
}

function summarizeWebhookPayload(payload) {
  const eventName = normalizeWebhookEvent(payload);
  const messages = unwrapRecords(
    payload.message ?? payload.data ?? payload.messages ?? payload.event ?? payload,
  );

  return {
    eventName,
    messages: messages.map((message) => ({
      id: extractMessageId(message),
      remoteJid: extractRemoteJid(message),
      bodyText: extractBodyText(message),
      messageType: detectMessageType(message),
    })),
  };
}

function buildConfigFromEnv() {
  return {
    baseUrl: process.env.UAZAPI_BASE_URL.trim(),
    apiKey: process.env.UAZAPI_API_KEY.trim(),
    instanceName: process.env.UAZAPI_INSTANCE_NAME?.trim() ?? "",
  };
}

async function main() {
  assertEnv();

  const command = process.argv[2];
  const arg1 = process.argv[3];
  const arg2 = process.argv[4];
  const arg3 = process.argv[5];

  if (!command) {
    throw new Error("Informe um comando. Ex.: status, chats, messages, send:text");
  }

  const baseConfig = buildConfigFromEnv();
  const resolved = await resolveConnectionConfig(
    baseConfig.baseUrl,
    baseConfig.apiKey,
    baseConfig.instanceName,
  );

  const config = resolved.config;

  if (command === "status") {
    const state = await getConnectionState(config);
    console.log(
      JSON.stringify(
        {
          apiVersion: config.apiVersion,
          instanceName: config.instanceName,
          status: resolveInstanceStatus(state),
          phoneNumber: resolvePhoneNumber(state),
          hasQrCode: Boolean(resolveQrCode(state)),
          raw: state,
        },
        null,
        2,
      ),
    );
    return;
  }

  if (command === "webhook:set") {
    const webhookUrl = process.env.UAZAPI_WEBHOOK_URL?.trim();
    if (!webhookUrl) {
      throw new Error("Defina UAZAPI_WEBHOOK_URL para registrar o webhook.");
    }
    const result = await setWebhook(config, webhookUrl);
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  if (command === "webhook:get") {
    const result = await findWebhook(config);
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  if (command === "chats") {
    const result = await findChats(config);
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  if (command === "messages") {
    if (!arg1) {
      throw new Error("Informe o remoteJid. Ex.: 5511999999999@s.whatsapp.net");
    }
    const result = await findMessages(config, arg1);
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  if (command === "send:text") {
    if (!arg1 || !arg2) {
      throw new Error('Uso: send:text <remoteJid> "<texto>"');
    }
    const result = await sendMessageViaUazapi(config, {
      messageType: "text",
      remoteJid: arg1,
      bodyText: arg2,
      simulateTypingMs: 800,
    });
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  if (command === "send:media") {
    if (!arg1 || !arg2) {
      throw new Error('Uso: send:media <remoteJid> "<mediaUrl>" "<legenda-opcional>"');
    }
    const result = await sendMessageViaUazapi(config, {
      messageType: "media",
      remoteJid: arg1,
      mediaUrl: arg2,
      bodyText: arg3 ?? "",
      payload: {
        fileName: "arquivo-enviado",
      },
    });
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  if (command === "send:location") {
    if (!arg1) {
      throw new Error("Uso: send:location <remoteJid>");
    }
    const result = await sendMessageViaUazapi(config, {
      messageType: "location",
      remoteJid: arg1,
      payload: {
        latitude: -23.55052,
        longitude: -46.633308,
        name: "Sao Paulo",
        address: "Praca da Se",
      },
    });
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  if (command === "send:contact") {
    if (!arg1) {
      throw new Error("Uso: send:contact <remoteJid>");
    }
    const result = await sendMessageViaUazapi(config, {
      messageType: "contact",
      remoteJid: arg1,
      payload: {
        contact: [
          {
            fullName: "Contato Exemplo",
            wuid: "5511999999999",
            phoneNumber: "5511999999999",
          },
        ],
      },
    });
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  if (command === "send:menu") {
    if (!arg1 || !arg2) {
      throw new Error('Uso: send:menu <remoteJid> "<texto>"');
    }
    const result = await sendMessageViaUazapi(config, {
      messageType: "menu",
      remoteJid: arg1,
      bodyText: arg2,
      payload: {
        title: "Escolha uma opcao",
        footer: "DistribuiBot Pro",
        buttonText: "Abrir menu",
        sections: [
          {
            title: "Acoes",
            rows: [
              { title: "Ver pedidos", rowId: "pedidos" },
              { title: "Falar com vendedor", rowId: "vendedor" },
            ],
          },
        ],
      },
    });
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  if (command === "webhook:parse") {
    const raw = process.env.UAZAPI_SAMPLE_WEBHOOK?.trim();
    if (!raw) {
      throw new Error("Defina UAZAPI_SAMPLE_WEBHOOK com um JSON bruto de webhook.");
    }
    const payload = JSON.parse(raw);
    console.log(JSON.stringify(summarizeWebhookPayload(payload), null, 2));
    return;
  }

  throw new Error(`Comando nao suportado: ${command}`);
}

main().catch((error) => {
  console.error(`[uazapi-integracao-completa] ${error.message}`);
  process.exit(1);
});
