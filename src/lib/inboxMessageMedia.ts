import type { WhatsappMessage } from "@/types/domain";

export type InboxAttachmentPresentation =
  | { kind: "image"; url: string }
  | { kind: "video"; url: string }
  | { kind: "audio"; url: string }
  | { kind: "document"; url: string; label: string };

/**
 * Identifica URLs de midia entregues "cruas" pelo WhatsApp — sao criptografadas
 * com `mediaKey` e nao podem ser exibidas no navegador. O backend deveria ter
 * baixado via uazapi e copiado para o bucket publico, mas mensagens antigas
 * ainda podem conter essa URL no `media_url`.
 */
export function isEncryptedWhatsappMediaUrl(url: string | null | undefined): boolean {
  if (typeof url !== "string") return false;
  const lower = url.toLowerCase();
  if (!lower.startsWith("http://") && !lower.startsWith("https://")) return false;
  if (lower.includes("mmg.whatsapp.net")) return true;
  if (lower.endsWith(".enc")) return true;
  if (lower.includes(".enc?")) return true;
  if (lower.includes("mms3=true")) return true;
  return false;
}

function isAllowedMediaUrl(url: string): boolean {
  const t = url.trim();
  if (!t) {
    return false;
  }

  /* URLs cruas do WhatsApp sao criptografadas — nao adianta tentar carregar. */
  if (isEncryptedWhatsappMediaUrl(t)) {
    return false;
  }

  if (t.startsWith("data:image/")) {
    return true;
  }
  if (t.startsWith("data:video/") || t.startsWith("data:audio/")) {
    return true;
  }
  if (t.startsWith("/")) {
    return true;
  }
  if (t.startsWith("storage/v1/")) {
    return true;
  }
  if (t.startsWith("whatsapp-media/")) {
    return true;
  }
  if (/^[a-f0-9-]{36}\//i.test(t)) {
    return true;
  }

  try {
    const parsed = new URL(t);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

function extensionHint(url: string): string {
  const path = url.split("?")[0].toLowerCase();
  const dot = path.lastIndexOf(".");
  return dot >= 0 ? path.slice(dot) : "";
}

function normalizeAttachmentUrl(rawUrl: string): string {
  const url = rawUrl.trim();
  const env = (import.meta as ImportMeta & { env?: Record<string, string> }).env ?? {};
  const supabaseUrl = String(env.VITE_SUPABASE_URL ?? "").replace(/\/+$/, "");

  if (url.startsWith("/storage/v1/") && supabaseUrl) {
    return `${supabaseUrl}${url}`;
  }

  if (url.startsWith("storage/v1/") && supabaseUrl) {
    return `${supabaseUrl}/${url}`;
  }

  if (url.startsWith("whatsapp-media/") && supabaseUrl) {
    return `${supabaseUrl}/storage/v1/object/public/${url}`;
  }

  if (/^[a-f0-9-]{36}\//i.test(url) && supabaseUrl) {
    return `${supabaseUrl}/storage/v1/object/public/whatsapp-media/${url}`;
  }

  return url;
}

function inferKindFromMimeOrUrl(
  mimeType: string | null | undefined,
  url: string,
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

  const ext = extensionHint(url);
  if (/\.(jpe?g|png|gif|webp|bmp|svg)$/i.test(ext) || url.startsWith("data:image/")) return "image";
  if (/\.(mp4|webm|ogg|mov|m4v)$/i.test(ext) || url.startsWith("data:video/")) return "video";
  if (/\.(mp3|wav|m4a|aac|opus|oga)$/i.test(ext) || url.startsWith("data:audio/")) return "audio";
  if (/\.(pdf|doc|docx|xls|xlsx|csv|zip|rar|ppt|pptx|txt)$/i.test(ext)) return "document";

  return null;
}

function fileNameFromPayload(message: WhatsappMessage): string | undefined {
  const candidates = [message.payloadJson, message.rawEvent];
  for (const payload of candidates) {
    if (!payload || typeof payload !== "object") {
      continue;
    }

    const record = payload as Record<string, unknown>;
    for (const key of ["fileName", "filename", "name", "title"] as const) {
      const value = record[key];
      if (typeof value === "string" && value.trim()) {
        return value.trim();
      }
    }
  }

  return undefined;
}

function isHttpOrDataUrl(value: string) {
  if (value.startsWith("http://") || value.startsWith("https://")) return true;
  if (
    value.startsWith("data:image/") ||
    value.startsWith("data:video/") ||
    value.startsWith("data:audio/")
  ) {
    return true;
  }
  return false;
}

function findAttachmentUrl(payload: Record<string, unknown> | null | undefined): string | undefined {
  if (!payload || typeof payload !== "object") {
    return undefined;
  }

  const message = payload.message as Record<string, unknown> | undefined;
  /* uazapi v2 entrega midia em `message.content` que e um objeto com `URL`,
   * `mimetype`, `fileName`, `mediaKey` etc. */
  const v2Content =
    message?.content && typeof message.content === "object" && !Array.isArray(message.content)
      ? (message.content as Record<string, unknown>)
      : undefined;
  const nested = [
    payload,
    message,
    v2Content,
    message?.imageMessage as Record<string, unknown> | undefined,
    message?.videoMessage as Record<string, unknown> | undefined,
    message?.audioMessage as Record<string, unknown> | undefined,
    message?.documentMessage as Record<string, unknown> | undefined,
    message?.stickerMessage as Record<string, unknown> | undefined,
    message?.mediaMessage as Record<string, unknown> | undefined,
    payload.media as Record<string, unknown> | undefined,
    message?.media as Record<string, unknown> | undefined,
  ].filter((entry): entry is Record<string, unknown> => Boolean(entry) && typeof entry === "object");

  /* Inclui campos comuns do uazapi v2: `URL` (maiusculo), `content`, `fileURL`,
   * `image`, `video`, `audio`, `document`, `sticker`, `body`. Tambem
   * `mirroredMediaUrl` quando o webhook ja salvou a midia no Storage. */
  const KEYS = [
    "mirroredMediaUrl",
    "publicUrl",
    "URL",
    "mediaUrl",
    "url",
    "fileUrl",
    "fileURL",
    "downloadUrl",
    "directUrl",
    "directURL",
    "directPath",
    "content",
    "image",
    "video",
    "audio",
    "document",
    "sticker",
    "body",
  ] as const;

  for (const entry of nested) {
    for (const key of KEYS) {
      const value = entry[key];
      if (typeof value === "string") {
        const trimmed = value.trim();
        if (trimmed && isHttpOrDataUrl(trimmed)) {
          return trimmed;
        }
      }
    }
  }

  return undefined;
}

function findAttachmentMimeType(payload: Record<string, unknown> | null | undefined): string | undefined {
  if (!payload || typeof payload !== "object") {
    return undefined;
  }

  const message = payload.message as Record<string, unknown> | undefined;
  const v2Content =
    message?.content && typeof message.content === "object" && !Array.isArray(message.content)
      ? (message.content as Record<string, unknown>)
      : undefined;
  const nested = [
    payload,
    message,
    v2Content,
    message?.imageMessage as Record<string, unknown> | undefined,
    message?.videoMessage as Record<string, unknown> | undefined,
    message?.audioMessage as Record<string, unknown> | undefined,
    message?.documentMessage as Record<string, unknown> | undefined,
    message?.stickerMessage as Record<string, unknown> | undefined,
    message?.mediaMessage as Record<string, unknown> | undefined,
    payload.media as Record<string, unknown> | undefined,
    message?.media as Record<string, unknown> | undefined,
  ].filter((entry): entry is Record<string, unknown> => Boolean(entry) && typeof entry === "object");

  for (const entry of nested) {
    for (const key of ["mimeType", "mimetype", "contentType"] as const) {
      const value = entry[key];
      if (typeof value === "string" && value.trim()) {
        return value.trim();
      }
    }
  }

  /* Heuristica final: usar `messageType`/`mediaType`/`type` como pista. */
  for (const entry of nested) {
    const hint = String(
      (entry.messageType as string | undefined) ??
        (entry.mediaType as string | undefined) ??
        (entry.mediatype as string | undefined) ??
        (entry.type as string | undefined) ??
        "",
    ).toLowerCase();
    if (hint.includes("image") || hint.includes("sticker")) return "image/*";
    if (hint.includes("video")) return "video/*";
    if (hint.includes("audio") || hint.includes("ptt") || hint.includes("voice")) return "audio/*";
    if (hint.includes("document") || hint.includes("file")) return "application/octet-stream";
  }

  return undefined;
}

function fileNameFromUrl(url: string): string {
  try {
    const pathOnly = url.split("?")[0];
    const segment = pathOnly.split("/").filter(Boolean).pop() ?? "documento";
    return decodeURIComponent(segment).slice(0, 120) || "documento";
  } catch {
    return "documento";
  }
}

/**
 * Decide como renderizar anexo no balão (imagem/vídeo/áudio/documento).
 */
export function resolveInboxAttachmentPresentation(
  message: WhatsappMessage,
): InboxAttachmentPresentation | null {
  const rawUrl =
    message.mediaUrl?.trim() ||
    findAttachmentUrl(message.rawEvent) ||
    findAttachmentUrl(message.payloadJson);
  if (!rawUrl) {
    return null;
  }

  const url = normalizeAttachmentUrl(rawUrl);
  if (!isAllowedMediaUrl(url)) {
    return null;
  }

  const inferredKind =
    inferKindFromMimeOrUrl(findAttachmentMimeType(message.rawEvent), url) ??
    inferKindFromMimeOrUrl(findAttachmentMimeType(message.payloadJson), url);
  const fromPayload = fileNameFromPayload(message);
  const docLabel = fromPayload || fileNameFromUrl(url);

  if (message.messageType === "audio") {
    return { kind: "audio", url };
  }

  if (message.messageType === "document") {
    return { kind: "document", url, label: docLabel };
  }

  if (message.messageType === "media") {
    if (inferredKind === "video") return { kind: "video", url };
    if (inferredKind === "audio") return { kind: "audio", url };
    if (inferredKind === "image") return { kind: "image", url };
    if (inferredKind === "document") {
      return { kind: "document", url, label: docLabel };
    }

    return { kind: "document", url, label: docLabel };
  }

  // Defensive fallback: some providers persist media URLs with a non-media message type.
  if (inferredKind === "image") return { kind: "image", url };
  if (inferredKind === "video") return { kind: "video", url };
  if (inferredKind === "audio") return { kind: "audio", url };
  if (inferredKind === "document") return { kind: "document", url, label: docLabel };

  // Último fallback: se existe URL de mídia válida, sempre mostrar ao menos link de documento.
  return { kind: "document", url, label: docLabel };
}
