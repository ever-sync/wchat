// Tipos compartilhados das automacoes de marketing (Fase 0 do plano completo).
// Detalhes especificos por action (config schemas) entram nas fases seguintes.

export const MARKETING_FLOW_STATUSES = [
  "rascunho",
  "ativo",
  "pausado",
  "arquivado",
] as const;
export type MarketingFlowStatus = (typeof MARKETING_FLOW_STATUSES)[number];

export function isMarketingFlowStatus(value: unknown): value is MarketingFlowStatus {
  return (
    typeof value === "string" &&
    (MARKETING_FLOW_STATUSES as readonly string[]).includes(value)
  );
}

// ---------------------------------------------------------------- Gatilhos

export const MARKETING_FLOW_TRIGGER_TYPES = [
  "form_submitted",
  "tag_added",
  "negotiation_created",
  "negotiation_stage_changed",
  "manual",
] as const;
export type MarketingFlowTriggerType = (typeof MARKETING_FLOW_TRIGGER_TYPES)[number];

export type MarketingFlowTrigger = {
  type: MarketingFlowTriggerType;
  config?: Record<string, unknown>;
};

// ---------------------------------------------------------------- Criterios

export const MARKETING_FLOW_CRITERIA_OPERATORS = [
  "equals",
  "not_equals",
  "contains",
  "not_contains",
  "exists",
  "not_exists",
  "greater_than",
  "less_than",
  "before",
  "after",
  "between",
  "in",
  "not_in",
] as const;
export type MarketingFlowCriteriaOperator =
  (typeof MARKETING_FLOW_CRITERIA_OPERATORS)[number];

export type MarketingFlowCriteriaCondition = {
  field: string;
  operator: MarketingFlowCriteriaOperator;
  value?: unknown;
};

export type MarketingFlowCriteriaGroup = {
  combinator: "and" | "or";
  conditions: (MarketingFlowCriteriaCondition | MarketingFlowCriteriaGroup)[];
};

/**
 * Formato do `criteria` jsonb. `group` e a forma estruturada nova; `conditions`
 * (string[]) e o legado simples mantido para compatibilidade com fluxos ja
 * criados antes da Fase 1.
 */
export type MarketingFlowCriteria = {
  group?: MarketingFlowCriteriaGroup;
  conditions?: string[];
};

// ---------------------------------------------------------------- Definicao

export const MARKETING_FLOW_SUBTITLE_VARIANTS = [
  "plain",
  "primary",
  "chip",
  "multiline",
] as const;
export type MarketingFlowSubtitleVariant =
  (typeof MARKETING_FLOW_SUBTITLE_VARIANTS)[number];

export type MarketingFlowStep = {
  id: string;
  actionId: string;
  label: string;
  iconKey: string;
  iconClass: string;
  subtitle?: string;
  subtitleVariant?: MarketingFlowSubtitleVariant;
  /** Configuracao estruturada da action (schema vem nas fases 2+). */
  config?: Record<string, unknown>;
};

export type MarketingFlowSettings = {
  allowReentry?: boolean;
  autoAbandonDays?: number | null;
};

export type MarketingFlowDefinition = {
  steps: MarketingFlowStep[];
  settings?: MarketingFlowSettings;
  exitConditions?: string[];
};

// ---------------------------------------------------------------- Execucao

export const MARKETING_FLOW_PARTICIPANT_STATUSES = [
  "active",
  "waiting",
  "completed",
  "exited",
  "failed",
  "paused",
] as const;
export type MarketingFlowParticipantStatus =
  (typeof MARKETING_FLOW_PARTICIPANT_STATUSES)[number];

export const MARKETING_FLOW_JOB_STATUSES = [
  "queued",
  "running",
  "done",
  "failed",
  "dead",
] as const;
export type MarketingFlowJobStatus = (typeof MARKETING_FLOW_JOB_STATUSES)[number];

export const MARKETING_FLOW_EVENT_TYPES = [
  "flow_entered",
  "step_started",
  "step_completed",
  "step_waiting",
  "step_failed",
  "retry_scheduled",
  "participant_exited",
  "participant_completed",
  "manual_pause",
  "manual_resume",
] as const;
export type MarketingFlowEventType = (typeof MARKETING_FLOW_EVENT_TYPES)[number];

export const MARKETING_FLOW_SUPPRESSION_CHANNELS = [
  "whatsapp",
  "email",
  "sms",
  "all",
] as const;
export type MarketingFlowSuppressionChannel =
  (typeof MARKETING_FLOW_SUPPRESSION_CHANNELS)[number];
