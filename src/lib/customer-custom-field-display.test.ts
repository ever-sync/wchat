import { describe, expect, it } from "vitest";
import {
  buildCustomerCustomFieldsDisplayList,
  customerCustomFieldSourceColumnKeys,
  readCustomerCustomFieldFromSourceColumns,
} from "@/lib/customer-custom-field-display";
import type { CustomerCustomFieldDefinition } from "@/lib/api/customer-custom-fields";

const field: CustomerCustomFieldDefinition = {
  id: "f1",
  nome: "Doença",
  kind: "texto",
  sortOrder: 0,
  options: [],
};

describe("customerCustomFieldSourceColumnKeys", () => {
  it("inclui nome, slug e variantes", () => {
    const keys = customerCustomFieldSourceColumnKeys("Paga imposto de renda");
    expect(keys).toContain("Paga imposto de renda");
    expect(keys).toContain("paga-imposto-de-renda");
    expect(keys).toContain("paga_imposto_de_renda");
  });
});

describe("readCustomerCustomFieldFromSourceColumns", () => {
  it("resolve por nome exato ou normalizado", () => {
    expect(
      readCustomerCustomFieldFromSourceColumns({ Doença: "Diabetes" }, "Doença"),
    ).toBe("Diabetes");
    expect(
      readCustomerCustomFieldFromSourceColumns({ doenca: "Hipertensão" }, "Doença"),
    ).toBe("Hipertensão");
  });
});

describe("buildCustomerCustomFieldsDisplayList", () => {
  it("usa valor da tabela quando existir", () => {
    const items = buildCustomerCustomFieldsDisplayList({
      fields: [field],
      valueRows: [{ fieldId: "f1", valueText: "Asma", valueNumeric: null, valueDate: null }],
      sourceColumns: { Doença: "ignorado" },
    });
    expect(items[0]?.value).toBe("Asma");
  });

  it("faz fallback para source_columns quando a tabela está vazia", () => {
    const items = buildCustomerCustomFieldsDisplayList({
      fields: [field],
      valueRows: [],
      sourceColumns: { doenca: "Artrite" },
    });
    expect(items[0]?.value).toBe("Artrite");
  });
});
