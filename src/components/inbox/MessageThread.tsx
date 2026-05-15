import { useVirtualizer } from "@tanstack/react-virtual";
import { useCallback, useEffect, useMemo, useRef, type RefObject } from "react";
import { Loader2 } from "lucide-react";
import { flattenMessageGroups, type MessageDayGroup, type ThreadFlattenItem } from "@/lib/inboxMessageGroups";
import type { ChatNote, WhatsappMessage } from "@/types/domain";
import { MessageBubble } from "./MessageBubble";
import { WHATSAPP_CHAT_BG } from "./whatsappChatBg";

function NoteBubble({ note }: { note: ChatNote }) {
  const time = new Date(note.createdAt).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return (
    <div className="flex justify-center px-4 py-1">
      <div className="max-w-[75%] rounded-xl border border-[#574500] bg-[#2b2300] px-4 py-2.5 shadow-[0_1px_0.5px_rgba(0,0,0,0.4)]">
        <div className="mb-1.5 flex items-center gap-2">
          <span className="rounded-full bg-[#574500] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#c9a020]">
            Nota interna
          </span>
          <span className="text-[12px] text-[#8a6b1a]">{note.authorName}</span>
        </div>
        <p className="whitespace-pre-wrap text-[14px] leading-[1.4] text-[#e8cb50]">{note.bodyText}</p>
        <p className="mt-1.5 text-right text-[11px] text-[#8a6b1a]">{time}</p>
      </div>
    </div>
  );
}

export type MessageThreadProps = {
  scrollRef: RefObject<HTMLDivElement>;
  messageGroups: MessageDayGroup[];
  activeChatName: string;
  activeChatAvatarUrl?: string | null;
  hasMoreOlder?: boolean;
  isLoadingOlder?: boolean;
  onLoadOlder?: () => void | Promise<void>;
  onRetryMessage?: (message: WhatsappMessage) => void;
  retryingMessageId?: string | null;
};

/**
 * Estimativa por tipo: aproxima o virtualizer da altura real ANTES do
 * `measureElement` rodar, reduzindo "saltos" de scroll quando midia/audio
 * entram no DOM (cuja altura difere bastante de uma bolha de texto).
 */
function estimateThreadItemSize(item: ThreadFlattenItem | undefined): number {
  if (!item) return 108;
  if (item.kind === "day") return 52;
  if (item.kind === "note") return 96;

  const message = item.message;
  switch (message.messageType) {
    case "media":
      return 280; // imagem/video
    case "audio":
      return 96; // controle de audio compacto
    case "document":
      return 96; // card de documento
    case "location":
    case "contact":
      return 140;
    default: {
      const length = message.bodyText?.length ?? 0;
      if (length > 280) return 200;
      if (length > 120) return 140;
      return 96;
    }
  }
}

export function MessageThread({
  scrollRef,
  messageGroups,
  activeChatName,
  activeChatAvatarUrl,
  hasMoreOlder = false,
  isLoadingOlder = false,
  onLoadOlder,
  onRetryMessage,
  retryingMessageId = null,
}: MessageThreadProps) {
  const flat = useMemo(() => flattenMessageGroups(messageGroups), [messageGroups]);

  const estimateSize = useCallback(
    (index: number) => estimateThreadItemSize(flat[index]),
    [flat],
  );

  const virtualizer = useVirtualizer({
    count: flat.length,
    getScrollElement: () => scrollRef.current,
    estimateSize,
    getItemKey: (index) => flat[index]?.key ?? index,
    overscan: 8,
  });

  const loadOlderArmedRef = useRef(true);

  useEffect(() => {
    loadOlderArmedRef.current = true;
  }, [messageGroups]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || !onLoadOlder || !hasMoreOlder) {
      return;
    }

    const loadOlder = onLoadOlder;
    const thresholdPx = 160;

    function onScroll() {
      const node = scrollRef.current;
      if (!node || !loadOlderArmedRef.current || isLoadingOlder) {
        return;
      }

      if (node.scrollTop < thresholdPx) {
        loadOlderArmedRef.current = false;
        void Promise.resolve(loadOlder()).finally(() => {
          loadOlderArmedRef.current = true;
        });
      }
    }

    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [scrollRef, onLoadOlder, hasMoreOlder, isLoadingOlder]);

  return (
    <div
      ref={scrollRef}
      className="h-full overflow-y-auto overflow-x-hidden overscroll-y-contain rounded-none bg-background bg-[length:360px_360px] px-3 py-2 scrollbar-hide md:px-12"
      style={{ backgroundImage: WHATSAPP_CHAT_BG, backgroundRepeat: "repeat", backgroundBlendMode: "normal" }}
    >
      {isLoadingOlder ? (
        <div className="flex justify-center py-2">
          <span className="inline-flex items-center gap-2 rounded-full bg-wchat-50 px-3 py-1 text-xs font-semibold text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Carregando mensagens antigas...
          </span>
        </div>
      ) : null}
      <div
        className="relative w-full"
        style={{ height: virtualizer.getTotalSize() }}
      >
        {virtualizer.getVirtualItems().map((v) => {
          const item = flat[v.index];
          return (
            <div
              key={v.key}
              data-index={v.index}
              ref={virtualizer.measureElement}
              className="absolute left-0 top-0 w-full"
              style={{ transform: `translateY(${v.start}px)` }}
            >
              {item.kind === "day" ? (
                <div className="mb-5 flex justify-center px-8 pt-2">
                  <span className="rounded-lg bg-card px-4 py-1.5 text-[12px] font-medium text-muted-foreground shadow-sm ring-1 ring-border">
                    {item.label}
                  </span>
                </div>
              ) : item.kind === "note" ? (
                <div className="pb-3">
                  <NoteBubble note={item.note} />
                </div>
              ) : (
                <div className="pb-5">
                  <MessageBubble
                    message={item.message}
                    activeChatName={activeChatName}
                    activeChatAvatarUrl={activeChatAvatarUrl}
                    onRetry={onRetryMessage}
                    retryPending={retryingMessageId === item.message.id}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
