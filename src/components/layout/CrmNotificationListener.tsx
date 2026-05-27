import { useInboxNotificationSettings } from "@/hooks/useInboxInboundNotifications";
import { useCrmNegotiationNotifications } from "@/hooks/useCrmNegotiationNotifications";
import { useCrmMentionNotifications } from "@/hooks/useCrmMentionNotifications";
import { useCrmRealtimeSync } from "@/hooks/useCrmRealtimeSync";

/** Montado no layout autenticado; sem UI. */
export function CrmNotificationListener() {
  const { enabled } = useInboxNotificationSettings();
  useCrmNegotiationNotifications(enabled);
  useCrmMentionNotifications(enabled);
  useCrmRealtimeSync();
  return null;
}
