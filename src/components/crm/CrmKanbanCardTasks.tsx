import { useMemo, useState } from "react";
import { Calendar, Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  useCreateCrmTask,
  useCrmTasksForCustomer,
  useCrmTasksForNegotiation,
  useUpdateCrmTask,
} from "@/lib/api/crm-tasks";
import { mergeOpenCrmTasksForNegotiationView } from "@/lib/crm/negotiation-task-view";
import { isPersistedCrmNegotiationId } from "@/lib/crm/negotiation-model";
import { isSupabaseConfigured } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { CrmNegotiation } from "@/types/domain";
import type { CrmTask } from "@/types/domain";

const MAX_INLINE_TASKS = 2;

function formatTaskDueLabel(iso: string | null): string | null {
  if (!iso?.trim()) {
    return null;
  }
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    return null;
  }
  return d.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

function isTaskOverdue(iso: string | null): boolean {
  if (!iso?.trim()) {
    return false;
  }
  const ms = new Date(iso).getTime();
  return !Number.isNaN(ms) && ms < Date.now();
}

function rollupDueMeta(iso: string | undefined): { label: string; overdue: boolean } {
  if (!iso?.trim()) {
    return { label: "", overdue: false };
  }
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    return { label: "", overdue: false };
  }
  return {
    label: d.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" }),
    overdue: d.getTime() < Date.now(),
  };
}

type CrmKanbanCardTasksProps = {
  card: CrmNegotiation;
  onOpenNegotiation: (card: CrmNegotiation) => void;
};

