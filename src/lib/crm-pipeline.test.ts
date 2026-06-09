import { describe, expect, it } from "vitest";
import { DEFAULT_CRM_FUNNELS } from "@/data/crm-funnels";
import type { Customer } from "@/types/domain";
import { resolveCustomerPipelineView } from "@/lib/crm-pipeline";

const baseCustomer = (): Customer => ({
  id: "c1",
  nome: "Maria",
  telefone: "",
  perfil: "B",
  rota: "",
  ultimoPedido: "",
  status: "ativo",
  email: "",
  cnpj: "",
  endereco: "",
  vendedor: "",
  ticketMedio: 0,
  frequenciaCompra: "",
  totalGasto: 0,
  cadastradoEm: "2026-01-01T12:00:00.000Z",
});

describe("resolveCustomerPipelineView", () => {
  it("usa etapa da negociação em andamento no funil configurado", () => {
    const view = resolveCustomerPipelineView(
      {
        ...baseCustomer(),
        sourceColumns: { crm_pipeline_stage: "lead", crm_funnel_id: "comercial" },
      },
      DEFAULT_CRM_FUNNELS,
      [{ funnelId: "comercial", stageId: "andamento", status: "em_andamento" }],
    );
    expect(view.pipelineStages.some((s) => s.key === "andamento")).toBe(true);
    expect(view.pipelineStages[view.pipelineActiveIndex]?.key).toBe("andamento");
  });

  it("prioriza etapa de perda quando negociação está perdida", () => {
    const customFunnels = [
      {
        id: "comercial",
        listName: "COMERCIAL",
        stages: [
          { id: "lead", title: "LEAD" },
          { id: "lead-perdido", title: "LEAD PERDIDO", isLostStage: true },
        ],
      },
    ];
    const view = resolveCustomerPipelineView(
      {
        ...baseCustomer(),
        sourceColumns: { crm_pipeline_stage: "lead", crm_funnel_id: "comercial" },
      },
      customFunnels,
      [{ funnelId: "comercial", stageId: "perdido", status: "perdido" }],
    );
    expect(view.pipelineStages[view.pipelineActiveIndex]?.key).toBe("lead-perdido");
  });
});
