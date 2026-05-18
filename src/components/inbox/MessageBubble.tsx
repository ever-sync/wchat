import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AlertCircle, FileText, RotateCcw } from "lucide-react";
import { memo, useState } from "react";
import type { BubbleGroupPosition } from "@/lib/inboxMessageGroups";
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

function bubbleShellRadius(isOutbound: boolean, position: BubbleGroupPosition): string {
  const base = "rounded-[14px]";
  if (isOutbound) {
    switch (position) {
      case "middle":
        return `${base} rounded-tr-[5px] rounded-br-[5px]`;
      case "last":
        return `${base} rounded-tr-[5px] rounded-br-[5px]`;
      default:
        return `${base} rounded-br-[5px]`;
    }
  }

  switch (position) {
    case "middle":
      return `${base} rounded-tl-[5px] rounded-bl-[5px]`;
    case "last":
      return `${base} rounded-tl-[5px] rounded-bl-[5px]`;
    default:
      return `${base} rounded-bl-[5px]`;
  }
}

function showBubbleTail(position: BubbleGroupPosition): boolean {
  return position === "single" || position === "last";
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

  if (mediaBlocked) {
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
          {isMetaCdnLikelyToBlockInlineEmbed(presentation.url)
            ? "Não foi possível exibir aqui. Abra o link para ver a mídia."
            : "Mídia indisponível no preview. Clique para tentar abrir."}
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
          className="block overflow-hidden rounded-lg"
        >
          <img
            src={presentation.url}
            alt=""
            loading="lazy"
            referrerPolicy="no-referrer"
            className="max-h-64 w-full max-w-[min(100%,300px)] object-contain"
            onError={() => setMediaBlocked(true)}
          />
        </a>
      );
    case "video":
      return (
        <video
          controls
          src={presentation.url}
          className="max-h-64 w-full max-w-[min(100%,300px)] rounded-lg"
          preload="metadata"
          onError={() => setMediaBlocked(true)}
        />
      );
    case "audio":
      return (
        <audio
          controls
          src={presentation.url}
          className={cn("h-10 w-[min(70vw,300px)] max-w-full", isOutbound ? "opacity-95" : "")}
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
            "flex min-w-0 items-center gap-3 rounded-lg border px-3 py-2.5 text-left text-sm font-medium transition-colors",
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
  groupPosition?: BubbleGroupPosition;
  activeChatName: string;
  onRetry?: (message: WhatsappMessage) => void;
  retryPending?: boolean;
};

function BubbleTail({ outbound }: { outbound: boolean }) {
  if (outbound) {
    return (
      <svg
        className="pointer-events-none absolute -bottom-px right-[-7px] z-[2] text-primary"
        width="9"
        height="13"
        viewBox="0 0 9 13"
        aria-hidden
      >
        <path d="M9 13H0c4.5-1.2 8.2-5.4 9-13z" fill="currentColor" />
      </svg>
    );
  }

  return (
    <svg
      className="pointer-events-none absolute -bottom-px left-[-7px] z-[2] text-card"
      width="9"
      height="13"
      viewBox="0 0 9 13"
      aria-hidden
    >
      <path d="M0 13h9C4.5 11.8.8 7.6 0 0z" fill="currentColor" />
    </svg>
  );
}

function MessageMeta({
  timestamp,
  isOutbound,
  message,
  onRetry,
  retryPending,
}: {
  timestamp: string | null;
  isOutbound: boolean;
  message: WhatsappMessage;
  onRetry?: (message: WhatsappMessage) => void;
  retryPending?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-0.5 self-end pb-px pl-2",
        "text-[11px] leading-none tabular-nums",
        isOutbound ? "text-primary-foreground/75" : "text-muted-foreground",
      )}
    >
      {message.status === "failed" && onRetry ? (
        <button
          type="button"
          onClick={() => onRetry(message)}
          disabled={retryPending}
          className="mr-1 inline-flex items-center gap-0.5 rounded border border-white/30 bg-black/20 px-1.5 py-0.5 text-[10px] font-semibold text-white"
          title="Tentar enviar de novo"
        >
          <RotateCcw className={cn("h-3 w-3", retryPending && "animate-spin")} />
        </button>
      ) : null}
      <span>{formatMessageTime(timestamp)}</span>
      {message.status === "failed" ? (
        <AlertCircle className="h-3.5 w-3.5 text-red-300" aria-label="Falha no envio" />
      ) : null}
    </span>
  );
}

