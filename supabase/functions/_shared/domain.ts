import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.49.8";
import { evaluateAiReplyEligibility } from "./ai-business-rules.ts";
import { decryptSecret } from "./crypto.ts";
import {
  downloadIncomingMediaFromUazapi,
  type UazapiInstanceConfig,
  type UazapiMediaDownload,
} from "./uazapi.ts";
import {
  fetchAndDecryptWhatsappMedia,
  type WhatsappMediaKind,
} from "./whatsapp-media-crypto.ts";

const OPT_OUT_KEYWORDS = [
  "stop", "para", "parar", "remover", "cancelar", "sair",
  "não quero", "nao quero", "descadastrar", "descadastre",
  "me retire", "me remova", "sair da lista", "não me mande",
  "nao me mande",
];

type AdminClient = SupabaseClient;

type InstanceRecord = {
  id: string;
  tenant_id: string;
  display_name: string;
  uazapi_instance_name: string;
  uazapi_base_url: string;
  encrypted_apikey: string;
  phone_number: string | null;
  status: string;
  is_default: boolean;
  webhook_token: string;
  archived_at?: string | null;
};

type MessageDirection = "inbound" | "outbound";

/** Grupos e canais — nunca viram chat 1:1 no inbox. `@lid` e permitido (PN pode nao vir no webhook). */
const NON_PERSONAL_JID_SUFFIXES = ["@g.us", "@newsletter", "@broadcast", "@status"];

/**
 * Identifica JIDs que não são conversa pessoal 1:1.
 * - `@g.us`: grupos
 * - `@newsletter`, `@broadcast`, `@status`: canais e listas
 * - `@lid` **nao** e excluido: sem `remoteJidAlt` ainda precisamos gravar mensagem no inbox.
 */
export function isPersonalRemoteJid(remoteJid: string | null | undefined): boolean {
  const value = String(remoteJid ?? "").trim().toLowerCase();
  if (!value) return false;
  return !NON_PERSONAL_JID_SUFFIXES.some((suffix) => value.endsWith(suffix));
}

/**
 * Decide se uma string deve ser usada como nome legível ou se é apenas um
 * telefone disfarçado / placeholder. Retorna `false` quando:
 * - String vazia ou só com caracteres não-alfanuméricos
 * - Contém JID interno (@s.whatsapp.net, @lid, @g.us)
 * - Não tem nenhuma letra (≥2 letras adjacentes) e tem dígitos suficientes para ser um telefone
 */
function isMeaningfulDisplayName(value: string | null | undefined) {
  const normalized = String(value ?? "").trim();
  if (!normalized) return false;

  const lower = normalized.toLowerCase();
  if (
    lower.includes("@s.whatsapp.net") ||
    lower.includes("@lid") ||
    lower.includes("@g.us") ||
    lower.includes("@newsletter") ||
    lower.includes("@broadcast")
  ) {
    return false;
  }

  const digitsOnly = normalized.replace(/\D/g, "");
  // Sem dígitos suficientes para ser telefone, qualquer texto não vazio passa.
  if (digitsOnly.length < 10) {
    // Mas precisa ter ao menos 1 letra para evitar coisas como "----" ou "...".
    return /\p{L}/u.test(normalized);
  }

  // Tem dígitos suficientes pra ser telefone: exige ≥2 letras adjacentes.
  // Isso descarta "Tel.: 11 99999-9999", "📱 11 ...", "+55(11)9.9999-9999", "~ 11 99999-9999".
  return /\p{L}{2,}/u.test(normalized);
}

function pickBestDisplayName(...candidates: Array<string | null | undefined>) {
  for (const candidate of candidates) {
    if (isMeaningfulDisplayName(candidate)) {
      return String(candidate).trim();
    }
  }

  return null;
}

function normalizePhone(rawPhone: string) {
  const trimmed = String(rawPhone ?? "").trim();
  if (trimmed.toLowerCase().endsWith("@lid")) {
    return {
      digits: "",
      e164: null,
      jid: trimmed,
    };
  }

  const rawDigits = trimmed.replace(/\D/g, "");
  if (!rawDigits) {
    return {
      digits: "",
      e164: null,
      jid: null,
    };
  }

  const digits = (() => {
    const normalizeNationalDigits = (value: string) => {
      const nationalDigits = value.length > 11 ? value.slice(-11) : value;
      return nationalDigits.length >= 10 ? nationalDigits : "";
    };

    if (rawDigits.startsWith("55")) {
      const nationalDigits = normalizeNationalDigits(rawDigits.slice(2));
      return nationalDigits ? `55${nationalDigits}` : "";
    }

    const nationalDigits = normalizeNationalDigits(rawDigits.replace(/^0+/, ""));
    return nationalDigits ? `55${nationalDigits}` : "";
  })();

  if (!digits) {
    return {
      digits: "",
      e164: null,
      jid: null,
    };
  }

  return {
    digits,
    e164: `+${digits}`,
    jid: `${digits}@s.whatsapp.net`,
  };
}

function formatPhoneForCustomer(normalized: ReturnType<typeof normalizePhone>) {
  if (normalized.e164) {
    return normalized.e164;
  }

  return normalized.digits;
}

function formatAutoCustomerName(
  normalized: ReturnType<typeof normalizePhone>,
  preferredDisplayName?: string | null,
) {
  const validDisplayName = pickBestDisplayName(preferredDisplayName);
  if (validDisplayName) {
    return validDisplayName;
  }

  const digits = normalized.digits.replace(/^55/, "");
  if (digits.length >= 10) {
    const ddd = digits.slice(0, 2);
    const prefix = digits.length === 11 ? digits.slice(2, 7) : digits.slice(2, 6);
    const suffix = digits.length === 11 ? digits.slice(7, 11) : digits.slice(6, 10);
    return `WhatsApp ${ddd ? `(${ddd}) ` : ""}${prefix}-${suffix}`;
  }

  return "Contato WhatsApp";
}

/**
 * Baileys / WhatsApp podem enviar o chat em `@lid` e o JID de telefone em
 * `remoteJidAlt` (ou o contrário). Usar só `key.remoteJid` fazia cair em
 * `@lid` → `isPersonalRemoteJid` descartava e nada era gravado no inbox.
 */
function pickPhoneJidOverLidPair(
  primary: string | null | undefined,
  alt: string | null | undefined,
): string | null {
  const p = typeof primary === "string" ? primary.trim() : "";
  const a = typeof alt === "string" ? alt.trim() : "";
  if (!p && !a) return null;

  const isLid = (j: string) => j.toLowerCase().endsWith("@lid");
  const isPnNet = (j: string) => /@s\.whatsapp\.net$/i.test(j);

  if (isPnNet(p)) return p;
  if (isPnNet(a)) return a;
  if (p && !isLid(p)) return p;
  if (a && !isLid(a)) return a;
  return p || a || null;
}

