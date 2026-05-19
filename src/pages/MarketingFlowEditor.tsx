import { useEffect, useId, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ChevronRight, FileDown, Minus, Pencil, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MarketingFlowActionsPanel } from "@/components/marketing/MarketingFlowActionsPanel";
import {
  ACTION_ICONS,
  DRAG_MIME,
  type DragPayload,
} from "@/components/marketing/flow-actions";
import { cn } from "@/lib/utils";

type FlowTab = "editor" | "configuracoes" | "saida";

type SubtitleVariant = "plain" | "primary" | "chip" | "multiline";

type FlowStep = {
  id: string;
  actionId: string;
  label: string;
  iconKey: string;
  iconClass: string;
  subtitle?: string;
  subtitleVariant?: SubtitleVariant;
};

const INITIAL_STEPS: FlowStep[] = [
  {
    id: "step-1",
    actionId: "marcar-oportunidade",
    label: "Marcar Oportunidade",
    iconKey: "star",
    iconClass: "bg-pink-500",
  },
  {
    id: "step-2",
    actionId: "adicionar-tags",
    label: "Adicionar Tags",
    iconKey: "tag",
    iconClass: "bg-pink-500",
    subtitle: "GOOGLE",
    subtitleVariant: "chip",
  },
  {
    id: "step-3",
    actionId: "email",
    label: "Enviar Email",
    iconKey: "mail",
    iconClass: "bg-violet-600",
    subtitle: "Boas-vindas",
    subtitleVariant: "primary",
  },
  {
    id: "step-4",
    actionId: "criar-negociacao",
    label: "Criar Negociação no CRM",
    iconKey: "star",
    iconClass: "bg-sky-500",
    subtitle: "Funil ISENÇÃO DE IR, etapa LEAD, para hitalo@recupereibr.com.br",
    subtitleVariant: "multiline",
  },
];

function TabButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative px-1 py-3 text-base font-medium transition-colors",
        active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
      )}
    >
      {label}
      {active ? (
        <span
          className="absolute -top-px left-0 right-0 h-[3px] rounded-full bg-primary"
          aria-hidden
        />
      ) : null}
    </button>
  );
}

function PlusConnector() {
  return (
    <div
      aria-hidden
      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-sm"
    >
      <Plus className="h-3.5 w-3.5" aria-hidden />
    </div>
  );
}

function DropZone({
  index,
  isDragging,
  onDrop,
}: {
  index: number;
  isDragging: boolean;
  onDrop: (index: number, payload: DragPayload) => void;
}) {
  const [hover, setHover] = useState(false);

  return (
    <div
      onDragOver={(event) => {
        if (event.dataTransfer.types.includes(DRAG_MIME)) {
          event.preventDefault();
          event.dataTransfer.dropEffect = "copy";
        }
      }}
      onDragEnter={(event) => {
        if (event.dataTransfer.types.includes(DRAG_MIME)) {
          setHover(true);
        }
      }}
      onDragLeave={() => setHover(false)}
      onDrop={(event) => {
        event.preventDefault();
        setHover(false);
        const raw =
          event.dataTransfer.getData(DRAG_MIME) ||
          event.dataTransfer.getData("text/plain");
        if (!raw) return;
        try {
          const payload = JSON.parse(raw) as DragPayload;
          onDrop(index, payload);
        } catch {
          // ignore invalid payload
        }
      }}
      className={cn(
        "flex h-[72px] shrink-0 items-center justify-center transition-all",
        isDragging ? "w-32 px-2" : "w-6",
      )}
    >
      <div
        className={cn(
          "flex h-full w-full items-center justify-center rounded-xl border-2 border-dashed transition-colors",
          isDragging
            ? hover
              ? "border-primary bg-primary/10"
              : "border-primary/40 bg-primary/5"
            : "border-transparent",
        )}
      >
        {!isDragging ? <PlusConnector /> : null}
      </div>
    </div>
  );
}