function MessageBubbleImpl({
  message,
  groupPosition = "single",
  activeChatName,
  onRetry,
  retryPending = false,
}: MessageBubbleProps) {
  const isOutbound = message.direction === "outbound";
  const timestamp = message.createdAt ?? message.sentAt ?? message.receivedAt ?? null;
  const presentation = resolveInboxAttachmentPresentation(message);
  const rawBody = message.bodyText?.trim();
  const caption =
    rawBody && rawBody !== message.mediaUrl?.trim()
      ? getInboxMessagePreviewText(message)
      : null;

  const bodyText =
    presentation && !caption ? null : caption ?? (!presentation ? getInboxMessagePreviewText(message) : null);

  const showTail = showBubbleTail(groupPosition);
  const showInboundHeader =
    !isOutbound && (groupPosition === "single" || groupPosition === "first");

  return (
    <div
      className={cn("flex", isOutbound ? "justify-end pr-1" : "justify-start pl-0.5")}
    >
      <div
        className={cn(
          "flex min-w-0 max-w-[min(420px,92%)] flex-col",
          isOutbound ? "items-end" : "items-start",
        )}
      >
        {showInboundHeader ? (
          <div className="mb-0.5 px-0.5">
            <span className="truncate text-[12px] font-medium text-muted-foreground">{activeChatName}</span>
          </div>
        ) : null}

        <div className={cn("relative inline-block max-w-full", isOutbound ? "ml-auto" : "")}>
          {!isOutbound && showTail ? <BubbleTail outbound={false} /> : null}

          <div
            className={cn(
              "relative z-[1] min-w-[56px] px-2 py-1.5 sm:px-2.5",
              bubbleShellRadius(isOutbound, groupPosition),
              isOutbound
                ? "bg-primary text-primary-foreground shadow-[0_1px_0.5px_rgba(11,20,26,0.13)]"
                : "border border-border bg-card text-foreground shadow-[0_1px_0.5px_rgba(11,20,26,0.08)]",
            )}
          >
            {presentation ? (
              <div className={bodyText ? "mb-1" : undefined}>
                <MessageAttachment presentation={presentation} isOutbound={isOutbound} />
              </div>
            ) : null}

            {bodyText ? (
              <div className="flex flex-wrap items-end gap-x-1">
                <p className="min-w-0 flex-1 whitespace-pre-wrap break-words text-[14.2px] leading-[1.42]">
                  {bodyText}
                </p>
                <MessageMeta
                  timestamp={timestamp}
                  isOutbound={isOutbound}
                  message={message}
                  onRetry={isOutbound ? onRetry : undefined}
                  retryPending={retryPending}
                />
              </div>
            ) : (
              <div className="flex justify-end pt-0.5">
                <MessageMeta
                  timestamp={timestamp}
                  isOutbound={isOutbound}
                  message={message}
                  onRetry={isOutbound ? onRetry : undefined}
                  retryPending={retryPending}
                />
              </div>
            )}
          </div>

          {isOutbound && showTail ? <BubbleTail outbound /> : null}
        </div>
      </div>
    </div>
  );
}

function arePropsEqual(prev: MessageBubbleProps, next: MessageBubbleProps) {
  if (prev.groupPosition !== next.groupPosition) return false;
  if (prev.activeChatName !== next.activeChatName) return false;
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