function extractRemoteJid(value: Record<string, unknown>) {
  const key = value.key as Record<string, unknown> | undefined;
  const nestedKey = (value as { data?: { key?: Record<string, unknown> } }).data?.key;

  const fromKey = pickPhoneJidOverLidPair(
    key?.remoteJid as string | undefined,
    key?.remoteJidAlt as string | undefined,
  );
  if (fromKey) return fromKey;

  const fromNested = pickPhoneJidOverLidPair(
    nestedKey?.remoteJid as string | undefined,
    nestedKey?.remoteJidAlt as string | undefined,
  );
  if (fromNested) return fromNested;

  return (
    (value.chatid as string | undefined) ??
    (value.wa_chatid as string | undefined) ??
    (value.sender as string | undefined) ??
    (value.remoteJid as string | undefined) ??
    null
  );
}

function extractKey(value: Record<string, unknown>) {
  return (
    (value.key as Record<string, unknown> | undefined) ??
    ((value as { data?: { key?: Record<string, unknown> } }).data?.key) ??
    undefined
  );
}

function getMessageLikeBlock(value: Record<string, unknown>) {
  const nested = (value.message as Record<string, unknown> | undefined) ??
    ((value as { data?: { message?: Record<string, unknown> } }).data?.message);
  return nested ?? value;
}

function getStringCandidate(...values: Array<unknown>) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return null;
}

function inferMediaKindFromMimeOrUrl(
  mimeType?: string | null,
  url?: string | null,
): "image" | "video" | "audio" | "document" | null {
  const mime = String(mimeType ?? "").trim().toLowerCase();
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("video/")) return "video";
  if (mime.startsWith("audio/")) return "audio";
  if (
    mime.includes("pdf") ||
    mime.includes("msword") ||
    mime.includes("officedocument") ||
    mime.includes("spreadsheet") ||
    mime.includes("presentation") ||
    mime.includes("text/")
  ) {
    return "document";
  }

  const path = String(url ?? "").split("?")[0].toLowerCase();
  if (/\.(jpe?g|png|gif|webp|bmp|svg)$/i.test(path) || path.startsWith("data:image/")) {
    return "image";
  }
  if (/\.(mp4|webm|ogg|mov|m4v)$/i.test(path) || path.startsWith("data:video/")) {
    return "video";
  }
  if (/\.(mp3|wav|m4a|aac|opus|oga)$/i.test(path) || path.startsWith("data:audio/")) {
    return "audio";
  }
  if (/\.(pdf|doc|docx|xls|xlsx|csv|zip|rar|ppt|pptx|txt)$/i.test(path)) {
    return "document";
  }

  return null;
}

function extractMessageId(value: Record<string, unknown>): string | null {
  const key = extractKey(value);
  const message = getMessageLikeBlock(value);
  const raw =
    (key?.id as string | undefined) ??
    /* uazapi v2 expoe `messageid` (curto) e `id` (formato `JID:messageid`). */
    (message.messageid as string | undefined) ??
    (value.messageid as string | undefined) ??
    (value.id as string | undefined) ??
    (message.id as string | undefined) ??
    null;
  const id = normalizeUazapiMessageId(typeof raw === "string" ? raw : null);
  return id.length > 0 ? id : null;
}

export function normalizeUazapiMessageId(value: string | null | undefined): string {
  const trimmed = String(value ?? "").trim();
  if (!trimmed) {
    return "";
  }

  const separatorIndex = trimmed.lastIndexOf(":");
  if (separatorIndex <= 0 || separatorIndex >= trimmed.length - 1) {
    return trimmed;
  }

  const prefix = trimmed.slice(0, separatorIndex);
  const suffix = trimmed.slice(separatorIndex + 1).trim();

  if (!suffix) {
    return trimmed;
  }

  // UAZAPI v2 pode alternar entre `messageid` curto e `id` completo no formato
  // `jid:messageid`. Canonicalizamos para o trecho final para que envio,
  // webhook de upsert e recibo de entrega apontem ao mesmo registro.
  if (prefix.includes("@")) {
    return suffix;
  }

  return trimmed;
}

function extractBodyText(value: Record<string, unknown>) {
  const message = getMessageLikeBlock(value);

  const conversation = getStringCandidate(
    (message.conversation as string | undefined),
    (message.text as string | undefined),
    (message.caption as string | undefined),
    (value.text as string | undefined),
  );
  const extendedText = getStringCandidate((message.extendedTextMessage as Record<string, unknown> | undefined)?.text);
  const imageCaption = getStringCandidate((message.imageMessage as Record<string, unknown> | undefined)?.caption);
  const videoCaption = getStringCandidate((message.videoMessage as Record<string, unknown> | undefined)?.caption);
  const audioCaption = getStringCandidate((message.audioMessage as Record<string, unknown> | undefined)?.caption);
  const documentCaption = getStringCandidate((message.documentMessage as Record<string, unknown> | undefined)?.caption);

  /* uazapi v2: `message.content` pode ser string (texto direto) OU objeto
   * com `text`/`caption`/`URL`/`mimetype` etc. */
  const rawContent = message.content;
  const v2ContentString =
    typeof rawContent === "string" ? rawContent : null;
  const v2ContentObject =
    rawContent && typeof rawContent === "object" && !Array.isArray(rawContent)
      ? (rawContent as Record<string, unknown>)
      : null;
  const v2Text =
    v2ContentString ??
    getStringCandidate(
      v2ContentObject?.text,
      v2ContentObject?.caption,
    );

  return conversation ?? extendedText ?? imageCaption ?? videoCaption ?? audioCaption ?? documentCaption ?? v2Text ?? "";
}

function extractDisplayName(value: Record<string, unknown>) {
  return pickBestDisplayName(
    value.wa_contactName as string | undefined,
    value.name as string | undefined,
    value.senderName as string | undefined,
    value.wa_name as string | undefined,
    value.pushName as string | undefined,
    value.displayName as string | undefined,
    ((value as { data?: { pushName?: string } }).data?.pushName),
  ) ?? "Sem nome";
}

