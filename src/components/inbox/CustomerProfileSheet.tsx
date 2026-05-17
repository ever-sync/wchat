import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowDownLeft, Plus, WalletCards, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { CrmSaleItemsPreview } from "@/components/crm/CrmSaleItemsPreview";
import { CustomerLeadSheet } from "@/components/customers/CustomerLeadSheet";
import { type CrmFunnel, DEFAULT_CRM_FUNNELS, funnelListNameIn, funnelStageTitleIn } from "@/data/crm-funnels";
import { useCrmNegotiationsForCustomer } from "@/lib/api/crm-negotiations";
import { useTenantCrmFunnelConfig } from "@/lib/api/crm-funnel-config";
import {
  toCustomerUpsertInput,
  useCreateCustomer,
  useCustomer,
  useCustomers,
  useDistinctCustomerTags,
  useUpdateCustomer,
} from "@/lib/api/customers";
import { useCustomerCreditSummary, useCustomerCredits, useCustomerSales, useReturns } from "@/lib/api/sales";
import { useEnsureLeadFromChat } from "@/lib/api/crm-lead";
import { useLinkWhatsappChatCustomer } from "@/lib/api/whatsapp";
import { ChatTagsPicker } from "@/components/inbox/ChatTagsPicker";
import { CUSTOMER_TAGS_SOURCE_KEY, parseCustomerTags, serializeCustomerTags } from "@/lib/customer-tags";
import { CRM_FUNNEL_ID_KEY, CRM_PIPELINE_STAGE_KEY } from "@/lib/crm-pipeline";
import { leadPrefillFromInboxChat, linkSearchHintFromInboxChat } from "@/lib/inbox-clientes-deeplink";
import { isMetaCdnLikelyToBlockInlineEmbed } from "@/lib/restricted-media-hosts";
import { isSupabaseConfigured } from "@/lib/supabase";
import {
  chatAssigneeBlockedMessage,
  negotiationAssigneeBlockedMessage,
} from "@/lib/crm/negotiation-assignee";
import { useToast } from "@/hooks/use-toast";
import { useAppStore } from "@/store/useAppStore";
import {
  SALE_PAYMENT_METHOD_LABELS,
  type CrmNegotiationStatus,
  type Customer,
  type InboxChat,
  type CustomerUpsertInput,
  type ReturnRecord,
  type WhatsappMessage,
} from "@/types/domain";

const statusConfig = {
  ativo: { label: "Ativo", className: "border-sky-200 bg-sky-100 text-sky-800" },
  inativo: { label: "Inativo", className: "border-amber-200 bg-amber-100 text-amber-700" },
  bloqueado: { label: "Bloqueado", className: "border-rose-200 bg-rose-100 text-rose-700" },
};

