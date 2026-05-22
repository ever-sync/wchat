import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
  type UseMutationOptions,
  type UseQueryOptions,
} from "@tanstack/react-query";
import { getCurrentTenantId } from "@/lib/api/tenant";
import { markCrmPoolNotificationSuppressed } from "@/lib/crm/crm-notification-suppress";
import { mapCrmNegotiationDbRow } from "@/lib/crm/negotiation-model";
import { isSupabaseConfigured, requireSupabase } from "@/lib/supabase";
import type { CrmNegotiationRecord, CrmNegotiationStatus } from "@/types/domain";

function asDbRow(row: unknown): Record<string, unknown> {
  return row as unknown as Record<string, unknown>;
}

const SELECT = [
  "id",
  "tenant_id",
  "title",
  "funnel_id",
  "stage_id",
  "status",
  "assignee_id",
  "customer_id",
  "star_count",
  "qualification",
  "total_value",
  "next_task_at",
  "closing_forecast",
  "last_contact_at",
  "last_interaction_at",
  "source_chat_id",
  "lost_reason",
  "other_info",
  "created_at",
  "updated_at",
  "source_chat:whatsapp_chats!source_chat_id(last_message_preview, unread_count)",
].join(", ");

export type CrmNegotiationPatch = Partial<{
  title: string;
  funnelId: string;
  stageId: string;
  status: CrmNegotiationStatus;
  assigneeId: string | null;
  customerId: string | null;
  starCount: number;
  qualification: number;
  totalValue: number;
  nextTaskAt: string | null;
  closingForecast: string | null;
  lastContactAt: string | null;
  lastInteractionAt: string | null;
  lostReason: string | null;
}>;

/** Filtros opcionais na listagem (reduz payload no servidor). */
export type ListCrmNegotiationsFilters = {
  funnelId?: string;
  status?: CrmNegotiationStatus;
  assigneeIds?: string[];
  /** Apenas negociações sem `assignee_id` (pool CRM). */
  unassignedOnly?: boolean;
  createdFromIso?: string;
  createdToIso?: string;
};

export type CrmNegotiationCreateInput = {
  title: string;
  funnelId: string;
  stageId: string;
  status?: CrmNegotiationStatus;
  assigneeId?: string | null;
  customerId?: string | null;
  starCount?: number;
  qualification?: number;
  totalValue?: number;
  nextTaskAt?: string | null;
  closingForecast?: string | null;
  lastContactAt?: string | null;
  lastInteractionAt?: string | null;
};

/**
 * `customerId` já conhecido no cache (detalhe ou listagens do quadro), antes de invalidar após update.
 */
export function previousNegotiationCustomerIdFromQueryCache(
  queryClient: QueryClient,
  negotiationId: string,
): string | null {
  const detail = queryClient.getQueryData<CrmNegotiationRecord>(["crm-negotiations", negotiationId]);
  if (detail?.customerId != null && String(detail.customerId).trim() !== "") {
    return String(detail.customerId).trim();
  }

  const listEntries = queryClient.getQueriesData<CrmNegotiationRecord[]>({
    predicate: (query) => {
      const key = query.queryKey;
      if (key[0] !== "crm-negotiations") {
        return false;
      }
      if (key[1] === "customer" || key[1] === "counts-by-customer") {
        return false;
      }
      return key.length >= 2;
    },
  });

  for (const [, rows] of listEntries) {
    if (!Array.isArray(rows)) {
      continue;
    }
    const hit = rows.find((r) => r.id === negotiationId);
    if (hit?.customerId != null && String(hit.customerId).trim() !== "") {
      return String(hit.customerId).trim();
    }
  }

  return null;
}

function patchToRow(p: CrmNegotiationPatch): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  if (p.title !== undefined) row.title = p.title;
  if (p.funnelId !== undefined) row.funnel_id = p.funnelId;
  if (p.stageId !== undefined) row.stage_id = p.stageId;
  if (p.status !== undefined) row.status = p.status;
  if (p.assigneeId !== undefined) row.assignee_id = p.assigneeId;
  if (p.customerId !== undefined) row.customer_id = p.customerId;
  if (p.starCount !== undefined) row.star_count = p.starCount;
  if (p.qualification !== undefined) row.qualification = p.qualification;
  if (p.totalValue !== undefined) row.total_value = p.totalValue;
  if (p.nextTaskAt !== undefined) row.next_task_at = p.nextTaskAt;
  if (p.closingForecast !== undefined) row.closing_forecast = p.closingForecast;
  if (p.lastContactAt !== undefined) row.last_contact_at = p.lastContactAt;
  if (p.lastInteractionAt !== undefined) row.last_interaction_at = p.lastInteractionAt;
  if (p.lostReason !== undefined) row.lost_reason = p.lostReason;
  return row;
}

