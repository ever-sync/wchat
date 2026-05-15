import { format, isToday, isYesterday } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { ChatNote, WhatsappMessage } from "@/types/domain";

export type ThreadEntry = WhatsappMessage | ChatNote;
export type MessageDayGroup = { label: string; items: ThreadEntry[] };

export type ThreadFlattenItem =
  | { kind: "day"; key: string; label: string }
  | { kind: "msg"; key: string; message: WhatsappMessage }
  | { kind: "note"; key: string; note: ChatNote };

function formatMessageDay(value?: string | null) {
  if (!value) {
    return "Hoje";
  }

  const date = new Date(value);
  if (isToday(date)) {
    return "Hoje";
  }

  if (isYesterday(date)) {
    return "Ontem";
  }

  return format(date, "EEE, dd 'de' MMM", { locale: ptBR });
}

function getEntryTimestamp(entry: ThreadEntry): string | null | undefined {
  if ("_noteKind" in entry) {
    return entry.createdAt;
  }
  return entry.createdAt ?? entry.sentAt ?? entry.receivedAt ?? null;
}

/** Backward-compat wrapper used by callers that pass only messages. */
export function groupMessagesByDay(messages: WhatsappMessage[]): MessageDayGroup[] {
  return groupThreadItemsByDay(messages);
}

export function groupThreadItemsByDay(items: ThreadEntry[]): MessageDayGroup[] {
  const groups: MessageDayGroup[] = [];

  for (const entry of items) {
    const key = formatMessageDay(getEntryTimestamp(entry));
    const lastGroup = groups[groups.length - 1];

    if (lastGroup && lastGroup.label === key) {
      lastGroup.items.push(entry);
      continue;
    }

    groups.push({ label: key, items: [entry] });
  }

  return groups;
}

export function flattenMessageGroups(groups: MessageDayGroup[]): ThreadFlattenItem[] {
  const out: ThreadFlattenItem[] = [];

  for (const g of groups) {
    out.push({ kind: "day", key: `day-${g.label}`, label: g.label });
    for (const item of g.items) {
      if ("_noteKind" in item) {
        out.push({ kind: "note", key: item.id, note: item });
      } else {
        out.push({ kind: "msg", key: item.id, message: item });
      }
    }
  }

  return out;
}
