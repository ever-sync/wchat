import { format, isToday, isYesterday } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AlarmClock, Clock } from "lucide-react";
import { isChatSlaBreached, isChatSnoozed, slaMinutesRemaining } from "@/lib/inbox-chat-rules";
import { cn } from "@/lib/utils";
import type { InboxChat } from "@/types/domain";
import { ConversationAvatar } from "./ConversationAvatar";

function formatPhoneLabel(value?: string | null) {
  if (!value) {
    return "";
  }

  const digits = value.replace(/\D/g, "");
  const localDigits = digits.startsWith("55") ? digits.slice(2) : digits;

  if (localDigits.length === 11) {
    return `+55 ${localDigits.slice(0, 2)} ${localDigits.slice(2, 7)}-${localDigits.slice(7)}`;
  }

  if (localDigits.length === 10) {
    return `+55 ${localDigits.slice(0, 2)} ${localDigits.slice(2, 6)}-${localDigits.slice(6)}`;
  }

  return value;
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

export function ConversationRow({
  chat,
  active,
  onClick,
  onPointerEnter,
}: {
  chat: InboxChat;
  active: boolean;
  onClick: () => void;
  onPointerEnter?: () => void;
}) {
  const subtitle = chat.customerName && chat.customerName !== chat.displayName
    ? chat.customerName
    : formatPhoneLabel(chat.remotePhoneE164 ?? chat.remotePhoneDigits ?? chat.remoteJid);

  const visibleTags = (chat.tags ?? []).slice(0, 3);
  const snoozed = isChatSnoozed(chat);
  const slaBreached = isChatSlaBreached(chat);
  const slaMinutes = slaMinutesRemaining(chat);

  return (
    <button
      type="button"
      onClick={onClick}
      onPointerEnter={onPointerEnter}
      className={cn(
        "group block w-full min-w-0 max-w-full overflow-hidden rounded-lg px-2 py-2.5 text-left transition-colors duration-150",
        active ? "bg-wchat-100 ring-1 ring-primary/20" : "hover:bg-wchat-50",
      )}
    >
      <div className="flex min-w-0 max-w-full items-start gap-2.5">
        <span className="shrink-0 rounded-full">
          <ConversationAvatar name={chat.displayName} avatarUrl={chat.avatarUrl} size="xs" />
        </span>
        <div className="min-w-0 max-w-full flex-1">
          <div className="flex min-w-0 items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p className="truncate text-[15px] font-medium leading-4 text-foreground">
                {chat.displayName}
              </p>
              <p className="mt-0.5 truncate text-[13px] leading-4 text-muted-foreground">
                {subtitle}
              </p>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1 pt-0.5">
              <p
                className={cn(
                  "text-[11px]",
                  active ? "text-muted-foreground" : chat.unreadCount > 0 ? "text-primary" : "text-muted-foreground",
                )}
              >
                {formatConversationTime(chat.lastMessageAt)}
              </p>
              <div className="flex items-center gap-1">
                {snoozed ? (
                  <span
                    title={`Adiada até ${format(new Date(chat.snoozeUntil!), "dd/MM HH:mm", { locale: ptBR })}`}
                    className="inline-flex h-5 items-center rounded-full bg-amber-100 px-1.5 text-[9px] font-semibold text-amber-800"
                  >
                    <AlarmClock className="mr-0.5 h-3 w-3" />
                  </span>
                ) : null}
                {slaBreached ? (
                  <span
                    title="SLA de primeira resposta estourado"
                    className="inline-flex h-5 items-center rounded-full bg-red-100 px-1.5 text-[9px] font-semibold text-red-700"
                  >
                    SLA
                  </span>
                ) : slaMinutes != null && slaMinutes <= 5 && slaMinutes > 0 ? (
                  <span
                    title={`${slaMinutes} min para 1ª resposta`}
                    className="inline-flex h-5 items-center rounded-full bg-orange-100 px-1.5 text-[9px] font-semibold text-orange-800"
                  >
                    <Clock className="h-3 w-3" />
                  </span>
                ) : null}
                {chat.assigneeName ? <AssigneeChip name={chat.assigneeName} /> : null}
                {chat.unreadCount > 0 ? (
                  <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-primary px-1.5 py-0.5 text-[11px] font-semibold text-primary-foreground">
                    {chat.unreadCount}
                  </span>
                ) : null}
              </div>
            </div>
          </div>
          <p
            className={cn(
              "mt-0.5 truncate text-[13px] leading-4 text-muted-foreground",
              chat.unreadCount > 0 && !active && "text-foreground",
            )}
          >
            {chat.lastMessagePreview || "Sem mensagens recentes"}
          </p>
          {visibleTags.length > 0 ? (
            <div className="mt-1 flex flex-wrap gap-1">
              {visibleTags.map((tag) => (
                <span
                  key={tag.tagId}
                  className="inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium"
                  style={{ backgroundColor: `${tag.color}22`, color: tag.color }}
                >
                  {tag.name}
                </span>
              ))}
              {(chat.tags?.length ?? 0) > 3 ? (
                <span className="text-[10px] text-muted-foreground">
                  +{(chat.tags?.length ?? 0) - 3}
                </span>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </button>
  );
}