function normalizeMediaUrl(url: string | null | undefined): string | null {
  if (typeof url !== "string") {
    return null;
  }

  const trimmed = url.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function isLikelyMediaUrl(candidate: string | null | undefined): candidate is string {
  if (typeof candidate !== "string") return false;
  const trimmed = candidate.trim();
  if (!trimmed) return false;

  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return true;
  if (trimmed.startsWith("data:image/") || trimmed.startsWith("data:video/") || trimmed.startsWith("data:audio/")) {
    return true;
  }

  return false;
}

function pickFirstUrl(...values: Array<unknown>): string | null {
  for (const value of values) {
    if (typeof value === "string" && isLikelyMediaUrl(value)) {
      return value.trim();
    }
  }
  return null;
}

function extractMediaUrl(value: Record<string, unknown>) {
  const message = getMessageLikeBlock(value);
  /* uazapi v2 entrega tudo em `message.content` (objeto com `URL`, `mimetype`,
   * `fileName`, `mediaKey`, etc.). Outros provedores usam blocos Baileys. */
  const v2Content =
    message.content && typeof message.content === "object" && !Array.isArray(message.content)
      ? (message.content as Record<string, unknown>)
      : null;
  const mediaBlocks = [
    v2Content,
    message.imageMessage,
    message.videoMessage,
    message.audioMessage,
    message.documentMessage,
    message.stickerMessage,
    message.mediaMessage,
    message.media,
    value.media,
  ].filter((entry): entry is Record<string, unknown> => Boolean(entry) && typeof entry === "object");

  const blockUrl = mediaBlocks
    .map((entry) =>
      pickFirstUrl(
        entry.URL,
        entry.url,
        entry.mediaUrl,
        entry.media,
        entry.fileUrl,
        entry.fileURL,
        entry.directURL,
        entry.directPath,
        entry.downloadUrl,
        entry.content,
      ),
    )
    .find((entry): entry is string => Boolean(entry));

  /* uazapi v2 costuma colocar a URL em campos `content`, `fileURL`, `image`,
   * `video`, `audio`, `document` no nivel da mensagem ou do payload. */
  const v2Candidates = pickFirstUrl(
    message.content,
    message.fileURL,
    message.fileUrl,
    message.image,
    message.video,
    message.audio,
    message.document,
    message.sticker,
    message.body,
    value.content,
    value.fileURL,
    value.fileUrl,
    value.image,
    value.video,
    value.audio,
    value.document,
    value.sticker,
    value.body,
  );

  const flatUrl = pickFirstUrl(
    value.mediaUrl,
    value.url,
    value.imageUrl,
    value.videoUrl,
    value.audioUrl,
    value.documentUrl,
    value.stickerUrl,
    value.directUrl,
    value.directURL,
    value.downloadUrl,
    (value.media as Record<string, unknown> | undefined)?.url,
    (value.media as Record<string, unknown> | undefined)?.mediaUrl,
  );

  return normalizeMediaUrl(blockUrl ?? v2Candidates ?? flatUrl ?? null);
}

/**
 * Expõe no topo do JSON os mesmos campos que o envio pelo Inbox (`fileName`, `mimeType`, `size`)
 * para o `MessageBubble` / `resolveInboxAttachmentPresentation` encontrarem metadados.
 */
function extractNormalizedMediaMeta(value: Record<string, unknown>): Record<string, unknown> {
  const message = getMessageLikeBlock(value);
  if (!message) {
    return {};
  }

  const v2Content =
    message.content && typeof message.content === "object" && !Array.isArray(message.content)
      ? (message.content as Record<string, unknown>)
      : null;

  const blocks = [
    v2Content,
    message.imageMessage,
    message.videoMessage,
    message.audioMessage,
    message.documentMessage,
    message.stickerMessage,
    message.mediaMessage,
    message.media,
    value.media,
    /* uazapi v2 expoe metadata no proprio nivel da mensagem/raiz. */
    message,
    value,
  ].filter((entry): entry is Record<string, unknown> =>
    Boolean(entry) && typeof entry === "object"
  );

  const out: Record<string, unknown> = {};

  for (const block of blocks) {
    if (!out.fileName) {
      const fileName = block.fileName ?? block.file_name ?? block.filename ?? block.name;
      if (typeof fileName === "string" && fileName.trim()) {
        out.fileName = fileName.trim();
      }
    }

    if (!out.mimeType) {
      const mimeType = block.mimetype ?? block.mimeType ?? block.contentType;
      if (typeof mimeType === "string" && mimeType.trim()) {
        out.mimeType = mimeType.trim();
      }
    }

    if (!out.size) {
      const sizeRaw = block.fileLength ?? block.file_length ?? block.size ?? block.fileSize;
      if (typeof sizeRaw === "number" && Number.isFinite(sizeRaw)) {
        out.size = sizeRaw;
      } else if (typeof sizeRaw === "string" && Number.isFinite(Number(sizeRaw))) {
        out.size = Number(sizeRaw);
      }
    }
  }

  return out;
}

function extractDirection(value: Record<string, unknown>): MessageDirection {
  const key = extractKey(value);
  const nestedData = (value as { data?: Record<string, unknown> }).data;
  const fromMe =
    key?.fromMe ??
    nestedData?.fromMe ??
    value.fromMe;

  return fromMe ? "outbound" : "inbound";
}

function detectMessageType(value: Record<string, unknown>) {
  const message = getMessageLikeBlock(value);
  const mediaUrl = extractMediaUrl(value);
  const v2Content =
    message.content && typeof message.content === "object" && !Array.isArray(message.content)
      ? (message.content as Record<string, unknown>)
      : null;
  const mimeType = getStringCandidate(
    v2Content?.mimetype,
    v2Content?.mimeType,
    v2Content?.contentType,
    (message.imageMessage as Record<string, unknown> | undefined)?.mimetype,
    (message.imageMessage as Record<string, unknown> | undefined)?.mimeType,
    (message.videoMessage as Record<string, unknown> | undefined)?.mimetype,
    (message.videoMessage as Record<string, unknown> | undefined)?.mimeType,
    (message.audioMessage as Record<string, unknown> | undefined)?.mimetype,
    (message.audioMessage as Record<string, unknown> | undefined)?.mimeType,
    (message.documentMessage as Record<string, unknown> | undefined)?.mimetype,
    (message.documentMessage as Record<string, unknown> | undefined)?.mimeType,
    (message.mediaMessage as Record<string, unknown> | undefined)?.mimetype,
    (message.mediaMessage as Record<string, unknown> | undefined)?.mimeType,
    message.mimetype,
    message.mimeType,
    message.contentType,
    value.mimetype,
    value.mimeType,
    value.contentType,
  );
  const messageTypeHint = String(
    (message.messageType as string | undefined) ??
      (message.mediatype as string | undefined) ??
      (message.mediaType as string | undefined) ??
      (message.type as string | undefined) ??
      (value.messageType as string | undefined) ??
      (value.mediatype as string | undefined) ??
      (value.mediaType as string | undefined) ??
      (value.type as string | undefined) ??
      "",
  ).toLowerCase();
  const mediaKind = inferMediaKindFromMimeOrUrl(mimeType, mediaUrl);

  if (
    message.imageMessage ||
    message.videoMessage ||
    message.stickerMessage ||
    mediaKind === "image" ||
    mediaKind === "video" ||
    messageTypeHint.includes("image") ||
    messageTypeHint.includes("video") ||
    messageTypeHint.includes("sticker")
  ) {
    return "media";
  }

  if (
    message.audioMessage ||
    mediaKind === "audio" ||
    messageTypeHint.includes("audio") ||
    messageTypeHint.includes("ptt") ||
    messageTypeHint.includes("voice")
  ) {
    return "audio";
  }
  if (
    message.documentMessage ||
    mediaKind === "document" ||
    messageTypeHint.includes("document") ||
    messageTypeHint.includes("file")
  ) {
    return "document";
  }
  if (message.pollCreationMessage) return "poll";
  if (message.listMessage || message.buttonsMessage) return "menu";
  if (message.contactMessage || message.contactsArrayMessage) return "contact";
  if (message.locationMessage) return "location";
  return "text";
}

function extractTimestamp(value: Record<string, unknown>) {
  const raw =
    (value.messageTimestamp as number | string | undefined) ??
    ((value as { data?: { messageTimestamp?: number | string } }).data?.messageTimestamp) ??
    Date.now() / 1000;

  const timestampNumber = typeof raw === "string" ? Number(raw) : raw;
  const normalizedTimestamp =
    typeof timestampNumber === "number" && Number.isFinite(timestampNumber)
      ? timestampNumber > 1e12
        ? timestampNumber
        : timestampNumber * 1000
      : Date.now();

  return new Date(normalizedTimestamp).toISOString();
}

function normalizeWebhookEventName(rawEventName: string) {
  const normalized = rawEventName.trim().toLowerCase();

  if (
    [
      "messages",
      "message",
      "message.upsert",
      "messages.upsert",
      "messages_upsert",
      "messages_set",
      "messages.set",
      "messages-set",
      "receive",
      "received",
      "incoming",
      "incoming_message",
      "new_message",
    ].includes(normalized)
  ) {
    return "MESSAGES_UPSERT";
  }

  if (
    [
      "messages_update",
      "message.update",
      "messages.update",
      "messages-update",
    ].includes(normalized)
  ) {
    return "MESSAGES_UPDATE";
  }

  if (
    [
      "qrcode.updated",
      "qrcode_updated",
      "qrcode",
      "qr",
    ].includes(normalized)
  ) {
    return "QRCODE_UPDATED";
  }

  if (
    [
      "connection",
      "instance.status",
      "status_instance",
      "connection_update",
      "connection.update",
    ].includes(normalized)
  ) {
    return "CONNECTION_UPDATE";
  }

  if (
    [
      "chats",
      "chat.upsert",
      "chat.update",
      "chat.set",
      "chats.upsert",
      "chats.update",
    ].includes(normalized)
  ) {
    return "CHATS_UPDATE";
  }

  return rawEventName || "UNKNOWN";
}

export function unwrapArray<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) {
    return payload as T[];
  }

  if (payload && typeof payload === "object") {
    const maybePayload = payload as Record<string, unknown>;
    if (Array.isArray(maybePayload.data)) return maybePayload.data as T[];
    if (Array.isArray(maybePayload.messages)) return maybePayload.messages as T[];
    if (Array.isArray(maybePayload.chats)) return maybePayload.chats as T[];
    if (Array.isArray(maybePayload.result)) return maybePayload.result as T[];
  }

  return [];
}

