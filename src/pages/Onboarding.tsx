import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Check,
  MessageSquare,
  PartyPopper,
  Settings2,
  Upload,
  Users,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useWhatsappInstances } from "@/lib/api/whatsapp";
import { useAppStore } from "@/store/useAppStore";

const totalSteps = 4;

export default function Onboarding() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const { data: instances = [] } = useWhatsappInstances();

  const progress = (step / totalSteps) * 100;
  const defaultInstance = useMemo(
    () => instances.find((instance) => instance.isDefault) ?? instances[0] ?? null,
    [instances],
  );
  const connectedInstance = defaultInstance?.status === "connected" ? defaultInstance : null;

  useEffect(() => {
    if (step === 1 && connectedInstance) {
      const timeout = setTimeout(() => setStep(2), 1200);
      return () => clearTimeout(timeout);
    }

    return undefined;
  }, [connectedInstance, step]);

  function finalizeOnboardingAndGo(path: "/inbox" | "/crm") {
    const descricao =
      path === "/crm"
        ? "Abra o CRM para acompanhar negociacoes e o funil."
        : "Abra o Inbox para ver conversas assim que a instancia estiver ativa.";
    toast({ title: "Onboarding concluido", description: descricao });
    useAppStore.getState().addNotification({
      tipo: "sucesso",
      titulo: "Onboarding concluido",
      descricao,
    });
    navigate(path);
  }

  return (
    <div className="min-h-screen flex flex-col items-center px-4 py-8">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent">
          <Zap className="h-5 w-5 text-accent-foreground" />
        </div>
        <span className="font-syne text-xl font-bold text-foreground">DistribuiBot</span>
      </div>

      <div className="mb-8 w-full max-w-xl">
        <div className="mb-2 flex justify-between text-xs text-muted-foreground">
          <span>Passo {step} de {totalSteps}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-2 bg-secondary [&>div]:bg-accent" />
      </div>

      <div className="glass w-full max-w-xl rounded-2xl p-8">
        {step === 1 && (
          <div className="text-center">
            <h2 className="font-syne text-2xl font-bold text-foreground">Conectar WhatsApp</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Comece vinculando uma instancia UAZAPI realmente conectada.
            </p>

            <div className="mt-8 rounded-2xl border border-border p-6">
              {defaultInstance ? (
                <>
                  <div className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full ${connectedInstance ? "bg-success/20" : "bg-warning/15"}`}>
                    <Check className={`h-8 w-8 ${connectedInstance ? "text-success" : "text-warning"}`} />
                  </div>
                  <p className="font-medium text-foreground">{defaultInstance.displayName}</p>
                  <p className="text-sm text-muted-foreground">
                    {defaultInstance.phoneNumber ?? defaultInstance.uazapiInstanceName}
                  </p>
                  <Badge className={`mt-4 ${connectedInstance ? "bg-success/20 text-success" : "bg-warning/20 text-warning"}`}>
                    {connectedInstance ? "Conectada" : "Aguardando conexao real"}
                  </Badge>
                </>
              ) : (
                <>
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-warning/15">
                    <MessageSquare className="h-8 w-8 text-warning" />
                  </div>
                  <p className="font-medium text-foreground">Nenhuma instancia encontrada</p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Va em Configuracoes e conecte sua UAZAPI para continuar.
                  </p>
                </>
              )}
            </div>

            <div className="mt-6 flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => navigate("/configuracoes")}>
                Abrir configuracoes
              </Button>
              <Button
                className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90"
                disabled={!connectedInstance}
                onClick={() => setStep(2)}
              >
                Continuar
              </Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 className="text-center font-syne text-2xl font-bold text-foreground">Importar clientes</h2>
            <p className="mt-2 text-center text-sm text-muted-foreground">
              A operacao so ganha vida quando a base real entra no modulo de clientes.
            </p>

            <div className="mt-8 rounded-2xl border-2 border-dashed border-border p-10 text-center">
              <Upload className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
              <p className="text-sm font-medium text-foreground">
                Importe sua base no modulo de clientes
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                O sistema normaliza telefone, E.164 e JID automaticamente.
              </p>
            </div>

            <div className="mt-6 flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => navigate("/clientes")}>
                Abrir clientes
              </Button>
              <Button className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90" onClick={() => setStep(3)}>
                Continuar
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <h2 className="text-center font-syne text-2xl font-bold text-foreground">Organizar a operacao</h2>
            <p className="mt-2 text-center text-sm text-muted-foreground">
              Antes de escalar o atendimento, revise equipe, acessos e integracoes.
            </p>

            <div className="mt-8 grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-border p-5">
                <Users className="mb-3 h-6 w-6 text-accent" />
                <p className="font-medium text-foreground">Equipe e acessos</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Convide colaboradores e defina permissoes no tenant.
                </p>
              </div>
              <div className="rounded-2xl border border-border p-5">
                <Settings2 className="mb-3 h-6 w-6 text-accent" />
                <p className="font-medium text-foreground">Checklist tecnico</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Confirme status da instancia, webhook e sessao antes de operar.
                </p>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => navigate("/configuracoes")}>
                Revisar configuracoes
              </Button>
              <Button className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90" onClick={() => setStep(4)}>
                Continuar
              </Button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-success/20">
              <PartyPopper className="h-10 w-10 text-success" />
            </div>
            <h2 className="font-syne text-2xl font-bold text-foreground">Estrutura inicial pronta</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Sua conta ja tem a base para comecar, mas a operacao real depende de validar envios e respostas no WhatsApp.
            </p>
            <div className="mt-6 space-y-2 rounded-xl bg-secondary/70 p-4 text-left">
              <div className="flex items-center gap-2 text-sm text-foreground">
                <Check className="h-4 w-4 text-success" />
                Instancia principal revisada
              </div>
              <div className="flex items-center gap-2 text-sm text-foreground">
                <Check className="h-4 w-4 text-success" />
                Base de clientes pronta para importacao e segmentacao
              </div>
              <div className="flex items-center gap-2 text-sm text-foreground">
                <Check className="h-4 w-4 text-success" />
                Configuracoes de equipe e integracao centralizadas
              </div>
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <Button variant="outline" onClick={() => finalizeOnboardingAndGo("/inbox")}>
                Abrir o Inbox
              </Button>
              <Button className="bg-accent text-accent-foreground hover:bg-accent/90" onClick={() => finalizeOnboardingAndGo("/crm")}>
                Abrir o CRM
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
