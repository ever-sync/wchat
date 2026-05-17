import type { ChatResolution, InboxChat } from "@/types/domain";

export const CHAT_RESOLUTION_LABELS: Record<ChatResolution, string> = {
  open: "Em aberto",
  pending: "Pendente",
  resolved: "Resolvida",
  waiting_customer: "Aguardando cliente",
  lost: "Perdido",
};

export function isChatSnoozed(chat: Pick<InboxChat, "snoozeUntil">): boolean {
  if (!chat.snoozeUntil) return false;
  return new Date(chat.snoozeUntil).getTime() > Date.now();
}

export function isChatSlaBreached(chat: Pick<InboxChat, "firstResponseAt" | "slaFirstResponseDueAt">): boolean {
  if (chat.firstResponseAt || !chat.slaFirstResponseDueAt) return false;
  return Date.now() > new Date(chat.slaFirstResponseDueAt).getTime();
}

export function slaMinutesRemaining(chat: Pick<InboxChat, "slaFirstResponseDueAt" | "firstResponseAt">): number | null {
  if (chat.firstResponseAt || !chat.slaFirstResponseDueAt) return null;
  const diff = new Date(chat.slaFirstResponseDueAt).getTime() - Date.now();
  return Math.ceil(diff / 60_000);
}