export function unwrapRecords(payload: unknown): Record<string, unknown>[] {
  const items = unwrapArray<Record<string, unknown>>(payload);
  if (items.length > 0) {
    return items;
  }

  if (payload && typeof payload === "object" && !Array.isArray(payload)) {
    return [payload as Record<string, unknown>];
  }

  return [];
}

/**
 * UAZAPI v1/v2 e proxies costumam aninhar o payload em `body`, `data` ou só `messages`.
 */
export function unwrapIncomingWebhookMessageRecords(payload: Record<string, unknown>): Record<string, unknown>[] {
  const body =
    payload.body && typeof payload.body === "object" && !Array.isArray(payload.body)
      ? (payload.body as Record<string, unknown>)
      : null;

  const pools: unknown[] = [
    payload.message,
    payload.messages,
    payload.event,
    payload.data,
    body?.message,
    body?.messages,
    body?.event,
    body?.data,
  ];

  for (const pool of pools) {
    const recs = unwrapRecords(pool);
    if (recs.length > 0) {
      return recs;
    }
  }

  return [];
}

export function normalizeWebhookEvent(payload: Record<string, unknown>) {
  const body =
    payload.body && typeof payload.body === "object" && !Array.isArray(payload.body)
      ? (payload.body as Record<string, unknown>)
      : null;

  const pickEventString = (): string => {
    const candidates: unknown[] = [
      payload.EventType,
      payload.event,
      payload.eventName,
      payload.type,
      payload.action,
      body?.EventType,
      body?.event,
      body?.eventName,
      body?.type,
      body?.action,
    ];
    for (const c of candidates) {
      if (typeof c === "string" && c.trim()) {
        return c.trim();
      }
    }
    return "";
  };

  const rawEventName = pickEventString();
  return normalizeWebhookEventName(rawEventName);
}

export async function getInstanceById(admin: AdminClient, instanceId: string) {
  const { data, error } = await admin
    .from("whatsapp_instances")
    .select("*")
    .eq("id", instanceId)
    .single();

  if (error || !data) {
    throw new Error("WhatsApp instance not found.");
  }

  if (data.archived_at) {
    throw new Error("WhatsApp instance archived.");
  }

  return data as InstanceRecord;
}

async function findCustomerByRemoteJid(admin: AdminClient, tenantId: string, remoteJid: string) {
  const normalized = normalizePhone(remoteJid);
  if (!normalized.digits) {
    return null;
  }

  const localDigits = normalized.digits.replace(/^55/, "");
  const { data } = await admin
    .from("customers")
    .select("id, nome")
    .eq("tenant_id", tenantId)
    .or(`phone_digits.eq.${normalized.digits},phone_digits.eq.${localDigits},phone_jid.eq.${normalized.jid}`)
    .order("updated_at", { ascending: false })
    .limit(1);

  return data?.[0] ?? null;
}

async function createCustomerFromRemoteJid(
  admin: AdminClient,
  tenantId: string,
  remoteJid: string,
  displayName?: string | null,
) {
  const normalized = normalizePhone(remoteJid);
  if (!normalized.digits) {
    return null;
  }

  const fallbackCode = normalized.digits.slice(-8) || crypto.randomUUID().slice(0, 8);
  const customerName = formatAutoCustomerName(normalized, displayName);

  const { data, error } = await admin
    .from("customers")
    .insert({
      tenant_id: tenantId,
      codigo: `WA-${fallbackCode}`,
      origem: "organico",
      nome: customerName,
      telefone: formatPhoneForCustomer(normalized),
      celular: formatPhoneForCustomer(normalized),
      phone_e164: normalized.e164,
      phone_digits: normalized.digits,
      phone_jid: normalized.jid,
      perfil: "B",
      rota: "",
      status: "ativo",
      email: "",
      cnpj: "",
      endereco: "",
      vendedor: "",
      ticket_medio: 0,
      frequencia_compra: "Sem historico",
      total_gasto: 0,
      canal: "whatsapp",
      ativo: true,
      cadastrado_em: new Date().toISOString(),
      source_columns: {
        auto_created: true,
        source: "whatsapp_inbox",
        remote_jid: remoteJid,
      },
    })
    .select("id, nome")
    .single();

  if (error) {
    if (error.code === "23505" || error.message.toLowerCase().includes("duplicate")) {
      return findCustomerByRemoteJid(admin, tenantId, remoteJid);
    }

    throw new Error(error.message);
  }

  return data;
}

