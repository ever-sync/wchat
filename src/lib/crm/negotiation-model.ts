import { CRM_FUNNEL_ID_KEY, CRM_PIPELINE_STAGE_KEY } from "@/lib/crm-pipeline";
import type { CrmNegotiation, CrmNegotiationRecord, CrmNegotiationStatus, Customer } from "@/types/domain";

const CRM_NEGOTIATION_STATUSES = [
  "em_andamento",
  "vendido",
  "perdido",
  "pausado",
  "nao_pausado",
] as const satisfies readonly CrmNegotiationStatus[];

export function parseCrmNegotiationStatus(raw: unknown): CrmNegotiationStatus {
  if (typeof raw === "string" && (CRM_NEGOTIATION_STATUSES as readonly string[]).includes(raw)) {
    return raw as CrmNegotiationStatus;
  }
  return "em_andamento";
}

/** Identificadores persistidos em `crm_negotiations` são UUIDs. */
export function isPersistedCrmNegotiationId(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
}

/**
 * Ordem de precedência para `stageId` exibido no Kanban (Fase 1 — fonte única documentada):
 *
 * 1. **crm_negotiations** — se `persisted` for passado, `persisted.stageId` é canônico (API nas fases seguintes).
 * 2. **Cliente vinculado** — `customers.source_columns`: `crm_pipeline_stage` + `crm_funnel_id`
 *    quando o estágio é válido no funil atual (`customerStageForFunnel`).
 * 3. **crm_negotiation_stages** / localStorage — override por `negotiation_id` (leads sem cliente, mocks).
 * 4. **Fallback** — `base.stageId` do card (mock ou valor inicial).
 */

export type CrmStageOverride = { funnel_id: string; stage_id: string };

export function customerStageForFunnel(
  customer: Customer | undefined,
  funnelId: string,
  validStageIds: Set<string>,
): string | null {
  if (!customer?.sourceColumns) {
    return null;
  }
  const stage = customer.sourceColumns[CRM_PIPELINE_STAGE_KEY]?.trim();
  if (!stage || !validStageIds.has(stage)) {
    return null;
  }
  const f = customer.sourceColumns[CRM_FUNNEL_ID_KEY]?.trim();
  if (f && f !== funnelId) {
    return null;
  }
  return stage;
}

/** Cliente aparece no funil se não tem `crm_funnel_id` (herda ex.: funil padrão na UI) ou se bate com `funnelId`. */
export function customerMatchesCrmFunnel(customer: Customer, funnelId: string): boolean {
  const f = customer.sourceColumns?.[CRM_FUNNEL_ID_KEY]?.trim();
  if (!f) {
    return true;
  }
  return f === funnelId;
}

export function syntheticCustomerCardId(customerId: string): string {
  return `customer:${customerId}`;
}

export function parseSyntheticCustomerCardId(cardId: string): string | null {
  if (!cardId.startsWith("customer:")) {
    return null;
  }
  const rest = cardId.slice("customer:".length);
  return rest || null;
}

export function resolveKanbanStageId(params: {
  base: CrmNegotiation;
  funnelId: string;
  validStageIds: Set<string>;
  customer: Customer | undefined;
  stageOverride: CrmStageOverride | undefined;
  /** Linha `crm_negotiations` quando a listagem vier do banco (fases 2+). */
  persisted?: Pick<CrmNegotiationRecord, "stageId" | "funnelId"> | null;
}): string {
  const { base, funnelId, validStageIds, customer, stageOverride, persisted } = params;

  if (persisted && persisted.funnelId === funnelId && validStageIds.has(persisted.stageId)) {
    return persisted.stageId;
  }

  const fromCustomer = customerStageForFunnel(customer, funnelId, validStageIds);
  if (fromCustomer) {
    return fromCustomer;
  }

  if (
    stageOverride &&
    stageOverride.funnel_id === funnelId &&
    validStageIds.has(stageOverride.stage_id)
  ) {
    return stageOverride.stage_id;
  }

  if (validStageIds.has(base.stageId)) {
    return base.stageId;
  }
  const first = [...validStageIds][0];
  return first ?? base.stageId;
}

/** Mapeia resposta Supabase (snake_case) para `CrmNegotiationRecord`. */
export function mapCrmNegotiationDbRow(row: Record<string, unknown>): CrmNegotiationRecord {
  return {
    id: String(row.id),
    tenantId: String(row.tenant_id),
    title: String(row.title),
    funnelId: String(row.funnel_id),
    stageId: String(row.stage_id),
    status: parseCrmNegotiationStatus(row.status),
    assigneeId: row.assignee_id != null ? String(row.assignee_id) : null,
    customerId: row.customer_id != null ? String(row.customer_id) : null,
    starCount: Number(row.star_count ?? 0),
    qualification: Number(row.qualification ?? 0),
    totalValue: Number(row.total_value ?? 0),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
    nextTaskAt: row.next_task_at != null ? String(row.next_task_at) : null,
    closingForecast: row.closing_forecast != null ? String(row.closing_forecast) : null,
    lastContactAt: row.last_contact_at != null ? String(row.last_contact_at) : null,
    lastInteractionAt: row.last_interaction_at != null ? String(row.last_interaction_at) : null,
    sourceChatId: row.source_chat_id != null ? String(row.source_chat_id) : null,
    lostReason: row.lost_reason != null ? String(row.lost_reason) : null,
    sourceChatPreview: parseSourceChatEmbed(row.source_chat)?.lastMessagePreview ?? null,
    sourceChatUnread: parseSourceChatEmbed(row.source_chat)?.unreadCount ?? 0,
  };
}

function parseSourceChatEmbed(raw: unknown): { lastMessagePreview: string | null; unreadCount: number } | null {
  if (!raw || typeof raw !== "object") return null;
  const rec = raw as Record<string, unknown>;
  return {
    lastMessagePreview: rec.last_message_preview != null ? String(rec.last_message_preview) : null,
    unreadCount: Number(rec.unread_count ?? 0),
  };
}

/** Converte registro persistido em card de Kanban (`assigneeId` exige string para filtros da UI). */
export function crmNegotiationRecordToCard(row: CrmNegotiationRecord): CrmNegotiation {
  return {
    id: row.id,
    funnelId: row.funnelId,
    stageId: row.stageId,
    status: row.status,
    assigneeId: row.assigneeId ?? "",
    title: row.title,
    starCount: row.starCount,
    createdAt: row.createdAt,
    nextTaskAt: row.nextTaskAt ?? undefined,
    closingForecast: row.closingForecast ?? undefined,
    lastContactAt: row.lastContactAt ?? undefined,
    lastInteractionAt: row.lastInteractionAt ?? undefined,
    qualification: row.qualification,
    totalValue: row.totalValue,
    customerId: row.customerId ?? undefined,
    sourceChatId: row.sourceChatId ?? undefined,
    sourceChatPreview: row.sourceChatPreview ?? undefined,
    sourceChatUnread: row.sourceChatUnread,
  };
}
