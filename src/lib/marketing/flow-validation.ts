// Validador de fluxos de automacao (Fase 1 do plano completo).
// - ACTION_SCHEMAS: regras por actionId. Hoje validam o `subtitle` (unico
//   slot configuravel do step); na Fase 2 os configuradores cheios usarao
//   `step.config` e os schemas serao expandidos.
// - validateFlow(snapshot): roda as regras + as do fluxo (steps, trigger,
//   criteria, exit conditions) e retorna issues separadas por severidade.
// - Trigger/criteria sao WARNING nesta fase porque ainda nao existe UI
//   dedicada (vem nas fases 3+). Quando essa UI chegar, as regras viram error.

import type { MarketingFlowStep } from "@/lib/marketing/flow-types";
import {
  getConfigKind,
  validateActionConfig,
} from "@/lib/marketing/flow-action-configs";

export type ValidationSeverity = "error" | "warning";

export type ValidationIssue = {
  code: string;
  severity: ValidationSeverity;
  message: string;
  stepId?: string;
};

export type ValidationResult = {
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
  ok: boolean;
};

export type FlowSnapshotForValidation = {
  name: string;
  trigger: Record<string, unknown>;
  criteria: Record<string, unknown>;
  definition: Record<string, unknown>;
};

// ---------------------------------------------------------------- Helpers

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function parseStepsForValidation(definition: Record<string, unknown>): MarketingFlowStep[] {
  const raw = definition.steps;
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item): MarketingFlowStep | null => {
      if (!item || typeof item !== "object") return null;
      const rec = item as Record<string, unknown>;
      const actionId = typeof rec.actionId === "string" ? rec.actionId : null;
      const label = typeof rec.label === "string" ? rec.label : null;
      const iconKey = typeof rec.iconKey === "string" ? rec.iconKey : null;
      const iconClass = typeof rec.iconClass === "string" ? rec.iconClass : null;
      if (!actionId || !label || !iconKey || !iconClass) return null;
      const subtitle = typeof rec.subtitle === "string" ? rec.subtitle : undefined;
      const config =
        rec.config && typeof rec.config === "object"
          ? (rec.config as Record<string, unknown>)
          : undefined;
      const id = typeof rec.id === "string" ? rec.id : `step-${actionId}`;
      return { id, actionId, label, iconKey, iconClass, subtitle, config };
    })
    .filter((s): s is MarketingFlowStep => s !== null);
}

function parseExitConditionsForValidation(definition: Record<string, unknown>): string[] {
  const raw = definition.exitConditions;
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter((s) => s.length > 0);
}

// ---------------------------------------------------------------- Schemas

type StepValidator = (step: MarketingFlowStep) => Omit<ValidationIssue, "stepId">[];

function requireSubtitle(
  step: MarketingFlowStep,
  code: string,
  message: string,
): Omit<ValidationIssue, "stepId">[] {
  if (!step.subtitle || step.subtitle.trim().length === 0) {
    return [{ code, severity: "error", message }];
  }
  return [];
}

/**
 * Schemas baseados em subtitle livre — fallback usado apenas quando a action
 * ainda nao tem config estruturada (sem entry em ACTION_CONFIG_REGISTRY).
 * As actions cobertas pela Fase 2 (espera/whatsapp/tag/webhook/criar-tarefa/
 * criar-negociacao/mover-negociacao) usam validateActionConfig direto.
 */
const ACTION_SCHEMAS: Record<string, StepValidator> = {
  "esperar-agendar-hora": (step) =>
    requireSubtitle(
      step,
      "WAIT_NO_TIME",
      `“${step.label}”: defina o horário de agendamento.`,
    ),
  "esperar-agendar-data-hora": (step) =>
    requireSubtitle(
      step,
      "WAIT_NO_DATETIME",
      `“${step.label}”: defina a data e hora de agendamento.`,
    ),
  sms: (step) =>
    requireSubtitle(
      step,
      "MSG_EMPTY",
      `“${step.label}”: defina o conteúdo do SMS.`,
    ),
};

// ---------------------------------------------------------------- Validador

export function validateFlow(snapshot: FlowSnapshotForValidation): ValidationResult {
  const errors: ValidationIssue[] = [];
  const warnings: ValidationIssue[] = [];

  const definition = asRecord(snapshot.definition);
  const steps = parseStepsForValidation(definition);

  if (steps.length === 0) {
    errors.push({
      code: "FLOW_NO_STEPS",
      severity: "error",
      message: "O fluxo precisa de pelo menos um passo.",
    });
  }

  for (const step of steps) {
    // Actions com config estruturado (Fase 2+) validam via schema do config;
    // demais (mensagem-inteligente, esperar-agendar-hora etc.) caem no
    // subtitle-based ACTION_SCHEMAS ate ganharem config proprio.
    const configKind = getConfigKind(step.actionId);
    const issues = configKind
      ? validateActionConfig(step, configKind)
      : (ACTION_SCHEMAS[step.actionId]?.(step) ?? []);
    for (const issue of issues) {
      const target = issue.severity === "error" ? errors : warnings;
      target.push({ ...issue, stepId: step.id });
    }
  }

  const trigger = asRecord(snapshot.trigger);
  if (!trigger.type || typeof trigger.type !== "string") {
    // Phase 1: warning (sem UI de gatilho ainda); vira error quando a UI vier.
    warnings.push({
      code: "FLOW_NO_TRIGGER",
      severity: "warning",
      message:
        "Sem gatilho de entrada definido. O fluxo só poderá ser disparado manualmente até configurar um gatilho.",
    });
  }

  const criteria = asRecord(snapshot.criteria);
  const hasGroup = criteria.group && typeof criteria.group === "object";
  const hasLegacyConditions =
    Array.isArray(criteria.conditions) && criteria.conditions.length > 0;
  if (!hasGroup && !hasLegacyConditions) {
    warnings.push({
      code: "FLOW_NO_CRITERIA",
      severity: "warning",
      message:
        "Sem critérios de entrada. Todos os leads que dispararem o gatilho entrarão no fluxo.",
    });
  }

  const exitConditions = parseExitConditionsForValidation(definition);
  if (exitConditions.length === 0) {
    warnings.push({
      code: "FLOW_NO_EXIT",
      severity: "warning",
      message:
        "Sem condições de saída. Leads só sairão ao concluir o fluxo ou serem removidos manualmente.",
    });
  }

  return { errors, warnings, ok: errors.length === 0 };
}
