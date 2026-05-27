import { useMemo } from "react";
import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { listCrmTasks } from "@/lib/api/crm-tasks";
import { isFollowupOverdue } from "@/lib/inboxFollowupStatus";
import { isSupabaseConfigured } from "@/lib/supabase";
import type { CrmTask } from "@/types/domain";

const KEY = ["crm-tasks", "overdue-tenant"] as const;

export type OverdueFollowupsIndex = {
  /** Conjunto de customer_ids com pelo menos um follow-up vencido. */
  customerIds: ReadonlySet<string>;
  /** Conjunto de negotiation_ids com pelo menos um follow-up vencido. */
  negotiationIds: ReadonlySet<string>;
  /** Tarefas vencidas (já filtradas) — pra debugging/contadores. */
  tasks: CrmTask[];
};

const EMPTY_INDEX: OverdueFollowupsIndex = {
  customerIds: new Set<string>(),
  negotiationIds: new Set<string>(),
  tasks: [],
};

/**
 * Lista todas as `crm_tasks` em aberto do tenant e filtra client-side as que
 * já estão vencidas. Retorna dois Sets (customer_id, negotiation_id) pra
 * lookup O(1) em quem consome (ex.: filtrar chats da lista lateral).
 *
 * Por que client-side? `crm_tasks` não tem coluna de "vencida" — derivamos
 * de `due_at < now()`. Fetch único do tenant inteiro é barato (RLS filtra
 * pelo tenant; volume típico << 1000 tarefas abertas por operador).
 */
export function useOverdueFollowupsForTenant(
  options?: Omit<UseQueryOptions<CrmTask[], Error>, "queryKey" | "queryFn">,
): OverdueFollowupsIndex {
  const { enabled: enabledOption, ...rest } = options ?? {};
  const query = useQuery<CrmTask[], Error>({
    queryKey: KEY,
    queryFn: () => listCrmTasks({ status: "aberta" }),
    enabled: isSupabaseConfigured && (enabledOption ?? true),
    // Vencimento muda no relógio — staleTime curto p/ refletir transições
    // (a próxima leitura recompõe os Sets).
    staleTime: 30_000,
    ...rest,
  });

  return useMemo<OverdueFollowupsIndex>(() => {
    const tasks = query.data ?? [];
    if (tasks.length === 0) return EMPTY_INDEX;
    const customerIds = new Set<string>();
    const negotiationIds = new Set<string>();
    const overdue: CrmTask[] = [];
    for (const task of tasks) {
      if (!isFollowupOverdue(task)) continue;
      overdue.push(task);
      if (task.customerId) customerIds.add(task.customerId);
      if (task.negotiationId) negotiationIds.add(task.negotiationId);
    }
    if (overdue.length === 0) return EMPTY_INDEX;
    return { customerIds, negotiationIds, tasks: overdue };
  }, [query.data]);
}
