// Configuracoes estruturadas das actions (Fase 2 do plano completo).
// - Tipos por action.
// - validate(config) -> issues (para o validador de fluxo).
// - summarize(config) -> string usada como `subtitle` do card.
// - ACTION_CONFIG_REGISTRY: mapeia actionId -> kind do config (varias actions
//   compartilham o mesmo kind, ex.: 'adicionar-tags' e 'remover-tag' -> 'tag').

import type { MarketingFlowStep } from "@/lib/marketing/flow-types";
import type { ValidationIssue } from "@/lib/marketing/flow-validation";

// ---------------------------------------------------------------- Types

export type WaitConfig = { days: number; hours: number; minutes: number };

export type WhatsAppConfig = { message: string };

export type CreateTaskConfig = {
  title: string;
  description?: string;
  dueDays: number;
};

export type CreateDealConfig = {
  funnelId: string;
  stageId: string;
  title?: string;
};

export type MoveDealConfig = { funnelId: string; stageId: string };

export type TagConfig = { tag: string };

export const WEBHOOK_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"] as const;
export type WebhookMethod = (typeof WEBHOOK_METHODS)[number];
export type WebhookConfig = {
  url: string;
  method: WebhookMethod;
  headers?: string;
  body?: string;
};

export type ActionConfigByKind = {
  wait: WaitConfig;
  whatsapp: WhatsAppConfig;
  "create-task": CreateTaskConfig;
  "create-deal": CreateDealConfig;
  "move-deal": MoveDealConfig;
  tag: TagConfig;
  webhook: WebhookConfig;
};

export type ActionConfigKind = keyof ActionConfigByKind;

// ---------------------------------------------------------------- Registry

/**
 * Mapeia actionId (ids do flow-actions.ts) -> kind do config.
 * Actions ausentes daqui continuam editaveis via subtitle/variant livre.
 */
export const ACTION_CONFIG_REGISTRY: Record<string, ActionConfigKind> = {
  espera: "wait",
  whatsapp: "whatsapp",
  "criar-tarefa-negociacao": "create-task",
  "criar-negociacao": "create-deal",
  "mover-negociacao": "move-deal",
  "adicionar-tags": "tag",
  "remover-tag": "tag",
  webhook: "webhook",
};

export function getConfigKind(actionId: string): ActionConfigKind | null {
  return ACTION_CONFIG_REGISTRY[actionId] ?? null;
}

// ---------------------------------------------------------------- Parsers

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function toNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const n = Number(value);
    if (Number.isFinite(n)) return n;
  }
  return fallback;
}

function toString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function isWebhookMethod(value: unknown): value is WebhookMethod {
  return (
    typeof value === "string" &&
    (WEBHOOK_METHODS as readonly string[]).includes(value)
  );
}

export function parseConfig<K extends ActionConfigKind>(
  kind: K,
  raw: Record<string, unknown> | undefined,
): ActionConfigByKind[K] {
  const r = asRecord(raw);
  switch (kind) {
    case "wait":
      return {
        days: Math.max(0, Math.floor(toNumber(r.days, 0))),
        hours: Math.max(0, Math.floor(toNumber(r.hours, 0))),
        minutes: Math.max(0, Math.floor(toNumber(r.minutes, 0))),
      } as ActionConfigByKind[K];
    case "whatsapp":
      return { message: toString(r.message) } as ActionConfigByKind[K];
    case "create-task":
      return {
        title: toString(r.title),
        description: toString(r.description) || undefined,
        dueDays: Math.max(0, Math.floor(toNumber(r.dueDays, 1))),
      } as ActionConfigByKind[K];
    case "create-deal":
      return {
        funnelId: toString(r.funnelId),
        stageId: toString(r.stageId),
        title: toString(r.title) || undefined,
      } as ActionConfigByKind[K];
    case "move-deal":
      return {
        funnelId: toString(r.funnelId),
        stageId: toString(r.stageId),
      } as ActionConfigByKind[K];
    case "tag":
      return { tag: toString(r.tag) } as ActionConfigByKind[K];
    case "webhook":
      return {
        url: toString(r.url),
        method: isWebhookMethod(r.method) ? r.method : "POST",
        headers: toString(r.headers) || undefined,
        body: toString(r.body) || undefined,
      } as ActionConfigByKind[K];
  }
}

export function defaultConfig<K extends ActionConfigKind>(kind: K): ActionConfigByKind[K] {
  return parseConfig(kind, undefined);
}

// ---------------------------------------------------------------- Validate

type IssueWithoutStep = Omit<ValidationIssue, "stepId">;

