import { useEffect, useRef, useState } from "react";
import { Activity, BookOpen, Bot, Radio, SlidersHorizontal, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { extractPdfText } from "@/lib/pdf-text";
import { cn } from "@/lib/utils";
import {
  type AiChannel,
  type AiDefaultMode,
  type AiError,
  type AiProvider,
  type AiTurn,
  type LlmProvider,
  type TenantAiConfig,
  useAddKnowledgeSource,
  useAiChannels,
  useAiErrors,
  useAiSubscription,
  useAiTurns,
  useImportKnowledgeUrl,
  useAiUsageThisMonth,
  useDeleteKnowledgeSource,
  useKnowledgeSources,
  useTenantAiConfig,
  useUpdateAiChannel,
  useUpsertTenantAiConfig,
} from "@/lib/api/ai-agent";

const PROVIDER_LABELS: Record<AiProvider, string> = {
  off: "Desligada",
  native: "Nativa (orquestrador WChat)",
  n8n: "Externa (N8N)",
};

const LLM_PROVIDER_LABELS: Record<LlmProvider, string> = {
  anthropic: "Anthropic (Claude)",
  openai: "OpenAI (GPT)",
};

const LLM_MODELS: Record<LlmProvider, Array<{ value: string; label: string }>> = {
  anthropic: [
    { value: "claude-opus-4-7", label: "Claude Opus 4.7" },
    { value: "claude-sonnet-4-6", label: "Claude Sonnet 4.6" },
    { value: "claude-haiku-4-5", label: "Claude Haiku 4.5" },
  ],
  openai: [
    { value: "gpt-4.1", label: "GPT-4.1" },
    { value: "gpt-4.1-mini", label: "GPT-4.1 mini" },
    { value: "gpt-4o", label: "GPT-4o" },
    { value: "gpt-4o-mini", label: "GPT-4o mini" },
  ],
};

/** Modelos do provedor + o modelo atual (caso seja um id fora da lista). */
function modelOptions(provider: LlmProvider, current: string): Array<{ value: string; label: string }> {
  const base = LLM_MODELS[provider];
  if (current && !base.some((m) => m.value === current)) {
    return [{ value: current, label: current }, ...base];
  }
  return base;
}

function nf(n: number): string {
  return n.toLocaleString("pt-BR");
}

export default function AgenteIA() {
  return (
    <div className="mx-auto flex min-h-0 w-full max-w-6xl flex-1 flex-col overflow-y-auto space-y-6 p-4 md:p-8">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Bot className="h-5 w-5" aria-hidden />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Agente IA</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Configure a IA que atende, qualifica e passa para o humano nos seus canais.
          </p>
        </div>
      </div>

      <Tabs defaultValue="configuracao">
        <TabsList className="flex h-auto flex-wrap gap-1">
          <TabsTrigger value="configuracao" className="gap-1.5">
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Configuração
          </TabsTrigger>
          <TabsTrigger value="conhecimento" className="gap-1.5">
            <BookOpen className="h-3.5 w-3.5" />
            Base de conhecimento
          </TabsTrigger>
          <TabsTrigger value="canais" className="gap-1.5">
            <Radio className="h-3.5 w-3.5" />
            Canais
          </TabsTrigger>
          <TabsTrigger value="atividade" className="gap-1.5">
            <Activity className="h-3.5 w-3.5" />
            Atividade
          </TabsTrigger>
        </TabsList>

        <TabsContent value="configuracao" className="mt-4">
          <ConfiguracaoTab />
        </TabsContent>

        <TabsContent value="conhecimento" className="mt-4">
          <ConhecimentoTab />
        </TabsContent>

        <TabsContent value="canais" className="mt-4">
          <CanaisTab />
        </TabsContent>

        <TabsContent value="atividade" className="mt-4">
          <AtividadeTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ConfiguracaoTab() {
  const { toast } = useToast();
  const { data, isLoading } = useTenantAiConfig();
  const upsert = useUpsertTenantAiConfig({
    onSuccess: () => toast({ title: "Configuração salva." }),
    onError: (error) =>
      toast({ title: "Não foi possível salvar", description: error.message, variant: "destructive" }),
  });
  const [form, setForm] = useState<TenantAiConfig | null>(null);

  useEffect(() => {
    if (data) setForm(data);
  }, [data]);

  if (isLoading || !form) {
    return <LoadingCard />;
  }

  const set = (patch: Partial<TenantAiConfig>) => setForm((prev) => (prev ? { ...prev, ...patch } : prev));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Configuração do agente</CardTitle>
        <CardDescription>Modo de atuação, persona e limites de cada conversa.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-2">
          <Label>Modo de atuação</Label>
          <Select value={form.provider} onValueChange={(v) => set({ provider: v as AiProvider })}>
            <SelectTrigger className="w-full sm:w-80">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="off">{PROVIDER_LABELS.off}</SelectItem>
              <SelectItem value="native">{PROVIDER_LABELS.native}</SelectItem>
              <SelectItem value="n8n">{PROVIDER_LABELS.n8n}</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            <strong>Nativa</strong> usa o orquestrador do WChat (responde, qualifica, transfere).{" "}
            <strong>Externa</strong> envia os atendimentos para o seu fluxo no N8N. <strong>Desligada</strong> não
            responde automaticamente.
          </p>
        </div>

        <div className="grid gap-2">
          <Label>Provedor de IA</Label>
          <Select
            value={form.llmProvider}
            onValueChange={(v) => {
              const provider = v as LlmProvider;
              set({ llmProvider: provider, model: LLM_MODELS[provider][0].value });
            }}
          >
            <SelectTrigger className="w-full sm:w-80">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="anthropic">{LLM_PROVIDER_LABELS.anthropic}</SelectItem>
              <SelectItem value="openai">{LLM_PROVIDER_LABELS.openai}</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            {form.llmProvider === "openai"
              ? "Requer a chave OPENAI_API_KEY configurada no servidor."
              : "Requer a chave ANTHROPIC_API_KEY configurada no servidor."}
          </p>
        </div>

        <div className="grid gap-2">
          <Label>Modelo</Label>
          <Select value={form.model} onValueChange={(v) => set({ model: v })}>
            <SelectTrigger className="w-full sm:w-80">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {modelOptions(form.llmProvider, form.model).map((m) => (
                <SelectItem key={m.value} value={m.value}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="ai-persona">Persona / instruções</Label>
          <Textarea
            id="ai-persona"
            value={form.systemPrompt}
            onChange={(e) => set({ systemPrompt: e.target.value })}
            placeholder="Ex.: Você é a Ana, atendente da Loja X. Seja cordial e objetiva..."
            rows={6}
          />
          <p className="text-xs text-muted-foreground">Em branco usa a persona padrão do sistema.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="grid gap-2">
            <Label htmlFor="ai-debounce">Espera antes de responder (s)</Label>
            <Input
              id="ai-debounce"
              type="number"
              min={0}
              max={120}
              value={form.debounceSeconds}
              onChange={(e) => set({ debounceSeconds: Number(e.target.value) })}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="ai-maxtokens">Máx. tokens por resposta</Label>
            <Input
              id="ai-maxtokens"
              type="number"
              min={256}
              max={8192}
              value={form.maxOutputTokens}
              onChange={(e) => set({ maxOutputTokens: Number(e.target.value) })}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="ai-limit">Limite mensal de tokens</Label>
            <Input
              id="ai-limit"
              type="number"
              min={0}
              value={form.monthlyTokenLimit ?? ""}
              onChange={(e) => set({ monthlyTokenLimit: e.target.value === "" ? null : Number(e.target.value) })}
              placeholder="Sem limite"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={() => upsert.mutate(form)} disabled={upsert.isPending}>
            {upsert.isPending ? "Salvando…" : "Salvar configuração"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function ConhecimentoTab() {
  const { toast } = useToast();
  const { data: sources = [], isLoading, isError, error } = useKnowledgeSources();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [url, setUrl] = useState("");
  const [pdfLoading, setPdfLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const add = useAddKnowledgeSource({
    onSuccess: () => {
      toast({ title: "Conteúdo adicionado à base." });
      setTitle("");
      setContent("");
    },
    onError: (e) => toast({ title: "Não foi possível adicionar", description: e.message, variant: "destructive" }),
  });
  const importUrl = useImportKnowledgeUrl({
    onSuccess: () => {
      toast({ title: "Página importada para a base." });
      setUrl("");
    },
    onError: (e) => toast({ title: "Não foi possível importar", description: e.message, variant: "destructive" }),
  });
  const del = useDeleteKnowledgeSource({
    onError: (e) => toast({ title: "Não foi possível remover", description: e.message, variant: "destructive" }),
  });

  async function handlePdf(file: File) {
    setPdfLoading(true);
    try {
      const text = await extractPdfText(file);
      if (!text.trim()) {
        toast({
          title: "PDF sem texto extraível",
          description: "Pode ser um PDF escaneado (imagem). Tente colar o texto manualmente.",
          variant: "destructive",
        });
        return;
      }
      await add.mutateAsync({ title: file.name.replace(/\.pdf$/i, ""), content: text });
      toast({ title: "PDF importado para a base." });
    } catch (e) {
      toast({
        title: "Não foi possível ler o PDF",
        description: e instanceof Error ? e.message : "Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setPdfLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Adicionar conteúdo</CardTitle>
          <CardDescription>
            Cole textos sobre produtos, preços, políticas e FAQ. A IA usa isso para responder com precisão.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-2">
            <Label htmlFor="kb-title">Título</Label>
            <Input
              id="kb-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex.: Política de trocas"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="kb-content">Conteúdo</Label>
            <Textarea
              id="kb-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Cole aqui o texto..."
              rows={6}
            />
          </div>
          <div className="flex justify-end">
            <Button
              onClick={() => add.mutate({ title: title.trim(), content: content.trim() })}
              disabled={!title.trim() || !content.trim() || add.isPending}
            >
              {add.isPending ? "Processando…" : "Adicionar à base"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Importar página ou PDF</CardTitle>
          <CardDescription>
            Cole o link do seu site/FAQ ou suba um PDF — a IA extrai o texto automaticamente.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://seusite.com/faq"
              className="flex-1"
            />
            <Button onClick={() => importUrl.mutate(url.trim())} disabled={!url.trim() || importUrl.isPending}>
              {importUrl.isPending ? "Importando…" : "Importar"}
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <input
              ref={fileRef}
              type="file"
              accept="application/pdf,.pdf"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void handlePdf(file);
                e.target.value = "";
              }}
            />
            <Button variant="outline" onClick={() => fileRef.current?.click()} disabled={pdfLoading || add.isPending}>
              {pdfLoading ? "Lendo PDF…" : "Subir PDF"}
            </Button>
            <span className="text-xs text-muted-foreground">PDF com texto (não escaneado).</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Conteúdos cadastrados</CardTitle>
          <CardDescription>Fontes que a IA consulta ao responder.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Carregando…</p>
          ) : isError ? (
            <p className="text-sm text-destructive">{error?.message ?? "Erro ao carregar a base."}</p>
          ) : sources.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum conteúdo cadastrado ainda.</p>
          ) : (
            <ul className="divide-y divide-border">
              {sources.map((source) => (
                <li key={source.id} className="flex items-center justify-between gap-3 py-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">{source.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(source.created_at).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => del.mutate(source.id)}
                    disabled={del.isPending}
                    aria-label={`Remover ${source.title}`}
                  >
                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function CanaisTab() {
  const { data: channels = [], isLoading, isError, error } = useAiChannels();
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Canais</CardTitle>
        <CardDescription>
          Ligue a IA por canal. Conversas novas em canais ligados já entram com a IA atendendo.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando…</p>
        ) : isError ? (
          <p className="text-sm text-destructive">{error?.message ?? "Erro ao carregar os canais."}</p>
        ) : channels.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum canal de WhatsApp conectado.</p>
        ) : (
          <ul className="space-y-3">
            {channels.map((channel) => (
              <ChannelCard key={channel.id} channel={channel} />
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function ChannelCard({ channel }: { channel: AiChannel }) {
  const { toast } = useToast();
  const [enabled, setEnabled] = useState(channel.ai_enabled);
  const [mode, setMode] = useState<AiDefaultMode>(channel.ai_default_mode);
  const [persona, setPersona] = useState(channel.ai_persona ?? "");

  const update = useUpdateAiChannel({
    onSuccess: () => toast({ title: "Canal atualizado." }),
    onError: (e) => toast({ title: "Não foi possível salvar", description: e.message, variant: "destructive" }),
  });

  const dirty =
    enabled !== channel.ai_enabled ||
    mode !== channel.ai_default_mode ||
    persona.trim() !== (channel.ai_persona ?? "");

  return (
    <li className="rounded-md border border-border p-3">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-foreground">{channel.display_name}</p>
          <p className="text-xs text-muted-foreground">
            {channel.phone_number || "sem número"} · {channel.status}
          </p>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">IA ativa</span>
          <Switch checked={enabled} onCheckedChange={setEnabled} />
        </label>
      </div>

      {enabled ? (
        <div className="mt-3 space-y-3 border-t border-border pt-3">
          <div className="grid gap-2">
            <Label>Modo padrão (conversas novas)</Label>
            <Select value={mode} onValueChange={(v) => setMode(v as AiDefaultMode)}>
              <SelectTrigger className="w-full sm:w-72">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="qualifying">Qualificação (etapas iniciais)</SelectItem>
                <SelectItem value="full">Completo</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>Persona deste canal (opcional)</Label>
            <Textarea
              value={persona}
              onChange={(e) => setPersona(e.target.value)}
              placeholder="Em branco usa a persona geral da aba Configuração."
              rows={4}
            />
          </div>
        </div>
      ) : null}

      <div className="mt-3 flex justify-end">
        <Button
          size="sm"
          disabled={!dirty || update.isPending}
          onClick={() =>
            update.mutate({
              id: channel.id,
              patch: { ai_enabled: enabled, ai_default_mode: mode, ai_persona: persona.trim() || null },
            })
          }
        >
          {update.isPending ? "Salvando…" : "Salvar"}
        </Button>
      </div>
    </li>
  );
}

function AtividadeTab() {
  const { data, isLoading } = useAiUsageThisMonth();
  const { data: config } = useTenantAiConfig();
  const { data: sub } = useAiSubscription();

  if (isLoading || !data) {
    return <LoadingCard />;
  }

  const totalTokens = data.inputTokens + data.outputTokens;
  // Limite efetivo: cota do plano (add-on ativo, sem overage) e/ou auto-teto do tenant.
  const planQuota = sub?.active && sub.monthlyTokenQuota > 0 && !sub.overageAllowed ? sub.monthlyTokenQuota : null;
  const selfLimit = config?.monthlyTokenLimit && config.monthlyTokenLimit > 0 ? config.monthlyTokenLimit : null;
  const candidates = [planQuota, selfLimit].filter((v): v is number => v != null);
  const limit = candidates.length > 0 ? Math.min(...candidates) : null;
  const quotaPct = limit ? Math.round((totalTokens / limit) * 100) : null;

  const stats = [
    {
      label: "Custo estimado (mês)",
      value: data.costUsd.toLocaleString("pt-BR", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: data.costUsd < 1 ? 4 : 2,
      }),
    },
    { label: "Turnos da IA", value: nf(data.messages) },
    { label: "Tokens de entrada", value: nf(data.inputTokens) },
    { label: "Tokens de saída", value: nf(data.outputTokens) },
    { label: "Tokens de cache (lidos)", value: nf(data.cacheReadTokens) },
  ];

  return (
    <div className="space-y-4">
      {sub ? (
        (() => {
          const trialDate = sub.trialEndsAt ? new Date(sub.trialEndsAt) : null;
          const trialExpired = trialDate ? trialDate <= new Date() : false;
          const effectiveActive = sub.active && !trialExpired;
          return (
            <div className="text-sm text-muted-foreground">
              Add-on de IA:{" "}
              <strong className={effectiveActive ? "text-foreground" : "text-destructive"}>
                {trialExpired ? "trial expirado" : sub.active ? "ativo" : "inativo"}
              </strong>
              {effectiveActive && trialDate ? ` · trial até ${trialDate.toLocaleDateString("pt-BR")}` : ""}
              {effectiveActive && sub.monthlyTokenQuota > 0
                ? ` · cota ${nf(sub.monthlyTokenQuota)} tokens/mês${sub.overageAllowed ? " (com overage)" : ""}`
                : ""}
            </div>
          );
        })()
      ) : null}
      {quotaPct !== null && quotaPct >= 80 ? (
        <div
          className={cn(
            "rounded-md border p-3 text-sm",
            quotaPct >= 100
              ? "border-destructive bg-destructive/10 text-destructive"
              : "border-amber-300 bg-amber-50 text-amber-800",
          )}
        >
          {quotaPct >= 100
            ? `Limite mensal de tokens atingido (${nf(totalTokens)}/${nf(limit!)}). A IA fica em pausa até virar o mês ou você aumentar o limite na aba Configuração.`
            : `Você já usou ${quotaPct}% do limite mensal de tokens (${nf(totalTokens)}/${nf(limit!)}).`}
        </div>
      ) : null}
      <div>
        <p className="mb-3 text-sm text-muted-foreground">Consumo no mês atual.</p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {stats.map((stat) => (
            <Card key={stat.label}>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">{stat.label}</p>
                <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">{stat.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Custo estimado em US$ a partir dos tokens e do modelo de cada turno (preços de tabela; pode variar).
        </p>
      </div>
      <FailuresList />
      <TurnsList />
    </div>
  );
}

function FailuresList() {
  const { data: errors = [] } = useAiErrors();
  if (errors.length === 0) return null;

  return (
    <Card className="border-destructive/40">
      <CardHeader>
        <CardTitle className="text-base text-destructive">Falhas recentes</CardTitle>
        <CardDescription>Atendimentos em que a IA falhou após as tentativas — veja o motivo.</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {errors.map((err: AiError, i) => (
            <li key={`${err.chat_id}-${i}`} className="rounded-md border border-border p-3 text-sm">
              <div className="mb-1 text-xs text-muted-foreground">
                {new Date(err.updated_at).toLocaleString("pt-BR")}
              </div>
              <p className="break-words text-destructive">{err.last_error ?? "Erro desconhecido."}</p>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

function TurnsList() {
  const { data: turns = [], isLoading } = useAiTurns();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Últimas interações da IA</CardTitle>
        <CardDescription>
          Veja o que a IA respondeu e em quais trechos da base ela se baseou — útil para auditar e evitar respostas
          inventadas.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando…</p>
        ) : turns.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma interação registrada ainda.</p>
        ) : (
          <ul className="space-y-3">
            {turns.map((turn) => (
              <TurnRow key={turn.id} turn={turn} />
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function TurnRow({ turn }: { turn: AiTurn }) {
  const topSimilarity = turn.retrieved.length > 0
    ? Math.round(Math.max(...turn.retrieved.map((r) => r.similarity ?? 0)) * 100)
    : 0;
  const writeTools = (turn.tools ?? []).filter((t) => t.name && t.name !== "send_whatsapp_message");

  return (
    <li className="rounded-md border border-border p-3">
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <span className="text-xs text-muted-foreground">{new Date(turn.created_at).toLocaleString("pt-BR")}</span>
        {turn.retrieved.length > 0 ? (
          <Badge variant="secondary" className="font-normal">
            base: {turn.retrieved.length} trecho(s) · top {topSimilarity}%
          </Badge>
        ) : (
          <Badge variant="outline" className="font-normal text-muted-foreground">
            sem base
          </Badge>
        )}
      </div>
      {turn.user_message ? (
        <p className="text-sm">
          <span className="text-muted-foreground">Cliente:</span> {turn.user_message}
        </p>
      ) : null}
      {turn.reply ? (
        <p className="mt-1 text-sm">
          <span className="text-muted-foreground">IA:</span> {turn.reply}
        </p>
      ) : (
        <p className="mt-1 text-sm text-muted-foreground italic">Sem resposta enviada ({turn.stop_reason ?? "—"}).</p>
      )}
      {writeTools.length > 0 ? (
        <div className="mt-2 flex flex-wrap gap-1">
          {writeTools.map((t, i) => (
            <Badge
              key={`${turn.id}-${i}`}
              variant="outline"
              className={cn("font-normal", t.is_error && "border-destructive text-destructive")}
            >
              {t.name}
            </Badge>
          ))}
        </div>
      ) : null}
    </li>
  );
}

function LoadingCard() {
  return (
    <Card>
      <CardContent className="p-6 text-sm text-muted-foreground">Carregando…</CardContent>
    </Card>
  );
}
