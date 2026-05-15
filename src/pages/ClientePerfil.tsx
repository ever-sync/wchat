import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  ArrowDownLeft,
  Calendar,
  Mail,
  MessageSquare,
  ScanText,
  WalletCards,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClienteRdPerfilView } from "@/components/cliente/ClienteRdPerfilView";
import { useAuth } from "@/hooks/useAuth";
import { CustomerFormDialog } from "@/components/customers/CustomerFormDialog";
import { CrmSaleItemsPreview } from "@/components/crm/CrmSaleItemsPreview";
import { useCustomer, useUpdateCustomer } from "@/lib/api/customers";
import { useCrmActivitiesForCustomer } from "@/lib/api/crm-activities";
import {
  useCreateCrmTask,
  useCrmTasksForCustomer,
  useDeleteCrmTask,
  useUpdateCrmTask,
} from "@/lib/api/crm-tasks";
import {
  buildPipelineLabels,
  CRM_PIPELINE_STAGE_KEY,
  getPipelineStateForCustomer,
  pipelineStageKeyFromIndex,
} from "@/lib/crm-pipeline";
import {
  useCustomerCredits,
  useCustomerCreditSummary,
  useCustomerSales,
  useReturns,
} from "@/lib/api/sales";
import { useTenantCollaborators } from "@/lib/api/settings";
import { fetchAllInboxMessages, useInboxChats } from "@/lib/api/whatsapp";
import { isSupabaseConfigured } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { useAppStore } from "@/store/useAppStore";
import type { Customer, InboxChat, ReturnRecord, WhatsappMessage } from "@/types/domain";
import { SALE_PAYMENT_METHOD_LABELS } from "@/types/domain";

const CRM_TASK_FORM_ASSIGNEE_NONE = "__none__";

