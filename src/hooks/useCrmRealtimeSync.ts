import { useEffect, useRef } from "react";
import { useQueryClient, type QueryClient } from "@tanstack/react-query";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { getCurrentTenantId } from "@/lib/api/tenant";
import { isSupabaseConfigured, requireSupabase } from "@/lib/supabase";

export type CrmRealtimePayload = RealtimePostgresChangesPayload<Record<string, unknown>>;

type CrmRealtimeOptions = {
  /**
   * Chamado em cada mudança de `crm_negotiations`. Permite que features que
   * antes abriam o próprio canal (ex.: notificações de pool) reusem esta
   * subscription em vez de duplicá-la no servidor de Realtime.
   */
  onNegotiationEvent?: (payload: CrmRealtimePayload) => void;
};

type TableSpec = {
  table: string;
  invalidate: (queryClient: QueryClient) => void;
};

function bulkInvalidate(queryClient: QueryClient, keys: readonly (readonly unknown[])[]) {
  for (const key of keys) {
    void queryClient.invalidateQueries({ queryKey: key as unknown[] });
  }
}

const TABLE_SPECS: TableSpec[] = [
  {
    table: "crm_negotiations",
    invalidate: (qc) =>
      bulkInvalidate(qc, [
        ["crm-negotiations"],
        ["crm-negotiation-stages"],
        ["chat-negotiation"],
        ["inbox-chats"],
      ]),
  },
  {
    table: "crm_activities",
    invalidate: (qc) => bulkInvalidate(qc, [["crm-activities"]]),
  },
  {
    table: "crm_tasks",
    invalidate: (qc) =>
      bulkInvalidate(qc, [["crm-tasks"], ["crm-negotiations"]]),
  },
  {
    table: "crm_negotiation_documents",
    invalidate: (qc) => bulkInvalidate(qc, [["crm-negotiation-documents"]]),
  },
  {
    table: "customers",
    invalidate: (qc) =>
      bulkInvalidate(qc, [
        ["customers"],
        ["crm-negotiations"],
        ["chat-negotiation"],
      ]),
  },
  {
    table: "tenant_crm_funnel_config",
    invalidate: (qc) =>
      bulkInvalidate(qc, [["tenant-crm-funnel-config"], ["crm-negotiations"]]),
  },
  {
    table: "customer_custom_field_values",
    invalidate: (qc) => bulkInvalidate(qc, [["customer-custom-field-values"]]),
  },
  {
    table: "customer_custom_fields",
    invalidate: (qc) => bulkInvalidate(qc, [["customer-custom-fields"]]),
  },
];

/**
 * Assinatura global de mudanças nas tabelas do CRM via Supabase Realtime.
 * Quando qualquer linha do tenant é atualizada, invalida as queries TanStack
 * relacionadas para que toda tela montada (Kanban, detalhe, perfil) reflita
 * em tempo real, sem precisar recarregar.
 *
 * Requer que cada tabela esteja na publication `supabase_realtime`. Tabelas
 * fora da publication simplesmente não recebem eventos (no-op).
 */
export function useCrmRealtimeSync(options?: CrmRealtimeOptions) {
  const queryClient = useQueryClient();
  // Ref para o callback ficar fora das deps do effect (não re-subscreve a cada
  // render quando o handler muda de identidade).
  const onNegotiationEventRef = useRef(options?.onNegotiationEvent);
  onNegotiationEventRef.current = options?.onNegotiationEvent;

  useEffect(() => {
    if (!isSupabaseConfigured) return;

    const sb = requireSupabase();
    let channel: ReturnType<typeof sb.channel> | null = null;
    let cancelled = false;

    void getCurrentTenantId()
      .then((tenantId) => {
        if (cancelled || !tenantId) return;
        const filter = `tenant_id=eq.${tenantId}`;
        let builder = sb.channel(`crm-realtime:${tenantId}`);
        for (const spec of TABLE_SPECS) {
          builder = builder.on(
            "postgres_changes",
            { event: "*", schema: "public", table: spec.table, filter },
            (payload) => {
              spec.invalidate(queryClient);
              if (spec.table === "crm_negotiations") {
                onNegotiationEventRef.current?.(payload as CrmRealtimePayload);
              }
            },
          );
        }
        channel = builder.subscribe();
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
      if (channel) {
        void sb.removeChannel(channel);
      }
    };
  }, [queryClient]);
}
