import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { planos } from "@/data/planosCatalog";
import { readSignUpDraft, writeSignUpDraft } from "@/lib/signup-storage";

const steps = ["Conta", "Plano", "Pagamento"];

export default function CadastroPlano() {
  const draft = readSignUpDraft();
  const [anual, setAnual] = useState(draft.billingPeriod === "anual");
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center px-4 py-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center">
          <Zap className="w-5 h-5 text-accent-foreground" />
        </div>
        <span className="font-syne font-bold text-xl text-foreground">DistribuiBot</span>
      </div>

      {/* Stepper */}
      <div className="flex items-center justify-center gap-2 mb-8">
        {steps.map((step, i) => (
          <div key={step} className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
              i <= 1 ? "bg-accent text-accent-foreground" : "bg-secondary text-muted-foreground"
            }`}>
              {i < 1 ? <Check className="w-4 h-4" /> : i + 1}
            </div>
            <span className={`text-sm font-medium ${i <= 1 ? "text-foreground" : "text-muted-foreground"}`}>
              {step}
            </span>
            {i < steps.length - 1 && <div className="w-8 h-px bg-border" />}
          </div>
        ))}
      </div>

      <h1 className="font-syne text-3xl font-bold text-foreground mb-2 text-center">
        Escolha seu plano
      </h1>
      <p className="text-muted-foreground mb-6 text-center">
        Comece grátis por 14 dias, sem cartão de crédito
      </p>

      {/* Toggle Mensal / Anual */}
      <div className="flex items-center gap-3 mb-10">
        <span className={`text-sm font-medium ${!anual ? "text-foreground" : "text-muted-foreground"}`}>Mensal</span>
        <button
          onClick={() => {
            const nextValue = !anual;
            setAnual(nextValue);
            writeSignUpDraft({ billingPeriod: nextValue ? "anual" : "mensal" });
          }}
          className={`relative w-12 h-6 rounded-full transition-colors ${anual ? "bg-accent" : "bg-secondary"}`}
        >
          <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${anual ? "translate-x-6" : "translate-x-0.5"}`} />
        </button>
        <span className={`text-sm font-medium ${anual ? "text-foreground" : "text-muted-foreground"}`}>Anual</span>
        {anual && <Badge className="bg-success/20 text-success text-xs rounded-badge">-20%</Badge>}
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl w-full">
        {planos.map((plano) => (
          <div
            key={plano.id}
            className={`glass rounded-xl p-6 flex flex-col relative ${
              plano.destaque
                ? "border-2 border-accent shadow-[0_0_30px_hsl(24_95%_53%/0.15)]"
                : ""
            }`}
          >
            {plano.destaque && (
              <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent text-accent-foreground rounded-badge px-4 py-1 text-xs font-semibold">
                Mais popular
              </Badge>
            )}

            <Badge className="w-fit bg-secondary text-muted-foreground rounded-badge text-xs mb-4">
              {plano.badge}
            </Badge>

            <h3 className="font-syne text-xl font-bold text-foreground mb-1">{plano.nome}</h3>

            <div className="mb-5">
              <span className="font-syne text-4xl font-bold text-foreground">
                R$ {anual ? plano.preco_anual : plano.preco_mensal}
              </span>
              <span className="text-muted-foreground text-sm">/mês</span>
              {anual && (
                <p className="text-xs text-muted-foreground mt-1 line-through">
                  R$ {plano.preco_mensal}/mês
                </p>
              )}
            </div>

            <ul className="space-y-3 mb-6 flex-1">
              {plano.features.map((f, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-foreground/80">
                  <Check className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
                  {f}
                </li>
              ))}
            </ul>

            <Button
              onClick={() => {
                writeSignUpDraft({
                  plano: plano.id,
                  billingPeriod: anual ? "anual" : "mensal",
                });
                navigate("/cadastro/pagamento");
              }}
              className={`w-full h-11 rounded-lg font-semibold ${
                plano.destaque
                  ? "bg-accent hover:bg-accent/90 text-accent-foreground"
                  : "bg-secondary hover:bg-secondary/80 text-foreground border border-border"
              }`}
            >
              {plano.id === "enterprise" ? "Falar com vendas" : `Começar com ${plano.nome}`}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