function formatMoney(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatDate(value?: string) {
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

function creditMovementLabel(type: "credit_from_return" | "debit_usage") {
  return type === "credit_from_return" ? "Entrada (devolucao)" : "Saida (uso em venda)";
}

function returnSourceLabel(source: ReturnRecord["source"]) {
  return source === "existing_sale" ? "Venda vinculada" : "Outra venda";
}

function returnResolutionLabel(resolution: ReturnRecord["resolution"]) {
  return resolution === "credito" ? "Credito futuro" : "Troca";
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

function normalizeDigits(value?: string | null) {
  return value?.replace(/\D/g, "") ?? "";
}

function digitsMatch(left?: string | null, right?: string | null) {
  const leftDigits = normalizeDigits(left);
  const rightDigits = normalizeDigits(right);

  if (!leftDigits || !rightDigits) {
    return false;
  }

  return (
    leftDigits === rightDigits ||
    leftDigits === rightDigits.replace(/^55/, "") ||
    rightDigits === leftDigits.replace(/^55/, "") ||
    leftDigits.endsWith(rightDigits) ||
    rightDigits.endsWith(leftDigits)
  );
}

function findCustomerChat(chats: InboxChat[] | undefined, customer?: Customer | null) {
  if (!customer || !chats?.length) {
    return null;
  }

  return (
    chats.find((chat) => chat.customerId === customer.id) ??
    chats.find((chat) => chat.remoteJid === customer.phoneJid) ??
    chats.find((chat) => digitsMatch(chat.remotePhoneDigits, customer.phoneDigits)) ??
    chats.find((chat) => digitsMatch(chat.remotePhoneE164, customer.phoneE164)) ??
    null
  );
}

function qualificationFromPerfil(perfil: string) {
  if (perfil === "A") return 3;
  if (perfil === "B") return 2;
  return 1;
}

function countMonthlyConversationStarts(messages: WhatsappMessage[]) {
  if (messages.length === 0) {
    return 0;
  }

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const firstMessageByDay = new Map<string, { direction: string; timestamp: number }>();

  for (const message of messages) {
    const sourceDate = message.receivedAt ?? message.sentAt ?? message.createdAt;
    const timestamp = new Date(sourceDate ?? "").getTime();
    if (Number.isNaN(timestamp)) {
      continue;
    }

    const messageDate = new Date(timestamp);
    if (messageDate.getFullYear() !== currentYear || messageDate.getMonth() !== currentMonth) {
      continue;
    }

    const dayKey = messageDate.toISOString().slice(0, 10);
    const current = firstMessageByDay.get(dayKey);

    if (!current || timestamp < current.timestamp) {
      firstMessageByDay.set(dayKey, {
        direction: message.direction,
        timestamp,
      });
    }
  }

  return Array.from(firstMessageByDay.values()).filter((entry) => entry.direction === "inbound").length;
}

function InfoGridCard({
  title,
  items,
  className = "",
}: {
  title: string;
  items: Array<{ label: string; value: string }>;
  className?: string;
}) {
  return (
    <Card className={`overflow-hidden border-border/60 bg-card/80 shadow-sm ${className}`}>
      <CardHeader className="border-b border-border/60 bg-secondary/30 pb-3">
        <CardTitle className="text-sm font-medium text-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 p-4 md:grid-cols-2">
        {items.map((item) => (
          <div key={item.label} className="rounded-2xl border border-border/50 bg-background/70 p-3">
            <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{item.label}</p>
            <p className="mt-1 text-sm font-medium text-foreground">{item.value}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function toCustomerInput(customer: Customer, status = customer.status) {
  return {
    codigo: customer.codigo,
    origem: customer.origem,
    nome: customer.nome,
    telefone: customer.telefone,
    celular: customer.celular,
    email: customer.email,
    cnpj: customer.cnpj,
    endereco: customer.endereco,
    perfil: customer.perfil,
    rota: customer.rota,
    status,
    vendedor: customer.vendedor,
    ultimoPedido: customer.ultimoPedido,
    ticketMedio: customer.ticketMedio,
    frequenciaCompra: customer.frequenciaCompra,
    totalGasto: customer.totalGasto,
    tipo: customer.tipo,
    razaoSocial: customer.razaoSocial,
    inscricaoEstadual: customer.inscricaoEstadual,
    inscricaoMunicipal: customer.inscricaoMunicipal,
    cpf: customer.cpf,
    rg: customer.rg,
    nascimento: customer.nascimento,
    nomeSocial: customer.nomeSocial,
    fax: customer.fax,
    canal: customer.canal,
    cep: customer.cep,
    logradouro: customer.logradouro,
    numero: customer.numero,
    bairro: customer.bairro,
    zone: customer.zone,
    complemento: customer.complemento,
    cidade: customer.cidade,
    estado: customer.estado,
    ativo: customer.ativo,
    observacoes: customer.observacoes,
    cadastradoEm: customer.cadastradoEm,
    sourceColumns: customer.sourceColumns,
  };
}

export default function ClientePerfil() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  const { profile } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDueLocal, setTaskDueLocal] = useState("");
  const [taskNotes, setTaskNotes] = useState("");
  const [taskAssigneeId, setTaskAssigneeId] = useState("");
  const taskAssigneeDefaultSeededRef = useRef(false);
  const { data: cliente, isLoading, error } = useCustomer(id);

  useEffect(() => {
    if (!cliente || searchParams.get("copoPersonalizado") !== "1") {
      return;
    }
    setDialogOpen(true);
    toast({
      title: "Copo personalizado",
      description: "Use o cadastro para anotar detalhes do pedido ou fale com o cliente pelo WhatsApp.",
    });
    const next = new URLSearchParams(searchParams);
    next.delete("copoPersonalizado");
    setSearchParams(next, { replace: true });
  }, [cliente, searchParams, setSearchParams, toast]);

  useEffect(() => {
    if (taskDialogOpen) {
      return;
    }
    setTaskTitle("");
    setTaskDueLocal("");
    setTaskNotes("");
    setTaskAssigneeId("");
  }, [taskDialogOpen]);

  const crmEnabled = Boolean(id && isSupabaseConfigured);
  const { data: tenantCollaborators = [] } = useTenantCollaborators({ enabled: crmEnabled });
  const crmTaskAssignees = useMemo(
    () => tenantCollaborators.map((p) => ({ id: p.id, nome: p.nome })),
    [tenantCollaborators],
  );

  useEffect(() => {
    if (!taskDialogOpen) {
      taskAssigneeDefaultSeededRef.current = false;
      return;
    }
    if (taskAssigneeDefaultSeededRef.current || !crmTaskAssignees.length) {
      return;
    }
    taskAssigneeDefaultSeededRef.current = true;
    const me = profile?.id?.trim();
    if (me && crmTaskAssignees.some((a) => a.id === me)) {
      setTaskAssigneeId(me);
    } else {
      setTaskAssigneeId("");
    }
  }, [taskDialogOpen, profile?.id, crmTaskAssignees]);
  const { data: crmTasksRaw = [], isLoading: crmTasksLoading } = useCrmTasksForCustomer(id, {
    enabled: crmEnabled,
  });
  const { data: crmActivities = [], isLoading: crmActivitiesLoading } = useCrmActivitiesForCustomer(id);
  const crmOpenTasksList = useMemo(
    () => crmTasksRaw.filter((t) => t.status === "aberta"),
    [crmTasksRaw],
  );
  const crmCompletedTasksList = useMemo(() => {
    return [...crmTasksRaw]
      .filter((t) => t.status === "concluida")
      .sort((a, b) => {
        const ua = new Date(a.updatedAt).getTime();
        const ub = new Date(b.updatedAt).getTime();
        return (Number.isNaN(ub) ? 0 : ub) - (Number.isNaN(ua) ? 0 : ua);
      });
  }, [crmTasksRaw]);
  const createCrmTask = useCreateCrmTask();
  const updateCrmTask = useUpdateCrmTask();
  const deleteCrmTask = useDeleteCrmTask();
  const { data: crmSales = [], isLoading: crmSalesLoading } = useCustomerSales(id, { limit: 40 }, {
    enabled: crmEnabled,
  });
  const { data: crmReturns = [], isLoading: crmReturnsLoading } = useReturns(
    { customerId: id, limit: 50 },
    { enabled: crmEnabled },
  );
  const { data: crmCredits = [], isLoading: crmCreditsLoading } = useCustomerCredits(
    { customerId: id, limit: 50 },
    { enabled: crmEnabled },
  );
  const { data: creditSummary } = useCustomerCreditSummary(id, { enabled: crmEnabled });

  const updateCustomer = useUpdateCustomer();
  const { data: chats = [] } = useInboxChats(
    { status: "all" },
    { enabled: Boolean(cliente) },
  );

  const customerChat = useMemo(() => findCustomerChat(chats, cliente), [chats, cliente]);
  const { data: messages = [] } = useQuery({
    queryKey: ["inbox-messages-all", customerChat?.id],
    queryFn: () => fetchAllInboxMessages(customerChat!.id),
    enabled: Boolean(customerChat?.id),
    staleTime: 60_000,
  });
  const totalMessages = messages.length;
  const conversationStartsThisMonth = useMemo(() => countMonthlyConversationStarts(messages), [messages]);

  if (isLoading) {
    return (
      <div
        className="flex min-h-[50vh] flex-1 items-center justify-center text-sm text-[#78909c]"
        style={{ backgroundColor: "#f0f2f5" }}
      >
        Carregando cliente...
      </div>
    );
  }

  if (!cliente) {
    return (
      <div
        className="flex min-h-[50vh] flex-1 flex-col items-center justify-center gap-4 text-center"
        style={{ backgroundColor: "#f0f2f5" }}
      >
        <p className="text-sm text-[#78909c]">{error?.message || "Cliente nao encontrado."}</p>
        <Button variant="outline" className="border-[#cfd8dc]" onClick={() => navigate("/clientes")}>
          Voltar para clientes
        </Button>
      </div>
    );
  }

  function openCustomerInbox() {
    if (!cliente) {
      return;
    }

    const params = new URLSearchParams();

    if (customerChat?.id) {
      params.set("chatId", customerChat.id);
    }

    if (cliente.id) {
      params.set("customerId", cliente.id);
    }

    if (cliente.phoneDigits ?? cliente.telefone) {
      params.set("search", cliente.phoneDigits ?? cliente.telefone);
    }

    navigate({
      pathname: "/inbox",
      search: params.toString(),
    });
  }

  const { activeIndex: pipelineActiveIndex, daysContact } = getPipelineStateForCustomer(cliente);

  const handlePipelineStageChange = async (stageIndex: number) => {
    const key = pipelineStageKeyFromIndex(stageIndex);
    if (!key) {
      return;
    }
    const nextSource = { ...(cliente.sourceColumns ?? {}), [CRM_PIPELINE_STAGE_KEY]: key };
    let nextStatus = cliente.status;
    if (stageIndex === 5) {
      nextStatus = "bloqueado";
    } else if (cliente.status === "bloqueado") {
      nextStatus = "ativo";
    }
    await updateCustomer.mutateAsync({
      id: cliente.id,
      input: { ...toCustomerInput(cliente, nextStatus), sourceColumns: nextSource },
    });
    const label = buildPipelineLabels(daysContact)[stageIndex]?.label ?? key;
    toast({
      title: "Funil atualizado",
      description: `Etapa: ${label}`,
    });
  };

  const handleMarkLoss = async () => {
    if (cliente.status === "bloqueado") {
      toast({
        title: "Negociação",
        description: "Este cliente já está marcado como perda (bloqueado).",
      });
      return;
    }
    const nextSource = { ...(cliente.sourceColumns ?? {}), [CRM_PIPELINE_STAGE_KEY]: "perdido" };
    await updateCustomer.mutateAsync({
      id: cliente.id,
      input: { ...toCustomerInput(cliente, "bloqueado"), sourceColumns: nextSource },
    });
    const descricao = `${cliente.nome} foi bloqueado.`;
    toast({
      title: "Marcar perda",
      description: descricao,
    });
    useAppStore.getState().addNotification({
      tipo: "aviso",
      titulo: "Cliente bloqueado",
      descricao,
    });
  };

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
      <ClienteRdPerfilView
        cliente={cliente}
        daysContact={daysContact}
        pipelineActiveIndex={pipelineActiveIndex}
        qualificationStars={qualificationFromPerfil(cliente.perfil)}
        onBack={() => navigate("/clientes")}
        onRefresh={() => {
          void queryClient.invalidateQueries({ queryKey: ["customers", id] });
          if (crmEnabled) {
            void queryClient.invalidateQueries({ queryKey: ["crm-tasks"] });
          }
        }}
        crmOpenTasks={crmEnabled ? crmOpenTasksList : undefined}
        crmCompletedTasks={crmEnabled ? crmCompletedTasksList : undefined}
        crmTaskScopeLabelMode={crmEnabled ? "customer-linked" : undefined}
        crmTasksLoading={crmEnabled ? crmTasksLoading : false}
        crmTaskAssignees={crmEnabled ? crmTaskAssignees : undefined}
        onCompleteCrmTask={(taskId) => {
          if (!crmEnabled || !id) {
            return;
          }
          void (async () => {
            const t = crmTasksRaw.find((x) => x.id === taskId);
            try {
              await updateCrmTask.mutateAsync({
                id: taskId,
                patch: { status: "concluida" },
                customerId: id,
                negotiationId: t?.negotiationId ?? null,
              });
              toast({ title: "Tarefa", description: "Marcada como concluída." });
            } catch (e) {
              toast({
                title: "Não foi possível salvar",
                description: e instanceof Error ? e.message : "Tente novamente.",
                variant: "destructive",
              });
            }
          })();
        }}
        onReopenCrmTask={
          crmEnabled
            ? (taskId) => {
                if (!id) {
                  return;
                }
                void (async () => {
                  const t = crmTasksRaw.find((x) => x.id === taskId);
                  try {
                    await updateCrmTask.mutateAsync({
                      id: taskId,
                      patch: { status: "aberta" },
                      customerId: id,
                      negotiationId: t?.negotiationId ?? null,
                    });
                    toast({ title: "Tarefa", description: "Tarefa reaberta." });
                  } catch (e) {
                    toast({
                      title: "Não foi possível salvar",
                      description: e instanceof Error ? e.message : "Tente novamente.",
                      variant: "destructive",
                    });
                  }
                })();
              }
            : undefined
        }
        crmCompleteTaskPending={updateCrmTask.isPending}
        crmDeleteTaskPending={deleteCrmTask.isPending}
        onDeleteCrmTask={
          crmEnabled
            ? (taskId) => {
                void (async () => {
                  try {
                    await deleteCrmTask.mutateAsync(taskId);
                    toast({ title: "Tarefa", description: "Tarefa excluída." });
                  } catch (e) {
                    toast({
                      title: "Não foi possível excluir",
                      description: e instanceof Error ? e.message : "Tente novamente.",
                      variant: "destructive",
                    });
                  }
                })();
              }
            : undefined
        }
        crmEditTaskPending={updateCrmTask.isPending}
        onSaveCrmTaskEdit={
          crmEnabled
            ? async ({ id: taskId, patch }) => {
                if (!id) {
                  return;
                }
                const t = crmTasksRaw.find((x) => x.id === taskId);
                try {
                  await updateCrmTask.mutateAsync({
                    id: taskId,
                    patch,
                    customerId: id,
                    negotiationId: t?.negotiationId ?? null,
                  });
                  toast({ title: "Tarefa", description: "Alterações salvas." });
                } catch (e) {
                  toast({
                    title: "Não foi possível salvar",
                    description: e instanceof Error ? e.message : "Tente novamente.",
                    variant: "destructive",
                  });
                  throw e;
                }
              }
            : undefined
        }
        onMarkLoss={() => void handleMarkLoss()}
        onMarkWin={() => {
          toast({
            title: "Marcar venda",
            description: "Registre a venda na aba CRM (área expandida) ou pelo Inbox.",
          });
        }}
        onEdit={() => setDialogOpen(true)}
        onOpenInbox={openCustomerInbox}
        onBlock={() => void handleMarkLoss()}
        onCreateNote={() => setDialogOpen(true)}
        onCreateTask={() => {
          if (crmEnabled) {
            setTaskDialogOpen(true);
            return;
          }
          toast({
            title: "Tarefas",
            description: "Configure o Supabase para criar tarefas neste cadastro.",
          });
        }}
        onCreateCup={() => {
          navigate({ pathname: `/clientes/${cliente.id}`, search: "?copoPersonalizado=1" });
        }}
        onPipelineStageChange={(idx) => void handlePipelineStageChange(idx)}
        legacyDetailPanel={(
      <Tabs defaultValue="cadastro" className="space-y-5">
        <TabsList className="h-auto flex-wrap rounded-2xl border border-border/60 bg-card/80 p-1 sm:flex-nowrap">
          <TabsTrigger value="cadastro" className="rounded-xl px-5">
            Cadastro
          </TabsTrigger>
          <TabsTrigger value="crm" className="rounded-xl px-5">
            CRM
          </TabsTrigger>
          <TabsTrigger value="whatsapp" className="rounded-xl px-5">
            WhatsApp
          </TabsTrigger>
        </TabsList>

        <TabsContent value="cadastro" className="space-y-4">
          <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
            <InfoGridCard
              title="Contato e relacionamento"
              items={[
                { label: "Telefone", value: infoValue(cliente.telefone) },
                { label: "Celular", value: infoValue(cliente.celular) },
                { label: "E-mail", value: infoValue(cliente.email) },
                { label: "Canal", value: infoValue(cliente.canal) },
                { label: "Responsavel", value: infoValue(cliente.vendedor) },
                { label: "Frequencia de compra", value: infoValue(cliente.frequenciaCompra) },
              ]}
            />

            <InfoGridCard
              title="Financeiro"
              items={[
                { label: "Ticket medio", value: formatMoney(cliente.ticketMedio) },
                { label: "Total gasto", value: formatMoney(cliente.totalGasto) },
                { label: "Ultimo pedido", value: formatDate(cliente.ultimoPedido) },
                { label: "Status do cadastro", value: cliente.ativo ? "Ativo" : "Inativo" },
              ]}
            />
          </div>

          <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
            <InfoGridCard
              title="Documentacao"
              items={[
                { label: "Tipo", value: customerTypeLabel(cliente.tipo) },
                { label: "CPF", value: infoValue(cliente.cpf) },
                { label: "RG", value: infoValue(cliente.rg) },
                { label: "CNPJ", value: infoValue(cliente.cnpj) },
                { label: "I.E.", value: infoValue(cliente.inscricaoEstadual) },
                { label: "I.M.", value: infoValue(cliente.inscricaoMunicipal) },
                { label: "Nascimento", value: formatDate(cliente.nascimento) },
                { label: "Cadastrado em", value: formatDate(cliente.cadastradoEm) },
              ]}
            />

            <InfoGridCard
              title="Endereco"
              items={[
                { label: "Logradouro", value: infoValue(cliente.logradouro || cliente.endereco) },
                { label: "Numero", value: infoValue(cliente.numero) },
                { label: "Complemento", value: infoValue(cliente.complemento) },
                { label: "Bairro", value: infoValue(cliente.bairro) },
                { label: "Zona", value: infoValue(cliente.zone) },
                { label: "CEP", value: infoValue(cliente.cep) },
                { label: "Cidade", value: infoValue(cliente.cidade) },
                { label: "Estado", value: infoValue(cliente.estado) },
                { label: "Rota", value: infoValue(cliente.rota) },
              ]}
            />
          </div>

          <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
            <InfoGridCard
              title="Classificacao"
              items={[
                { label: "Codigo", value: infoValue(cliente.codigo) },
                { label: "Perfil", value: cliente.perfil },
                { label: "Origem", value: customerOriginLabel(cliente.origem) },
                { label: "Nome social", value: infoValue(cliente.nomeSocial) },
                { label: "Razao social", value: infoValue(cliente.razaoSocial) },
                { label: "Fax", value: infoValue(cliente.fax) },
              ]}
            />

            <Card className="overflow-hidden border-border/60 bg-card/80 shadow-sm">
              <CardHeader className="border-b border-border/60 bg-secondary/30 pb-3">
                <CardTitle className="text-sm font-medium text-foreground">Observacoes</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="min-h-[170px] rounded-3xl border border-dashed border-border/70 bg-background/80 p-5 text-sm leading-7 text-slate-700">
                  {cliente.observacoes?.trim() || "Nenhuma observacao cadastrada para este cliente."}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="crm" className="space-y-4">
          {!isSupabaseConfigured ? (
            <Card className="overflow-hidden border-dashed border-border/80 bg-card/60 shadow-sm">
              <CardContent className="p-6 text-sm text-muted-foreground">
                Configure o Supabase para ver vendas, devolucoes e saldo de credito registrados no CRM.
              </CardContent>
            </Card>
          ) : (
            <>
              <Card className="overflow-hidden border-border/60 bg-card/90 shadow-sm">
                <CardHeader className="border-b border-border/60 bg-secondary/30 pb-3">
                  <CardTitle className="text-sm font-medium">Linha do tempo</CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  {crmActivitiesLoading ? (
                    <p className="text-sm text-muted-foreground">Carregando atividades…</p>
                  ) : crmActivities.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Sem atividades registradas ainda.</p>
                  ) : (
                    <ul className="space-y-2">
                      {crmActivities.map((act) => (
                        <li key={act.id} className="rounded-lg border border-border/60 px-3 py-2 text-sm">
                          <p className="font-medium text-foreground">{act.title}</p>
                          {act.body ? <p className="mt-0.5 text-xs text-muted-foreground">{act.body}</p> : null}
                          <p className="mt-1 text-[10px] uppercase tracking-wide text-muted-foreground">
                            {new Date(act.createdAt).toLocaleString("pt-BR")}
                          </p>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>

              <Card className="overflow-hidden border-border/60 bg-card/90 shadow-sm">
                <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Saldo de credito (CRM)</p>
                    <p className="mt-2 font-syne text-2xl font-bold text-slate-800">
                      {formatMoney(creditSummary?.totalCredit ?? 0)}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Creditos de devolucoes menos usos em vendas (registrado no CRM e no Inbox).
                    </p>
                  </div>
                </CardContent>
              </Card>

              <div className="grid gap-4 xl:grid-cols-1">
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
                      <p className="text-sm text-muted-foreground">Nenhuma venda registrada para este cliente.</p>
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
                              maxVisible={4}
                              formatLine={(item) => ` · ${formatMoney(item.unitPrice * item.quantity)}`}
                            />
                            <p className="mt-2 font-medium text-foreground">Total {formatMoney(sale.totalAmount)}</p>
                            {sale.notes ? (
                              <p className="mt-2 text-xs leading-relaxed text-slate-600">{sale.notes}</p>
                            ) : null}
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
                      Devolucoes no CRM
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4">
                    {crmReturnsLoading ? (
                      <p className="text-sm text-muted-foreground">Carregando devolucoes...</p>
                    ) : crmReturns.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Nenhuma devolucao registrada para este cliente.</p>
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
                              {row.productName?.trim() || "Produto nao informado"}
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
                    <CardTitle className="text-sm font-medium text-foreground">Historico de credito</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4">
                    {crmCreditsLoading ? (
                      <p className="text-sm text-muted-foreground">Carregando lancamentos...</p>
                    ) : crmCredits.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Sem entradas ou abatimentos de saldo.</p>
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
            </>
          )}
        </TabsContent>

        <TabsContent value="whatsapp">
          <Card className="overflow-hidden border-border/60 bg-card/80 shadow-sm">
            <CardHeader className="border-b border-border/60 bg-secondary/30">
              <CardTitle className="font-syne text-lg">Relacionamento no WhatsApp</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-5">
              {customerChat ? (
                <>
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    {[ 
                      { label: "Instancia", value: customerChat.instanceName, icon: MessageSquare },
                      { label: "Ultimo contato", value: formatDateTime(customerChat.lastMessageAt), icon: Calendar },
                      { label: "Mensagens totais", value: totalMessages.toString(), icon: Mail },
                      { label: "Conversas no mes", value: conversationStartsThisMonth.toString(), icon: ScanText },
                    ].map((item) => (
                      <div key={item.label} className="rounded-3xl border border-border/60 bg-background/80 p-4">
                        <div className="flex items-center gap-3">
                          <div className="rounded-2xl bg-sky-100 p-2 text-sky-800">
                            <item.icon className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{item.label}</p>
                            <p className="mt-1 text-sm font-medium text-foreground">{item.value}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="rounded-[28px] border border-border/60 bg-[linear-gradient(135deg,rgba(13,59,102,0.12),rgba(255,255,255,0.96))] p-5">
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Ultima mensagem</p>
                    <p className="mt-2 text-sm leading-7 text-slate-700">{customerChat.lastMessagePreview ?? "Sem preview"}</p>
                  </div>
                </>
              ) : (
                <div className="rounded-[28px] border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
                  Ainda nao encontramos conversa sincronizada para este cliente.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
        )}
      />

      <Dialog open={taskDialogOpen} onOpenChange={setTaskDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nova tarefa</DialogTitle>
            <DialogDescription>A tarefa fica vinculada a este cliente.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="cliente-crm-task-title">Título</Label>
              <Input
                id="cliente-crm-task-title"
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                placeholder="Ex.: Enviar proposta atualizada"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="cliente-crm-task-due">Prazo (opcional)</Label>
              <Input
                id="cliente-crm-task-due"
                type="datetime-local"
                value={taskDueLocal}
                onChange={(e) => setTaskDueLocal(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="cliente-crm-task-notes">Observações (opcional)</Label>
              <Textarea
                id="cliente-crm-task-notes"
                value={taskNotes}
                onChange={(e) => setTaskNotes(e.target.value)}
                rows={3}
                className="resize-none"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="cliente-crm-task-assignee">Responsável (opcional)</Label>
              <Select
                value={taskAssigneeId.trim() ? taskAssigneeId : CRM_TASK_FORM_ASSIGNEE_NONE}
                onValueChange={(v) => setTaskAssigneeId(v === CRM_TASK_FORM_ASSIGNEE_NONE ? "" : v)}
              >
                <SelectTrigger id="cliente-crm-task-assignee">
                  <SelectValue placeholder="Sem responsável" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={CRM_TASK_FORM_ASSIGNEE_NONE}>Sem responsável</SelectItem>
                  {crmTaskAssignees.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.nome?.trim() || a.id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => setTaskDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              type="button"
              disabled={createCrmTask.isPending}
              onClick={() => {
                void (async () => {
                  const title = taskTitle.trim();
                  if (!title) {
                    toast({
                      title: "Título obrigatório",
                      description: "Informe um título para a tarefa.",
                      variant: "destructive",
                    });
                    return;
                  }
                  if (!id) {
                    return;
                  }
                  try {
                    await createCrmTask.mutateAsync({
                      title,
                      customerId: id,
                      assigneeId: taskAssigneeId.trim() || null,
                      dueAt: taskDueLocal ? new Date(taskDueLocal).toISOString() : null,
                      notes: taskNotes.trim(),
                    });
                    setTaskDialogOpen(false);
                    toast({ title: "Tarefa criada", description: "A lista foi atualizada." });
                  } catch (e) {
                    toast({
                      title: "Não foi possível salvar",
                      description: e instanceof Error ? e.message : "Tente novamente.",
                      variant: "destructive",
                    });
                  }
                })();
              }}
            >
              {createCrmTask.isPending ? "Salvando…" : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <CustomerFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        customer={cliente}
        loading={updateCustomer.isPending}
        onSubmit={async (input) => {
          await updateCustomer.mutateAsync({ id: cliente.id, input });
          const atualizadoDesc = `${input.nome} foi atualizado com sucesso.`;
          toast({
            title: "Cliente atualizado",
            description: atualizadoDesc,
          });
          useAppStore.getState().addNotification({
            tipo: "sucesso",
            titulo: "Cliente atualizado",
            descricao: atualizadoDesc,
          });
          setDialogOpen(false);
        }}
      />
    </div>
  );
}
