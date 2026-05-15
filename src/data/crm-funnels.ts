export type CrmStageRequiredField =
  | "total_value"
  | "qualification"
  | "closing_forecast"
  | "next_task_at";

export type CrmStageDef = {
  id: string;
  title: string;
  /** Campos obrigatórios ao mover o card para esta etapa. */
  requiredFields?: CrmStageRequiredField[];
};

export type CrmFunnel = {
  id: string;
  listName: string;
  stages: CrmStageDef[];
};

/** Funis padrão do sistema (usados quando o tenant não tem configuração salva). */
export const DEFAULT_CRM_FUNNELS: CrmFunnel[] = [
  {
    id: "comercial",
    listName: "COMERCIAL",
    stages: [
      { id: "lead", title: "LEAD QUALIFICADA" },
      { id: "contato", title: "CONTATO FEITO" },
      { id: "andamento", title: "EM ANDAMENTO" },
      { id: "contrato", title: "ENVIO CONTRATO", requiredFields: ["total_value"] },
      { id: "venda", title: "VENDA", requiredFields: ["total_value"] },
    ],
  },
  {
    id: "auxilio",
    listName: "AUXÍLIO ACIDENTE",
    stages: [
      { id: "lead", title: "LEAD QUALIFICADA" },
      { id: "contato", title: "CONTATO FEITO" },
      { id: "andamento", title: "EM ANDAMENTO" },
      { id: "contrato", title: "ENVIO CONTRATO", requiredFields: ["total_value"] },
      { id: "venda", title: "VENDA", requiredFields: ["total_value"] },
    ],
  },
  {
    id: "isencao-google",
    listName: "ISENÇÃO DE IR – GOOGLE",
    stages: [
      { id: "lead", title: "LEAD QUALIFICADA" },
      { id: "contato", title: "CONTATO FEITO" },
      { id: "andamento", title: "EM ANDAMENTO" },
      { id: "venda", title: "VENDA", requiredFields: ["total_value"] },
    ],
  },
  {
    id: "servicos-site",
    listName: "SERVIÇOS – SITE",
    stages: [
      { id: "lead", title: "LEAD QUALIFICADA" },
      { id: "contato", title: "CONTATO FEITO" },
      { id: "andamento", title: "EM ANDAMENTO" },
      { id: "contrato", title: "ENVIO CONTRATO", requiredFields: ["total_value"] },
      { id: "venda", title: "VENDA", requiredFields: ["total_value"] },
    ],
  },
];

/** Alias histórico — igual a `DEFAULT_CRM_FUNNELS`. */
export const FUNNELS = DEFAULT_CRM_FUNNELS;

export function parseTenantCrmFunnelsJson(raw: unknown): CrmFunnel[] | null {
  if (!Array.isArray(raw)) {
    return null;
  }
  const out: CrmFunnel[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") {
      return null;
    }
    const rec = item as Record<string, unknown>;
    const id = String(rec.id ?? "").trim();
    const listName = String(rec.listName ?? "").trim();
    const stagesRaw = rec.stages;
    if (!id || !listName || !Array.isArray(stagesRaw)) {
      return null;
    }
    const stages: CrmStageDef[] = [];
    for (const st of stagesRaw) {
      if (!st || typeof st !== "object") {
        return null;
      }
      const sr = st as Record<string, unknown>;
      const sid = String(sr.id ?? "").trim();
      const title = String(sr.title ?? "").trim();
      if (!sid || !title) {
        return null;
      }
      const requiredRaw = sr.requiredFields;
      let requiredFields: CrmStageRequiredField[] | undefined;
      if (Array.isArray(requiredRaw)) {
        const allowed = new Set<CrmStageRequiredField>([
          "total_value",
          "qualification",
          "closing_forecast",
          "next_task_at",
        ]);
        requiredFields = requiredRaw
          .map((v) => String(v).trim() as CrmStageRequiredField)
          .filter((v) => allowed.has(v));
        if (requiredFields.length === 0) requiredFields = undefined;
      }
      stages.push({ id: sid, title, ...(requiredFields ? { requiredFields } : {}) });
    }
    if (stages.length === 0) {
      return null;
    }
    out.push({ id, listName, stages });
  }
  if (out.length === 0) {
    return null;
  }
  const ids = new Set(out.map((f) => f.id));
  if (ids.size !== out.length) {
    return null;
  }
  return out;
}

export function funnelListName(funnelId: string): string {
  return DEFAULT_CRM_FUNNELS.find((f) => f.id === funnelId)?.listName ?? funnelId;
}

export function funnelListNameIn(funnels: CrmFunnel[], funnelId: string): string {
  const list = Array.isArray(funnels) ? funnels : DEFAULT_CRM_FUNNELS;
  return list.find((f) => f.id === funnelId)?.listName ?? funnelId;
}

export function funnelStageTitle(funnelId: string, stageId: string): string {
  const funnel = DEFAULT_CRM_FUNNELS.find((f) => f.id === funnelId);
  return funnel?.stages.find((s) => s.id === stageId)?.title ?? stageId;
}

export function funnelStageTitleIn(funnels: CrmFunnel[], funnelId: string, stageId: string): string {
  const list = Array.isArray(funnels) ? funnels : DEFAULT_CRM_FUNNELS;
  const funnel = list.find((f) => f.id === funnelId);
  return funnel?.stages.find((s) => s.id === stageId)?.title ?? stageId;
}
