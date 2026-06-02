import { describe, expect, it } from "vitest";
import { formFieldGapToCss, formFieldGapLabel, formFieldWidthToGridSpan } from "./form-types";

describe("formFieldWidthToGridSpan", () => {
  it("mapeia 100, 66 e 33 para spans de grid", () => {
    expect(formFieldWidthToGridSpan(100)).toBe(12);
    expect(formFieldWidthToGridSpan(66)).toBe(8);
    expect(formFieldWidthToGridSpan(33)).toBe(4);
  });
});

describe("formFieldGap helpers", () => {
  it("converte espaçamento de layout em CSS legível", () => {
    expect(formFieldGapToCss(2)).toBe("0.5rem");
    expect(formFieldGapToCss(3)).toBe("0.75rem");
    expect(formFieldGapToCss(4)).toBe("1rem");
    expect(formFieldGapToCss(6)).toBe("1.5rem");
  });

  it("expõe rótulos amigáveis para o usuário", () => {
    expect(formFieldGapLabel(2)).toContain("8px");
    expect(formFieldGapLabel(3)).toContain("12px");
    expect(formFieldGapLabel(4)).toContain("16px");
    expect(formFieldGapLabel(6)).toContain("24px");
  });
});
