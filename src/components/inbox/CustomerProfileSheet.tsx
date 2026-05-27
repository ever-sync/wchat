import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Check, ExternalLink, Kanban, Pause, Pencil, Phone, Play, Plus, Trash2, X } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatBRL } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CustomerCrmPipelineForm } from "@/components/cliente/CustomerCrmPipelineForm";
import { CrmNegotiationDocumentsSection } from "@/components/crm/CrmNegotiationDocumentsSection";
import { CustomerMediaGallery } from "@/components/inbox/CustomerMediaGallery";
import { NegotiationProductsEditor } from "@/components/crm/NegotiationProductsEditor";
import { CallLogsPanel } from "@/components/crm/CallLogsPanel";
import { CustomerCustomFieldsFacts } from "@/components/customers/CustomerCustomFieldsFacts";
import { CustomerLeadSheet } from "@/components/customers/CustomerLeadSheet";
import { type CrmFunnel, DEFAULT_CRM_FUNNELS, funnelListNameIn, funnelStageTitleIn } from "@/data/crm-funnels";
import { useCrmNegotiationsForCustomer, useUpdateCrmNegotiation } from "@/lib/api/crm-negotiations";
import { useTenantCrmFunnelConfig } from "@/lib/api/crm-funnel-config";
import {
  toCustomerUpsertInput,
  syncCustomerNomeToChatsAndCrm,
  useCreateCustomer,
  useCustomer,
  useCustomers,
  useDistinctCustomerTags,
  useUpdateCustomer,
} from "@/lib/api/customers";
import { useChatNegotiation, useEnsureLeadFromChat, useSetChatResolution } from "@/lib/api/crm-lead";
import { useAtendimentoUsers, useSetChatAiMode } from "@/lib/api/chat-tags";
import { useDeleteWhatsappChat, useLinkWhatsappChatCustomer } from "@/lib/api/whatsapp";
import { ChatTagsPicker } from "@/components/inbox/ChatTagsPicker";
import { CUSTOMER_TAGS_SOURCE_KEY, parseCustomerTags, serializeCustomerTags } from "@/lib/customer-tags";
import { CRM_FUNNEL_ID_KEY, CRM_PIPELINE_STAGE_KEY } from "@/lib/crm-pipeline";
import { leadPrefillFromInboxChat, linkSearchHintFromInboxChat } from "@/lib/inbox-clientes-deeplink";
import { isInlineMediaUrlAllowed } from "@/lib/restricted-media-hosts";
import { isSupabaseConfigured } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import {
  canAtendimentoActOnChat,
  chatAssigneeBlockedMessage,
  negotiationAssigneeBlockedMessage,
} from "@/lib/crm/negotiation-assignee";
import { isPersistedCrmNegotiationId } from "@/lib/crm/negotiation-model";
import { useRolePermissions } from "@/hooks/useRolePermissions";
import { CHAT_RESOLUTION_LABELS } from "@/lib/inbox-chat-rules";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useAppStore } from "@/store/useAppStore";
import {
  type ChatResolution,
  type CrmNegotiationRecord,
  type CrmNegotiationStatus,
  type Customer,
  type InboxChat,
  type CustomerUpsertInput,
  type WhatsappMessage,
} from "@/types/domain";

function negotiationStatusLabelPt(s: CrmNegotiationStatus): string {
  const map: Record<CrmNegotiationStatus, string> = {
    em_andamento: "Em andamento",
    vendido: "Vendido",
    perdido: "Perdido",
    pausado: "Pausado",
    nao_pausado: "Não pausado",
  };
  return map[s] ?? s;
}

function isUuidString(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function formatMoney(value?: number) {
  return formatBRL(value);
}

function formatDate(value?: string | null) {
  if (!value) {
    return "Nao informado";
  }

  const [year, month, day] = value.slice(0, 10).split("-");
  if (!year || !month || !day) {
    return value;
  }

  return `${day}/${month}/${year}`;
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
    dateStyle: "short",
    timeStyle: "short",
  });
}

function infoValue(value?: string | null) {
  return value?.trim() ? value : "Nao informado";
}

