import { describe, expect, it } from "vitest";
import { DEFAULT_CRM_FUNNELS } from "@/data/crm-funnels";
import { CRM_FUNNEL_ID_KEY, CRM_PIPELINE_STAGE_KEY } from "@/lib/crm-pipeline";
import type { CrmNegotiation, Customer } from "@/types/domain";
import {
  buildSyntheticCustomerNegotiationCards,
  customerMatchesCrmFunnel,
  customerStatusToSyntheticNegotiationStatus,
  customerStageForFunnel,
  isSyntheticCustomerCardId,
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

  it("status perdido vai para etapa de perda mesmo com cliente na primeira etapa", () => {
    const customer: Customer = {
      id: "c1",
      nome: "Raphael",
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
        crm_pipeline_stage: "lead",
        crm_funnel_id: "comercial",
      },
    };
    const stageId = resolveKanbanStageId({
      base: { ...baseCard(), status: "perdido", stageId: "perdido" },
      funnelId: "comercial",
      validStageIds: new Set([...stages, "lead-perdido"]),
      customer,
      stageOverride: undefined,
      persisted: { funnelId: "comercial", stageId: "perdido" },
      terminalStages: { lostStageId: "lead-perdido", saleStageId: "venda" },
    });
    expect(stageId).toBe("lead-perdido");
  });

  it("ignora etapa do cliente quando há negociação persistida", () => {
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
      stageOverride: undefined,
      persisted: { funnelId: "comercial", stageId: "andamento" },
    });
    expect(stageId).toBe("andamento");
  });

  it("status vendido vai para etapa de venda configurada", () => {
    const stageId = resolveKanbanStageId({
      base: { ...baseCard(), status: "vendido" },
      funnelId: "comercial",
      validStageIds: new Set([...stages, "clientes"]),
      customer: undefined,
      stageOverride: undefined,
      persisted: { funnelId: "comercial", stageId: "lead" },
      terminalStages: { lostStageId: "perdido", saleStageId: "clientes" },
    });
    expect(stageId).toBe("clientes");
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
    expect(isSyntheticCustomerCardId(id)).toBe(true);
    expect(isSyntheticCustomerCardId("uuid-real")).toBe(false);
  });
});

describe("buildSyntheticCustomerNegotiationCards", () => {
  const funnels = DEFAULT_CRM_FUNNELS;

  function makeCustomer(overrides: Partial<Customer> & Pick<Customer, "id" | "nome">): Customer {
    return {
      telefone: "11999999999",
      perfil: "A",
      rota: "R1",
      ultimoPedido: "",
      status: "ativo",
      email: "",
      cnpj: "",
      endereco: "",
      vendedor: "",
      ticketMedio: 0,
      frequenciaCompra: "",
      totalGasto: 0,
      cadastradoEm: "2026-03-01T12:00:00.000Z",
      ...overrides,
    };
  }

  it("inclui cliente com etapa no cadastro sem negociação vinculada", () => {
    const customer = makeCustomer({
      id: "cust-1",
      nome: "Maria",
      sourceColumns: {
        [CRM_FUNNEL_ID_KEY]: "comercial",
        [CRM_PIPELINE_STAGE_KEY]: "contato",
      },
    });
    const cards = buildSyntheticCustomerNegotiationCards({
      customers: [customer],
      funnelId: "comercial",
      funnels,
      linkedCustomerIds: new Set(),
    });
    expect(cards).toHaveLength(1);
    expect(cards[0].id).toBe("customer:cust-1");
    expect(cards[0].stageId).toBe("contato");
    expect(cards[0].customerId).toBe("cust-1");
    expect(cards[0].title).toBe("Maria");
  });

  it("omite cliente que já tem negociação no funil", () => {
    const customer = makeCustomer({
      id: "cust-2",
      nome: "João",
      sourceColumns: {
        [CRM_PIPELINE_STAGE_KEY]: "lead",
      },
    });
    const cards = buildSyntheticCustomerNegotiationCards({
      customers: [customer],
      funnelId: "comercial",
      funnels,
      linkedCustomerIds: new Set(["cust-2"]),
    });
    expect(cards).toHaveLength(0);
  });

  it("mapeia inativo para pausado e bloqueado para perdido", () => {
    expect(customerStatusToSyntheticNegotiationStatus("inativo")).toBe("pausado");
    expect(customerStatusToSyntheticNegotiationStatus("bloqueado")).toBe("perdido");
    const paused = makeCustomer({
      id: "cust-3",
      nome: "Ana",
      status: "inativo",
      sourceColumns: { [CRM_PIPELINE_STAGE_KEY]: "andamento" },
    });
    const cards = buildSyntheticCustomerNegotiationCards({
      customers: [paused],
      funnelId: "comercial",
      funnels,
      linkedCustomerIds: new Set(),
    });
    expect(cards[0]?.status).toBe("pausado");
  });
});
