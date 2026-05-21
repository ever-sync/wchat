import { useMemo } from "react";
import {
  AlarmClock,
  CircleAlert,
  Clock,
  Inbox,
  RefreshCcw,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  useAttendanceDashboard,
  useAttendanceDashboardRealtime,
  type AttendanceDashboardAttendant,
} from "@/lib/api/attendance-dashboard";
import { cn } from "@/lib/utils";

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
        variant === "danger" && "border-destructive/40 bg-destructive/10",
        variant === "warning" && "border-warning/40 bg-warning/10",
        variant === "default" && "border-border/60 bg-card/80",
      )}
    >
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold tracking-tight text-foreground">{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

const AVAILABILITY_META: Record<
  AttendanceDashboardAttendant["availability"],
  { label: string; dot: string; rank: number }
> = {
  available: { label: "Disponível", dot: "bg-emerald-500", rank: 0 },
  busy: { label: "Ocupado", dot: "bg-amber-500", rank: 1 },
  offline: { label: "Offline", dot: "bg-zinc-400", rank: 2 },
};

function formatWait(minutes: number): string {
  if (minutes <= 0) return "—";
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

export default function Painel() {
  useAttendanceDashboardRealtime();
  const { data, isLoading, isError, error, refetch, isFetching, dataUpdatedAt } =
    useAttendanceDashboard();

  const attendants = useMemo(() => {
    const list = data?.attendants ?? [];
    return [...list].sort(
      (a, b) =>
        AVAILABILITY_META[a.availability].rank - AVAILABILITY_META[b.availability].rank ||
        b.openChats - a.openChats ||
        a.name.localeCompare(b.name, "pt-BR"),
    );
  }, [data?.attendants]);

  const onlineCount = useMemo(
    () => attendants.filter((a) => a.availability === "available").length,
    [attendants],
  );

  const expediente = !data
    ? null
    : !data.businessHoursEnabled
      ? { label: "Expediente não configurado", className: "bg-muted text-muted-foreground" }
      : data.withinBusinessHours
        ? { label: "Em expediente", className: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" }
        : { label: "Fora do expediente", className: "bg-zinc-500/15 text-muted-foreground" };

  const updatedAt = dataUpdatedAt ? new Date(dataUpdatedAt) : null;

  return (
    <div className="mx-auto flex min-h-0 w-full max-w-6xl flex-1 flex-col overflow-y-auto space-y-6 p-4 md:p-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Painel de atendimento</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Visão ao vivo da fila, do SLA de 1ª resposta e da equipe. Atualiza automaticamente.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {expediente ? (
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium",
                expediente.className,
              )}
            >
              <Clock className="h-3.5 w-3.5" />
              {expediente.label}
            </span>
          ) : null}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => void refetch()}
            disabled={isFetching}
          >
            <RefreshCcw className={cn("h-4 w-4", isFetching && "animate-spin")} />
            Atualizar
          </Button>
        </div>
      </div>

      {isError ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-md border border-destructive/30 bg-destructive/5 py-6 text-center text-sm text-destructive">
          <CircleAlert className="h-5 w-5" />
          <p>{error instanceof Error ? error.message : "Falha ao carregar o painel."}</p>
          <Button type="button" size="sm" variant="outline" onClick={() => void refetch()}>
            Tentar novamente
          </Button>
        </div>
      ) : isLoading || !data ? (
        <p className="text-sm text-muted-foreground">Carregando painel…</p>
      ) : (
        <>
          {/* Fila & SLA agora */}
          <section className="space-y-3">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <AlarmClock className="h-4 w-4" />
              Agora
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <MetricTile
                label="Aguardando no pool"
                value={data.pool.waiting}
                hint={data.pool.waiting > 0 ? `Mais antigo há ${formatWait(data.pool.oldestWaitMinutes)}` : "Fila vazia"}
                variant={data.pool.waiting > 0 ? "warning" : "default"}
              />
              <MetricTile
                label="SLA estourado"
                value={data.sla.breached}
                hint="Sem 1ª resposta no prazo"
                variant={data.sla.breached > 0 ? "danger" : "default"}
              />
              <MetricTile
                label="SLA em risco"
                value={data.sla.atRisk}
                hint="Vence em até 15 min"
                variant={data.sla.atRisk > 0 ? "warning" : "default"}
              />
              <MetricTile
                label="Aguardando 1ª resposta"
                value={data.sla.awaitingFirstResponse}
                hint="Total em aberto"
              />
            </div>
          </section>

          {/* Hoje */}
          <section className="space-y-3">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Inbox className="h-4 w-4" />
              Hoje
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <MetricTile label="Chats abertos" value={data.today.chatsOpened} />
              <MetricTile label="1ª respostas" value={data.today.firstResponses} />
              <MetricTile
                label="Média 1ª resposta"
                value={data.today.avgFirstResponseMinutes != null ? `${data.today.avgFirstResponseMinutes} min` : "—"}
              />
              <MetricTile label="Recebidas" value={data.today.messagesInbound} />
              <MetricTile label="Enviadas" value={data.today.messagesOutbound} />
            </div>
          </section>

          {/* Equipe */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Users className="h-4 w-4" />
                Equipe ({onlineCount} disponível{onlineCount === 1 ? "" : "is"} de {attendants.length})
              </CardTitle>
              <CardDescription>Disponibilidade e carga atual de chats abertos por atendente.</CardDescription>
            </CardHeader>
            <CardContent>
              {attendants.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  Nenhum atendente cadastrado.
                </p>
              ) : (
                <div className="space-y-2">
                  {attendants.map((a) => {
                    const meta = AVAILABILITY_META[a.availability];
                    return (
                      <div
                        key={a.id}
                        className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-card/40 px-4 py-2.5"
                      >
                        <div className="flex min-w-0 items-center gap-2.5">
                          <span className={cn("h-2.5 w-2.5 shrink-0 rounded-full", meta.dot)} aria-hidden />
                          <span className="truncate text-sm font-medium">{a.name}</span>
                          <span className="text-xs text-muted-foreground">{meta.label}</span>
                        </div>
                        <span className="shrink-0 text-sm tabular-nums">
                          <span className="font-semibold">{a.openChats}</span>{" "}
                          <span className="text-muted-foreground">chat{a.openChats === 1 ? "" : "s"}</span>
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {updatedAt ? (
            <p className="text-right text-xs text-muted-foreground">
              Atualizado às{" "}
              {updatedAt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </p>
          ) : null}
        </>
      )}
    </div>
  );
}
