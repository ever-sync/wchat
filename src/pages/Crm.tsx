import { useCallback, useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  closestCorners,
  DndContext,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { Link, useNavigate } from "react-router-dom";
import {
  AlignJustify,
  ArrowDownUp,
  BarChart3,
  Calendar,
  ChevronDown,
  ClipboardCheck,
  ClipboardList,
  Footprints,
  Info,
  List,
  MoreVertical,
  Pause,
  Play,
  RefreshCw,
  Search,
  Sparkles,
  Star,
  ThumbsDown,
  ThumbsUp,
  Hand,
  MessageCircle,
  TrendingUp,
  User,
  Users,
  AlertTriangle,
  CalendarX2,
  Filter,
  X,
} from "lucide-react";
import { CrmCreateNegotiationDialog } from "@/components/crm/CrmCreateNegotiationDialog";
import { CrmKanbanCardTaskBadge } from "@/components/crm/CrmKanbanCardTaskBadge";
import { CrmNegotiationAlertBadges } from "@/components/crm/CrmNegotiationAlertBadges";
import { MarkLostDialog } from "@/components/crm/MarkLostDialog";
import { MarkWinDialog, type MarkWinConfirm } from "@/components/crm/MarkWinDialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useRolePermissions } from "@/hooks/useRolePermissions";
import { CrmOrphanNegotiationsBanner } from "@/components/crm/CrmOrphanNegotiationsBanner";
import {
  type ListCrmNegotiationsFilters,
  useClaimCrmNegotiation,
  useCrmNegotiationFunnelRefs,
  useCrmNegotiations,
  useReleaseCrmNegotiationToPool,
  useUpdateCrmNegotiation,
} from "@/lib/api/crm-negotiations";
import { useTenantCrmFunnelConfig } from "@/lib/api/crm-funnel-config";
import { useTenantSettings } from "@/lib/api/integrations";
import { useTenantCollaborators } from "@/lib/api/settings";
import { toCustomerUpsertInput, useCustomers, useUpdateCustomer } from "@/lib/api/customers";
import { useCrmNegotiationStageOverrides, useUpsertCrmNegotiationStageOverride } from "@/lib/api/crm-kanban";
import { canReleaseCrmNegotiationToPool } from "@/lib/crm/negotiation-assignee";
import {
  crmNegotiationRecordToCard,
  isPersistedCrmNegotiationId,
  resolveKanbanStageId,
} from "@/lib/crm/negotiation-model";
import {
  stageRequiredFields,
  validateNegotiationForStage,
} from "@/lib/crm/stage-requirements";
import {
  type CrmAlertsFilterMode,
  getNegotiationAlerts,
  isNegotiationUnassigned,
  negotiationMatchesAlertsFilter,
  normalizeStaleNegotiationDays,
} from "@/lib/crm/negotiation-alerts";
import {
  isSaleDestinationStage,
  negotiationHasCompletedSale,
  saleAttendantBlockedMessage,
  validateMarkWinLines,
} from "@/lib/crm/sale-rules";
import { invalidateSalesQueries, persistMarkWinSale } from "@/lib/crm/persist-mark-win-sale";
import {
  canAtendimentoModifyNegotiation,
  negotiationAssigneeBlockedMessage,
} from "@/lib/crm/negotiation-assignee";
import { CRM_FUNNEL_ID_KEY, CRM_PIPELINE_STAGE_KEY } from "@/lib/crm-pipeline";
import { isSupabaseConfigured } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import type { CrmFunnel, CrmStageDef } from "@/data/crm-funnels";
import { DEFAULT_CRM_FUNNELS, resolveConfiguredSaleStageId } from "@/data/crm-funnels";
import { E2E_POOL_NEGOTIATION } from "@/data/crm-e2e-fixtures";
import { MOCK_NEGOTIATIONS } from "@/data/crm-mock-negotiations";
import { isE2eMockAuth } from "@/lib/e2e";
import type { CrmNegotiation, CrmNegotiationStatus, Customer } from "@/types/domain";

export type { CrmNegotiation, CrmNegotiationStatus } from "@/types/domain";
export type { CrmFunnel } from "@/data/crm-funnels";

type SortId =
  | "priority"
  | "alpha_az"
  | "alpha_za"
  | "created_desc"
  | "created_asc"
  | "next_task"
  | "closing"
  | "contact_recent"
  | "contact_oldest"
  | "qualified_desc"
  | "qualified_asc"
  | "value_desc"
  | "value_asc"
  | "interaction_recent"
  | "interaction_oldest";

type AppliedOwner =
  | { mode: "all" }
  | { mode: "mine" }
  | { mode: "pool" }
  | { mode: "custom"; ids: string[] };

type OwnerDraft = {
  mode: "all" | "mine" | "pool" | "custom";
  customIds: Set<string>;
};

const STATUS_OPTIONS: {
  id: "all" | CrmNegotiationStatus;
  label: string;
  icon: typeof ClipboardList;
}[] = [
  { id: "all", label: "Todos os status", icon: ClipboardCheck },
  { id: "em_andamento", label: "Em andamento", icon: Footprints },
  { id: "vendido", label: "Vendido", icon: ThumbsUp },
  { id: "perdido", label: "Perdido", icon: ThumbsDown },
  { id: "pausado", label: "Pausado", icon: Pause },
  { id: "nao_pausado", label: "Não pausado", icon: Play },
];

const SORT_OPTIONS: { id: SortId; label: string }[] = [
  { id: "priority", label: "Prioridade (qualif. × valor × tarefa)" },
  { id: "alpha_az", label: "Alfabética A-Z" },
  { id: "alpha_za", label: "Alfabética Z-A" },
  { id: "created_desc", label: "Criadas por último" },
  { id: "created_asc", label: "Criadas primeiro" },
  { id: "next_task", label: "Data da próxima tarefa" },
  { id: "closing", label: "Previsão de fechamento" },
  { id: "contact_recent", label: "Contato mais recente" },
  { id: "contact_oldest", label: "Contato mais antigo" },
  { id: "qualified_desc", label: "Mais qualificadas" },
  { id: "qualified_asc", label: "Menos qualificadas" },
  { id: "value_desc", label: "Maior valor total" },
  { id: "value_asc", label: "Menor valor total" },
  { id: "interaction_recent", label: "Interação mais recente" },
  { id: "interaction_oldest", label: "Interação mais antiga" },
];

const BASE_ATTENDANTS = [
  { id: "att-hitalo", name: "Hitalo Viana" },
  { id: "att-jorge", name: "Jorge Menezes Seixas" },
  { id: "att-rafael", name: "Rafael Santos" },
  { id: "att-nessa", name: "nessa" },
  { id: "att-recup", name: "recuperei lead" },
];

function statusLabel(status: CrmNegotiationStatus): string {
  const row = STATUS_OPTIONS.find((s) => s.id === status);
  return row?.label ?? status;
}

/** Intervalo de filtro por data de criação (`yyyy-mm-dd`). */
type CreationDateRangeIso = { from: string; to: string };

function parseDateRangeIso(filter: CreationDateRangeIso): { from: Date; to: Date } | null {
  const from = new Date(`${filter.from}T00:00:00`);
  const to = new Date(`${filter.to}T23:59:59.999`);
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
    return null;
  }
  return { from, to };
}

function formatIsoDateToBr(isoDay: string): string {
  const [y, m, d] = isoDay.split("-");
  if (!y || !m || !d) {
    return isoDay;
  }
  return `${d}/${m}/${y}`;
}

function stageTitleForNegotiation(card: CrmNegotiation, funnels: CrmFunnel[]): string {
  const f = funnels.find((x) => x.id === card.funnelId);
  return f?.stages.find((s) => s.id === card.stageId)?.title ?? card.stageId;
}