export function validateActionConfig(
  step: MarketingFlowStep,
  kind: ActionConfigKind,
): IssueWithoutStep[] {
  const config = parseConfig(kind, step.config);
  const label = step.label;

  switch (kind) {
    case "wait": {
      const c = config as WaitConfig;
      if (c.days + c.hours + c.minutes <= 0) {
        return [
          {
            code: "WAIT_NO_DURATION",
            severity: "error",
            message: `“${label}”: defina uma duração maior que zero.`,
          },
        ];
      }
      return [];
    }
    case "whatsapp": {
      const c = config as WhatsAppConfig;
      if (!c.message.trim()) {
        return [
          {
            code: "MSG_EMPTY",
            severity: "error",
            message: `“${label}”: defina o conteúdo da mensagem.`,
          },
        ];
      }
      return [];
    }
    case "create-task": {
      const c = config as CreateTaskConfig;
      if (!c.title.trim()) {
        return [
          {
            code: "TASK_NO_TITLE",
            severity: "error",
            message: `“${label}”: defina um título para a tarefa.`,
          },
        ];
      }
      return [];
    }
    case "create-deal": {
      const c = config as CreateDealConfig;
      const issues: IssueWithoutStep[] = [];
      if (!c.funnelId) {
        issues.push({
          code: "DEAL_NO_FUNNEL",
          severity: "error",
          message: `“${label}”: selecione um funil.`,
        });
      }
      if (!c.stageId) {
        issues.push({
          code: "DEAL_NO_STAGE",
          severity: "error",
          message: `“${label}”: selecione uma etapa.`,
        });
      }
      return issues;
    }
    case "move-deal": {
      const c = config as MoveDealConfig;
      const issues: IssueWithoutStep[] = [];
      if (!c.funnelId) {
        issues.push({
          code: "DEAL_NO_FUNNEL",
          severity: "error",
          message: `“${label}”: selecione o funil de destino.`,
        });
      }
      if (!c.stageId) {
        issues.push({
          code: "DEAL_NO_STAGE",
          severity: "error",
          message: `“${label}”: selecione a etapa de destino.`,
        });
      }
      return issues;
    }
    case "tag": {
      const c = config as TagConfig;
      if (!c.tag.trim()) {
        return [
          {
            code: "TAG_EMPTY",
            severity: "error",
            message: `“${label}”: informe a etiqueta.`,
          },
        ];
      }
      return [];
    }
    case "webhook": {
      const c = config as WebhookConfig;
      if (!c.url.trim()) {
        return [
          {
            code: "WEBHOOK_NO_URL",
            severity: "error",
            message: `“${label}”: defina a URL do webhook.`,
          },
        ];
      }
      try {
        const u = new URL(c.url);
        if (u.protocol !== "http:" && u.protocol !== "https:") {
          return [
            {
              code: "WEBHOOK_INVALID_URL",
              severity: "error",
              message: `“${label}”: URL deve começar com http:// ou https://.`,
            },
          ];
        }
      } catch {
        return [
          {
            code: "WEBHOOK_INVALID_URL",
            severity: "error",
            message: `“${label}”: URL do webhook inválida.`,
          },
        ];
      }
      return [];
    }
  }
}

// ---------------------------------------------------------------- Summarize

export function summarizeConfig(
  kind: ActionConfigKind,
  raw: Record<string, unknown> | undefined,
): string {
  const config = parseConfig(kind, raw);
  switch (kind) {
    case "wait": {
      const c = config as WaitConfig;
      return `${c.days} dia(s), ${c.hours} hora(s) e ${c.minutes} minuto(s)`;
    }
    case "whatsapp": {
      const c = config as WhatsAppConfig;
      const t = c.message.trim();
      return t.length > 60 ? `${t.slice(0, 60)}…` : t;
    }
    case "create-task": {
      const c = config as CreateTaskConfig;
      const due = c.dueDays > 0 ? ` (vence em ${c.dueDays} dia${c.dueDays > 1 ? "s" : ""})` : "";
      return c.title ? `${c.title}${due}` : "Tarefa sem título";
    }
    case "create-deal": {
      const c = config as CreateDealConfig;
      const title = c.title ? `${c.title} — ` : "";
      return c.funnelId && c.stageId
        ? `${title}${c.funnelId} → ${c.stageId}`
        : title || "Configuração pendente";
    }
    case "move-deal": {
      const c = config as MoveDealConfig;
      return c.funnelId && c.stageId
        ? `→ ${c.funnelId} → ${c.stageId}`
        : "Configuração pendente";
    }
    case "tag": {
      const c = config as TagConfig;
      return c.tag || "Etiqueta pendente";
    }
    case "webhook": {
      const c = config as WebhookConfig;
      return c.url ? `${c.method} ${c.url}` : "URL pendente";
    }
  }
}