function profileHeaderPhone(customer: Customer | null | undefined, chat: InboxChat | null): string {
  const phone =
    customer?.telefone?.trim() ||
    chat?.remotePhoneE164?.trim() ||
    chat?.remotePhoneDigits?.trim() ||
    chat?.remoteJid?.trim() ||
    "";
  return phone || "Telefone não informado";
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

const FUNNEL_NONE = "__funnel_none__";

function ProfileTagsPicker({
  customer,
  suggestionTags,
  disabled = false,
}: {
  customer: Customer;
  suggestionTags: string[];
  disabled?: boolean;
}) {
  const { toast } = useToast();
  const updateCustomer = useUpdateCustomer();
  const tags = useMemo(() => parseCustomerTags(customer.sourceColumns), [customer.sourceColumns]);
  const [input, setInput] = useState("");

  const addable = useMemo(
    () => suggestionTags.filter((t) => !tags.includes(t) && t.trim().length >= 2),
    [suggestionTags, tags],
  );

  const isBusy = disabled || updateCustomer.isPending;

  const commit = async (next: string[]) => {
    if (disabled) {
      return;
    }
    try {
      await updateCustomer.mutateAsync({
        id: customer.id,
        input: {
          ...toCustomerUpsertInput(customer),
          sourceColumns: {
            ...customer.sourceColumns,
            [CUSTOMER_TAGS_SOURCE_KEY]: serializeCustomerTags(next),
          },
        },
      });
    } catch (e) {
      toast({
        title: "Erro ao salvar tags",
        description: e instanceof Error ? e.message : "Tente novamente.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="rounded-[20px] border border-[var(--inbox-border)] bg-card/90 p-4 shadow-sm">
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--inbox-muted-2)]">Tags</p>
      <div className="mt-2 flex min-h-[36px] flex-wrap gap-2">
        {tags.map((t) => (
          <span
            key={t}
            className="inline-flex items-center gap-1 rounded-full border border-[var(--crm-brand-border)] bg-[var(--crm-brand-tint)] px-2.5 py-1 text-xs font-medium text-[var(--crm-brand)]"
          >
            {t}
            <button
              type="button"
              className="rounded-full p-0.5 hover:bg-[var(--crm-brand-tint)]"
              aria-label={`Remover tag ${t}`}
              disabled={isBusy}
              onClick={() => void commit(tags.filter((x) => x !== t))}
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        {tags.length === 0 ? <span className="text-sm text-[var(--inbox-muted-2)]">Nenhuma tag.</span> : null}
      </div>
      <div className="mt-3 space-y-2">
        <Label className="text-xs text-[var(--inbox-muted)]">Adicionar tag já usada na base</Label>
        {addable.length === 0 ? (
          <p className="text-xs text-[var(--inbox-muted-2)]">Nenhuma outra tag conhecida além das já aplicadas.</p>
        ) : (
          <Select
            disabled={isBusy}
            onValueChange={(v) => {
              if (tags.includes(v)) {
                return;
              }
              void commit([...tags, v]);
            }}
          >
            <SelectTrigger className="h-9 rounded-xl border-[var(--inbox-border)] bg-card">
              <SelectValue placeholder="Escolher tag…" />
            </SelectTrigger>
            <SelectContent>
              {addable.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ou criar tag nova (Enter)"
            className="h-9 flex-1 rounded-xl border-[var(--inbox-border)] bg-card"
            disabled={isBusy}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                const v = input.trim();
                if (!v || tags.includes(v)) {
                  setInput("");
                  return;
                }
                setInput("");
                void commit([...tags, v]);
              }
            }}
          />
          <Button
            type="button"
            size="icon"
            variant="secondary"
            className="h-9 w-9 shrink-0 rounded-xl"
            disabled={isBusy || !input.trim() || tags.includes(input.trim())}
            aria-label="Adicionar tag nova"
            onClick={() => {
              const v = input.trim();
              if (!v) {
                return;
              }
              setInput("");
              void commit([...tags, v]);
            }}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}


function chatAttendantLabel(chat: InboxChat | null): string {
  const name = chat?.assigneeName?.trim();
  return name || "Sem atendente";
}

function negotiationAssigneeLabel(
  assigneeId: string | null | undefined,
  resolveName: (id: string) => string | null,
): string {
  const id = assigneeId?.trim();
  if (!id) {
    return "Pool (sem responsável)";
  }
  return resolveName(id) ?? "Responsável não identificado";
}

function EditableCustomerFactRow({
  label,
  value,
  field,
  customer,
  canEdit,
  showEditButton,
  editBlockedMessage,
  inputType = "text",
  placeholder,
}: {
  label: string;
  value: string;
  field: "nome" | "email";
  customer: Customer;
  canEdit: boolean;
  showEditButton: boolean;
  editBlockedMessage?: string | null;
  inputType?: "text" | "email";
  placeholder?: string;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const updateCustomer = useUpdateCustomer();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    if (!editing) {
      setDraft(value);
    }
  }, [editing, value]);

  const isBusy = updateCustomer.isPending;
  const display = value.trim() ? value : "Não informado";

  const save = async () => {
    const trimmed = draft.trim();
    if (field === "nome" && trimmed.length < 2) {
      toast({
        title: "Nome obrigatório",
        description: "Informe pelo menos 2 caracteres.",
        variant: "destructive",
      });
      return;
    }

    try {
      await updateCustomer.mutateAsync({
        id: customer.id,
        input: {
          ...toCustomerUpsertInput(customer),
          ...(field === "nome" ? { nome: trimmed } : { email: trimmed }),
        },
      });

      if (field === "nome" && isSupabaseConfigured) {
        await syncCustomerNomeToChatsAndCrm(customer.id, trimmed);
        await queryClient.invalidateQueries({ queryKey: ["inbox-chats"] });
        await queryClient.invalidateQueries({ queryKey: ["crm-negotiations"] });
        await queryClient.invalidateQueries({ queryKey: ["crm-negotiations", "customer", customer.id] });
      }

      setEditing(false);
      toast({
        title: "Salvo",
        description:
          field === "nome"
            ? "Nome atualizado na lista de contatos, conversas e CRM."
            : "E-mail atualizado no cadastro do cliente.",
      });
    } catch (err) {
      toast({
        title: "Não foi possível salvar",
        description: err instanceof Error ? err.message : "Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const startEditing = () => {
    if (!canEdit) {
      toast({
        title: "Edição indisponível",
        description: editBlockedMessage ?? "Você não pode editar este campo agora.",
        variant: "destructive",
      });
      return;
    }
    setDraft(value.trim());
    setEditing(true);
  };

  return (
    <div className="rounded-xl border border-[var(--inbox-border)] bg-[var(--inbox-surface)] px-3 py-2.5">
      <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--inbox-muted-2)]">{label}</p>
      <div
        className={
          showEditButton && !editing
            ? "mt-1.5 flex min-w-0 cursor-pointer items-start gap-2 rounded-lg py-0.5 transition-colors hover:bg-card/80"
            : "mt-1.5 flex min-w-0 items-center gap-1.5"
        }
        onClick={showEditButton && !editing ? startEditing : undefined}
        role={showEditButton && !editing ? "button" : undefined}
        tabIndex={showEditButton && !editing ? 0 : undefined}
        title={
          showEditButton && !editing
            ? canEdit
              ? `Editar ${label.toLowerCase()}`
              : (editBlockedMessage ?? undefined)
            : undefined
        }
      >
        {editing ? (
          <>
            <Input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              type={inputType}
              placeholder={placeholder}
              className="h-9 min-w-0 flex-1 rounded-lg border-[var(--inbox-border)] bg-card text-sm"
              disabled={isBusy}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void save();
                }
                if (e.key === "Escape") {
                  setDraft(value);
                  setEditing(false);
                }
              }}
            />
            <Button
              type="button"
              size="icon"
              variant="secondary"
              className="h-8 w-8 shrink-0 rounded-lg"
              disabled={isBusy}
              aria-label="Salvar"
              onClick={(e) => {
                e.stopPropagation();
                void save();
              }}
            >
              <Check className="h-3.5 w-3.5" />
            </Button>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="h-8 w-8 shrink-0 rounded-lg"
              disabled={isBusy}
              aria-label="Cancelar"
              onClick={(e) => {
                e.stopPropagation();
                setDraft(value);
                setEditing(false);
              }}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </>
        ) : (
          <>
            <p className="min-w-0 flex-1 break-words text-sm font-medium leading-snug text-[var(--inbox-ink)]">
              {display}
            </p>
            {showEditButton ? (
              <Button
                type="button"
                size="icon"
                variant="outline"
                className="h-8 w-8 shrink-0 rounded-lg border-[var(--inbox-border)] bg-card text-primary shadow-sm hover:border-primary/40 hover:bg-primary/5"
                disabled={isBusy}
                aria-label={`Editar ${label.toLowerCase()}`}
                onClick={(e) => {
                  e.stopPropagation();
                  startEditing();
                }}
              >
                <Pencil className="h-4 w-4" />
              </Button>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}

function QuickFactRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-xl border border-[var(--inbox-border)] bg-[var(--inbox-surface)] px-3 py-2.5 text-sm">
      <span className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--inbox-muted-2)]">
        {label}
      </span>
      <span className="min-w-0 break-words text-right font-medium leading-snug text-[var(--inbox-ink)]">{value}</span>
    </div>
  );
}

function CustomerQuickFacts({
  customer,
  chat,
  messageCount,
  linkedNegotiationAssigneeLabel,
  canEditIdentity,
  showIdentityEditButton,
  identityEditBlockedMessage,
}: {
  customer: Customer;
  chat: InboxChat | null;
  messageCount: number;
  linkedNegotiationAssigneeLabel?: string | null;
  canEditIdentity: boolean;
  showIdentityEditButton: boolean;
  identityEditBlockedMessage?: string | null;
}) {
  const phone = customer.telefone || chat?.remotePhoneE164 || chat?.remotePhoneDigits || chat?.remoteJid || "";

  return (
    <div className="space-y-4">
      <div className="rounded-[20px] border border-[var(--inbox-border)] bg-card/90 p-4 shadow-sm">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--inbox-muted-2)]">Identificação</p>
        <div className="mt-3 grid gap-2">
          <EditableCustomerFactRow
            label="Nome"
            value={customer.nome ?? ""}
            field="nome"
            customer={customer}
            canEdit={canEditIdentity}
            showEditButton={showIdentityEditButton}
            editBlockedMessage={identityEditBlockedMessage}
            placeholder="Nome do contato"
          />
          <QuickFactRow label="Telefone" value={infoValue(phone)} />
          <EditableCustomerFactRow
            label="E-mail"
            value={customer.email ?? ""}
            field="email"
            customer={customer}
            canEdit={canEditIdentity}
            showEditButton={showIdentityEditButton}
            editBlockedMessage={identityEditBlockedMessage}
            inputType="email"
            placeholder="email@exemplo.com"
          />
        </div>
      </div>

      {chat || linkedNegotiationAssigneeLabel != null ? (
        <div className="rounded-[20px] border border-[var(--inbox-border)] bg-card/90 p-4 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--inbox-muted-2)]">Atendimento</p>
          <div className="mt-3 grid gap-2">
            {chat ? <QuickFactRow label="Atendente (conversa)" value={chatAttendantLabel(chat)} /> : null}
            {linkedNegotiationAssigneeLabel != null ? (
              <QuickFactRow label="Responsável CRM" value={linkedNegotiationAssigneeLabel} />
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="rounded-[20px] border border-[var(--inbox-border)] bg-card/90 p-4 shadow-sm">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--inbox-muted-2)]">Histórico</p>
        <div className="mt-3 grid gap-2">
          <QuickFactRow label="Cadastro" value={formatDate(customer.cadastradoEm)} />
          {chat ? <QuickFactRow label="Mensagens (esta conversa)" value={String(messageCount)} /> : null}
          {chat ? <QuickFactRow label="Última mensagem" value={formatDateTime(chat.lastMessageAt)} /> : null}
        </div>
      </div>
    </div>
  );
}

const PROFILE_TAB_TRIGGER_CLASS =
  "rounded-xl px-3 py-1.5 text-xs font-semibold text-[var(--inbox-muted)] data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm";

function ProfileNegotiationsPanel({
  negotiations,
  negotiationsForDisplay,
  negLoading,
  chat,
  effectiveCrmFunnels,
  resolveAttendantName,
}: {
  negotiations: CrmNegotiationRecord[];
  negotiationsForDisplay: CrmNegotiationRecord[];
  negLoading: boolean;
  chat: InboxChat;
  effectiveCrmFunnels: CrmFunnel[];
  resolveAttendantName: (id: string) => string | null;
}) {
  return (
    <div className="rounded-[20px] border border-[var(--inbox-border)] bg-card/90 p-4 shadow-sm">
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--inbox-muted-2)]">Negociações</p>
      {negLoading ? (
        <p className="mt-2 text-sm text-[var(--inbox-muted)]">Carregando…</p>
      ) : negotiations.length === 0 ? (
        <p className="mt-2 text-sm text-[var(--inbox-muted)]">Nenhuma negociação vinculada.</p>
      ) : (
        <ul className="mt-2 space-y-2">
          {negotiationsForDisplay.slice(0, 5).map((n) => {
            const isPrimaryChatDeal =
              Boolean(chat.primaryNegotiationId?.trim()) && n.id === chat.primaryNegotiationId;
            const negAssigneeLabel = negotiationAssigneeLabel(n.assigneeId, resolveAttendantName);
            return (
              <li
                key={n.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-[var(--inbox-border)] bg-[var(--inbox-surface)] px-3 py-2 text-sm"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate font-medium text-[var(--inbox-ink)]">{n.title.trim() || "Sem título"}</p>
                    {isPrimaryChatDeal ? (
                      <Badge className="shrink-0 border border-[var(--crm-brand-border)] bg-[var(--crm-brand-tint)] text-[10px] font-medium text-[var(--crm-brand)]">
                        Esta conversa
                      </Badge>
                    ) : null}
                  </div>
                  <p className="text-xs text-[var(--inbox-muted)]">
                    {funnelListNameIn(effectiveCrmFunnels, n.funnelId)} ·{" "}
                    {funnelStageTitleIn(effectiveCrmFunnels, n.funnelId, n.stageId)} ·{" "}
                    {negotiationStatusLabelPt(n.status)}
                    {n.totalValue > 0 ? <> · {formatMoney(n.totalValue)}</> : null}
                    <> · {negAssigneeLabel}</>
                  </p>
                </div>
                {isUuidString(n.id) ? (
                  <Button asChild variant="outline" size="sm" className="shrink-0 rounded-xl text-xs">
                    <Link to={`/crm/negociacao/${encodeURIComponent(n.id)}`}>Abrir</Link>
                  </Button>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function ChatOnlyConversationSummary({
  chat,
}: {
  chat: InboxChat;
}) {
  return (
    <div className="space-y-4">
      <div className="rounded-[20px] border border-[var(--inbox-border)] bg-card/90 p-4 shadow-sm">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--inbox-muted-2)]">Conversa</p>
        <div className="mt-3 space-y-2">
          <QuickFactRow label="Atendente" value={chatAttendantLabel(chat)} />
          <QuickFactRow label="Telefone" value={infoValue(chat.remotePhoneE164 || chat.remotePhoneDigits || chat.remoteJid || "")} />
          <QuickFactRow label="Última mensagem" value={formatDateTime(chat.lastMessageAt)} />
        </div>
      </div>
    </div>
  );
}

export function CustomerProfileSheet({
  open,
  onOpenChange,
  chat,
  messages,
  crmActionsLocked = false,
  channelAiEnabled = false,
  onChatDeleted,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  chat: InboxChat | null;
  messages: WhatsappMessage[];
  /** Atendente sem conversa/negócio assumidos: bloqueia CRM e vínculos. */
  crmActionsLocked?: boolean;
  /** Instância do chat tem IA habilitada — habilita o toggle de Pausar/Retomar IA. */
  channelAiEnabled?: boolean;
  /** Chamado após admin excluir a conversa — pai limpa seleção/URL. */
  onChatDeleted?: (chatId: string) => void;
}) {
  const { data: customer } = useCustomer(chat?.customerId ?? undefined, { enabled: Boolean(chat?.customerId) });
  const { toast } = useToast();
  const { profile } = useAuth();
  const { can } = useRolePermissions();
  const canViewCrm = can("crm", "view");
  const canEditClientes = can("clientes", "edit");
  const canEditInbox = can("inbox", "edit");
  const isAdmin = profile?.role === "admin";
  const setChatResolution = useSetChatResolution();
  const setAiMode = useSetChatAiMode();
  const deleteChat = useDeleteWhatsappChat();
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const canActOnChat = canAtendimentoActOnChat(profile?.role, chat?.assigneeId, profile?.id);
  const { data: negotiations = [], isLoading: negLoading } = useCrmNegotiationsForCustomer(customer?.id, {
    enabled: Boolean(open && customer?.id && isSupabaseConfigured),
  });
  const { data: linkedNegotiation } = useChatNegotiation(open && chat?.id ? chat.id : null);
  const { data: atendimentoUsers = [] } = useAtendimentoUsers();
  const resolveAttendantName = useMemo(() => {
    const byId = new Map(atendimentoUsers.map((user) => [user.id, user.nome]));
    return (id: string) => byId.get(id) ?? null;
  }, [atendimentoUsers]);
  const linkedNegotiationAssigneeLabel = useMemo(() => {
    if (!linkedNegotiation) {
      return undefined;
    }
    return negotiationAssigneeLabel(linkedNegotiation.assigneeId, resolveAttendantName);
  }, [linkedNegotiation, resolveAttendantName]);
  const negotiationsForDisplay = useMemo(() => {
    const list = [...negotiations];
    const primaryId = chat?.primaryNegotiationId?.trim();
    if (!primaryId) {
      return list;
    }
    return list.sort((a, b) => {
      if (a.id === primaryId) {
        return -1;
      }
      if (b.id === primaryId) {
        return 1;
      }
      return 0;
    });
  }, [negotiations, chat?.primaryNegotiationId]);
  const documentsNegotiationId = useMemo(() => {
    const candidates = [
      linkedNegotiation?.id,
      chat?.primaryNegotiationId,
      ...negotiationsForDisplay.map((n) => n.id),
    ];
    for (const id of candidates) {
      if (id && isPersistedCrmNegotiationId(id)) {
        return id;
      }
    }
    return null;
  }, [linkedNegotiation?.id, chat?.primaryNegotiationId, negotiationsForDisplay]);
  const {
    data: tenantFunnelsSaved,
    isError: tenantFunnelsQueryError,
    error: tenantFunnelsQueryErr,
  } = useTenantCrmFunnelConfig({
    enabled: Boolean(open && isSupabaseConfigured),
  });
  const tenantFunnelErrorToastShown = useRef(false);
  useEffect(() => {
    if (!open) {
      tenantFunnelErrorToastShown.current = false;
    }
  }, [open]);
  useEffect(() => {
    if (!open || !tenantFunnelsQueryError || !tenantFunnelsQueryErr) {
      return;
    }
    if (tenantFunnelErrorToastShown.current) {
      return;
    }
    tenantFunnelErrorToastShown.current = true;
    toast({
      title: "Não foi possível carregar os funis do tenant",
      description: tenantFunnelsQueryErr.message,
      variant: "destructive",
    });
  }, [open, tenantFunnelsQueryErr, tenantFunnelsQueryError, toast]);
  const effectiveCrmFunnels = useMemo(
    () => tenantFunnelsSaved ?? DEFAULT_CRM_FUNNELS,
    [tenantFunnelsSaved],
  );
  const linkChat = useLinkWhatsappChatCustomer();
  const ensureLead = useEnsureLeadFromChat();
  const createCustomer = useCreateCustomer();
  const [linkSearch, setLinkSearch] = useState("");
  const [leadSheetOpen, setLeadSheetOpen] = useState(false);
  const [leadPrefill, setLeadPrefill] = useState<Partial<CustomerUpsertInput> | null>(null);
  const { data: customersForLink = [] } = useCustomers(
    { search: linkSearch.trim() || undefined },
    {
      enabled: Boolean(
        open && chat && !chat.customerId && isSupabaseConfigured && linkSearch.trim().length >= 2,
      ),
    },
  );

  // Reinicia a busca ao abrir ou trocar conversa desvinculada; deps limitadas para não sobrescrever digitação a cada render.
  useEffect(() => {
    if (!open || !chat || chat.customerId) {
      return;
    }
    const hint = linkSearchHintFromInboxChat(chat);
    setLinkSearch(hint.length >= 2 ? hint : "");
  }, [open, chat?.customerId, chat?.id, chat?.remoteJid, chat?.remotePhoneDigits, chat?.remotePhoneE164]); // eslint-disable-line react-hooks/exhaustive-deps -- omitir `chat` evita reset ao rerender com novo ref

  const { data: tagSuggestions = [] } = useDistinctCustomerTags({
    enabled: Boolean(open && isSupabaseConfigured),
    staleTime: 120_000,
  });

  const totalMessages = messages.length;
  const displayName = customer?.nome ?? chat?.customerName ?? chat?.displayName ?? "Cliente";
  const initials = getInitials(displayName || "CL");
  const [profileTab, setProfileTab] = useState("resumo");
  const showCrmTab = Boolean(customer && isSupabaseConfigured);
  const showCamposTab = Boolean(customer && isSupabaseConfigured);
  const showArquivosTab = Boolean(isSupabaseConfigured && canViewCrm);
  const showProdutosTab = Boolean(isSupabaseConfigured && canViewCrm && (customer || chat));
  const canEditCustomerIdentityInInbox = canEditClientes || canEditInbox;
  const showCustomerIdentityEditButton = Boolean(customer) && canEditCustomerIdentityInInbox;
  const customerIdentityEditBlockedMessage = useMemo(() => {
    if (!canEditCustomerIdentityInInbox) {
      return "Seu papel não tem permissão para editar contatos no Inbox.";
    }
    if (chat && !canActOnChat) {
      return chatAssigneeBlockedMessage();
    }
    return null;
  }, [canEditCustomerIdentityInInbox, chat, canActOnChat]);
  const canEditCustomerIdentity = showCustomerIdentityEditButton && !customerIdentityEditBlockedMessage;

  useEffect(() => {
    setProfileTab("resumo");
  }, [chat?.id]);

  useEffect(() => {
    if (profileTab === "crm" && !showCrmTab) {
      setProfileTab("resumo");
    } else if (profileTab === "campos" && !showCamposTab) {
      setProfileTab("resumo");
    } else if (profileTab === "arquivos" && !showArquivosTab) {
      setProfileTab("resumo");
    } else if (profileTab === "produtos" && !showProdutosTab) {
      setProfileTab("resumo");
    }
  }, [profileTab, showArquivosTab, showCamposTab, showCrmTab, showProdutosTab]);

  return (
    <>
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-[92vw] overflow-y-auto border-l border-[var(--inbox-border)] bg-[linear-gradient(180deg,#fbfcf9_0%,#f4f7f5_100%)] p-0 sm:max-w-[520px]"
      >
        <div className="flex min-h-full flex-col">
          <SheetHeader className="space-y-0 border-b border-[var(--inbox-border)] bg-card/60 px-5 pb-5 pt-5 backdrop-blur-sm">
            <div className="rounded-[20px] border border-[var(--inbox-border)] bg-card p-4 shadow-sm">
              <div className="flex items-start gap-3.5">
                <Avatar className="h-16 w-16 shrink-0 border-[3px] border-card shadow-[0_10px_24px_rgba(84,95,101,0.1)]">
                  <AvatarImage
                    src={
                      chat?.avatarUrl && isInlineMediaUrlAllowed(chat.avatarUrl)
                        ? chat.avatarUrl
                        : undefined
                    }
                    alt={displayName}
                    className="object-cover"
                  />
                  <AvatarFallback className="bg-gradient-to-br from-[var(--crm-info-tint)] via-sky-50 to-[var(--crm-info-tint)] text-xl font-bold text-[var(--crm-info)]">
                    {initials}
                  </AvatarFallback>
                </Avatar>

                <div className="min-w-0 flex-1 space-y-2">
                  <div>
                    <SheetTitle className="line-clamp-2 text-lg font-semibold leading-snug tracking-tight text-[var(--inbox-ink)]">
                      {displayName}
                    </SheetTitle>
                    <SheetDescription className="mt-1 flex items-center gap-1.5 text-sm text-[var(--inbox-muted)]">
                      <Phone className="h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden />
                      <span className="truncate">{profileHeaderPhone(customer, chat)}</span>
                    </SheetDescription>
                  </div>

                  {chat ? (
                    <div>
                      <Label
                        htmlFor="inbox-profile-resolution"
                        className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--inbox-muted-2)]"
                      >
                        Status da conversa
                      </Label>
                      <Select
                        value={chat.resolution ?? "open"}
                        disabled={crmActionsLocked || !canActOnChat || setChatResolution.isPending}
                        onValueChange={(value) => {
                          if (!canActOnChat) {
                            toast({
                              title: "Assuma a conversa",
                              description: chatAssigneeBlockedMessage(),
                              variant: "destructive",
                            });
                            return;
                          }
                          void setChatResolution.mutateAsync({
                            chatId: chat.id,
                            resolution: value as ChatResolution,
                          });
                        }}
                      >
                        <SelectTrigger
                          id="inbox-profile-resolution"
                          className="h-9 w-full rounded-xl border border-[var(--inbox-border)] bg-[var(--inbox-surface)] text-sm text-[var(--inbox-ink)]"
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {(Object.keys(CHAT_RESOLUTION_LABELS) as ChatResolution[]).map((key) => (
                            <SelectItem key={key} value={key}>
                              {CHAT_RESOLUTION_LABELS[key]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ) : null}

                  {customer ? (
                    <div className="grid grid-cols-2 gap-2 pt-0.5">
                      <Button
                        asChild
                        variant="secondary"
                        size="sm"
                        className="h-9 rounded-xl bg-[var(--crm-brand-tint)] px-2.5 text-xs font-semibold text-[var(--crm-brand)] hover:bg-[var(--crm-brand-tint)]"
                      >
                        <Link to={`/clientes/${customer.id}`} className="inline-flex items-center justify-center gap-1.5">
                          <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden />
                          Perfil completo
                        </Link>
                      </Button>
                      {canViewCrm ? (
                        <Button
                          asChild
                          variant="secondary"
                          size="sm"
                          className="h-9 rounded-xl bg-[var(--crm-brand-tint)] px-2.5 text-xs font-semibold text-[var(--crm-brand)] hover:bg-[var(--crm-brand-tint)]"
                        >
                          <Link to="/crm" className="inline-flex items-center justify-center gap-1.5">
                            <Kanban className="h-3.5 w-3.5 shrink-0" aria-hidden />
                            Abrir CRM
                          </Link>
                        </Button>
                      ) : null}
                    </div>
                  ) : null}
                  {channelAiEnabled && chat ? (() => {
                    const aiPaused = chat.aiMode === "off" || chat.aiMode === "handoff";
                    const disabled = setAiMode.isPending || !canActOnChat || !canEditInbox;
                    return (
                      <Button
                        type="button"
                        variant={aiPaused ? "ghost" : "secondary"}
                        size="sm"
                        disabled={disabled}
                        onClick={() => {
                          if (!canEditInbox) {
                            toast({
                              title: "Ação indisponível",
                              description: "Seu papel não tem permissão para esta ação.",
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
                          setAiMode.mutate(
                            { chatId: chat.id, aiMode: aiPaused ? "full" : "off" },
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
                        className={cn(
                          "mt-1 h-9 w-full rounded-xl px-2.5 text-xs font-semibold",
                          aiPaused
                            ? "border border-[var(--inbox-border)] bg-transparent text-[var(--inbox-ink)] hover:bg-[var(--crm-brand-tint)] hover:text-[var(--crm-brand)]"
                            : "bg-[var(--crm-brand)] text-white hover:bg-[var(--crm-brand)]/90",
                        )}
                      >
                        {aiPaused ? (
                          <Play className="mr-1.5 h-3.5 w-3.5 shrink-0 fill-current" aria-hidden />
                        ) : (
                          <Pause className="mr-1.5 h-3.5 w-3.5 shrink-0 fill-current" aria-hidden />
                        )}
                        {setAiMode.isPending
                          ? aiPaused ? "Retomando..." : "Pausando..."
                          : aiPaused ? "Retomar IA" : "Pausar IA"}
                      </Button>
                    );
                  })() : null}
                  {isAdmin && chat ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={deleteChat.isPending}
                      onClick={() => setDeleteConfirmOpen(true)}
                      className="mt-1 h-9 w-full rounded-xl border border-[var(--crm-danger-border,rgba(220,38,38,0.25))] bg-transparent px-2.5 text-xs font-semibold text-[var(--crm-danger,#dc2626)] hover:bg-[var(--crm-danger-tint,rgba(220,38,38,0.08))] hover:text-[var(--crm-danger,#dc2626)]"
                    >
                      <Trash2 className="mr-1.5 h-3.5 w-3.5 shrink-0" aria-hidden />
                      {deleteChat.isPending ? "Excluindo..." : "Excluir conversa"}
                    </Button>
                  ) : null}
                </div>
              </div>
            </div>
          </SheetHeader>

          <div className="px-6 py-5">
            {crmActionsLocked ? (
              <p className="mb-5 rounded-xl border border-[var(--crm-amber-border)] bg-[var(--crm-amber-tint)] px-4 py-3 text-sm text-[var(--crm-amber-ink)]">
                {negotiationAssigneeBlockedMessage()}
              </p>
            ) : null}
            {chat && !chat.customerId ? (
              <div className="mb-5 rounded-[28px] border border-[var(--crm-amber-border)] bg-[var(--crm-amber-tint)] p-4 shadow-[0_16px_28px_rgba(84,95,101,0.06)]">
                <p className="text-sm font-semibold text-[var(--inbox-ink)]">Conversa sem cliente vinculado</p>
                <p className="mt-1 text-xs leading-relaxed text-[var(--inbox-muted)]">
                  Busque o cadastro pelo nome, telefone ou documento e vincule para ver CRM, credito e campos completos no perfil.
                </p>
                {!isSupabaseConfigured ? (
                  <p className="mt-2 text-xs text-[var(--crm-amber-ink)]">Configure o Supabase para vincular conversas a clientes.</p>
                ) : (
                  <>
                    <Input
                      value={linkSearch}
                      onChange={(e) => setLinkSearch(e.target.value)}
                      placeholder="Digite pelo menos 2 caracteres..."
                      className="mt-3 h-10 rounded-xl border-[var(--inbox-border)] bg-card"
                      autoComplete="off"
                    />
                    {linkSearch.trim().length < 2 ? (
                      <p className="mt-2 text-xs text-[var(--inbox-muted)]">Continue digitando para buscar cadastros.</p>
                    ) : customersForLink.length === 0 ? (
                      <p className="mt-2 text-xs text-[var(--inbox-muted)]">Nenhum cliente encontrado.</p>
                    ) : (
                      <ul className="mt-2 max-h-48 space-y-1 overflow-y-auto rounded-xl border border-[var(--inbox-border)] bg-card p-2">
                        {customersForLink.slice(0, 8).map((c) => (
                          <li key={c.id}>
                            <button
                              type="button"
                              className="flex w-full items-center justify-between gap-2 rounded-lg px-2 py-2 text-left text-sm text-[var(--inbox-ink)] hover:bg-[var(--inbox-surface)] disabled:opacity-50"
                              disabled={linkChat.isPending || crmActionsLocked}
                              onClick={() => {
                                if (crmActionsLocked) {
                                  toast({
                                    title: "Assuma a conversa",
                                    description: chatAssigneeBlockedMessage(),
                                    variant: "destructive",
                                  });
                                  return;
                                }
                                void (async () => {
                                  try {
                                    await linkChat.mutateAsync({ chatId: chat.id, customerId: c.id });
                                    await ensureLead.mutateAsync({ chatId: chat.id }).catch(() => undefined);
                                    toast({
                                      title: "Cliente vinculado",
                                      description: `${c.nome} foi associado a esta conversa.`,
                                    });
                                    setLinkSearch("");
                                  } catch (e) {
                                    toast({
                                      title: "Nao foi possivel vincular",
                                      description: e instanceof Error ? e.message : "Tente novamente.",
                                      variant: "destructive",
                                    });
                                  }
                                })();
                              }}
                            >
                              <span className="min-w-0 truncate font-medium">{c.nome}</span>
                              <span className="shrink-0 text-xs text-[var(--inbox-muted)]">
                                {c.codigo?.trim() || c.telefone || c.id.slice(0, 8)}
                              </span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button asChild variant="secondary" size="sm" className="rounded-xl">
                        <Link to="/clientes">Abrir Clientes</Link>
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="rounded-xl"
                        disabled={crmActionsLocked}
                        onClick={() => {
                          if (crmActionsLocked) {
                            toast({
                              title: "Assuma a conversa",
                              description: chatAssigneeBlockedMessage(),
                              variant: "destructive",
                            });
                            return;
                          }
                          if (chat) {
                            setLeadPrefill(leadPrefillFromInboxChat(chat));
                          } else {
                            setLeadPrefill(null);
                          }
                          setLeadSheetOpen(true);
                        }}
                      >
                        Cadastrar cliente
                      </Button>
                    </div>
                  </>
                )}
              </div>
            ) : null}

            {chat ? (
              <Tabs value={profileTab} onValueChange={setProfileTab} className="space-y-4">
                <TabsList className="h-auto w-full flex-wrap justify-start gap-0.5 rounded-2xl border border-[var(--inbox-border)] bg-card/90 p-1 shadow-sm">
                  <TabsTrigger value="resumo" className={PROFILE_TAB_TRIGGER_CLASS}>
                    Resumo
                  </TabsTrigger>
                  {showCrmTab ? (
                    <TabsTrigger value="crm" className={PROFILE_TAB_TRIGGER_CLASS}>
                      CRM
                    </TabsTrigger>
                  ) : null}
                  {showCamposTab ? (
                    <TabsTrigger value="campos" className={PROFILE_TAB_TRIGGER_CLASS}>
                      Campos
                    </TabsTrigger>
                  ) : null}
                  <TabsTrigger value="etiquetas" className={PROFILE_TAB_TRIGGER_CLASS}>
                    Etiquetas
                  </TabsTrigger>
                  <TabsTrigger value="midia" className={PROFILE_TAB_TRIGGER_CLASS}>
                    Mídia
                  </TabsTrigger>
                  {showProdutosTab ? (
                    <TabsTrigger value="produtos" className={PROFILE_TAB_TRIGGER_CLASS}>
                      Produtos
                    </TabsTrigger>
                  ) : null}
                  {showArquivosTab ? (
                    <TabsTrigger value="arquivos" className={PROFILE_TAB_TRIGGER_CLASS}>
                      Arquivos
                    </TabsTrigger>
                  ) : null}
                </TabsList>

                  <TabsContent value="resumo" className="mt-0 space-y-5 focus-visible:outline-none">
                  {customer ? (
                    <CustomerQuickFacts
                      customer={customer}
                      chat={chat}
                      messageCount={totalMessages}
                      linkedNegotiationAssigneeLabel={linkedNegotiationAssigneeLabel}
                      canEditIdentity={canEditCustomerIdentity}
                      showIdentityEditButton={showCustomerIdentityEditButton}
                      identityEditBlockedMessage={customerIdentityEditBlockedMessage}
                    />
                  ) : (
                    <ChatOnlyConversationSummary chat={chat} />
                  )}
                  {isSupabaseConfigured ? (
                    <CallLogsPanel
                      scope={{
                        customerId: customer?.id ?? null,
                        negotiationId: linkedNegotiation?.id ?? null,
                        chatId: chat.id,
                      }}
                    />
                  ) : null}
                </TabsContent>

                {showCrmTab && customer ? (
                  <TabsContent value="crm" className="mt-0 space-y-5 focus-visible:outline-none">
                    <CustomerCrmPipelineForm
                      customer={customer}
                      funnels={effectiveCrmFunnels}
                      readOnly={crmActionsLocked}
                    />
                    <ProfileNegotiationsPanel
                      negotiations={negotiations}
                      negotiationsForDisplay={negotiationsForDisplay}
                      negLoading={negLoading}
                      chat={chat}
                      effectiveCrmFunnels={effectiveCrmFunnels}
                      resolveAttendantName={resolveAttendantName}
                    />
                  </TabsContent>
                ) : null}

                {showCamposTab && customer ? (
                  <TabsContent value="campos" className="mt-0 focus-visible:outline-none">
                    <CustomerCustomFieldsFacts
                      customerId={customer.id}
                      sourceColumns={customer.sourceColumns}
                      readOnly={!canEditCustomerIdentity}
                      editBlockedMessage={customerIdentityEditBlockedMessage}
                    />
                  </TabsContent>
                ) : null}

                <TabsContent value="etiquetas" className="mt-0 focus-visible:outline-none">
                  {isSupabaseConfigured ? (
                    <ChatTagsPicker chatId={chat.id} tags={chat.tags ?? []} disabled={crmActionsLocked} />
                  ) : customer ? (
                    <ProfileTagsPicker
                      customer={customer}
                      suggestionTags={tagSuggestions}
                      disabled={crmActionsLocked}
                    />
                  ) : (
                    <p className="text-sm text-[var(--inbox-muted)]">Etiquetas disponíveis com Supabase configurado.</p>
                  )}
                </TabsContent>

                {showProdutosTab ? (
                  <TabsContent value="produtos" className="mt-0 focus-visible:outline-none">
                    <div className="rounded-[20px] border border-[var(--inbox-border)] bg-card/90 p-4 shadow-sm">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--inbox-muted-2)]">
                        Produtos
                      </p>
                      <div className="mt-3">
                        {documentsNegotiationId ? (
                          <NegotiationProductsEditor
                            negotiationId={documentsNegotiationId}
                            readOnly={crmActionsLocked}
                            negotiationTotalValue={linkedNegotiation?.totalValue}
                          />
                        ) : (
                          <p className="text-sm text-[var(--inbox-muted)]">
                            Crie ou vincule uma negociação a esta conversa para adicionar produtos ao lead.
                          </p>
                        )}
                      </div>
                    </div>
                  </TabsContent>
                ) : null}

                <TabsContent value="midia" className="mt-0 focus-visible:outline-none">
                  <CustomerMediaGallery messages={messages} />
                </TabsContent>

                {showArquivosTab ? (
                  <TabsContent value="arquivos" className="mt-0 focus-visible:outline-none">
                    {documentsNegotiationId ? (
                      <CrmNegotiationDocumentsSection
                        negotiationId={documentsNegotiationId}
                        enabled={open}
                        readOnly={crmActionsLocked}
                        className="border-[var(--inbox-border)]"
                      />
                    ) : (
                      <div className="rounded-[20px] border border-[var(--inbox-border)] bg-card/90 p-4 shadow-sm">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--inbox-muted-2)]">
                          Arquivos
                        </p>
                        <p className="mt-2 text-sm text-[var(--inbox-muted)]">
                          Crie ou vincule uma negociação a esta conversa para anexar documentos ao lead.
                        </p>
                      </div>
                    )}
                  </TabsContent>
                ) : null}
              </Tabs>
            ) : null}
          </div>
        </div>
      </SheetContent>
    </Sheet>

    <CustomerLeadSheet
      open={leadSheetOpen}
      disabled={crmActionsLocked}
      onOpenChange={(next) => {
        setLeadSheetOpen(next);
        if (!next) {
          setLeadPrefill(null);
        }
      }}
      initialOverrides={leadPrefill ?? undefined}
      loading={createCustomer.isPending}
      onSubmit={async (input) => {
        const created = await createCustomer.mutateAsync(input);
        if (chat && !chat.customerId) {
          try {
            await linkChat.mutateAsync({ chatId: chat.id, customerId: created.id });
            await ensureLead.mutateAsync({ chatId: chat.id }).catch(() => undefined);
            toast({
              title: "Cliente criado e vinculado",
              description: `${created.nome} foi associado a esta conversa.`,
            });
            useAppStore.getState().addNotification({
              tipo: "sucesso",
              titulo: "Cliente criado e vinculado",
              descricao: `${created.nome} foi associado a esta conversa.`,
            });
          } catch (e) {
            toast({
              title: "Cliente criado",
              description:
                e instanceof Error
                  ? `${e.message} Vincule manualmente em Clientes ou na busca acima.`
                  : "Nao foi possivel vincular automaticamente. Vincule manualmente.",
              variant: "destructive",
            });
            useAppStore.getState().addNotification({
              tipo: "erro",
              titulo: "Vinculo automatico falhou",
              descricao: e instanceof Error ? e.message : "Vincule o cliente manualmente.",
            });
          }
        } else {
          toast({
            title: "Cliente criado",
            description: `${created.nome} foi adicionado à base.`,
          });
          useAppStore.getState().addNotification({
            tipo: "sucesso",
            titulo: "Cliente criado",
            descricao: `${created.nome} foi adicionado à base.`,
          });
        }
        setLeadSheetOpen(false);
        setLeadPrefill(null);
      }}
    />
    <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir esta conversa?</AlertDialogTitle>
          <AlertDialogDescription>
            Todas as mensagens, notas, etiquetas e histórico desta conversa serão removidos
            permanentemente. O cadastro do cliente continua intacto. Essa ação não pode ser desfeita.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteChat.isPending}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            disabled={!chat || deleteChat.isPending}
            onClick={async (e) => {
              e.preventDefault();
              if (!chat) return;
              try {
                await deleteChat.mutateAsync({ chatId: chat.id });
                toast({ title: "Conversa excluída" });
                setDeleteConfirmOpen(false);
                onOpenChange(false);
                onChatDeleted?.(chat.id);
              } catch (err) {
                toast({
                  title: "Não foi possível excluir",
                  description: err instanceof Error ? err.message : "Erro inesperado.",
                  variant: "destructive",
                });
              }
            }}
            className="bg-[var(--crm-danger,#dc2626)] text-white hover:bg-[var(--crm-danger,#dc2626)]/90"
          >
            {deleteChat.isPending ? "Excluindo..." : "Excluir"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
