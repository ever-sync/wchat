import { useInboxNotificationSettings } from "@/hooks/useInboxInboundNotifications";
import { useCrmNegotiationNotifications } from "@/hooks/useCrmNegotiationNotifications";
import { useCrmRealtimeSync } from "@/hooks/useCrmRealtimeSync";

/** Montado no layout autenticado; sem UI. */
export function CrmNotificationListener() {
  const { enabled } = useInboxNotificationSettings();
  useCrmNegotiationNotifications(enabled);
  useCrmRealtimeSync();
  return null;
}
