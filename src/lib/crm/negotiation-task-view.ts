import type { CrmTask } from "@/types/domain";

function taskDueMs(dueAt: string | null): number {
  if (!dueAt?.trim()) {
    return Number.POSITIVE_INFINITY;
  }
  const ms = new Date(dueAt).getTime();
  return Number.isNaN(ms) ? Number.POSITIVE_INFINITY : ms;
}

/** Abertas: negociação + órfãs do cliente, sem duplicar `id`, ordenadas por `dueAt` crescente. */
export function mergeOpenCrmTasksForNegotiationView(
  byNegotiation: CrmTask[],
  customerUnlinked: CrmTask[],
): CrmTask[] {
  const merged = new Map<string, CrmTask>();
  for (const t of byNegotiation) {
    if (t.status === "aberta") {
      merged.set(t.id, t);
    }
  }
  for (const t of customerUnlinked) {
    if (t.status === "aberta") {
      merged.set(t.id, t);
    }
  }
  const list = [...merged.values()];
  list.sort((a, b) => taskDueMs(a.dueAt) - taskDueMs(b.dueAt));
  return list;
}

/** Concluídas: mesma união, ordenadas por `updatedAt` decrescente. */
export function mergeCompletedCrmTasksForNegotiationView(
  byNegotiation: CrmTask[],
  customerUnlinked: CrmTask[],
): CrmTask[] {
  const merged = new Map<string, CrmTask>();
  for (const t of byNegotiation) {
    if (t.status === "concluida") {
      merged.set(t.id, t);
    }
  }
  for (const t of customerUnlinked) {
    if (t.status === "concluida") {
      merged.set(t.id, t);
    }
  }
  const list = [...merged.values()];
  list.sort((a, b) => {
    const ua = new Date(a.updatedAt).getTime();
    const ub = new Date(b.updatedAt).getTime();
    const sa = Number.isNaN(ua) ? 0 : ua;
    const sb = Number.isNaN(ub) ? 0 : ub;
    return sb - sa;
  });
  return list;
}
