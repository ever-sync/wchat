import { E2E_INBOX_CHATS } from "@/data/inbox-e2e-fixtures";
import { E2E_MOCK_PROFILE_ID, getE2eMockRole } from "@/lib/e2e";
import { sanitizeCustomerSearchForPostgrestOrIlike } from "@/lib/customer-search-sanitize";
import type { InboxChat, InboxChatFilters } from "@/types/domain";

/** Espelha RLS de `whatsapp_chats_same_tenant_select` no modo E2E. */
export function filterE2eInboxChatsByRole(chats: InboxChat[]): InboxChat[] {
  const role = getE2eMockRole();
  if (role === "atendimento") {
    return chats.filter(
      (c) => !c.assigneeId || c.assigneeId === E2E_MOCK_PROFILE_ID,
    );
  }
  return chats;
}

export function listE2eInboxChats(filters: InboxChatFilters = {}): InboxChat[] {
  let rows = filterE2eInboxChatsByRole(E2E_INBOX_CHATS);

  if (filters.assigneeId === "mine") {
    rows = rows.filter((c) => c.assigneeId === (filters.currentUserId ?? E2E_MOCK_PROFILE_ID));
  } else if (filters.assigneeId === "unassigned") {
    rows = rows.filter((c) => !c.assigneeId);
  } else if (filters.assigneeId && filters.assigneeId !== "all") {
    rows = rows.filter((c) => c.assigneeId === filters.assigneeId);
  }

  if (filters.unreadOnly) {
    rows = rows.filter((c) => c.unreadCount > 0);
  }

  if (filters.search?.trim()) {
    const q = sanitizeCustomerSearchForPostgrestOrIlike(filters.search).toLowerCase();
    if (q.length > 0) {
      rows = rows.filter(
        (c) =>
          c.displayName.toLowerCase().includes(q) ||
          (c.remotePhoneDigits?.includes(q) ?? false),
      );
    }
  }

  return rows.sort((a, b) => {
    const bt = new Date(b.lastMessageAt ?? 0).getTime();
    const at = new Date(a.lastMessageAt ?? 0).getTime();
    return bt - at;
  });
}