export async function listCrmNegotiationsByCustomerId(customerId: string): Promise<CrmNegotiationRecord[]> {
  if (!isSupabaseConfigured || !customerId) {
    return [];
  }
  const supabase = requireSupabase();
  const tenantId = await getCurrentTenantId();
  const { data, error } = await supabase
    .from("crm_negotiations")
    .select(SELECT)
    .eq("tenant_id", tenantId)
    .eq("customer_id", customerId)
    .order("updated_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => mapCrmNegotiationDbRow(asDbRow(row)));
}

/** Referências leves para detectar negociações órfãs em relação à config de funis. */
export async function listCrmNegotiationFunnelRefs(): Promise<
  Array<Pick<CrmNegotiationRecord, "id" | "funnelId" | "stageId">>
> {
  if (!isSupabaseConfigured) {
    return [];
  }
  const supabase = requireSupabase();
  const tenantId = await getCurrentTenantId();
  const { data, error } = await supabase
    .from("crm_negotiations")
    .select("id, funnel_id, stage_id")
    .eq("tenant_id", tenantId);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => {
    const r = row as { id: string; funnel_id: string; stage_id: string };
    return {
      id: String(r.id),
      funnelId: String(r.funnel_id),
      stageId: String(r.stage_id),
    };
  });
}

export function useCrmNegotiationFunnelRefs(
  options?: Omit<
    UseQueryOptions<Array<Pick<CrmNegotiationRecord, "id" | "funnelId" | "stageId">>>,
    "queryKey" | "queryFn"
  >,
) {
  const { enabled: enabledOption, ...rest } = options ?? {};
  return useQuery({
    ...rest,
    queryKey: ["crm-negotiations", "funnel-refs"],
    queryFn: listCrmNegotiationFunnelRefs,
    enabled: (enabledOption ?? true) && isSupabaseConfigured,
    staleTime: 30_000,
  });
}

export async function listCrmNegotiations(
  filters: ListCrmNegotiationsFilters = {},
): Promise<CrmNegotiationRecord[]> {
  if (!isSupabaseConfigured) {
    return [];
  }
  const supabase = requireSupabase();
  const tenantId = await getCurrentTenantId();
  let q = supabase.from("crm_negotiations").select(SELECT).eq("tenant_id", tenantId);
  if (filters.funnelId) {
    q = q.eq("funnel_id", filters.funnelId);
  }
  if (filters.status) {
    q = q.eq("status", filters.status);
  }
  if (filters.unassignedOnly) {
    q = q.is("assignee_id", null);
  } else if (filters.assigneeIds && filters.assigneeIds.length > 0) {
    q = q.in("assignee_id", filters.assigneeIds);
  }
  if (filters.createdFromIso) {
    q = q.gte("created_at", filters.createdFromIso);
  }
  if (filters.createdToIso) {
    q = q.lte("created_at", filters.createdToIso);
  }
  const { data, error } = await q.order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => mapCrmNegotiationDbRow(asDbRow(row)));
}

/** Uma query por `customer_id` para a lista de clientes (apenas coluna `customer_id`). */
export async function fetchCrmNegotiationCountsByCustomerId(): Promise<Map<string, number>> {
  if (!isSupabaseConfigured) {
    return new Map();
  }
  const supabase = requireSupabase();
  const tenantId = await getCurrentTenantId();
  const { data, error } = await supabase
    .from("crm_negotiations")
    .select("customer_id")
    .eq("tenant_id", tenantId)
    .not("customer_id", "is", null);

  if (error) {
    throw new Error(error.message);
  }

  const counts = new Map<string, number>();
  for (const row of data ?? []) {
    const raw = (row as { customer_id?: unknown }).customer_id;
    if (raw == null) {
      continue;
    }
    const cid = String(raw);
    counts.set(cid, (counts.get(cid) ?? 0) + 1);
  }
  return counts;
}

export function useCrmNegotiationCountsByCustomer(
  options?: Omit<UseQueryOptions<Map<string, number>>, "queryKey" | "queryFn">,
) {
  const { enabled: enabledOption, ...rest } = options ?? {};
  return useQuery({
    ...rest,
    queryKey: ["crm-negotiations", "counts-by-customer"],
    queryFn: fetchCrmNegotiationCountsByCustomerId,
    enabled: (enabledOption ?? true) && isSupabaseConfigured,
    staleTime: 30_000,
  });
}

