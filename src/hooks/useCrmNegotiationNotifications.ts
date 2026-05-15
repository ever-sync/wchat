import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { getInboxNotificationsEnabled } from "@/hooks/useInboxInboundNotifications";
import { listCrmNegotiations } from "@/lib/api/crm-negotiations";
import { useTenantSettings } from "@/lib/api/integrations";
import { getCurrentTenantId } from "@/lib/api/tenant";
import {
  isNegotiationEnteredPool,
  poolNotificationCopy,
  shouldEmitStaleNotificationForRecord,
  shouldNotifyUserForNegotiation,
  staleNotificationCopy,
  type CrmNegotiationDbRow,
} from "@/lib/crm/crm-notification-events";
import {
  getStaleNotificationLastDays,
  hasStaleBaselineForSession,
  isCrmPoolNotificationSuppressed,
  markStaleBaselineForSession,
  setStaleNotificationLastDays,
} from "@/lib/crm/crm-notification-suppress";
import { daysSinceLastTouch } from "@/lib/crm/negotiation-alerts";
import { notifyCrmAlert } from "@/lib/crm/notify-crm-alert";
import { mapCrmNegotiationDbRow } from "@/lib/crm/negotiation-model";
import { normalizeStaleNegotiationDays } from "@/lib/crm/negotiation-alerts";
import { isSupabaseConfigured, requireSupabase } from "@/lib/supabase";

const STALE_CHECK_INTERVAL_MS = 5 * 60 * 1000;

function navigateToNegotiation(navigate: ReturnType<typeof useNavigate>, negotiationId: string) {
  navigate(`/crm/negociacao/${negotiationId}`);
}

/**
 * Toast + sino do app + push/beep (mesma preferência do Inbox) quando:
 * - negócio volta ao pool (realtime UPDATE);
 * - negócio atinge X dias parado (varredura periódica).
 */
export function useCrmNegotiationNotifications(enabled: boolean = getInboxNotificationsEnabled()) {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const profileId = profile?.id;
  const { data: tenantSettings } = useTenantSettings();
  const staleThresholdDays = normalizeStaleNegotiationDays(tenantSettings?.staleNegotiationDays);
  const staleCheckRunningRef = useRef(false);

  useEffect(() => {
    if (!isSupabaseConfigured || !enabled || !profileId) return;

    const supabase = requireSupabase();
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let cancelled = false;

    const emitPool = (row: CrmNegotiationDbRow) => {
      const id = row.id;
      if (!id || isCrmPoolNotificationSuppressed(id)) return;

      const { titulo, descricao } = poolNotificationCopy(String(row.title ?? ""));
      notifyCrmAlert({
        kind: "pool",
        titulo,
        descricao,
        negotiationId: id,
        onNavigate: () => navigateToNegotiation(navigate, id),
      });
    };

    void getCurrentTenantId()
      .then((tenantId) => {
        if (cancelled) return;

        channel = supabase
          .channel(`crm-negotiations-notify:${tenantId}`)
          .on(
            "postgres_changes",
            {
              event: "UPDATE",
              schema: "public",
              table: "crm_negotiations",
              filter: `tenant_id=eq.${tenantId}`,
            },
            (payload) => {
              const prev = payload.old as CrmNegotiationDbRow | undefined;
              const next = payload.new as CrmNegotiationDbRow | undefined;
              if (!isNegotiationEnteredPool(prev, next) || !next?.id) return;

              const record = mapCrmNegotiationDbRow(next as Record<string, unknown>);
              if (!shouldNotifyUserForNegotiation(record, profileId)) return;

              emitPool(next);
            },
          )
          .subscribe();
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
      if (channel) {
        void supabase.removeChannel(channel);
      }
    };
  }, [enabled, navigate, profileId]);

  useEffect(() => {
    if (!isSupabaseConfigured || !enabled || !profileId) return;

    let cancelled = false;

    const runStaleScan = async () => {
      if (staleCheckRunningRef.current || cancelled) return;
      if (typeof document !== "undefined" && document.visibilityState === "hidden") return;

      staleCheckRunningRef.current = true;
      try {
        const rows = await listCrmNegotiations({ status: "em_andamento" });

        if (!hasStaleBaselineForSession(profileId)) {
          for (const record of rows) {
            const staleDays = daysSinceLastTouch({
              status: record.status,
              nextTaskAt: record.nextTaskAt ?? undefined,
              lastContactAt: record.lastContactAt ?? undefined,
              lastInteractionAt: record.lastInteractionAt ?? undefined,
              createdAt: record.createdAt,
            });
            if (staleDays >= staleThresholdDays) {
              setStaleNotificationLastDays(record.id, staleDays);
            }
          }
          markStaleBaselineForSession(profileId);
          return;
        }

        for (const record of rows) {
          if (cancelled) break;

          const last = getStaleNotificationLastDays(record.id);
          const { notify, staleDays } = shouldEmitStaleNotificationForRecord(
            record,
            profileId,
            staleThresholdDays,
            last,
          );
          if (!notify) continue;

          const { titulo, descricao } = staleNotificationCopy(
            record.title,
            staleDays,
            staleThresholdDays,
          );
          notifyCrmAlert({
            kind: "stale",
            titulo,
            descricao,
            negotiationId: record.id,
            onNavigate: () => navigateToNegotiation(navigate, record.id),
          });
          setStaleNotificationLastDays(record.id, staleDays);
        }
      } catch {
        // sem sessão ou rede: ignorar até o próximo ciclo
      } finally {
        staleCheckRunningRef.current = false;
      }
    };

    void runStaleScan();
    const timer = window.setInterval(() => void runStaleScan(), STALE_CHECK_INTERVAL_MS);

    const onVisible = () => {
      if (document.visibilityState === "visible") {
        void runStaleScan();
      }
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [enabled, navigate, profileId, staleThresholdDays]);
}