const perfilConfig = {
  A: "border-sky-200 bg-sky-100 text-sky-800",
  B: "border-sky-200 bg-sky-100 text-sky-800",
  C: "border-slate-200 bg-slate-100 text-slate-600",
};

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
  return (value ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
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

function customerTypeLabel(value?: string) {
  if (value === "pf") return "Pessoa fisica";
  if (value === "pj") return "Pessoa juridica";
  return "Nao informado";
}

function customerOriginLabel(value?: string) {
  if (value === "organico") return "Organico";
  if (value === "pago") return "Pago";
  return "Nao informado";
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

type CustomerSaleEvent = {
  id: string;
  timestamp: string;
  weekday: string;
  hour: string;
  products: string[];
  ticket: number | null;
  summary: string;
  source: "whatsapp" | "cadastro";
};

function isCustomerSaleEvent(item: CustomerSaleEvent | null): item is CustomerSaleEvent {
  return item !== null;
}

function normalizeMessageTimestamp(message: WhatsappMessage) {
  return message.receivedAt ?? message.sentAt ?? message.createdAt ?? null;
}

function parseCurrencyValues(text: string) {
  const matches = text.match(/R\$\s?\d{1,3}(?:\.\d{3})*,\d{2}/g) ?? [];
  return matches
    .map((value) => value.replace("R$", "").replace(/\s/g, "").replace(/\./g, "").replace(",", "."))
    .map((normalized) => Number(normalized))
    .filter((value) => Number.isFinite(value));
}

function extractProducts(text: string) {
  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const fromMarker = lines
    .filter((line) => line.startsWith("📦"))
    .map((line) => line.replace("📦", "").trim())
    .filter(Boolean);

  if (fromMarker.length > 0) {
    return Array.from(new Set(fromMarker));
  }

  const productHints = [
    "tela",
    "bateria",
    "display",
    "incell",
    "oled",
    "carregador",
    "pelicula",
    "wefix",
    "weekeep",
  ];

  const lower = text.toLowerCase();
  return productHints.filter((hint) => lower.includes(hint));
}

function formatWeekday(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date
    .toLocaleDateString("pt-BR", { weekday: "short" })
    .replace(".", "")
    .toLowerCase();
}

function formatHour(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "--:--";
  }

  return date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

function buildSalesHistory(messages: WhatsappMessage[], customerTicket?: number, customerLastOrder?: string): CustomerSaleEvent[] {
  const saleSignals = [
    "pedido",
    "compra",
    "valor",
    "preco",
    "entrega",
    "pagamento",
    "boleto",
    "pix",
    "orcamento",
    "produto",
  ];

  const history = messages
    .filter((message) => message.direction === "outbound")
    .map((message) => {
      const timestamp = normalizeMessageTimestamp(message);
      const body = message.bodyText?.trim() ?? "";
      if (!timestamp || !body) {
        return null;
      }

      const lower = body.toLowerCase();
      const hasSignal = saleSignals.some((signal) => lower.includes(signal));
      const ticketCandidates = parseCurrencyValues(body);
      const products = extractProducts(body);
      const hasSaleEvidence = hasSignal || ticketCandidates.length > 0 || products.length > 0;

      if (!hasSaleEvidence) {
        return null;
      }

      const saleEvent: CustomerSaleEvent = {
        id: message.id,
        timestamp,
        weekday: formatWeekday(timestamp),
        hour: formatHour(timestamp),
        products,
        ticket: ticketCandidates[0] ?? null,
        summary: body.slice(0, 120),
        source: "whatsapp" as const,
      };

      return saleEvent;
    })
    .filter(isCustomerSaleEvent)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  if (history.length > 0) {
    return history.slice(0, 30);
  }

  if (customerLastOrder) {
    return [
      {
        id: "fallback-last-order",
        timestamp: `${customerLastOrder}T12:00:00.000Z`,
        weekday: formatWeekday(`${customerLastOrder}T12:00:00.000Z`),
        hour: "12:00",
        products: [],
        ticket: customerTicket && customerTicket > 0 ? customerTicket : null,
        summary: "Registro de ultimo pedido vindo do cadastro do cliente.",
        source: "cadastro" as const,
      },
    ];
  }

  return [];
}

function creditMovementLabel(type: "credit_from_return" | "debit_usage") {
  return type === "credit_from_return" ? "Entrada (devolucao)" : "Saida (uso em venda)";
}

function returnSourceLabel(source: ReturnRecord["source"]) {
  return source === "existing_sale" ? "Venda vinculada" : "Outra venda";
}

function returnResolutionLabel(resolution: ReturnRecord["resolution"]) {
  return resolution === "credito" ? "Credito futuro" : "Troca";
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
    <div className="rounded-[20px] border border-[#e1e8dc] bg-white/90 p-4 shadow-sm">
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#96a29c]">Tags</p>
      <div className="mt-2 flex min-h-[36px] flex-wrap gap-2">
        {tags.map((t) => (
          <span
            key={t}
            className="inline-flex items-center gap-1 rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 text-xs font-medium text-violet-900"
          >
            {t}
            <button
              type="button"
              className="rounded-full p-0.5 hover:bg-violet-200/80"
              aria-label={`Remover tag ${t}`}
              disabled={isBusy}
              onClick={() => void commit(tags.filter((x) => x !== t))}
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        {tags.length === 0 ? <span className="text-sm text-[#8a9690]">Nenhuma tag.</span> : null}
      </div>
      <div className="mt-3 space-y-2">
        <Label className="text-xs text-[#6f7b76]">Adicionar tag já usada na base</Label>
        {addable.length === 0 ? (
          <p className="text-xs text-[#8a9690]">Nenhuma outra tag conhecida além das já aplicadas.</p>
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
            <SelectTrigger className="h-9 rounded-xl border-[#dfe6d8] bg-white">
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
            className="h-9 flex-1 rounded-xl border-[#dfe6d8] bg-white"
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

function ProfilePipelineSelects({
  customer,
  funnels,
  readOnly = false,
}: {
  customer: Customer;
  funnels: CrmFunnel[];
  readOnly?: boolean;
}) {
  const { toast } = useToast();
  const updateCustomer = useUpdateCustomer();
  const storedFunnel = customer.sourceColumns?.[CRM_FUNNEL_ID_KEY]?.trim() ?? "";
  const storedStage = customer.sourceColumns?.[CRM_PIPELINE_STAGE_KEY]?.trim() ?? "";
  const funnelOk = Boolean(storedFunnel && funnels.some((f) => f.id === storedFunnel));
  const currentFunnel = funnelOk ? funnels.find((f) => f.id === storedFunnel)! : null;
  const stageOk = Boolean(
    currentFunnel && storedStage && currentFunnel.stages.some((s) => s.id === storedStage),
  );

  const persist = async (funnelId: string, stageId: string) => {
    if (readOnly) {
      toast({
        title: "Assuma o negócio",
        description: negotiationAssigneeBlockedMessage(),
        variant: "destructive",
      });
      return;
    }
    try {
      await updateCustomer.mutateAsync({
        id: customer.id,
        input: {
          ...toCustomerUpsertInput(customer),
          sourceColumns: {
            ...customer.sourceColumns,
            [CRM_FUNNEL_ID_KEY]: funnelId,
            [CRM_PIPELINE_STAGE_KEY]: stageId,
          },
        },
      });
    } catch (e) {
      toast({
        title: "Erro ao salvar funil",
        description: e instanceof Error ? e.message : "Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const funnelSelectValue = funnelOk ? storedFunnel : FUNNEL_NONE;
  const stages = currentFunnel?.stages ?? [];
  const stageSelectValue = stageOk ? storedStage : FUNNEL_NONE;

  return (
    <div className="rounded-[20px] border border-[#e1e8dc] bg-white/90 p-4 shadow-sm">
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#96a29c]">CRM · Funil e etapa</p>
      <p className="mt-1 text-xs text-[#6f7b76]">Refletem no Kanban e negociações vinculadas a este cadastro.</p>
      <div className="mt-3 space-y-3">
        <div className="space-y-1">
          <Label htmlFor="inbox-profile-funnel" className="text-xs text-[#5f6d66]">
            Pipeline
          </Label>
          <Select
            value={funnelSelectValue}
            disabled={readOnly}
            onValueChange={(fid) => {
              if (fid === FUNNEL_NONE) {
                return;
              }
              const f = funnels.find((x) => x.id === fid);
              const first = f?.stages[0]?.id ?? "";
              void persist(fid, first);
            }}
          >
            <SelectTrigger id="inbox-profile-funnel" className="rounded-xl border-[#dfe6d8] bg-white">
              <SelectValue placeholder="Selecionar funil" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={FUNNEL_NONE} disabled className="text-muted-foreground">
                Selecionar funil…
              </SelectItem>
              {funnels.map((f) => (
                <SelectItem key={f.id} value={f.id}>
                  {f.listName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="inbox-profile-stage" className="text-xs text-[#5f6d66]">
            Etapa
          </Label>
          <Select
            value={stageSelectValue}
            disabled={readOnly || !funnelOk || stages.length === 0}
            onValueChange={(sid) => {
              if (sid === FUNNEL_NONE || !funnelOk) {
                return;
              }
              void persist(storedFunnel, sid);
            }}
          >
            <SelectTrigger id="inbox-profile-stage" className="rounded-xl border-[#dfe6d8] bg-white">
              <SelectValue placeholder="Selecionar etapa" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={FUNNEL_NONE} disabled className="text-muted-foreground">
                Selecionar etapa…
              </SelectItem>
              {stages.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}

function CustomerQuickFacts({
  customer,
  chat,
  messageCount,
}: {
  customer: Customer;
  chat: InboxChat | null;
  messageCount: number;
}) {
  const phone = customer.telefone || chat?.remotePhoneE164 || chat?.remotePhoneDigits || chat?.remoteJid || "";
  const row = (label: string, value: string) => (
    <div className="flex justify-between gap-3 text-sm">
      <span className="shrink-0 text-[#6f7b76]">{label}</span>
      <span className="min-w-0 break-words text-right font-medium text-[#334047]">{value}</span>
    </div>
  );

  return (
    <div className="rounded-[20px] border border-[#e1e8dc] bg-white/90 p-4 shadow-sm">
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#96a29c]">Dados do cliente</p>
      <div className="mt-3 space-y-2">
        {row("Nome", infoValue(customer.nome))}
        {row("Código", infoValue(customer.codigo))}
        {row("Telefone", infoValue(phone))}
        {row("E-mail", infoValue(customer.email))}
        {row("Cidade", infoValue([customer.cidade, customer.estado].filter(Boolean).join(" / ")))}
        {row("Responsável", infoValue(customer.vendedor))}
        {row("Cadastro", formatDate(customer.cadastradoEm))}
        {chat
          ? row("Mensagens (esta conversa)", String(messageCount))
          : null}
        {chat ? row("Último contato", formatDateTime(chat.lastMessageAt)) : null}
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
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  chat: InboxChat | null;
  messages: WhatsappMessage[];
  /** Atendente sem conversa/negócio assumidos: bloqueia CRM e vínculos. */
  crmActionsLocked?: boolean;
}) {
  const { data: customer } = useCustomer(chat?.customerId ?? undefined, { enabled: Boolean(chat?.customerId) });
  const { data: creditSummary } = useCustomerCreditSummary(chat?.customerId ?? undefined, {
    enabled: Boolean(chat?.customerId),
  });
  const crmEnabled = Boolean(open && chat?.customerId && isSupabaseConfigured);
  const { data: crmSales = [], isLoading: crmSalesLoading } = useCustomerSales(chat?.customerId, { limit: 25 }, {
    enabled: crmEnabled,
  });
  const { data: crmCredits = [], isLoading: crmCreditsLoading } = useCustomerCredits(
    { customerId: chat?.customerId, limit: 50 },
    { enabled: crmEnabled },
  );
  const { data: crmReturns = [], isLoading: crmReturnsLoading } = useReturns(
    { customerId: chat?.customerId, limit: 50 },
    { enabled: crmEnabled },
  );

  const { toast } = useToast();
  const { data: negotiations = [], isLoading: negLoading } = useCrmNegotiationsForCustomer(customer?.id, {
    enabled: Boolean(open && customer?.id && isSupabaseConfigured),
  });
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
  const salesHistory = buildSalesHistory(messages, customer?.ticketMedio, customer?.ultimoPedido);
  const displayName = customer?.nome ?? chat?.customerName ?? chat?.displayName ?? "Cliente";
  const initials = getInitials(displayName || "CL");

  return (
    <>
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-[92vw] overflow-y-auto border-l border-[#dde5d7] bg-[linear-gradient(180deg,#fbfcf9_0%,#f4f7f5_100%)] p-0 sm:max-w-[520px]"
      >
        <div className="flex min-h-full flex-col">
          <SheetHeader className="border-b border-[#F9F6FD] px-6 pb-5 pt-6">
            <div className="flex items-start gap-4">
              <Avatar className="h-20 w-20 border-4 border-white shadow-[0_18px_32px_rgba(84,95,101,0.12)]">
                <AvatarImage
                  src={
                    chat?.avatarUrl && !isMetaCdnLikelyToBlockInlineEmbed(chat.avatarUrl)
                      ? chat.avatarUrl
                      : undefined
                  }
                  alt={displayName}
                  className="object-cover"
                />
                <AvatarFallback className="bg-gradient-to-br from-sky-100 via-sky-50 to-sky-200 text-2xl font-bold text-sky-800">
                  {initials}
                </AvatarFallback>
              </Avatar>

              <div className="min-w-0 flex-1 pt-1">
                <SheetTitle className="truncate text-[30px] font-semibold tracking-[-0.03em] text-[#334047]">
                  {displayName}
                </SheetTitle>
                <SheetDescription className="mt-2 text-sm text-[#6a7671]">
                  {customer
                    ? `${customerTypeLabel(customer.tipo)} · Codigo ${infoValue(customer.codigo)} · Origem ${customerOriginLabel(customer.origem)}`
                    : infoValue(chat?.remotePhoneE164 ?? chat?.remotePhoneDigits ?? chat?.remoteJid)}
                </SheetDescription>

                <div className="mt-3 flex flex-wrap gap-2">
                  {customer ? (
                    <>
                      <Badge className={`border ${perfilConfig[customer.perfil]}`}>Perfil {customer.perfil}</Badge>
                      <Badge className={`border ${statusConfig[customer.status].className}`}>{statusConfig[customer.status].label}</Badge>
                    </>
                  ) : (
                    <Badge className="border border-sky-200 bg-sky-100 text-sky-700">Sem cadastro completo</Badge>
                  )}
                </div>
              </div>
            </div>
          </SheetHeader>

          <div className="px-6 py-5">
            {crmActionsLocked ? (
              <p className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
                {negotiationAssigneeBlockedMessage()}
              </p>
            ) : null}
            {chat && !chat.customerId ? (
              <div className="mb-5 rounded-[28px] border border-amber-200/80 bg-amber-50/50 p-4 shadow-[0_16px_28px_rgba(84,95,101,0.06)]">
                <p className="text-sm font-semibold text-[#334047]">Conversa sem cliente vinculado</p>
                <p className="mt-1 text-xs leading-relaxed text-[#5f6d66]">
                  Busque o cadastro pelo nome, telefone ou documento e vincule para ver CRM, credito e campos completos no perfil.
                </p>
                {!isSupabaseConfigured ? (
                  <p className="mt-2 text-xs text-amber-900">Configure o Supabase para vincular conversas a clientes.</p>
                ) : (
                  <>
                    <Input
                      value={linkSearch}
                      onChange={(e) => setLinkSearch(e.target.value)}
                      placeholder="Digite pelo menos 2 caracteres..."
                      className="mt-3 h-10 rounded-xl border-[#e1e8dc] bg-white"
                      autoComplete="off"
                    />
                    {linkSearch.trim().length < 2 ? (
                      <p className="mt-2 text-xs text-[#6f7b76]">Continue digitando para buscar cadastros.</p>
                    ) : customersForLink.length === 0 ? (
                      <p className="mt-2 text-xs text-[#6f7b76]">Nenhum cliente encontrado.</p>
                    ) : (
                      <ul className="mt-2 max-h-48 space-y-1 overflow-y-auto rounded-xl border border-[#e1e8dc] bg-white p-2">
                        {customersForLink.slice(0, 8).map((c) => (
                          <li key={c.id}>
                            <button
                              type="button"
                              className="flex w-full items-center justify-between gap-2 rounded-lg px-2 py-2 text-left text-sm text-[#334047] hover:bg-[#f4f7f5] disabled:opacity-50"
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
                              <span className="shrink-0 text-xs text-[#6f7b76]">
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

            {chat && !customer && isSupabaseConfigured ? (
              <div className="mb-5">
                <ChatTagsPicker chatId={chat.id} tags={chat.tags ?? []} disabled={crmActionsLocked} />
              </div>
            ) : null}

            {customer && chat ? (
              <div className="space-y-5">
                <CustomerQuickFacts customer={customer} chat={chat} messageCount={totalMessages} />
                {isSupabaseConfigured ? (
                  <ChatTagsPicker chatId={chat.id} tags={chat.tags ?? []} disabled={crmActionsLocked} />
                ) : (
                  <ProfileTagsPicker
                    customer={customer}
                    suggestionTags={tagSuggestions}
                    disabled={crmActionsLocked}
                  />
                )}
                {isSupabaseConfigured ? (
                  <ProfilePipelineSelects
                    customer={customer}
                    funnels={effectiveCrmFunnels}
                    readOnly={crmActionsLocked}
                  />
                ) : null}
                {isSupabaseConfigured ? (
                  <div className="rounded-[20px] border border-[#e1e8dc] bg-white/90 p-4 shadow-sm">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#96a29c]">Negociações</p>
                    {negLoading ? (
                      <p className="mt-2 text-sm text-[#6f7b76]">Carregando…</p>
                    ) : negotiations.length === 0 ? (
                      <p className="mt-2 text-sm text-[#6f7b76]">Nenhuma negociação vinculada.</p>
                    ) : (
                      <ul className="mt-2 space-y-2">
                        {negotiations.slice(0, 5).map((n) => (
                          <li
                            key={n.id}
                            className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-[#e8eee8] bg-[#fbfcf9] px-3 py-2 text-sm"
                          >
                            <div className="min-w-0 flex-1">
                              <p className="truncate font-medium text-[#334047]">{n.title.trim() || "Sem título"}</p>
                              <p className="text-xs text-[#6f7b76]">
                                {funnelListNameIn(effectiveCrmFunnels, n.funnelId)} ·{" "}
                                {funnelStageTitleIn(effectiveCrmFunnels, n.funnelId, n.stageId)} ·{" "}
                                {negotiationStatusLabelPt(n.status)}
                                {n.totalValue > 0 ? <> · {formatMoney(n.totalValue)}</> : null}
                              </p>
                            </div>
                            {isUuidString(n.id) ? (
                              <Button asChild variant="outline" size="sm" className="shrink-0 rounded-xl text-xs">
                                <Link to={`/crm/negociacao/${encodeURIComponent(n.id)}`}>Abrir</Link>
                              </Button>
                            ) : null}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ) : null}
                <div className="flex flex-wrap gap-2">
                  <Button asChild variant="secondary" size="sm" className="rounded-xl">
                    <Link to={`/clientes/${customer.id}`}>Perfil completo</Link>
                  </Button>
                  <Button asChild variant="secondary" size="sm" className="rounded-xl">
                    <Link to="/crm">Abrir CRM</Link>
                  </Button>
                </div>

                <div className="space-y-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#96a29c]">Histórico</p>
                  {isSupabaseConfigured ? (
                    <p className="text-sm text-[#5f6d66]">
                      <span className="font-semibold text-[#334047]">Crédito:</span>{" "}
                      {formatMoney(creditSummary?.totalCredit ?? 0)}
                    </p>
                  ) : null}
                  {chat?.lastMessagePreview?.trim() ? (
                    <Card className="overflow-hidden border-border/60 bg-card/90 shadow-sm">
                      <CardHeader className="border-b border-border/60 bg-secondary/30 py-3">
                        <CardTitle className="text-sm font-medium text-foreground">Última mensagem</CardTitle>
                      </CardHeader>
                      <CardContent className="p-3">
                        <p className="text-sm leading-relaxed text-slate-700">{chat.lastMessagePreview.trim()}</p>
                      </CardContent>
                    </Card>
                  ) : null}
                  {isSupabaseConfigured && chat?.customerId ? (
                    <div className="grid gap-4">
                      <Card className="overflow-hidden border-border/60 bg-card/90 shadow-sm">
                        <CardHeader className="border-b border-border/60 bg-secondary/30 pb-3">
                          <CardTitle className="flex items-center gap-2 text-sm font-medium text-foreground">
                            <WalletCards className="h-4 w-4 shrink-0" />
                            Vendas no CRM
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4">
                          {crmSalesLoading ? (
                            <p className="text-sm text-muted-foreground">Carregando vendas...</p>
                          ) : crmSales.length === 0 ? (
                            <p className="text-sm text-muted-foreground">Nenhuma venda registrada.</p>
                          ) : (
                            <ul className="space-y-3">
                              {crmSales.map((sale) => (
                                <li key={sale.id} className="rounded-2xl border border-border/60 bg-background/90 p-3 text-sm">
                                  <div className="flex flex-wrap items-center justify-between gap-2">
                                    <p className="font-semibold text-foreground">{formatDateTime(sale.soldAt)}</p>
                                    <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-700">
                                      {SALE_PAYMENT_METHOD_LABELS[sale.paymentMethod]}
                                    </Badge>
                                  </div>
                                  <CrmSaleItemsPreview
                                    items={sale.items}
                                    maxVisible={3}
                                    formatLine={(item) => ` · ${formatMoney(item.unitPrice * item.quantity)}`}
                                  />
                                  <p className="mt-2 font-medium text-foreground">Total {formatMoney(sale.totalAmount)}</p>
                                  {sale.notes ? <p className="mt-2 text-xs leading-relaxed text-slate-600">{sale.notes}</p> : null}
                                </li>
                              ))}
                            </ul>
                          )}
                        </CardContent>
                      </Card>

                      <Card className="overflow-hidden border-border/60 bg-card/90 shadow-sm">
                        <CardHeader className="border-b border-border/60 bg-secondary/30 pb-3">
                          <CardTitle className="flex items-center gap-2 text-sm font-medium text-foreground">
                            <ArrowDownLeft className="h-4 w-4 shrink-0" />
                            Devoluções no CRM
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4">
                          {crmReturnsLoading ? (
                            <p className="text-sm text-muted-foreground">Carregando devoluções...</p>
                          ) : crmReturns.length === 0 ? (
                            <p className="text-sm text-muted-foreground">Nenhuma devolução registrada.</p>
                          ) : (
                            <ul className="space-y-3">
                              {crmReturns.map((row) => (
                                <li
                                  key={row.id}
                                  className="rounded-2xl border border-border/60 bg-background/90 p-3 text-sm"
                                >
                                  <div className="flex flex-wrap items-center justify-between gap-2">
                                    <p className="font-semibold text-foreground">{formatDateTime(row.returnedAt)}</p>
                                    <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-700">
                                      {returnResolutionLabel(row.resolution)}
                                    </Badge>
                                  </div>
                                  <p className="mt-2 font-medium text-foreground">
                                    {row.productName?.trim() || "Produto não informado"}
                                  </p>
                                  <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                                    <span>
                                      Qtd.{" "}
                                      <span className="font-medium text-foreground">
                                        {row.quantity.toLocaleString("pt-BR", { maximumFractionDigits: 3 })}
                                      </span>
                                    </span>
                                    <span>
                                      Valor{" "}
                                      <span className="font-medium text-foreground">{formatMoney(row.amount)}</span>
                                    </span>
                                    <span>{returnSourceLabel(row.source)}</span>
                                    {row.usedCustomPrice ? (
                                      <span className="text-amber-800">Valor informado manualmente</span>
                                    ) : null}
                                  </div>
                                  {row.notes?.trim() ? (
                                    <p className="mt-2 text-xs leading-relaxed text-slate-600">{row.notes}</p>
                                  ) : null}
                                  {row.saleId ? (
                                    <p className="mt-2 text-xs text-muted-foreground">
                                      Pedido: <span className="font-mono text-foreground">{row.saleId}</span>
                                    </p>
                                  ) : null}
                                </li>
                              ))}
                            </ul>
                          )}
                        </CardContent>
                      </Card>

                      <Card className="overflow-hidden border-border/60 bg-card/90 shadow-sm">
                        <CardHeader className="border-b border-border/60 bg-secondary/30 pb-3">
                          <CardTitle className="text-sm font-medium text-foreground">Histórico de crédito</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4">
                          {crmCreditsLoading ? (
                            <p className="text-sm text-muted-foreground">Carregando lançamentos...</p>
                          ) : crmCredits.length === 0 ? (
                            <p className="text-sm text-muted-foreground">Sem movimentos de saldo.</p>
                          ) : (
                            <ul className="space-y-3">
                              {crmCredits.map((row) => (
                                <li
                                  key={row.id}
                                  className="flex flex-wrap items-start justify-between gap-3 rounded-2xl border border-border/60 bg-background/90 p-3 text-sm"
                                >
                                  <div className="min-w-0 flex-1">
                                    <Badge
                                      className={
                                        row.type === "credit_from_return"
                                          ? "border-sky-200 bg-sky-100 text-sky-900"
                                          : "border-amber-200 bg-amber-100 text-amber-900"
                                      }
                                    >
                                      {creditMovementLabel(row.type)}
                                    </Badge>
                                    <p className="mt-2 text-xs text-muted-foreground">{formatDateTime(row.createdAt)}</p>
                                    {row.description ? (
                                      <p className="mt-1 text-xs leading-relaxed text-slate-600">{row.description}</p>
                                    ) : null}
                                  </div>
                                  <p
                                    className={`shrink-0 font-semibold tabular-nums ${
                                      row.type === "credit_from_return" ? "text-sky-800" : "text-amber-900"
                                    }`}
                                  >
                                    {row.type === "credit_from_return" ? "+" : "-"}
                                    {formatMoney(row.amount)}
                                  </p>
                                </li>
                              ))}
                            </ul>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  ) : isSupabaseConfigured ? (
                    <Card className="overflow-hidden border-dashed border-border/80 bg-card/40 shadow-sm">
                      <CardContent className="p-4 text-sm text-muted-foreground">
                        Associe um cliente para ver vendas e créditos do CRM aqui.
                      </CardContent>
                    </Card>
                  ) : null}

                  <Card className="overflow-hidden border-border/60 bg-card/90 shadow-sm">
                    <CardHeader className="border-b border-border/60 bg-secondary/30 pb-3">
                      <CardTitle className="text-sm font-medium text-foreground">Sinais de venda na conversa</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 p-4">
                      {salesHistory.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                          Nenhum trecho de venda identificado nas mensagens enviadas.
                        </p>
                      ) : (
                        salesHistory.map((event) => (
                          <div key={event.id} className="rounded-2xl border border-border/60 bg-background/90 p-3">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <p className="text-sm font-semibold text-foreground">{formatDateTime(event.timestamp)}</p>
                              <Badge className="border border-slate-200 bg-slate-100 text-slate-700">
                                {event.source === "cadastro" ? "Cadastro" : "WhatsApp"}
                              </Badge>
                            </div>
                            <div className="mt-2 grid gap-2 text-xs text-muted-foreground md:grid-cols-2">
                              <p>
                                Dia: <span className="font-medium text-foreground">{event.weekday}</span>
                              </p>
                              <p>
                                Horário: <span className="font-medium text-foreground">{event.hour}</span>
                              </p>
                              <p>
                                Produtos:{" "}
                                <span className="font-medium text-foreground">
                                  {event.products.join(", ") || "Não identificado"}
                                </span>
                              </p>
                              <p>
                                Ticket:{" "}
                                <span className="font-medium text-foreground">
                                  {event.ticket ? formatMoney(event.ticket) : "Não identificado"}
                                </span>
                              </p>
                            </div>
                            <p className="mt-2 text-xs text-slate-600">{event.summary}</p>
                          </div>
                        ))
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
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
    </>
  );
}
