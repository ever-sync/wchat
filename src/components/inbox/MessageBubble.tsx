import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AlertCircle, Check, CheckCheck, FileText, RotateCcw } from "lucide-react";
import { memo, useState } from "react";
import { ConversationAvatar } from "@/components/inbox/ConversationAvatar";
import { getInboxMessagePreviewText } from "@/lib/inboxMessageBody";
import { resolveInboxAttachmentPresentation } from "@/lib/inboxMessageMedia";
import { isMetaCdnLikelyToBlockInlineEmbed } from "@/lib/restricted-media-hosts";
import { cn } from "@/lib/utils";
import type { WhatsappMessage } from "@/types/domain";

function formatMessageTime(value?: string | null) {
  if (!value) {
    return "";
  }

  return format(new Date(value), "HH:mm", { locale: ptBR });
}

function getOutboundStatusMeta(status: WhatsappMessage["status"]) {
  switch (status) {
    case "queued":
    case "sent":
      return { label: "Na fila", icon: Check, className: "text-primary-foreground/70" };
    case "delivered":
      return { label: "Entregue", icon: CheckCheck, className: "text-primary-foreground/70" };
    case "read":
      return { label: "Lida", icon: CheckCheck, className: "text-primary-foreground" };
    case "failed":
      return { label: "Falha no envio", icon: AlertCircle, className: "text-red-200" };
    default:
      return { label: "Recebida", icon: CheckCheck, className: "text-primary-foreground/70" };
  }
}

function MessageAttachment({
  presentation,
  isOutbound,
}: {
  presentation: NonNullable<ReturnType<typeof resolveInboxAttachmentPresentation>>;
  isOutbound: boolean;
}) {
  const [mediaBlocked, setMediaBlocked] = useState(false);
  const cardClass = isOutbound
    ? "border-primary-foreground/25 bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/15"
    : "border-border bg-muted text-foreground hover:bg-wchat-100";

  if (mediaBlocked || isMetaCdnLikelyToBlockInlineEmbed(presentation.url)) {
    return (
      <a
        href={presentation.url}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          "flex min-w-0 items-center gap-3 rounded-xl border px-3 py-2.5 text-left text-sm font-medium transition-colors",
          cardClass,
        )}
      >
        <FileText className="h-5 w-5 shrink-0 opacity-90" />
        <span className="min-w-0 flex-1 truncate">
          {isMetaCdnLikelyToBlockInlineEmbed(presentation.url) && !mediaBlocked
            ? "Preview bloqueado pela rede Meta no navegador. Abra o link para ver."
            : "Midia indisponivel no preview. Clique para tentar abrir."}
        </span>
        <span className="shrink-0 text-xs underline underline-offset-2">Abrir</span>
      </a>
    );
  }

  switch (presentation.kind) {
    case "image":
      return (
        <a
          href={presentation.url}
          target="_blank"
          rel="noopener noreferrer"
          className="block overflow-hidden rounded-xl"
        >
          <img
            src={presentation.url}
            alt=""
            loading="lazy"
            className="max-h-64 w-full max-w-[min(100%,320px)] object-contain"
            onError={() => setMediaBlocked(true)}
          />
        </a>
      );
    case "video":
      return (
        <video
          controls
          src={presentation.url}
          className="max-h-64 w-full max-w-[min(100%,320px)] rounded-xl"
          preload="metadata"
          onError={() => setMediaBlocked(true)}
        />
      );
    case "audio":
      return (
        <audio
          controls
          src={presentation.url}
          className={cn("h-10 w-[min(70vw,320px)] max-w-full", isOutbound ? "opacity-95" : "")}
          onError={() => setMediaBlocked(true)}
        />
      );
    case "document":
      return (
        <a
          href={presentation.url}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            "flex min-w-0 items-center gap-3 rounded-xl border px-3 py-2.5 text-left text-sm font-medium transition-colors",
            cardClass,
          )}
        >
          <FileText className="h-5 w-5 shrink-0 opacity-90" />
          <span className="min-w-0 flex-1 truncate">{presentation.label}</span>
          <span className="shrink-0 text-xs underline underline-offset-2">Abrir</span>
        </a>
      );
    default:
      return null;
  }
}

type MessageBubbleProps = {
  message: WhatsappMessage;
  activeChatName: string;
  activeChatAvatarUrl?: string | null;
  /** Acionado quando o usuario clica "Reenviar" em uma mensagem com status failed. */
  onRetry?: (message: WhatsappMessage) => void;
  retryPending?: boolean;
};

/** Cauda das bolhas (tema claro wChat). */
function BubbleTail({ outbound }: { outbound: boolean }) {
  if (outbound) {
    return (
      <svg
        className="pointer-events-none absolute bottom-0 right-[-5px] z-[2]"
        width="11"
        height="18"
        viewBox="0 0 11 18"
        aria-hidden
      >
        <path d="M11 17.8V0s-9.4 2.85-11 17.65" fill="#4E1BB1" className="drop-shadow-none" />
      </svg>
    );
  }
  return (
    <svg
      className="pointer-events-none absolute bottom-0 left-[-6px] z-0"
      width="11"
      height="18"
      viewBox="0 0 11 18"
      aria-hidden
    >
      <path d="M0 17.8V0s9.9 3.05 11 17.85" fill="#FFFFFF" />
    </svg>
  );
}

