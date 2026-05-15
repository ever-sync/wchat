import type { CrmNegotiation } from "@/types/domain";

/** Negociação no pool (UUID) para E2E de claim sem Supabase. */
export const E2E_POOL_NEGOTIATION: CrmNegotiation = {
  id: "00000000-0000-4000-8000-000000000001",
  funnelId: "comercial",
  stageId: "lead",
  status: "em_andamento",
  assigneeId: "",
  title: "E2E Pool Lead",
  starCount: 0,
  createdAt: "2026-05-01T10:00:00.000Z",
  nextTaskAt: "2026-06-01T10:00:00.000Z",
  closingForecast: null,
  lastContactAt: "2026-05-01T10:00:00.000Z",
  lastInteractionAt: "2026-05-01T10:00:00.000Z",
  qualification: 2,
  totalValue: 0,
};
