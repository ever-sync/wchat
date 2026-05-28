import { type ReactElement, type ReactNode } from "react";
import {
  AlarmClock,
  ArrowRightLeft,
  Bell,
  BellOff,
  Briefcase,
  CalendarClock,
  Hand,
  Pause,
  Pin,
  PinOff,
  Play,
  Search,
  ShoppingCart,
  UserRound,
  Users,
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { CallButton } from "@/components/crm/CallButton";
import { ChatTagsHeaderButton } from "@/components/inbox/ChatTagsHeaderButton";
import { useClearChatSnooze, usePinChat, useSetChatAiMode } from "@/lib/api/chat-tags";
import {
  chatAssignedToOtherAttendantMessage,
  chatAssigneeBlockedMessage,
} from "@/lib/crm/negotiation-assignee";
import { isChatSnoozed } from "@/lib/inbox-chat-rules";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { CrmNegotiationRecord, InboxChat, UserRole } from "@/types/domain";

/** Mostra o nome da ação ao passar o mouse sobre um botão de ícone do cabeçalho. */
function IconTip({ label, children }: { label: ReactNode; children: ReactElement }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

export type NotificationSettings = {
  enabled: boolean;
  permission: NotificationPermission | "unsupported";
  setEnabled: (next: boolean) => Promise<void> | void;
};

export type ChatHeaderActionsProps = {
  chat: InboxChat;
  negotiation: CrmNegotiationRecord | null;

  /** Permissões */
  canEditInbox: boolean;
  canEditCrm: boolean;
  canActOnChat: boolean;
  canMarkSaleFromChat: boolean;
  isManagerInbox: boolean;
  activeChannelAiEnabled: boolean;

  /** Quais botões de claim aparecem (regras derivadas no Inbox.tsx) */
  offerClaimBoth: boolean;
  showClaimNegotiation: boolean;
  showReleaseNegotiation: boolean;

  /** Viewer (regra de transfer pra atendimento que tenta mexer em chat alheio) */
  viewerRole?: UserRole;
  viewerProfileId?: string;

  /** Estado das mutations de claim/release (compartilhadas com o splash do Inbox) */
  claimPending: boolean;
  claimNegotiationPending: boolean;
  releaseNegotiationPending: boolean;

  /** Callbacks que disparam as mutations no pai */
  onClaimChat: () => void | Promise<void>;
  onClaimNegotiation: () => void | Promise<void>;
  onReleaseNegotiation: () => void | Promise<void>;
  onClaimChatAndNegotiation: () => void | Promise<void>;

  /** Notificações desktop (vêm do hook do pai) */
  notificationSettings: NotificationSettings;

  onPinChat?: () => void;

  /** Triggers de dialogs/sheets do pai */
  onOpenSnoozeDialog: () => void;
  onOpenAssignDialog: () => void;
  onOpenProfile: () => void;
  onOpenSaleFlow: () => void;
  onOpenFollowUp: () => void;
};

export function ChatHeaderActions({
  chat,
  negotiation,
  canEditInbox,
  canEditCrm,
  canActOnChat,
  canMarkSaleFromChat,
  isManagerInbox,
  activeChannelAiEnabled,
  offerClaimBoth,
  showClaimNegotiation,
  showReleaseNegotiation,
  viewerRole,
  viewerProfileId,
  claimPending,
  claimNegotiationPending,
  releaseNegotiationPending,
  onClaimChat,
  onClaimNegotiation,
  onReleaseNegotiation,
  onClaimChatAndNegotiation,
  notificationSettings,
  onPinChat,
  onOpenSnoozeDialog,
  onOpenAssignDialog,
  onOpenProfile,
  onOpenSaleFlow,
  onOpenFollowUp,
}: ChatHeaderActionsProps) {
  const { toast } = useToast();
  const pinChat = usePinChat();
  const setAiMode = useSetChatAiMode({
    onError: (error) =>
      toast({
        title: "Não foi possível alterar a IA",
        description: error instanceof Error ? error.message : "Tente novamente.",
        variant: "destructive",
      }),
  });
  const clearSnooze = useClearChatSnooze();

  const aiPaused = chat.aiMode === "off" || chat.aiMode === "handoff";
  const snoozed = isChatSnoozed(chat);
  const notificationsActive =
    notificationSettings.enabled && notificationSettings.permission !== "denied";

  function blockEditInboxToast() {
    toast({
      title: "Ação indisponível",
      description: "Seu papel nao tem permissao para esta ação.",
      variant: "destructive",
    });
  }

  function requireActiveAssigneeToast() {
    toast({
      title: "Assuma a conversa",
      description: chatAssigneeBlockedMessage(),
      variant: "destructive",
    });
  }

  function handleToggleAi() {
    if (!canEditInbox) {
      blockEditInboxToast();
      return;
    }
    if (!canActOnChat) {
      requireActiveAssigneeToast();
      return;
    }
    setAiMode.mutate(
      { chatId: chat.id, aiMode: aiPaused ? "full" : "off" },
      {
        onSuccess: () =>
          toast({
            title: aiPaused ? "IA reativada nesta conversa" : "IA pausada nesta conversa",
          }),
      },
    );
  }

  function handleClearSnooze() {
    if (!canEditInbox) {
      toast({
        title: "Ação indisponível",
        description: "Seu papel nao tem permissao para adiar conversa.",
        variant: "destructive",
      });
      return;
    }
    if (!canActOnChat) {
      requireActiveAssigneeToast();
      return;
    }
    void clearSnooze.mutateAsync(chat.id);
  }

  function handleRequestSnooze() {
    if (!canEditInbox) {
      toast({
        title: "Ação indisponível",
        description: "Seu papel nao tem permissao para adiar conversa.",
        variant: "destructive",
      });
      return;
    }
    if (!canActOnChat) {
      requireActiveAssigneeToast();
      return;
    }
    onOpenSnoozeDialog();
  }

  function handleRequestTransfer() {
    if (!canEditInbox) {
      toast({
        title: "Ação indisponível",
        description: "Seu papel nao tem permissao para atribuir conversa.",
        variant: "destructive",
      });
      return;
    }
    if (
      viewerRole === "atendimento" &&
      chat.assigneeId &&
      chat.assigneeId !== viewerProfileId
    ) {
      toast({
        title: "Conversa de outro atendente",
        description: chatAssignedToOtherAttendantMessage(),
        variant: "destructive",
      });
      return;
    }
    if (!isManagerInbox && !canActOnChat) {
      requireActiveAssigneeToast();
      return;
    }
    onOpenAssignDialog();
  }

  return (
    <div className="flex items-center gap-2">
      <IconTip label="Buscar na conversa">
        <button
          type="button"
          onClick={() => document.dispatchEvent(new CustomEvent("inbox:open-thread-search"))}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-wchat-100 hover:text-foreground"
          aria-label="Buscar na conversa"
        >
          <Search className="h-4 w-4" />
        </button>
      </IconTip>
      <IconTip label={chat.isPinned ? "Desafixar conversa" : "Fixar conversa"}>
        <button
          type="button"
          onClick={() => {
            if (onPinChat) {
              onPinChat();
            } else {
              pinChat.mutate({ chatId: chat.id, isPinned: !chat.isPinned });
            }
          }}
          disabled={pinChat.isPending}
          className={cn(
            "inline-flex h-10 w-10 items-center justify-center rounded-full transition-colors disabled:opacity-45",
            chat.isPinned
              ? "bg-wchat-100 text-primary hover:bg-wchat-200"
              : "text-muted-foreground hover:bg-wchat-100 hover:text-foreground",
          )}
          aria-label={chat.isPinned ? "Desafixar conversa" : "Fixar conversa"}
        >
          {chat.isPinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
        </button>
      </IconTip>
      <ChatTagsHeaderButton
        chatId={chat.id}
        tags={chat.tags ?? []}
        disabled={!canEditInbox}
      />
      {offerClaimBoth && negotiation ? (
        <IconTip label="Assumir ambos">
          <button
            type="button"
            onClick={() => void onClaimChatAndNegotiation()}
            disabled={
              claimPending ||
              claimNegotiationPending ||
              releaseNegotiationPending ||
              !canEditInbox ||
              !canEditCrm
            }
            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground transition-colors hover:bg-primary/90"
            aria-label="Assumir ambos"
            data-testid="inbox-claim-both"
          >
            <Hand className="h-4 w-4" />
          </button>
        </IconTip>
      ) : null}
      {!chat.assigneeId && !offerClaimBoth ? (
        <IconTip label="Assumir">
          <button
            type="button"
            onClick={() => void onClaimChat()}
            disabled={
              claimPending ||
              !canEditInbox ||
              claimNegotiationPending ||
              releaseNegotiationPending
            }
            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground transition-colors hover:bg-primary/90"
            aria-label="Assumir conversa"
          >
            <Hand className="h-4 w-4" />
          </button>
        </IconTip>
      ) : null}
      {showClaimNegotiation && negotiation && !offerClaimBoth ? (
        <IconTip label="Assumir negócio">
          <button
            type="button"
            onClick={() => void onClaimNegotiation()}
            disabled={
              claimNegotiationPending ||
              claimPending ||
              releaseNegotiationPending ||
              !canEditCrm
            }
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--crm-brand-border)] bg-[var(--crm-brand-tint)] text-[var(--crm-brand)] transition-colors hover:bg-[var(--crm-brand-tint-hover)]"
            aria-label="Assumir negócio"
          >
            <Briefcase className="h-4 w-4" />
          </button>
        </IconTip>
      ) : null}
      {showReleaseNegotiation && negotiation ? (
        <IconTip label="Devolver negócio">
          <button
            type="button"
            onClick={() => void onReleaseNegotiation()}
            disabled={
              releaseNegotiationPending ||
              claimNegotiationPending ||
              claimPending ||
              !canEditCrm
            }
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--crm-brand-border)] bg-[var(--crm-brand-tint)] text-[var(--crm-brand)] transition-colors hover:bg-[var(--crm-brand-tint-hover)]"
            aria-label="Devolver negócio"
          >
            <Users className="h-4 w-4" />
          </button>
        </IconTip>
      ) : null}
      {activeChannelAiEnabled ? (
        <IconTip label={aiPaused ? "Retomar IA" : "Pausar IA"}>
          <button
            type="button"
            onClick={handleToggleAi}
            disabled={setAiMode.isPending || !canActOnChat || !canEditInbox}
            className={cn(
              "inline-flex h-10 w-10 items-center justify-center rounded-full transition-colors disabled:opacity-45",
              aiPaused
                ? "text-muted-foreground hover:bg-wchat-100 hover:text-foreground"
                : "bg-primary text-primary-foreground hover:bg-primary/90",
            )}
            aria-label={aiPaused ? "Retomar IA" : "Pausar IA"}
          >
            {aiPaused ? (
              <Play className="h-4 w-4 fill-current" />
            ) : (
              <Pause className="h-4 w-4 fill-current" />
            )}
          </button>
        </IconTip>
      ) : null}
      <IconTip label="Lembrete (follow-up)">
        <button
          type="button"
          onClick={onOpenFollowUp}
          disabled={!canEditInbox}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-wchat-100 hover:text-foreground disabled:opacity-45"
          aria-label="Lembrete (follow-up)"
          data-testid="inbox-followup"
        >
          <CalendarClock className="h-4 w-4" />
        </button>
      </IconTip>
      {snoozed ? (
        <IconTip label="Remover adiamento">
          <button
            type="button"
            onClick={handleClearSnooze}
            disabled={clearSnooze.isPending || !canActOnChat || !canEditInbox}
            className="inline-flex h-10 items-center gap-1 rounded-full px-3 text-sm text-[var(--crm-amber-ink)] transition-colors hover:bg-[var(--crm-amber-tint)]"
            aria-label="Remover adiamento"
          >
            <AlarmClock className="h-4 w-4" />
          </button>
        </IconTip>
      ) : (
        <IconTip label="Adiar conversa">
          <button
            type="button"
            onClick={handleRequestSnooze}
            disabled={!canActOnChat || !canEditInbox}
            className="inline-flex h-10 items-center justify-center rounded-full px-3 text-sm text-muted-foreground transition-colors hover:bg-wchat-100 hover:text-foreground disabled:opacity-45"
            aria-label="Adiar conversa"
          >
            <AlarmClock className="h-4 w-4" />
          </button>
        </IconTip>
      )}
      <IconTip label="Transferir">
        <button
          type="button"
          onClick={handleRequestTransfer}
          disabled={!canEditInbox}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-wchat-100 hover:text-foreground"
          data-testid="inbox-transfer-chat"
          aria-label="Transferir"
        >
          <ArrowRightLeft className="h-4 w-4" />
        </button>
      </IconTip>
      <IconTip label="Notificações">
        <button
          type="button"
          onClick={() => {
            void notificationSettings.setEnabled(!notificationSettings.enabled);
          }}
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-full transition-colors",
            notificationsActive
              ? "bg-wchat-100 text-primary hover:bg-wchat-200"
              : "text-muted-foreground hover:bg-wchat-100 hover:text-foreground",
          )}
          aria-label="Notificações"
        >
          {notificationsActive ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
        </button>
      </IconTip>
      <IconTip label="Venda">
        <button
          type="button"
          onClick={onOpenSaleFlow}
          disabled={!canMarkSaleFromChat || !canEditCrm || !canEditInbox}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-wchat-100 text-foreground transition-colors hover:bg-wchat-200 disabled:pointer-events-none disabled:opacity-45"
          aria-label="Registrar venda"
        >
          <ShoppingCart className="h-4 w-4" />
        </button>
      </IconTip>
      <IconTip label="Ligar">
        <span className="inline-flex">
          <CallButton
            phone={chat.remotePhoneE164 || chat.remotePhoneDigits || null}
            customerId={chat.customerId}
            chatId={chat.id}
            negotiationId={negotiation?.id ?? chat.primaryNegotiationId ?? null}
            variant="ghost"
            size="icon"
            className="h-10 w-10 rounded-full text-muted-foreground hover:bg-wchat-100 hover:text-foreground"
          />
        </span>
      </IconTip>
      <IconTip label="Perfil do cliente">
        <button
          type="button"
          onClick={onOpenProfile}
          className="flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-wchat-100 hover:text-foreground"
          aria-label="Perfil do cliente"
        >
          <UserRound className="h-4 w-4" />
        </button>
      </IconTip>
    </div>
  );
}
