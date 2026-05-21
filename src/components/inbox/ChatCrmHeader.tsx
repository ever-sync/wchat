import { Link } from "react-router-dom";
import { Briefcase, ExternalLink, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DEFAULT_CRM_FUNNELS, funnelStageTitleIn } from "@/data/crm-funnels";
import { useChatNegotiation } from "@/lib/api/crm-lead";
import { useEffectiveCrmFunnels } from "@/lib/api/crm-funnel-config";
import type { InboxChat } from "@/types/domain";

type ChatCrmHeaderProps = {
  chat: InboxChat;
};

/**
 * Linha abaixo do nome: badges do negócio (funil · etapa, vendido/perdido, link
 * para o CRM) quando existe lead, e o status da IA quando ativa. A criação de
 * lead foi movida para o botão "Criar lead no CRM" na linha do nome (CreateLeadDialog).
 */
export function ChatCrmHeader({ chat }: ChatCrmHeaderProps) {
  const aiMode = chat.aiMode ?? "off";
  const { data: funnels = DEFAULT_CRM_FUNNELS } = useEffectiveCrmFunnels();
  const { data: negotiation } = useChatNegotiation(chat.id);

  const funnel = funnels.find((f) => f.id === negotiation?.funnelId) ?? funnels[0];
  const stageTitle = negotiation
    ? funnelStageTitleIn(funnels, negotiation.funnelId, negotiation.stageId)
    : null;

  if (!negotiation && aiMode === "off") {
    return null;
  }

  return (
    <div className="mt-1 flex flex-wrap items-center gap-2" role="group" aria-label="CRM e resolução">
      {negotiation ? (
        <>
          <Badge variant="secondary" className="text-xs font-medium">
            {funnel?.listName ?? negotiation.funnelId} · {stageTitle ?? negotiation.stageId}
          </Badge>
          {negotiation.status === "vendido" && (
            <Badge className="bg-emerald-600 text-xs text-white hover:bg-emerald-600">Vendido</Badge>
          )}
          {negotiation.status === "perdido" && (
            <Badge variant="outline" className="text-xs text-destructive">
              Perdido
            </Badge>
          )}
          <Link
            to={`/crm/negociacao/${negotiation.id}`}
            className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
          >
            <Briefcase className="h-3 w-3" />
            CRM
            <ExternalLink className="h-3 w-3" />
          </Link>
        </>
      ) : null}
      {aiMode !== "off" ? (
        <Badge variant="secondary" className="inline-flex items-center gap-1 text-xs font-medium">
          <Sparkles className="h-3 w-3" />
          {aiMode === "full" ? "IA completa" : aiMode === "qualifying" ? "IA de qualificação" : "IA de handoff"}
        </Badge>
      ) : null}
    </div>
  );
}
