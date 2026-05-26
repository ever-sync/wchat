import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent, type ReactElement, type ReactNode } from "react";
import { useQueryClient, type InfiniteData } from "@tanstack/react-query";
import { formatBRL } from "@/lib/format";
import {
  Bell,
  AlarmClock,
  BellOff,
  Briefcase,
  Hand,
  Plus,
  ShoppingCart,
  Trash2,
  ArrowRightLeft,
  UserRound,
  Users,
} from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ConversationAvatar } from "@/components/inbox/ConversationAvatar";
import { ConversationList } from "@/components/inbox/ConversationList";
import { ChatCrmHeader } from "@/components/inbox/ChatCrmHeader";
import { CreateLeadDialog } from "@/components/inbox/CreateLeadDialog";
import { CallButton } from "@/components/crm/CallButton";
import { SnoozeChatDialog } from "@/components/inbox/SnoozeChatDialog";
import { CustomerProfileSheet } from "@/components/inbox/CustomerProfileSheet";
import { MarkWinDialog } from "@/components/crm/MarkWinDialog";
import { MessageInput } from "@/components/inbox/MessageInput";
import { MessageThread } from "@/components/inbox/MessageThread";
import { dialogCloseInset } from "@/lib/dialog-close-inset";
import { extensionForRecordedMime, pickAudioRecorderMime } from "@/lib/inboxAudioRecording";
import { maybeCompressImage } from "@/lib/inboxImageCompression";
import { groupThreadItemsByDay, type ThreadEntry } from "@/lib/inboxMessageGroups";
import {
  useChatNotes,
  useChatNotesRealtime,
  useCreateChatNote,
} from "@/lib/api/chat-notes";
import { useProducts } from "@/lib/api/products";
import { useCustomerCreditSummary, useCustomerSales, useRegisterSaleFlow, useReturns } from "@/lib/api/sales";
import {
  uploadWhatsappMediaFile,
  WHATSAPP_MEDIA_MAX_BYTES,
} from "@/lib/api/whatsapp-media";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/useAppStore";
import {
  fetchInboxMessagesPage,
  getNextInboxMessagesPageParam,
  type InboxMessagesPageCursor,
  type InboxMessagesPageResult,
  useInboxChats,
  useInboxChatsRealtime,
  useInboxMessages,
  useMarkChatAsRead,
  useSendWhatsappMessage,
  useSyncInbox,
  useWhatsappInstances,
  inboxChatFiltersFromListScope,
} from "@/lib/api/whatsapp";
import {
  useAssignChat,
  useAtendimentoUsers,
  useAutoAssignChat,
  useChatTags,
  useClaimChat,
  useClearChatSnooze,
  useSetChatAiMode,
  useSnoozeChat,
  useUnassignChat,
} from "@/lib/api/chat-tags";
import { useEffectiveCrmFunnels } from "@/lib/api/crm-funnel-config";
import {
  useClaimCrmNegotiation,
  useReleaseCrmNegotiationToPool,
  useUpdateCrmNegotiation,
} from "@/lib/api/crm-negotiations";
import { useChatNegotiation, useSetChatResolution } from "@/lib/api/crm-lead";
import { useNegotiationProducts } from "@/lib/api/crm-negotiation-products";
import { isNegotiationUnassigned } from "@/lib/crm/negotiation-alerts";
import { hasSaleAttendant, validateMarkWinLines } from "@/lib/crm/sale-rules";
import { invalidateSalesQueries, persistMarkWinSale } from "@/lib/crm/persist-mark-win-sale";
import {
  canAtendimentoActOnChat,
  canAtendimentoModifyNegotiation,
  chatAssignedToOtherAttendantMessage,
  assumeConversationToViewMessage,
  chatAssigneeBlockedMessage,
  isInboxLeadLocked,
  managerOnlyReleaseToPoolMessage,
  mustAssumeUnassignedChatToView,
  negotiationAssigneeBlockedMessage,
  shouldOfferInboxClaimBoth,
  canReleaseCrmNegotiationToPool,
} from "@/lib/crm/negotiation-assignee";
import { useAuth } from "@/hooks/useAuth";
import { useRolePermissions } from "@/hooks/useRolePermissions";
import { isChatSnoozed } from "@/lib/inbox-chat-rules";
import { useQuickReplies } from "@/lib/api/quick-replies";
import { isSupabaseConfigured } from "@/lib/supabase";
import {
  SALE_PAYMENT_METHOD_LABELS,
  type InboxChat,
  type InboxChatFilters,
  type InboxListScope,
  type InboxQuickFilter,
  type MessageType,
  type SalePaymentMethod,
  type WhatsappMessage,
} from "@/types/domain";
import { useToast } from "@/hooks/use-toast";
import {
  useInboxInboundNotifications,
  useInboxNotificationSettings,
} from "@/hooks/useInboxInboundNotifications";
import { useInboxTitleBadge } from "@/hooks/useInboxTitleBadge";
import { clearInboxChatDraft, useInboxChatDraft } from "@/hooks/useInboxChatDraft";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { resolveConfiguredSaleStageId } from "@/data/crm-funnels";
import {
  inboxFiltersFromQuickFilter,
  inboxScopeFiltersForQuickFilter,
} from "@/lib/inbox-quick-filters";

/** Limite de vendas do cliente carregadas no fluxo de devolucao (API listSales). */
const SALE_RETURN_HISTORY_LIMIT = 200;

/** Valor sentinela do Select de transferência (Radix não aceita string vazia). */
const INBOX_ASSIGN_NONE = "__none__";

function formatMoney(value: number) {
  return formatBRL(value);
}

