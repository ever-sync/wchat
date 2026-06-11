import { useNavigate } from "react-router-dom";
import { ArrowRight, Ban, LayoutTemplate, Sparkles, Star, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Aba "Automação 2.0" do Marketing — vitrine do que já foi entregue da nova
 * geração de automações (plano em docs/PLANO_AUTOMACAO_2.0.md) com atalhos
 * para usar. O editor/galeria continuam na aba Automações; aqui é o hub.
 */
const HIGHLIGHTS = [
  {
    icon: Star,
    title: "Definir qualificação (estrelas)",
    description:
      "Dê 0–5 estrelas à negociação direto no fluxo. Fecha o caso clássico: formulário qualificado → CRM + estrelas + WhatsApp.",
  },
  {
    icon: Ban,
    title: "Cancelar inscrição (opt-out)",
    description:
      "Suprime WhatsApp, e-mail, SMS ou todos os canais para o lead. Os envios automáticos respeitam a supressão (LGPD).",
  },
  {
    icon: UserRound,
    title: "Transferir para humano",
    description:
      "Pausa a IA e entrega a conversa ao time. Dispara o evento de IA pausada, que pode inscrever o lead em outros fluxos.",
  },
  {
    icon: LayoutTemplate,
    title: "Modelos que funcionam",
    description:
      "Galeria saneada: todo modelo gera fluxo 100% executável — incluindo o novo “Formulário qualificado → CRM + WhatsApp”.",
  },
] as const;

export function MarketingAutomations2() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2 rounded-xl border border-border bg-card p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Sparkles className="h-5 w-5" aria-hidden />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Automação 2.0</h2>
            <p className="text-sm text-muted-foreground">
              A nova geração de automações de marketing e vendas — WhatsApp em primeiro lugar,
              CRM e IA no mesmo fluxo.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {HIGHLIGHTS.map((item) => (
          <div
            key={item.title}
            className="flex flex-col gap-2 rounded-xl border border-border bg-card p-5"
          >
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                <item.icon className="h-4 w-4" aria-hidden />
              </span>
              <span className="text-sm font-semibold text-foreground">{item.title}</span>
              <span className="ml-auto rounded-md bg-cyan-200 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-foreground">
                Novo
              </span>
            </div>
            <p className="text-sm text-muted-foreground">{item.description}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col items-start gap-3 rounded-xl border border-dashed border-border bg-muted/30 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-foreground">
            Pronto para começar? Crie um fluxo a partir de um modelo.
          </p>
          <p className="text-xs text-muted-foreground">
            Os modelos e o editor de fluxos vivem na aba Automações.
          </p>
        </div>
        <Button
          type="button"
          className="gap-2"
          onClick={() => navigate("/marketing?aba=automacoes")}
        >
          Abrir Automações
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        Em breve: botões interativos e “esperar resposta do lead”, templates oficiais (HSM) fora
        da janela de 24h, horário comercial por fluxo e analytics por passo. Roadmap completo em
        docs/PLANO_AUTOMACAO_2.0.md.
      </p>
    </div>
  );
}
