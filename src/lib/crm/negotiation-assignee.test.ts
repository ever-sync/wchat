import { describe, expect, it } from "vitest";
import { canReleaseCrmNegotiationToPool } from "./negotiation-assignee";

describe("canReleaseCrmNegotiationToPool", () => {
  it("permite admin e operação", () => {
    expect(canReleaseCrmNegotiationToPool("admin")).toBe(true);
    expect(canReleaseCrmNegotiationToPool("operacao")).toBe(true);
  });

  it("nega atendimento, financeiro e demais papeis", () => {
    expect(canReleaseCrmNegotiationToPool("atendimento")).toBe(false);
    expect(canReleaseCrmNegotiationToPool("financeiro")).toBe(false);
    expect(canReleaseCrmNegotiationToPool(undefined)).toBe(false);
  });
});
