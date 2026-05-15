import { describe, expect, it } from "vitest";
import { canReleaseCrmNegotiationToPool } from "./negotiation-assignee";

describe("canReleaseCrmNegotiationToPool", () => {
  it("permite admin e operação", () => {
    expect(canReleaseCrmNegotiationToPool("admin")).toBe(true);
    expect(canReleaseCrmNegotiationToPool("operacao")).toBe(true);
  });

  it("nega vendedor e demais papéis", () => {
    expect(canReleaseCrmNegotiationToPool("vendedor")).toBe(false);
    expect(canReleaseCrmNegotiationToPool(undefined)).toBe(false);
  });
});
