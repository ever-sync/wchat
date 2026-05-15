import { useMemo } from "react";
import {
  useCrmTasksForCustomer,
  useCrmTasksForNegotiation,
} from "@/lib/api/crm-tasks";
import {
  countOpenCrmTasksByDue,
  mergeOpenCrmTasksForNegotiationView,
} from "@/lib/crm/negotiation-task-view";
import { isPersistedCrmNegotiationId } from "@/lib/crm/negotiation-model";
import { isSupabaseConfigured } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import type { CrmNegotiation } from "@/types/domain";

type CrmKanbanCardTaskBadgeProps = {
  card: CrmNegotiation;
};

export function CrmKanbanCardTaskBadge({ card }: CrmKanbanCardTaskBadgeProps) {
  const persisted = isPersistedCrmNegotiationId(card.id);

  const { data: byNegotiation = [], isLoading } = useCrmTasksForNegotiation(card.id, {
    enabled: persisted && isSupabaseConfigured,
  });
  const { data: customerUnlinked = [] } = useCrmTasksForCustomer(card.customerId, {
    enabled: persisted && isSupabaseConfigured && Boolean(card.customerId),
    negotiationUnlinkedOnly: true,
  });

  const counts = useMemo(() => {
    const open = mergeOpenCrmTasksForNegotiationView(byNegotiation, customerUnlinked);
    return countOpenCrmTasksByDue(open);
  }, [byNegotiation, customerUnlinked]);

  if (!persisted || !isSupabaseConfigured || isLoading) {
    return null;
  }

  if (counts.pending === 0 && counts.overdue === 0) {
    return null;
  }

  return (
    <span
      className="inline-flex items-center gap-1.5"
      onPointerDown={(e) => e.stopPropagation()}
      aria-label={`${counts.overdue} tarefa${counts.overdue === 1 ? "" : "s"} atrasada${counts.overdue === 1 ? "" : "s"}, ${counts.pending} pendente${counts.pending === 1 ? "" : "s"}`}
    >
      {counts.overdue > 0 ? (
        <span className="inline-flex items-center gap-0.5" title="Tarefas atrasadas">
          <span
            className={cn("h-2 w-2 shrink-0 rounded-full bg-[#c62828] animate-pulse")}
            aria-hidden
          />
          <span className="tabular-nums font-semibold text-[#c62828]">{counts.overdue}</span>
        </span>
      ) : null}
      {counts.pending > 0 ? (
        <span className="inline-flex items-center gap-0.5" title="Tarefas pendentes">
          <span className="h-2 w-2 shrink-0 rounded-full bg-[#ffc107]" aria-hidden />
          <span className="tabular-nums font-medium text-[#b8860b]">{counts.pending}</span>
        </span>
      ) : null}
    </span>
  );
}
