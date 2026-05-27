import { useCallback, useEffect, useState } from "react";
import { Check, Copy, Loader2, Sparkles, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  useSummarizeCrmNegotiation,
  type SummarizeNegotiationResponse,
} from "@/lib/api/crm-summarize";
import { useToast } from "@/hooks/use-toast";

/**
 * Renderiza simples markdown-leve em segurança: parágrafos vazios viram quebras;
 * `**negrito**` vira <strong>. Não suporta links/imagens (evita XSS).
 */
function renderSummary(text: string) {
  if (!text) return null;
  const lines = text.split(/\r?\n/);
  return lines.map((line, idx) => {
    const trimmed = line.trim();
    if (!trimmed) return <br key={idx} />;
    // Quebra **bold**. Sem regex inseguro porque entra entre split() seguros.
    const parts = trimmed.split(/(\*\*[^*]+\*\*)/g);
    return (
      <div key={idx} className="leading-relaxed">
        {parts.map((p, i) =>
          p.startsWith("**") && p.endsWith("**") ? (
            <strong key={i} className="text-[var(--crm-ink)]">
              {p.slice(2, -2)}
            </strong>
          ) : (
            <span key={i}>{p}</span>
          ),
        )}
      </div>
    );
  });
}

export function NegotiationAiSummaryButton({
  negotiationId,
  variant = "ghost",
}: {
  negotiationId: string;
  variant?: "ghost" | "outline" | "default";
}) {
  const [open, setOpen] = useState(false);
  const [result, setResult] = useState<SummarizeNegotiationResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const summarize = useSummarizeCrmNegotiation();
  const { toast } = useToast();

  const run = useCallback(async () => {
    setError(null);
    setResult(null);
    try {
      const res = await summarize.mutateAsync(negotiationId);
      setResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao gerar resumo.");
    }
  }, [negotiationId, summarize]);

  // Dispara automaticamente ao abrir.
  useEffect(() => {
    if (open && !result && !summarize.isPending && !error) {
      void run();
    }
    if (!open) {
      setCopied(false);
    }
  }, [open, result, summarize.isPending, error, run]);

  const handleCopy = useCallback(async () => {
    if (!result?.summary) return;
    try {
      await navigator.clipboard.writeText(result.summary);
      setCopied(true);
      toast({ title: "Resumo copiado para a área de transferência." });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({
        title: "Não foi possível copiar",
        description: "Selecione manualmente o texto.",
        variant: "destructive",
      });
    }
  }, [result?.summary, toast]);

  return (
    <>
      <Button
        type="button"
        variant={variant}
        size="sm"
        className="h-8 gap-2"
        onClick={() => setOpen(true)}
      >
        <Sparkles className="h-4 w-4 text-[var(--crm-brand)]" aria-hidden />
        Resumir com IA
      </Button>

      <Dialog
        open={open}
        onOpenChange={(o) => {
          setOpen(o);
          if (!o) {
            setResult(null);
            setError(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-[var(--crm-brand)]" aria-hidden />
              Resumo do negócio
            </DialogTitle>
            <DialogDescription>
              IA lê o histórico (atividades, comentários, tarefas, conversa e cliente) e devolve
              um briefing em bullets — útil pra retomar um negócio sem reler tudo.
            </DialogDescription>
          </DialogHeader>

          <div className="min-h-[200px] rounded-md border border-[var(--crm-border)] bg-[var(--crm-surface)]/40 p-4 text-sm text-[var(--crm-ink-2)]">
            {summarize.isPending ? (
              <div className="flex items-center gap-2 text-[var(--crm-ink-3)]">
                <Loader2 className="h-4 w-4 animate-spin" />
                Lendo o histórico e resumindo…
              </div>
            ) : error ? (
              <div className="text-[var(--crm-danger-strong)]">{error}</div>
            ) : result?.summary ? (
              <div className="space-y-0.5">{renderSummary(result.summary)}</div>
            ) : (
              <div className="text-[var(--crm-ink-3)]">Aguardando…</div>
            )}
          </div>

          {result && !error ? (
            <div className="flex flex-wrap items-center gap-3 text-[10px] text-[var(--crm-ink-3)]">
              <span>
                {result.contextSize.activities} atividade
                {result.contextSize.activities === 1 ? "" : "s"} ·{" "}
                {result.contextSize.comments} coment.
                {result.contextSize.tasks > 0 ? ` · ${result.contextSize.tasks} tarefa(s)` : ""}
                {result.contextSize.products > 0 ? ` · ${result.contextSize.products} produto(s)` : ""}
                {result.contextSize.messages > 0 ? ` · ${result.contextSize.messages} msg(s)` : ""}
              </span>
              <span>·</span>
              <span title={`Modelo ${result.model}`}>
                {result.usage.input_tokens} in / {result.usage.output_tokens} out tokens
              </span>
            </div>
          ) : null}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => void run()}
              disabled={summarize.isPending}
            >
              <RefreshCw className={`h-4 w-4 ${summarize.isPending ? "animate-spin" : ""}`} />
              Regerar
            </Button>
            <Button
              type="button"
              size="sm"
              className="gap-2"
              onClick={() => void handleCopy()}
              disabled={!result?.summary || summarize.isPending}
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? "Copiado" : "Copiar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
