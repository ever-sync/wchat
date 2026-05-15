import { describe, expect, it } from "vitest";
import {
  createDefaultStage,
  slugifyFunnelKey,
  uniqueKey,
  validateFunnelsDraft,
} from "./funnel-editor-utils";

describe("funnel-editor-utils", () => {
  it("slugify normaliza texto", () => {
    expect(slugifyFunnelKey("Isenção de IR")).toBe("isencao-de-ir");
  });

  it("uniqueKey evita colisão", () => {
    const set = new Set(["lead", "lead-2"]);
    expect(uniqueKey(set, "lead")).toBe("lead-3");
  });

  it("createDefaultStage gera id único", () => {
    const funnel = {
      id: "comercial",
      listName: "COMERCIAL",
      stages: [{ id: "lead", title: "LEAD" }],
    };
    const stage = createDefaultStage(funnel, "Nova etapa");
    expect(stage.id).toBe("nova-etapa");
    expect(stage.title).toBe("NOVA ETAPA");
  });

  it("validateFunnelsDraft detecta etapa sem título", () => {
    const err = validateFunnelsDraft([
      {
        id: "f1",
        listName: "F1",
        stages: [{ id: "a", title: "" }],
      },
    ]);
    expect(err).toContain("Preencha nome");
  });
});
