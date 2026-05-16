import { describe, expect, it } from "vitest";
import {
  canAtendimentoActOnChat,
  canAtendimentoModifyNegotiation,
  canReleaseCrmNegotiationToPool,
  isClientePerfilCrmLocked,
  isInboxLeadLocked,
} from "./negotiation-assignee";

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

describe("canAtendimentoModifyNegotiation", () => {
  it("atendimento só altera negócio atribuído a si", () => {
    expect(canAtendimentoModifyNegotiation("atendimento", "u1", "u1")).toBe(true);
    expect(canAtendimentoModifyNegotiation("atendimento", null, "u1")).toBe(false);
    expect(canAtendimentoModifyNegotiation("atendimento", "u2", "u1")).toBe(false);
  });

  it("admin e operação não são restritos", () => {
    expect(canAtendimentoModifyNegotiation("admin", null, "u1")).toBe(true);
    expect(canAtendimentoModifyNegotiation("operacao", "u2", "u1")).toBe(true);
  });
});

describe("canAtendimentoActOnChat", () => {
  it("atendimento só atua em conversa atribuída a si", () => {
    expect(canAtendimentoActOnChat("atendimento", "u1", "u1")).toBe(true);
    expect(canAtendimentoActOnChat("atendimento", null, "u1")).toBe(false);
    expect(canAtendimentoActOnChat("admin", null, "u1")).toBe(true);
  });
});

describe("isClientePerfilCrmLocked", () => {
  it("bloqueia quando há negócio em andamento não assumido", () => {
    expect(
      isClientePerfilCrmLocked("atendimento", "u1", [
        { status: "em_andamento", assigneeId: null },
      ]),
    ).toBe(true);
    expect(
      isClientePerfilCrmLocked("atendimento", "u1", [
        { status: "em_andamento", assigneeId: "u1" },
      ]),
    ).toBe(false);
    expect(isClientePerfilCrmLocked("admin", "u1", [{ status: "em_andamento", assigneeId: null }])).toBe(
      false,
    );
  });
});

describe("isInboxLeadLocked", () => {
  it("bloqueia sem conversa ou negócio assumidos", () => {
    expect(isInboxLeadLocked("atendimento", null, null, "u1")).toBe(true);
    expect(
      isInboxLeadLocked("atendimento", "u1", null, "u1", { hasLinkedNegotiation: true }),
    ).toBe(true);
    expect(
      isInboxLeadLocked("atendimento", "u1", "u1", "u1", { hasLinkedNegotiation: true }),
    ).toBe(false);
    expect(isInboxLeadLocked("admin", null, null, "u1", { hasLinkedNegotiation: true })).toBe(
      false,
    );
  });
});
