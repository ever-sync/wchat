import { Sparkles } from "lucide-react";

/**
 * Aba "Automação 2.0" do Marketing — ponto de partida para a nova experiência
 * de automações (canvas/fluxos). Por enquanto, uma tela de boas-vindas; o
 * conteúdo real será construído aqui.
 */
export function MarketingAutomations2() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-border bg-muted/30 py-20 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Sparkles className="h-6 w-6" aria-hidden />
      </div>
      <div className="space-y-1">
        <p className="text-base font-semibold text-foreground">Automação 2.0</p>
        <p className="max-w-md text-sm text-muted-foreground">
          A nova experiência de automações começa aqui. Em breve.
        </p>
      </div>
    </div>
  );
}
