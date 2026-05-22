import { ArrowLeft, Loader2 } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMarketingAnalytics } from "@/lib/api/marketing-analytics";

const PIE_COLORS = ["#6d28d9", "#0ea5e9", "#22c55e", "#f59e0b", "#ef4444", "#64748b"];

function Kpi({ label, value, suffix }: { label: string; value: number | string; suffix?: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="mt-1 text-2xl font-semibold">
          {value}
          {suffix ? <span className="text-base font-normal text-muted-foreground">{suffix}</span> : null}
        </p>
      </CardContent>
    </Card>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">{title}</CardTitle>
      </CardHeader>
      <CardContent className="h-64">{children}</CardContent>
    </Card>
  );
}

interface MarketingAnalyticsProps {
  onBack: () => void;
}

export function MarketingAnalytics({ onBack }: MarketingAnalyticsProps) {
  const { data, isLoading } = useMarketingAnalytics();

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" className="h-8" onClick={onBack}>
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          Voltar
        </Button>
        <div>
          <h2 className="text-lg font-semibold">Analytics</h2>
          <p className="text-sm text-muted-foreground">Desempenho dos formulários nos últimos 90 dias.</p>
        </div>
      </div>

      {isLoading || !data ? (
        <div className="flex justify-center py-16 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Kpi label="Visualizações" value={data.totals.views} />
            <Kpi label="Envios" value={data.totals.submissions} />
            <Kpi label="Conversão" value={data.totals.conversionRate} suffix="%" />
            <Kpi label="Score médio" value={data.totals.avgScore} />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <ChartCard title="Leads por dia">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.byDay}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} width={28} />
                  <RechartsTooltip />
                  <Line type="monotone" dataKey="count" stroke="#6d28d9" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Conversão por formulário (%)">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.perForm.slice(0, 8)}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-15} textAnchor="end" height={50} />
                  <YAxis tick={{ fontSize: 11 }} width={28} />
                  <RechartsTooltip />
                  <Bar dataKey="conversion" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Origem (UTM)">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.byUtmSource} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="source" tick={{ fontSize: 11 }} width={90} />
                  <RechartsTooltip />
                  <Bar dataKey="count" fill="#22c55e" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Dispositivo">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={data.byDevice} dataKey="count" nameKey="device" cx="50%" cy="50%" outerRadius={80} label>
                    {data.byDevice.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>
        </>
      )}
    </div>
  );
}