export async function ensureChat(
  admin: AdminClient,
  instance: InstanceRecord,
  params: {
    remoteJid: string;
    displayName?: string;
    avatarUrl?: string | null;
    lastMessagePreview?: string | null;
    lastMessageAt?: string | null;
    unreadIncrement?: number;
    unreadCount?: number | null;
  },
) {
  const normalized = normalizePhone(params.remoteJid);
  let customer = await findCustomerByRemoteJid(admin, instance.tenant_id, params.remoteJid);
  if (!customer && normalized.digits) {
    customer = await createCustomerFromRemoteJid(
      admin,
      instance.tenant_id,
      params.remoteJid,
      params.displayName,
    );
  } else if (
    customer &&
    isMeaningfulDisplayName(params.displayName) &&
    !isMeaningfulDisplayName(customer.nome)
  ) {
    // Cliente foi criado com um nome ruim (telefone, "Sem nome" etc.) e agora
    // chegou um pushName real → atualizar para o nome melhor.
    const { data: updated } = await admin
      .from("customers")
      .update({ nome: String(params.displayName).trim() })
      .eq("id", customer.id)
      .select("id, nome")
      .single();
    if (updated) {
      customer = updated;
    }
  }

  const { data: existing } = await admin
    .from("whatsapp_chats")
    .select("*")
    .eq("tenant_id", instance.tenant_id)
    .eq("instance_id", instance.id)
    .eq("remote_jid", params.remoteJid)
    .maybeSingle();

  let defaultAiMode = "off";
  if (!existing) {
    const { data: settings } = await admin
      .from("tenant_settings")
      .select("default_ai_mode")
      .eq("tenant_id", instance.tenant_id)
      .maybeSingle();
    if (settings?.default_ai_mode) {
      defaultAiMode = String(settings.default_ai_mode);
    }
  }

  const payload = {
    tenant_id: instance.tenant_id,
    instance_id: instance.id,
    customer_id: customer?.id ?? null,
    remote_jid: params.remoteJid,
    remote_phone_digits: normalized.digits,
    remote_phone_e164: normalized.e164,
    display_name: pickBestDisplayName(
      customer?.nome,
      params.displayName,
      existing?.display_name,
    ) ?? "Sem nome",
    avatar_url: params.avatarUrl ?? existing?.avatar_url ?? null,
    last_message_preview: params.lastMessagePreview ?? existing?.last_message_preview ?? null,
    last_message_at: params.lastMessageAt ?? existing?.last_message_at ?? null,
    unread_count: params.unreadCount != null
      ? Math.max(0, Number(params.unreadCount))
      : Math.max(0, Number(existing?.unread_count ?? 0) + Number(params.unreadIncrement ?? 0)),
    status: "open",
    resolution: existing?.resolution ?? "open",
    ai_mode: existing?.ai_mode ?? defaultAiMode,
  };

  const { data, error } = await admin
    .from("whatsapp_chats")
    .upsert(payload, { onConflict: "tenant_id,instance_id,remote_jid" })
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function insertMessage(
  admin: AdminClient,
  instance: InstanceRecord,
  chatId: string,
  params: {
    uazapiMessageId?: string | null;
    campaignId?: string | null;
    campaignRecipientId?: string | null;
    direction: "inbound" | "outbound";
    messageType: string;
    status: string;
    bodyText?: string | null;
    mediaUrl?: string | null;
    payloadJson?: Record<string, unknown>;
    rawEvent?: Record<string, unknown> | null;
    quotedMessageId?: string | null;
    sentAt?: string | null;
    receivedAt?: string | null;
    actorType?: "human" | "ai" | "system";
  },
) {
  const { data, error } = await admin
    .from("whatsapp_messages")
    .insert({
      tenant_id: instance.tenant_id,
      instance_id: instance.id,
      chat_id: chatId,
      campaign_id: params.campaignId ?? null,
      campaign_recipient_id: params.campaignRecipientId ?? null,
      uazapi_message_id: params.uazapiMessageId ?? null,
      direction: params.direction,
      message_type: params.messageType,
      status: params.status,
      body_text: params.bodyText ?? null,
      media_url: params.mediaUrl ?? null,
      payload_json: params.payloadJson ?? {},
      raw_event: params.rawEvent ?? null,
      quoted_message_id: params.quotedMessageId ?? null,
      sent_at: params.sentAt ?? null,
      received_at: params.receivedAt ?? null,
      actor_type: params.actorType ?? "human",
    })
    .select("*")
    .single();

  if (error) {
    if (params.uazapiMessageId && error.message.includes("duplicate")) {
      const { data: existing } = await admin
        .from("whatsapp_messages")
        .select("*")
        .eq("instance_id", instance.id)
        .eq("uazapi_message_id", params.uazapiMessageId)
        .maybeSingle();

      return existing;
    }

    throw new Error(error.message);
  }

  return data;
}

/** Records an audit event for a campaign. Fire-and-forget safe (swallows errors). */
export async function logCampaignEvent(
  admin: AdminClient,
  tenantId: string,
  campaignId: string,
  eventType: string,
  details: Record<string, unknown> = {},
): Promise<void> {
  try {
    await admin.from("campaign_events").insert({
      tenant_id: tenantId,
      campaign_id: campaignId,
      event_type: eventType,
      details,
    });
  } catch {
    // audit log failure must never break the main flow
  }
}

/** Marks a customer as permanently opted out. */
async function markCustomerOptOut(
  admin: AdminClient,
  tenantId: string,
  remoteJid: string,
): Promise<void> {
  const normalized = normalizePhone(remoteJid);
  if (!normalized.digits) return;
  const localDigits = normalized.digits.replace(/^55/, "");

  await admin
    .from("customers")
    .update({ opt_out: true, opt_out_at: new Date().toISOString() })
    .eq("tenant_id", tenantId)
    .or(`phone_digits.eq.${normalized.digits},phone_digits.eq.${localDigits},phone_jid.eq.${normalized.jid}`)
    .eq("opt_out", false); // avoid unnecessary write if already opted out
}

/**
 * Incremento atomico dos contadores de campanha. Substitui `refreshCampaignStats`
 * no hot path do dispatcher (uma chamada por destinatario), usando a funcao SQL
 * `public.bump_campaign_counters`.
 *
 * Para metricas derivadas de `whatsapp_messages.status` (delivered/read), continue
 * usando `refreshCampaignStats`, pois transicoes nao sao monotonicas em delta.
 */
export async function bumpCampaignCounters(
  admin: AdminClient,
  campaignId: string,
  deltas: { sent?: number; failed?: number; responded?: number },
) {
  const { error } = await admin.rpc("bump_campaign_counters", {
    p_campaign_id: campaignId,
    p_sent_delta: deltas.sent ?? 0,
    p_failed_delta: deltas.failed ?? 0,
    p_responded_delta: deltas.responded ?? 0,
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function refreshCampaignStats(admin: AdminClient, campaignId: string) {
  const [{ data: recipients, error }, { data: msgStats }] = await Promise.all([
    admin
      .from("campaign_recipients")
      .select("status")
      .eq("campaign_id", campaignId),
    admin
      .from("whatsapp_messages")
      .select("status")
      .eq("campaign_id", campaignId)
      .eq("direction", "outbound"),
  ]);

  if (error) throw new Error(error.message);

  const total     = recipients?.length ?? 0;
  const sent      = recipients?.filter((r) => ["sent", "responded"].includes(r.status)).length ?? 0;
  const failed    = recipients?.filter((r) => r.status === "failed").length ?? 0;
  const responded = recipients?.filter((r) => r.status === "responded").length ?? 0;

  const delivered = msgStats?.filter((m) => ["delivered", "read"].includes(m.status)).length ?? 0;
  const read      = msgStats?.filter((m) => m.status === "read").length ?? 0;

  await admin
    .from("campaigns")
    .update({
      total_recipients: total,
      sent_count:       sent,
      failed_count:     failed,
      responded_count:  responded,
      delivered_count:  delivered,
      read_count:       read,
      status: total > 0 && sent + failed >= total ? "completed" : undefined,
    })
    .eq("id", campaignId);
}

export async function markCampaignAsResponded(
  admin: AdminClient,
  instance: InstanceRecord,
  remoteJid: string,
  chatId: string,
) {
  const { data: recipients } = await admin
    .from("campaign_recipients")
    .select("id, campaign_id")
    .eq("tenant_id", instance.tenant_id)
    .eq("phone_jid", remoteJid)
    .in("status", ["queued", "processing", "sent"]);

  if (!recipients?.length) {
    return;
  }

  const now = new Date().toISOString();
  const recipientIds = recipients.map((recipient) => recipient.id);
  const campaignIds = [...new Set(recipients.map((recipient) => recipient.campaign_id))];

  await admin
    .from("campaign_recipients")
    .update({
      status: "responded",
      chat_id: chatId,
      responded_at: now,
    })
    .in("id", recipientIds);

  await admin
    .from("followup_jobs")
    .update({
      status: "cancelled",
      executed_at: now,
      last_error: "Cancelado por resposta inbound do cliente.",
    })
    .in("campaign_recipient_id", recipientIds)
    .eq("status", "scheduled");

  for (const campaignId of campaignIds) {
    await refreshCampaignStats(admin, campaignId);
  }
}

async function sha256Hex(input: string): Promise<string> {
  const buffer = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", buffer);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export async function computeWebhookDedupeKey(
  eventName: string,
  payload: Record<string, unknown>,
): Promise<string> {
  const messages = unwrapIncomingWebhookMessageRecords(payload);

  const messageIds = messages
    .map((message) => extractMessageId(message) ?? "")
    .filter(Boolean)
    .sort()
    .join("|");

  if (messageIds) {
    return `${eventName}:${messageIds}`;
  }

  const eventPayload = payload.event && typeof payload.event === "object"
    ? (payload.event as Record<string, unknown>)
    : null;
  const messageIdsFromUpdate = Array.isArray(eventPayload?.MessageIDs)
    ? (eventPayload!.MessageIDs as unknown[]).map((value) => String(value)).filter(Boolean).sort().join("|")
    : "";

  if (messageIdsFromUpdate) {
    return `${eventName}:${messageIdsFromUpdate}:${String(payload.state ?? eventPayload?.Type ?? "")}`;
  }

  const stamp = String(
    payload.timestamp ??
      (payload.data as Record<string, unknown> | undefined)?.timestamp ??
      payload.updatedAt ??
      "",
  );
  return await sha256Hex(`${eventName}:${stamp}:${JSON.stringify(payload)}`);
}

export async function tryClaimWebhookDelivery(
  admin: AdminClient,
  tenantId: string,
  instanceId: string,
  eventName: string,
  payload: Record<string, unknown>,
): Promise<boolean> {
  const dedupeKey = await computeWebhookDedupeKey(eventName, payload);
  const { error } = await admin.from("webhook_delivery_dedupe").insert({
    tenant_id: tenantId,
    instance_id: instanceId,
    dedupe_key: dedupeKey,
  });

  if (!error) {
    return true;
  }

  if (error.code === "23505") {
    return false;
  }

  throw error;
}

export async function persistWebhookEvent(
  admin: AdminClient,
  instance: InstanceRecord,
  eventName: string,
  payload: Record<string, unknown>,
) {
  await admin.from("whatsapp_webhook_events").insert({
    tenant_id: instance.tenant_id,
    instance_id: instance.id,
    event_name: eventName,
    payload,
  });
}

export async function processInboundMessagePayload(
  admin: AdminClient,
  instance: InstanceRecord,
  payload: Record<string, unknown>,
) {
  return processMessagePayload(admin, instance, payload);
}

/**
 * Detecta URLs de midia entregues "cruas" pelo WhatsApp (criptografadas com
 * `mediaKey`). Essas nao podem ser exibidas no navegador — precisamos baixar
 * via uazapi (`/message/download`) que devolve o arquivo descriptografado.
 */
function isEncryptedWhatsappUrl(url: string | null | undefined) {
  if (typeof url !== "string") return false;
  if (!/^https?:\/\//i.test(url)) return false;
  const lower = url.toLowerCase();
  if (lower.includes("mmg.whatsapp.net")) return true;
  if (lower.endsWith(".enc")) return true;
  if (lower.includes(".enc?")) return true;
  if (lower.includes("mms3=true")) return true;
  return false;
}

function inferExtensionFromMime(mime: string | null | undefined) {
  if (!mime) return "bin";
  const lower = mime.toLowerCase();
  if (lower.includes("jpeg")) return "jpg";
  if (lower.includes("png")) return "png";
  if (lower.includes("webp")) return "webp";
  if (lower.includes("gif")) return "gif";
  if (lower.includes("mp4") || lower.includes("video/")) return "mp4";
  if (lower.includes("ogg") || lower.includes("opus")) return "ogg";
  if (lower.includes("mpeg") || lower.includes("audio/")) return "mp3";
  if (lower.includes("pdf")) return "pdf";
  if (lower.includes("csv")) return "csv";
  return "bin";
}

const MEDIA_BUCKET = "whatsapp-media";

function inferMediaKindFromHints(
  mimeType: string | null,
  messageType: string | null,
  mediaType: string | null,
): WhatsappMediaKind | null {
  const mime = String(mimeType ?? "").toLowerCase();
  if (mime.startsWith("audio/")) return "audio";
  if (mime.startsWith("video/")) return "video";
  if (mime.includes("webp") || mime.includes("sticker")) return "sticker";
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("application/") || mime.startsWith("text/")) return "document";

  const hint = `${messageType ?? ""} ${mediaType ?? ""}`.toLowerCase();
  if (hint.includes("sticker")) return "sticker";
  if (hint.includes("audio") || hint.includes("ptt") || hint.includes("voice")) return "audio";
  if (hint.includes("video") || hint.includes("ptv")) return "video";
  if (hint.includes("image")) return "image";
  if (hint.includes("document") || hint.includes("file")) return "document";

  return null;
}

/**
 * Tenta descriptografar localmente uma midia entregue pelo WhatsApp usando a
 * `mediaKey` que veio no payload. E o caminho preferido pois nao depende do
 * endpoint `/message/download` da uazapi (que pode estar instavel ou demorar
 * em arquivos grandes). Algoritmo identico ao usado pelo Baileys.
 */
async function tryLocalDecryptMedia(params: {
  mediaUrl: string;
  mediaKey: string;
  kind: WhatsappMediaKind;
}): Promise<Uint8Array | null> {
  try {
    return await fetchAndDecryptWhatsappMedia({
      encryptedUrl: params.mediaUrl,
      mediaKey: params.mediaKey,
      mediaKind: params.kind,
    });
  } catch (error) {
    console.error("tryLocalDecryptMedia: falhou", {
      kind: params.kind,
      reason: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

/**
 * Quando recebemos midia encriptada do WhatsApp, primeiro tentamos
 * descriptografar localmente (HKDF-SHA256 + AES-256-CBC com a `mediaKey`),
 * pois e o caminho mais rapido e nao depende do uazapi. Se falhar (mediaKey
 * ausente, payload corrompido), caimos para o endpoint `/message/download`
 * da uazapi como fallback. Em qualquer caso, salvamos no Storage publico e
 * devolvemos a URL para gravar em `media_url`.
 */
async function mirrorIncomingMediaToStorage(
  admin: AdminClient,
  instance: InstanceRecord,
  params: {
    messageId: string | null;
    mediaUrl: string | null;
    mediaKey: string | null;
    mediaKind: WhatsappMediaKind | null;
    mimeType: string | null;
    fileName: string | null;
  },
): Promise<{ publicUrl: string; mimeType: string | null; fileName: string | null } | null> {
  if (!params.messageId) return null;

  let bytes: Uint8Array | null = null;
  let resolvedMime: string | null = params.mimeType;
  let resolvedFileName: string | null = params.fileName;

  /* Tentativa 1 (preferida): descriptografia local com mediaKey + AES-CBC. */
  if (params.mediaUrl && params.mediaKey && params.mediaKind) {
    const decrypted = await tryLocalDecryptMedia({
      mediaUrl: params.mediaUrl,
      mediaKey: params.mediaKey,
      kind: params.mediaKind,
    });
    if (decrypted && decrypted.byteLength > 0) {
      bytes = decrypted;
    }
  }

  /* Tentativa 2: pedir o arquivo descriptografado a uazapi. */
  if (!bytes) {
    let download: UazapiMediaDownload | null = null;
    try {
      const apiKey = await decryptSecret(instance.encrypted_apikey);
      const config: UazapiInstanceConfig = {
        instanceName: instance.uazapi_instance_name,
        baseUrl: instance.uazapi_base_url,
        apiKey,
      };
      download = await downloadIncomingMediaFromUazapi(config, {
        messageId: params.messageId,
        mediaUrl: params.mediaUrl,
      });
    } catch (error) {
      console.error("mirrorIncomingMediaToStorage: uazapi download falhou", error);
    }
    if (download && download.bytes.byteLength > 0) {
      bytes = download.bytes;
      resolvedMime = download.mimeType ?? resolvedMime;
      resolvedFileName = download.fileName ?? resolvedFileName;
    }
  }

  if (!bytes || bytes.byteLength === 0) {
    return null;
  }

  const mime = resolvedMime ?? "application/octet-stream";
  const ext = inferExtensionFromMime(mime);
  const safeName = (resolvedFileName ?? params.messageId)
    .replace(/[^A-Za-z0-9._-]+/g, "_")
    .slice(0, 80) || params.messageId;
  const path = `${instance.tenant_id}/${instance.id}/${params.messageId}-${safeName}.${ext}`;

  const { error: uploadError } = await admin.storage
    .from(MEDIA_BUCKET)
    .upload(path, bytes, {
      contentType: mime,
      upsert: true,
    });

  if (uploadError) {
    console.error("mirrorIncomingMediaToStorage: upload falhou", uploadError);
    return null;
  }

  const { data } = admin.storage.from(MEDIA_BUCKET).getPublicUrl(path);
  if (!data?.publicUrl) {
    return null;
  }

  return {
    publicUrl: data.publicUrl,
    mimeType: mime,
    fileName: resolvedFileName,
  };
}

export async function processMessagePayload(
  admin: AdminClient,
  instance: InstanceRecord,
  payload: Record<string, unknown>,
) {
  const remoteJid = extractRemoteJid(payload);
  if (!isPersonalRemoteJid(remoteJid)) {
    return null;
  }

  const direction = extractDirection(payload);
  const bodyText = extractBodyText(payload);
  const occurredAt = extractTimestamp(payload);
  const chat = await ensureChat(admin, instance, {
    remoteJid,
    displayName: extractDisplayName(payload),
    avatarUrl: typeof payload.imagePreview === "string" ? payload.imagePreview : null,
    lastMessagePreview: bodyText,
    lastMessageAt: occurredAt,
    unreadIncrement: direction === "inbound" ? 1 : 0,
  });

  const normalizedMediaMeta = extractNormalizedMediaMeta(payload);
  const payloadJson: Record<string, unknown> = {
    ...payload,
    ...normalizedMediaMeta,
  };

  const messageId = extractMessageId(payload);
  let mediaUrl = extractMediaUrl(payload);

  /* Se recebemos midia encriptada do WhatsApp (uazapi v2 entrega URL crua
   * em `content.URL`), descriptografamos localmente (preferencia) ou via
   * uazapi (fallback) e copiamos para o Storage publico, para que o Inbox
   * consiga exibir inline. */
  if (direction === "inbound" && isEncryptedWhatsappUrl(mediaUrl)) {
    const messageBlock = getMessageLikeBlock(payload);
    const v2Content =
      messageBlock.content && typeof messageBlock.content === "object"
        ? (messageBlock.content as Record<string, unknown>)
        : null;
    const mediaKey =
      (v2Content?.mediaKey as string | undefined) ??
      (messageBlock.mediaKey as string | undefined) ??
      null;
    const messageTypeHint =
      (messageBlock.messageType as string | undefined) ??
      (messageBlock.mediaType as string | undefined) ??
      null;
    const mediaTypeHint =
      (messageBlock.mediaType as string | undefined) ?? null;
    const mimeFromMeta =
      (normalizedMediaMeta.mimeType as string | null) ??
      (v2Content?.mimetype as string | undefined) ??
      null;
    const fileNameFromMeta =
      (normalizedMediaMeta.fileName as string | null) ??
      (v2Content?.fileName as string | undefined) ??
      null;
    const kind = inferMediaKindFromHints(mimeFromMeta, messageTypeHint, mediaTypeHint);

    const mirrored = await mirrorIncomingMediaToStorage(admin, instance, {
      messageId,
      mediaUrl,
      mediaKey,
      mediaKind: kind,
      mimeType: mimeFromMeta,
      fileName: fileNameFromMeta,
    });
    if (mirrored) {
      payloadJson.mirroredMediaUrl = mirrored.publicUrl;
      payloadJson.mirroredFromUrl = mediaUrl;
      if (mirrored.mimeType && !payloadJson.mimeType) {
        payloadJson.mimeType = mirrored.mimeType;
      }
      if (mirrored.fileName && !payloadJson.fileName) {
        payloadJson.fileName = mirrored.fileName;
      }
      mediaUrl = mirrored.publicUrl;
    }
  }

  const message = await insertMessage(admin, instance, chat.id, {
    uazapiMessageId: messageId ?? undefined,
    direction,
    messageType: detectMessageType(payload),
    status: direction === "inbound" ? "received" : "sent",
    bodyText,
    mediaUrl,
    payloadJson,
    rawEvent: payload,
    sentAt: direction === "outbound" ? occurredAt : null,
    receivedAt: direction === "inbound" ? occurredAt : null,
  });

  if (direction === "inbound") {
    await markCampaignAsResponded(admin, instance, remoteJid, chat.id);

    // Permanent opt-out: if customer explicitly requests removal, flag them
    const normalizedText = bodyText.toLowerCase().trim();
    const isOptOut = OPT_OUT_KEYWORDS.some(
      (kw) => normalizedText === kw || normalizedText.startsWith(kw + " ") || normalizedText.endsWith(" " + kw),
    );
    if (isOptOut) {
      await markCustomerOptOut(admin, instance.tenant_id, remoteJid);
    }

    await ensureLeadFromChat(admin, chat.id);
    await notifyN8nInbound(admin, instance, chat, message, bodyText);
  }

  return { chat, message };
}

/** Links chat to CRM negotiation (create if needed). */
export async function ensureLeadFromChat(admin: AdminClient, chatId: string) {
  try {
    const chatRow = await admin
      .from("whatsapp_chats")
      .select("tenant_id, customer_id")
      .eq("id", chatId)
      .single();

    if (!chatRow.data?.customer_id) {
      return null;
    }

    const { data: settings } = await admin
      .from("tenant_settings")
      .select("auto_lead_on_inbound, auto_assign_on_lead")
      .eq("tenant_id", chatRow.data.tenant_id)
      .maybeSingle();

    const autoLead = settings?.auto_lead_on_inbound !== false;
    if (!autoLead) {
      return null;
    }

    const autoAssign = settings?.auto_assign_on_lead === true;

    const { data, error } = await admin.rpc("ensure_lead_from_chat", {
      p_chat_id: chatId,
      p_auto_assign: autoAssign,
    });

    if (error) {
      console.error("ensure_lead_from_chat:", error.message);
      return null;
    }

    return data as string | null;
  } catch (err) {
    console.error("ensureLeadFromChat:", err);
    return null;
  }
}

async function hmacSign(secret: string, body: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(body));
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** POST inbound context to n8n when integration enabled and AI may reply. */
export async function notifyN8nInbound(
  admin: AdminClient,
  instance: InstanceRecord,
  chat: Record<string, unknown>,
  message: Record<string, unknown> | null,
  bodyText: string,
) {
  try {
    const tenantId = instance.tenant_id;
    const chatId = String(chat.id ?? "");

    const { data: integration } = await admin
      .from("tenant_integrations")
      .select("n8n_webhook_url, n8n_secret, n8n_enabled")
      .eq("tenant_id", tenantId)
      .maybeSingle();

    if (!integration?.n8n_enabled || !integration.n8n_webhook_url) {
      return;
    }

    const { data: recentMessages } = await admin
      .from("whatsapp_messages")
      .select("direction, body_text, created_at, actor_type")
      .eq("chat_id", chatId)
      .order("created_at", { ascending: false })
      .limit(12);

    const { data: negotiation } = chat.primary_negotiation_id
      ? await admin
        .from("crm_negotiations")
        .select("id, funnel_id, stage_id, status, title, assignee_id")
        .eq("id", chat.primary_negotiation_id as string)
        .maybeSingle()
      : { data: null };

    const { data: customer } = chat.customer_id
      ? await admin
        .from("customers")
        .select("id, nome, seller_id, opt_out, source_columns")
        .eq("id", chat.customer_id as string)
        .maybeSingle()
      : { data: null };

    const customerOptOut = Boolean(
      (customer as { opt_out?: boolean } | null)?.opt_out ??
        (chat.customers as { opt_out?: boolean } | null | undefined)?.opt_out,
    );

    const aiEligibility = evaluateAiReplyEligibility({
      aiMode: String(chat.ai_mode ?? "off"),
      chatAssigneeId: chat.assignee_id as string | null | undefined,
      negotiationAssigneeId: negotiation?.assignee_id as string | null | undefined,
      negotiationStatus: negotiation?.status as string | null | undefined,
      negotiationStageId: negotiation?.stage_id as string | null | undefined,
      customerOptOut,
    });

    if (!aiEligibility.allowed) {
      return;
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const payload = {
      event: "message.inbound",
      tenant_id: tenantId,
      chat_id: chatId,
      instance_id: instance.id,
      ai: {
        mode: aiEligibility.aiMode,
        may_reply: true,
        block_reason: null,
      },
      customer: customer
        ? {
          id: customer.id,
          nome: customer.nome,
          seller_id: customer.seller_id,
          opt_out: customerOptOut,
          tags: customer.source_columns?.wchat_customer_tags ?? [],
        }
        : null,
      negotiation: negotiation
        ? {
          id: negotiation.id,
          funnel_id: negotiation.funnel_id,
          stage_id: negotiation.stage_id,
          status: negotiation.status,
          title: negotiation.title,
          assignee_id: negotiation.assignee_id,
        }
        : null,
      messages: (recentMessages ?? []).reverse().map((m) => ({
        direction: m.direction,
        body_text: m.body_text,
        at: m.created_at,
        actor_type: m.actor_type,
      })),
      latest_message: {
        id: message?.id,
        body_text: bodyText,
      },
      reply_url: `${supabaseUrl}/functions/v1/n8n-reply`,
    };

    const body = JSON.stringify(payload);
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (integration.n8n_secret) {
      headers["X-WChat-Signature"] = await hmacSign(integration.n8n_secret, body);
    }

    const res = await fetch(integration.n8n_webhook_url, {
      method: "POST",
      headers,
      body,
    });

    if (!res.ok) {
      console.error("notifyN8nInbound:", res.status, await res.text());
    }
  } catch (err) {
    console.error("notifyN8nInbound:", err);
  }
}
