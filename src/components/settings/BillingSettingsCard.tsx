import { useState } from "react";
import { AlertCircle, CheckCircle2, CreditCard, Infinity, Loader2, Sparkles, TrendingUp } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  createAsaasCheckout,
  useTenantBillingSnapshot,
  type BillingStatus,
  type BillingUsageCounter,
} from "@/lib/api/billing";
import { useToast } from "@/hooks/use-toast";

const STATUS_LABEL: Record<BillingStatus, string> = {
  trialing: "Teste",
  active: "Ativo",
  past_due: "Pagamento pendente",
  paused: "Pausado",
  canceled: "Cancelado",
  incomplete: "Incompleto",
};

const STATUS_CLASS: Record<BillingStatus, string> = {
  trialing: "bg-warning/20 text-warning",
  active: "bg-success/20 text-success",
  past_due: "bg-destructive/15 text-destructive",
  paused: "bg-muted text-muted-foreground",
  canceled: "bg-destructive/15 text-destructive",
  incomplete: "bg-warning/20 text-warning",
};

const METRIC_LABEL: Record<string, string> = {
  customers: "Clientes",
  whatsapp_instances: "Canais WhatsApp",
  users: "Usuarios",
  ai_monthly_tokens: "Tokens de IA",
  marketing_flow_runs_monthly: "Execucoes de automacao",
  storage_gb: "Armazenamento (GB)",
};

const PLAN_UPGRADE_OPTIONS = [
  { id: "profissional", label: "Profissional" },
  { id: "enterprise", label: "Enterprise" },
] as const;

function formatCurrency(amountCents: number, currency: string) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: currency.toUpperCase(),
    maximumFractionDigits: 0,
  }).format(amountCents / 100);
}

function formatDate(value: string | null) {
  if (!value) return "Nao definido";
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" }).format(new Date(value));
}

function formatNumber(value: number | null) {
  if (value === null) return "Ilimitado";
  return new Intl.NumberFormat("pt-BR").format(value);
}

function usagePercent(counter: BillingUsageCounter) {
  if (!counter.limit_value || counter.limit_value <= 0) return 0;
  return Math.min(100, Math.round((counter.used / counter.limit_value) * 100));
}

function usageState(counter: BillingUsageCounter) {
  if (counter.limit_value === null || counter.limit_value <= 0) return "unlimited";
  const percent = usagePercent(counter);
  if (counter.used >= counter.limit_value) return "blocked";
  if (percent >= 80) return "warning";
  return "ok";
}

function usageBadge(counter: BillingUsageCounter) {
  const state = usageState(counter);
  if (state === "blocked") return { label: "Limite atingido", className: "bg-destructive/15 text-destructive" };
  if (state === "warning") return { label: "Atenção", className: "bg-warning/20 text-warning" };
  if (state === "unlimited") return { label: "Ilimitado", className: "bg-success/15 text-success" };
  return { label: "Ok", className: "bg-success/15 text-success" };
}