export async function getCrmNegotiationById(id: string): Promise<CrmNegotiationRecord | null> {
  if (!isSupabaseConfigured || !id) {
    return null;
  }
  const supabase = requireSupabase();
  const tenantId = await getCurrentTenantId();
  const { data, error } = await supabase
    .from("crm_negotiations")
    .select(SELECT)
    .eq("tenant_id", tenantId)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }
  if (!data) {
    return null;
  }
  return mapCrmNegotiationDbRow(asDbRow(data));
}

export async function createCrmNegotiation(input: CrmNegotiationCreateInput): Promise<CrmNegotiationRecord> {
  if (!isSupabaseConfigured) {
    throw new Error("Supabase não configurado.");
  }
  const supabase = requireSupabase();
  const tenantId = await getCurrentTenantId();
  const { data, error } = await supabase
    .from("crm_negotiations")
    .insert({
      tenant_id: tenantId,
      title: input.title.trim(),
      funnel_id: input.funnelId,
      stage_id: input.stageId,
      status: input.status ?? "em_andamento",
      assignee_id: input.assigneeId ?? null,
      customer_id: input.customerId ?? null,
      star_count: input.starCount ?? 0,
      qualification: input.qualification ?? 0,
      total_value: input.totalValue ?? 0,
      next_task_at: input.nextTaskAt ?? null,
      closing_forecast: input.closingForecast ?? null,
      last_contact_at: input.lastContactAt ?? null,
      last_interaction_at: input.lastInteractionAt ?? null,
    })
    .select(SELECT)
    .single();

  if (error) {
    throw new Error(error.message);
  }
  return mapCrmNegotiationDbRow(asDbRow(data));
}

export async function updateCrmNegotiation(
  id: string,
  patch: CrmNegotiationPatch,
): Promise<CrmNegotiationRecord> {
  if (!isSupabaseConfigured) {
    throw new Error("Supabase não configurado.");
  }
  const supabase = requireSupabase();
  const tenantId = await getCurrentTenantId();
  const row = patchToRow(patch);
  if (Object.keys(row).length === 0) {
    const current = await getCrmNegotiationById(id);
    if (!current) {
      throw new Error("Negociação não encontrada.");
    }
    return current;
  }

  const { data, error } = await supabase
    .from("crm_negotiations")
    .update(row)
    .eq("tenant_id", tenantId)
    .eq("id", id)
    .select(SELECT)
    .single();

  if (error) {
    throw new Error(error.message);
  }
  return mapCrmNegotiationDbRow(asDbRow(data));
}

export function useCrmNegotiationsForCustomer(
  customerId: string | undefined,
  options?: Omit<UseQueryOptions<CrmNegotiationRecord[]>, "queryKey" | "queryFn">,
) {
  const { enabled: enabledOption, ...rest } = options ?? {};
  return useQuery({
    ...rest,
    queryKey: ["crm-negotiations", "customer", customerId],
    queryFn: () => listCrmNegotiationsByCustomerId(customerId!),
    enabled: Boolean(customerId) && isSupabaseConfigured && (enabledOption ?? true),
    staleTime: 30_000,
  });
}

export function useCrmNegotiations(
  filters: ListCrmNegotiationsFilters = {},
  options?: Omit<UseQueryOptions<CrmNegotiationRecord[]>, "queryKey" | "queryFn">,
) {
  const { enabled: enabledOption, ...rest } = options ?? {};
  return useQuery({
    ...rest,
    queryKey: [
      "crm-negotiations",
      filters.funnelId ?? null,
      filters.status ?? null,
      filters.assigneeIds?.length ? [...filters.assigneeIds].sort().join(",") : null,
      filters.unassignedOnly ?? null,
      filters.createdFromIso ?? null,
      filters.createdToIso ?? null,
    ],
    queryFn: () => listCrmNegotiations(filters),
    enabled: (enabledOption ?? true) && isSupabaseConfigured,
    staleTime: 30_000,
  });
}

export function useCrmNegotiation(
  id: string | undefined,
  options?: Omit<UseQueryOptions<CrmNegotiationRecord | null>, "queryKey" | "queryFn">,
) {
  const { enabled: enabledOption, ...rest } = options ?? {};
  return useQuery({
    ...rest,
    queryKey: ["crm-negotiations", id],
    queryFn: () => getCrmNegotiationById(id!),
    enabled: Boolean(id) && isSupabaseConfigured && (enabledOption ?? true),
    staleTime: 30_000,
  });
}

