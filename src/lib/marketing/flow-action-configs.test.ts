import { describe, expect, it } from "vitest";
import {
  getConfigKind,
  parseConfig,
  summarizeConfig,
  validateActionConfig,
} from "./flow-action-configs";
import { isExecutableMarketingFlowAction } from "./flow-types";

function step(actionId: string, config: Record<string, unknown>) {
  return {
    id: "s1",
    actionId,
    label: actionId,
    iconKey: "x",
    iconClass: "y",
    config,
  };
}

describe("Fase 4 — ações de negociação (registry + executável)", () => {
  const actions = [
    "atualizar-nome-negociacao",
    "atualizar-status",
    "adicionar-anotacao",
    "marcar-venda",
  ];

  it("todas têm config kind e são executáveis", () => {
    for (const a of actions) {
      expect(getConfigKind(a)).not.toBeNull();
      expect(isExecutableMarketingFlowAction(a)).toBe(true);
    }
  });
});

describe("update-deal-title", () => {
  it("erra quando o nome está vazio", () => {
    const issues = validateActionConfig(step("atualizar-nome-negociacao", { title: "" }), "update-deal-title");
    expect(issues.some((i) => i.code === "DEAL_TITLE_EMPTY")).toBe(true);
  });
  it("aceita nome com template", () => {
    const issues = validateActionConfig(
      step("atualizar-nome-negociacao", { title: "Deal {{cliente.nome}}" }),
      "update-deal-title",
    );
    expect(issues).toHaveLength(0);
  });
});

describe("update-deal-status", () => {
  it("parse normaliza status inválido para em_andamento", () => {
    expect(parseConfig("update-deal-status", { status: "xpto" }).status).toBe("em_andamento");
    expect(parseConfig("update-deal-status", { status: "vendido" }).status).toBe("vendido");
  });
  it("summarize traduz o status (valores reais do banco)", () => {
    expect(summarizeConfig("update-deal-status", { status: "vendido" })).toBe("Ganha (venda)");
    expect(summarizeConfig("update-deal-status", { status: "perdido" })).toBe("Perdida");
  });
});

describe("mark-sale", () => {
  it("erra com valor não numérico", () => {
    const issues = validateActionConfig(step("marcar-venda", { valueCents: "abc" }), "mark-sale");
    expect(issues.some((i) => i.code === "SALE_VALUE_INVALID")).toBe(true);
  });
  it("aceita valor vazio (mantém atual)", () => {
    expect(validateActionConfig(step("marcar-venda", { valueCents: "" }), "mark-sale")).toHaveLength(0);
  });
  it("summarize formata em BRL", () => {
    expect(summarizeConfig("mark-sale", { valueCents: "19900" })).toContain("R$");
  });
});

describe("add-note", () => {
  it("erra quando vazia", () => {
    expect(
      validateActionConfig(step("adicionar-anotacao", { note: "  " }), "add-note").some(
        (i) => i.code === "NOTE_EMPTY",
      ),
    ).toBe(true);
  });
});

describe("ai-classify (Fase 6)", () => {
  it("é executável e tem config kind", () => {
    expect(getConfigKind("classificar-ia")).toBe("ai-classify");
    expect(isExecutableMarketingFlowAction("classificar-ia")).toBe(true);
  });
  it("erra sem prompt e com menos de 2 categorias", () => {
    const issues = validateActionConfig(
      step("classificar-ia", { prompt: "", categories: [{ label: "Quente", nextStepId: "s2" }] }),
      "ai-classify",
    );
    expect(issues.some((i) => i.code === "AI_NO_PROMPT")).toBe(true);
    expect(issues.some((i) => i.code === "AI_FEW_CATEGORIES")).toBe(true);
  });
  it("erra categoria sem passo de destino", () => {
    const issues = validateActionConfig(
      step("classificar-ia", {
        prompt: "Classifique",
        categories: [
          { label: "Quente", nextStepId: "s2" },
          { label: "Frio", nextStepId: "" },
        ],
      }),
      "ai-classify",
    );
    expect(issues.some((i) => i.code === "AI_NO_STEP")).toBe(true);
  });
  it("config válida não gera erros e summarize lista rótulos", () => {
    const cfg = {
      prompt: "Classifique",
      categories: [
        { label: "Quente", nextStepId: "s2" },
        { label: "Frio", nextStepId: "s3" },
      ],
    };
    expect(validateActionConfig(step("classificar-ia", cfg), "ai-classify")).toHaveLength(0);
    expect(summarizeConfig("ai-classify", cfg)).toBe("IA → Quente / Frio");
  });
});