function StepSubtitle({
  subtitle,
  variant,
}: {
  subtitle: string;
  variant: SubtitleVariant;
}) {
  if (variant === "chip") {
    return (
      <span className="inline-flex w-fit items-center rounded-md border border-border bg-muted/40 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        {subtitle}
      </span>
    );
  }
  if (variant === "primary") {
    return <span className="text-sm font-semibold text-primary">{subtitle}</span>;
  }
  if (variant === "multiline") {
    return <span className="text-sm leading-snug text-foreground">{subtitle}</span>;
  }
  return <span className="text-sm text-muted-foreground">{subtitle}</span>;
}

function StepCard({ step }: { step: FlowStep }) {
  const Icon = ACTION_ICONS[step.iconKey];
  const isMultiline =
    step.subtitleVariant === "multiline" || step.subtitleVariant === "chip";

  return (
    <div className="flex shrink-0 items-start gap-3 rounded-xl border border-border bg-card px-4 py-3 shadow-sm">
      <span
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white",
          step.iconClass,
          isMultiline ? "mt-0.5" : "",
        )}
      >
        {Icon ? (
          <Icon
            className={cn(
              "h-4 w-4",
              step.iconKey === "star" ? "fill-current" : "",
            )}
            aria-hidden
          />
        ) : null}
      </span>
      <div
        className={cn(
          "flex flex-col gap-1",
          step.subtitleVariant === "multiline" ? "max-w-xs" : "",
        )}
      >
        <span className="text-sm font-semibold text-foreground">{step.label}</span>
        {step.subtitle && step.subtitleVariant ? (
          <StepSubtitle subtitle={step.subtitle} variant={step.subtitleVariant} />
        ) : null}
      </div>
    </div>
  );
}

function CriteriaCard() {
  return (
    <div className="flex w-[320px] shrink-0 flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-foreground">
          Devem percorrer o fluxo
        </span>
        <button
          type="button"
          className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
        >
          <Pencil className="h-3.5 w-3.5" aria-hidden />
          Editar
        </button>
      </div>

      <div className="flex flex-col gap-3 rounded-lg bg-muted/40 p-3">
        <span className="w-fit rounded-md bg-foreground px-2.5 py-1 text-[11px] font-semibold text-background">
          Leads que vão atender aos critérios
        </span>

        <div className="flex flex-col gap-2 text-sm leading-snug text-foreground">
          <div>
            <p>converteram no evento</p>
            <p className="font-semibold">ir-facebook-site-ragali</p>
            <p>e também Campo do Lead</p>
          </div>
          <div>
            <p className="font-semibold">
              Você paga imposto de renda? é igual a Sim
            </p>
            <p>e também Campo do Lead</p>
          </div>
          <p className="font-semibold">
            Selecione o benefício: não é igual a Na Ativa
          </p>
        </div>
      </div>
    </div>
  );
}