/** Mostra o nome da ação ao passar o mouse sobre um botão de ícone do cabeçalho. */
function IconTip({ label, children }: { label: ReactNode; children: ReactElement }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

function parseMoneyInput(value: string) {
  const normalized = value.replace(/\s/g, "").replace(/\./g, "").replace(",", ".");
  const parsed = Number(normalized);
  if (!Number.isFinite(parsed)) {
    return null;
  }
  return parsed;
}

type SaleCartLine = {
  key: string;
  productId: string;
  quantityStr: string;
  otherPrice: boolean;
  customPriceStr: string;
};

function createEmptySaleCartLine(): SaleCartLine {
  return {
    key:
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `sl-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    productId: "",
    quantityStr: "1",
    otherPrice: false,
    customPriceStr: "",
  };
}

function parseQuantityInput(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  const normalized = trimmed.replace(/\./g, "").replace(",", ".");
  const parsed = Number(normalized);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }
  return parsed;
}

function aggregateQtyByProduct(cart: SaleCartLine[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const line of cart) {
    const id = line.productId.trim();
    if (!id) {
      continue;
    }
    const q = parseQuantityInput(line.quantityStr);
    if (q == null) {
      continue;
    }
    map.set(id, (map.get(id) ?? 0) + q);
  }
  return map;
}

function saleCartHasDuplicateProductIds(cart: SaleCartLine[]): boolean {
  const seen = new Set<string>();
  for (const line of cart) {
    const id = line.productId.trim();
    if (!id) {
      continue;
    }
    if (seen.has(id)) {
      return true;
    }
    seen.add(id);
  }
  return false;
}

function formatDateTime(value?: string | null) {
  if (!value) {
    return "Sem data";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function Inbox() {
  const { toast } = useToast();
  const { profile } = useAuth();
  const { can } = useRolePermissions();
  useInboxChatsRealtime(isSupabaseConfigured);
  const [searchParams, setSearchParams] = useSearchParams();
  const messagesScrollAreaRef = useRef<HTMLDivElement | null>(null);
  const loadOlderScrollRef = useRef<{ scrollHeight: number; scrollTop: number } | null>(null);
  const microphoneStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<number | null>(null);
  const lastMarkReadAttemptRef = useRef<Record<string, number>>({});
  const lastScrollStateRef = useRef<{ chatId: string | null; messageCount: number }>({
    chatId: null,
    messageCount: 0,
  });
  const skipAutoScrollToBottomRef = useRef(false);
  const bodyTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const mediaUrlInputRef = useRef<HTMLInputElement | null>(null);
  const attachmentInputRef = useRef<HTMLInputElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const recentSendFingerprintsRef = useRef<Map<string, number>>(new Map());
  const lastSendErrorToastRef = useRef<{ key: string; at: number } | null>(null);
  const threadAtBottomRef = useRef(true);
  const [search, setSearch] = useState(() => searchParams.get("search") ?? "");
  const debouncedSearch = useDebouncedValue(search, 300);
  const [instanceId, setInstanceId] = useState<string>("all");
  const [listScope, setListScope] = useState<InboxListScope>("open");
  const [assigneeFilter, setAssigneeFilter] = useState<string>("all");
  const [snoozedFilter, setSnoozedFilter] = useState<"active" | "snoozed">("active");
  const [quickFilter, setQuickFilter] = useState<InboxQuickFilter | null>(null);
  const [snoozeDialogOpen, setSnoozeDialogOpen] = useState(false);
  const [createLeadOpen, setCreateLeadOpen] = useState(false);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [assignDialogChatId, setAssignDialogChatId] = useState<string | null>(null);
  const [assignDialogSelectedUser, setAssignDialogSelectedUser] = useState<string>("");
  const [activeChatId, setActiveChatId] = useState<string | null>(() => searchParams.get("chatId"));
  const notificationSettings = useInboxNotificationSettings();
  // Notifica novas mensagens inbound em chats nao ativos / aba em background.
  useInboxInboundNotifications(activeChatId, notificationSettings.enabled);
  const [messageType, setMessageType] = useState<Exclude<MessageType, "system">>("text");
  const [bodyText, setBodyText] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [payloadText, setPayloadText] = useState("{}");
  const [simulateTyping, setSimulateTyping] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [microphoneState, setMicrophoneState] = useState<"idle" | "requesting" | "granted" | "denied">("idle");
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDurationSec, setRecordingDurationSec] = useState(0);
  const [quickReplyOpen, setQuickReplyOpen] = useState(false);
  const [noteMode, setNoteMode] = useState(false);
  const [selectedAttachmentName, setSelectedAttachmentName] = useState<string | null>(null);
  const [attachmentMimeType, setAttachmentMimeType] = useState<string | null>(null);
  const [attachmentUploading, setAttachmentUploading] = useState(false);
  const [attachmentProgress, setAttachmentProgress] = useState<number | null>(null);
  const attachmentAbortRef = useRef<AbortController | null>(null);
  const [retryingMessageId, setRetryingMessageId] = useState<string | null>(null);
  const [jumpToLatestVisible, setJumpToLatestVisible] = useState(false);
  const [saleFlowOpen, setSaleFlowOpen] = useState(false);
  const [markQuickSaleDialogOpen, setMarkQuickSaleDialogOpen] = useState(false);
  const [saleStep, setSaleStep] = useState<1 | 2 | 3>(1);
  const [saleFlowType, setSaleFlowType] = useState<"venda" | "devolucao" | "">("");
  const [saleSeller, setSaleSeller] = useState("operador-atual");
  const [saleCartLines, setSaleCartLines] = useState<SaleCartLine[]>(() => [createEmptySaleCartLine()]);
  const [returnSource, setReturnSource] = useState<"existente" | "outra">("existente");
  const [returnExistingSaleId, setReturnExistingSaleId] = useState("");
  const [returnSaleItemId, setReturnSaleItemId] = useState("");
  const [returnExistingSalesSearch, setReturnExistingSalesSearch] = useState("");
  const [returnProductId, setReturnProductId] = useState("");
  const [returnOtherPrice, setReturnOtherPrice] = useState(false);
  const [returnCustomPrice, setReturnCustomPrice] = useState("");
  const [returnResolution, setReturnResolution] = useState<"troca" | "credito">("credito");
  const [returnQuantityStr, setReturnQuantityStr] = useState("1");
  const [returnNotes, setReturnNotes] = useState("");
  const [salePaymentMethod, setSalePaymentMethod] = useState<SalePaymentMethod>("pix");
  const [saleUseCredit, setSaleUseCredit] = useState(false);
  const [saleCreditInput, setSaleCreditInput] = useState("");
  const [saleNotes, setSaleNotes] = useState("");
  const requestedChatId = searchParams.get("chatId");
  const requestedCustomerId = searchParams.get("customerId");
  const requestedSearch = searchParams.get("search");

  const queryClient = useQueryClient();
  const prefetchChatMessages = (chatId: string) => {
    void queryClient.prefetchInfiniteQuery({
      queryKey: ["inbox-messages", chatId],
      queryFn: ({ pageParam }) => fetchInboxMessagesPage(chatId, pageParam ?? null),
      initialPageParam: null as InboxMessagesPageCursor | null,
      getNextPageParam: (lastPage) => getNextInboxMessagesPageParam(lastPage),
      staleTime: 60_000,
    });
  };

  // Callbacks estáveis para a lista de conversas: o ConversationRow é memoizado e
  // só deve re-renderizar quando seu chat/active mudar — não quando o Inbox re-renderiza
  // (ex.: digitação no composer). O ref guarda sempre a versão mais recente da lógica.
  const selectChatRef = useRef<(chatId: string) => void>(() => {});
  const prefetchChatRef = useRef<(chatId: string) => void>(() => {});
  prefetchChatRef.current = prefetchChatMessages;
  const stableSelectChat = useCallback((chatId: string) => selectChatRef.current(chatId), []);
  const stablePrefetchChat = useCallback((chatId: string) => prefetchChatRef.current(chatId), []);

  const { data: instances = [] } = useWhatsappInstances();
  const { data: saleProducts = [] } = useProducts(
    { status: "ativo", limit: 500 },
    { enabled: saleFlowOpen, staleTime: 60_000 },
  );
  const registerSaleFlow = useRegisterSaleFlow();
  const updateCrmNegotiationMutation = useUpdateCrmNegotiation();
  const setChatResolutionMutation = useSetChatResolution();
  const { data: effectiveCrmFunnels } = useEffectiveCrmFunnels();
  const { data: availableTags = [], isLoading: tagsLoading } = useChatTags();
  const { data: atendimentoUsers = [] } = useAtendimentoUsers();
  const { data: quickReplies = [] } = useQuickReplies();
  const assignChatMutation = useAssignChat();
  const unassignChatMutation = useUnassignChat();
  const autoAssignChatMutation = useAutoAssignChat();
  const claimChatMutation = useClaimChat();
  const claimCrmNegotiation = useClaimCrmNegotiation();
  const releaseCrmNegotiation = useReleaseCrmNegotiationToPool();
  const canReleaseToPool = canReleaseCrmNegotiationToPool(profile?.role);
  const snoozeChatMutation = useSnoozeChat();
  const clearSnoozeMutation = useClearChatSnooze();
  const setAiModeMutation = useSetChatAiMode({
    onError: (error) =>
      toast({
        title: "Não foi possível alterar a IA",
        description: error instanceof Error ? error.message : "Tente novamente.",
        variant: "destructive",
      }),
  });

  const profileId = profile?.id;
  const canEditInbox = can("inbox", "edit");
  const canEditCrm = can("crm", "edit");

  const inboxChatsFilter = useMemo((): InboxChatFilters => {
    const quick = inboxFiltersFromQuickFilter(quickFilter, profileId);
    const useAdvancedAssignee = quickFilter === null;
    const useAdvancedSnooze = quickFilter === null;

    return {
      search: debouncedSearch,
      instanceId: instanceId === "all" ? undefined : instanceId,
      tagIds: selectedTagIds.length > 0 ? selectedTagIds : undefined,
      ...inboxScopeFiltersForQuickFilter(quickFilter, listScope),
      ...quick,
      assigneeId: useAdvancedAssignee
        ? assigneeFilter === "all"
          ? undefined
          : assigneeFilter
        : quick.assigneeId,
      hideSnoozed: useAdvancedSnooze ? snoozedFilter === "active" : quick.hideSnoozed,
      snoozedOnly: useAdvancedSnooze ? snoozedFilter === "snoozed" : quick.snoozedOnly,
    };
  }, [
    debouncedSearch,
    instanceId,
    assigneeFilter,
    selectedTagIds,
    snoozedFilter,
    listScope,
    quickFilter,
    profileId,
  ]);

  const { data: chats = [], isLoading: chatsLoading } = useInboxChats(inboxChatsFilter, {
    // Realtime ja cobre updates em whatsapp_chats (ver useInboxChatsRealtime).
    // Mantemos um polling longo apenas como fallback em caso de WebSocket cair.
    refetchInterval: 20_000,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: false,
  });
  const activeChat = useMemo(() => {
    if (!activeChatId) {
      return null;
    }
    return chats.find((chat) => chat.id === activeChatId) ?? null;
  }, [activeChatId, chats]);

  // O botão de pausar/retomar IA só faz sentido se o canal do chat tem IA ligada.
  const activeChannelAiEnabled = useMemo(
    () => instances.find((i) => i.id === activeChat?.instanceId)?.aiEnabled ?? false,
    [instances, activeChat?.instanceId],
  );

  const mustAssumeChatToView = useMemo(
    () => mustAssumeUnassignedChatToView(profile?.role, activeChat?.assigneeId),
    [profile?.role, activeChat?.assigneeId],
  );

  const assignDialogChat = useMemo(() => {
    if (!assignDialogChatId) {
      return null;
    }
    return chats.find((chat) => chat.id === assignDialogChatId) ?? null;
  }, [assignDialogChatId, chats]);

  const blockedRequestedChatId = useMemo(() => {
    if (!requestedChatId?.trim() || chatsLoading) {
      return null;
    }
    if (chats.some((chat) => chat.id === requestedChatId)) {
      return null;
    }
    return requestedChatId;
  }, [requestedChatId, chats, chatsLoading]);

  const isManagerInbox = profile?.role === "admin" || profile?.role === "operacao";
  const canManageChatPool =
    profile?.role === "admin" || profile?.role === "operacao" || profile?.role === "financeiro";
  const { data: linkedNegotiation, isLoading: linkedNegotiationLoading } = useChatNegotiation(
    activeChat?.id ?? null,
  );
  const { data: linkedNegotiationProducts = [] } = useNegotiationProducts(linkedNegotiation?.id);
  const markWinInitialLines = useMemo(
    () =>
      linkedNegotiationProducts
        .filter((p) => p.productId)
        .map((p) => ({ productId: p.productId as string, quantity: p.quantity, unitValue: p.unitPrice })),
    [linkedNegotiationProducts],
  );
  const showClaimNegotiation =
    Boolean(activeChat?.primaryNegotiationId) &&
    !linkedNegotiationLoading &&
    linkedNegotiation != null &&
    linkedNegotiation.status === "em_andamento" &&
    isNegotiationUnassigned(linkedNegotiation.assigneeId);
  const showReleaseNegotiation =
    Boolean(activeChat?.primaryNegotiationId) &&
    !linkedNegotiationLoading &&
    linkedNegotiation != null &&
    linkedNegotiation.status === "em_andamento" &&
    canReleaseToPool &&
    !isNegotiationUnassigned(linkedNegotiation.assigneeId);
  const offerClaimBoth =
    Boolean(activeChat && linkedNegotiation) &&
    shouldOfferInboxClaimBoth(activeChat?.assigneeId, linkedNegotiation?.assigneeId);
  const managerUnassignedCount = useMemo(() => {
    if (!isManagerInbox) {
      return 0;
    }
    return chats.filter(
      (c) =>
        !c.assigneeId &&
        (c.resolution ?? "open") === "open" &&
        c.status === "open",
    ).length;
  }, [isManagerInbox, chats]);
  // Badge "(N) Distribui Bot" no titulo da aba enquanto em background.
  const totalUnread = useMemo(
    () => chats.reduce((acc, chat) => acc + (chat.unreadCount ?? 0), 0),
    [chats],
  );
  useInboxTitleBadge(totalUnread);
  // Rascunho persistido por chat: restaura ao abrir, salva debounced.
  useInboxChatDraft(activeChat?.id, bodyText, setBodyText);

  // Atalhos de teclado globais do inbox.
  // - Ctrl/Cmd+K: foca a busca de conversas (sem inserir nada na caixa).
  // - Esc com foco em campo de texto: blur (sai do composer).
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const isMod = e.metaKey || e.ctrlKey;
      if (isMod && (e.key === "k" || e.key === "K")) {
        e.preventDefault();
        const input = searchInputRef.current;
        if (input) {
          input.focus();
          input.select();
        }
        return;
      }
      if (e.key === "Escape") {
        const target = e.target as HTMLElement | null;
        if (
          target instanceof HTMLTextAreaElement ||
          target instanceof HTMLInputElement
        ) {
          // Em radix overlays (dialogs etc.) o Esc ja faz o trabalho deles;
          // aqui so saimos do composer/busca quando o foco e direto neles.
          target.blur();
        }
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);
  const {
    data: messages = [],
    isLoading: messagesLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInboxMessages(activeChat?.id, {
    enabled: Boolean(activeChat?.id) && !mustAssumeChatToView,
    // Fallback longo se o Realtime cair (mensagens ja entram via WebSocket).
    // Sem refetch ao focar a janela: useInboxRealtime cobre INSERT/UPDATE.
    refetchInterval: activeChat && !mustAssumeChatToView ? 60_000 : false,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: false,
  });
  const { data: customerSales = [] } = useCustomerSales(
    activeChat?.customerId,
    { limit: SALE_RETURN_HISTORY_LIMIT },
    { enabled: Boolean(activeChat?.customerId) && saleFlowOpen },
  );
  const { data: customerCreditSummary } = useCustomerCreditSummary(activeChat?.customerId, {
    enabled: Boolean(activeChat?.customerId) && saleFlowOpen,
  });
  const saleIdForReturnsQuery =
    saleFlowOpen &&
    saleFlowType === "devolucao" &&
    returnSource === "existente" &&
    returnExistingSaleId.trim()
      ? returnExistingSaleId.trim()
      : null;
  const { data: saleReturns = [] } = useReturns(
    saleIdForReturnsQuery ? { saleId: saleIdForReturnsQuery, limit: 200 } : undefined,
    {
      enabled: Boolean(saleIdForReturnsQuery),
      staleTime: 4_000,
    },
  );
  const returnedQtyBySaleItemId = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of saleReturns) {
      if (!r.saleItemId) {
        continue;
      }
      map.set(r.saleItemId, (map.get(r.saleItemId) ?? 0) + r.quantity);
    }
    return map;
  }, [saleReturns]);
  const markChatAsRead = useMarkChatAsRead();
  const sendMessage = useSendWhatsappMessage();
  const syncInbox = useSyncInbox({
    onSuccess: (_data, variables) => {
      const descricao = variables?.chatId
        ? "Esta conversa foi sincronizada com o WhatsApp."
        : "Lista de conversas atualizada.";
      toast({ title: "Inbox atualizado", description: descricao });
      useAppStore.getState().addNotification({
        tipo: "sucesso",
        titulo: "Inbox atualizado",
        descricao,
      });
    },
    onError: (error) => {
      const msg = error instanceof Error ? error.message : "Tente novamente.";
      toast({ title: "Falha ao sincronizar inbox", description: msg, variant: "destructive" });
      useAppStore.getState().addNotification({
        tipo: "erro",
        titulo: "Falha ao sincronizar inbox",
        descricao: msg,
      });
    },
  });

  useEffect(() => {
    if (chats.length === 0) {
      setActiveChatId(null);
      return;
    }

    setActiveChatId((current) => {
      if (requestedChatId) {
        if (chats.some((chat) => chat.id === requestedChatId)) {
          return requestedChatId;
        }
        // Deep link para conversa inacessível (outro atendente / RLS): não faz fallback na lista.
        return null;
      }

      if (requestedCustomerId) {
        const customerChat = chats.find((chat) => chat.customerId === requestedCustomerId);
        if (customerChat) {
          return customerChat.id;
        }
      }

      if (current && chats.some((chat) => chat.id === current)) {
        return current;
      }

      if (current && quickFilter === "unread") {
        return null;
      }

      if (quickFilter === "unread") {
        return null;
      }

      return chats[0].id;
    });
  }, [chats, requestedChatId, requestedCustomerId, quickFilter]);

  useEffect(() => {
    if (!requestedSearch) {
      return;
    }

    setSearch((current) => (current === requestedSearch ? current : requestedSearch));
  }, [requestedSearch]);

  useEffect(() => {
    if (quickFilter === "unread") {
      return;
    }

    if (!activeChat?.id || !activeChat.unreadCount) {
      return;
    }

    // So marca como lido com a aba visivel: evita PATCH desnecessario quando
    // o usuario esta em outra janela e o realtime/polling continua aumentando o
    // contador.
    if (typeof document !== "undefined" && document.visibilityState !== "visible") {
      return;
    }

    // Guarda extra contra erros recorrentes do backend (drift de schema etc.):
    // o `useMarkChatAsRead` ja faz patch otimista no cache, entao em fluxo normal
    // este efeito nao re-dispara para o mesmo chat. Este ref so blinda contra o
    // caso de erro com cache restaurado.
    const lastAttemptedUnread = lastMarkReadAttemptRef.current[activeChat.id];
    if (lastAttemptedUnread === activeChat.unreadCount) {
      return;
    }

    lastMarkReadAttemptRef.current[activeChat.id] = activeChat.unreadCount;
    void markChatAsRead.mutateAsync(activeChat.id).catch(() => undefined);
  }, [activeChat?.id, activeChat?.unreadCount, markChatAsRead, quickFilter]);

  useEffect(() => {
    setShowEmojiPicker(false);
    setNoteMode(false);
    // Trocou de chat: cancela upload em andamento (anexo nao se aplica mais).
    attachmentAbortRef.current?.abort();
    attachmentAbortRef.current = null;
  }, [activeChat?.id]);

  useEffect(() => {
    setProfileOpen(false);
  }, [activeChat?.id]);

  /** Deep link: `/inbox?chatId=…&profile=1` abre o sheet de perfil (ex.: retorno do cadastro na inbox). */
  useEffect(() => {
    if (searchParams.get("profile") !== "1") {
      return;
    }
    if (!activeChat?.id) {
      return;
    }
    setProfileOpen(true);
    const next = new URLSearchParams(searchParams);
    next.delete("profile");
    setSearchParams(next, { replace: true });
  }, [activeChat?.id, searchParams, setSearchParams]);

  useEffect(() => {
    return () => {
      if (recordingTimerRef.current != null) {
        window.clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
      const rec = mediaRecorderRef.current;
      mediaRecorderRef.current = null;
      audioChunksRef.current = [];
      if (rec && rec.state !== "inactive") {
        rec.ondataavailable = null;
        rec.onstop = null;
        rec.stop();
      }
      microphoneStreamRef.current?.getTracks().forEach((track) => track.stop());
      microphoneStreamRef.current = null;
      setIsRecording(false);
      setRecordingDurationSec(0);
    };
  }, [activeChat?.id]);

  const { data: chatNotes = [] } = useChatNotes(activeChat?.id);
  useChatNotesRealtime(activeChat?.id);
  const createChatNote = useCreateChatNote();

  const messageGroups = useMemo(() => {
    if (chatNotes.length === 0) {
      return groupThreadItemsByDay(messages);
    }
    const items: ThreadEntry[] = [...messages, ...chatNotes];
    items.sort((a, b) => {
      const aTs =
        "_noteKind" in a
          ? Date.parse(a.createdAt)
          : Date.parse(a.createdAt ?? a.sentAt ?? a.receivedAt ?? "");
      const bTs =
        "_noteKind" in b
          ? Date.parse(b.createdAt)
          : Date.parse(b.createdAt ?? b.sentAt ?? b.receivedAt ?? "");
      return (Number.isFinite(aTs) ? aTs : 0) - (Number.isFinite(bTs) ? bTs : 0);
    });
    return groupThreadItemsByDay(items);
  }, [messages, chatNotes]);
  const saleProductOptions = useMemo(
    () =>
      saleProducts.map((product) => ({
        id: product.id,
        name: product.nome,
        subtitle: `${formatMoney(product.precoVenda)} • estoque ${product.qtdEstoque} ${product.unidade}`,
      })),
    [saleProducts],
  );
  const sellerOptions = useMemo(
    () => [
      { id: "operador-atual", name: "Operador atual" },
      { id: "equipe-interna", name: "Equipe interna" },
      { id: "comercial-externo", name: "Comercial externo" },
    ],
    [],
  );
  const customerSalesForReturnSelect = useMemo(() => {
    const needle = returnExistingSalesSearch.trim().toLowerCase();
    if (!needle) {
      return customerSales;
    }
    return customerSales.filter((sale) => {
      const payment = SALE_PAYMENT_METHOD_LABELS[sale.paymentMethod] ?? "";
      const blob = [
        formatDateTime(sale.soldAt),
        sale.notes ?? "",
        payment,
        formatMoney(sale.totalAmount),
        ...sale.items.map((item) => item.productName),
      ]
        .join(" ")
        .toLowerCase();
      return blob.includes(needle);
    });
  }, [customerSales, returnExistingSalesSearch]);

  const existingSalesOptions = useMemo(
    () =>
      customerSalesForReturnSelect.map((sale) => {
        const n = sale.items.length;
        const productLabel =
          n === 0 ? "Produto" : n === 1 ? (sale.items[0]?.productName ?? "Produto") : `${n} itens`;
        return {
          id: sale.id,
          label: `${formatDateTime(sale.soldAt)} · ${productLabel} · ${formatMoney(sale.totalAmount)}`,
        };
      }),
    [customerSalesForReturnSelect],
  );
  const selectedExistingSale = useMemo(() => {
    const fromFiltered = existingSalesOptions.find((option) => option.id === returnExistingSaleId);
    if (fromFiltered) {
      return fromFiltered;
    }
    const sale = customerSales.find((s) => s.id === returnExistingSaleId);
    if (!sale) {
      return null;
    }
    const n = sale.items.length;
    const productLabel =
      n === 0 ? "Produto" : n === 1 ? (sale.items[0]?.productName ?? "Produto") : `${n} itens`;
    return {
      id: sale.id,
      label: `${formatDateTime(sale.soldAt)} · ${productLabel} · ${formatMoney(sale.totalAmount)}`,
    };
  }, [existingSalesOptions, returnExistingSaleId, customerSales]);
  const selectedReturnSourceSale = useMemo(
    () =>
      returnSource === "existente"
        ? (customerSales.find((sale) => sale.id === returnExistingSaleId) ?? null)
        : null,
    [returnSource, customerSales, returnExistingSaleId],
  );
  const selectedReturnSaleItem = useMemo(() => {
    if (!selectedReturnSourceSale || !returnSaleItemId.trim()) {
      return null;
    }
    return selectedReturnSourceSale.items.find((item) => item.id === returnSaleItemId) ?? null;
  }, [selectedReturnSourceSale, returnSaleItemId]);
  const selectedReturnRemainingQty = useMemo(() => {
    if (!selectedReturnSaleItem) {
      return null;
    }
    const already = returnedQtyBySaleItemId.get(selectedReturnSaleItem.id) ?? 0;
    return Math.max(0, selectedReturnSaleItem.quantity - already);
  }, [selectedReturnSaleItem, returnedQtyBySaleItemId]);

  useEffect(() => {
    if (returnSource !== "existente") {
      return;
    }
    if (!selectedReturnSaleItem) {
      setReturnQuantityStr("1");
      return;
    }
    const already = returnedQtyBySaleItemId.get(selectedReturnSaleItem.id) ?? 0;
    const remaining = Math.max(0, selectedReturnSaleItem.quantity - already);
    setReturnQuantityStr(remaining > 0 ? String(remaining) : "1");
  }, [returnSource, selectedReturnSaleItem, returnedQtyBySaleItemId]);

  const devolucaoCreditPreview = useMemo(() => {
    if (saleFlowType !== "devolucao") {
      return null;
    }
    const rq = parseQuantityInput(returnQuantityStr);
    if (rq == null) {
      return null;
    }
    if (returnOtherPrice) {
      const custom = parseMoneyInput(returnCustomPrice);
      return custom != null && custom > 0 ? custom : null;
    }
    if (returnSource === "existente" && selectedReturnSaleItem) {
      return selectedReturnSaleItem.unitPrice * rq;
    }
    if (returnSource === "outra" && returnProductId.trim()) {
      const product = saleProducts.find((p) => p.id === returnProductId.trim());
      if (!product) {
        return null;
      }
      return product.precoVenda * rq;
    }
    return null;
  }, [
    saleFlowType,
    returnQuantityStr,
    returnOtherPrice,
    returnCustomPrice,
    returnSource,
    selectedReturnSaleItem,
    returnProductId,
    saleProducts,
  ]);

  const salePreviewTotal = useMemo(() => {
    let sum = 0;
    for (const line of saleCartLines) {
      const productId = line.productId.trim();
      if (!productId) {
        continue;
      }
      const product = saleProducts.find((item) => item.id === productId);
      if (!product) {
        continue;
      }
      const qty = parseQuantityInput(line.quantityStr);
      if (qty == null) {
        continue;
      }
      const unit = line.otherPrice ? parseMoneyInput(line.customPriceStr) ?? 0 : product.precoVenda;
      sum += qty * unit;
    }
    return sum;
  }, [saleCartLines, saleProducts]);

  const saleCartDuplicateProductLines = useMemo(
    () => saleCartHasDuplicateProductIds(saleCartLines),
    [saleCartLines],
  );

  const salePaymentSelectOptions = useMemo(() => {
    const keys = Object.keys(SALE_PAYMENT_METHOD_LABELS) as SalePaymentMethod[];
    return keys.filter((key) => key !== "nao_informado");
  }, []);

  function resetSaleFlow() {
    setSaleStep(1);
    setSaleFlowType("");
    setSaleSeller("operador-atual");
    setSaleCartLines([createEmptySaleCartLine()]);
    setReturnSource("existente");
    setReturnExistingSaleId("");
    setReturnSaleItemId("");
    setReturnExistingSalesSearch("");
    setReturnProductId("");
    setReturnOtherPrice(false);
    setReturnCustomPrice("");
    setReturnResolution("credito");
    setReturnQuantityStr("1");
    setReturnNotes("");
    setSalePaymentMethod("pix");
    setSaleUseCredit(false);
    setSaleCreditInput("");
    setSaleNotes("");
  }

  const canActOnChat = canAtendimentoActOnChat(profile?.role, activeChat?.assigneeId, profileId);
  const inboxAssigneeFilterOptions = useMemo(
    () =>
      isManagerInbox
        ? atendimentoUsers.map((user) => ({ id: user.id, name: user.nome }))
        : undefined,
    [isManagerInbox, atendimentoUsers],
  );
  const canModifyLinkedNegotiation = canAtendimentoModifyNegotiation(
    profile?.role,
    linkedNegotiation?.assigneeId,
    profileId,
  );
  const inboxLeadLocked = isInboxLeadLocked(
    profile?.role,
    activeChat?.assigneeId,
    linkedNegotiation?.assigneeId,
    profileId,
    { hasLinkedNegotiation: Boolean(linkedNegotiation) },
  );
  const canMarkSaleFromChat =
    Boolean(activeChat) &&
    Boolean(linkedNegotiation) &&
    !linkedNegotiationLoading &&
    hasSaleAttendant({
      chatAssigneeId: activeChat?.assigneeId,
      negotiationAssigneeId: linkedNegotiation?.assigneeId,
      profileId,
      role: profile?.role,
    });

  function handleOpenSaleFlow() {
    if (!activeChat) {
      return;
    }
    if (!canEditCrm) {
      toast({
        title: "Ação indisponível",
        description: "Seu papel nao tem permissao para registrar vendas ou devoluções.",
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
    if (!canModifyLinkedNegotiation) {
      toast({
        title: "Assuma o negócio",
        description: negotiationAssigneeBlockedMessage(),
        variant: "destructive",
      });
      return;
    }
    if (!activeChat.assigneeId?.trim()) {
      toast({
        title: "Sem atendente",
        description: "Atribua esta conversa a um atendente antes de registrar a venda.",
        variant: "destructive",
      });
      return;
    }
    if (activeChat.primaryNegotiationId && linkedNegotiationLoading) {
      toast({
        title: "Aguarde",
        description: "Carregando o negócio vinculado ao chat…",
      });
      return;
    }
    if (!linkedNegotiation) {
      toast({
        title: "Negócio não vinculado",
        description:
          "Use “Criar lead no CRM” ou “Vincular ao CRM” no cabeçalho da conversa antes de marcar a venda.",
        variant: "destructive",
      });
      return;
    }
    if (isNegotiationUnassigned(linkedNegotiation.assigneeId)) {
      toast({
        title: "Assuma o negócio",
        description: "O negócio precisa de um responsável no CRM antes da venda.",
        variant: "destructive",
      });
      return;
    }
    setMarkQuickSaleDialogOpen(true);
  }

  function resolveStepError() {
    if (saleStep === 1 && !saleFlowType) {
      return "Selecione se o registro sera venda ou devolucao.";
    }

    if (saleStep === 2 && saleFlowType === "venda") {
      if (!saleSeller) return "Selecione o usuario que realizou a venda.";
      const withProduct = saleCartLines.filter((line) => line.productId.trim());
      if (withProduct.length === 0) {
        return "Adicione pelo menos um produto a venda.";
      }
      for (const line of saleCartLines) {
        const pid = line.productId.trim();
        if (!pid) {
          if (line.otherPrice || line.customPriceStr.trim()) {
            return "Selecione o produto em cada linha com preco customizado.";
          }
          const qRaw = line.quantityStr.trim();
          if (qRaw !== "" && qRaw !== "1") {
            return "Selecione o produto quando alterar a quantidade.";
          }
          continue;
        }
        const qty = parseQuantityInput(line.quantityStr);
        if (qty == null) {
          return "Informe uma quantidade valida em cada produto.";
        }
        if (line.otherPrice) {
          if (!line.customPriceStr.trim()) {
            return "Informe o valor unitario quando marcar outro preco.";
          }
          if ((parseMoneyInput(line.customPriceStr) ?? 0) <= 0) {
            return "Informe um preco unitario valido.";
          }
        }
      }
      const totals = aggregateQtyByProduct(saleCartLines);
      for (const [productId, sumQty] of totals) {
        const product = saleProducts.find((p) => p.id === productId);
        if (!product) {
          return "Um dos produtos nao foi encontrado.";
        }
        if (product.qtdEstoque + 1e-9 < sumQty) {
          return `Estoque insuficiente para ${product.nome} (disponivel: ${product.qtdEstoque} ${product.unidade}).`;
        }
      }
    }

    if (saleStep === 2 && saleFlowType === "devolucao") {
      if (returnSource === "existente" && customerSales.length === 0) {
        return "Nao ha vendas registradas para este cliente no periodo carregado. Use a opcao \"Outra venda\".";
      }

      if (returnSource === "existente" && customerSales.length > 0 && existingSalesOptions.length === 0) {
        return "Nenhuma venda corresponde a busca. Limpe o filtro ou altere o texto.";
      }

      if (returnSource === "existente" && !returnExistingSaleId) {
        return "Selecione a venda existente para devolucao.";
      }

      if (returnSource === "existente" && returnExistingSaleId) {
        const sale = customerSales.find((s) => s.id === returnExistingSaleId);
        if (sale && sale.items.length === 0) {
          return "Esta venda nao possui itens para devolucao.";
        }
        if (sale && sale.items.length > 0) {
          const allReturned = sale.items.every((item) => {
            const already = returnedQtyBySaleItemId.get(item.id) ?? 0;
            return item.quantity - already <= 0;
          });
          if (allReturned) {
            return "Todos os itens desta venda ja foram totalmente devolvidos.";
          }
          if (!returnSaleItemId.trim() || !sale.items.some((item) => item.id === returnSaleItemId)) {
            return "Selecione qual item desta venda sera devolvido.";
          }
        }
      }

      if (returnSource === "outra" && !returnProductId) {
        return "Selecione o produto da outra venda.";
      }

      const returnQtyParsed = parseQuantityInput(returnQuantityStr);
      if (returnQtyParsed == null) {
        return "Informe uma quantidade valida para a devolucao.";
      }
      if (
        returnSource === "existente" &&
        selectedReturnSaleItem &&
        selectedReturnRemainingQty != null
      ) {
        if (selectedReturnRemainingQty <= 0) {
          return "Nada a devolver nesta linha (quantidade ja devolvida).";
        }
        if (returnQtyParsed > selectedReturnRemainingQty) {
          return `Quantidade acima do disponivel (${selectedReturnRemainingQty.toLocaleString("pt-BR", { maximumFractionDigits: 3 })}).`;
        }
      }
      if (returnOtherPrice && !returnCustomPrice.trim()) {
        return "Informe o valor praticado na venda devolvida.";
      }

      if (returnOtherPrice && (parseMoneyInput(returnCustomPrice) ?? 0) <= 0) {
        return "Informe um valor valido para a devolucao.";
      }
    }

    if (saleStep === 3 && saleFlowType === "venda") {
      if (!salePaymentMethod || salePaymentMethod === "nao_informado") {
        return "Selecione a forma de pagamento.";
      }
      if (salePreviewTotal <= 0) {
        return "Valor da venda invalido.";
      }
      const balance = customerCreditSummary?.totalCredit ?? 0;
      if (salePaymentMethod === "credito_loja") {
        if (!activeChat?.customerId) {
          return "Vincule um cliente ao chat para pagar com saldo de credito.";
        }
        if (balance + 1e-9 < salePreviewTotal) {
          return "Saldo de credito insuficiente para quitar a venda.";
        }
      }
      if (saleUseCredit && salePaymentMethod !== "credito_loja") {
        if (!activeChat?.customerId) {
          return "Cliente obrigatorio para abater saldo.";
        }
        const credit = parseMoneyInput(saleCreditInput) ?? 0;
        if (credit <= 0) {
          return "Informe o valor a abater do saldo do cliente.";
        }
        if (credit > salePreviewTotal + 1e-9) {
          return "Abatimento nao pode ser maior que o valor da venda.";
        }
        if (credit > balance + 1e-9) {
          return "Saldo de credito insuficiente para este abatimento.";
        }
      }
      if (saleNotes.length > 2000) {
        return "Observacoes da venda: maximo 2000 caracteres.";
      }
    }

    if (saleStep === 3 && saleFlowType === "devolucao" && !returnResolution) {
      return "Selecione se a devolucao sera troca ou credito.";
    }

    if (saleStep === 3 && saleFlowType === "devolucao" && returnNotes.length > 2000) {
      return "Observacoes da devolucao: maximo 2000 caracteres.";
    }

    return null;
  }

  function handleSaleStepNext() {
    const error = resolveStepError();
    if (error) {
      toast({
        title: "Preencha os campos obrigatorios",
        description: error,
        variant: "destructive",
      });
      useAppStore.getState().addNotification({
        tipo: "aviso",
        titulo: "Fluxo venda/devolucao incompleto",
        descricao: error,
      });
      return;
    }

    setSaleStep((current) => (current === 3 ? current : ((current + 1) as 1 | 2 | 3)));
  }

  function handleSaleStepBack() {
    setSaleStep((current) => (current === 1 ? current : ((current - 1) as 1 | 2 | 3)));
  }

  async function handleConfirmSaleFlow() {
    if (!canEditCrm) {
      toast({
        title: "Ação indisponível",
        description: "Seu papel nao tem permissao para registrar vendas ou devoluções.",
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
    if (!canModifyLinkedNegotiation) {
      toast({
        title: "Assuma o negócio",
        description: negotiationAssigneeBlockedMessage(),
        variant: "destructive",
      });
      return;
    }
    const error = resolveStepError();
    if (error) {
      toast({
        title: "Dados incompletos",
        description: error,
        variant: "destructive",
      });
      useAppStore.getState().addNotification({
        tipo: "aviso",
        titulo: "Dados incompletos no fluxo",
        descricao: error,
      });
      return;
    }

    if (!activeChat) {
      return;
    }

    if (saleFlowType !== "venda" && saleFlowType !== "devolucao") {
      return;
    }

    if (!isSupabaseConfigured) {
      toast({
        title: "Supabase nao configurado",
        description: "Configure o Supabase para salvar vendas e devolucoes reais.",
        variant: "destructive",
      });
      useAppStore.getState().addNotification({
        tipo: "erro",
        titulo: "Supabase nao configurado",
        descricao: "Configure o Supabase para salvar vendas e devolucoes reais.",
      });
      return;
    }

    try {
      const saleLineCount =
        saleFlowType === "venda" ? saleCartLines.filter((line) => line.productId.trim()).length : 0;

      const result = await registerSaleFlow.mutateAsync({
        chatId: activeChat.id,
        customerId: activeChat.customerId ?? null,
        flowType: saleFlowType,
        soldBy: saleFlowType === "venda" ? saleSeller : undefined,
        saleLines:
          saleFlowType === "venda"
            ? saleCartLines
                .filter((line) => line.productId.trim())
                .map((line) => ({
                  productId: line.productId.trim(),
                  quantity: parseQuantityInput(line.quantityStr) ?? 1,
                  otherPrice: line.otherPrice,
                  customUnitPrice:
                    line.otherPrice ? parseMoneyInput(line.customPriceStr) ?? undefined : undefined,
                }))
            : undefined,
        salePaymentMethod: saleFlowType === "venda" ? salePaymentMethod : undefined,
        saleCreditAmount:
          saleFlowType === "venda" && salePaymentMethod !== "credito_loja" && saleUseCredit
            ? parseMoneyInput(saleCreditInput) ?? undefined
            : undefined,
        saleNotes: saleFlowType === "venda" && saleNotes.trim() ? saleNotes.trim().slice(0, 2000) : undefined,
        returnSource: saleFlowType === "devolucao" ? returnSource : undefined,
        returnExistingSaleId:
          saleFlowType === "devolucao" && returnSource === "existente"
            ? returnExistingSaleId
            : undefined,
        returnSaleItemId:
          saleFlowType === "devolucao" && returnSource === "existente" && returnSaleItemId.trim()
            ? returnSaleItemId.trim()
            : undefined,
        returnProductId:
          saleFlowType === "devolucao" && returnSource === "outra"
            ? returnProductId
            : undefined,
        returnOtherPrice: saleFlowType === "devolucao" ? returnOtherPrice : undefined,
        returnCustomPrice:
          saleFlowType === "devolucao" && returnOtherPrice
            ? parseMoneyInput(returnCustomPrice) ?? undefined
            : undefined,
        returnQuantity:
          saleFlowType === "devolucao" ? parseQuantityInput(returnQuantityStr) ?? undefined : undefined,
        returnResolution: saleFlowType === "devolucao" ? returnResolution : undefined,
        returnNotes:
          saleFlowType === "devolucao" && returnNotes.trim()
            ? returnNotes.trim().slice(0, 2000)
            : undefined,
      });

      const summary =
        saleFlowType === "venda"
          ? result?.multiItem && saleLineCount > 1
            ? `Venda com ${saleLineCount} itens registrada para ${activeChat.displayName}.`
            : `Venda registrada para ${activeChat.displayName}.`
          : `Devolucao registrada para ${activeChat.displayName} (${returnResolution === "troca" ? "troca" : "credito futuro"}).`;

      toast({
        title: "Registro salvo",
        description: summary,
      });
      useAppStore.getState().addNotification({
        tipo: "sucesso",
        titulo: "Registro salvo",
        descricao: summary,
      });

      setSaleFlowOpen(false);
      resetSaleFlow();
    } catch (mutationError) {
      const errMsg =
        mutationError instanceof Error ? mutationError.message : "Nao foi possivel registrar o fluxo.";
      toast({
        title: "Falha ao salvar",
        description: errMsg,
        variant: "destructive",
      });
      useAppStore.getState().addNotification({
        tipo: "erro",
        titulo: "Falha ao salvar venda ou devolucao",
        descricao: errMsg,
      });
    }
  }

  function focusBodyComposer() {
    requestAnimationFrame(() => {
      bodyTextareaRef.current?.focus();
    });
  }

  function appendEmoji(emoji: string) {
    setBodyText((current) => `${current}${emoji}`);
    focusBodyComposer();
  }

  function detectMessageTypeFromFile(file: File): Exclude<MessageType, "system"> {
    if (file.type.startsWith("audio/")) {
      return "audio";
    }

    if (file.type.startsWith("image/") || file.type.startsWith("video/")) {
      return "media";
    }

    return "document";
  }

  function readFileAsDataUrl(file: File) {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => {
        if (typeof reader.result === "string") {
          resolve(reader.result);
          return;
        }

        reject(new Error("Nao foi possivel ler o arquivo selecionado."));
      };

      reader.onerror = () => {
        reject(reader.error ?? new Error("Falha ao ler o arquivo selecionado."));
      };

      reader.readAsDataURL(file);
    });
  }

  function resetComposerAttachmentState(options?: { keepBodyText?: boolean }) {
    if (!options?.keepBodyText) {
      setBodyText("");
    }
    setMessageType("text");
    setMediaUrl("");
    setPayloadText("{}");
    setSelectedAttachmentName(null);
    setAttachmentMimeType(null);
  }

  async function handleAttachmentSelection(event: ChangeEvent<HTMLInputElement>) {
    const original = event.target.files?.[0];
    event.target.value = "";

    if (!original) {
      return;
    }

    // Compressao client-side de imagens grandes antes do upload (sem perda
    // visivel; reduz banda do usuario e quota de storage). Pula PNGs/HEICs e
    // arquivos pequenos.
    let file = original;
    try {
      const compression = await maybeCompressImage(original);
      if (compression.compressed) {
        file = compression.file;
      }
    } catch {
      // Falha na compressao: usa o original.
    }

    if (file.size > WHATSAPP_MEDIA_MAX_BYTES) {
      const descricaoLimite = `O limite e ${WHATSAPP_MEDIA_MAX_BYTES / (1024 * 1024)} MB.`;
      toast({
        title: "Arquivo muito grande",
        description: descricaoLimite,
        variant: "destructive",
      });
      useAppStore.getState().addNotification({
        tipo: "aviso",
        titulo: "Arquivo muito grande",
        descricao: descricaoLimite,
      });
      return;
    }

    const nextMessageType = detectMessageTypeFromFile(file);
    setAttachmentUploading(true);
    setAttachmentProgress(0);

    // Cancela qualquer upload anterior em andamento (ex.: usuario trocou de chat
    // ou anexou outro arquivo durante o upload).
    attachmentAbortRef.current?.abort();
    const abort = new AbortController();
    attachmentAbortRef.current = abort;

    try {
      let mediaValue: string;

      if (isSupabaseConfigured) {
        try {
          mediaValue = await uploadWhatsappMediaFile(file, {
            signal: abort.signal,
            onProgress: ({ ratio }) => setAttachmentProgress(ratio),
          });
        } catch (uploadError) {
          if (
            uploadError instanceof DOMException &&
            uploadError.name === "AbortError"
          ) {
            // Cancelamento silencioso (esperado).
            return;
          }
          const msgUpload =
            uploadError instanceof Error
              ? uploadError.message
              : "Nao foi possivel enviar o arquivo ao Storage.";
          toast({
            title: "Falha no upload",
            description: msgUpload,
            variant: "destructive",
          });
          useAppStore.getState().addNotification({
            tipo: "erro",
            titulo: "Falha no upload (inbox)",
            descricao: msgUpload,
          });
          return;
        }
      } else {
        mediaValue = await readFileAsDataUrl(file);
      }

      setMessageType(nextMessageType);
      setMediaUrl(mediaValue);
      setSelectedAttachmentName(file.name);
      setAttachmentMimeType(file.type || null);
      setPayloadText(
        JSON.stringify(
          {
            fileName: file.name,
            mimeType: file.type,
            size: file.size,
          },
          null,
          2,
        ),
      );

      const anexoDesc = isSupabaseConfigured
        ? `${file.name} enviado ao Storage e pronto para envio.`
        : `${file.name} foi preparado para envio (data URL local).`;
      toast({
        title: "Arquivo anexado",
        description: anexoDesc,
      });
      useAppStore.getState().addNotification({
        tipo: "sucesso",
        titulo: "Arquivo anexado",
        descricao: anexoDesc,
      });

      focusBodyComposer();
    } catch (error) {
      const msgAnexo = error instanceof Error ? error.message : "Nao foi possivel preparar o arquivo.";
      toast({
        title: "Falha ao anexar",
        description: msgAnexo,
        variant: "destructive",
      });
      useAppStore.getState().addNotification({
        tipo: "erro",
        titulo: "Falha ao anexar arquivo",
        descricao: msgAnexo,
      });
    } finally {
      setAttachmentUploading(false);
      setAttachmentProgress(null);
      if (attachmentAbortRef.current === abort) {
        attachmentAbortRef.current = null;
      }
    }
  }

  function clearRecordingTimer() {
    if (recordingTimerRef.current != null) {
      window.clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
  }

  async function stopRecordingAndFinalize() {
    const rec = mediaRecorderRef.current;
    if (!rec || rec.state === "inactive") {
      clearRecordingTimer();
      setIsRecording(false);
      setRecordingDurationSec(0);
      return;
    }

    await new Promise<void>((resolve) => {
      rec.onstop = async () => {
        mediaRecorderRef.current = null;
        clearRecordingTimer();
        setIsRecording(false);
        setRecordingDurationSec(0);

        microphoneStreamRef.current?.getTracks().forEach((track) => track.stop());
        microphoneStreamRef.current = null;

        const mime = rec.mimeType || pickAudioRecorderMime() || "audio/webm";
        const blob = new Blob(audioChunksRef.current, { type: mime });
        audioChunksRef.current = [];

        if (blob.size < 256) {
          toast({
            title: "Audio muito curto",
            description: "Grave por pelo menos um instante antes de parar.",
            variant: "destructive",
          });
          useAppStore.getState().addNotification({
            tipo: "aviso",
            titulo: "Audio muito curto",
            descricao: "Grave por pelo menos um instante antes de parar.",
          });
          resolve();
          return;
        }

        const ext = extensionForRecordedMime(mime);
        const file = new File([blob], `gravacao-${Date.now()}.${ext}`, {
          type: mime || "application/octet-stream",
        });

        setAttachmentUploading(true);
        setAttachmentProgress(0);
        // Reaproveita o controle de abort do anexo: trocar de chat tambem
        // cancela um upload de audio em andamento.
        attachmentAbortRef.current?.abort();
        const abort = new AbortController();
        attachmentAbortRef.current = abort;
        try {
          let mediaValue: string;
          if (isSupabaseConfigured) {
            mediaValue = await uploadWhatsappMediaFile(file, {
              signal: abort.signal,
              onProgress: ({ ratio }) => setAttachmentProgress(ratio),
            });
          } else {
            mediaValue = await readFileAsDataUrl(file);
          }
          setMessageType("audio");
          setMediaUrl(mediaValue);
          setSelectedAttachmentName(file.name);
          setAttachmentMimeType(file.type || null);
          setPayloadText(
            JSON.stringify(
              {
                fileName: file.name,
                mimeType: file.type,
                size: file.size,
                recorded: true,
              },
              null,
              2,
            ),
          );
          focusBodyComposer();
        } catch (uploadError) {
          if (
            uploadError instanceof DOMException &&
            uploadError.name === "AbortError"
          ) {
            // Cancelamento esperado.
            resolve();
            return;
          }
          const msgGravacao =
            uploadError instanceof Error ? uploadError.message : "Nao foi possivel processar a gravacao.";
          toast({
            title: "Falha ao enviar audio",
            description: msgGravacao,
            variant: "destructive",
          });
          useAppStore.getState().addNotification({
            tipo: "erro",
            titulo: "Falha ao enviar audio",
            descricao: msgGravacao,
          });
        } finally {
          setAttachmentUploading(false);
          setAttachmentProgress(null);
          if (attachmentAbortRef.current === abort) {
            attachmentAbortRef.current = null;
          }
        }
        resolve();
      };
      rec.stop();
    });
  }

  async function handleMicrophoneClick() {
    if (isRecording) {
      await stopRecordingAndFinalize();
      return;
    }

    if (!("mediaDevices" in navigator) || typeof navigator.mediaDevices.getUserMedia !== "function") {
      toast({
        title: "Microfone indisponivel",
        description: "Seu navegador nao oferece captura de audio nesta pagina.",
        variant: "destructive",
      });
      useAppStore.getState().addNotification({
        tipo: "erro",
        titulo: "Microfone indisponivel",
        descricao: "Seu navegador nao oferece captura de audio nesta pagina.",
      });
      return;
    }

    if (typeof MediaRecorder === "undefined") {
      toast({
        title: "Gravacao nao suportada",
        description: "Use um navegador atualizado ou anexe um arquivo de audio.",
        variant: "destructive",
      });
      useAppStore.getState().addNotification({
        tipo: "erro",
        titulo: "Gravacao nao suportada",
        descricao: "Use um navegador atualizado ou anexe um arquivo de audio.",
      });
      return;
    }

    setMicrophoneState("requesting");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      microphoneStreamRef.current?.getTracks().forEach((track) => track.stop());
      microphoneStreamRef.current = stream;
      setMicrophoneState("granted");

      audioChunksRef.current = [];
      const mime = pickAudioRecorderMime();
      const recorder = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      recorder.start(250);
      setMessageType("audio");
      setIsRecording(true);
      setRecordingDurationSec(0);
      clearRecordingTimer();
      recordingTimerRef.current = window.setInterval(() => {
        setRecordingDurationSec((seconds) => seconds + 1);
      }, 1000);
    } catch (error) {
      setMicrophoneState("denied");
      microphoneStreamRef.current = null;
      const permMsg =
        error instanceof Error ? error.message : "Nao foi possivel acessar o microfone.";
      toast({
        title: "Permissao negada",
        description: permMsg,
        variant: "destructive",
      });
      useAppStore.getState().addNotification({
        tipo: "erro",
        titulo: "Permissao de microfone negada",
        descricao: permMsg,
      });
    }
  }

  function scrollMessagesToBottom(behavior: ScrollBehavior = "auto") {
    const el = messagesScrollAreaRef.current;
    if (!el) {
      return;
    }

    el.scrollTo({
      top: el.scrollHeight,
      behavior,
    });
  }

  function forceScrollToLatestMessage() {
    skipAutoScrollToBottomRef.current = false;
    lastScrollStateRef.current = { chatId: null, messageCount: 0 };
    threadAtBottomRef.current = true;
    setJumpToLatestVisible(false);

    requestAnimationFrame(() => {
      scrollMessagesToBottom("auto");
      requestAnimationFrame(() => {
        scrollMessagesToBottom("auto");
      });
    });
  }

  function handleSelectChat(chatId: string) {
    setActiveChatId(chatId);
    forceScrollToLatestMessage();

    if (quickFilter === "unread") {
      const chat = chats.find((c) => c.id === chatId);
      if (chat?.unreadCount) {
        lastMarkReadAttemptRef.current[chatId] = chat.unreadCount;
        void markChatAsRead.mutateAsync(chatId).catch(() => undefined);
      }
    }
  }
  selectChatRef.current = handleSelectChat;

  const handleLoadOlderMessages = useCallback(async () => {
    if (!hasNextPage || isFetchingNextPage) {
      return;
    }

    const el = messagesScrollAreaRef.current;
    if (el) {
      loadOlderScrollRef.current = { scrollHeight: el.scrollHeight, scrollTop: el.scrollTop };
    }

    skipAutoScrollToBottomRef.current = true;
    await fetchNextPage();

    requestAnimationFrame(() => {
      const snap = loadOlderScrollRef.current;
      const scrollEl = messagesScrollAreaRef.current;
      if (snap && scrollEl) {
        const delta = scrollEl.scrollHeight - snap.scrollHeight;
        scrollEl.scrollTop = snap.scrollTop + delta;
        loadOlderScrollRef.current = null;
      }
    });
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleThreadScrollStateChange = useCallback(
    ({ atBottom }: { atBottom: boolean; distanceFromBottom: number }) => {
      threadAtBottomRef.current = atBottom;
      if (atBottom) {
        setJumpToLatestVisible(false);
      }
    },
    [],
  );

  useEffect(() => {
    if (!activeChat?.id || messagesLoading) {
      return;
    }

    if (skipAutoScrollToBottomRef.current) {
      skipAutoScrollToBottomRef.current = false;
      lastScrollStateRef.current = {
        chatId: activeChat.id,
        messageCount: messages.length,
      };
      return;
    }

    const lastState = lastScrollStateRef.current;
    const chatChanged = lastState.chatId !== activeChat.id;
    const messageCountChanged = lastState.messageCount !== messages.length;

    if (!chatChanged && !messageCountChanged) {
      return;
    }

    const shouldAutoScroll = chatChanged || threadAtBottomRef.current;

    if (shouldAutoScroll) {
      requestAnimationFrame(() => {
        scrollMessagesToBottom(chatChanged ? "auto" : "smooth");
      });
      setJumpToLatestVisible(false);
    } else if (messageCountChanged && !skipAutoScrollToBottomRef.current) {
      setJumpToLatestVisible(true);
    }

    lastScrollStateRef.current = {
      chatId: activeChat.id,
      messageCount: messages.length,
    };
  }, [activeChat?.id, messages.length, messagesLoading]);

  const handleRetryMessage = useCallback(
    async (failed: WhatsappMessage) => {
      if (!activeChat) return;
      if (failed.direction !== "outbound" || failed.status !== "failed") return;
      if (sendMessage.isPending || retryingMessageId) return;

      setRetryingMessageId(failed.id);
      // Remove a bolha falhada antes de reenviar; o próprio envio cria uma nova
      // bolha otimista ("queued") que será reconciliada ou marcada falha de novo.
      const queryKey = ["inbox-messages", failed.chatId] as const;
      queryClient.setQueryData<InfiniteData<InboxMessagesPageResult>>(queryKey, (current) => {
        if (!current) return current;
        return {
          ...current,
          pages: current.pages.map((page) => ({
            ...page,
            messages: page.messages.filter((m) => m.id !== failed.id),
          })),
        };
      });
      try {
        await sendMessage.mutateAsync({
          instanceId: failed.instanceId,
          chatId: failed.chatId,
          remoteJid: activeChat.remoteJid,
          messageType: failed.messageType as Exclude<MessageType, "system">,
          bodyText: failed.bodyText ?? "",
          mediaUrl: failed.mediaUrl ?? undefined,
          payload: (failed.payloadJson ?? {}) as Record<string, unknown>,
          quotedMessageId: failed.quotedMessageId ?? undefined,
        });
      } catch (error) {
        console.error("Falha ao reenviar mensagem no inbox:", error);
      } finally {
        setRetryingMessageId(null);
      }
    },
    [activeChat, queryClient, retryingMessageId, sendMessage],
  );

  const handleDiscardMessage = useCallback(
    (failed: WhatsappMessage) => {
      if (!activeChat) return;
      if (failed.direction !== "outbound" || failed.status !== "failed") return;

      const queryKey = ["inbox-messages", failed.chatId] as const;
      queryClient.setQueryData<InfiniteData<InboxMessagesPageResult>>(queryKey, (current) => {
        if (!current) return current;
        return {
          ...current,
          pages: current.pages.map((page) => ({
            ...page,
            messages: page.messages.filter((m) => m.id !== failed.id),
          })),
        };
      });
    },
    [activeChat, queryClient],
  );

  async function handleClaimChatAndNegotiation() {
    if (!activeChat || !linkedNegotiation) {
      return;
    }
    try {
      await claimChatMutation.mutateAsync(activeChat.id);
      if (isNegotiationUnassigned(linkedNegotiation.assigneeId)) {
        await claimCrmNegotiation.mutateAsync(linkedNegotiation.id);
      }
      toast({
        title: "Conversa e negócio assumidos",
        description: `Você é o responsável por "${linkedNegotiation.title}".`,
      });
    } catch (error) {
      toast({
        title: "Não foi possível assumir",
        description: error instanceof Error ? error.message : "Tente novamente.",
        variant: "destructive",
      });
    }
  }

  async function handleSendMessage() {
    if (!activeChat) {
      return;
    }

    if (inboxLeadLocked) {
      toast({
        title: linkedNegotiation ? "Assuma o negócio" : "Assuma a conversa",
        description: linkedNegotiation
          ? negotiationAssigneeBlockedMessage()
          : chatAssigneeBlockedMessage(),
        variant: "destructive",
      });
      return;
    }
    if (!canEditInbox) {
      toast({
        title: "Ação indisponível",
        description: "Seu papel nao tem permissao para enviar mensagens.",
        variant: "destructive",
      });
      return;
    }

    if (noteMode) {
      const body = bodyText.trim();
      if (!body) return;
      try {
        await createChatNote.mutateAsync({ chatId: activeChat.id, bodyText: body });
        setBodyText("");
        clearInboxChatDraft(activeChat.id);
      } catch (error) {
        const msg = error instanceof Error ? error.message : "Tente novamente.";
        toast({ title: "Falha ao salvar nota", description: msg, variant: "destructive" });
        useAppStore.getState().addNotification({
          tipo: "erro",
          titulo: "Falha ao salvar nota",
          descricao: msg,
        });
      }
      return;
    }

    const hasBody = Boolean(bodyText.trim());
    const hasMedia = Boolean(mediaUrl.trim());

    if (messageType === "text" && !hasBody) {
      return;
    }

    if (messageType !== "text" && !hasBody && !hasMedia) {
      return;
    }

    let payload: Record<string, unknown> = {};

    if (payloadText.trim()) {
      try {
        payload = JSON.parse(payloadText);
      } catch {
        toast({
          title: "Payload invalido",
          description: "Revise o JSON complementar antes de enviar.",
          variant: "destructive",
        });
        useAppStore.getState().addNotification({
          tipo: "erro",
          titulo: "Payload invalido",
          descricao: "Revise o JSON complementar antes de enviar.",
        });
        return;
      }
    }

    const sendVars = {
      instanceId: activeChat.instanceId,
      chatId: activeChat.id,
      remoteJid: activeChat.remoteJid,
      messageType,
      bodyText,
      mediaUrl: mediaUrl || undefined,
      payload,
      simulateTypingMs: simulateTyping ? 600 : undefined,
    };

    const sendFingerprint = JSON.stringify({
      chatId: sendVars.chatId,
      messageType: sendVars.messageType,
      bodyText: sendVars.bodyText.trim(),
      mediaUrl: sendVars.mediaUrl ?? "",
      payload,
    });
    const now = Date.now();
    for (const [key, timestamp] of recentSendFingerprintsRef.current) {
      if (now - timestamp > 5_000) {
        recentSendFingerprintsRef.current.delete(key);
      }
    }
    if (recentSendFingerprintsRef.current.has(sendFingerprint)) {
      return;
    }
    recentSendFingerprintsRef.current.set(sendFingerprint, now);

    resetComposerAttachmentState();
    clearInboxChatDraft(activeChat.id);

    // Envio em background; botao permanece habilitado para varias mensagens em sequencia.
    sendMessage.mutate(sendVars, {
      onError: (error) => {
        recentSendFingerprintsRef.current.delete(sendFingerprint);
        const envioErroMsg = error instanceof Error ? error.message : "Tente novamente.";
        const toastKey = `${sendVars.chatId}\0${envioErroMsg}`;
        const nowToast = Date.now();
        const lastToast = lastSendErrorToastRef.current;
        const shouldToast = !lastToast || lastToast.key !== toastKey || nowToast - lastToast.at > 10_000;
        if (shouldToast) {
          lastSendErrorToastRef.current = { key: toastKey, at: nowToast };
          toast({
            title: "Falha ao enviar",
            description: envioErroMsg,
            variant: "destructive",
          });
          useAppStore.getState().addNotification({
            tipo: "erro",
            titulo: "Falha ao enviar mensagem",
            descricao: envioErroMsg,
          });
        } else {
          console.error("Falha repetida ao enviar mensagem no inbox:", envioErroMsg);
        }
      },
    });
  }

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-background">
      <div className="grid min-h-0 flex-1 grid-rows-[1fr] gap-0 lg:grid-cols-[minmax(260px,min(100%,336px))_1fr]">
        <ConversationList
          search={search}
          onSearchChange={setSearch}
          instanceId={instanceId}
          onInstanceChange={setInstanceId}
          listScope={listScope}
          onListScopeChange={setListScope}
          assigneeFilter={assigneeFilter}
          onAssigneeFilterChange={(value) => {
            setAssigneeFilter(value);
            if (value !== "all") {
              setQuickFilter(null);
            }
          }}
          snoozedFilter={snoozedFilter}
          onSnoozedFilterChange={(value) => {
            setSnoozedFilter(value);
            if (value !== "active") {
              setQuickFilter(null);
            }
          }}
          quickFilter={quickFilter}
          onQuickFilterChange={(value) => {
            setQuickFilter(value);
            if (value === "hidden") {
              setSnoozedFilter("active");
              setAssigneeFilter("all");
            } else if (value === "mine") {
              setAssigneeFilter("mine");
              setSnoozedFilter("active");
            } else if (value === "unassigned") {
              setAssigneeFilter("unassigned");
              setSnoozedFilter("active");
            } else if (value === "unread") {
              setAssigneeFilter("all");
              setSnoozedFilter("active");
            } else {
              setAssigneeFilter("all");
              setSnoozedFilter("active");
            }
          }}
          selectedTagIds={selectedTagIds}
          onTagToggle={(tagId) =>
            setSelectedTagIds((prev) =>
              prev.includes(tagId) ? prev.filter((t) => t !== tagId) : [...prev, tagId],
            )
          }
          onClearTags={() => setSelectedTagIds([])}
          availableTags={availableTags}
          tagsLoading={tagsLoading}
          instances={instances}
          chatsLoading={chatsLoading}
          chats={chats}
          activeChatId={activeChat?.id ?? null}
          onSelectChat={stableSelectChat}
          onPrefetchChat={stablePrefetchChat}
          viewerRole={profile?.role}
          searchInputRef={searchInputRef}
          assigneeFilterOptions={inboxAssigneeFilterOptions}
          managerUnassignedCount={isManagerInbox ? managerUnassignedCount : undefined}
          onOpenUnassignedQueue={() => {
            setQuickFilter("unassigned");
            setAssigneeFilter("unassigned");
            setSnoozedFilter("active");
          }}
        />

        <section className="relative flex min-h-0 flex-col overflow-hidden border-l border-border bg-background">
          {activeChat && mustAssumeChatToView ? (
            <div
              className="flex min-h-0 flex-1 flex-col items-center justify-center bg-background p-6"
              data-testid="inbox-claim-required"
            >
              <div className="w-full max-w-md rounded-2xl border border-border bg-card px-8 py-10 text-center shadow-lg">
                <div
                  className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary"
                  aria-hidden
                >
                  <Hand className="h-7 w-7" />
                </div>
                <h2 className="mt-5 text-lg font-semibold text-foreground">
                  {assumeConversationToViewMessage()}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  Esta conversa ainda não tem atendente responsável. Assuma o atendimento para ver o histórico,
                  responder e usar as ferramentas do chat.
                </p>
                <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
                  {offerClaimBoth && linkedNegotiation ? (
                    <Button
                      type="button"
                      className="rounded-full"
                      disabled={
                        claimChatMutation.isPending ||
                        claimCrmNegotiation.isPending ||
                        releaseCrmNegotiation.isPending ||
                        !canEditInbox ||
                        !canEditCrm
                      }
                      onClick={() => void handleClaimChatAndNegotiation()}
                      data-testid="inbox-claim-both"
                    >
                      <Hand className="mr-2 h-4 w-4" />
                      Assumir conversa e negócio
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      className="rounded-full"
                      disabled={
                        claimChatMutation.isPending ||
                        claimCrmNegotiation.isPending ||
                        releaseCrmNegotiation.isPending ||
                        !canEditInbox
                      }
                      onClick={() => {
                        void (async () => {
                          try {
                            await claimChatMutation.mutateAsync(activeChat.id);
                            toast({
                              title: "Conversa assumida",
                              description: "Você já pode ver e responder esta conversa.",
                            });
                          } catch (error) {
                            toast({
                              title: "Não foi possível assumir",
                              description: error instanceof Error ? error.message : "Tente novamente.",
                              variant: "destructive",
                            });
                          }
                        })();
                      }}
                    >
                      <Hand className="mr-2 h-4 w-4" />
                      Assumir conversa
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <>
          <div className="relative z-10 flex min-h-[59px] shrink-0 items-center justify-between border-b border-border bg-wchat-50 px-4 py-2 md:px-5">
            {activeChat ? (
              <>
                <div className="flex min-w-0 items-center gap-3">
                  <ConversationAvatar name={activeChat.displayName} avatarUrl={activeChat.avatarUrl} />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="min-w-0 truncate text-[17px] font-medium text-foreground">{activeChat.displayName}</p>
                      {activeChat.customerId && !linkedNegotiation && !linkedNegotiationLoading ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="h-7 shrink-0 rounded-full text-xs"
                          disabled={!canEditCrm}
                          onClick={() => setCreateLeadOpen(true)}
                        >
                          <Briefcase className="mr-1.5 h-3.5 w-3.5" />
                          Criar lead no CRM
                        </Button>
                      ) : null}
                    </div>
                    <ChatCrmHeader chat={activeChat} />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {offerClaimBoth && linkedNegotiation ? (
                    <IconTip label="Assumir ambos">
                    <button
                      type="button"
                      onClick={() => void handleClaimChatAndNegotiation()}
                      disabled={
                        claimChatMutation.isPending ||
                        claimCrmNegotiation.isPending ||
                        releaseCrmNegotiation.isPending ||
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
                  {!activeChat.assigneeId && !offerClaimBoth ? (
                    <IconTip label="Assumir">
                    <button
                      type="button"
                      onClick={() => void claimChatMutation.mutateAsync(activeChat.id)}
                      disabled={
                        claimChatMutation.isPending ||
                        !canEditInbox ||
                        claimCrmNegotiation.isPending ||
                        releaseCrmNegotiation.isPending
                      }
                      className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground transition-colors hover:bg-primary/90"
                      aria-label="Assumir conversa"
                    >
                      <Hand className="h-4 w-4" />
                    </button>
                    </IconTip>
                  ) : null}
                  {showClaimNegotiation && linkedNegotiation && !offerClaimBoth ? (
                    <IconTip label="Assumir negócio">
                    <button
                      type="button"
                      onClick={() => {
                        void (async () => {
                          try {
                            await claimCrmNegotiation.mutateAsync(linkedNegotiation.id);
                            toast({
                              title: "Negócio assumido",
                              description: `Você é o responsável por "${linkedNegotiation.title}".`,
                            });
                          } catch (error) {
                            toast({
                              title: "Não foi possível assumir o negócio",
                              description: error instanceof Error ? error.message : "Tente novamente.",
                              variant: "destructive",
                            });
                          }
                        })();
                      }}
                      disabled={
                        claimCrmNegotiation.isPending ||
                        claimChatMutation.isPending ||
                        releaseCrmNegotiation.isPending ||
                        !canEditCrm
                      }
                      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--crm-brand-border)] bg-[var(--crm-brand-tint)] text-[var(--crm-brand)] transition-colors hover:bg-[var(--crm-brand-tint-hover)]"
                      aria-label="Assumir negócio"
                    >
                      <Briefcase className="h-4 w-4" />
                    </button>
                    </IconTip>
                  ) : null}
                  {showReleaseNegotiation && linkedNegotiation ? (
                    <IconTip label="Devolver negócio">
                    <button
                      type="button"
                      onClick={() => {
                        void (async () => {
                          try {
                            await releaseCrmNegotiation.mutateAsync(linkedNegotiation.id);
                            toast({
                              title: "Devolvido ao pool",
                              description: `"${linkedNegotiation.title}" está sem responsável.`,
                            });
                          } catch (error) {
                            toast({
                              title: "Não foi possível devolver o negócio",
                              description: error instanceof Error ? error.message : "Tente novamente.",
                              variant: "destructive",
                            });
                          }
                        })();
                      }}
                      disabled={
                        releaseCrmNegotiation.isPending ||
                        claimCrmNegotiation.isPending ||
                        claimChatMutation.isPending ||
                        !canEditCrm
                      }
                      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--crm-brand-border)] bg-[var(--crm-brand-tint)] text-[var(--crm-brand)] transition-colors hover:bg-[var(--crm-brand-tint-hover)]"
                      aria-label="Devolver negócio"
                    >
                      <Users className="h-4 w-4" />
                    </button>
                    </IconTip>
                  ) : null}
                  {activeChannelAiEnabled && (() => {
                    const aiPaused = activeChat.aiMode === "off" || activeChat.aiMode === "handoff";
                    return (
                      <IconTip label={aiPaused ? "Retomar IA" : "Pausar IA"}>
                        <button
                          type="button"
                          onClick={() => {
                            if (!canEditInbox) {
                              toast({
                                title: "Ação indisponível",
                                description: "Seu papel nao tem permissao para esta ação.",
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
                            setAiModeMutation.mutate(
                              { chatId: activeChat.id, aiMode: aiPaused ? "full" : "off" },
                              {
                                onSuccess: () =>
                                  toast({
                                    title: aiPaused
                                      ? "IA reativada nesta conversa"
                                      : "IA pausada nesta conversa",
                                  }),
                              },
                            );
                          }}
                          disabled={setAiModeMutation.isPending || !canActOnChat || !canEditInbox}
                          className={cn(
                            "inline-flex h-10 w-10 items-center justify-center rounded-full transition-colors disabled:opacity-45",
                            aiPaused
                              ? "text-muted-foreground hover:bg-wchat-100 hover:text-foreground"
                              : "bg-primary text-primary-foreground hover:bg-primary/90",
                          )}
                          aria-label={aiPaused ? "Retomar IA" : "Pausar IA"}
                        >
                          <Hand className="h-4 w-4" />
                        </button>
                      </IconTip>
                    );
                  })()}
                  {isChatSnoozed(activeChat) ? (
                    <IconTip label="Remover adiamento">
                    <button
                      type="button"
                      onClick={() => {
                        if (!canEditInbox) {
                          toast({
                            title: "Ação indisponível",
                            description: "Seu papel nao tem permissao para adiar conversa.",
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
                        void clearSnoozeMutation.mutateAsync(activeChat.id);
                      }}
                      disabled={clearSnoozeMutation.isPending || !canActOnChat || !canEditInbox}
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
                      onClick={() => {
                        if (!canEditInbox) {
                          toast({
                            title: "Ação indisponível",
                            description: "Seu papel nao tem permissao para adiar conversa.",
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
                        setSnoozeDialogOpen(true);
                      }}
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
                    onClick={() => {
                      if (!canEditInbox) {
                        toast({
                          title: "Ação indisponível",
                          description: "Seu papel nao tem permissao para atribuir conversa.",
                          variant: "destructive",
                        });
                        return;
                      }
                      if (
                        profile?.role === "atendimento" &&
                        activeChat.assigneeId &&
                        activeChat.assigneeId !== profileId
                      ) {
                        toast({
                          title: "Conversa de outro atendente",
                          description: chatAssignedToOtherAttendantMessage(),
                          variant: "destructive",
                        });
                        return;
                      }
                      if (!isManagerInbox && !canActOnChat) {
                        toast({
                          title: "Assuma a conversa",
                          description: chatAssigneeBlockedMessage(),
                          variant: "destructive",
                        });
                        return;
                      }
                      setAssignDialogChatId(activeChat.id);
                      setAssignDialogSelectedUser(activeChat.assigneeId ?? "");
                      setAssignDialogOpen(true);
                    }}
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
                      notificationSettings.enabled &&
                        notificationSettings.permission !== "denied"
                        ? "bg-wchat-100 text-primary hover:bg-wchat-200"
                        : "text-muted-foreground hover:bg-wchat-100 hover:text-foreground",
                    )}
                    aria-label="Notificações"
                  >
                    {notificationSettings.enabled &&
                    notificationSettings.permission !== "denied" ? (
                      <Bell className="h-4 w-4" />
                    ) : (
                      <BellOff className="h-4 w-4" />
                    )}
                  </button>
                  </IconTip>
                  <IconTip label="Venda">
                  <button
                    type="button"
                    onClick={handleOpenSaleFlow}
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
                        phone={activeChat.remotePhoneE164 || activeChat.remotePhoneDigits || null}
                        customerId={activeChat.customerId}
                        chatId={activeChat.id}
                        negotiationId={linkedNegotiation?.id ?? activeChat.primaryNegotiationId ?? null}
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10 rounded-full text-muted-foreground hover:bg-wchat-100 hover:text-foreground"
                      />
                    </span>
                  </IconTip>
                  <IconTip label="Perfil do cliente">
                  <button
                    type="button"
                    onClick={() => setProfileOpen(true)}
                    className="flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-wchat-100 hover:text-foreground"
                    aria-label="Perfil do cliente"
                  >
                    <UserRound className="h-4 w-4" />
                  </button>
                  </IconTip>
                </div>
              </>
            ) : (
              <div className="px-1">
                <p className="text-xl font-semibold tracking-[-0.04em] text-foreground md:text-2xl">
                  wChat
                </p>
                <p className="mt-1 max-w-md text-sm font-medium text-muted-foreground">
                  Selecione uma conversa para exibir as mensagens ou comece uma nova pela lista ao lado.
                </p>
              </div>
            )}
          </div>

          <div className="relative z-10 min-h-0 flex-1 overflow-hidden bg-background">
            {!activeChat ? (
              <div className="flex h-full flex-col items-center justify-center gap-6 p-8">
                <div
                  className="flex h-24 w-24 items-center justify-center rounded-full bg-primary/15"
                  aria-hidden
                >
                  <svg viewBox="0 0 24 24" className="h-12 w-12 text-muted-foreground" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.718 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                </div>
                <div className="max-w-md text-center">
                  {blockedRequestedChatId ? (
                    <p
                      data-testid="inbox-chat-blocked"
                      className="mb-4 rounded-xl border border-[var(--crm-amber-border)] bg-[var(--crm-amber-tint)] px-4 py-3 text-sm text-[var(--crm-amber-ink)]"
                      role="status"
                    >
                      {chatAssignedToOtherAttendantMessage()}
                    </p>
                  ) : null}
                  <p className="text-2xl font-light text-wchat-900">converse. entenda. resolva.</p>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    {blockedRequestedChatId
                      ? "Esta conversa não está disponível para o seu usuário. Escolha outra na lista ao lado."
                      : "Selecione uma conversa na lista ao lado para visualizar o historico e responder seus clientes."}
                  </p>
                </div>
              </div>
            ) : messagesLoading ? (
              <div className="flex h-full items-center justify-center text-sm font-medium text-muted-foreground">
                Carregando mensagens...
              </div>
            ) : messageGroups.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm font-medium text-muted-foreground">
                Essa conversa ainda nao possui mensagens sincronizadas.
              </div>
            ) : (
              <MessageThread
                scrollRef={messagesScrollAreaRef}
                messageGroups={messageGroups}
                activeChatName={activeChat.displayName}
                activeChatAvatarUrl={activeChat.avatarUrl}
                hasMoreOlder={hasNextPage}
                isLoadingOlder={isFetchingNextPage}
                onLoadOlder={handleLoadOlderMessages}
                onRetryMessage={handleRetryMessage}
                onDiscardMessage={handleDiscardMessage}
                retryingMessageId={retryingMessageId}
                jumpToLatestVisible={jumpToLatestVisible}
                onJumpToLatest={forceScrollToLatestMessage}
                onScrollStateChange={handleThreadScrollStateChange}
              />
            )}
          </div>

          <MessageInput
            bodyTextareaRef={bodyTextareaRef}
            mediaUrlInputRef={mediaUrlInputRef}
            attachmentInputRef={attachmentInputRef}
            messageType={messageType}
            onMessageTypeChange={setMessageType}
            simulateTyping={simulateTyping}
            onSimulateTypingChange={setSimulateTyping}
            onSync={() =>
              syncInbox.mutate({
                chatId: activeChat?.id,
                instanceId: activeChat?.instanceId,
              })
            }
            syncPending={syncInbox.isPending}
            syncDisabled={syncInbox.isPending || !activeChat || !canEditInbox}
            mediaUrl={mediaUrl}
            onMediaUrlChange={setMediaUrl}
            payloadText={payloadText}
            onPayloadTextChange={setPayloadText}
            selectedAttachmentName={selectedAttachmentName}
            attachmentMimeType={attachmentMimeType}
            bodyText={bodyText}
            onBodyTextChange={(value) => {
              if (value === "/" && bodyText === "") {
                setQuickReplyOpen(true);
                return;
              }
              setBodyText(value);
            }}
            onSend={handleSendMessage}
            sendDisabled={
              attachmentUploading ||
              !activeChat ||
              !canEditInbox ||
              inboxLeadLocked ||
              (noteMode
                ? !bodyText.trim() || createChatNote.isPending
                : messageType === "text"
                ? !bodyText.trim()
                : !bodyText.trim() && !mediaUrl.trim())
            }
            composerActionsDisabled={inboxLeadLocked || !canEditInbox}
            noteMode={noteMode}
            onNoteModeChange={(value) => {
              setNoteMode(value);
              setTimeout(() => bodyTextareaRef.current?.focus(), 50);
            }}
            showEmojiPicker={showEmojiPicker}
            onToggleEmojiPicker={() => setShowEmojiPicker((current) => !current)}
            onAppendEmoji={appendEmoji}
            onAttachmentButtonClick={() => attachmentInputRef.current?.click()}
            onAttachmentChange={handleAttachmentSelection}
            attachmentUploading={attachmentUploading}
            attachmentProgress={attachmentProgress}
            microphoneState={microphoneState}
            isRecording={isRecording}
            recordingDurationSec={recordingDurationSec}
            onMicrophoneClick={handleMicrophoneClick}
            quickReplies={quickReplies}
            quickReplyOpen={quickReplyOpen}
            onQuickReplyOpenChange={setQuickReplyOpen}
            onQuickReplyShortcutOpen={() => setQuickReplyOpen(true)}
            onSelectQuickReply={(reply) => {
              setBodyText(reply.bodyText);
              setMessageType("text");
              setQuickReplyOpen(false);
              setTimeout(() => bodyTextareaRef.current?.focus(), 50);
            }}
            onClearAttachment={() => resetComposerAttachmentState({ keepBodyText: true })}
          />
            </>
          )}
        </section>
      </div>
      <CustomerProfileSheet
        open={profileOpen && !mustAssumeChatToView}
        onOpenChange={setProfileOpen}
        chat={activeChat}
        messages={messages}
        crmActionsLocked={inboxLeadLocked || !canEditInbox || !canEditCrm}
        channelAiEnabled={activeChannelAiEnabled}
        onChatDeleted={() => {
          setActiveChatId(null);
          setProfileOpen(false);
        }}
      />

      {/* Diálogo de atribuição/transferência de conversa */}
      {activeChat ? (
        <>
          <SnoozeChatDialog
            open={snoozeDialogOpen}
            onOpenChange={setSnoozeDialogOpen}
            pending={snoozeChatMutation.isPending}
            onConfirm={(until) =>
              snoozeChatMutation.mutateAsync({ chatId: activeChat.id, until })
            }
          />
          <CreateLeadDialog
            chat={activeChat}
            open={createLeadOpen}
            onOpenChange={setCreateLeadOpen}
            canEditCrm={canEditCrm}
            canActOnChat={canActOnChat}
          />
        </>
      ) : null}

      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent className="max-w-sm rounded-2xl border-border bg-wchat-50 p-0">
          <DialogHeader className="border-b border-border pb-4 pl-6 pt-5">
            <DialogTitle className="text-[17px] font-medium text-foreground">
              {assignDialogChat?.assigneeId ? "Transferir conversa" : "Atribuir conversa"}
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              {assignDialogChat?.assigneeName
                ? `Responsável atual: ${assignDialogChat.assigneeName}. Escolha outro atendente para transferir.`
                : "Escolha o atendente responsável por esta conversa."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 px-6 py-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Novo responsável</Label>
              <Select
                value={assignDialogSelectedUser || INBOX_ASSIGN_NONE}
                onValueChange={(value) =>
                  setAssignDialogSelectedUser(value === INBOX_ASSIGN_NONE ? "" : value)
                }
              >
                <SelectTrigger className="border border-input bg-card text-foreground focus:ring-primary">
                  <SelectValue placeholder="Selecionar atendente..." />
                </SelectTrigger>
                <SelectContent className="border-border bg-card text-foreground">
                  {canManageChatPool ? (
                    <SelectItem value={INBOX_ASSIGN_NONE}>Sem responsável (pool)</SelectItem>
                  ) : null}
                  {atendimentoUsers.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.nome}
                      {user.id === profileId ? " (você)" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="border-t border-border px-6 py-4">
            <div className="flex w-full items-center gap-2">
              {canManageChatPool ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-lg border-border bg-transparent text-muted-foreground hover:bg-wchat-100"
                  disabled={autoAssignChatMutation.isPending}
                  onClick={async () => {
                    if (!assignDialogChatId) return;
                    try {
                      const nextId = await autoAssignChatMutation.mutateAsync(assignDialogChatId);
                      if (!nextId) {
                        toast({ title: "Nenhum atendente disponível", variant: "destructive" });
                      } else {
                        const name =
                          atendimentoUsers.find((u) => u.id === nextId)?.nome ?? "atendente";
                        toast({ title: "Conversa distribuída", description: `Atribuída a ${name}.` });
                      }
                      setAssignDialogOpen(false);
                    } catch (err) {
                      toast({
                        title: "Erro ao distribuir",
                        description: err instanceof Error ? err.message : "Tente novamente.",
                        variant: "destructive",
                      });
                    }
                  }}
                >
                  Distribuir fila
                </Button>
              ) : null}
              <div className="flex-1" />
              <Button
                size="sm"
                className="rounded-lg bg-primary text-primary-foreground hover:bg-wchat-700"
                disabled={assignChatMutation.isPending || unassignChatMutation.isPending}
                onClick={async () => {
                  if (!assignDialogChatId) return;
                  const previousAssigneeId = assignDialogChat?.assigneeId ?? null;
                  const nextAssigneeId = assignDialogSelectedUser.trim() || null;

                  if (nextAssigneeId && nextAssigneeId === previousAssigneeId) {
                    toast({
                      title: "Nenhuma alteração",
                      description: "Selecione outro atendente para transferir.",
                    });
                    return;
                  }

                  if (!nextAssigneeId && !canManageChatPool) {
                    toast({
                      title: "Ação não permitida",
                      description: managerOnlyReleaseToPoolMessage(),
                      variant: "destructive",
                    });
                    return;
                  }

                  try {
                    if (nextAssigneeId) {
                      await assignChatMutation.mutateAsync({
                        chatId: assignDialogChatId,
                        assigneeId: nextAssigneeId,
                        reason: previousAssigneeId ? "transfer" : "assign",
                      });
                      const name =
                        atendimentoUsers.find((u) => u.id === nextAssigneeId)?.nome ?? "atendente";
                      toast({
                        title: previousAssigneeId ? "Conversa transferida" : "Conversa atribuída",
                        description: name,
                      });
                    } else {
                      await unassignChatMutation.mutateAsync({
                        chatId: assignDialogChatId,
                        reason: "release_to_pool",
                      });
                      toast({ title: "Conversa devolvida ao pool" });
                    }
                    setAssignDialogOpen(false);
                  } catch (err) {
                    toast({
                      title: previousAssigneeId ? "Erro ao transferir" : "Erro ao atribuir",
                      description: err instanceof Error ? err.message : "Tente novamente.",
                      variant: "destructive",
                    });
                  }
                }}
              >
                {assignDialogChat?.assigneeId ? "Transferir" : "Atribuir"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <MarkWinDialog
        open={Boolean(activeChat) && markQuickSaleDialogOpen}
        onOpenChange={(open) => {
          setMarkQuickSaleDialogOpen(open);
        }}
        initialValue={linkedNegotiation?.totalValue ?? 0}
        initialLines={markWinInitialLines}
        pending={
          updateCrmNegotiationMutation.isPending ||
          setChatResolutionMutation.isPending ||
          (Boolean(activeChat?.primaryNegotiationId) &&
            linkedNegotiationLoading &&
            markQuickSaleDialogOpen)
        }
        onConfirm={async ({ lines, totalValue, paymentMethod }) => {
          const lineError = validateMarkWinLines(lines);
          if (lineError) {
            toast({ title: "Venda incompleta", description: lineError, variant: "destructive" });
            return;
          }
          if (!activeChat) return;
          if (
            !hasSaleAttendant({
              chatAssigneeId: activeChat.assigneeId,
              negotiationAssigneeId: linkedNegotiation?.assigneeId,
              profileId,
              role: profile?.role,
            })
          ) {
            toast({
              title: "Assuma o negócio",
              description: !canActOnChat
                ? chatAssigneeBlockedMessage()
                : negotiationAssigneeBlockedMessage(),
              variant: "destructive",
            });
            return;
          }
          if (!isSupabaseConfigured) {
            toast({
              title: "Supabase não configurado",
              description: "Configure o Supabase para marcar vendas no CRM.",
              variant: "destructive",
            });
            return;
          }
          if (activeChat.primaryNegotiationId && linkedNegotiationLoading) {
            toast({
              title: "Aguarde",
              description: "Carregando o negócio vinculado ao chat…",
            });
            return;
          }
          if (!linkedNegotiation) {
            toast({
              title: "Negócio não vinculado",
              description:
                "Use “Criar lead no CRM” ou “Vincular ao CRM” no cabeçalho da conversa antes de marcar a venda.",
              variant: "destructive",
            });
            return;
          }
          if (linkedNegotiation.status === "vendido") {
            toast({
              title: "Já marcado como venda",
              description: "Este negócio já está como vendido no CRM.",
            });
            return;
          }
          if (linkedNegotiation.status === "perdido") {
            toast({
              title: "Não foi possível",
              description:
                "Negócios marcados como perdidos não podem ser convertidos em venda por aqui.",
              variant: "destructive",
            });
            return;
          }

          const saleStageId = resolveConfiguredSaleStageId(
            effectiveCrmFunnels,
            linkedNegotiation.funnelId,
          );

          try {
            await updateCrmNegotiationMutation.mutateAsync({
              id: linkedNegotiation.id,
              patch: {
                status: "vendido",
                stageId: saleStageId,
                totalValue,
              },
            });
            const soldBy =
              activeChat.assigneeId?.trim() ||
              linkedNegotiation.assigneeId?.trim() ||
              profile?.id?.trim();
            if (soldBy) {
              await persistMarkWinSale({
                chatId: activeChat.id,
                customerId: activeChat.customerId ?? linkedNegotiation.customerId ?? null,
                soldBy,
                lines,
                paymentMethod,
              });
              invalidateSalesQueries(
                queryClient,
                activeChat.customerId ?? linkedNegotiation.customerId,
              );
            }
            await setChatResolutionMutation.mutateAsync({
              chatId: activeChat.id,
              resolution: "resolved",
            });
            const itemsLabel =
              lines.length === 1
                ? lines[0]?.productName
                : `${lines.length} itens`;
            toast({
              title: "Venda registrada",
              description: itemsLabel
                ? `${itemsLabel} — ${formatMoney(totalValue)}. Conversa marcada como resolvida.`
                : `Negócio atualizado (${formatMoney(totalValue)}). A conversa foi marcada como resolvida.`,
            });
            useAppStore.getState().addNotification({
              tipo: "sucesso",
              titulo: "CRM atualizado",
              descricao: "Negócio como vendido e conversa resolvida.",
            });
          } catch (err) {
            toast({
              title: "Não foi possível salvar",
              description: err instanceof Error ? err.message : "Tente novamente.",
              variant: "destructive",
            });
            throw err;
          }
        }}
      />

      <Dialog
        open={saleFlowOpen}
        onOpenChange={(open) => {
          setSaleFlowOpen(open);
          if (!open) {
            resetSaleFlow();
          }
        }}
      >
        <DialogContent className="max-w-2xl rounded-2xl border-[var(--inbox-border)] p-0">
          <DialogHeader
            className={cn(
              "border-b border-[var(--inbox-chat-bg)] pb-4 pl-6 pt-5",
              dialogCloseInset.headerEnd,
            )}
          >
            <DialogTitle className="text-xl font-semibold text-[var(--inbox-ink)]">
              Registrar venda ou devolucao
            </DialogTitle>
            <DialogDescription className="text-sm text-[var(--inbox-muted)]">
              Etapa {saleStep} de 3 · cliente {activeChat?.displayName ?? "nao selecionado"}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 px-6 py-5">
            {saleStep === 1 ? (
              <div className="grid gap-3">
                <Label className="text-sm text-[var(--inbox-muted)]">Escolha o tipo de registro</Label>
                <div className="grid gap-2 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => setSaleFlowType("venda")}
                    className={`rounded-2xl border px-4 py-3 text-left ${saleFlowType === "venda" ? "border-[var(--inbox-green-soft)] bg-[var(--inbox-green-tint)] text-[var(--inbox-green)]" : "border-[var(--inbox-border)] bg-card text-[var(--inbox-ink-2)]"}`}
                  >
                    <p className="text-sm font-semibold">Venda</p>
                    <p className="mt-1 text-xs">Registrar nova venda para este cliente.</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSaleFlowType("devolucao")}
                    className={`rounded-2xl border px-4 py-3 text-left ${saleFlowType === "devolucao" ? "border-[var(--inbox-green-soft)] bg-[var(--inbox-green-tint)] text-[var(--inbox-green)]" : "border-[var(--inbox-border)] bg-card text-[var(--inbox-ink-2)]"}`}
                  >
                    <p className="text-sm font-semibold">Devolucao</p>
                    <p className="mt-1 text-xs">Registrar devolucao de venda e destino do valor.</p>
                  </button>
                </div>
              </div>
            ) : null}

            {saleStep === 2 && saleFlowType === "venda" ? (
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="sale-seller">Usuario que vendeu</Label>
                  <Select value={saleSeller} onValueChange={setSaleSeller}>
                    <SelectTrigger id="sale-seller" className="h-11 rounded-xl border-[var(--inbox-border)]">
                      <SelectValue placeholder="Selecione o usuario" />
                    </SelectTrigger>
                    <SelectContent>
                      {sellerOptions.map((seller) => (
                        <SelectItem key={seller.id} value={seller.id}>{seller.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Label className="text-sm text-[var(--inbox-muted)]">Produtos da venda</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-9 gap-1 rounded-xl border-[var(--inbox-border)]"
                      onClick={() =>
                        setSaleCartLines((prev) => [...prev, createEmptySaleCartLine()])
                      }
                    >
                      <Plus className="h-4 w-4" />
                      Adicionar produto
                    </Button>
                  </div>

                  {saleCartDuplicateProductLines ? (
                    <p className="rounded-lg border border-[var(--crm-amber-border)] bg-[var(--crm-amber-tint)] px-3 py-2 text-xs leading-snug text-[var(--crm-amber-ink)]">
                      O mesmo produto aparece em mais de uma linha. As quantidades{" "}
                      <span className="font-semibold">somam</span> na conferencia de estoque e no
                      total da venda.
                    </p>
                  ) : null}

                  <div className="grid gap-4">
                    {saleCartLines.map((line, index) => (
                      <div
                        key={line.key}
                        className="rounded-xl border border-[var(--inbox-border)] bg-[var(--inbox-surface)] p-4"
                      >
                        <div className="mb-3 flex items-center justify-between gap-2">
                          <span className="text-xs font-medium text-[var(--inbox-muted)]">
                            Item {index + 1}
                          </span>
                          {saleCartLines.length > 1 ? (
                            <button
                              type="button"
                              onClick={() =>
                                setSaleCartLines((prev) => prev.filter((_l, i) => i !== index))
                              }
                              className="rounded-lg p-1.5 text-[var(--inbox-muted)] hover:bg-[var(--inbox-chat-bg)] hover:text-red-600"
                              aria-label="Remover linha"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          ) : null}
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className="grid gap-2 sm:col-span-2">
                            <Label htmlFor={`sale-product-${line.key}`}>Produto</Label>
                            <Select
                              value={line.productId}
                              onValueChange={(value) =>
                                setSaleCartLines((prev) =>
                                  prev.map((l, i) => (i === index ? { ...l, productId: value } : l)),
                                )
                              }
                            >
                              <SelectTrigger
                                id={`sale-product-${line.key}`}
                                className="h-11 rounded-xl border-[var(--inbox-border)] bg-card"
                              >
                                <SelectValue placeholder="Selecione o produto" />
                              </SelectTrigger>
                              <SelectContent>
                                {saleProductOptions.map((product) => (
                                  <SelectItem key={product.id} value={product.id}>
                                    {product.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="grid gap-2">
                            <Label htmlFor={`sale-qty-${line.key}`}>Quantidade</Label>
                            <Input
                              id={`sale-qty-${line.key}`}
                              value={line.quantityStr}
                              onChange={(event) =>
                                setSaleCartLines((prev) =>
                                  prev.map((l, i) =>
                                    i === index ? { ...l, quantityStr: event.target.value } : l,
                                  ),
                                )
                              }
                              placeholder="1"
                              inputMode="numeric"
                              className="h-11 rounded-xl border-[var(--inbox-border)] bg-card"
                            />
                          </div>
                        </div>

                        {line.productId ? (
                          (() => {
                            const p = saleProducts.find((x) => x.id === line.productId);
                            const qty = parseQuantityInput(line.quantityStr) ?? 1;
                            if (!p) return null;
                            if (p.qtdEstoque < qty) {
                              return (
                                <p className="mt-3 text-xs font-medium text-red-600">
                                  Estoque insuficiente ({p.qtdEstoque} {p.unidade}); a venda sera bloqueada.
                                </p>
                              );
                            }
                            return (
                              <p className="mt-3 text-xs text-[var(--inbox-muted)]">
                                Estoque: <span className="font-medium text-[var(--inbox-ink)]">{p.qtdEstoque}</span>{" "}
                                {p.unidade}
                                {p.qtdEstoque > 0 && p.qtdEstoque < 5 ? (
                                  <span className="text-[var(--crm-amber-ink)]"> · estoque baixo</span>
                                ) : null}
                              </p>
                            );
                          })()
                        ) : null}

                        <div className="mt-4 rounded-lg border border-[var(--inbox-chat-bg)] bg-card/60 p-3">
                          <div className="flex items-center gap-2">
                            <Checkbox
                              id={`sale-other-${line.key}`}
                              checked={line.otherPrice}
                              onCheckedChange={(checked) =>
                                setSaleCartLines((prev) =>
                                  prev.map((l, i) =>
                                    i === index
                                      ? {
                                          ...l,
                                          otherPrice: checked === true,
                                          customPriceStr: checked === true ? l.customPriceStr : "",
                                        }
                                      : l,
                                  ),
                                )
                              }
                            />
                            <Label htmlFor={`sale-other-${line.key}`} className="cursor-pointer text-sm">
                              Vendeu por outro valor neste item?
                            </Label>
                          </div>
                          {line.otherPrice ? (
                            <div className="mt-3 grid gap-2">
                              <Label htmlFor={`sale-custom-${line.key}`}>Valor unitario usado</Label>
                              <Input
                                id={`sale-custom-${line.key}`}
                                value={line.customPriceStr}
                                onChange={(event) =>
                                  setSaleCartLines((prev) =>
                                    prev.map((l, i) =>
                                      i === index ? { ...l, customPriceStr: event.target.value } : l,
                                    ),
                                  )
                                }
                                placeholder="Ex.: 189,90"
                                className="h-10 rounded-xl border-[var(--inbox-border)]"
                              />
                            </div>
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}

            {saleStep === 2 && saleFlowType === "devolucao" ? (
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label>Devolucao de</Label>
                  <Select
                    value={returnSource}
                    onValueChange={(value) => {
                      const next = value as "existente" | "outra";
                      setReturnSource(next);
                      if (next === "outra") {
                        setReturnSaleItemId("");
                        setReturnQuantityStr("1");
                      } else if (next === "existente") {
                        const sale = customerSales.find((s) => s.id === returnExistingSaleId);
                        const first = sale?.items[0];
                        setReturnSaleItemId(first?.id ?? "");
                      }
                    }}
                  >
                    <SelectTrigger className="h-11 rounded-xl border-[var(--inbox-border)]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="existente">Venda existente</SelectItem>
                      <SelectItem value="outra">Outra venda</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {returnSource === "existente" ? (
                  <div className="grid gap-2">
                    <Label htmlFor="return-existing-sale">Selecionar venda existente</Label>
                    <p className="text-xs text-[var(--inbox-muted)]">
                      Ate {SALE_RETURN_HISTORY_LIMIT} vendas mais recentes do cliente. Filtre por produto,
                      data, pagamento ou observacao.
                    </p>
                    <Input
                      id="return-existing-sale-search"
                      value={returnExistingSalesSearch}
                      onChange={(event) => setReturnExistingSalesSearch(event.target.value.slice(0, 120))}
                      placeholder="Filtrar vendas..."
                      className="h-10 rounded-xl border-[var(--inbox-border)]"
                      disabled={customerSales.length === 0}
                    />
                    <Select
                      value={returnExistingSaleId}
                      onValueChange={(id) => {
                        setReturnExistingSaleId(id);
                        const sale = customerSales.find((s) => s.id === id);
                        const first = sale?.items[0];
                        setReturnSaleItemId(first?.id ?? "");
                      }}
                    >
                      <SelectTrigger id="return-existing-sale" className="h-11 rounded-xl border-[var(--inbox-border)]">
                        <SelectValue placeholder="Escolha a venda" />
                      </SelectTrigger>
                      <SelectContent>
                        {customerSales.length === 0 ? (
                          <SelectItem value="sem-vendas" disabled>
                            Sem vendas para este cliente
                          </SelectItem>
                        ) : existingSalesOptions.length === 0 ? (
                          <SelectItem value="sem-match" disabled>
                            Nenhuma venda corresponde ao filtro
                          </SelectItem>
                        ) : (
                          existingSalesOptions.map((sale) => (
                            <SelectItem key={sale.id} value={sale.id}>{sale.label}</SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    {customerSales.length === 0 ? (
                      <p className="text-xs text-[var(--inbox-muted)]">
                        Nao encontramos vendas para este cliente. Use a opcao &quot;Outra venda&quot; ou verifique o
                        cadastro.
                      </p>
                    ) : null}
                    {selectedReturnSourceSale && selectedReturnSourceSale.items.length > 1 ? (
                      <div className="grid gap-2">
                        <Label htmlFor="return-sale-item">Item a devolver nesta venda</Label>
                        <Select value={returnSaleItemId} onValueChange={setReturnSaleItemId}>
                          <SelectTrigger id="return-sale-item" className="h-11 rounded-xl border-[var(--inbox-border)]">
                            <SelectValue placeholder="Escolha o item" />
                          </SelectTrigger>
                          <SelectContent>
                            {selectedReturnSourceSale.items.map((item) => {
                              const alreadyReturned = returnedQtyBySaleItemId.get(item.id) ?? 0;
                              const remaining = Math.max(0, item.quantity - alreadyReturned);
                              return (
                                <SelectItem key={item.id} value={item.id} disabled={remaining <= 0}>
                                  {item.productName} · vendido{" "}
                                  {item.quantity.toLocaleString("pt-BR", { maximumFractionDigits: 3 })} · devolvido{" "}
                                  {alreadyReturned.toLocaleString("pt-BR", { maximumFractionDigits: 3 })} · disponivel{" "}
                                  {remaining.toLocaleString("pt-BR", { maximumFractionDigits: 3 })} ·{" "}
                                  {formatMoney(item.unitPrice)} unit.
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                      </div>
                    ) : selectedReturnSourceSale && selectedReturnSourceSale.items.length === 1 ? (
                      (() => {
                        const line = selectedReturnSourceSale.items[0]!;
                        const alreadyReturned = returnedQtyBySaleItemId.get(line.id) ?? 0;
                        const remaining = Math.max(0, line.quantity - alreadyReturned);
                        return (
                          <p className="text-xs text-[var(--inbox-muted)]">
                            Item:{" "}
                            <span className="font-medium text-[var(--inbox-ink)]">{line.productName}</span>
                            {" · "}
                            {formatMoney(line.unitPrice)} unit. · Vendido{" "}
                            {line.quantity.toLocaleString("pt-BR", { maximumFractionDigits: 3 })} · Devolvido{" "}
                            {alreadyReturned.toLocaleString("pt-BR", { maximumFractionDigits: 3 })} · Disponivel{" "}
                            {remaining.toLocaleString("pt-BR", { maximumFractionDigits: 3 })}
                          </p>
                        );
                      })()
                    ) : null}
                  </div>
                ) : (
                  <div className="grid gap-2">
                    <Label htmlFor="return-product">Produto da outra venda</Label>
                    <Select value={returnProductId} onValueChange={setReturnProductId}>
                      <SelectTrigger id="return-product" className="h-11 rounded-xl border-[var(--inbox-border)]">
                        <SelectValue placeholder="Selecione o produto" />
                      </SelectTrigger>
                      <SelectContent>
                        {saleProductOptions.map((product) => (
                          <SelectItem key={product.id} value={product.id}>{product.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {((returnSource === "existente" && selectedReturnSaleItem) ||
                  (returnSource === "outra" && returnProductId.trim())) && (
                  <div className="grid gap-2">
                    <Label htmlFor="return-quantity">Quantidade a devolver</Label>
                    <Input
                      id="return-quantity"
                      value={returnQuantityStr}
                      onChange={(event) => setReturnQuantityStr(event.target.value.slice(0, 24))}
                      placeholder="Ex.: 1"
                      className="h-10 rounded-xl border-[var(--inbox-border)]"
                      inputMode="decimal"
                    />
                    {returnSource === "existente" && selectedReturnSaleItem ? (
                      <p className="text-xs text-[var(--inbox-muted)]">
                        Vendido:{" "}
                        {selectedReturnSaleItem.quantity.toLocaleString("pt-BR", { maximumFractionDigits: 3 })} · Ja
                        devolvido:{" "}
                        {(returnedQtyBySaleItemId.get(selectedReturnSaleItem.id) ?? 0).toLocaleString("pt-BR", {
                          maximumFractionDigits: 3,
                        })}{" "}
                        · Disponivel agora:{" "}
                        {(selectedReturnRemainingQty ?? 0).toLocaleString("pt-BR", { maximumFractionDigits: 3 })}.
                      </p>
                    ) : (
                      <p className="text-xs text-[var(--inbox-muted)]">Unidades devolvidas neste registro.</p>
                    )}
                  </div>
                )}

                <div className="rounded-xl border border-[var(--inbox-border)] bg-[var(--inbox-surface)] p-4">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="return-other-value"
                      checked={returnOtherPrice}
                      onCheckedChange={(checked) => setReturnOtherPrice(Boolean(checked))}
                    />
                    <Label htmlFor="return-other-value" className="cursor-pointer">
                      Vendeu por outro valor?
                    </Label>
                  </div>
                  {returnOtherPrice ? (
                    <div className="mt-3 grid gap-2">
                      <Label htmlFor="return-custom-price">Qual valor foi usado?</Label>
                      <Input
                        id="return-custom-price"
                        value={returnCustomPrice}
                        onChange={(event) => setReturnCustomPrice(event.target.value)}
                        placeholder="Ex.: 149,90"
                        className="h-10 rounded-xl border-[var(--inbox-border)]"
                      />
                    </div>
                  ) : (
                    <p className="mt-3 text-xs text-[var(--inbox-muted)]">Sem marcacao, sera considerado o valor de cadastro do produto.</p>
                  )}
                </div>
              </div>
            ) : null}

            {saleStep === 3 ? (
              <div className="grid gap-4">
                {saleFlowType === "devolucao" ? (
                  <div className="grid gap-2">
                    <Label>Destino da devolucao</Label>
                    <Select value={returnResolution} onValueChange={(value) => setReturnResolution(value as "troca" | "credito")}>
                      <SelectTrigger className="h-11 rounded-xl border-[var(--inbox-border)]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="troca">Vai trocar por outro produto</SelectItem>
                        <SelectItem value="credito">Transformar em credito para compras futuras</SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="grid gap-2">
                      <Label htmlFor="return-notes">Observacoes da devolucao (opcional)</Label>
                      <Textarea
                        id="return-notes"
                        value={returnNotes}
                        onChange={(event) => setReturnNotes(event.target.value.slice(0, 2000))}
                        placeholder="Ex.: motivo, estado do produto, acordo com o cliente..."
                        className="min-h-[88px] rounded-xl border-[var(--inbox-border)] text-sm"
                      />
                      <p className="text-xs text-[var(--inbox-muted)]">{returnNotes.length}/2000 caracteres</p>
                    </div>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="sale-payment">Forma de pagamento</Label>
                      <Select
                        value={salePaymentMethod}
                        onValueChange={(value) => {
                          const next = value as SalePaymentMethod;
                          setSalePaymentMethod(next);
                          if (next === "credito_loja") {
                            setSaleUseCredit(false);
                            setSaleCreditInput("");
                          }
                        }}
                      >
                        <SelectTrigger id="sale-payment" className="h-11 rounded-xl border-[var(--inbox-border)]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {salePaymentSelectOptions.map((key) => (
                            <SelectItem key={key} value={key}>
                              {SALE_PAYMENT_METHOD_LABELS[key]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {salePaymentMethod === "credito_loja" ? (
                      <p className="text-xs text-[var(--inbox-muted)]">
                        O valor total da venda sera quitado com o saldo de credito do cliente (devolucoes em credito).
                        {activeChat?.customerId ? (
                          <>
                            {" "}
                            Saldo atual:{" "}
                            <span className="font-medium text-[var(--inbox-ink)]">
                              {formatMoney(customerCreditSummary?.totalCredit ?? 0)}
                            </span>
                            .
                          </>
                        ) : (
                          " Cadastre ou vincule o cliente ao chat para usar esta opcao."
                        )}
                      </p>
                    ) : (
                      <div className="rounded-xl border border-[var(--inbox-border)] bg-[var(--inbox-surface)] p-4">
                        <div className="flex items-center gap-2">
                          <Checkbox
                            id="sale-use-credit"
                            checked={saleUseCredit}
                            disabled={!activeChat?.customerId || (customerCreditSummary?.totalCredit ?? 0) <= 0}
                            onCheckedChange={(checked) => {
                              setSaleUseCredit(Boolean(checked));
                              if (!checked) {
                                setSaleCreditInput("");
                              }
                            }}
                          />
                          <Label htmlFor="sale-use-credit" className="cursor-pointer">
                            Abater parte do saldo de credito do cliente
                          </Label>
                        </div>
                        {!activeChat?.customerId ? (
                          <p className="mt-2 text-xs text-[var(--inbox-muted)]">Disponivel quando o chat tiver cliente vinculado.</p>
                        ) : (customerCreditSummary?.totalCredit ?? 0) <= 0 ? (
                          <p className="mt-2 text-xs text-[var(--inbox-muted)]">Este cliente nao possui saldo de credito.</p>
                        ) : null}
                        {saleUseCredit ? (
                          <div className="mt-3 grid gap-2">
                            <Label htmlFor="sale-credit-amount">Valor do abatimento</Label>
                            <Input
                              id="sale-credit-amount"
                              value={saleCreditInput}
                              onChange={(event) => setSaleCreditInput(event.target.value)}
                              placeholder={`Max. ${formatMoney(Math.min(customerCreditSummary?.totalCredit ?? 0, salePreviewTotal))}`}
                              className="h-10 rounded-xl border-[var(--inbox-border)]"
                            />
                            <p className="text-xs text-[var(--inbox-muted)]">
                              Saldo: <span className="font-medium">{formatMoney(customerCreditSummary?.totalCredit ?? 0)}</span>
                              {" · "}
                              Total da venda: <span className="font-medium">{formatMoney(salePreviewTotal)}</span>
                            </p>
                          </div>
                        ) : null}
                      </div>
                    )}
                    <div className="grid gap-2">
                      <Label htmlFor="sale-notes">Observacoes da venda (opcional)</Label>
                      <Textarea
                        id="sale-notes"
                        value={saleNotes}
                        onChange={(event) => setSaleNotes(event.target.value.slice(0, 2000))}
                        placeholder="Ex.: parcelado, combinado de entrega, dados para NF..."
                        className="min-h-[88px] rounded-xl border-[var(--inbox-border)] text-sm"
                      />
                      <p className="text-xs text-[var(--inbox-muted)]">{saleNotes.length}/2000 caracteres</p>
                    </div>
                  </div>
                )}

                <div className="rounded-xl border border-[var(--inbox-border)] bg-card p-4 text-sm text-[var(--inbox-ink-2)]">
                  <p className="font-semibold text-[var(--inbox-ink)]">Resumo</p>
                  <p className="mt-2">Tipo: <span className="font-medium">{saleFlowType || "-"}</span></p>
                  {saleFlowType === "venda" ? (
                    <>
                      <p>Usuario: <span className="font-medium">{sellerOptions.find((seller) => seller.id === saleSeller)?.name ?? "-"}</span></p>
                      <div className="mt-2 space-y-1">
                        <p className="font-medium text-[var(--inbox-ink)]">Itens</p>
                        <ul className="list-inside list-disc space-y-0.5 pl-0.5 text-[var(--inbox-ink-2)]">
                          {saleCartLines
                            .filter((line) => line.productId.trim())
                            .map((line) => {
                              const name =
                                saleProductOptions.find((product) => product.id === line.productId)?.name ??
                                saleProducts.find((p) => p.id === line.productId)?.nome ??
                                "-";
                              const q = parseQuantityInput(line.quantityStr) ?? 1;
                              const unitNote = line.otherPrice
                                ? ` · unit. ${formatMoney(parseMoneyInput(line.customPriceStr) ?? 0)}`
                                : "";
                              return (
                                <li key={line.key}>
                                  <span className="font-medium">{name}</span>
                                  {" · "}
                                  {q}
                                  {unitNote}
                                </li>
                              );
                            })}
                        </ul>
                      </div>
                      <p className="mt-2">Valor: <span className="font-medium">{formatMoney(salePreviewTotal)}</span></p>
                      <p>Pagamento: <span className="font-medium">{SALE_PAYMENT_METHOD_LABELS[salePaymentMethod]}</span></p>
                      {salePaymentMethod !== "credito_loja" && saleUseCredit && saleCreditInput.trim() ? (
                        <p>
                          Abat. credito:{" "}
                          <span className="font-medium">{formatMoney(parseMoneyInput(saleCreditInput) ?? 0)}</span>
                        </p>
                      ) : null}
                      {saleNotes.trim() ? (
                        <p>
                          Observacoes:{" "}
                          <span className="font-medium">{saleNotes.trim().slice(0, 200)}</span>
                          {saleNotes.trim().length > 200 ? "…" : ""}
                        </p>
                      ) : null}
                    </>
                  ) : (
                    <>
                      <p>Origem da devolucao: <span className="font-medium">{returnSource === "existente" ? "Venda existente" : "Outra venda"}</span></p>
                      <p>
                        Referencia:{" "}
                        <span className="font-medium">
                          {returnSource === "existente"
                            ? selectedExistingSale?.label ?? "Nao informado"
                            : saleProductOptions.find((product) => product.id === returnProductId)?.name ?? "Nao informado"}
                        </span>
                      </p>
                      {returnSource === "existente" && selectedReturnSaleItem ? (
                        <p>
                          Item devolvido:{" "}
                          <span className="font-medium">
                            {selectedReturnSaleItem.productName}
                            {" · "}
                            {formatMoney(selectedReturnSaleItem.unitPrice)} unit.
                            {selectedReturnSourceSale && selectedReturnSourceSale.items.length > 1
                              ? ` (entre ${selectedReturnSourceSale.items.length} itens)`
                              : ""}
                          </span>
                        </p>
                      ) : null}
                      {parseQuantityInput(returnQuantityStr) != null && parseQuantityInput(returnQuantityStr)! > 1 ? (
                        <p>
                          Quantidade:{" "}
                          <span className="font-medium">
                            {parseQuantityInput(returnQuantityStr)!.toLocaleString("pt-BR", {
                              maximumFractionDigits: 3,
                            })}
                          </span>
                        </p>
                      ) : null}
                      {devolucaoCreditPreview != null ? (
                        <p>
                          Valor total da devolucao:{" "}
                          <span className="font-medium">{formatMoney(devolucaoCreditPreview)}</span>
                        </p>
                      ) : null}
                      <p>
                        Valor base:{" "}
                        <span className="font-medium">
                          {returnOtherPrice ? returnCustomPrice || "-" : "Preco unitario da linha / cadastro"}
                        </span>
                      </p>
                      <p>Destino: <span className="font-medium">{returnResolution === "troca" ? "Troca" : "Credito"}</span></p>
                      {returnNotes.trim() ? (
                        <p>
                          Observacoes:{" "}
                          <span className="font-medium">{returnNotes.trim().slice(0, 200)}</span>
                          {returnNotes.trim().length > 200 ? "…" : ""}
                        </p>
                      ) : null}
                    </>
                  )}
                </div>
              </div>
            ) : null}
          </div>

          <DialogFooter className="border-t border-[var(--inbox-chat-bg)] px-6 py-4">
            <div className="flex w-full items-center justify-between gap-3">
              <Button variant="outline" className="rounded-xl" onClick={handleSaleStepBack} disabled={saleStep === 1}>
                Voltar
              </Button>
              {saleStep < 3 ? (
                <Button className="rounded-xl bg-[var(--crm-brand)] hover:bg-[var(--crm-brand-strong)]" onClick={handleSaleStepNext}>
                  Continuar
                </Button>
              ) : (
                <Button
                  className="rounded-xl bg-[var(--crm-brand)] hover:bg-[var(--crm-brand-strong)]"
                  onClick={() => {
                    void handleConfirmSaleFlow();
                  }}
                  disabled={registerSaleFlow.isPending}
                >
                  {registerSaleFlow.isPending ? "Salvando..." : "Salvar registro"}
                </Button>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
