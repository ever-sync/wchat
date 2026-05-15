import { useInboxNotificationSettings } from "@/hooks/useInboxInboundNotifications";
import { useCrmNegotiationNotifications } from "@/hooks/useCrmNegotiationNotifications";

/** Montado no layout autenticado; sem UI. */
export function CrmNotificationListener() {
  const { enabled } = useInboxNotificationSettings();
  useCrmNegotiationNotifications(enabled);
  return null;
}
