import type { Customer } from "@/types/domain";

/** Persistido em `customer.sourceColumns` — evita migração de coluna dedicada. */
export const CRM_PIPELINE_STAGE_KEY = "crm_pipeline_stage";

/**
 * Funil do quadro CRM (alinhado a `CrmFunnel.id`).
 * Fonte canônica por negociação: `public.crm_negotiations.funnel_id`; ver `resolveKanbanStageId`.
 */
export const CRM_FUNNEL_ID_KEY = "crm_funnel_id";

export const PIPELINE_STAGE_KEYS = [
  "lead",
  "contato",
  "andamento",
  "contrato",
  "venda",
  "perdido",
] as const;

export type PipelineStageKey = (typeof PIPELINE_STAGE_KEYS)[number];

export function buildPipelineLabels(daysContact: number): Array<{ key: PipelineStageKey; label: string }> {
  const days = Math.max(0, daysContact);
  return [
    { key: "lead", label: "LEAD QUALIFICADA" },
    { key: "contato", label: `CONTATO FEITO (${days} DIAS)` },
    { key: "andamento", label: "EM ANDAMENTO" },
    { key: "contrato", label: "ENVIO CONTRATO" },
    { key: "venda", label: "VENDA" },
    { key: "perdido", label: "PERDIDO" },
  ];
}

export function pipelineStageKeyFromIndex(index: number): PipelineStageKey | undefined {
  return PIPELINE_STAGE_KEYS[index];
}

export function getPipelineStateForCustomer(cliente: Customer): { activeIndex: number; daysContact: number } {
  const created = new Date(cliente.cadastradoEm || Date.now()).getTime();
  const daysContact = Math.max(0, Math.floor((Date.now() - created) / 86_400_000));
  const raw = cliente.sourceColumns?.[CRM_PIPELINE_STAGE_KEY]?.trim().toLowerCase();
  if (raw) {
    const idx = PIPELINE_STAGE_KEYS.indexOf(raw as PipelineStageKey);
    if (idx >= 0) {
      return { activeIndex: idx, daysContact };
    }
  }
  if (cliente.status === "bloqueado") {
    return { activeIndex: 5, daysContact };
  }
  if (cliente.status === "inativo") {
    return { activeIndex: 0, daysContact };
  }
  return { activeIndex: 2, daysContact };
}
