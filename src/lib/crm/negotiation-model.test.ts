import { describe, expect, it } from "vitest";
import type { CrmNegotiation, Customer } from "@/types/domain";
import {
  customerMatchesCrmFunnel,
  customerStageForFunnel,
  parseSyntheticCustomerCardId,
  resolveKanbanStageId,
  syntheticCustomerCardId,
} from "./negotiation-model";

const baseCard = (): CrmNegotiation => ({
  id: "lead-1",
  funnelId: "comercial",
  stageId: "lead",
  status: "em_andamento",
  assigneeId: "u1",
  title: "Lead",
  starCount: 0,
  createdAt: "2026-01-01T12:00:00.000Z",
  qualification: 2,
  totalValue: 0,
});

const stages = new Set(["lead", "contato", "andamento", "contrato", "venda"]);

describe("resolveKanbanStageId", () => {
  it("usa estágio persistido quando funil bate", () => {
    const stageId = resolveKanbanStageId({
      base: baseCard(),
      funnelId: "comercial",
      validStageIds: stages,
      customer: undefined,
      stageOverride: undefined,
      persisted: { funnelId: "comercial", stageId: "venda" },
    });
    expect(stageId).toBe("venda");
  });

  it("ignora persistido se funil divergir", () => {
    const stageId = resolveKanbanStageId({
      base: baseCard(),
      funnelId: "comercial",
      validStageIds: stages,
      customer: undefined,
      stageOverride: undefined,
      persisted: { funnelId: "auxilio", stageId: "venda" },
    });
    expect(stageId).toBe("lead");
  });

  it("prioriza cliente vinculado sobre override", () => {
    const customer: Customer = {
      id: "c1",
      nome: "X",
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
      sourceColumns: {
        crm_pipeline_stage: "contato",
        crm_funnel_id: "comercial",
      },
    };
    const stageId = resolveKanbanStageId({
      base: baseCard(),
      funnelId: "comercial",
      validStageIds: stages,
      customer,
      stageOverride: { funnel_id: "comercial", stage_id: "venda" },
      persisted: undefined,
    });
    expect(stageId).toBe("contato");
  });

  it("usa override quando não há cliente", () => {
    const stageId = resolveKanbanStageId({
      base: baseCard(),
      funnelId: "comercial",
      validStageIds: stages,
      customer: undefined,
      stageOverride: { funnel_id: "comercial", stage_id: "andamento" },
      persisted: undefined,
    });
    expect(stageId).toBe("andamento");
  });
});

describe("customerStageForFunnel", () => {
  it("retorna null se funil do cliente divergir", () => {
    const customer: Customer = {
      id: "c1",
      nome: "X",
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
      sourceColumns: {
        crm_pipeline_stage: "contato",
        crm_funnel_id: "auxilio",
      },
    };
    expect(customerStageForFunnel(customer, "comercial", stages)).toBeNull();
  });
});

describe("customerMatchesCrmFunnel", () => {
  it("aceita cliente sem crm_funnel_id em qualquer funil", () => {
    const customer: Customer = {
      id: "c1",
      nome: "X",
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
    };
    expect(customerMatchesCrmFunnel(customer, "comercial")).toBe(true);
  });
});

describe("synthetic customer card id", () => {
  it("round-trips", () => {
    const id = syntheticCustomerCardId("abc");
    expect(id).toBe("customer:abc");
    expect(parseSyntheticCustomerCardId(id)).toBe("abc");
  });
});