function MessageBubbleImpl({
  message,
  activeChatName,
  activeChatAvatarUrl,
  onRetry,
  retryPending = false,
}: MessageBubbleProps) {
  const isOutbound = message.direction === "outbound";
  const timestamp = message.createdAt ?? message.sentAt ?? message.receivedAt ?? null;
  const presentation = resolveInboxAttachmentPresentation(message);
  const outboundStatus = getOutboundStatusMeta(message.status);

  const rawBody = message.bodyText?.trim();
  const caption =
    rawBody && rawBody !== message.mediaUrl?.trim()
      ? getInboxMessagePreviewText(message)
      : null;

  const bodyText =
    presentation && !caption ? null : caption ?? (!presentation ? getInboxMessagePreviewText(message) : null);

  return (
    <div className={cn("flex gap-2", isOutbound ? "justify-end pr-2" : "justify-start pl-2")}>
      {!isOutbound ? (
        <div className="shrink-0 pt-1">
          <ConversationAvatar name={activeChatName} avatarUrl={activeChatAvatarUrl} />
        </div>
      ) : null}

      <div className={cn("max-w-[min(560px,calc(100%-52px))] min-w-0", isOutbound ? "items-end" : "items-start", "flex flex-col")}>
        {!isOutbound ? (
          <div className="mb-0.5 flex max-w-full items-center gap-2 px-0.5">
            <span className="truncate text-[12.8px] font-medium text-muted-foreground">{activeChatName}</span>
            <span className="shrink-0 text-[11.5px] font-medium tabular-nums text-muted-foreground">
              {formatMessageTime(timestamp)}
            </span>
          </div>
        ) : null}

        <div
          className={cn(
            "relative inline-block max-w-full overflow-visible align-top",
            isOutbound ? "ml-auto" : "",
          )}
        >
          {!isOutbound ? <BubbleTail outbound={false} /> : null}
          <div
            className={cn(
              "relative z-[1] min-w-[52px] rounded-lg px-2.5 py-1.5 text-[14.2px] leading-[1.47] shadow-[0_1px_0.5px_rgba(0,0,0,0.13)]",
              isOutbound
                ? "rounded-br-md bg-primary text-primary-foreground"
                : "rounded-bl-md border border-border bg-card text-foreground",
            )}
          >
            <div className="flex flex-col gap-2">
              {presentation ? (
                <MessageAttachment presentation={presentation} isOutbound={isOutbound} />
              ) : null}
              {bodyText ? <p className="whitespace-pre-wrap break-words">{bodyText}</p> : null}
            </div>

            {isOutbound ? (
              <div className="-mb-px mt-px flex flex-wrap items-center justify-end gap-1">
                {message.status === "failed" && onRetry ? (
                  <button
                    type="button"
                    onClick={() => onRetry(message)}
                    disabled={retryPending}
                    className="mr-2 inline-flex items-center gap-1 rounded-md border border-white/35 bg-black/25 px-2 py-0.5 text-[10px] font-semibold text-white transition-colors hover:bg-black/35 disabled:opacity-60"
                    title="Tentar enviar de novo"
                  >
                    <RotateCcw className={cn("h-3 w-3", retryPending && "animate-spin")} />
                    Reenviar
                  </button>
                ) : null}
                <span className="text-[11px] font-medium tabular-nums text-primary-foreground/80">
                  {formatMessageTime(timestamp)}
                </span>
                {message.status !== "failed" ? (
                  <outboundStatus.icon className={cn("h-4 w-4 shrink-0", outboundStatus.className)} />
                ) : (
                  <AlertCircle className="h-4 w-4 shrink-0 text-[#ffb4b4]" />
                )}
              </div>
            ) : null}
          </div>
          {isOutbound ? <BubbleTail outbound /> : null}
        </div>
      </div>
    </div>
  );
}

/**
 * Memoizado: em chats longos, qualquer mudanca no array `messages` (ex.: inbound
 * realtime) reconciliava todas as bolhas. Como `setQueryData` mantem a referencia
 * das mensagens nao alteradas, o comparador padrao do React (Object.is por prop)
 * evita renders desnecessarios. Comparamos explicitamente os campos visiveis na
 * UI para nao depender da identidade do objeto sob refetches que recriam objetos.
 */
function arePropsEqual(prev: MessageBubbleProps, next: MessageBubbleProps) {
  if (prev.activeChatName !== next.activeChatName) return false;
  if (prev.activeChatAvatarUrl !== next.activeChatAvatarUrl) return false;
  if (prev.onRetry !== next.onRetry) return false;
  if (prev.retryPending !== next.retryPending) return false;
  const a = prev.message;
  const b = next.message;
  if (a === b) return true;
  return (
    a.id === b.id &&
    a.status === b.status &&
    a.bodyText === b.bodyText &&
    a.mediaUrl === b.mediaUrl &&
    a.direction === b.direction &&
    a.messageType === b.messageType &&
    a.sentAt === b.sentAt &&
    a.createdAt === b.createdAt &&
    a.receivedAt === b.receivedAt
  );
}

export const MessageBubble = memo(MessageBubbleImpl, arePropsEqual);
