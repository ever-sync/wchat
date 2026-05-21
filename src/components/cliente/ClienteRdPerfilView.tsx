import { type ReactNode, useMemo, useState, type ReactElement } from "react";
import { formatBRL } from "@/lib/format";
import {
  ArrowLeft,
  Calendar,
  ChevronDown,
  Crosshair,
  Hand,
  MoreVertical,
  Users,
  Pencil,
  Plus,
  RefreshCw,
  RotateCcw,
  Trash2,
  ThumbsDown,
  ThumbsUp,
  X,
} from "lucide-react";
import type { CrmTaskPatch } from "@/lib/api/crm-tasks";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { buildPipelineLabels } from "@/lib/crm-pipeline";
import { isNegotiationUnassigned } from "@/lib/crm/negotiation-alerts";
import { negotiationAssigneeBlockedMessage } from "@/lib/crm/negotiation-assignee";
import { CustomerCustomFieldInput } from "@/components/customers/CustomerCustomFieldInput";
import { useToast } from "@/hooks/use-toast";
import {
  invalidateCustomerCustomFieldValues,
  upsertCustomerCustomFieldValues,
  useCustomerCustomFieldValues,
  useCustomerCustomFields,
} from "@/lib/api/customer-custom-fields";
import {
  buildCustomerCustomFieldsDisplayList,
  buildCustomerCustomFieldsDraftValues,
} from "@/lib/customer-custom-field-display";
import { cn } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import type { CrmTask, Customer } from "@/types/domain";

/** Paleta wChat */
const BRAND_ACCENT = "#5B2FD4";
const RD_PAGE_BG = "hsl(var(--background))";
const RD_CARD_SHADOW = "0 1px 3px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.04)";
const RD_RADIUS = "10px";

/** Valor sentinela do Select de responsável (sem `profiles.id` vazio no Radix). */
const CRM_TASK_ASSIGNEE_NONE = "__none__";

const NEG_ORIGEM_NONE = "__neg_origem_none__";

export type NegotiationPanelSnapshot = {
  assigneeId: string;
  qualification: number;
  totalValue: number;
  closingForecast: string | null;
  createdAt: string;
};

export type NegotiationPanelSavePayload = {
  nome: string;
  assigneeId: string | null;
  qualification: number;
  totalValue: number;
  closingForecastLocal: string;
  origem: "" | "organico" | "pago";
  campanha: string;
  telefone: string;
  email: string;
  customFieldValues: Record<string, string>;
};

type NegotiationPanelDraft = {
  nome: string;
  assigneeId: string;
  qualification: string;
  totalValue: string;
  closingForecastLocal: string;
  origem: string;
  campanha: string;
  telefone: string;
  email: string;
  customFieldValues: Record<string, string>;
};

function sourceColumn(cliente: Customer, ...keys: string[]): string {
  const sc = cliente.sourceColumns;
  if (!sc) {
    return "";
  }
  for (const k of keys) {
    const raw = sc[k];
    if (raw != null && String(raw).trim() !== "") {
      return String(raw).trim();
    }
  }
  return "";
}