export function CrmKanbanCardTasks({ card, onOpenNegotiation }: CrmKanbanCardTasksProps) {
  const { toast } = useToast();
  const persisted = isPersistedCrmNegotiationId(card.id);
  const [createOpen, setCreateOpen] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDueLocal, setTaskDueLocal] = useState("");

  const { data: byNegotiation = [], isLoading } = useCrmTasksForNegotiation(card.id, {
    enabled: persisted && isSupabaseConfigured,
  });
  const { data: customerUnlinked = [] } = useCrmTasksForCustomer(card.customerId, {
    enabled: persisted && isSupabaseConfigured && Boolean(card.customerId),
    negotiationUnlinkedOnly: true,
  });

  const updateCrmTask = useUpdateCrmTask();
  const createCrmTask = useCreateCrmTask();

  const openTasks = useMemo(
    () => mergeOpenCrmTasksForNegotiationView(byNegotiation, customerUnlinked),
    [byNegotiation, customerUnlinked],
  );

  const visibleTasks = openTasks.slice(0, MAX_INLINE_TASKS);
  const hiddenCount = Math.max(0, openTasks.length - MAX_INLINE_TASKS);
  const rollup = rollupDueMeta(card.nextTaskAt);
  const taskBusy = updateCrmTask.isPending || createCrmTask.isPending;

  const handleComplete = async (task: CrmTask) => {
    try {
      await updateCrmTask.mutateAsync({
        id: task.id,
        patch: { status: "concluida" },
        negotiationId: task.negotiationId ?? card.id,
        customerId: task.customerId ?? card.customerId ?? null,
      });
      toast({ title: "Tarefa concluída" });
    } catch (e) {
      toast({
        title: "Não foi possível concluir",
        description: e instanceof Error ? e.message : "Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleCreate = async () => {
    const title = taskTitle.trim();
    if (!title) {
      toast({
        title: "Título obrigatório",
        description: "Informe um título para a tarefa.",
        variant: "destructive",
      });
      return;
    }
    try {
      await createCrmTask.mutateAsync({
        title,
        negotiationId: card.id,
        customerId: card.customerId ?? null,
        dueAt: taskDueLocal ? new Date(taskDueLocal).toISOString() : null,
      });
      setTaskTitle("");
      setTaskDueLocal("");
      setCreateOpen(false);
      toast({ title: "Tarefa criada" });
    } catch (e) {
      toast({
        title: "Não foi possível criar",
        description: e instanceof Error ? e.message : "Tente novamente.",
        variant: "destructive",
      });
    }
  };

  if (!persisted || !isSupabaseConfigured) {
    if (!rollup.label) {
      return null;
    }
    return (
      <div
        className={cn(
          "mb-2 flex items-center gap-1 text-xs",
          rollup.overdue ? "font-semibold text-[#c62828]" : "text-[#4E1BB1]",
        )}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <Calendar className="h-3.5 w-3.5 shrink-0 opacity-80" aria-hidden />
        <span>Próxima: {rollup.label}</span>
      </div>
    );
  }

  return (
    <div
      className="mb-2 space-y-1.5 rounded-md border border-[#e9ecef] bg-[#f8f9fa] p-2"
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      {isLoading ? (
        <p className="flex items-center gap-1.5 text-xs text-[#868e96]">
          <Loader2 className="h-3 w-3 animate-spin" aria-hidden />
          Tarefas…
        </p>
      ) : openTasks.length === 0 ? (
        <p className="text-xs text-[#868e96]">Sem tarefas abertas</p>
      ) : (
        <ul className="space-y-1.5">
          {visibleTasks.map((task) => {
            const dueLabel = formatTaskDueLabel(task.dueAt);
            const overdue = isTaskOverdue(task.dueAt);
            return (
              <li key={task.id} className="flex items-start gap-2">
                <Checkbox
                  className="mt-0.5 h-4 w-4 border-[#adb5bd] data-[state=checked]:border-[#4E1BB1] data-[state=checked]:bg-[#4E1BB1]"
                  checked={false}
                  disabled={taskBusy}
                  aria-label={`Concluir: ${task.title}`}
                  onCheckedChange={(checked) => {
                    if (checked === true) {
                      void handleComplete(task);
                    }
                  }}
                />
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-xs font-medium leading-snug text-[#37474f]">{task.title}</p>
                  {dueLabel ? (
                    <p
                      className={cn(
                        "mt-0.5 text-[10px]",
                        overdue ? "font-semibold text-[#c62828]" : "text-[#6c757d]",
                      )}
                    >
                      {dueLabel}
                    </p>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {!isLoading && openTasks.length === 0 && rollup.label ? (
        <p
          className={cn(
            "flex items-center gap-1 text-[10px]",
            rollup.overdue ? "font-medium text-[#c62828]" : "text-[#6c757d]",
          )}
        >
          <Calendar className="h-3 w-3 shrink-0" aria-hidden />
          Próximo prazo: {rollup.label}
        </p>
      ) : null}

      {hiddenCount > 0 ? (
        <button
          type="button"
          className="text-[10px] font-medium text-[#4E1BB1] hover:underline"
          onClick={() => onOpenNegotiation(card)}
        >
          +{hiddenCount} tarefa{hiddenCount === 1 ? "" : "s"} — ver todas
        </button>
      ) : null}

      <div className="flex gap-1 pt-0.5">
        <Popover open={createOpen} onOpenChange={setCreateOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 flex-1 gap-1 px-2 text-xs font-medium text-[#495057] hover:bg-white"
              disabled={taskBusy}
            >
              <Plus className="h-3.5 w-3.5" aria-hidden />
              Nova
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-72 p-3" align="start" onPointerDown={(e) => e.stopPropagation()}>
            <div className="space-y-2">
              <div className="space-y-1">
                <Label htmlFor={`task-title-${card.id}`} className="text-xs">
                  Título
                </Label>
                <Input
                  id={`task-title-${card.id}`}
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  placeholder="Ex.: Ligar para fechar"
                  className="h-8 text-sm"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      void handleCreate();
                    }
                  }}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor={`task-due-${card.id}`} className="text-xs">
                  Prazo (opcional)
                </Label>
                <Input
                  id={`task-due-${card.id}`}
                  type="datetime-local"
                  value={taskDueLocal}
                  onChange={(e) => setTaskDueLocal(e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
              <Button
                type="button"
                size="sm"
                className="h-8 w-full bg-[#4E1BB1] text-xs hover:bg-[#3C1494]"
                disabled={createCrmTask.isPending}
                onClick={() => void handleCreate()}
              >
                {createCrmTask.isPending ? "Salvando…" : "Criar tarefa"}
              </Button>
            </div>
          </PopoverContent>
        </Popover>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 shrink-0 px-2 text-xs text-[#6c757d] hover:bg-white"
          onClick={() => onOpenNegotiation(card)}
        >
          Ficha
        </Button>
      </div>
    </div>
  );
}
