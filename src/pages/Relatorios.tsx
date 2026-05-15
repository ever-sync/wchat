import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { BarChart3, Download, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DEFAULT_CRM_FUNNELS, funnelStageTitleIn } from "@/data/crm-funnels";
import { useEffectiveCrmFunnels } from "@/lib/api/crm-funnel-config";
import {
  exportAttendanceCsv,
  useAttendanceReport,
  useCrmCommercialSla,
  useCrmSellerPerformance,
  useFunnelReport,
  useSellerSalesReport,
  useStaleNegotiations,
  useStaleNegotiationsSummary,
} from "@/lib/api/reports";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function endOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
}

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatDateTime(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function MetricTile({
  label,
  value,
  hint,
  variant = "default",
}: {
  label: string;
  value: string | number;
  hint?: string;
  variant?: "default" | "warning" | "danger";
}) {
  return (
    <div
      className={cn(
        "rounded-lg border px-4 py-3",
        variant === "danger" && "border-red-200 bg-red-50/80 dark:border-red-900/50 dark:bg-red-950/30",
        variant === "warning" && "border-amber-200 bg-amber-50/80 dark:border-amber-900/50 dark:bg-amber-950/30",
        variant === "default" && "border-border/60 bg-card/80",
      )}
    >
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold tracking-tight text-foreground">{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

function CrmFunnelSelect({
  funnels,
  funnelId,
  onFunnelIdChange,
}: {
  funnels: typeof DEFAULT_CRM_FUNNELS;
  funnelId: string;
  onFunnelIdChange: (id: string) => void;
}) {
  return (
    <Select value={funnelId} onValueChange={onFunnelIdChange}>
      <SelectTrigger className="w-56">
        <SelectValue placeholder="Funil" />
      </SelectTrigger>
      <SelectContent>
        {funnels.map((f) => (
          <SelectItem key={f.id} value={f.id}>
            {f.listName}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export default function Relatorios() {
  const { toast } = useToast();
  const now = useMemo(() => new Date(), []);
  const [from, setFrom] = useState(() => startOfMonth(now).toISOString().slice(0, 10));
  const [to, setTo] = useState(() => endOfMonth(now).toISOString().slice(0, 10));
  const { data: funnels = DEFAULT_CRM_FUNNELS } = useEffectiveCrmFunnels();
  const [funnelId, setFunnelId] = useState(DEFAULT_CRM_FUNNELS[0]?.id ?? "comercial");

  useEffect(() => {
    if (funnels.some((f) => f.id === funnelId)) {
      return;
    }
    setFunnelId(funnels[0]?.id ?? DEFAULT_CRM_FUNNELS[0]?.id ?? "comercial");
  }, [funnelId, funnels]);

  const fromDate = useMemo(() => new Date(`${from}T00:00:00`), [from]);
  const toDate = useMemo(() => new Date(`${to}T23:59:59`), [to]);
  const year = fromDate.getFullYear();
  const month = fromDate.getMonth() + 1;

  const { data: attendance = [], isLoading: loadingAttendance } = useAttendanceReport(fromDate, toDate);
  const { data: funnelRows = [], isLoading: loadingFunnel } = useFunnelReport(funnelId, fromDate, toDate);
  const { data: staleSummary } = useStaleNegotiationsSummary(funnelId);
  const { data: staleRows = [], isLoading: loadingStale } = useStaleNegotiations(funnelId);
  const { data: crmSla, isLoading: loadingCrmSla } = useCrmCommercialSla(funnelId, fromDate, toDate);
  const { data: crmSellers = [], isLoading: loadingCrmSellers } = useCrmSellerPerformance(
    funnelId,
    fromDate,
    toDate,
  );
  const { data: sellerSales = [], isLoading: loadingSales } = useSellerSalesReport(year, month);

  const sortedFunnelRows = useMemo(
    () => [...funnelRows].sort((a, b) => a.stage_order - b.stage_order || a.stage_id.localeCompare(b.stage_id)),
    [funnelRows],
  );

  const handleExport = async () => {
    try {
      const csv = await exportAttendanceCsv(fromDate, toDate);
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `atendimento-${from}-${to}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      toast({
        title: "Erro ao exportar",
        description: e instanceof Error ? e.message : "Falha no export",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 md:p-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Relatórios</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Atendimento WhatsApp, funil CRM, negócios parados, SLA comercial e performance da equipe.
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <Label htmlFor="from" className="text-xs">
              De
            </Label>
            <Input id="from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-36" />
          </div>
          <div>
            <Label htmlFor="to" className="text-xs">
              Até
            </Label>
            <Input id="to" type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-36" />
          </div>
          <Button type="button" variant="outline" className="gap-2" onClick={() => void handleExport()}>
            <Download className="h-4 w-4" />
            Exportar atendimento
          </Button>
        </div>
      </div>

      <Tabs defaultValue="atendimento">
        <TabsList className="flex h-auto flex-wrap gap-1">
          <TabsTrigger value="atendimento">Atendimento</TabsTrigger>
          <TabsTrigger value="funil">Funil CRM</TabsTrigger>
          <TabsTrigger value="parados">Parados</TabsTrigger>
          <TabsTrigger value="sla">SLA comercial</TabsTrigger>
          <TabsTrigger value="crm-vendedores">Performance CRM</TabsTrigger>
          <TabsTrigger value="vendas">Vendas Trendii</TabsTrigger>
        </TabsList>

        <TabsContent value="atendimento" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <BarChart3 className="h-4 w-4" />
                Resumo por atendente
              </CardTitle>
              <CardDescription>Chats e mensagens no período; SLA de 1ª resposta quando disponível.</CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              {loadingAttendance ? (
                <p className="text-sm text-muted-foreground">Carregando…</p>
              ) : (
                <table className="w-full min-w-[720px] text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="pb-2 pr-4">Nome</th>
                      <th className="pb-2 pr-4">Chats abertos</th>
                      <th className="pb-2 pr-4">Resolvidos</th>
                      <th className="pb-2 pr-4">Recebidas</th>
                      <th className="pb-2 pr-4">Enviadas</th>
                      <th className="pb-2 pr-4">IA</th>
                      <th className="pb-2">1ª resposta (média)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendance.map((row) => (
                      <tr key={row.assignee_id} className="border-b border-border/60">
                        <td className="py-2 pr-4 font-medium">{row.assignee_name || "—"}</td>
                        <td className="py-2 pr-4">{row.chats_opened}</td>
                        <td className="py-2 pr-4">{row.chats_resolved}</td>
                        <td className="py-2 pr-4">{row.messages_inbound}</td>
                        <td className="py-2 pr-4">{row.messages_outbound}</td>
                        <td className="py-2 pr-4">{row.messages_ai}</td>
                        <td className="py-2">
                          {row.avg_first_response_minutes != null
                            ? `${row.avg_first_response_minutes} min`
                            : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="funil" className="mt-4 space-y-4">
          <CrmFunnelSelect funnels={funnels} funnelId={funnelId} onFunnelIdChange={setFunnelId} />
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Conversão por etapa</CardTitle>
              <CardDescription>
                Cards atuais, entradas no período (histórico de estágio) e taxa em relação à etapa anterior.
              </CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              {loadingFunnel ? (
                <p className="text-sm text-muted-foreground">Carregando…</p>
              ) : (
                <table className="w-full min-w-[640px] text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="pb-2 pr-4">Etapa</th>
                      <th className="pb-2 pr-4">No funil agora</th>
                      <th className="pb-2 pr-4">Entraram no período</th>
                      <th className="pb-2 pr-4">Conversão</th>
                      <th className="pb-2 pr-4">Vendidos</th>
                      <th className="pb-2">Perdidos</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedFunnelRows.map((row) => (
                      <tr key={row.stage_id} className="border-b border-border/60">
                        <td className="py-2 pr-4 font-medium">
                          {funnelStageTitleIn(funnels, funnelId, row.stage_id)}
                        </td>
                        <td className="py-2 pr-4">{row.current_count}</td>
                        <td className="py-2 pr-4">{row.entered_in_period}</td>
                        <td className="py-2 pr-4">
                          {row.conversion_pct != null ? `${row.conversion_pct}%` : "—"}
                        </td>
                        <td className="py-2 pr-4">{row.won_in_period}</td>
                        <td className="py-2">{row.lost_in_period}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="parados" className="mt-4 space-y-4">
          <CrmFunnelSelect funnels={funnels} funnelId={funnelId} onFunnelIdChange={setFunnelId} />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <MetricTile
              label="Em aberto"
              value={staleSummary?.open_negotiations ?? "—"}
            />
            <MetricTile
              label={`Parados (${staleSummary?.stale_threshold_days ?? 7}+ dias)`}
              value={staleSummary?.stale_count ?? "—"}
              variant={(staleSummary?.stale_count ?? 0) > 0 ? "warning" : "default"}
            />
            <MetricTile
              label="Sem tarefa futura"
              value={staleSummary?.no_future_task_count ?? "—"}
              variant={(staleSummary?.no_future_task_count ?? 0) > 0 ? "warning" : "default"}
            />
            <MetricTile
              label="Parados no pool"
              value={staleSummary?.pool_unassigned_stale ?? "—"}
              hint="Sem responsável"
            />
          </div>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Negócios que precisam de atenção</CardTitle>
              <CardDescription>
                Mesmos critérios dos alertas do Kanban: sem interação há N dias ou sem tarefa agendada.
              </CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              {loadingStale ? (
                <p className="text-sm text-muted-foreground">Carregando…</p>
              ) : staleRows.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum negócio parado neste funil.</p>
              ) : (
                <table className="w-full min-w-[720px] text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="pb-2 pr-4">Negócio</th>
                      <th className="pb-2 pr-4">Etapa</th>
                      <th className="pb-2 pr-4">Responsável</th>
                      <th className="pb-2 pr-4">Dias parado</th>
                      <th className="pb-2 pr-4">Valor</th>
                      <th className="pb-2">Última interação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {staleRows.map((row) => (
                      <tr key={row.negotiation_id} className="border-b border-border/60">
                        <td className="py-2 pr-4">
                          <Link
                            to={`/crm/negociacao/${row.negotiation_id}`}
                            className="font-medium text-[#4E1BB1] hover:underline"
                          >
                            {row.title}
                          </Link>
                          {row.missing_future_task ? (
                            <span className="ml-2 text-[10px] font-semibold text-amber-700">sem tarefa</span>
                          ) : null}
                        </td>
                        <td className="py-2 pr-4">
                          {funnelStageTitleIn(funnels, row.funnel_id, row.stage_id)}
                        </td>
                        <td className="py-2 pr-4">{row.assignee_name ?? "Pool"}</td>
                        <td className="py-2 pr-4">{row.days_without_touch}</td>
                        <td className="py-2 pr-4">{formatCurrency(row.total_value)}</td>
                        <td className="py-2">{formatDateTime(row.last_interaction_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sla" className="mt-4 space-y-4">
          <CrmFunnelSelect funnels={funnels} funnelId={funnelId} onFunnelIdChange={setFunnelId} />
          {loadingCrmSla ? (
            <p className="text-sm text-muted-foreground">Carregando…</p>
          ) : crmSla ? (
            <>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <MetricTile
                  label="Negócios em aberto"
                  value={crmSla.open_negotiations}
                />
                <MetricTile
                  label="Parados"
                  value={crmSla.stale_negotiations}
                  variant={crmSla.stale_negotiations > 0 ? "warning" : "default"}
                />
                <MetricTile
                  label="Sem tarefa futura"
                  value={crmSla.no_future_task_negotiations}
                />
                <MetricTile
                  label="Tarefas atrasadas"
                  value={crmSla.overdue_crm_tasks}
                  variant={crmSla.overdue_crm_tasks > 0 ? "danger" : "default"}
                />
              </div>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">SLA de 1ª resposta (chats do CRM)</CardTitle>
                  <CardDescription>
                    Meta configurada: {crmSla.sla_first_response_minutes} minutos · chats com negócio primário
                    vinculado.
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <MetricTile
                    label="Aguardando 1ª resposta"
                    value={crmSla.chats_awaiting_first_response}
                  />
                  <MetricTile
                    label="SLA estourado"
                    value={crmSla.chats_sla_breached}
                    variant={crmSla.chats_sla_breached > 0 ? "danger" : "default"}
                  />
                  <MetricTile
                    label="Respondidos no período"
                    value={crmSla.chats_first_response_in_period}
                  />
                  <MetricTile
                    label="Média 1ª resposta"
                    value={
                      crmSla.avg_first_response_minutes != null
                        ? `${crmSla.avg_first_response_minutes} min`
                        : "—"
                    }
                  />
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <TrendingUp className="h-4 w-4" />
                    Fechamentos no período
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-3 sm:grid-cols-3">
                  <MetricTile label="Vendidos" value={crmSla.won_in_period} />
                  <MetricTile label="Perdidos" value={crmSla.lost_in_period} />
                  <MetricTile
                    label="Média dias até venda"
                    value={crmSla.avg_days_to_close != null ? `${crmSla.avg_days_to_close} d` : "—"}
                  />
                </CardContent>
              </Card>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Sem dados de SLA para o período.</p>
          )}
        </TabsContent>

        <TabsContent value="crm-vendedores" className="mt-4 space-y-4">
          <CrmFunnelSelect funnels={funnels} funnelId={funnelId} onFunnelIdChange={setFunnelId} />
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Performance por responsável (CRM)</CardTitle>
              <CardDescription>
                Pipeline aberto, ganhos e perdas no período, negócios parados e média de dias sem contato.
              </CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              {loadingCrmSellers ? (
                <p className="text-sm text-muted-foreground">Carregando…</p>
              ) : (
                <table className="w-full min-w-[760px] text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="pb-2 pr-4">Responsável</th>
                      <th className="pb-2 pr-4">Abertos</th>
                      <th className="pb-2 pr-4">Pipeline</th>
                      <th className="pb-2 pr-4">Vendas</th>
                      <th className="pb-2 pr-4">Faturamento</th>
                      <th className="pb-2 pr-4">Perdas</th>
                      <th className="pb-2 pr-4">Parados</th>
                      <th className="pb-2">Média dias parado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {crmSellers.map((row) => (
                      <tr key={row.assignee_id} className="border-b border-border/60">
                        <td className="py-2 pr-4 font-medium">{row.assignee_name}</td>
                        <td className="py-2 pr-4">{row.open_count}</td>
                        <td className="py-2 pr-4">{formatCurrency(row.pipeline_value)}</td>
                        <td className="py-2 pr-4">{row.won_count}</td>
                        <td className="py-2 pr-4">{formatCurrency(row.won_value)}</td>
                        <td className="py-2 pr-4">{row.lost_count}</td>
                        <td className="py-2 pr-4">{row.stale_count}</td>
                        <td className="py-2">
                          {row.avg_days_without_touch != null ? `${row.avg_days_without_touch} d` : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="vendas" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Vendas Trendii — {month}/{year}
              </CardTitle>
              <CardDescription>Metas e faturamento registrados no módulo de vendas.</CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              {loadingSales ? (
                <p className="text-sm text-muted-foreground">Carregando…</p>
              ) : (
                <table className="w-full min-w-[520px] text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="pb-2 pr-4">Vendedor</th>
                      <th className="pb-2 pr-4">Vendas</th>
                      <th className="pb-2 pr-4">Faturamento</th>
                      <th className="pb-2 pr-4">Meta</th>
                      <th className="pb-2">% meta</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sellerSales.map((row) => (
                      <tr key={row.seller_id} className="border-b border-border/60">
                        <td className="py-2 pr-4 font-medium">{row.seller_name}</td>
                        <td className="py-2 pr-4">{row.sales_count}</td>
                        <td className="py-2 pr-4">{formatCurrency(row.sales_total)}</td>
                        <td className="py-2 pr-4">{formatCurrency(row.goal_amount)}</td>
                        <td className="py-2">{row.goal_pct != null ? `${row.goal_pct}%` : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