function PipelineChevrons({
  activeIndex,
  daysContact,
  onStageSelect,
  stages,
}: {
  activeIndex: number;
  daysContact: number;
  onStageSelect?: (stageIndex: number) => void;
  /** Etapas reais do funil da negociação; sem isso usa o funil legado fixo. */
  stages?: Array<{ key: string; label: string }>;
}) {
  const segments = stages ?? buildPipelineLabels(daysContact);
  const interactive = Boolean(onStageSelect);
  const notch = 12;
  const inactiveFill = "#eceff1";

  return (
    <div className="w-full border-b border-[#dfe3e6] bg-[#eceff1]">
      <div className="mx-auto max-w-[1600px] px-2 py-2 md:px-4">
        <div
          className="flex min-h-[48px] w-full gap-[3px] bg-white p-[3px] shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]"
          role={interactive ? "tablist" : undefined}
          aria-label={interactive ? "Etapas do funil de vendas" : undefined}
        >
          {segments.map((seg, i) => {
            const active = i === activeIndex;
            const isFirst = i === 0;
            const isLast = i === segments.length - 1;
            const clip = isFirst
              ? `polygon(0 0, calc(100% - ${notch}px) 0, 100% 50%, calc(100% - ${notch}px) 100%, 0 100%)`
              : isLast
                ? `polygon(${notch}px 0, 100% 0, 100% 100%, ${notch}px 100%, 0 50%)`
                : `polygon(${notch}px 0, calc(100% - ${notch}px) 0, 100% 50%, calc(100% - ${notch}px) 100%, ${notch}px 100%, 0 50%)`;

            const label = (
              <span
                className={cn(
                  "relative z-10 block hyphens-auto px-1.5 text-[9px] uppercase leading-tight tracking-wide sm:text-[10px] md:text-[11px]",
                  active ? "font-extrabold text-white" : "font-bold text-[#546e7a]",
                )}
              >
                {seg.label}
              </span>
            );

            const shellStyle = {
              clipPath: clip,
              backgroundColor: active ? BRAND_ACCENT : inactiveFill,
            } as const;

            return (
              <div key={seg.key} className="min-w-0 flex-1">
                {interactive ? (
                  <button
                    type="button"
                    role="tab"
                    aria-selected={active}
                    className={cn(
                      "flex min-h-[44px] w-full cursor-pointer items-center justify-center px-1 py-2 text-center outline-none transition-[filter,box-shadow] hover:brightness-[1.04] focus-visible:ring-2 focus-visible:ring-[#4E1BB1] focus-visible:ring-offset-1",
                      active && "shadow-[0_1px_3px_rgba(0,0,0,0.12)]",
                    )}
                    style={shellStyle}
                    onClick={() => onStageSelect?.(i)}
                  >
                    {label}
                  </button>
                ) : (
                  <div
                    className="flex min-h-[44px] items-center justify-center px-1 py-2 text-center"
                    style={shellStyle}
                  >
                    {label}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function NegField({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-b border-[#eceff1] py-2.5 text-[13px] leading-snug last:border-b-0">
      <p className="mb-0.5 text-[#78909c]">{label}</p>
      <p className="break-words font-medium text-[#37474f]">{value.trim() || "—"}</p>
    </div>
  );
}

function NegFieldEdit({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-1.5 border-b border-[#eceff1] py-2.5 text-[13px] leading-snug last:border-b-0 sm:grid-cols-[minmax(100px,1fr)_minmax(0,1.2fr)] sm:items-center sm:gap-x-3">
      <span className="text-[#78909c]">{label}</span>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

function formatCrmTaskDueLabel(iso: string | null): string | null {
  if (!iso) {
    return null;
  }
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    return null;
  }
  return d.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

function formatCrmTaskUpdatedLabel(iso: string | undefined): string | null {
  if (!iso?.trim()) {
    return null;
  }
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    return null;
  }
  return d.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

function crmTaskAssigneeDisplayName(
  assigneeId: string | null | undefined,
  assignees?: { id: string; nome: string }[],
): string | null {
  const id = assigneeId?.trim();
  if (!id) {
    return null;
  }
  const hit = assignees?.find((a) => a.id === id);
  const nome = hit?.nome?.trim();
  if (nome) {
    return nome;
  }
  return "Responsável atribuído";
}

function isoToDatetimeLocalValue(iso: string | null): string {
  if (!iso?.trim()) {
    return "";
  }
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    return "";
  }
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function crmTaskScopeBadge(
  t: CrmTask,
  mode: "negotiation-merge" | "customer-linked" | undefined,
): ReactElement | null {
  if (!mode) {
    return null;
  }
  if (mode === "customer-linked") {
    if (!t.negotiationId) {
      return null;
    }
    return (
      <span className="rounded bg-[#e3f2fd] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#1565c0]">
        Negociação
      </span>
    );
  }
  const clientScope = !t.negotiationId;
  return (
    <span
      className={
        clientScope
          ? "rounded bg-[#eceff1] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#546e7a]"
          : "rounded bg-[#e3f2fd] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#1565c0]"
      }
    >
      {clientScope ? "Cliente" : "Negociação"}
    </span>
  );
}

function ClienteRdPerfilTasksTabBody({
  crmOpenTasks,
  crmCompletedTasks,
  crmTaskScopeLabelMode,
  crmTasksLoading,
  crmTaskAssignees,
  onCompleteCrmTask,
  onReopenCrmTask,
  onDeleteCrmTask,
  onSaveCrmTaskEdit,
  taskMutationBusy,
  onCreateTask,
  openTaskEdit,
  onRequestDeleteTask,
  readOnly = false,
}: {
  crmOpenTasks: CrmTask[] | undefined;
  crmCompletedTasks: CrmTask[] | undefined;
  crmTaskScopeLabelMode: "negotiation-merge" | "customer-linked" | undefined;
  crmTasksLoading: boolean;
  crmTaskAssignees: { id: string; nome: string }[] | undefined;
  onCompleteCrmTask?: (taskId: string) => void;
  onReopenCrmTask?: (taskId: string) => void;
  onDeleteCrmTask?: (taskId: string) => void;
  onSaveCrmTaskEdit?: (payload: { id: string; patch: CrmTaskPatch }) => void | Promise<void>;
  taskMutationBusy: boolean;
  onCreateTask: () => void;
  openTaskEdit: (t: CrmTask) => void;
  onRequestDeleteTask: (task: { id: string; title: string }) => void;
  readOnly?: boolean;
}) {
  return (
    <>
      <div className="flex items-center justify-between border-b border-[#eceff1] px-4 py-3">
        <h2 className="text-sm font-semibold text-[#37474f]">Próximas tarefas</h2>
        <Calendar className="h-4 w-4 text-[#90a4ae]" aria-hidden />
      </div>
      {readOnly ? (
        <p className="border-b border-[#eceff1] px-4 py-3 text-sm text-[#78909c] md:px-6">
          {negotiationAssigneeBlockedMessage()}
        </p>
      ) : null}
      {crmOpenTasks !== undefined ? (
        <div className="px-4 py-4 md:px-6">
          {crmTasksLoading ? (
            <div className="space-y-3">
              <div className="h-14 animate-pulse rounded-lg bg-[#eceff1]" />
              <div className="h-14 animate-pulse rounded-lg bg-[#eceff1]" />
            </div>
          ) : crmOpenTasks.length === 0 ? (
            <div className="flex flex-col items-center gap-4 py-8 text-center md:flex-row md:justify-between md:text-left">
              <p className="max-w-md text-sm leading-relaxed text-[#78909c]">
                Não há tarefas abertas. Crie uma para acompanhar o próximo passo.
              </p>
              <Button
                type="button"
                className="shrink-0 border-0 px-5 py-2.5 font-semibold text-white shadow-none hover:opacity-95"
                style={{ backgroundColor: BRAND_ACCENT, borderRadius: RD_RADIUS }}
                onClick={onCreateTask}
                disabled={readOnly}
              >
                <Plus className="mr-2 h-4 w-4" />
                Criar tarefa
              </Button>
            </div>
          ) : (
            <ul className="space-y-2">
              {crmOpenTasks.map((t) => {
                const dueLabel = formatCrmTaskDueLabel(t.dueAt);
                const assigneeLabel = crmTaskAssigneeDisplayName(t.assigneeId, crmTaskAssignees);
                return (
                  <li
                    key={t.id}
                    className="flex items-start gap-2 rounded-lg border border-[#eceff1] bg-[#fafbfb] px-3 py-2.5"
                  >
                    <Checkbox
                      className="mt-0.5 border-[#90a4ae] data-[state=checked]:border-[#4E1BB1] data-[state=checked]:bg-[#4E1BB1]"
                      checked={false}
                      disabled={readOnly || !onCompleteCrmTask || taskMutationBusy}
                      aria-label={`Marcar como concluída: ${t.title}`}
                      onCheckedChange={(c) => {
                        if (c === true) {
                          onCompleteCrmTask?.(t.id);
                        }
                      }}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <p className="text-sm font-medium text-[#37474f]">{t.title}</p>
                        {crmTaskScopeBadge(t, crmTaskScopeLabelMode)}
                      </div>
                      {dueLabel ? (
                        <p className="mt-0.5 text-xs text-[#78909c]">Prazo: {dueLabel}</p>
                      ) : null}
                      {assigneeLabel ? (
                        <p className="mt-0.5 text-xs text-[#78909c]">Responsável: {assigneeLabel}</p>
                      ) : null}
                      {t.notes?.trim() ? (
                        <p className="mt-1 text-xs leading-snug text-[#90a4ae]">{t.notes.trim()}</p>
                      ) : null}
                    </div>
                    <div className="flex shrink-0 items-start gap-0.5">
                      {onSaveCrmTaskEdit && !readOnly ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-[#90a4ae] hover:bg-[#eceff1] hover:text-[#37474f]"
                          disabled={taskMutationBusy}
                          aria-label={`Editar tarefa: ${t.title}`}
                          onClick={() => openTaskEdit(t)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      ) : null}
                      {onDeleteCrmTask && !readOnly ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 shrink-0 text-[#90a4ae] hover:bg-[#ffebee] hover:text-[#c62828]"
                          disabled={taskMutationBusy}
                          aria-label={`Excluir tarefa: ${t.title}`}
                          onClick={() => onRequestDeleteTask({ id: t.id, title: t.title })}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
          {!readOnly && !crmTasksLoading && crmOpenTasks.length > 0 ? (
            <div className="mt-4 flex justify-end">
              <Button
                type="button"
                variant="outline"
                className="border-[#cfd8dc] text-[#37474f] hover:bg-[#f5f5f5]"
                style={{ borderRadius: RD_RADIUS }}
                onClick={onCreateTask}
              >
                <Plus className="mr-2 h-4 w-4" />
                Nova tarefa
              </Button>
            </div>
          ) : null}
          {!crmTasksLoading && crmCompletedTasks != null && crmCompletedTasks.length > 0 ? (
            <Collapsible className="mt-6 border-t border-[#eceff1] pt-4">
              <CollapsibleTrigger className="group flex w-full items-center justify-between rounded-lg px-1 py-2 text-left text-sm font-semibold text-[#546e7a] hover:bg-[#f5f5f5]">
                <span>
                  Tarefas concluídas
                  <span className="ml-2 font-normal text-[#90a4ae]">({crmCompletedTasks.length})</span>
                </span>
                <ChevronDown className="h-4 w-4 shrink-0 text-[#90a4ae] transition-transform group-data-[state=open]:rotate-180" />
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-2">
                <ul className="space-y-2">
                  {crmCompletedTasks.map((t) => {
                    const doneLabel = formatCrmTaskUpdatedLabel(t.updatedAt);
                    const assigneeLabel = crmTaskAssigneeDisplayName(t.assigneeId, crmTaskAssignees);
                    return (
                      <li
                        key={t.id}
                        className="flex items-start gap-2 rounded-lg border border-[#eceff1] bg-[#fafafa] px-3 py-2.5"
                      >
                        <div className="mt-2 h-2 w-2 shrink-0 rounded-full bg-[#b0bec5]" aria-hidden />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <p className="text-sm font-medium text-[#90a4ae] line-through">{t.title}</p>
                            {crmTaskScopeBadge(t, crmTaskScopeLabelMode)}
                          </div>
                          {doneLabel ? (
                            <p className="mt-0.5 text-xs text-[#78909c]">Concluída em {doneLabel}</p>
                          ) : null}
                          {assigneeLabel ? (
                            <p className="mt-0.5 text-xs text-[#78909c]">Responsável: {assigneeLabel}</p>
                          ) : null}
                          {t.notes?.trim() ? (
                            <p className="mt-1 text-xs leading-snug text-[#b0bec5]">{t.notes.trim()}</p>
                          ) : null}
                        </div>
                        <div className="flex shrink-0 items-start gap-0.5">
                          {onReopenCrmTask && !readOnly ? (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-[#90a4ae] hover:bg-[#e8f5e9] hover:text-[#2e7d32]"
                              disabled={taskMutationBusy}
                              aria-label={`Reabrir tarefa: ${t.title}`}
                              onClick={() => onReopenCrmTask(t.id)}
                            >
                              <RotateCcw className="h-4 w-4" />
                            </Button>
                          ) : null}
                          {onSaveCrmTaskEdit && !readOnly ? (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-[#90a4ae] hover:bg-[#eceff1] hover:text-[#37474f]"
                              disabled={taskMutationBusy}
                              aria-label={`Editar tarefa concluída: ${t.title}`}
                              onClick={() => openTaskEdit(t)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          ) : null}
                          {onDeleteCrmTask && !readOnly ? (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 shrink-0 text-[#90a4ae] hover:bg-[#ffebee] hover:text-[#c62828]"
                              disabled={taskMutationBusy}
                              aria-label={`Excluir tarefa concluída: ${t.title}`}
                              onClick={() => onRequestDeleteTask({ id: t.id, title: t.title })}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          ) : null}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </CollapsibleContent>
            </Collapsible>
          ) : null}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-5 px-4 py-10 md:flex-row md:items-center md:justify-between md:px-8">
          <div className="flex w-full max-w-[260px] shrink-0 flex-col items-center md:items-start">
            <div
              className="flex w-full items-center justify-center overflow-hidden bg-[#f8fafb] p-3"
              style={{ borderRadius: RD_RADIUS, boxShadow: "inset 0 0 0 1px rgba(0, 0, 0, 0.04)" }}
            >
              <img
                src="/illustrations/proximas-tarefas-vazio.png"
                alt="Ilustração: acompanhamento de negociação"
                className="h-auto w-full max-h-[200px] object-contain object-center"
                width={240}
                height={200}
                decoding="async"
              />
            </div>
          </div>
          <p className="max-w-md text-center text-sm leading-relaxed text-[#78909c] md:text-left">
            Não existem tarefas pendentes para essa Negociação
          </p>
          <Button
            type="button"
            className="shrink-0 border-0 px-5 py-2.5 font-semibold text-white shadow-none hover:opacity-95"
            style={{ backgroundColor: BRAND_ACCENT, borderRadius: RD_RADIUS }}
            onClick={onCreateTask}
            disabled={readOnly}
          >
            <Plus className="mr-2 h-4 w-4" />
            Criar tarefa
          </Button>
        </div>
      )}
    </>
  );
}

export type ClienteRdPerfilViewProps = {
  cliente: Customer;
  daysContact: number;
  pipelineActiveIndex: number;
  /** Etapas reais do funil (ficha CRM); sem isso usa o funil legado fixo de 6 etapas. */
  pipelineStages?: Array<{ key: string; label: string }>;
  qualificationStars: number;
  onBack: () => void;
  onRefresh: () => void;
  onMarkLoss: () => void;
  onMarkWin: () => void;
  onEdit: () => void;
  onOpenInbox: () => void;
  onBlock: () => void;
  onCreateNote: () => void;
  onCreateTask: () => void;
  /** Quando definido, troca o bloco ilustrado por tarefas reais (lista pode ser vazia). */
  crmOpenTasks?: CrmTask[];
  /** Tarefas concluídas (ex.: histórico); exibidas em bloco recolhível quando houver itens. */
  crmCompletedTasks?: CrmTask[];
  /**
   * Rótulo de escopo nas linhas de tarefa.
   * `negotiation-merge`: Cliente vs Negociação (lista unificada na tela da negociação).
   * `customer-linked`: só indica tarefas vinculadas a uma negociação (perfil do cliente).
   */
  crmTaskScopeLabelMode?: "negotiation-merge" | "customer-linked";
  crmTasksLoading?: boolean;
  onCompleteCrmTask?: (taskId: string) => void;
  crmCompleteTaskPending?: boolean;
  /** Volta tarefa concluída para aberta. */
  onReopenCrmTask?: (taskId: string) => void;
  onDeleteCrmTask?: (taskId: string) => void;
  crmDeleteTaskPending?: boolean;
  /** Editar título, prazo e observações (tarefa aberta ou concluída). */
  onSaveCrmTaskEdit?: (payload: { id: string; patch: CrmTaskPatch }) => void | Promise<void>;
  crmEditTaskPending?: boolean;
  /** Colaboradores do tenant para rótulo e Select de responsável (`profiles.id`). */
  crmTaskAssignees?: { id: string; nome: string }[];
  /** Clique em uma etapa do funil (atualiza estágio persistido no cliente quando implementado na página). */
  onPipelineStageChange?: (stageIndex: number) => void;
  /** Rótulo do responsável da negociação (ficha `/crm/negociacao/:id`). */
  negotiationAssigneeLabel?: string;
  /** Exibe ação de assumir negócio do pool CRM. */
  showClaimNegotiation?: boolean;
  onClaimNegotiation?: () => void;
  claimNegotiationPending?: boolean;
  /** Devolver negócio ao pool (admin/operação). */
  showReleaseNegotiation?: boolean;
  onReleaseNegotiation?: () => void;
  releaseNegotiationPending?: boolean;
  /** Conteúdo da aba “Arquivos” (ex.: documentos do lead na ficha CRM). */
  negotiationDocumentsSlot?: ReactNode;
  /** Conteúdo da aba “Produtos” (vendas vinculadas à negociação). */
  negotiationProductsSlot?: ReactNode;
  /** Conteúdo da aba “Ligações” (histórico de chamadas do lead). */
  negotiationCallsSlot?: ReactNode;
  /** Dados da negociação persistida (ficha CRM); habilita edição com lápis. */
  negotiationPanelSnapshot?: NegotiationPanelSnapshot;
  onSaveNegotiationPanel?: (payload: NegotiationPanelSavePayload) => Promise<void>;
  negotiationPanelSavePending?: boolean;
  /** Cliente vinculado: permite editar telefone, e-mail e campos de `source_columns`. */
  negotiationPanelCustomerLinked?: boolean;
  /** Aba inicial das tabs inferiores (ex.: `tarefas` com `?criarTarefa=1`). */
  mainTabDefault?: string;
  /** Bloqueia alterações no lead até assumir (atendimento sem responsável). */
  negotiationReadOnly?: boolean;
  /** Bloqueia ações de cliente como editar cadastro e bloquear/reativar. */
  customerActionsDisabled?: boolean;
  /** Bloqueia ações do CRM como etapa, tarefa, ganho/perda e assumir/devolver. */
  crmActionsDisabled?: boolean;
};

export function ClienteRdPerfilView({
  cliente,
  daysContact,
  pipelineActiveIndex,
  pipelineStages,
  qualificationStars,
  onBack,
  onRefresh,
  onMarkLoss,
  onMarkWin,
  onEdit,
  onOpenInbox,
  onBlock,
  onCreateNote,
  onCreateTask,
  crmOpenTasks,
  crmCompletedTasks,
  crmTaskScopeLabelMode,
  crmTasksLoading,
  onCompleteCrmTask,
  crmCompleteTaskPending,
  onReopenCrmTask,
  onDeleteCrmTask,
  crmDeleteTaskPending,
  onSaveCrmTaskEdit,
  crmEditTaskPending,
  crmTaskAssignees,
  onPipelineStageChange,
  negotiationAssigneeLabel,
  showClaimNegotiation,
  onClaimNegotiation,
  claimNegotiationPending,
  showReleaseNegotiation,
  onReleaseNegotiation,
  releaseNegotiationPending,
  negotiationDocumentsSlot,
  negotiationProductsSlot,
  negotiationCallsSlot,
  negotiationPanelSnapshot,
  onSaveNegotiationPanel,
  negotiationPanelSavePending,
  negotiationPanelCustomerLinked,
  mainTabDefault = "historico",
  negotiationReadOnly = false,
  customerActionsDisabled = false,
  crmActionsDisabled = false,
}: ClienteRdPerfilViewProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: customFieldDefs = [] } = useCustomerCustomFields();
  const { data: customFieldValueRows = [], isLoading: customFieldsLoading } = useCustomerCustomFieldValues(
    cliente.id,
  );
  const customFieldsById = useMemo(
    () =>
      buildCustomerCustomFieldsDisplayList({
        fields: customFieldDefs,
        valueRows: customFieldValueRows,
        sourceColumns: cliente.sourceColumns,
      }),
    [customFieldDefs, customFieldValueRows, cliente.sourceColumns],
  );

  const [promoVisible, setPromoVisible] = useState(true);
  const [negoPanelEditing, setNegoPanelEditing] = useState(false);
  const [negoDraft, setNegoDraft] = useState<NegotiationPanelDraft | null>(null);
  const [taskEditOpen, setTaskEditOpen] = useState(false);
  const [taskEditTarget, setTaskEditTarget] = useState<CrmTask | null>(null);
  const [taskEditTitle, setTaskEditTitle] = useState("");
  const [taskEditDueLocal, setTaskEditDueLocal] = useState("");
  const [taskEditNotes, setTaskEditNotes] = useState("");
  const [taskEditAssigneeId, setTaskEditAssigneeId] = useState("");
  const [crmTaskDelete, setCrmTaskDelete] = useState<{ id: string; title: string } | null>(null);

  const openTaskEdit = (t: CrmTask) => {
    if (negotiationReadOnly) {
      toast({
        title: "Assuma o negócio",
        description: negotiationAssigneeBlockedMessage(),
        variant: "destructive",
      });
      return;
    }
    setTaskEditTarget(t);
    setTaskEditTitle(t.title);
    setTaskEditDueLocal(isoToDatetimeLocalValue(t.dueAt));
    setTaskEditNotes(t.notes ?? "");
    setTaskEditAssigneeId(t.assigneeId ?? "");
    setTaskEditOpen(true);
  };

  const taskMutationBusy = Boolean(
    crmCompleteTaskPending || crmEditTaskPending || crmDeleteTaskPending,
  );

  const negoSaveBusy = Boolean(negotiationPanelSavePending);

  const startNegoPanelEdit = () => {
    if (negotiationReadOnly) {
      toast({
        title: "Assuma o negócio",
        description: negotiationAssigneeBlockedMessage(),
        variant: "destructive",
      });
      return;
    }
    if (!negotiationPanelSnapshot || !onSaveNegotiationPanel) return;
    setNegoDraft({
      nome: cliente.nome,
      assigneeId: isNegotiationUnassigned(negotiationPanelSnapshot.assigneeId)
        ? ""
        : negotiationPanelSnapshot.assigneeId,
      qualification: String(negotiationPanelSnapshot.qualification),
      totalValue: String(negotiationPanelSnapshot.totalValue),
      closingForecastLocal: isoToDatetimeLocalValue(negotiationPanelSnapshot.closingForecast),
      origem: cliente.origem ?? "",
      campanha: sourceColumn(cliente, "campanha", "Campanha"),
      telefone: cliente.telefone ?? "",
      email: cliente.email ?? "",
      customFieldValues: buildCustomerCustomFieldsDraftValues({
        fields: customFieldDefs,
        valueRows: customFieldValueRows,
        sourceColumns: cliente.sourceColumns,
      }),
    });
    setNegoPanelEditing(true);
  };

  const cancelNegoPanelEdit = () => {
    setNegoPanelEditing(false);
    setNegoDraft(null);
  };

  const submitNegoPanelEdit = () => {
    if (!negoDraft || !onSaveNegotiationPanel) return;
    const nome = negoDraft.nome.trim();
    if (!nome) {
      toast({
        title: "Nome obrigatório",
        description: "Informe o nome da negociação ou cliente.",
        variant: "destructive",
      });
      return;
    }
    const qualification = Math.min(
      5,
      Math.max(0, Math.round(Number.parseInt(negoDraft.qualification, 10) || 0)),
    );
    const totalValue = Math.max(0, Number.parseFloat(negoDraft.totalValue) || 0);
    const payload: NegotiationPanelSavePayload = {
      nome,
      assigneeId: negoDraft.assigneeId.trim() || null,
      qualification,
      totalValue,
      closingForecastLocal: negoDraft.closingForecastLocal,
      origem:
        negoDraft.origem === "organico" || negoDraft.origem === "pago" ? negoDraft.origem : "",
      campanha: negoDraft.campanha.trim(),
      telefone: negoDraft.telefone.trim(),
      email: negoDraft.email.trim(),
      customFieldValues: { ...negoDraft.customFieldValues },
    };

    void (async () => {
      try {
        await onSaveNegotiationPanel(payload);
        if (cliente.id && customFieldDefs.length > 0) {
          await upsertCustomerCustomFieldValues(
            cliente.id,
            customFieldDefs,
            payload.customFieldValues,
          );
          invalidateCustomerCustomFieldValues(queryClient, cliente.id);
        }
        setNegoPanelEditing(false);
        setNegoDraft(null);
      } catch {
        // feedback via toast na página que chama o save
      }
    })();
  };

  const qualView = negotiationPanelSnapshot
    ? String(negotiationPanelSnapshot.qualification)
    : String(qualificationStars);

  const totalViewValue =
    negotiationPanelSnapshot != null ? negotiationPanelSnapshot.totalValue : cliente.totalGasto;

  const prevView = negotiationPanelSnapshot?.closingForecast
    ? new Date(negotiationPanelSnapshot.closingForecast).toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "America/Sao_Paulo",
      })
    : "";

  const createdViewSrc = negotiationPanelSnapshot?.createdAt ?? cliente.cadastradoEm ?? "";

  const createdView = createdViewSrc
    ? new Date(createdViewSrc).toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "America/Sao_Paulo",
      })
    : "";

  const fonteView =
    cliente.origem === "organico"
      ? "Orgânico"
      : cliente.origem === "pago"
        ? "Pago"
        : "";

  return (
    <div
      className="min-h-0 min-w-0 flex-1 overflow-y-auto"
      style={{ backgroundColor: RD_PAGE_BG }}
    >
      <header
        className="border-b border-[#e8eaed] bg-white px-4 py-4 md:px-6"
        style={{ boxShadow: "0 1px 2px rgba(0, 0, 0, 0.06)" }}
      >
        <div className="mx-auto flex max-w-[1600px] flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="mt-0.5 shrink-0 text-[#546e7a] hover:bg-[#eceff1]"
              onClick={onBack}
              aria-label="Voltar"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="truncate text-xl font-semibold tracking-tight text-[#212121] md:text-2xl">{cliente.nome}</h1>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-[#90a4ae] hover:bg-[#eceff1]">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-52">
                    <DropdownMenuItem
                      disabled={negotiationReadOnly || customerActionsDisabled}
                      onClick={() => {
                        if (negotiationReadOnly || customerActionsDisabled) {
                          toast({
                            title: "Ação indisponível",
                            description: negotiationReadOnly
                              ? negotiationAssigneeBlockedMessage()
                              : "Seu papel nao tem permissao para editar este cadastro.",
                            variant: "destructive",
                          });
                          return;
                        }
                        onEdit();
                      }}
                    >
                      Editar cadastro
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        onOpenInbox();
                      }}
                    >
                      Abrir no Inbox
                    </DropdownMenuItem>
                    {cliente.status !== "bloqueado" ? (
                      <DropdownMenuItem
                        className="text-red-600 focus:text-red-600"
                        disabled={negotiationReadOnly || customerActionsDisabled}
                        onClick={() => {
                          if (negotiationReadOnly || customerActionsDisabled) {
                            toast({
                              title: "Ação indisponível",
                              description: negotiationReadOnly
                                ? negotiationAssigneeBlockedMessage()
                                : "Seu papel nao tem permissao para bloquear este cliente.",
                              variant: "destructive",
                            });
                            return;
                          }
                          onBlock();
                        }}
                      >
                        Bloquear cliente
                      </DropdownMenuItem>
                    ) : null}
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-[#90a4ae] hover:bg-[#eceff1]"
                  onClick={onRefresh}
                  aria-label="Atualizar"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
                <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-[#90a4ae] hover:bg-[#eceff1]" aria-hidden>
                  <Crosshair className="h-4 w-4" />
                </Button>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="rounded-md bg-[#ede7f6] px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-[#5e35b1]">
                  NOVA
                </span>
                <span className="rounded-md bg-[#eceff1] px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-[#546e7a]">
                  COMERCIAL
                </span>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 lg:shrink-0">
            {showClaimNegotiation && onClaimNegotiation && !crmActionsDisabled && !negotiationReadOnly ? (
              <Button
                type="button"
                className="rounded-[10px] border-0 bg-primary px-4 py-2.5 font-semibold text-primary-foreground shadow-none hover:bg-primary/90"
                disabled={claimNegotiationPending || releaseNegotiationPending}
                onClick={onClaimNegotiation}
              >
                <Hand className="mr-2 h-4 w-4" aria-hidden />
                {claimNegotiationPending ? "Assumindo…" : "Assumir negócio"}
              </Button>
            ) : null}
            {showReleaseNegotiation && onReleaseNegotiation && !crmActionsDisabled && !negotiationReadOnly ? (
              <Button
                type="button"
                variant="outline"
                className="rounded-[10px] border-[#c4b5fd] bg-white px-4 py-2.5 font-semibold text-[#4E1BB1] shadow-none hover:bg-[#F3EBFC]"
                disabled={releaseNegotiationPending || claimNegotiationPending}
                onClick={onReleaseNegotiation}
              >
                <Users className="mr-2 h-4 w-4" aria-hidden />
                {releaseNegotiationPending ? "Devolvendo…" : "Devolver ao pool"}
              </Button>
            ) : null}
            <Button
              type="button"
              data-testid="crm-mark-loss"
              className="rounded-[10px] border-0 bg-red-600 px-4 py-2.5 font-semibold text-white shadow-none hover:bg-red-700 disabled:opacity-50"
              disabled={negotiationReadOnly || crmActionsDisabled}
              title={
                negotiationReadOnly
                  ? "Assuma o negócio para marcar perda"
                  : crmActionsDisabled
                    ? "Seu papel nao tem permissao para marcar perda"
                    : undefined
              }
              onClick={onMarkLoss}
            >
              <ThumbsDown className="mr-2 h-4 w-4" />
              Marcar perda
            </Button>
            <Button
              type="button"
              className="rounded-[10px] border-0 bg-emerald-600 px-4 py-2.5 font-semibold text-white shadow-none hover:bg-emerald-700 disabled:opacity-50"
              disabled={negotiationReadOnly || crmActionsDisabled}
              title={
                negotiationReadOnly
                  ? "Assuma o negócio para marcar venda"
                  : crmActionsDisabled
                    ? "Seu papel nao tem permissao para marcar venda"
                    : undefined
              }
              onClick={onMarkWin}
            >
              <ThumbsUp className="mr-2 h-4 w-4" />
              Marcar venda
            </Button>
          </div>
        </div>
      </header>

      {negotiationReadOnly ? (
        <div className="border-b border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-950 md:px-6">
          {negotiationAssigneeBlockedMessage()}
        </div>
      ) : null}

      <PipelineChevrons
        activeIndex={pipelineActiveIndex}
        daysContact={daysContact}
        stages={pipelineStages}
        onStageSelect={negotiationReadOnly || crmActionsDisabled ? undefined : onPipelineStageChange}
      />

      <div className="mx-auto grid max-w-[1600px] gap-6 px-4 py-6 md:px-6 lg:grid-cols-[minmax(280px,340px)_1fr] lg:items-start">
        <aside className="space-y-4">
          <Collapsible
            defaultOpen
            className="overflow-hidden border border-[#e8eaed] bg-[#fafafa]"
            style={{ borderRadius: RD_RADIUS, boxShadow: RD_CARD_SHADOW }}
          >
            <div className="flex items-center justify-between border-b border-[#eceff1] bg-[#f5f5f5] px-2 py-2 pl-4 md:px-3">
              <span className="text-sm font-semibold text-[#37474f]">Negociação</span>
              <div className="flex shrink-0 items-center">
                {onSaveNegotiationPanel && negotiationPanelSnapshot && !negotiationReadOnly && !crmActionsDisabled ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-[#90a4ae] hover:bg-[#eeeeee] hover:text-[#37474f]"
                    disabled={negoPanelEditing || negoSaveBusy}
                    aria-label="Editar campos da negociação"
                    onClick={startNegoPanelEdit}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                ) : null}
                <CollapsibleTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="group h-8 w-8 text-[#90a4ae] hover:bg-[#eeeeee]"
                    aria-label="Recolher ou expandir"
                  >
                    <ChevronDown className="h-4 w-4 shrink-0 transition-transform group-data-[state=open]:rotate-180" />
                  </Button>
                </CollapsibleTrigger>
              </div>
            </div>
            <CollapsibleContent>
              <div className="px-4 py-1">
                {!negoPanelEditing || !negoDraft ? (
                  <>
                    <NegField label="Nome" value={cliente.nome} />
                    {negotiationAssigneeLabel !== undefined ? (
                      <NegField label="Responsável" value={negotiationAssigneeLabel} />
                    ) : null}
                    <NegField label="Qualificação" value={qualView} />
                    <NegField label="Criada em" value={createdView} />
                    <NegField
                      label="Valor total"
                      value={
                        totalViewValue > 0
                          ? formatBRL(totalViewValue)
                          : ""
                      }
                    />
                    <NegField label="Previsão de fechamento" value={prevView} />
                    <NegField label="Fonte" value={fonteView} />
                    <NegField label="Campanha" value={sourceColumn(cliente, "campanha", "Campanha")} />
                    {customFieldsLoading && customFieldDefs.length > 0 ? (
                      <p className="border-b border-[#eceff1] py-2.5 text-[12px] text-[#90a4ae] last:border-b-0">
                        Carregando campos personalizados…
                      </p>
                    ) : (
                      customFieldsById.map(({ field, value }) => (
                        <NegField key={field.id} label={field.nome} value={value} />
                      ))
                    )}
                    <NegField label="Telefone" value={cliente.telefone ?? ""} />
                    <NegField label="E-mail" value={cliente.email ?? ""} />
                  </>
                ) : (
                  <>
                    <NegFieldEdit label="Nome">
                      <Input
                        value={negoDraft.nome}
                        onChange={(e) => setNegoDraft({ ...negoDraft, nome: e.target.value })}
                        className="h-9 border-[#ced4da]"
                        autoComplete="name"
                      />
                    </NegFieldEdit>
                    <NegFieldEdit label="Responsável">
                      <Select
                        value={negoDraft.assigneeId.trim() ? negoDraft.assigneeId : CRM_TASK_ASSIGNEE_NONE}
                        onValueChange={(v) =>
                          setNegoDraft({
                            ...negoDraft,
                            assigneeId: v === CRM_TASK_ASSIGNEE_NONE ? "" : v,
                          })
                        }
                      >
                        <SelectTrigger className="h-9 border-[#ced4da]">
                          <SelectValue placeholder="Pool (sem responsável)" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={CRM_TASK_ASSIGNEE_NONE}>Pool (sem responsável)</SelectItem>
                          {(crmTaskAssignees ?? []).map((a) => (
                            <SelectItem key={a.id} value={a.id}>
                              {a.nome?.trim() || a.id}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </NegFieldEdit>
                    <NegFieldEdit label="Qualificação">
                      <Input
                        type="number"
                        min={0}
                        max={5}
                        step={1}
                        value={negoDraft.qualification}
                        onChange={(e) => setNegoDraft({ ...negoDraft, qualification: e.target.value })}
                        className="h-9 border-[#ced4da]"
                      />
                    </NegFieldEdit>
                    <NegFieldEdit label="Criada em">
                      <Input value={createdView || "—"} readOnly className="h-9 border-[#e0e0e0] bg-[#f5f5f5]" />
                    </NegFieldEdit>
                    <NegFieldEdit label="Valor total">
                      <Input
                        type="number"
                        min={0}
                        step={0.01}
                        value={negoDraft.totalValue}
                        onChange={(e) => setNegoDraft({ ...negoDraft, totalValue: e.target.value })}
                        className="h-9 border-[#ced4da]"
                      />
                    </NegFieldEdit>
                    <NegFieldEdit label="Previsão de fechamento">
                      <Input
                        type="datetime-local"
                        value={negoDraft.closingForecastLocal}
                        onChange={(e) =>
                          setNegoDraft({ ...negoDraft, closingForecastLocal: e.target.value })
                        }
                        className="h-9 border-[#ced4da]"
                      />
                    </NegFieldEdit>
                    <NegFieldEdit label="Fonte">
                      <Select
                        value={negoDraft.origem || NEG_ORIGEM_NONE}
                        onValueChange={(v) =>
                          setNegoDraft({
                            ...negoDraft,
                            origem: v === NEG_ORIGEM_NONE ? "" : v,
                          })
                        }
                        disabled={!negotiationPanelCustomerLinked}
                      >
                        <SelectTrigger className="h-9 border-[#ced4da]">
                          <SelectValue placeholder="—" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={NEG_ORIGEM_NONE}>—</SelectItem>
                          <SelectItem value="organico">Orgânico</SelectItem>
                          <SelectItem value="pago">Pago</SelectItem>
                        </SelectContent>
                      </Select>
                    </NegFieldEdit>
                    <NegFieldEdit label="Campanha">
                      <Input
                        value={negoDraft.campanha}
                        onChange={(e) => setNegoDraft({ ...negoDraft, campanha: e.target.value })}
                        className="h-9 border-[#ced4da]"
                        disabled={!negotiationPanelCustomerLinked}
                      />
                    </NegFieldEdit>
                    {customFieldDefs.map((field) => (
                      <NegFieldEdit key={field.id} label={field.nome}>
                        <CustomerCustomFieldInput
                          field={field}
                          value={negoDraft.customFieldValues[field.id] ?? ""}
                          onChange={(value) =>
                            setNegoDraft({
                              ...negoDraft,
                              customFieldValues: {
                                ...negoDraft.customFieldValues,
                                [field.id]: value,
                              },
                            })
                          }
                          inputClassName="h-9 border-[#ced4da]"
                          labelClassName="sr-only"
                        />
                      </NegFieldEdit>
                    ))}
                    <NegFieldEdit label="Telefone">
                      <Input
                        value={negoDraft.telefone}
                        onChange={(e) => setNegoDraft({ ...negoDraft, telefone: e.target.value })}
                        className="h-9 border-[#ced4da]"
                        disabled={!negotiationPanelCustomerLinked}
                        autoComplete="tel"
                      />
                    </NegFieldEdit>
                    <NegFieldEdit label="E-mail">
                      <Input
                        type="email"
                        value={negoDraft.email}
                        onChange={(e) => setNegoDraft({ ...negoDraft, email: e.target.value })}
                        className="h-9 border-[#ced4da]"
                        disabled={!negotiationPanelCustomerLinked}
                        autoComplete="email"
                      />
                    </NegFieldEdit>
                    {!negotiationPanelCustomerLinked ? (
                      <p className="pt-2 text-[11px] leading-snug text-[#90a4ae]">
                        Vincule um cliente ao lead para editar telefone, e-mail, fonte e campos adicionais do cadastro.
                      </p>
                    ) : null}
                    <div className="flex flex-wrap justify-end gap-2 border-t border-[#eceff1] pt-3">
                      <Button
                        type="button"
                        variant="outline"
                        className="border-[#cfd8dc]"
                        disabled={negoSaveBusy}
                        onClick={cancelNegoPanelEdit}
                      >
                        Cancelar
                      </Button>
                      <Button
                        type="button"
                        className="border-0 font-semibold text-white"
                        style={{ backgroundColor: BRAND_ACCENT, borderRadius: RD_RADIUS }}
                        disabled={negoSaveBusy}
                        onClick={submitNegoPanelEdit}
                      >
                        {negoSaveBusy ? "Salvando…" : "Salvar"}
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>
        </aside>

        <main className="min-w-0 space-y-6">
          <Tabs defaultValue={mainTabDefault} className="w-full">
            <TabsList className="h-auto w-full flex-wrap justify-start gap-0 rounded-none border-b border-[#e8eaed] bg-transparent p-0">
              {(
                [
                  ["historico", "Histórico"],
                  ["email", "E-mail"],
                  ["tarefas", "Tarefas"],
                  ["questionarios", "Questionários"],
                  ["produtos", "Produtos"],
                  ["ligacoes", "Ligações"],
                  ["arquivos", "Arquivos"],
                  ["propostas", "Propostas"],
                ] as const
              ).map(([value, label]) => (
                <TabsTrigger
                  key={value}
                  value={value}
                  className={cn(
                    "rounded-none border-b-[3px] border-transparent px-4 py-3 text-sm font-medium text-[#78909c] data-[state=active]:border-b-[#4E1BB1] data-[state=active]:bg-transparent data-[state=active]:text-[#4E1BB1] data-[state=active]:shadow-none",
                  )}
                >
                  {label}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent
              value="historico"
              className="mt-0 space-y-4 border border-t-0 border-[#e8eaed] bg-white p-4 md:p-5"
              style={{ boxShadow: RD_CARD_SHADOW }}
            >
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-wrap gap-2">
                  <Select defaultValue="wchat">
                    <SelectTrigger className="h-9 w-[200px] rounded-md border-[#cfd8dc] bg-white text-sm">
                      <SelectValue placeholder="Origem" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="wchat">Do: wChat</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select defaultValue="todos">
                    <SelectTrigger className="h-9 w-[220px] rounded-md border-[#cfd8dc] bg-white text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Exibir: Todos os eventos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  type="button"
                  className="border-0 py-2.5 font-semibold text-white shadow-none hover:opacity-95 disabled:opacity-50"
                  style={{ backgroundColor: BRAND_ACCENT, borderRadius: RD_RADIUS }}
                  disabled={negotiationReadOnly || customerActionsDisabled}
                  title={
                    negotiationReadOnly
                      ? "Assuma o negócio para criar anotação"
                      : customerActionsDisabled
                        ? "Seu papel nao tem permissao para criar anotação"
                        : undefined
                  }
                  onClick={onCreateNote}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Criar anotação
                </Button>
              </div>

              <div className="relative pl-6">
                <div className="absolute bottom-0 left-[7px] top-2 w-px bg-[#cfd8dc]" aria-hidden />

                {promoVisible ? (
                  <div
                    className="relative mb-6 border border-[#e8eaed] bg-white pl-4"
                    style={{ borderRadius: RD_RADIUS, boxShadow: RD_CARD_SHADOW }}
                  >
                    <div className="absolute left-0 top-0 h-full w-1 rounded-l-lg bg-[#7e57c2]" aria-hidden />
                    <button
                      type="button"
                      className="absolute right-3 top-3 rounded p-1 text-[#90a4ae] hover:bg-[#f5f5f5]"
                      onClick={() => setPromoVisible(false)}
                      aria-label="Fechar"
                    >
                      <X className="h-4 w-4" />
                    </button>
                    <div className="p-4 pr-10">
                      <p className="font-semibold text-[#5e35b1]">Feche até 40% mais vendas</p>
                      <p className="mt-2 text-sm leading-relaxed text-[#78909c]">
                        Instale a extensão do WhatsApp no wChat para acompanhar negociações e responder mais rápido, sem sair do CRM.
                      </p>
                    </div>
                  </div>
                ) : null}

                <p className="text-sm text-[#78909c]">Linha do tempo de atividades do cliente.</p>
              </div>
            </TabsContent>

            {(["email", "questionarios", "propostas"] as const).map((value) => (
              <TabsContent
                key={value}
                value={value}
                className="mt-0 border border-t-0 border-[#e8eaed] bg-white p-8 text-center text-sm text-[#78909c]"
                style={{ boxShadow: RD_CARD_SHADOW }}
              >
                {negotiationReadOnly
                  ? negotiationAssigneeBlockedMessage()
                  : "Nenhum conteúdo nesta aba ainda."}
              </TabsContent>
            ))}
            <TabsContent
              value="produtos"
              className={cn(
                "mt-0 border border-t-0 border-[#e8eaed] bg-white",
                negotiationProductsSlot
                  ? "p-4 md:p-5 text-left"
                  : "p-8 text-center text-sm text-[#78909c]",
              )}
              style={{ boxShadow: RD_CARD_SHADOW }}
            >
              {negotiationProductsSlot ?? "Nenhum conteúdo nesta aba ainda."}
            </TabsContent>
            <TabsContent
              value="ligacoes"
              className={cn(
                "mt-0 border border-t-0 border-[#e8eaed] bg-white",
                negotiationCallsSlot ? "p-4 md:p-5 text-left" : "p-8 text-center text-sm text-[#78909c]",
              )}
              style={{ boxShadow: RD_CARD_SHADOW }}
            >
              {negotiationCallsSlot ?? "Nenhum conteúdo nesta aba ainda."}
            </TabsContent>
            <TabsContent
              value="tarefas"
              className="mt-0 overflow-hidden border border-t-0 border-[#e8eaed] bg-white p-0"
              style={{ boxShadow: RD_CARD_SHADOW }}
            >
              <ClienteRdPerfilTasksTabBody
                crmOpenTasks={crmOpenTasks}
                crmCompletedTasks={crmCompletedTasks}
                crmTaskScopeLabelMode={crmTaskScopeLabelMode}
                crmTasksLoading={crmTasksLoading ?? false}
                crmTaskAssignees={crmTaskAssignees}
                onCompleteCrmTask={onCompleteCrmTask}
                onReopenCrmTask={onReopenCrmTask}
                onDeleteCrmTask={onDeleteCrmTask}
                onSaveCrmTaskEdit={onSaveCrmTaskEdit}
                taskMutationBusy={taskMutationBusy}
                onCreateTask={onCreateTask}
                openTaskEdit={openTaskEdit}
                onRequestDeleteTask={(t) => setCrmTaskDelete(t)}
                readOnly={negotiationReadOnly || crmActionsDisabled}
              />
            </TabsContent>
            <TabsContent
              value="arquivos"
              className={cn(
                "mt-0 border border-t-0 border-[#e8eaed] bg-white",
                negotiationDocumentsSlot
                  ? "p-4 md:p-5"
                  : "p-8 text-center text-sm text-[#78909c]",
              )}
              style={{ boxShadow: RD_CARD_SHADOW }}
            >
              {negotiationDocumentsSlot ?? "Nenhum conteúdo nesta aba ainda."}
            </TabsContent>
          </Tabs>
        </main>
      </div>

      <AlertDialog
        open={crmTaskDelete != null}
        onOpenChange={(open) => {
          if (!open) {
            setCrmTaskDelete(null);
          }
        }}
      >
        <AlertDialogContent className="border-[#cfd8dc]">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir tarefa?</AlertDialogTitle>
            <AlertDialogDescription>
              {crmTaskDelete
                ? `“${crmTaskDelete.title}” será removida permanentemente. Esta ação não pode ser desfeita.`
                : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-[#cfd8dc]">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-[#c62828] text-white hover:bg-[#b71c1c]"
              onClick={() => {
                if (crmTaskDelete && onDeleteCrmTask) {
                  onDeleteCrmTask(crmTaskDelete.id);
                }
                setCrmTaskDelete(null);
              }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog
        open={taskEditOpen}
        onOpenChange={(open) => {
          setTaskEditOpen(open);
          if (!open) {
            setTaskEditTarget(null);
            setTaskEditAssigneeId("");
          }
        }}
      >
        <DialogContent className="border-[#cfd8dc] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar tarefa</DialogTitle>
            <DialogDescription>Atualize título, prazo, responsável ou observações.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="crm-task-edit-title">Título</Label>
              <Input
                id="crm-task-edit-title"
                value={taskEditTitle}
                onChange={(e) => setTaskEditTitle(e.target.value)}
                className="border-[#ced4da]"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="crm-task-edit-due">Prazo (opcional)</Label>
              <Input
                id="crm-task-edit-due"
                type="datetime-local"
                value={taskEditDueLocal}
                onChange={(e) => setTaskEditDueLocal(e.target.value)}
                className="border-[#ced4da]"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="crm-task-edit-notes">Observações (opcional)</Label>
              <Textarea
                id="crm-task-edit-notes"
                value={taskEditNotes}
                onChange={(e) => setTaskEditNotes(e.target.value)}
                rows={3}
                className="resize-none border-[#ced4da]"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="crm-task-edit-assignee">Responsável (opcional)</Label>
              <Select
                value={taskEditAssigneeId.trim() ? taskEditAssigneeId : CRM_TASK_ASSIGNEE_NONE}
                onValueChange={(v) => setTaskEditAssigneeId(v === CRM_TASK_ASSIGNEE_NONE ? "" : v)}
              >
                <SelectTrigger id="crm-task-edit-assignee" className="border-[#ced4da]">
                  <SelectValue placeholder="Sem responsável" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={CRM_TASK_ASSIGNEE_NONE}>Sem responsável</SelectItem>
                  {(crmTaskAssignees ?? []).map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.nome?.trim() || a.id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => setTaskEditOpen(false)}>
              Cancelar
            </Button>
            <Button
              type="button"
              className="bg-[#4E1BB1] hover:bg-[#4015A5]"
              disabled={!onSaveCrmTaskEdit || !taskEditTarget || taskMutationBusy}
              onClick={() => {
                void (async () => {
                  if (!taskEditTarget || !onSaveCrmTaskEdit) {
                    return;
                  }
                  const title = taskEditTitle.trim();
                  if (!title) {
                    toast({
                      title: "Título obrigatório",
                      description: "Informe um título para a tarefa.",
                      variant: "destructive",
                    });
                    return;
                  }
                  const patch: CrmTaskPatch = {
                    title,
                    dueAt: taskEditDueLocal.trim() ? new Date(taskEditDueLocal).toISOString() : null,
                    notes: taskEditNotes.trim(),
                    assigneeId: taskEditAssigneeId.trim() ? taskEditAssigneeId.trim() : null,
                  };
                  try {
                    await Promise.resolve(onSaveCrmTaskEdit({ id: taskEditTarget.id, patch }));
                    setTaskEditOpen(false);
                    setTaskEditTarget(null);
                  } catch {
                    /* toast na página */
                  }
                })();
              }}
            >
              {crmEditTaskPending ? "Salvando…" : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