export function useCreateCrmNegotiation(
  options?: UseMutationOptions<CrmNegotiationRecord, Error, CrmNegotiationCreateInput>,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createCrmNegotiation,
    ...options,
    onSuccess: async (data, vars, ctx) => {
      await queryClient.invalidateQueries({ queryKey: ["crm-negotiations"] });
      if (data.customerId != null && String(data.customerId).trim() !== "") {
        const cid = String(data.customerId).trim();
        await queryClient.invalidateQueries({ queryKey: ["customers", cid] });
        await queryClient.invalidateQueries({ queryKey: ["crm-negotiations", "customer", cid] });
      }
      await options?.onSuccess?.(data, vars, ctx);
    },
  });
}

export async function claimCrmNegotiation(negotiationId: string): Promise<void> {
  if (!isSupabaseConfigured) {
    throw new Error("Supabase não configurado.");
  }
  const supabase = requireSupabase();
  const { error } = await supabase.rpc("claim_crm_negotiation", {
    p_negotiation_id: negotiationId,
  });
  if (error) {
    throw new Error(error.message);
  }
}

export function useClaimCrmNegotiation(
  options?: UseMutationOptions<void, Error, string>,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: claimCrmNegotiation,
    ...options,
    onSuccess: async (data, negotiationId, ctx) => {
      await invalidateCrmNegotiationAssigneeQueries(queryClient, negotiationId);
      await options?.onSuccess?.(data, negotiationId, ctx);
    },
  });
}

export async function releaseCrmNegotiationToPool(negotiationId: string): Promise<void> {
  if (!isSupabaseConfigured) {
    throw new Error("Supabase não configurado.");
  }
  const supabase = requireSupabase();
  const { error } = await supabase.rpc("release_crm_negotiation_to_pool", {
    p_negotiation_id: negotiationId,
  });
  if (error) {
    throw new Error(error.message);
  }
}

async function invalidateCrmNegotiationAssigneeQueries(
  queryClient: ReturnType<typeof useQueryClient>,
  negotiationId: string,
) {
  await queryClient.invalidateQueries({ queryKey: ["crm-negotiations"] });
  await queryClient.invalidateQueries({ queryKey: ["crm-negotiations", negotiationId] });
  await queryClient.invalidateQueries({ queryKey: ["inbox-chats"] });
  await queryClient.invalidateQueries({ queryKey: ["chat-negotiation"] });
}

export function useReleaseCrmNegotiationToPool(
  options?: UseMutationOptions<void, Error, string>,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: releaseCrmNegotiationToPool,
    ...options,
    onSuccess: async (data, negotiationId, ctx) => {
      markCrmPoolNotificationSuppressed(negotiationId);
      await invalidateCrmNegotiationAssigneeQueries(queryClient, negotiationId);
      await options?.onSuccess?.(data, negotiationId, ctx);
    },
  });
}

export function useUpdateCrmNegotiation(
  options?: UseMutationOptions<CrmNegotiationRecord, Error, { id: string; patch: CrmNegotiationPatch }>,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }) => updateCrmNegotiation(id, patch),
    ...options,
    onSuccess: async (data, vars, ctx) => {
      const prevCustomerId =
        vars.patch.customerId !== undefined
          ? previousNegotiationCustomerIdFromQueryCache(queryClient, vars.id)
          : null;

      await queryClient.invalidateQueries({ queryKey: ["crm-negotiations"] });
      await queryClient.invalidateQueries({ queryKey: ["crm-negotiations", vars.id] });

      if (vars.patch.customerId !== undefined) {
        const next =
          data.customerId != null && String(data.customerId).trim() !== ""
            ? String(data.customerId).trim()
            : null;

        if (prevCustomerId && prevCustomerId !== next) {
          await queryClient.invalidateQueries({ queryKey: ["customers", prevCustomerId] });
          await queryClient.invalidateQueries({
            queryKey: ["crm-negotiations", "customer", prevCustomerId],
          });
        }
        if (next) {
          await queryClient.invalidateQueries({ queryKey: ["customers", next] });
          await queryClient.invalidateQueries({ queryKey: ["crm-negotiations", "customer", next] });
        }
      }

      await options?.onSuccess?.(data, vars, ctx);
    },
  });
}