export function BillingSettingsCard() {
  const { toast } = useToast();
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const { data, isLoading, error } = useTenantBillingSnapshot();
  const subscription = data?.subscription ?? null;
  const usage = data?.usage ?? [];
  const price = subscription?.price;
  const blockedUsage = usage.filter((counter) => usageState(counter) === "blocked");
  const warningUsage = usage.filter((counter) => usageState(counter) === "warning");

  async function openCheckout(planId: string, billingPeriod = subscription?.billing_period ?? "monthly") {
    setCheckoutLoading(planId);
    try {
      const result = await createAsaasCheckout({
        planId,
        billingPeriod,
      });
      if (!result.checkoutUrl) {
        throw new Error("O Asaas nao retornou o link do checkout.");
      }
      window.location.assign(result.checkoutUrl);
    } catch (checkoutError) {
      toast({
        title: "Nao foi possivel abrir o checkout",
        description: checkoutError instanceof Error ? checkoutError.message : "Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setCheckoutLoading(null);
    }
  }

  if (isLoading) {
    return (
      <Card className="border-border/60 bg-card/80">
        <CardContent className="flex min-h-64 items-center justify-center text-muted-foreground">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          Carregando assinatura...
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive/30 bg-card/80">
        <CardContent className="flex min-h-64 items-center gap-3 text-destructive">
          <AlertCircle className="h-5 w-5" />
          Nao foi possivel carregar os dados de assinatura: {error.message}
        </CardContent>
      </Card>
    );
  }

  if (!subscription) {
    return (
      <Card className="border-border/60 bg-card/80">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <CreditCard className="h-5 w-5 text-accent" />
            Plano e assinatura
          </CardTitle>
          <CardDescription>Este tenant ainda nao tem uma assinatura criada.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
      <Card className="border-border/60 bg-card/80">
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                <CreditCard className="h-5 w-5 text-accent" />
                Plano e assinatura
              </CardTitle>
              <CardDescription>Visao operacional do plano contratado e ciclo atual.</CardDescription>
            </div>
            <Badge className={STATUS_CLASS[subscription.status]}>
              {STATUS_LABEL[subscription.status]}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="rounded-2xl border border-border bg-secondary/35 p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Plano atual</p>
                <h2 className="mt-2 text-3xl font-bold text-foreground">{subscription.plan.name}</h2>
                <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{subscription.plan.description}</p>
              </div>
              <div className="text-left sm:text-right">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  {subscription.billing_period === "yearly" ? "Anual" : "Mensal"}
                </p>
                <p className="mt-2 text-2xl font-bold text-foreground">
                  {price ? formatCurrency(price.amount_cents, price.currency) : "Valor manual"}
                </p>
              </div>
            </div>
            <div className="mt-5 flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">
                Pagamento processado pelo Asaas em ambiente seguro.
              </p>
              <Button
                className="bg-accent text-accent-foreground hover:bg-accent/90"
                disabled={checkoutLoading !== null || !price}
                onClick={() => void openCheckout(subscription.plan_id, subscription.billing_period)}
              >
                {checkoutLoading === subscription.plan_id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Pagar assinatura
              </Button>
            </div>
          </div>

          {blockedUsage.length > 0 || warningUsage.length > 0 ? (
            <Alert
              variant={blockedUsage.length > 0 ? "destructive" : "default"}
              className={blockedUsage.length > 0 ? "" : "border-warning/40 bg-warning/10 text-warning"}
            >
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>
                {blockedUsage.length > 0 ? "Limite de plano atingido" : "Uso perto do limite"}
              </AlertTitle>
              <AlertDescription>
                {blockedUsage.length > 0
                  ? `Recursos bloqueados: ${blockedUsage.map((item) => METRIC_LABEL[item.metric] ?? item.metric).join(", ")}.`
                  : `Atenção em: ${warningUsage.map((item) => METRIC_LABEL[item.metric] ?? item.metric).join(", ")}.`}
              </AlertDescription>
            </Alert>
          ) : null}

          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-border p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Inicio do ciclo</p>
              <p className="mt-2 text-sm font-semibold text-foreground">
                {formatDate(subscription.current_period_start)}
              </p>
            </div>
            <div className="rounded-2xl border border-border p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Renovacao</p>
              <p className="mt-2 text-sm font-semibold text-foreground">
                {formatDate(subscription.current_period_end)}
              </p>
            </div>
            <div className="rounded-2xl border border-border p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Cancelamento</p>
              <p className="mt-2 text-sm font-semibold text-foreground">
                {subscription.cancel_at_period_end ? "Cancela no fim do ciclo" : "Renova automaticamente"}
              </p>
            </div>
          </div>

          <Separator />

          <div className="space-y-3 rounded-2xl border border-border bg-secondary/25 p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-accent" />
              <h3 className="text-sm font-semibold text-foreground">Upgrade de plano</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Se algum recurso estiver no limite, escolha um plano maior e conclua o checkout no Asaas.
            </p>
            <div className="flex flex-wrap gap-2">
              {PLAN_UPGRADE_OPTIONS.filter((plan) => plan.id !== subscription.plan_id).map((plan) => (
                <Button
                  key={plan.id}
                  variant={plan.id === "profissional" ? "default" : "outline"}
                  className={plan.id === "profissional" ? "bg-accent text-accent-foreground hover:bg-accent/90" : ""}
                  disabled={checkoutLoading !== null}
                  onClick={() => void openCheckout(plan.id, subscription.billing_period)}
                >
                  {checkoutLoading === plan.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Ir para {plan.label}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-accent" />
              <h3 className="text-sm font-semibold text-foreground">Recursos inclusos</h3>
            </div>
            <div className="grid gap-2 md:grid-cols-2">
              {subscription.plan.features.map((feature) => (
                <div key={feature} className="flex items-start gap-2 rounded-xl border border-border/70 p-3 text-sm">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                  <span className="text-muted-foreground">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/60 bg-card/80">
        <CardHeader>
          <CardTitle className="text-lg">Limites de uso</CardTitle>
          <CardDescription>Acompanhamento mensal do tenant atual.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {usage.length === 0 ? (
            <p className="rounded-2xl border border-border bg-secondary/35 p-4 text-sm text-muted-foreground">
              Nenhum contador de uso foi criado para este ciclo.
            </p>
          ) : (
            usage.map((counter) => {
              const percent = usagePercent(counter);
              const badge = usageBadge(counter);
              const state = usageState(counter);
              return (
                <div
                  key={counter.metric}
                  className={[
                    "space-y-2 rounded-2xl border p-4",
                    state === "blocked"
                      ? "border-destructive/40 bg-destructive/5"
                      : state === "warning"
                        ? "border-warning/40 bg-warning/5"
                        : "border-border",
                  ].join(" ")}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground">
                        {METRIC_LABEL[counter.metric] ?? counter.metric}
                      </p>
                      <Badge className={badge.className}>{badge.label}</Badge>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>{formatNumber(counter.used)}</span>
                      <span>/</span>
                      {counter.limit_value === null ? (
                        <span className="inline-flex items-center gap-1">
                          <Infinity className="h-4 w-4" />
                          ilimitado
                        </span>
                      ) : (
                        <span>{formatNumber(counter.limit_value)}</span>
                      )}
                    </div>
                  </div>
                  <Progress value={percent} className="h-2" />
                  {counter.limit_value !== null ? (
                    <p
                      className={[
                        "text-xs",
                        state === "blocked"
                          ? "text-destructive"
                          : state === "warning"
                            ? "text-warning"
                            : "text-muted-foreground",
                      ].join(" ")}
                    >
                      {percent}% usado
                    </p>
                  ) : null}
                  <p className="text-xs text-muted-foreground">
                    Ciclo: {formatDate(counter.period_start)} ate {formatDate(counter.period_end)}
                  </p>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}
