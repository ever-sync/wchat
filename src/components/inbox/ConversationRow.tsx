import { memo } from "react";
import { format, isToday, isYesterday } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AlarmClock, Clock, Lock } from "lucide-react";
import { isChatSlaBreached, isChatSnoozed, slaMinutesRemaining } from "@/lib/inbox-chat-rules";
import { mustAssumeUnassignedChatToView } from "@/lib/crm/negotiation-assignee";
import { cn } from "@/lib/utils";
import type { InboxChat, UserRole } from "@/types/domain";
import { ConversationAvatar } from "./ConversationAvatar";

const MESSAGE_PREVIEW_MAX_CHARS = 40;

function shortenMessagePreview(text: string, maxChars = MESSAGE_PREVIEW_MAX_CHARS): string {
  const t = text.trim();
  if (t.length <= maxChars) {
    return t;
  }
  const slice = t.slice(0, maxChars).trimEnd();
  const lastSpace = slice.lastIndexOf(" ");
  const clipped = lastSpace > maxChars * 0.55 ? slice.slice(0, lastSpace) : slice;
  return `${clipped}...`;
}

function formatConversationTime(value?: string | null) {
  if (!value) {
    return "--";
  }

  const date = new Date(value);
  if (isToday(date)) {
    return format(date, "HH:mm", { locale: ptBR });
  }

  if (isYesterday(date)) {
    return "Ontem";
  }

  return format(date, "dd/MM", { locale: ptBR });
}

const MAX_TAG_DOTS = 8;

function ConversationTagDots({ tags }: { tags: InboxChat["tags"] }) {
  const list = tags ?? [];
  if (list.length === 0) {
    return null;
  }
  const visible = list.slice(0, MAX_TAG_DOTS);
  const overflow = list.length - visible.length;
  const label = list.map((t) => t.name).join(", ");

  return (
    <span
      className="inline-flex shrink-0 items-center gap-0.5"
      title={label}
      aria-label={`Etiquetas: ${label}`}
    >
      {visible.map((tag) => (
        <span
          key={tag.tagId}
          className="h-1.5 w-1.5 shrink-0 rounded-full ring-1 ring-black/10"
          style={{ backgroundColor: tag.color }}
          aria-hidden
        />
      ))}
      {overflow > 0 ? (
        <span className="text-[9px] font-medium leading-none text-muted-foreground">+{overflow}</span>
      ) : null}
    </span>
  );
}

function AssigneeChip({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <span
      title={`Atribuído: ${name}`}
      className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground"
    >
      {initials}
    </span>
  );
}

export const ConversationRow = memo(function ConversationRow({
  chat,
  active,
  onSelect,
  onPrefetch,
  viewerRole,
}: {
  chat: InboxChat;
  active: boolean;
  /** Recebe o id estável; mantenha a referência estável no pai para o memo valer. */
  onSelect: (chatId: string) => void;
  onPrefetch?: (chatId: string) => void;
  /** Papel do usuário logado: atendimento não vê o preview de chats do pool até assumir. */
  viewerRole?: UserRole;
}) {
  const subtitle =
    chat.customerName && chat.customerName.trim() !== "" && chat.customerName !== chat.displayName
      ? chat.customerName
      : null;

  const snoozed = isChatSnoozed(chat);
  const slaBreached = isChatSlaBreached(chat);
  const slaMinutes = slaMinutesRemaining(chat);

  const lastPreviewTrimmed = chat.lastMessagePreview?.trim();
  const messagePreviewDisplay =
    lastPreviewTrimmed && lastPreviewTrimmed.length > 0
      ? shortenMessagePreview(lastPreviewTrimmed)
      : "Sem mensagens recentes";
  // Privacidade: atendimento não vê o conteúdo da última mensagem de um chat
  // do pool (sem dono) até assumi-lo — mesma regra que bloqueia a thread.
  const previewLocked = mustAssumeUnassignedChatToView(viewerRole, chat.assigneeId);

  return (
    <button
      type="button"
      data-testid={`inbox-chat-${chat.id}`}
      onClick={() => onSelect(chat.id)}
      onPointerEnter={onPrefetch ? () => onPrefetch(chat.id) : undefined}
      className={cn(
        "group block w-full min-w-0 max-w-full overflow-hidden rounded-lg px-1.5 py-2 text-left transition-colors duration-150",
        active ? "bg-wchat-100 ring-1 ring-primary/20" : "hover:bg-wchat-50",
      )}
    >
      <div className="flex min-w-0 max-w-full items-start gap-2">
        <span className="shrink-0 rounded-full">
          <ConversationAvatar name={chat.displayName} avatarUrl={chat.avatarUrl} size="xs" />
        </span>
        <div className="min-w-0 max-w-full flex-1">
          <div className="flex min-w-0 items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="flex min-w-0 items-center gap-1">
                <p className="min-w-0 truncate text-sm font-medium leading-snug text-foreground">
                  {chat.displayName}
                </p>
                <ConversationTagDots tags={chat.tags} />
              </div>
              {subtitle ? (
                <p className="mt-0.5 truncate text-[12px] leading-snug text-muted-foreground">{subtitle}</p>
              ) : null}
            </div>
            <p
              className={cn(
                "shrink-0 pt-0.5 text-[10px] tabular-nums leading-snug",
                active ? "text-muted-foreground" : chat.unreadCount > 0 ? "text-primary" : "text-muted-foreground",
              )}
            >
              {formatConversationTime(chat.lastMessageAt)}
            </p>
          </div>
          <div className="mt-0.5 flex min-w-0 items-center gap-1.5">
            <p
              className={cn(
                "min-w-0 flex-1 line-clamp-1 text-[12px] leading-snug text-muted-foreground",
                !previewLocked && chat.unreadCount > 0 && !active && "font-medium text-foreground",
                previewLocked && "italic",
              )}
            >
              {previewLocked ? (
                <span className="inline-flex items-center gap-1">
                  <Lock className="h-3 w-3 shrink-0" aria-hidden />
                  Assuma para ver a mensagem
                </span>
              ) : (
                messagePreviewDisplay
              )}
            </p>
            <div className="flex shrink-0 items-center gap-1">
              {snoozed ? (
                <span
                  title={`Adiada até ${format(new Date(chat.snoozeUntil!), "dd/MM HH:mm", { locale: ptBR })}`}
                  className="inline-flex h-5 items-center rounded-full bg-[var(--crm-amber-tint)] px-1.5 text-[9px] font-semibold text-[var(--crm-amber-ink)]"
                >
                  <AlarmClock className="mr-0.5 h-3 w-3" />
                </span>
              ) : null}
              {slaBreached ? (
                <span
                  title="SLA de primeira resposta estourado"
                  className="inline-flex h-5 items-center rounded-full bg-[var(--crm-danger-tint)] px-1.5 text-[9px] font-semibold text-[var(--crm-danger-strong)]"
                >
                  SLA
                </span>
              ) : slaMinutes != null && slaMinutes <= 5 && slaMinutes > 0 ? (
                <span
                  title={`${slaMinutes} min para 1ª resposta`}
                  className="inline-flex h-5 items-center rounded-full bg-[var(--crm-amber-tint)] px-1.5 text-[9px] font-semibold text-[var(--crm-amber-ink)]"
                >
                  <Clock className="h-3 w-3" />
                </span>
              ) : null}
              {chat.assigneeName ? <AssigneeChip name={chat.assigneeName} /> : null}
              {chat.unreadCount > 0 ? (
                <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-semibold leading-none text-primary-foreground">
                  {chat.unreadCount > 99 ? "99+" : chat.unreadCount}
                </span>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </button>
  );
});
