import { describe, expect, it } from "vitest";
import {
  inboxFiltersFromQuickFilter,
  inboxQuickFilterLabel,
  inboxScopeFiltersForQuickFilter,
} from "./inbox-quick-filters";

describe("inboxFiltersFromQuickFilter", () => {
  it("mapeia Minhas para assignee mine", () => {
    expect(inboxFiltersFromQuickFilter("mine", "u1")).toEqual({
      assigneeId: "mine",
      currentUserId: "u1",
      hideSnoozed: true,
      snoozedOnly: false,
      unreadOnly: false,
    });
  });

  it("Ocultas nao usa filtro de adiadas", () => {
    expect(inboxFiltersFromQuickFilter("hidden", undefined)).toEqual({
      hideSnoozed: false,
      snoozedOnly: false,
      unreadOnly: false,
    });
  });

  it("mapeia Não lidas para unreadOnly", () => {
    expect(inboxFiltersFromQuickFilter("unread", undefined).unreadOnly).toBe(true);
  });
});

describe("inboxScopeFiltersForQuickFilter", () => {
  it("Ocultas lista conversas encerradas incluindo perdidas", () => {
    expect(inboxScopeFiltersForQuickFilter("hidden", "open")).toEqual({
      status: "closed",
      hideLost: false,
    });
  });

  it("demais chips usam listScope normal", () => {
    expect(inboxScopeFiltersForQuickFilter(null, "open")).toEqual({
      status: "open",
      hideLost: true,
    });
  });
});

describe("inboxQuickFilterLabel", () => {
  it("retorna Todas quando sem filtro", () => {
    expect(inboxQuickFilterLabel(null)).toBe("Todas");
    expect(inboxQuickFilterLabel("mine")).toBe("Minhas");
  });
});
