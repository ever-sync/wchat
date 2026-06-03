import { useInboxNotificationSettings } from "@/hooks/useInboxInboundNotifications";
import { useCrmNegotiationNotifications } from "@/hooks/useCrmNegotiationNotifications";
import { useCrmMentionNotifications } from "@/hooks/useCrmMentionNotifications";
import { useCrmRealtimeSync } from "@/hooks/useCrmRealtimeSync";

/** Montado no layout autenticado; sem UI. */
export function CrmNotificationListener() {
  const { enabled } = useInboxNotificationSettings();
  const { onNegotiationRealtimeEvent } = useCrmNegotiationNotifications(enabled);
  useCrmMentionNotifications(enabled);
  // Reusa a subscription de crm_negotiations do sync para as notificações de
  // pool, em vez de abrir um segundo canal por sessão.
  useCrmRealtimeSync({ onNegotiationEvent: onNegotiationRealtimeEvent });
  return null;
}
