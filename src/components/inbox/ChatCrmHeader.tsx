import { useState } from "react";
import { Link } from "react-router-dom";
import { Briefcase, ExternalLink, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DealChoiceDialog } from "@/components/inbox/DealChoiceDialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useRolePermissions } from "@/hooks/useRolePermissions";
import { funnelStageTitleIn } from "@/data/crm-funnels";
import { useCrmNegotiationsForCustomer } from "@/lib/api/crm-negotiations";
import { useEffectiveCrmFunnels } from "@/lib/api/crm-funnel-config";
import {
  useChatNegotiation,
  useEnsureLeadFromChat,
  useLinkChatNegotiation,
} from "@/lib/api/crm-lead";
import { canAtendimentoActOnChat, chatAssigneeBlockedMessage } from "@/lib/crm/negotiation-assignee";
import type { InboxChat } from "@/types/domain";

type ChatCrmHeaderProps = {
  chat: InboxChat;
};

export function ChatCrmHeader({ chat }: ChatCrmHeaderProps) {
  const { toast } = useToast();
  const { profile } = useAuth();
  const { can } = useRolePermissions();
  const aiMode = chat.aiMode ?? "off";
  const profileId = profile?.id;
  const canActOnChat = canAtendimentoActOnChat(profile?.role, chat.assigneeId, profileId);
  const canEditCrm = can("crm", "edit");

  const { data: funnels } = useEffectiveCrmFunnels();
  const { data: negotiation } = useChatNegotiation(chat.id);
  const { data: customerNegotiations = [] } = useCrmNegotiationsForCustomer(
    chat.customerId ?? undefined,
    { enabled: Boolean(chat.customerId) },
  );
  const ensureLead = useEnsureLeadFromChat();
  const linkNegotiation = useLinkChatNegotiation();
  const [dealChoiceOpen, setDealChoiceOpen] = useState(false);

  const notifyLeadError = (error: unknown) => {
    toast({
      title: "Erro ao criar lead no CRM",
      description: error instanceof Error ? error.message : "Tente novamente.",
      variant: "destructive",
    });
  };

  const notifyLeadSuccess = (message: string) => {
    toast({ title: "Lead no CRM", description: message });
  };

  const funnel = funnels.find((f) => f.id === negotiation?.funnelId) ?? funnels[0];
  const stageTitle = negotiation
    ? funnelStageTitleIn(funnels, negotiation.funnelId, negotiation.stageId)
    : null;

  const activeDeals = customerNegotiations.filter((n) => n.status === "em_andamento");
  const needsDealChoice =
    Boolean(chat.customerId) &&
    !negotiation &&
    activeDeals.length > 0;

  const handleEnsureLead = () => {
    if (!chat.customerId) return;
    if (!canEditCrm) {
      toast({
        title: "Ação indisponível",
        description: "Seu papel nao tem permissao para criar ou vincular lead no CRM.",
        variant: "destructive",
      });
      return;
    }
    if (!canActOnChat) {
      toast({
        title: "Assuma a conversa",
        description: chatAssigneeBlockedMessage(),
        variant: "destructive",
      });
      return;
    }
    if (needsDealChoice) {
      setDealChoiceOpen(true);
      return;
    }
    ensureLead
      .mutateAsync({ chatId: chat.id })
      .then(() => notifyLeadSuccess("Lead criado e vinculado ao CRM."))
      .catch(notifyLeadError);
  };

  return (
    <>
      <div className="mt-1 flex flex-wrap items-center gap-2" role="group" aria-label="CRM e resolução">
        <Badge variant="outline" className="text-xs font-medium text-muted-foreground">
          {aiMode === "off" ? "IA desativada" : `IA: ${aiMode}`}
        </Badge>
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
        ) : chat.customerId ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            disabled={ensureLead.isPending || linkNegotiation.isPending}
            onClick={handleEnsureLead}
          >
            {needsDealChoice ? "Vincular ao CRM" : "Criar lead no CRM"}
          </Button>
        ) : null}
        {aiMode !== "off" ? (
          <Badge variant="secondary" className="inline-flex items-center gap-1 text-xs font-medium">
            <Sparkles className="h-3 w-3" />
            {aiMode === "full" ? "IA completa" : aiMode === "qualifying" ? "IA de qualificação" : "IA de handoff"}
          </Badge>
        ) : null}
      </div>

      {chat.customerId ? (
        <DealChoiceDialog
          open={dealChoiceOpen}
          onOpenChange={setDealChoiceOpen}
          negotiations={customerNegotiations}
          pending={ensureLead.isPending || linkNegotiation.isPending}
          onLinkExisting={(negotiationId) => {
            if (!canEditCrm) {
              toast({
                title: "Ação indisponível",
                description: "Seu papel nao tem permissao para vincular ao CRM.",
                variant: "destructive",
              });
              return;
            }
            if (!canActOnChat) {
              toast({
                title: "Assuma a conversa",
                description: chatAssigneeBlockedMessage(),
                variant: "destructive",
              });
              return;
            }
            linkNegotiation
              .mutateAsync({ chatId: chat.id, negotiationId })
              .then(() => {
                setDealChoiceOpen(false);
                notifyLeadSuccess("Negociação existente vinculada à conversa.");
              })
              .catch(notifyLeadError);
          }}
          onCreateNew={() => {
            if (!canEditCrm) {
              toast({
                title: "Ação indisponível",
                description: "Seu papel nao tem permissao para criar lead no CRM.",
                variant: "destructive",
              });
              return;
            }
            if (!canActOnChat) {
              toast({
                title: "Assuma a conversa",
                description: chatAssigneeBlockedMessage(),
                variant: "destructive",
              });
              return;
            }
            ensureLead
              .mutateAsync({ chatId: chat.id, forceNew: true })
              .then(() => {
                setDealChoiceOpen(false);
                notifyLeadSuccess("Nova negociação criada no CRM.");
              })
              .catch(notifyLeadError);
          }}
        />
      ) : null}
    </>
  );
}