/** Prazo da próxima tarefa aberta (rollup em `crm_negotiations.next_task_at`). */
function negotiationNextTaskDueMeta(iso: string | undefined): { label: string; overdue: boolean } {
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

function resolveCustomerIdForNegotiation(card: CrmNegotiation, customers: Customer[]): string | null {
  if (card.customerId) {
    const byId = customers.find((c) => c.id === card.customerId);
    if (byId) return byId.id;
  }
  const t = card.title.trim().toLowerCase();
  const exact = customers.find((c) => c.nome.trim().toLowerCase() === t);
  if (exact) return exact.id;
  return null;
}

function appliedToOwnerDraft(applied: AppliedOwner): OwnerDraft {
  if (applied.mode === "custom") {
    return { mode: "custom", customIds: new Set(applied.ids) };
  }
  if (applied.mode === "pool") {
    return { mode: "pool", customIds: new Set() };
  }
  return { mode: applied.mode, customIds: new Set() };
}

function draftToApplied(draft: OwnerDraft, profileId: string | undefined): AppliedOwner {
  if (draft.mode === "all" || draft.mode === "mine" || draft.mode === "pool") {
    return { mode: draft.mode };
  }
  const ids = [...draft.customIds];
  if (ids.length === 0) {
    return { mode: "all" };
  }
  if (profileId && ids.length === 1 && ids[0] === profileId) {
    return { mode: "mine" };
  }
  return { mode: "custom", ids };
}

function matchesOwner(n: CrmNegotiation, applied: AppliedOwner, profileId: string | undefined): boolean {
  if (applied.mode === "all") {
    return true;
  }
  if (applied.mode === "pool") {
    return isNegotiationUnassigned(n.assigneeId);
  }
  if (applied.mode === "mine") {
    return Boolean(profileId && n.assigneeId === profileId);
  }
  return applied.ids.includes(n.assigneeId);
}

function compareNegotiations(a: CrmNegotiation, b: CrmNegotiation, sortId: SortId): number {
  const str = (x: string | undefined, y: string | undefined, desc: boolean) => {
    const vx = x ?? "";
    const vy = y ?? "";
    const c = vx.localeCompare(vy, "pt-BR", { sensitivity: "base" });
    return desc ? -c : c;
  };
  const num = (x: number, y: number, desc: boolean) => (desc ? y - x : x - y);
  const time = (x: string | undefined, y: string | undefined, desc: boolean) => {
    const tx = x ? new Date(x).getTime() : desc ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY;
    const ty = y ? new Date(y).getTime() : desc ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY;
    return desc ? ty - tx : tx - ty;
  };

  switch (sortId) {
    case "priority": {
      const q = num(a.qualification, b.qualification, true);
      if (q !== 0) {
        return q;
      }
      const v = num(a.totalValue, b.totalValue, true);
      if (v !== 0) {
        return v;
      }
      const nt = time(a.nextTaskAt, b.nextTaskAt, false);
      if (nt !== 0) {
        return nt;
      }
      return time(a.createdAt, b.createdAt, true);
    }
    case "alpha_az":
      return str(a.title, b.title, false);
    case "alpha_za":
      return str(a.title, b.title, true);
    case "created_desc":
      return time(a.createdAt, b.createdAt, true);
    case "created_asc":
      return time(a.createdAt, b.createdAt, false);
    case "next_task":
      return time(a.nextTaskAt, b.nextTaskAt, false);
    case "closing":
      return time(a.closingForecast, b.closingForecast, false);
    case "contact_recent":
      return time(a.lastContactAt, b.lastContactAt, true);
    case "contact_oldest":
      return time(a.lastContactAt, b.lastContactAt, false);
    case "qualified_desc":
      return num(a.qualification, b.qualification, true);
    case "qualified_asc":
      return num(a.qualification, b.qualification, false);
    case "value_desc":
      return num(a.totalValue, b.totalValue, true);
    case "value_asc":
      return num(a.totalValue, b.totalValue, false);
    case "interaction_recent":
      return time(a.lastInteractionAt, b.lastInteractionAt, true);
    case "interaction_oldest":
      return time(a.lastInteractionAt, b.lastInteractionAt, false);
    default:
      return 0;
  }
}

export default function Crm() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { profile } = useAuth();
  const { can } = useRolePermissions();
  const profileId = profile?.id;
  const canEditCrm = can("crm", "edit");
  const { data: customers = [] } = useCustomers({});
  const { data: stageOverrides = {} } = useCrmNegotiationStageOverrides();
  const upsertStageOverride = useUpsertCrmNegotiationStageOverride();
  const updateCustomer = useUpdateCustomer();
  const updateCrmNegotiation = useUpdateCrmNegotiation();
  const claimCrmNegotiation = useClaimCrmNegotiation();
  const releaseCrmNegotiation = useReleaseCrmNegotiationToPool();
  const canReleaseToPool = canReleaseCrmNegotiationToPool(profile?.role);

  const openChatInbox = useCallback(
    (chatId: string) => {
      navigate(`/inbox?chatId=${encodeURIComponent(chatId)}`);
    },
    [navigate],
  );

  const { data: tenantFunnelsSaved } = useTenantCrmFunnelConfig({
    enabled: isSupabaseConfigured,
  });
  const funnels = useMemo(
    () => tenantFunnelsSaved ?? DEFAULT_CRM_FUNNELS,
    [tenantFunnelsSaved],
  );
  const { data: collaborators = [] } = useTenantCollaborators({
    enabled: isSupabaseConfigured,
  });
  const { data: tenantSettings } = useTenantSettings();
  const staleNegotiationDays = useMemo(
    () => normalizeStaleNegotiationDays(tenantSettings?.staleNegotiationDays),
    [tenantSettings?.staleNegotiationDays],
  );

  const [funnelId, setFunnelId] = useState(DEFAULT_CRM_FUNNELS[0].id);
  const [appliedOwner, setAppliedOwner] = useState<AppliedOwner>({ mode: "all" });
  const [statusFilter, setStatusFilter] = useState<(typeof STATUS_OPTIONS)[number]["id"]>("all");
  const [alertsFilter, setAlertsFilter] = useState<CrmAlertsFilterMode>("off");
  const [alertsFilterOpen, setAlertsFilterOpen] = useState(false);
  const [creationDateFilter, setCreationDateFilter] = useState<CreationDateRangeIso | null>(null);

  useEffect(() => {
    if (funnels.some((f) => f.id === funnelId)) {
      return;
    }
    setFunnelId(funnels[0]?.id ?? DEFAULT_CRM_FUNNELS[0].id);
  }, [funnelId, funnels]);

  const funnel = funnels.find((f) => f.id === funnelId) ?? funnels[0] ?? DEFAULT_CRM_FUNNELS[0];

  const crmListFilters = useMemo((): ListCrmNegotiationsFilters => {
    const f: ListCrmNegotiationsFilters = { funnelId };
    if (statusFilter !== "all") {
      f.status = statusFilter;
    }
    const range = creationDateFilter ? parseDateRangeIso(creationDateFilter) : null;
    if (range) {
      f.createdFromIso = range.from.toISOString();
      f.createdToIso = range.to.toISOString();
    }
    if (appliedOwner.mode === "pool") {
      f.unassignedOnly = true;
    } else if (appliedOwner.mode === "mine" && profileId) {
      f.assigneeIds = [profileId];
    } else if (appliedOwner.mode === "custom" && appliedOwner.ids.length > 0) {
      f.assigneeIds = appliedOwner.ids;
    }
    return f;
  }, [appliedOwner, creationDateFilter, funnelId, profileId, statusFilter]);

  const { data: dbRecords = [] } = useCrmNegotiations(crmListFilters);
  const { data: negotiationFunnelRefs = [] } = useCrmNegotiationFunnelRefs({
    enabled: isSupabaseConfigured,
  });

  const [createOpen, setCreateOpen] = useState(false);
  const [lostDialogOpen, setLostDialogOpen] = useState(false);
  const [winDialogOpen, setWinDialogOpen] = useState(false);
  const [e2eAssigneeOverrides, setE2eAssigneeOverrides] = useState<Record<string, string>>({});
  const [pendingLostDrag, setPendingLostDrag] = useState<{
    negId: string;
    card: CrmNegotiation;
    stageDropId: string;
    cid: string | null;
    stageTitle: string;
  } | null>(null);
  const [pendingWinDrag, setPendingWinDrag] = useState<{
    negId: string;
    card: CrmNegotiation;
    stageDropId: string;
    cid: string | null;
    stageTitle: string;
  } | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
  );

  /** Supabase: `crm_negotiations`. Sem Supabase: mocks + override local / `crm_negotiation_stages`. */
  const sourceNegotiations = useMemo(() => {
    const mergeMock = () => {
      const baseMocks = isE2eMockAuth
        ? [
            ...MOCK_NEGOTIATIONS.filter((n) => n.id !== E2E_POOL_NEGOTIATION.id),
            E2E_POOL_NEGOTIATION,
          ]
        : MOCK_NEGOTIATIONS;

      return baseMocks.map((n) => {
        let merged: CrmNegotiation = { ...n };
        if (profileId && n.id === "netoneto" && !isE2eMockAuth) {
          merged = { ...merged, assigneeId: profileId };
        }
        const e2eAssignee = e2eAssigneeOverrides[merged.id];
        if (e2eAssignee !== undefined) {
          merged = { ...merged, assigneeId: e2eAssignee };
        }
        const funnelDef = funnels.find((f) => f.id === merged.funnelId);
        const validStageIds = new Set((funnelDef?.stages ?? []).map((s) => s.id));
        const cid = resolveCustomerIdForNegotiation(merged, customers);
        const customer = cid ? customers.find((c) => c.id === cid) : undefined;
        const stageId = resolveKanbanStageId({
          base: merged,
          funnelId: merged.funnelId,
          validStageIds,
          customer,
          stageOverride: stageOverrides[merged.id],
          persisted: null,
        });
        return { ...merged, stageId };
      });
    };

    if (!isSupabaseConfigured) {
      return mergeMock();
    }

    return dbRecords.map((row) => {
      const base = crmNegotiationRecordToCard(row);
      const funnelDef = funnels.find((f) => f.id === base.funnelId);
      const validStageIds = new Set((funnelDef?.stages ?? []).map((s) => s.id));
      const cid = row.customerId ?? resolveCustomerIdForNegotiation(base, customers);
      const customer = cid ? customers.find((c) => c.id === cid) : undefined;
      const stageId = resolveKanbanStageId({
        base,
        funnelId: base.funnelId,
        validStageIds,
        customer,
        stageOverride: stageOverrides[base.id],
        persisted: { funnelId: row.funnelId, stageId: row.stageId },
      });
      return {
        ...base,
        stageId,
        customerId: row.customerId ?? base.customerId,
      };
    });
  }, [customers, dbRecords, e2eAssigneeOverrides, funnels, profileId, stageOverrides]);

  const attendants = useMemo(() => {
    if (isSupabaseConfigured) {
      return collaborators
        .filter((c) => c.status === "active")
        .map((c) => ({
          id: c.id,
          name: (c.nome?.trim() || c.email?.trim() || "Sem nome").trim(),
        }));
    }
    const map = new Map<string, string>();
    for (const a of BASE_ATTENDANTS) {
      map.set(a.id, a.name);
    }
    if (profileId && profile?.nome) {
      map.set(profileId, profile.nome);
    }
    return [...map.entries()].map(([id, name]) => ({ id, name }));
  }, [collaborators, isSupabaseConfigured, profile?.nome, profileId]);

  const crmAttendantOptions = useMemo(() => {
    if (isSupabaseConfigured) {
      return collaborators
        .filter((c) => c.status === "active" && c.role === "atendimento")
        .map((c) => ({
          id: c.id,
          name: (c.nome?.trim() || c.email?.trim() || "Sem nome").trim(),
        }));
    }
    return attendants;
  }, [attendants, collaborators, isSupabaseConfigured]);

  const [view, setView] = useState<"board" | "list">("board");
  const [sortId, setSortId] = useState<SortId>("created_desc");

  const [funnelOpen, setFunnelOpen] = useState(false);
  const [filtersPopoverOpen, setFiltersPopoverOpen] = useState(false);
  const [ownerOpen, setOwnerOpen] = useState(false);
  const [ownerDraft, setOwnerDraft] = useState<OwnerDraft>({ mode: "all", customIds: new Set() });
  const [ownerSearch, setOwnerSearch] = useState("");
  const [statusOpen, setStatusOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);

  // Realtime para crm_negotiations / tenant_crm_funnel_config é tratado
  // globalmente em useCrmRealtimeSync, montado via CrmNotificationListener.

  const onOwnerOpenChange = useCallback(
    (open: boolean) => {
      setOwnerOpen(open);
      if (open) {
        setOwnerDraft(appliedToOwnerDraft(appliedOwner));
        setOwnerSearch("");
      }
    },
    [appliedOwner],
  );

  const clearAllCrmFilters = useCallback(() => {
    setCreationDateFilter(null);
    setAppliedOwner({ mode: "all" });
    setStatusFilter("all");
    setAlertsFilter("off");
    toast({ title: "Filtros limpos", description: "Exibindo todas as negociações do funil." });
  }, [toast]);

  const negotiationsBeforeAlertsFilter = useMemo(() => {
    let list: CrmNegotiation[];

    if (isSupabaseConfigured) {
      list = sourceNegotiations;
    } else {
      const range = creationDateFilter ? parseDateRangeIso(creationDateFilter) : null;
      list = sourceNegotiations.filter((n) => n.funnelId === funnelId);
      if (statusFilter !== "all") {
        list = list.filter((n) => n.status === statusFilter);
      }
      list = list.filter((n) => matchesOwner(n, appliedOwner, profileId));
      if (range) {
        list = list.filter((n) => {
          const d = new Date(n.createdAt);
          return d >= range.from && d <= range.to;
        });
      }
    }

    return list;
  }, [
    appliedOwner,
    creationDateFilter,
    funnelId,
    isSupabaseConfigured,
    profileId,
    sourceNegotiations,
    statusFilter,
  ]);

  const filteredNegotiations = useMemo(() => {
    let list = negotiationsBeforeAlertsFilter;
    if (alertsFilter !== "off") {
      list = list.filter((n) =>
        negotiationMatchesAlertsFilter(n, alertsFilter, undefined, staleNegotiationDays),
      );
    }
    return [...list].sort((a, b) => compareNegotiations(a, b, sortId));
  }, [alertsFilter, negotiationsBeforeAlertsFilter, sortId, staleNegotiationDays]);

  const alertCountsInView = useMemo(() => {
    let any = 0;
    let stale = 0;
    let noFutureTask = 0;
    for (const n of negotiationsBeforeAlertsFilter) {
      const alerts = getNegotiationAlerts(n, undefined, staleNegotiationDays);
      if (alerts.length === 0) {
        continue;
      }
      any += 1;
      if (alerts.some((a) => a.kind === "stale")) {
        stale += 1;
      }
      if (alerts.some((a) => a.kind === "no_future_task")) {
        noFutureTask += 1;
      }
    }
    return { any, stale, noFutureTask };
  }, [negotiationsBeforeAlertsFilter, staleNegotiationDays]);

  const stagesWithCards = useMemo(() => {
    const byStage = new Map<string, CrmNegotiation[]>();
    for (const s of funnel.stages) {
      byStage.set(s.id, []);
    }
    for (const n of filteredNegotiations) {
      const bucket = byStage.get(n.stageId);
      if (bucket) {
        bucket.push(n);
      }
    }
    return funnel.stages.map((s) => ({
      ...s,
      cards: byStage.get(s.id) ?? [],
    }));
  }, [filteredNegotiations, funnel.stages]);

  const totalNegotiations = filteredNegotiations.length;

  const funnelTriggerLabel = funnel.listName;

  const poolCountInFunnel = useMemo(
    () =>
      sourceNegotiations.filter(
        (n) => n.funnelId === funnelId && isNegotiationUnassigned(n.assigneeId),
      ).length,
    [funnelId, sourceNegotiations],
  );

  const ownerTriggerLabel = useMemo(() => {
    if (appliedOwner.mode === "all") {
      return "Todas as negociações";
    }
    if (appliedOwner.mode === "pool") {
      return "Pool (sem responsável)";
    }
    if (appliedOwner.mode === "mine") {
      return "Minhas negociações";
    }
    if (appliedOwner.ids.length === 1) {
      const name = attendants.find((a) => a.id === appliedOwner.ids[0])?.name;
      return name ?? "1 responsável";
    }
    return `${appliedOwner.ids.length} responsáveis`;
  }, [appliedOwner, attendants]);

  const statusTriggerLabel =
    STATUS_OPTIONS.find((s) => s.id === statusFilter)?.label ?? "Todos os status";

  const sortTriggerLabel = SORT_OPTIONS.find((s) => s.id === sortId)?.label ?? "Ordenar";

  const alertsFilterTriggerLabel = useMemo(() => {
    if (alertsFilter === "any") {
      return "Com alertas";
    }
    if (alertsFilter === "stale") {
      return "Parado";
    }
    if (alertsFilter === "no_future_task") {
      return "Sem tarefa futura";
    }
    return "Alertas";
  }, [alertsFilter]);

  const extraFilterCount =
    (creationDateFilter ? 1 : 0) +
    (appliedOwner.mode !== "all" ? 1 : 0) +
    (statusFilter !== "all" ? 1 : 0) +
    (alertsFilter !== "off" ? 1 : 0);

  const filteredAttendants = useMemo(() => {
    const q = ownerSearch.trim().toLowerCase();
    if (!q) {
      return attendants;
    }
    return attendants.filter((a) => a.name.toLowerCase().includes(q));
  }, [attendants, ownerSearch]);

  const openNegotiationCard = useCallback(
    (card: CrmNegotiation) => {
      if (isPersistedCrmNegotiationId(card.id)) {
        navigate(`/crm/negociacao/${encodeURIComponent(card.id)}`);
        return;
      }
      const cid = resolveCustomerIdForNegotiation(card, customers);
      if (cid) {
        navigate(`/clientes/${cid}`);
        return;
      }
      navigate(`/crm/negociacao/${encodeURIComponent(card.id)}`);
    },
    [customers, navigate],
  );

  const handleClaimNegotiation = useCallback(
    async (card: CrmNegotiation) => {
      if (!profileId || !isPersistedCrmNegotiationId(card.id)) {
        return;
      }
      if (isE2eMockAuth && !isSupabaseConfigured) {
        setE2eAssigneeOverrides((prev) => ({ ...prev, [card.id]: profileId }));
        toast({
          title: "Negócio assumido",
          description: `Você é o responsável por "${card.title}".`,
        });
        return;
      }
      try {
        await claimCrmNegotiation.mutateAsync(card.id);
        toast({
          title: "Negócio assumido",
          description: `Você é o responsável por "${card.title}".`,
        });
      } catch (err) {
        toast({
          title: "Não foi possível assumir",
          description: err instanceof Error ? err.message : "Tente novamente.",
          variant: "destructive",
        });
      }
    },
    [claimCrmNegotiation, profileId, toast],
  );

  const canClaimNegotiations = Boolean(profileId) && (isSupabaseConfigured || isE2eMockAuth);

  const handleReleaseNegotiation = useCallback(
    async (card: CrmNegotiation) => {
      if (!canReleaseToPool || !isPersistedCrmNegotiationId(card.id)) {
        return;
      }
      if (isNegotiationUnassigned(card.assigneeId)) {
        return;
      }
      try {
        await releaseCrmNegotiation.mutateAsync(card.id);
        toast({
          title: "Devolvido ao pool",
          description: `"${card.title}" está sem responsável.`,
        });
      } catch (err) {
        toast({
          title: "Não foi possível devolver",
          description: err instanceof Error ? err.message : "Tente novamente.",
          variant: "destructive",
        });
      }
    },
    [canReleaseToPool, releaseCrmNegotiation, toast],
  );

  const negotiationsWithAlertsCount = alertCountsInView.any;

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over) {
        return;
      }
      const negId = String(active.id).startsWith("neg-") ? String(active.id).slice(4) : null;
      let stageDropId = String(over.id).startsWith("stage-") ? String(over.id).slice(6) : null;
      if (!stageDropId && String(over.id).startsWith("neg-")) {
        const overNegId = String(over.id).slice(4);
        stageDropId = sourceNegotiations.find((n) => n.id === overNegId)?.stageId ?? null;
      }
      if (!negId || !stageDropId) {
        return;
      }

      const card = sourceNegotiations.find((n) => n.id === negId);
      if (!card || card.funnelId !== funnelId) {
        return;
      }

      const funnelDef = funnels.find((f) => f.id === funnelId);
      if (!funnelDef?.stages.some((s) => s.id === stageDropId)) {
        return;
      }

      if (card.stageId === stageDropId) {
        return;
      }

      const dragAssigneeId = dbRecords.find((r) => r.id === negId)?.assigneeId ?? card.assigneeId;
      if (!canAtendimentoModifyNegotiation(profile?.role, dragAssigneeId, profileId)) {
        toast({
          title: "Assuma o negócio",
          description: negotiationAssigneeBlockedMessage(),
          variant: "destructive",
        });
        return;
      }

      const cid = resolveCustomerIdForNegotiation(card, customers);
      const stageTitle = funnelDef.stages.find((s) => s.id === stageDropId)?.title ?? stageDropId;

      const dbRow = dbRecords.find((r) => r.id === negId);
      const required = stageRequiredFields(funnels, funnelId, stageDropId);
      if (required.length > 0) {
        const validationError = validateNegotiationForStage(
          dbRow ?? {
            totalValue: card.totalValue,
            qualification: card.qualification,
            closingForecast: card.closingForecast ?? null,
            nextTaskAt: card.nextTaskAt ?? null,
          },
          required,
        );
        if (validationError) {
          toast({
            title: "Campos obrigatórios",
            description: validationError,
            variant: "destructive",
          });
          return;
        }
      }

      if (stageDropId === "perdido") {
        const persistedRow = isPersistedCrmNegotiationId(negId);
        if (!persistedRow) {
          toast({
            title: "Marcar perda",
            description: "Crie a negociação no banco antes de marcar como perdido.",
            variant: "destructive",
          });
          return;
        }
        setPendingLostDrag({ negId, card, stageDropId, cid, stageTitle });
        setLostDialogOpen(true);
        return;
      }

      if (isSaleDestinationStage(funnels, funnelId, stageDropId)) {
        const persistedRow = isPersistedCrmNegotiationId(negId);
        if (!persistedRow) {
          toast({
            title: "Marcar venda",
            description: "Crie a negociação no banco antes de registrar a venda.",
            variant: "destructive",
          });
          return;
        }
        const row = dbRecords.find((r) => r.id === negId);
        const assigneeId = row?.assigneeId ?? card.assigneeId;
        if (isNegotiationUnassigned(assigneeId)) {
          toast({
            title: "Sem responsável",
            description: saleAttendantBlockedMessage("crm"),
            variant: "destructive",
          });
          return;
        }
        if (
          !negotiationHasCompletedSale({
            status: row?.status ?? card.status,
            totalValue: row?.totalValue ?? card.totalValue,
          })
        ) {
          setPendingWinDrag({ negId, card, stageDropId, cid, stageTitle });
          setWinDialogOpen(true);
          return;
        }
      }

      try {
        const persistedRow = isPersistedCrmNegotiationId(negId);
        if (persistedRow) {
          await updateCrmNegotiation.mutateAsync({
            id: negId,
            patch: { stageId: stageDropId, funnelId },
          });
        }
        if (cid) {
          const customer = customers.find((c) => c.id === cid);
          if (!customer) {
            return;
          }
          await updateCustomer.mutateAsync({
            id: cid,
            input: {
              ...toCustomerUpsertInput(customer),
              sourceColumns: {
                ...customer.sourceColumns,
                [CRM_PIPELINE_STAGE_KEY]: stageDropId,
                [CRM_FUNNEL_ID_KEY]: funnelId,
              },
            },
          });
        } else if (!persistedRow) {
          await upsertStageOverride.mutateAsync({
            negotiationId: card.id,
            funnelId,
            stageId: stageDropId,
          });
        }
        toast({
          title: "Etapa salva",
          description: `${card.title} → ${stageTitle}`,
        });
      } catch (e) {
        toast({
          title: "Não foi possível salvar",
          description: e instanceof Error ? e.message : "Tente novamente.",
          variant: "destructive",
        });
      }
    },
    [
      customers,
      dbRecords,
      funnelId,
      funnels,
      profile?.role,
      profileId,
      sourceNegotiations,
      toast,
      updateCrmNegotiation,
      updateCustomer,
      upsertStageOverride,
    ],
  );

  const completeWinDrag = useCallback(
    async ({ lines, totalValue }: MarkWinConfirm) => {
      const pending = pendingWinDrag;
      if (!pending) {
        return;
      }
      const lineError = validateMarkWinLines(lines);
      if (lineError) {
        toast({ title: "Venda incompleta", description: lineError, variant: "destructive" });
        throw new Error(lineError);
      }
      if (
        !canAtendimentoModifyNegotiation(
          profile?.role,
          pending.card.assigneeId,
          profileId,
        )
      ) {
        toast({
          title: "Assuma o negócio",
          description: negotiationAssigneeBlockedMessage(),
          variant: "destructive",
        });
        throw new Error("negotiation_not_owned");
      }
      try {
        const saleStageId = resolveConfiguredSaleStageId(funnels, funnelId);
        await updateCrmNegotiation.mutateAsync({
          id: pending.negId,
          patch: {
            status: "vendido",
            stageId: saleStageId,
            funnelId,
            totalValue,
          },
        });
        if (isSupabaseConfigured) {
          const soldBy = pending.card.assigneeId?.trim() || profileId;
          if (soldBy) {
            await persistMarkWinSale({
              chatId: pending.card.sourceChatId ?? null,
              customerId: pending.cid,
              soldBy,
              lines,
            });
            invalidateSalesQueries(queryClient, pending.cid);
          }
        }
        if (pending.cid) {
          const customer = customers.find((c) => c.id === pending.cid);
          if (customer) {
            await updateCustomer.mutateAsync({
              id: pending.cid,
              input: {
                ...toCustomerUpsertInput(customer),
                sourceColumns: {
                  ...customer.sourceColumns,
                  [CRM_PIPELINE_STAGE_KEY]: saleStageId,
                  [CRM_FUNNEL_ID_KEY]: funnelId,
                },
              },
            });
          }
        }
        toast({
          title: "Venda registrada",
          description: `${pending.card.title} → ${pending.stageTitle}`,
        });
        setPendingWinDrag(null);
      } catch (e) {
        toast({
          title: "Não foi possível salvar",
          description: e instanceof Error ? e.message : "Tente novamente.",
          variant: "destructive",
        });
        throw e;
      }
    },
    [
      customers,
      funnelId,
      funnels,
      pendingWinDrag,
      profileId,
      queryClient,
      toast,
      updateCrmNegotiation,
      updateCustomer,
    ],
  );

  const completeLostDrag = useCallback(
    async (lostReason: string) => {
      const pending = pendingLostDrag;
      if (!pending) return;
      const dragAssigneeId =
        dbRecords.find((r) => r.id === pending.negId)?.assigneeId ?? pending.card.assigneeId;
      if (!canAtendimentoModifyNegotiation(profile?.role, dragAssigneeId, profileId)) {
        toast({
          title: "Assuma o negócio",
          description: negotiationAssigneeBlockedMessage(),
          variant: "destructive",
        });
        throw new Error("negotiation_not_owned");
      }
      try {
        await updateCrmNegotiation.mutateAsync({
          id: pending.negId,
          patch: {
            status: "perdido",
            stageId: pending.stageDropId,
            funnelId,
            lostReason,
          },
        });
        if (pending.cid) {
          const customer = customers.find((c) => c.id === pending.cid);
          if (customer) {
            await updateCustomer.mutateAsync({
              id: pending.cid,
              input: {
                ...toCustomerUpsertInput(customer),
                sourceColumns: {
                  ...customer.sourceColumns,
                  [CRM_PIPELINE_STAGE_KEY]: pending.stageDropId,
                  [CRM_FUNNEL_ID_KEY]: funnelId,
                },
              },
            });
          }
        }
        toast({
          title: "Negociação perdida",
          description: `${pending.card.title} → ${pending.stageTitle}`,
        });
        setPendingLostDrag(null);
      } catch (e) {
        toast({
          title: "Não foi possível salvar",
          description: e instanceof Error ? e.message : "Tente novamente.",
          variant: "destructive",
        });
        throw e;
      }
    },
    [
      customers,
      dbRecords,
      funnelId,
      pendingLostDrag,
      profile?.role,
      profileId,
      toast,
      updateCrmNegotiation,
      updateCustomer,
    ],
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-[#F8F9FA] text-[#212529]">
      <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 border-b border-[#dee2e6] bg-white px-4 py-3 md:gap-3 md:px-6">
        <div className="mr-auto inline-flex overflow-hidden rounded-md border border-[#ced4da] bg-white shadow-sm">
          <button
            type="button"
            aria-pressed={view === "board"}
            onClick={() => setView("board")}
            className={cn(
              "flex h-9 w-10 items-center justify-center transition-colors",
              view === "board" ? "bg-[#4E1BB1] text-white" : "bg-[#F3EBFC] text-[#5B2FD4]",
            )}
          >
            <BarChart3 className="h-4 w-4" aria-hidden />
          </button>
          <button
            type="button"
            aria-pressed={view === "list"}
            onClick={() => setView("list")}
            className={cn(
              "flex h-9 w-10 items-center justify-center transition-colors",
              view === "list" ? "bg-[#4E1BB1] text-white" : "bg-[#F3EBFC] text-[#5B2FD4]",
            )}
          >
            <List className="h-4 w-4" aria-hidden />
          </button>
        </div>

        <Button
          type="button"
          variant="outline"
          className="h-9 gap-2 border-[#ced4da] bg-white text-sm font-medium text-[#4E1BB1] hover:bg-[#f1f3f5]"
          onClick={() => {
            setSortId("priority");
            toast({
              title: "Priorização aplicada",
              description: "Ordenação: qualificação e valor (maior primeiro), depois tarefa mais próxima e criação recente.",
            });
          }}
        >
          <Sparkles className="h-4 w-4 text-[#5B2FD4]" aria-hidden />
          Priorizar negociações
        </Button>

        <div className="flex items-center gap-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-9 w-9 text-[#495057] hover:bg-[#e9ecef]"
                aria-label="Mais opções"
              >
                <MoreVertical className="h-[18px] w-[18px]" aria-hidden />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuItem onClick={() => setFiltersPopoverOpen(true)}>
                Abrir filtros avançados
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortId("priority")}>Ordenar por prioridade</DropdownMenuItem>
              <DropdownMenuItem onClick={clearAllCrmFilters}>Limpar todos os filtros</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-9 w-9 text-[#495057] hover:bg-[#e9ecef]"
            aria-label="Filtro por data"
            onClick={() => setFiltersPopoverOpen(true)}
          >
            <Calendar className="h-[18px] w-[18px]" aria-hidden />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-9 w-9 text-[#495057] hover:bg-[#e9ecef]"
            aria-label="Ordenar por maior valor"
            onClick={() => {
              setSortId("value_desc");
              toast({
                title: "Ordenação",
                description: "Maior valor total primeiro.",
              });
            }}
          >
            <TrendingUp className="h-[18px] w-[18px]" aria-hidden />
          </Button>
        </div>

        <Button
          type="button"
          className="h-9 gap-1.5 rounded-md bg-[#4E1BB1] px-4 text-sm font-semibold text-white shadow-sm hover:bg-[#3C1494]"
          disabled={!canEditCrm}
          onClick={() => {
            if (!canEditCrm) {
              toast({
                title: "Ação indisponível",
                description: "Seu papel nao tem permissao para criar negociações.",
                variant: "destructive",
              });
              return;
            }
            if (!isSupabaseConfigured) {
              toast({
                title: "Supabase necessário",
                description: "Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY para criar negociações.",
                variant: "destructive",
              });
              return;
            }
            setCreateOpen(true);
          }}
        >
          + Criar
        </Button>
      </div>

      <CrmCreateNegotiationDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        funnels={funnels}
        defaultFunnelId={funnelId}
        profileId={profileId}
        userRole={profile?.role}
        assigneeOptions={crmAttendantOptions}
        canEdit={canEditCrm}
      />

      <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-[#e9ecef] bg-[#F8F9FA] px-4 py-2.5 md:gap-3 md:px-6">
        <Popover open={funnelOpen} onOpenChange={setFunnelOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="inline-flex h-9 items-center gap-2 rounded-md border border-[#dee2e6] bg-white px-3 text-left text-sm font-medium text-[#495057] shadow-sm transition-colors hover:bg-[#f8f9fa]"
            >
              <AlignJustify className="h-4 w-4 text-[#5B2FD4]" aria-hidden />
              <span className="max-w-[200px] truncate">{funnelTriggerLabel}</span>
              <ChevronDown className="h-4 w-4 shrink-0 opacity-50" aria-hidden />
            </button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-80 border-[#dee2e6] bg-white p-0 text-[#212529] shadow-lg">
            <div className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-[#868e96]">
              Funil de vendas
            </div>
            <Separator />
            <ul className="max-h-64 overflow-y-auto py-1">
              {funnels.map((f) => (
                <li key={f.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setFunnelId(f.id);
                      setFunnelOpen(false);
                    }}
                    className={cn(
                      "flex w-full px-3 py-2 text-left text-sm font-semibold",
                      f.id === funnelId ? "bg-[#F3EBFC] text-[#4E1BB1]" : "text-[#4E1BB1] hover:bg-[#f1f3f5]",
                    )}
                  >
                    {f.listName}
                  </button>
                </li>
              ))}
            </ul>
            <Separator />
            <div className="flex flex-col py-1">
              <button
                type="button"
                onClick={() => {
                  setFunnelId(funnels[0]?.id ?? DEFAULT_CRM_FUNNELS[0].id);
                  setFunnelOpen(false);
                }}
                className="px-3 py-2 text-left text-sm font-medium text-[#5B2FD4] hover:bg-[#f8f9fa]"
              >
                Primeiro funil
              </button>
              <Link
                to="/configuracoes?aba=funis"
                className="px-3 py-2 text-sm font-medium text-[#5B2FD4] hover:bg-[#f8f9fa]"
                onClick={() => setFunnelOpen(false)}
              >
                Configurar funis
              </Link>
            </div>
          </PopoverContent>
        </Popover>

        <Popover open={ownerOpen} onOpenChange={onOwnerOpenChange}>
          <PopoverTrigger asChild>
            <button
              type="button"
              className={cn(
                "inline-flex h-9 items-center gap-2 rounded-md border bg-white px-3 text-left text-sm font-medium shadow-sm transition-colors hover:bg-[#f8f9fa]",
                appliedOwner.mode === "pool"
                  ? "border-[#c4b5fd] text-[#4E1BB1]"
                  : "border-[#dee2e6] text-[#495057]",
              )}
            >
              <Users className="h-4 w-4 text-[#5B2FD4]" aria-hidden />
              <span className="max-w-[200px] truncate">{ownerTriggerLabel}</span>
              <ChevronDown className="h-4 w-4 shrink-0 opacity-50" aria-hidden />
            </button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-80 border-[#dee2e6] bg-white p-0 text-[#212529] shadow-lg">
            <div className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-[#868e96]">
              Responsável
            </div>
            <Separator />
            <div className="p-3 pb-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#868e96]" aria-hidden />
                <Input
                  placeholder="Pesquisar"
                  value={ownerSearch}
                  onChange={(e) => setOwnerSearch(e.target.value)}
                  className="h-9 border-[#ced4da] pl-9 text-sm"
                />
              </div>
            </div>
            <div className="px-3 pb-2">
              <button
                type="button"
                onClick={() => setOwnerDraft({ mode: "all", customIds: new Set() })}
                className="text-sm font-medium text-[#4E1BB1] hover:underline"
              >
                Todas as negociações
              </button>
            </div>
            <div className="px-3 pb-2">
              <button
                type="button"
                onClick={() => setOwnerDraft({ mode: "mine", customIds: new Set() })}
                className="text-sm font-bold text-[#212529] hover:underline"
              >
                Minhas negociações
              </button>
            </div>
            <div className="px-3 pb-2">
              <button
                type="button"
                onClick={() => setOwnerDraft({ mode: "pool", customIds: new Set() })}
                className={cn(
                  "flex w-full items-center justify-between gap-2 text-left text-sm font-semibold hover:underline",
                  ownerDraft.mode === "pool" ? "text-[#4E1BB1]" : "text-[#212529]",
                )}
              >
                <span>Pool (sem responsável)</span>
                {poolCountInFunnel > 0 ? (
                  <span className="rounded-full bg-[#F3EBFC] px-2 py-0.5 text-[11px] font-bold text-[#4E1BB1]">
                    {poolCountInFunnel}
                  </span>
                ) : null}
              </button>
              <p className="mt-1 text-[11px] leading-snug text-[#868e96]">
                Fila para assumir — negócios ainda sem vendedor atribuído.
              </p>
            </div>
            <Separator />
            <ul className="max-h-48 overflow-y-auto py-2">
              {filteredAttendants.map((a) => (
                <li key={a.id}>
                  <label className="flex cursor-pointer items-center gap-2 px-3 py-2 text-sm hover:bg-[#f1f3f5]">
                    <Checkbox
                      checked={ownerDraft.customIds.has(a.id)}
                      onCheckedChange={(checked) => {
                        setOwnerDraft((d) => {
                          const next = new Set(d.customIds);
                          if (checked === true) {
                            next.add(a.id);
                            return { mode: "custom", customIds: next };
                          }
                          next.delete(a.id);
                          return { mode: "custom", customIds: next };
                        });
                      }}
                      className="border-[#adb5bd] data-[state=checked]:bg-[#4E1BB1] data-[state=checked]:border-[#4E1BB1]"
                    />
                    <span>{a.name}</span>
                  </label>
                </li>
              ))}
            </ul>
            <Separator />
            <div className="flex items-center justify-between gap-2 p-3">
              <button
                type="button"
                className="text-sm font-medium text-[#4E1BB1] hover:underline"
                onClick={() => setOwnerDraft({ mode: "all", customIds: new Set() })}
              >
                Limpar
              </button>
              <Button
                type="button"
                className="h-9 bg-[#4E1BB1] px-4 text-sm font-semibold hover:bg-[#3C1494]"
                onClick={() => {
                  setAppliedOwner(draftToApplied(ownerDraft, profileId));
                  setOwnerOpen(false);
                }}
              >
                Aplicar
              </Button>
            </div>
          </PopoverContent>
        </Popover>

        <Popover open={statusOpen} onOpenChange={setStatusOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="inline-flex h-9 items-center gap-2 rounded-md border border-[#dee2e6] bg-white px-3 text-left text-sm font-medium text-[#495057] shadow-sm transition-colors hover:bg-[#f8f9fa]"
            >
              <ClipboardList className="h-4 w-4 text-[#5B2FD4]" aria-hidden />
              <span className="max-w-[200px] truncate">{statusTriggerLabel}</span>
              <ChevronDown className="h-4 w-4 shrink-0 opacity-50" aria-hidden />
            </button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-72 border-[#dee2e6] bg-white p-0 text-[#212529] shadow-lg">
            <div className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-[#868e96]">
              Status da negociação
            </div>
            <Separator />
            <ul className="py-1">
              {STATUS_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                const selected = statusFilter === opt.id;
                return (
                  <li key={opt.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setStatusFilter(opt.id);
                        setStatusOpen(false);
                      }}
                      className={cn(
                        "flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm",
                        selected ? "bg-[#F3EBFC] font-medium text-[#4E1BB1]" : "hover:bg-[#f8f9fa]",
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0 text-[#495057]" aria-hidden />
                      {opt.label}
                    </button>
                  </li>
                );
              })}
            </ul>
          </PopoverContent>
        </Popover>

        <Popover open={alertsFilterOpen} onOpenChange={setAlertsFilterOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              className={cn(
                "inline-flex h-9 items-center gap-2 rounded-md border bg-white px-3 text-left text-sm font-medium shadow-sm transition-colors hover:bg-[#f8f9fa]",
                alertsFilter !== "off"
                  ? "border-[#ffe082] bg-[#fff8e1] text-[#e65100]"
                  : "border-[#dee2e6] text-[#495057]",
              )}
            >
              <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden />
              <span className="max-w-[200px] truncate">{alertsFilterTriggerLabel}</span>
              {alertCountsInView.any > 0 && alertsFilter === "off" ? (
                <span className="rounded-full bg-[#ffe082] px-1.5 py-0.5 text-[10px] font-bold text-[#e65100]">
                  {alertCountsInView.any}
                </span>
              ) : null}
              <ChevronDown className="h-4 w-4 shrink-0 opacity-50" aria-hidden />
            </button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-80 border-[#dee2e6] bg-white p-0 text-[#212529] shadow-lg">
            <div className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-[#868e96]">
              Alertas do negócio
            </div>
            <Separator />
            <ul className="py-1">
              <li>
                <button
                  type="button"
                  onClick={() => {
                    setAlertsFilter("off");
                    setAlertsFilterOpen(false);
                  }}
                  className={cn(
                    "flex w-full px-3 py-2.5 text-left text-sm",
                    alertsFilter === "off" ? "bg-[#F3EBFC] font-medium text-[#4E1BB1]" : "hover:bg-[#f8f9fa]",
                  )}
                >
                  Todos (sem filtro de alerta)
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => {
                    setAlertsFilter("any");
                    setAlertsFilterOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left text-sm",
                    alertsFilter === "any" ? "bg-[#F3EBFC] font-medium text-[#4E1BB1]" : "hover:bg-[#f8f9fa]",
                  )}
                >
                  <span className="inline-flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden />
                    Com alertas
                  </span>
                  {alertCountsInView.any > 0 ? (
                    <span className="rounded-full bg-[#fff8e1] px-2 py-0.5 text-[11px] font-bold text-[#e65100]">
                      {alertCountsInView.any}
                    </span>
                  ) : null}
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => {
                    setAlertsFilter("stale");
                    setAlertsFilterOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left text-sm",
                    alertsFilter === "stale" ? "bg-[#F3EBFC] font-medium text-[#4E1BB1]" : "hover:bg-[#f8f9fa]",
                  )}
                >
                  <span className="inline-flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 shrink-0 text-[#e65100]" aria-hidden />
                    Parado ({staleNegotiationDays}+ dias)
                  </span>
                  {alertCountsInView.stale > 0 ? (
                    <span className="rounded-full bg-[#fff8e1] px-2 py-0.5 text-[11px] font-bold text-[#e65100]">
                      {alertCountsInView.stale}
                    </span>
                  ) : null}
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => {
                    setAlertsFilter("no_future_task");
                    setAlertsFilterOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left text-sm",
                    alertsFilter === "no_future_task"
                      ? "bg-[#F3EBFC] font-medium text-[#4E1BB1]"
                      : "hover:bg-[#f8f9fa]",
                  )}
                >
                  <span className="inline-flex items-center gap-2">
                    <CalendarX2 className="h-4 w-4 shrink-0 text-[#c62828]" aria-hidden />
                    Sem tarefa futura
                  </span>
                  {alertCountsInView.noFutureTask > 0 ? (
                    <span className="rounded-full bg-[#fdecea] px-2 py-0.5 text-[11px] font-bold text-[#b71c1c]">
                      {alertCountsInView.noFutureTask}
                    </span>
                  ) : null}
                </button>
              </li>
            </ul>
            <p className="border-t border-[#e9ecef] px-3 py-2 text-[11px] leading-snug text-[#868e96]">
              Contadores respeitam funil, responsável e status já selecionados.
            </p>
          </PopoverContent>
        </Popover>

        <Popover open={sortOpen} onOpenChange={setSortOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="inline-flex h-9 items-center gap-2 rounded-md border border-[#dee2e6] bg-white px-3 text-left text-sm font-medium text-[#495057] shadow-sm transition-colors hover:bg-[#f8f9fa]"
            >
              <ArrowDownUp className="h-4 w-4 text-[#5B2FD4]" aria-hidden />
              <span className="max-w-[200px] truncate">{sortTriggerLabel}</span>
              <ChevronDown className="h-4 w-4 shrink-0 opacity-50" aria-hidden />
            </button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-72 border-[#dee2e6] bg-white p-0 text-[#212529] shadow-lg">
            <div className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-[#868e96]">
              Ordenação
            </div>
            <Separator />
            <ul className="max-h-72 overflow-y-auto py-1">
              {SORT_OPTIONS.map((opt) => {
                const selected = sortId === opt.id;
                return (
                  <li key={opt.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setSortId(opt.id);
                        setSortOpen(false);
                      }}
                      className={cn(
                        "flex w-full px-3 py-2 text-left text-sm",
                        selected ? "font-medium text-[#4E1BB1]" : "hover:bg-[#f8f9fa]",
                      )}
                    >
                      {opt.label}
                    </button>
                  </li>
                );
              })}
            </ul>
          </PopoverContent>
        </Popover>

        <div className="ml-auto">
          <Popover open={filtersPopoverOpen} onOpenChange={setFiltersPopoverOpen}>
            <PopoverTrigger asChild>
              <Button
                type="button"
                className="h-9 gap-2 rounded-md border-0 bg-[#EBDDFC] px-3 text-sm font-semibold text-[#4E1BB1] shadow-none hover:bg-[#E6D9F6]"
              >
                <Filter className="h-4 w-4" aria-hidden />
                Filtros ({extraFilterCount})
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-[min(100vw-2rem,22rem)] border-[#dee2e6] p-4 shadow-lg">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[#868e96]">Datas e limpeza</p>
              <div className="space-y-3">
                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Label htmlFor="crm-filter-from" className="text-xs text-[#495057]">
                      Criada a partir de
                    </Label>
                    <Input
                      id="crm-filter-from"
                      type="date"
                      className="h-9 border-[#ced4da] text-sm"
                      value={creationDateFilter?.from ?? ""}
                      onChange={(e) => {
                        const v = e.target.value;
                        if (!v) {
                          setCreationDateFilter(null);
                          return;
                        }
                        setCreationDateFilter((prev) => ({
                          from: v,
                          to: prev?.to && prev.to >= v ? prev.to : v,
                        }));
                      }}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="crm-filter-to" className="text-xs text-[#495057]">
                      Até
                    </Label>
                    <Input
                      id="crm-filter-to"
                      type="date"
                      className="h-9 border-[#ced4da] text-sm"
                      value={creationDateFilter?.to ?? ""}
                      onChange={(e) => {
                        const v = e.target.value;
                        if (!v) {
                          setCreationDateFilter(null);
                          return;
                        }
                        setCreationDateFilter((prev) => ({
                          from: prev?.from && prev.from <= v ? prev.from : v,
                          to: v,
                        }));
                      }}
                    />
                  </div>
                </div>
                <p className="text-xs text-[#868e96]">Deixe vazio para não filtrar por data de criação.</p>
                <div className="flex flex-wrap gap-2 border-t border-[#e9ecef] pt-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="border-[#ced4da]"
                    onClick={() => setCreationDateFilter(null)}
                  >
                    Limpar datas
                  </Button>
                  <Button type="button" variant="outline" size="sm" className="border-[#ced4da]" onClick={clearAllCrmFilters}>
                    Limpar todos os filtros
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-[#e9ecef] bg-[#F8F9FA] px-4 py-2 md:px-6">
        <span className="rounded bg-[#e9ecef] px-2.5 py-1 text-xs font-medium text-[#495057]">
          {totalNegotiations} Negociações
        </span>
        {negotiationsWithAlertsCount > 0 || alertsFilter !== "off" ? (
          <button
            type="button"
            onClick={() => {
              if (alertsFilter !== "off") {
                setAlertsFilter("off");
                return;
              }
              if (negotiationsWithAlertsCount > 0) {
                setAlertsFilter("any");
              }
            }}
            className={cn(
              "inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-xs font-semibold transition-colors",
              alertsFilter !== "off"
                ? "border-[#e65100] bg-[#e65100] text-white hover:bg-[#bf360c]"
                : "border-[#ffe082] bg-[#fff8e1] text-[#e65100] hover:bg-[#ffecb3]",
            )}
            title={
              alertsFilter !== "off"
                ? "Clique para remover filtro de alertas"
                : "Clique para ver só negócios com alerta"
            }
          >
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden />
            {alertsFilter !== "off"
              ? alertsFilter === "stale"
                ? "Filtro: parado"
                : alertsFilter === "no_future_task"
                  ? "Filtro: sem tarefa"
                  : `Filtro: ${totalNegotiations} com alerta${totalNegotiations === 1 ? "" : "s"}`
              : `${negotiationsWithAlertsCount} com alerta${negotiationsWithAlertsCount === 1 ? "" : "s"}`}
          </button>
        ) : null}
        {appliedOwner.mode === "pool" ? (
          <span className="inline-flex items-center gap-1.5 rounded-md border border-[#c4b5fd] bg-[#F3EBFC] px-2.5 py-1 text-xs font-medium text-[#4E1BB1]">
            Pool (sem responsável)
            <button
              type="button"
              className="rounded p-0.5 text-[#4E1BB1]/70 hover:bg-[#e9d5ff]"
              aria-label="Remover filtro de pool"
              onClick={() => setAppliedOwner({ mode: "all" })}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </span>
        ) : null}
        {creationDateFilter ? (
          <span className="inline-flex items-center gap-1.5 rounded-md border border-[#ced4da] bg-white px-2.5 py-1 text-xs text-[#495057]">
            Data de criação: {formatIsoDateToBr(creationDateFilter.from)} — {formatIsoDateToBr(creationDateFilter.to)}
            <button
              type="button"
              className="rounded p-0.5 text-[#868e96] hover:bg-[#f1f3f5]"
              aria-label="Remover filtro"
              onClick={() => setCreationDateFilter(null)}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </span>
        ) : null}
      </div>

      {isSupabaseConfigured ? (
        <div className="shrink-0 px-4 pt-3 md:px-6">
          <CrmOrphanNegotiationsBanner funnels={funnels} negotiationRefs={negotiationFunnelRefs} />
        </div>
      ) : null}

      {view === "board" ? (
        <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={(e) => void handleDragEnd(e)}>
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-4 md:p-6">
            <div className="min-h-0 flex-1 overflow-x-auto overflow-y-hidden">
              <div className="flex h-full min-h-0 min-w-max items-stretch gap-4 pb-2">
                {stagesWithCards.map((stage) => (
                  <KanbanColumn
                  key={stage.id}
                  stage={stage}
                  staleNegotiationDays={staleNegotiationDays}
                  canClaim={canClaimNegotiations}
                  isClaimPending={claimCrmNegotiation.isPending}
                  canReleaseToPool={canReleaseToPool}
                  isReleasePending={releaseCrmNegotiation.isPending}
                  onClaimNegotiation={handleClaimNegotiation}
                  onReleaseNegotiation={handleReleaseNegotiation}
                  onOpenNegotiation={openNegotiationCard}
                  onOpenCustomer={(customerId) => navigate(`/clientes/${customerId}`)}
                  onOpenChat={openChatInbox}
                  resolveAssigneeName={(assigneeId) =>
                    attendants.find((a) => a.id === assigneeId)?.name?.trim() ?? null
                  }
                  onColumnRefresh={() => {
                    void queryClient.invalidateQueries({ queryKey: ["crm-negotiations"] });
                    void queryClient.invalidateQueries({ queryKey: ["crm-negotiation-stages"] });
                    toast({
                      title: "Coluna atualizada",
                      description: "Dados do CRM recarregados.",
                    });
                  }}
                  onColumnValueSort={() => {
                    setSortId("value_desc");
                    toast({
                      title: "Ordenação",
                      description: "Maior valor primeiro (lista e colunas usam a mesma ordenação).",
                    });
                  }}
                  />
                ))}
              </div>
            </div>
          </div>
        </DndContext>
      ) : (
        <div className="min-h-0 flex-1 overflow-auto p-4 md:p-6">
          <div className="mx-auto max-w-[1400px] rounded-lg border border-[#dee2e6] bg-white shadow-sm">
            <Table>
              <TableHeader>
                <TableRow className="bg-[#f8f9fa] hover:bg-[#f8f9fa]">
                  <TableHead className="w-[28%] font-semibold text-[#495057]">
                    <button
                      type="button"
                      className={cn(
                        "text-left hover:text-[#4E1BB1]",
                        sortId === "alpha_az" || sortId === "alpha_za" ? "text-[#4E1BB1]" : "",
                      )}
                      onClick={() => setSortId((s) => (s === "alpha_az" ? "alpha_za" : "alpha_az"))}
                    >
                      Título
                    </button>
                  </TableHead>
                  <TableHead className="font-semibold text-[#495057]">Etapa</TableHead>
                  <TableHead className="font-semibold text-[#495057]">Status</TableHead>
                  <TableHead className="font-semibold text-[#495057]">
                    <button
                      type="button"
                      className={cn("hover:text-[#4E1BB1]", sortId === "value_desc" ? "text-[#4E1BB1]" : "")}
                      onClick={() => setSortId("value_desc")}
                    >
                      Valor
                    </button>
                  </TableHead>
                  <TableHead className="font-semibold text-[#495057]">
                    <button
                      type="button"
                      className={cn("hover:text-[#4E1BB1]", sortId === "next_task" ? "text-[#4E1BB1]" : "")}
                      onClick={() => setSortId("next_task")}
                    >
                      Próx. tarefa
                    </button>
                  </TableHead>
                  <TableHead className="font-semibold text-[#495057]">
                    <button
                      type="button"
                      className={cn("hover:text-[#4E1BB1]", sortId === "created_desc" ? "text-[#4E1BB1]" : "")}
                      onClick={() => setSortId("created_desc")}
                    >
                      Criada em
                    </button>
                  </TableHead>
                  <TableHead className="font-semibold text-[#495057]">
                    <button
                      type="button"
                      className={cn("hover:text-[#4E1BB1]", sortId === "qualified_desc" ? "text-[#4E1BB1]" : "")}
                      onClick={() => setSortId("qualified_desc")}
                    >
                      Qualif.
                    </button>
                  </TableHead>
                  <TableHead className="font-semibold text-[#495057]">Responsável</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredNegotiations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="py-12 text-center text-sm text-[#868e96]">
                      Nenhuma negociação neste funil com os filtros atuais.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredNegotiations.map((row) => {
                    const nextTask = negotiationNextTaskDueMeta(row.nextTaskAt);
                    const rowAlerts = getNegotiationAlerts(row, undefined, staleNegotiationDays);
                    const showClaimRow =
                      isSupabaseConfigured &&
                      Boolean(profileId) &&
                      isPersistedCrmNegotiationId(row.id) &&
                      isNegotiationUnassigned(row.assigneeId);
                    const showReleaseRow =
                      canReleaseToPool &&
                      isPersistedCrmNegotiationId(row.id) &&
                      !isNegotiationUnassigned(row.assigneeId);
                    return (
                      <TableRow
                        key={row.id}
                        className="cursor-pointer"
                        onClick={() => openNegotiationCard(row)}
                      >
                        <TableCell className="font-medium text-[#212529]">
                          <div className="flex flex-col gap-1.5">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="min-w-0">{row.title}</span>
                              {isNegotiationUnassigned(row.assigneeId) ? <CrmPoolBadge /> : null}
                              {isPersistedCrmNegotiationId(row.id) && row.customerId ? (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="h-7 shrink-0 gap-1 border-[#ced4da] px-2 text-xs font-medium text-[#4E1BB1] shadow-none hover:bg-[#F3EBFC]"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(`/clientes/${row.customerId}`);
                                  }}
                                >
                                  <User className="h-3.5 w-3.5" aria-hidden />
                                  Cliente
                                </Button>
                              ) : null}
                            </div>
                            <CrmNegotiationAlertBadges alerts={rowAlerts} compact />
                          </div>
                        </TableCell>
                        <TableCell className="text-[#495057]">{stageTitleForNegotiation(row, funnels)}</TableCell>
                        <TableCell className="text-[#495057]">{statusLabel(row.status)}</TableCell>
                        <TableCell className="text-[#495057]">
                          {row.totalValue > 0
                            ? row.totalValue.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
                            : "—"}
                        </TableCell>
                        <TableCell
                          className={cn(
                            "text-[#495057]",
                            nextTask.overdue && nextTask.label ? "font-medium text-[#c62828]" : "",
                          )}
                        >
                          {nextTask.label || "—"}
                        </TableCell>
                        <TableCell className="text-[#495057]">
                          {new Date(row.createdAt).toLocaleString("pt-BR", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </TableCell>
                        <TableCell className="text-[#495057]">{row.qualification}</TableCell>
                        <TableCell className="text-[#495057]">
                          <div className="flex flex-col items-start gap-1.5">
                            <span>
                              {attendants.find((a) => a.id === row.assigneeId)?.name?.trim() ||
                                (isNegotiationUnassigned(row.assigneeId) ? "Pool" : row.assigneeId) ||
                                "—"}
                            </span>
                            <div className="flex flex-wrap gap-1">
                              {showClaimRow ? (
                                <Button
                                  type="button"
                                  size="sm"
                                  className="h-7 gap-1 bg-primary px-2 text-xs text-primary-foreground hover:bg-primary/90"
                                  disabled={claimCrmNegotiation.isPending || releaseCrmNegotiation.isPending}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    void handleClaimNegotiation(row);
                                  }}
                                >
                                  <Hand className="h-3.5 w-3.5" aria-hidden />
                                  Assumir
                                </Button>
                              ) : null}
                              {showReleaseRow ? (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="h-7 gap-1 border-[#c4b5fd] px-2 text-xs text-[#4E1BB1] hover:bg-[#F3EBFC]"
                                  disabled={releaseCrmNegotiation.isPending || claimCrmNegotiation.isPending}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    void handleReleaseNegotiation(row);
                                  }}
                                >
                                  <Users className="h-3.5 w-3.5" aria-hidden />
                                  Pool
                                </Button>
                              ) : null}
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
          <p className="mt-3 text-center text-xs text-[#868e96]">
            Ordenação ativa: {sortTriggerLabel}. Arraste cards apenas na visualização em quadro.
          </p>
        </div>
      )}

      <MarkLostDialog
        open={lostDialogOpen}
        onOpenChange={(open) => {
          setLostDialogOpen(open);
          if (!open) setPendingLostDrag(null);
        }}
        pending={updateCrmNegotiation.isPending}
        onConfirm={completeLostDrag}
      />

      <MarkWinDialog
        open={winDialogOpen}
        onOpenChange={(open) => {
          setWinDialogOpen(open);
          if (!open) {
            setPendingWinDrag(null);
          }
        }}
        initialValue={pendingWinDrag?.card.totalValue ?? 0}
        pending={updateCrmNegotiation.isPending}
        onConfirm={completeWinDrag}
      />
    </div>
  );
}

function CrmPoolBadge({ className }: { className?: string }) {
  return (
    <span
      data-testid="crm-pool-badge"
      className={cn(
        "inline-flex items-center gap-1 rounded-md border border-[#c4b5fd] bg-[#F3EBFC] px-1.5 py-0.5 text-[10px] font-semibold leading-tight text-[#4E1BB1]",
        className,
      )}
      title="Negócio no pool — sem vendedor atribuído"
    >
      <Users className="h-3 w-3 shrink-0 opacity-90" aria-hidden />
      Sem responsável
    </span>
  );
}

function DraggableNegotiationCard({
  card,
  staleNegotiationDays,
  canClaim,
  isClaimPending,
  canReleaseToPool,
  isReleasePending,
  onClaimNegotiation,
  onReleaseNegotiation,
  onOpenNegotiation,
  onOpenCustomer,
  onOpenChat,
  resolveAssigneeName,
}: {
  card: CrmNegotiation;
  staleNegotiationDays: number;
  canClaim: boolean;
  isClaimPending: boolean;
  canReleaseToPool: boolean;
  isReleasePending: boolean;
  onClaimNegotiation: (card: CrmNegotiation) => void;
  onReleaseNegotiation: (card: CrmNegotiation) => void;
  onOpenNegotiation: (card: CrmNegotiation) => void;
  onOpenCustomer?: (customerId: string) => void;
  onOpenChat?: (chatId: string) => void;
  resolveAssigneeName?: (assigneeId: string) => string | null;
}) {
  const { profile } = useAuth();
  const profileId = profile?.id;
  const canDrag = canAtendimentoModifyNegotiation(profile?.role, card.assigneeId, profileId);

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `neg-${card.id}`,
    disabled: !canDrag,
  });
  const alerts = useMemo(
    () => getNegotiationAlerts(card, undefined, staleNegotiationDays),
    [card, staleNegotiationDays],
  );
  const isInPool = isNegotiationUnassigned(card.assigneeId);
  const showClaim =
    canClaim && isPersistedCrmNegotiationId(card.id) && isInPool;
  const showRelease =
    canReleaseToPool && isPersistedCrmNegotiationId(card.id) && !isInPool;
  const assigneeBusy = isClaimPending || isReleasePending;

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: isDragging ? 50 : undefined,
      }
    : undefined;

  return (
    <article
      ref={setNodeRef}
      data-testid={`crm-card-${card.id}`}
      style={style}
      className={cn(
        "cursor-grab rounded-lg border border-[#e9ecef] bg-white p-3 shadow-[0_1px_3px_rgba(0,0,0,0.08)] transition-shadow active:cursor-grabbing",
        isDragging ? "opacity-90 shadow-lg ring-2 ring-[#5B2FD4]/40" : "hover:shadow-[0_4px_12px_rgba(0,0,0,0.1)]",
      )}
      {...listeners}
      {...attributes}
      onClick={() => onOpenNegotiation(card)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpenNegotiation(card);
        }
      }}
    >
      <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-[#495057]">
        <span className="h-2.5 w-2.5 shrink-0 rounded-sm bg-[#5B2FD4]" aria-hidden />
        <span className="font-medium">{statusLabel(card.status)}</span>
        {isInPool ? <CrmPoolBadge /> : null}
        {!isInPool && card.assigneeId && resolveAssigneeName?.(card.assigneeId) ? (
          <span
            className="max-w-[7rem] truncate text-[10px] font-medium text-[#495057]"
            title={`Responsável: ${resolveAssigneeName(card.assigneeId)}`}
          >
            {resolveAssigneeName(card.assigneeId)}
          </span>
        ) : null}
        <Info className="ml-auto h-3.5 w-3.5 shrink-0 text-[#adb5bd]" aria-hidden />
      </div>
      <p className="mb-2 text-[15px] font-bold leading-snug text-[#212529]">{card.title}</p>
      <CrmNegotiationAlertBadges alerts={alerts} className="mb-2" />
      <div className="mb-3 flex items-center justify-between gap-2 text-[#868e96]">
        <span className="inline-flex items-center gap-2 text-xs">
          <span className="inline-flex items-center gap-1">
            <Star className="h-3.5 w-3.5 fill-[#ffc107] text-[#ffc107]" aria-hidden />
            {card.starCount}
          </span>
          <CrmKanbanCardTaskBadge card={card} />
        </span>
        <div className="flex shrink-0 items-center gap-1">
          {card.sourceChatId && onOpenChat ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 gap-1 px-2 text-xs font-medium text-[#128C7E] hover:bg-[#e8f5e9]"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                onOpenChat(card.sourceChatId!);
              }}
            >
              <MessageCircle className="h-3.5 w-3.5" aria-hidden />
              WhatsApp
              {(card.sourceChatUnread ?? 0) > 0 ? (
                <span className="rounded-full bg-[#25D366] px-1.5 text-[10px] font-bold text-white">
                  {card.sourceChatUnread}
                </span>
              ) : null}
            </Button>
          ) : null}
          {onOpenCustomer && isPersistedCrmNegotiationId(card.id) && card.customerId ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 shrink-0 gap-1 px-2 text-xs font-medium text-[#4E1BB1] hover:bg-[#F3EBFC]"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                onOpenCustomer(card.customerId!);
              }}
            >
              <User className="h-3.5 w-3.5" aria-hidden />
              Cliente
            </Button>
          ) : (
            <User className="h-3.5 w-3.5 shrink-0 opacity-40" aria-hidden />
          )}
        </div>
      </div>
      <div className="flex flex-col gap-2">
        {showClaim ? (
          <Button
            type="button"
            className="h-9 w-full gap-2 bg-primary text-sm font-medium text-primary-foreground shadow-none hover:bg-primary/90"
            disabled={assigneeBusy}
            onPointerDown={(e) => e.stopPropagation()}
            data-testid={`crm-claim-${card.id}`}
            onClick={(e) => {
              e.stopPropagation();
              onClaimNegotiation(card);
            }}
          >
            <Hand className="h-4 w-4 shrink-0" aria-hidden />
            Assumir negócio
          </Button>
        ) : null}
        {showRelease ? (
          <Button
            type="button"
            variant="outline"
            className="h-9 w-full gap-2 border-[#c4b5fd] bg-white text-sm font-medium text-[#4E1BB1] shadow-none hover:bg-[#F3EBFC]"
            disabled={assigneeBusy}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              onReleaseNegotiation(card);
            }}
          >
            <Users className="h-4 w-4 shrink-0" aria-hidden />
            Devolver ao pool
          </Button>
        ) : null}
      </div>
    </article>
  );
}

function KanbanColumn({
  stage,
  staleNegotiationDays,
  canClaim,
  isClaimPending,
  canReleaseToPool,
  isReleasePending,
  onClaimNegotiation,
  onReleaseNegotiation,
  onOpenNegotiation,
  onOpenCustomer,
  onOpenChat,
  onColumnRefresh,
  onColumnValueSort,
  resolveAssigneeName,
}: {
  stage: CrmStageDef & { cards: CrmNegotiation[] };
  staleNegotiationDays: number;
  canClaim: boolean;
  isClaimPending: boolean;
  canReleaseToPool: boolean;
  isReleasePending: boolean;
  onClaimNegotiation: (card: CrmNegotiation) => void;
  onReleaseNegotiation: (card: CrmNegotiation) => void;
  onOpenNegotiation: (card: CrmNegotiation) => void;
  onOpenCustomer?: (customerId: string) => void;
  onOpenChat?: (chatId: string) => void;
  onColumnRefresh?: () => void;
  onColumnValueSort?: () => void;
  resolveAssigneeName?: (assigneeId: string) => string | null;
}) {
  const count = stage.cards.length;
  const columnValue = stage.cards.reduce((acc, c) => acc + c.totalValue, 0);
  const displayValue =
    columnValue > 0
      ? columnValue.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
      : "R$ 0,00";

  const { setNodeRef, isOver } = useDroppable({
    id: `stage-${stage.id}`,
  });

  return (
    <div className="flex h-full min-h-0 w-[300px] shrink-0 flex-col rounded-lg bg-[#E9ECEF] p-3 shadow-sm">
      <div className="mb-3 flex shrink-0 items-start justify-between gap-2">
        <div>
          <h3 className="text-[11px] font-bold uppercase leading-tight tracking-wide text-[#495057]">
            {stage.title}{" "}
            <span className="font-semibold text-[#6c757d]">({count})</span>
          </h3>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <span className="rounded bg-[#dee2e6] px-2 py-0.5 text-[11px] font-semibold text-[#495057]">{displayValue}</span>
          <button
            type="button"
            className="rounded p-1 text-[#6c757d] transition-colors hover:bg-[#dee2e6]/80"
            aria-label="Atualizar coluna"
            onClick={() => onColumnRefresh?.()}
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            className="rounded p-1 text-[#6c757d] transition-colors hover:bg-[#dee2e6]/80"
            aria-label="Ordenar por valor"
            onClick={() => onColumnValueSort?.()}
          >
            <TrendingUp className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div
        ref={setNodeRef}
        data-testid={`crm-column-${stage.id}`}
        className={cn(
          "scrollbar-hide flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto overscroll-y-contain rounded-md transition-colors",
          isOver && "bg-[#d8ecf7]/90 ring-2 ring-[#5B2FD4] ring-inset",
        )}
      >
        {stage.cards.map((card) => (
          <DraggableNegotiationCard
            key={card.id}
            card={card}
            staleNegotiationDays={staleNegotiationDays}
            canClaim={canClaim}
            isClaimPending={isClaimPending}
            canReleaseToPool={canReleaseToPool}
            isReleasePending={isReleasePending}
            onClaimNegotiation={onClaimNegotiation}
            onReleaseNegotiation={onReleaseNegotiation}
            onOpenNegotiation={onOpenNegotiation}
            onOpenCustomer={onOpenCustomer}
            onOpenChat={onOpenChat}
            resolveAssigneeName={resolveAssigneeName}
          />
        ))}
      </div>
    </div>
  );
}