export default function MarketingFlowEditor() {
  const { flowId } = useParams<{ flowId: string }>();
  const [tab, setTab] = useState<FlowTab>("editor");
  const [zoom, setZoom] = useState(1);
  const [actionsOpen, setActionsOpen] = useState(false);
  const [steps, setSteps] = useState<FlowStep[]>(INITIAL_STEPS);
  const [isDragging, setIsDragging] = useState(false);
  const stepCounter = useRef(steps.length);
  const stepIdPrefix = useId();

  useEffect(() => {
    const handleDragStart = (event: DragEvent) => {
      if (event.dataTransfer?.types.includes(DRAG_MIME)) {
        setIsDragging(true);
      }
    };
    const handleDragEnd = () => setIsDragging(false);

    document.addEventListener("dragstart", handleDragStart);
    document.addEventListener("dragend", handleDragEnd);
    document.addEventListener("drop", handleDragEnd);
    return () => {
      document.removeEventListener("dragstart", handleDragStart);
      document.removeEventListener("dragend", handleDragEnd);
      document.removeEventListener("drop", handleDragEnd);
    };
  }, []);

  const handleDropAt = (index: number, payload: DragPayload) => {
    setSteps((prev) => {
      stepCounter.current += 1;
      const newStep: FlowStep = {
        id: `${stepIdPrefix}-${stepCounter.current}`,
        actionId: payload.actionId,
        label: payload.label,
        iconKey: payload.iconKey,
        iconClass: payload.iconClass,
        subtitle: payload.defaultSubtitle,
        subtitleVariant: payload.defaultSubtitle ? "plain" : undefined,
      };
      const next = [...prev];
      next.splice(index, 0, newStep);
      return next;
    });
    setIsDragging(false);
  };

  return (
    <div className="flex h-full min-h-0 flex-col bg-[#f3f5f8]">
      <header className="flex items-center justify-between border-b border-border bg-card px-6">
        <div className="flex items-center gap-6">
          <Link
            to="/marketing?aba=automacoes"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            ← Voltar
          </Link>
          <nav className="flex items-center gap-6" aria-label="Seções do fluxo">
            <TabButton
              label="Editor"
              active={tab === "editor"}
              onClick={() => setTab("editor")}
            />
            <TabButton
              label="Configurações"
              active={tab === "configuracoes"}
              onClick={() => setTab("configuracoes")}
            />
            <TabButton
              label="Saída"
              active={tab === "saida"}
              onClick={() => setTab("saida")}
            />
          </nav>
        </div>

        <div className="flex items-center gap-2 py-3">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="text-primary hover:bg-primary/10"
            aria-label="Exportar fluxo"
          >
            <FileDown className="h-5 w-5" aria-hidden />
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="text-primary hover:bg-primary/10"
          >
            Salvar
          </Button>
          <Button type="button">Salvar e Ativar</Button>
        </div>
      </header>

      {tab === "editor" ? (
        <div className="relative flex min-h-0 flex-1 flex-col">
          <div className="pointer-events-none absolute right-6 top-6 z-10">
            <button
              type="button"
              onClick={() => setActionsOpen(true)}
              className="pointer-events-auto inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground shadow-sm transition-colors hover:border-primary hover:text-primary"
            >
              Ações
              <ChevronRight className="h-4 w-4" aria-hidden />
            </button>
          </div>

          <MarketingFlowActionsPanel open={actionsOpen} onOpenChange={setActionsOpen} />

          <div className="min-h-0 flex-1 overflow-auto">
            <div
              className="flex min-w-max items-center gap-3 px-10 py-24"
              style={{ transform: `scale(${zoom})`, transformOrigin: "left center" }}
            >
              <CriteriaCard />
              <DropZone index={0} isDragging={isDragging} onDrop={handleDropAt} />
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-center gap-3">
                  <StepCard step={step} />
                  <DropZone
                    index={index + 1}
                    isDragging={isDragging}
                    onDrop={handleDropAt}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="pointer-events-none absolute bottom-6 left-1/2 -translate-x-1/2">
            <div className="pointer-events-auto inline-flex items-center gap-1 rounded-full bg-primary/10 p-1 shadow-sm">
              <button
                type="button"
                aria-label="Diminuir zoom"
                onClick={() => setZoom((z) => Math.max(0.4, Number((z - 0.1).toFixed(2))))}
                className="flex h-8 w-8 items-center justify-center rounded-full text-primary transition-colors hover:bg-primary/15"
              >
                <Minus className="h-4 w-4" aria-hidden />
              </button>
              <button
                type="button"
                aria-label="Aumentar zoom"
                onClick={() => setZoom((z) => Math.min(2, Number((z + 0.1).toFixed(2))))}
                className="flex h-8 w-8 items-center justify-center rounded-full text-primary transition-colors hover:bg-primary/15"
              >
                <Plus className="h-4 w-4" aria-hidden />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 items-center justify-center p-10 text-sm text-muted-foreground">
          {tab === "configuracoes"
            ? `Configurações do fluxo ${flowId ?? ""}`
            : `Saída do fluxo ${flowId ?? ""}`}
        </div>
      )}
    </div>
  );
}
