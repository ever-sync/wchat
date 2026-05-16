import type { UserRole } from "@/types/domain";

/** Admin e operação podem devolver negócio ao pool (limpar responsável). */
export function canReleaseCrmNegotiationToPool(role: UserRole | undefined): boolean {
  return role === "admin" || role === "operacao";
}

export function isNegotiationAssignedToProfile(
  assigneeId: string | null | undefined,
  profileId: string | null | undefined,
): boolean {
  const aid = assigneeId?.trim();
  const pid = profileId?.trim();
  return Boolean(aid && pid && aid === pid);
}

/** Atendimento só altera negócio assumido (responsável = usuário logado). Demais papéis seguem regras atuais. */
export function canAtendimentoModifyNegotiation(
  role: UserRole | undefined,
  assigneeId: string | null | undefined,
  profileId: string | null | undefined,
): boolean {
  if (role !== "atendimento") {
    return true;
  }
  return isNegotiationAssignedToProfile(assigneeId, profileId);
}

/** Atendimento só interage na conversa quando ela está atribuída a ele. */
export function canAtendimentoActOnChat(
  role: UserRole | undefined,
  chatAssigneeId: string | null | undefined,
  profileId: string | null | undefined,
): boolean {
  if (role !== "atendimento") {
    return true;
  }
  const aid = chatAssigneeId?.trim();
  const pid = profileId?.trim();
  return Boolean(aid && pid && aid === pid);
}

export function negotiationAssigneeBlockedMessage(): string {
  return "Assuma o negócio para trabalhar neste lead. Só é possível alterar negócios atribuídos a você.";
}

export function chatAssigneeBlockedMessage(): string {
  return "Assuma a conversa para interagir. Só é possível trabalhar em conversas atribuídas a você.";
}

/** Inbox: atendente precisa da conversa e do negócio CRM assumidos para ações no lead. */
export function isInboxLeadLocked(
  role: UserRole | undefined,
  chatAssigneeId: string | null | undefined,
  negotiationAssigneeId: string | null | undefined,
  profileId: string | null | undefined,
  options?: { hasLinkedNegotiation?: boolean },
): boolean {
  if (role !== "atendimento") {
    return false;
  }
  if (!canAtendimentoActOnChat(role, chatAssigneeId, profileId)) {
    return true;
  }
  if (options?.hasLinkedNegotiation) {
    return !canAtendimentoModifyNegotiation(role, negotiationAssigneeId, profileId);
  }
  return false;
}
