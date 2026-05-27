import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { getInboxNotificationsEnabled } from "@/hooks/useInboxInboundNotifications";
import { notifyCrmAlert } from "@/lib/crm/notify-crm-alert";
import { isSupabaseConfigured, requireSupabase } from "@/lib/supabase";

type CommentRow = {
  id: string;
  tenant_id: string;
  negotiation_id: string;
  created_by: string;
  body: string;
  mentions: string[] | null;
};

/**
 * Realtime: novo comentário em `crm_negotiation_comments` que contém o usuário
 * logado em `mentions[]` → emite toast/push (mesma infra dos demais alertas).
 * Filtro feito no cliente porque o Supabase realtime postgres_changes não
 * suporta operadores em arrays.
 */
export function useCrmMentionNotifications(
  enabled: boolean = getInboxNotificationsEnabled(),
) {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const profileId = profile?.id;
  const profileNameRef = useRef(profile?.nome ?? "");
  profileNameRef.current = profile?.nome ?? profileNameRef.current;

  useEffect(() => {
    if (!isSupabaseConfigured || !enabled || !profileId) return;
    const supabase = requireSupabase();
    const channel = supabase
      .channel(`crm-mentions:${profileId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "crm_negotiation_comments",
        },
        (payload) => {
          const row = payload.new as CommentRow | undefined;
          if (!row) return;
          if (row.created_by === profileId) return; // não notifica autor
          if (!Array.isArray(row.mentions) || !row.mentions.includes(profileId)) return;
          const negId = row.negotiation_id;
          notifyCrmAlert({
            kind: "mention",
            titulo: "Você foi mencionado",
            descricao: row.body.slice(0, 160),
            negotiationId: negId,
            onNavigate: () => navigate(`/crm/negociacao/${negId}`),
          });
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [enabled, navigate, profileId]);
}
