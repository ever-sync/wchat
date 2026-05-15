import type { UserRole } from "@/types/domain";

/** Admin e operação podem devolver negócio ao pool (limpar responsável). */
export function canReleaseCrmNegotiationToPool(role: UserRole | undefined): boolean {
  return role === "admin" || role === "operacao";
}
