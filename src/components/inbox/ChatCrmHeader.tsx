import { useState } from "react";
import { Link } from "react-router-dom";
import { Briefcase, CheckCircle2, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DealChoiceDialog } from "@/components/inbox/DealChoiceDialog";
import { funnelStageTitleIn } from "@/data/crm-funnels";
import { useCrmNegotiationsForCustomer } from "@/lib/api/crm-negotiations";
import { useEffectiveCrmFunnels } from "@/lib/api/crm-funnel-config";
import {
  useChatNegotiation,
  useEnsureLeadFromChat,
  useLinkChatNegotiation,
  useSetChatResolution,
} from "@/lib/api/crm-lead";
import { useUpdateCrmNegotiation } from "@/lib/api/crm-negotiations";
import type { ChatResolution, InboxChat } from "@/types/domain";

const RESOLUTION_LABELS: Record<ChatResolution, string> = {
  open: "Aberta",
  pending: "Pendente",
  resolved: "Resolvida",
  waiting_customer: "Aguardando cliente",
};

type ChatCrmHeaderProps = {
  chat: InboxChat;
};

export function ChatCrmHeader({ chat }: ChatCrmHeaderProps) {
  const { data: funnels } = useEffectiveCrmFunnels();
  const { data: negotiation } = useChatNegotiation(chat.id);
  const { data: customerNegotiations = [] } = useCrmNegotiationsForCustomer(
    chat.customerId ?? undefined,
    { enabled: Boolean(chat.customerId) },
  );
  const ensureLead = useEnsureLeadFromChat();
  const linkNegotiation = useLinkChatNegotiation();
  const setResolution = useSetChatResolution();
  const updateNegotiation = useUpdateCrmNegotiation();
  const [dealChoiceOpen, setDealChoiceOpen] = useState(false);

  const resolution = chat.resolution ?? "open";
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
    if (needsDealChoice) {
      setDealChoiceOpen(true);
      return;
    }
    void ensureLead.mutateAsync({ chatId: chat.id });
  };

  return (
    <>
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

        <Select
          value={resolution}
          onValueChange={(value) => {
            void setResolution.mutateAsync({
              chatId: chat.id,
              resolution: value as ChatResolution,
            });
          }}
        >
          <SelectTrigger className="h-7 w-[140px] text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(RESOLUTION_LABELS) as ChatResolution[]).map((key) => (
              <SelectItem key={key} value={key}>
                {RESOLUTION_LABELS[key]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {negotiation && negotiation.status === "em_andamento" && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 gap-1 text-xs text-emerald-700"
            onClick={() => {
              void updateNegotiation.mutateAsync({
                id: negotiation.id,
                patch: { status: "vendido", stageId: "venda" },
              });
              void setResolution.mutateAsync({ chatId: chat.id, resolution: "resolved" });
            }}
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            Marcar vendido
          </Button>
        )}
      </div>

      {chat.customerId ? (
        <DealChoiceDialog
          open={dealChoiceOpen}
          onOpenChange={setDealChoiceOpen}
          negotiations={customerNegotiations}
          pending={ensureLead.isPending || linkNegotiation.isPending}
          onLinkExisting={(negotiationId) => {
            void linkNegotiation
              .mutateAsync({ chatId: chat.id, negotiationId })
              .then(() => setDealChoiceOpen(false));
          }}
          onCreateNew={() => {
            void ensureLead
              .mutateAsync({ chatId: chat.id, forceNew: true })
              .then(() => setDealChoiceOpen(false));
          }}
        />
      ) : null}
    </>
  );
}
