import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  AlertCircle,
  AlertTriangle,
  ChevronRight,
  FileDown,
  GripVertical,
  Loader2,
  Minus,
  Pencil,
  Plus,
  Sparkles,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { MarketingFlowActionsPanel } from "@/components/marketing/MarketingFlowActionsPanel";
import {
  ACTION_ICONS,
  DRAG_MIME,
  type DragPayload,
} from "@/components/marketing/flow-actions";
import {
  useMarketingFlow,
  usePublishMarketingFlow,
  useUpdateMarketingFlow,
  type MarketingFlowRecord,
} from "@/lib/api/marketing-flows";
import {
  validateFlow,
  type ValidationIssue,
  type ValidationResult,
} from "@/lib/marketing/flow-validation";
import {
  getConfigKind,
  parseConfig,
  summarizeConfig,
} from "@/lib/marketing/flow-action-configs";
import { pickConfigComponent } from "@/components/marketing/action-configs";
import { FlowExecutionsPanel } from "@/components/marketing/FlowExecutionsPanel";
import { SimulatorDialog } from "@/components/marketing/SimulatorDialog";
import { cn } from "@/lib/utils";

type FlowTab = "editor" | "configuracoes" | "saida" | "historico";

const SUBTITLE_VARIANTS = ["plain", "primary", "chip", "multiline"] as const;
type SubtitleVariant = (typeof SUBTITLE_VARIANTS)[number];

type FlowStep = {
  id: string;
  actionId: string;
  label: string;
  iconKey: string;
  iconClass: string;
  subtitle?: string;
  subtitleVariant?: SubtitleVariant;
  config?: Record<string, unknown>;
};

function isSubtitleVariant(value: unknown): value is SubtitleVariant {
  return (
    typeof value === "string" &&
    (SUBTITLE_VARIANTS as readonly string[]).includes(value)
  );
}

/** Reidrata o array de steps salvo no jsonb `definition.steps`. */
function parseStepsFromDefinition(definition: Record<string, unknown> | undefined): FlowStep[] {
  const raw = definition?.steps;
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item, index): FlowStep | null => {
      if (!item || typeof item !== "object") return null;
      const rec = item as Record<string, unknown>;
      const actionId = typeof rec.actionId === "string" ? rec.actionId : null;
      const label = typeof rec.label === "string" ? rec.label : null;
      const iconKey = typeof rec.iconKey === "string" ? rec.iconKey : null;
      const iconClass = typeof rec.iconClass === "string" ? rec.iconClass : null;
      if (!actionId || !label || !iconKey || !iconClass) return null;
      const subtitle = typeof rec.subtitle === "string" ? rec.subtitle : undefined;
      const subtitleVariant = isSubtitleVariant(rec.subtitleVariant)
        ? rec.subtitleVariant
        : undefined;
      const config =
        rec.config && typeof rec.config === "object"
          ? (rec.config as Record<string, unknown>)
          : undefined;
      const id =
        typeof rec.id === "string" && rec.id.length > 0 ? rec.id : `step-${index + 1}`;
      return { id, actionId, label, iconKey, iconClass, subtitle, subtitleVariant, config };
    })
    .filter((step): step is FlowStep => step !== null);
}

const STEP_MOVE_MIME = "application/x-marketing-step-move";

type StepMovePayload = { stepId: string };

type FlowCriteria = { conditions: string[] };

function parseCriteria(criteria: Record<string, unknown> | undefined): FlowCriteria {
  const raw = criteria?.conditions;
  if (!Array.isArray(raw)) return { conditions: [] };
  const conditions = raw
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter((s) => s.length > 0);
  return { conditions };
}

type FlowSettings = {
  allowReentry: boolean;
  autoAbandonDays: number | null;
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function parseFlowSettings(definition: Record<string, unknown> | undefined): FlowSettings {
  const rec = asRecord(definition?.settings);
  const allowReentry = rec.allowReentry === true;
  let autoAbandonDays: number | null = null;
  if (
    typeof rec.autoAbandonDays === "number" &&
    Number.isFinite(rec.autoAbandonDays) &&
    rec.autoAbandonDays > 0
  ) {
    autoAbandonDays = Math.floor(rec.autoAbandonDays);
  }
  return { allowReentry, autoAbandonDays };
}

function parseExitConditions(definition: Record<string, unknown> | undefined): string[] {
  const raw = definition?.exitConditions;
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter((s) => s.length > 0);
}

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
  onMove,
}: {
  index: number;
  isDragging: boolean;
  onDrop: (index: number, payload: DragPayload) => void;
  onMove: (index: number, payload: StepMovePayload) => void;
}) {
  const [hover, setHover] = useState(false);

  const acceptsDrag = (types: ReadonlyArray<string> | DOMStringList) => {
    const arr = Array.from(types as ArrayLike<string>);
    return arr.includes(DRAG_MIME) || arr.includes(STEP_MOVE_MIME);
  };

  return (
    <div
      onDragOver={(event) => {
        if (acceptsDrag(event.dataTransfer.types)) {
          event.preventDefault();
          event.dataTransfer.dropEffect = Array.from(event.dataTransfer.types).includes(
            STEP_MOVE_MIME,
          )
            ? "move"
            : "copy";
        }
      }}
      onDragEnter={(event) => {
        if (acceptsDrag(event.dataTransfer.types)) {
          setHover(true);
        }
      }}
      onDragLeave={() => setHover(false)}
      onDrop={(event) => {
        event.preventDefault();
        setHover(false);
        const moveRaw = event.dataTransfer.getData(STEP_MOVE_MIME);
        if (moveRaw) {
          try {
            const payload = JSON.parse(moveRaw) as StepMovePayload;
            onMove(index, payload);
          } catch {
            // ignore invalid payload
          }
          return;
        }
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

function StepCard({
  step,
  onRemove,
  onEdit,
}: {
  step: FlowStep;
  onRemove: (id: string) => void;
  onEdit: (id: string) => void;
}) {
  const Icon = ACTION_ICONS[step.iconKey];
  const isMultiline =
    step.subtitleVariant === "multiline" || step.subtitleVariant === "chip";

  return (
    <div
      draggable
      onDragStart={(event) => {
        const payload: StepMovePayload = { stepId: step.id };
        event.dataTransfer.setData(STEP_MOVE_MIME, JSON.stringify(payload));
        event.dataTransfer.effectAllowed = "move";
      }}
      onClick={() => onEdit(step.id)}
      className="group relative flex shrink-0 cursor-grab items-start gap-3 rounded-xl border border-border bg-card px-4 py-3 shadow-sm transition-colors hover:border-primary/50 active:cursor-grabbing"
    >
      <GripVertical
        className="absolute left-1 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
        aria-hidden
      />
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onRemove(step.id);
        }}
        aria-label={`Remover ${step.label}`}
        className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-card text-muted-foreground opacity-0 shadow-sm transition-opacity hover:text-destructive group-hover:opacity-100 focus:opacity-100"
      >
        <X className="h-3.5 w-3.5" aria-hidden />
      </button>
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

function CriteriaCard({
  conditions,
  onEdit,
}: {
  conditions: string[];
  onEdit: () => void;
}) {
  return (
    <div className="flex w-[320px] shrink-0 flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-foreground">
          Devem percorrer o fluxo
        </span>
        <button
          type="button"
          onClick={onEdit}
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

        {conditions.length === 0 ? (
          <p className="text-sm leading-snug text-muted-foreground">
            Nenhum critério configurado. Clique em <span className="font-semibold">Editar</span> para definir
            quem deve percorrer este fluxo.
          </p>
        ) : (
          <div className="flex flex-col gap-2 text-sm leading-snug text-foreground">
            {conditions.map((condition, index) => (
              <div key={`${index}-${condition}`} className="flex flex-col gap-0.5">
                {index > 0 ? (
                  <p className="text-muted-foreground">e também</p>
                ) : null}
                <p className="font-semibold">{condition}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function CriteriaEditDialog({
  open,
  onOpenChange,
  initialConditions,
  isPending,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialConditions: string[];
  isPending: boolean;
  onSave: (conditions: string[]) => void;
}) {
  const [draft, setDraft] = useState("");

  useEffect(() => {
    if (open) {
      setDraft(initialConditions.join("\n"));
    }
  }, [open, initialConditions]);

  const handleSave = () => {
    const conditions = draft
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
    onSave(conditions);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Critérios de entrada</DialogTitle>
          <DialogDescription>
            Liste cada critério em uma linha. Os leads precisam atender a todos para percorrer este fluxo.
          </DialogDescription>
        </DialogHeader>
        <Textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder={"Você paga imposto de renda? é igual a Sim\nSelecione o benefício: não é igual a Na Ativa"}
          rows={8}
          className="font-medium"
        />
        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancelar
          </Button>
          <Button type="button" onClick={handleSave} disabled={isPending}>
            {isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
            ) : null}
            Salvar critérios
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const SUBTITLE_VARIANT_LABELS: Record<SubtitleVariant, string> = {
  plain: "Sem destaque",
  primary: "Destaque",
  chip: "Etiqueta",
  multiline: "Multilinha",
};

function StepEditDialog({
  step,
  steps,
  flowId,
  onOpenChange,
  onSave,
}: {
  step: FlowStep | null;
  steps: FlowStep[];
  flowId: string;
  onOpenChange: (open: boolean) => void;
  onSave: (patch: Partial<FlowStep>) => void;
}) {
  const configKind = step ? getConfigKind(step.actionId) : null;
  const ConfigComponent = step ? pickConfigComponent(step.actionId) : null;
  const configContext = useMemo(
    () => ({
      steps: steps
        .filter((s) => !step || s.id !== step.id)
        .map((s) => ({ id: s.id, label: s.label })),
      currentFlowId: flowId,
    }),
    [steps, step, flowId],
  );

  // Estado pro caminho "subtitle livre" (actions sem config schema).
  const [subtitleDraft, setSubtitleDraft] = useState("");
  const [variantDraft, setVariantDraft] = useState<SubtitleVariant>("plain");

  // Estado pro caminho "config estruturada" (actions cobertas pelo registry).
  const [configDraft, setConfigDraft] = useState<Record<string, unknown>>({});

  useEffect(() => {
    if (!step) return;
    setSubtitleDraft(step.subtitle ?? "");
    setVariantDraft(step.subtitleVariant ?? "plain");
    if (configKind) {
      setConfigDraft(parseConfig(configKind, step.config) as Record<string, unknown>);
    }
    // intencional: rebaseia drafts ao trocar de step
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  const handleSaveConfig = () => {
    if (!step || !configKind) return;
    const subtitle = summarizeConfig(configKind, configDraft);
    onSave({
      config: configDraft,
      subtitle: subtitle || undefined,
      subtitleVariant: subtitle ? "plain" : undefined,
    });
  };

  const handleSaveSubtitle = () => {
    const trimmed = subtitleDraft.trim();
    if (!trimmed) {
      onSave({ subtitle: undefined, subtitleVariant: undefined });
    } else {
      onSave({ subtitle: trimmed, subtitleVariant: variantDraft });
    }
  };

  return (
    <Dialog open={!!step} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{step ? step.label : "Editar passo"}</DialogTitle>
          <DialogDescription>
            {ConfigComponent
              ? "Configure os campos abaixo. Os valores são salvos junto com o fluxo no botão “Salvar” do cabeçalho."
              : "Adicione uma descrição para este passo. Deixe em branco para remover."}
          </DialogDescription>
        </DialogHeader>

        {ConfigComponent && configKind ? (
          <ConfigComponent
            value={parseConfig(configKind, configDraft)}
            onChange={(next) => setConfigDraft(next as Record<string, unknown>)}
            context={configContext}
          />
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="step-subtitle">Descrição</Label>
              {variantDraft === "multiline" ? (
                <Textarea
                  id="step-subtitle"
                  value={subtitleDraft}
                  onChange={(event) => setSubtitleDraft(event.target.value)}
                  rows={4}
                />
              ) : (
                <Input
                  id="step-subtitle"
                  value={subtitleDraft}
                  onChange={(event) => setSubtitleDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      handleSaveSubtitle();
                    }
                  }}
                />
              )}
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="step-variant">Estilo</Label>
              <Select
                value={variantDraft}
                onValueChange={(value) => setVariantDraft(value as SubtitleVariant)}
              >
                <SelectTrigger id="step-variant">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SUBTITLE_VARIANTS.map((variant) => (
                    <SelectItem key={variant} value={variant}>
                      {SUBTITLE_VARIANT_LABELS[variant]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={ConfigComponent ? handleSaveConfig : handleSaveSubtitle}
          >
            Aplicar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const TRIGGER_OPTIONS: { value: string; label: string; description: string }[] = [
  {
    value: "manual",
    label: "Manual",
    description: "Leads entram apenas se adicionados manualmente ou por outro fluxo.",
  },
  {
    value: "form_submitted",
    label: "Formulário enviado",
    description: "Dispara quando um lead envia qualquer formulário de marketing.",
  },
  {
    value: "tag_added",
    label: "Etiqueta adicionada",
    description: "Dispara quando uma etiqueta nova é aplicada a um lead.",
  },
  {
    value: "negotiation_created",
    label: "Negociação criada",
    description: "Dispara quando uma nova negociação entra no CRM.",
  },
  {
    value: "negotiation_stage_changed",
    label: "Etapa do CRM alterada",
    description: "Dispara quando uma negociação muda de etapa no funil.",
  },
];

function FlowSettingsPanel({
  flow,
  onPatch,
  onTriggerChange,
  isPending,
}: {
  flow: MarketingFlowRecord;
  onPatch: (overrides: Record<string, unknown>) => void;
  onTriggerChange: (trigger: Record<string, unknown>) => void;
  isPending: boolean;
}) {
  const settings = parseFlowSettings(flow.definition);
  const currentTriggerType =
    typeof flow.trigger.type === "string" ? flow.trigger.type : "";
  const [abandonDraft, setAbandonDraft] = useState(
    settings.autoAbandonDays != null ? String(settings.autoAbandonDays) : "",
  );

  useEffect(() => {
    setAbandonDraft(
      settings.autoAbandonDays != null ? String(settings.autoAbandonDays) : "",
    );
  }, [settings.autoAbandonDays]);

  const commitAbandonDays = () => {
    const trimmed = abandonDraft.trim();
    const parsed = trimmed === "" ? null : Number(trimmed);
    const next =
      parsed != null && Number.isFinite(parsed) && parsed > 0
        ? Math.floor(parsed)
        : null;
    if (next === settings.autoAbandonDays) return;
    onPatch({ settings: { ...settings, autoAbandonDays: next } });
  };

  const handleToggleReentry = (checked: boolean) => {
    if (checked === settings.allowReentry) return;
    onPatch({ settings: { ...settings, allowReentry: checked } });
  };

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 p-8">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Configurações</h2>
        <p className="text-sm text-muted-foreground">
          Defina como os leads se comportam neste fluxo.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <Label htmlFor="flow-trigger" className="text-sm font-semibold">
              Gatilho de entrada
            </Label>
            <p className="text-xs text-muted-foreground">
              Define o evento que coloca leads dentro deste fluxo.
            </p>
          </div>
          <Select
            value={currentTriggerType || undefined}
            onValueChange={(next) => {
              if (next === currentTriggerType) return;
              onTriggerChange({ ...flow.trigger, type: next });
            }}
            disabled={isPending}
          >
            <SelectTrigger id="flow-trigger">
              <SelectValue placeholder="Selecione um gatilho" />
            </SelectTrigger>
            <SelectContent>
              {TRIGGER_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {currentTriggerType ? (
            <p className="text-xs text-muted-foreground">
              {TRIGGER_OPTIONS.find((o) => o.value === currentTriggerType)?.description}
            </p>
          ) : null}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <Label htmlFor="allow-reentry" className="text-sm font-semibold">
              Permitir reentrada
            </Label>
            <p className="text-xs text-muted-foreground">
              Se ativado, um mesmo lead pode percorrer o fluxo mais de uma vez.
            </p>
          </div>
          <Switch
            id="allow-reentry"
            checked={settings.allowReentry}
            onCheckedChange={handleToggleReentry}
            disabled={isPending}
          />
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <Label htmlFor="abandon-days" className="text-sm font-semibold">
              Abandono automático após inatividade
            </Label>
            <p className="text-xs text-muted-foreground">
              Remove o lead do fluxo se não houver interação por N dias. Deixe vazio para desabilitar.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Input
              id="abandon-days"
              type="number"
              min={1}
              value={abandonDraft}
              onChange={(event) => setAbandonDraft(event.target.value)}
              onBlur={commitAbandonDays}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  (event.target as HTMLInputElement).blur();
                }
              }}
              disabled={isPending}
              className="max-w-24"
            />
            <span className="text-sm text-muted-foreground">dias</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function FlowExitPanel({
  flow,
  onPatch,
  isPending,
}: {
  flow: MarketingFlowRecord;
  onPatch: (overrides: Record<string, unknown>) => void;
  isPending: boolean;
}) {
  const persisted = parseExitConditions(flow.definition);
  const [draft, setDraft] = useState(persisted.join("\n"));

  useEffect(() => {
    setDraft(persisted.join("\n"));
    // só re-sincroniza quando o conjunto persistido muda externamente
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [persisted.join("\n")]);

  const commit = () => {
    const next = draft
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
    if (next.join("\n") === persisted.join("\n")) return;
    onPatch({ exitConditions: next });
  };

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 p-8">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Saída do fluxo</h2>
        <p className="text-sm text-muted-foreground">
          Condições que tiram o lead deste fluxo antes do fim.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <Label htmlFor="exit-conditions" className="text-sm font-semibold">
              Condições de saída
            </Label>
            <p className="text-xs text-muted-foreground">
              Uma condição por linha. O lead sai do fluxo se atender qualquer uma delas.
            </p>
          </div>
          <Textarea
            id="exit-conditions"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onBlur={commit}
            rows={6}
            disabled={isPending}
            placeholder={"Lead concluiu uma compra\nLead optou por sair (opt-out)"}
          />
        </div>
      </div>
    </div>
  );
}

function ValidationIssueList({ issues }: { issues: ValidationIssue[] }) {
  if (issues.length === 0) return null;
  return (
    <ul className="flex flex-col gap-1.5">
      {issues.map((issue, index) => {
        const Icon = issue.severity === "error" ? AlertCircle : AlertTriangle;
        const tone =
          issue.severity === "error"
            ? "text-destructive"
            : "text-amber-600 dark:text-amber-400";
        return (
          <li key={`${issue.code}-${index}`} className="flex items-start gap-2 text-sm">
            <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", tone)} aria-hidden />
            <span className="leading-snug text-foreground">{issue.message}</span>
          </li>
        );
      })}
    </ul>
  );
}

function FlowValidationDialog({
  open,
  result,
  isPublishing,
  onOpenChange,
  onConfirm,
}: {
  open: boolean;
  result: ValidationResult | null;
  isPublishing: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}) {
  const hasErrors = (result?.errors.length ?? 0) > 0;
  const title = hasErrors ? "Não foi possível ativar o fluxo" : "Atenção antes de ativar";
  const description = hasErrors
    ? "Corrija os erros abaixo para poder ativar este fluxo."
    : "Os avisos abaixo não bloqueiam a ativação. Confirme para publicar mesmo assim.";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          {result && result.errors.length > 0 ? (
            <div className="flex flex-col gap-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-destructive">
                Erros ({result.errors.length})
              </p>
              <ValidationIssueList issues={result.errors} />
            </div>
          ) : null}
          {result && result.warnings.length > 0 ? (
            <div className="flex flex-col gap-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-amber-600 dark:text-amber-400">
                Avisos ({result.warnings.length})
              </p>
              <ValidationIssueList issues={result.warnings} />
            </div>
          ) : null}
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={isPublishing}
          >
            {hasErrors ? "Fechar" : "Cancelar"}
          </Button>
          {!hasErrors ? (
            <Button type="button" onClick={onConfirm} disabled={isPublishing}>
              {isPublishing ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
              ) : null}
              Publicar mesmo assim
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function MarketingFlowEditor() {
  const { flowId } = useParams<{ flowId: string }>();
  const { toast } = useToast();
  const { data: flow, isLoading, error } = useMarketingFlow(flowId);
  const updateFlow = useUpdateMarketingFlow();
  const publishFlow = usePublishMarketingFlow();
  const [tab, setTab] = useState<FlowTab>("editor");
  const [zoom, setZoom] = useState(1);
  const [actionsOpen, setActionsOpen] = useState(false);
  const [steps, setSteps] = useState<FlowStep[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const [criteriaDialogOpen, setCriteriaDialogOpen] = useState(false);
  const [editingStepId, setEditingStepId] = useState<string | null>(null);
  const [validationDialog, setValidationDialog] = useState<{
    open: boolean;
    result: ValidationResult | null;
  }>({ open: false, result: null });
  const [simulatorOpen, setSimulatorOpen] = useState(false);
  const stepCounter = useRef(0);
  const stepIdPrefix = useId();
  const hydratedFor = useRef<string | null>(null);

  // Hidrata os steps do banco apenas uma vez por fluxo carregado — depois disso
  // o estado local manda. Evita reverter edições enquanto a query refaz.
  useEffect(() => {
    if (!flow) return;
    if (hydratedFor.current === flow.id) return;
    const loaded = parseStepsFromDefinition(flow.definition);
    setSteps(loaded);
    stepCounter.current = loaded.length;
    hydratedFor.current = flow.id;
  }, [flow]);

  useEffect(() => {
    const handleDragStart = (event: DragEvent) => {
      const types = event.dataTransfer?.types;
      if (
        types &&
        (Array.from(types).includes(DRAG_MIME) || Array.from(types).includes(STEP_MOVE_MIME))
      ) {
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

  const handleRemoveStep = (stepId: string) => {
    setSteps((prev) => prev.filter((step) => step.id !== stepId));
  };

  const handleUpdateStep = (stepId: string, patch: Partial<FlowStep>) => {
    setSteps((prev) =>
      prev.map((step) => (step.id === stepId ? { ...step, ...patch } : step)),
    );
    setEditingStepId(null);
  };

  const editingStep = editingStepId
    ? steps.find((step) => step.id === editingStepId) ?? null
    : null;

  const handleMoveStep = (toIndex: number, payload: StepMovePayload) => {
    setSteps((prev) => {
      const fromIndex = prev.findIndex((s) => s.id === payload.stepId);
      if (fromIndex === -1) return prev;
      // Quando movendo pra frente, o splice-out desloca os índices subsequentes em 1.
      const adjustedTo = fromIndex < toIndex ? toIndex - 1 : toIndex;
      if (fromIndex === adjustedTo) return prev;
      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(adjustedTo, 0, moved);
      return next;
    });
    setIsDragging(false);
  };

  const startEditName = () => {
    if (!flow) return;
    setNameDraft(flow.name);
    setIsEditingName(true);
  };

  const commitName = () => {
    if (!flow) {
      setIsEditingName(false);
      return;
    }
    const next = nameDraft.trim();
    setIsEditingName(false);
    if (!next || next === flow.name) return;
    updateFlow.mutate(
      { id: flow.id, patch: { name: next } },
      {
        onError: (e) =>
          toast({
            title: "Erro ao renomear",
            description: e.message,
            variant: "destructive",
          }),
      },
    );
  };

  const flowCriteria = flow ? parseCriteria(flow.criteria) : { conditions: [] };

  const handleSaveCriteria = (conditions: string[]) => {
    if (!flow) return;
    updateFlow.mutate(
      { id: flow.id, patch: { criteria: { ...flow.criteria, conditions } } },
      {
        onSuccess: () => {
          setCriteriaDialogOpen(false);
          toast({ title: "Critérios atualizados" });
        },
        onError: (e) =>
          toast({
            title: "Erro ao salvar critérios",
            description: e.message,
            variant: "destructive",
          }),
      },
    );
  };

  const patchTrigger = (trigger: Record<string, unknown>) => {
    if (!flow) return;
    updateFlow.mutate(
      { id: flow.id, patch: { trigger } },
      {
        onError: (e) =>
          toast({
            title: "Erro ao salvar gatilho",
            description: e.message,
            variant: "destructive",
          }),
      },
    );
  };

  const patchDefinition = (overrides: Record<string, unknown>) => {
    if (!flow) return;
    updateFlow.mutate(
      { id: flow.id, patch: { definition: { ...flow.definition, ...overrides } } },
      {
        onError: (e) =>
          toast({
            title: "Erro ao salvar",
            description: e.message,
            variant: "destructive",
          }),
      },
    );
  };

  const persist = () => {
    if (!flow) return;
    const nextDefinition = { ...flow.definition, steps };
    updateFlow.mutate(
      { id: flow.id, patch: { definition: nextDefinition } },
      {
        onSuccess: () => toast({ title: "Fluxo salvo" }),
        onError: (e) =>
          toast({
            title: "Erro ao salvar",
            description: e.message,
            variant: "destructive",
          }),
      },
    );
  };

  const buildSnapshot = (currentFlow: MarketingFlowRecord) => ({
    name: currentFlow.name,
    definition: { ...currentFlow.definition, steps },
    criteria: currentFlow.criteria,
    trigger: currentFlow.trigger,
  });

  const validation = useMemo<ValidationResult | null>(() => {
    if (!flow) return null;
    return validateFlow(buildSnapshot(flow));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flow, steps]);

  const doPublish = (result: ValidationResult) => {
    if (!flow) return;
    const snapshot = buildSnapshot(flow);
    publishFlow.mutate(
      {
        id: flow.id,
        definition: snapshot.definition,
        criteria: snapshot.criteria,
        trigger: snapshot.trigger,
        validationSnapshot: {
          warnings: result.warnings,
          publishedAt: new Date().toISOString(),
        },
      },
      {
        onSuccess: () => {
          setValidationDialog({ open: false, result: null });
          toast({ title: "Fluxo ativado", description: "Versão publicada com sucesso." });
        },
        onError: (e) =>
          toast({
            title: "Erro ao publicar",
            description: e.message,
            variant: "destructive",
          }),
      },
    );
  };

  const handlePublishClick = () => {
    if (!flow || !validation) return;
    if (!validation.ok || validation.warnings.length > 0) {
      setValidationDialog({ open: true, result: validation });
      return;
    }
    doPublish(validation);
  };

  const handleExport = () => {
    if (!flow) return;
    const snapshot = buildSnapshot(flow);
    const data = {
      version: 1,
      exportedAt: new Date().toISOString(),
      flows: [
        {
          name: flow.name,
          status: flow.status,
          definition: snapshot.definition,
          criteria: snapshot.criteria,
          trigger: snapshot.trigger,
        },
      ],
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    const safeName = flow.name.replace(/[^a-z0-9-]+/gi, "-").toLowerCase() || "fluxo";
    anchor.download = `${safeName}-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
    toast({ title: "Fluxo exportado" });
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
          {flow ? (
            isEditingName ? (
              <Input
                autoFocus
                value={nameDraft}
                onChange={(event) => setNameDraft(event.target.value)}
                onBlur={commitName}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    commitName();
                  } else if (event.key === "Escape") {
                    event.preventDefault();
                    setIsEditingName(false);
                  }
                }}
                className="h-8 w-64 text-sm font-semibold"
              />
            ) : (
              <button
                type="button"
                onClick={startEditName}
                className="group inline-flex items-center gap-1.5 rounded-md px-1.5 py-1 text-sm font-semibold text-foreground transition-colors hover:bg-muted/60"
                title="Renomear fluxo"
              >
                <span className="max-w-[260px] truncate">{flow.name}</span>
                <Pencil
                  className="h-3.5 w-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
                  aria-hidden
                />
              </button>
            )
          ) : null}
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
            <TabButton
              label="Execuções"
              active={tab === "historico"}
              onClick={() => setTab("historico")}
            />
          </nav>
        </div>

        <div className="flex items-center gap-2 py-3">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="text-primary hover:bg-primary/10"
            aria-label="Simular fluxo"
            onClick={() => setSimulatorOpen(true)}
            disabled={!flow}
          >
            <Sparkles className="h-5 w-5" aria-hidden />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="text-primary hover:bg-primary/10"
            aria-label="Exportar fluxo"
            onClick={handleExport}
            disabled={!flow}
          >
            <FileDown className="h-5 w-5" aria-hidden />
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="text-primary hover:bg-primary/10"
            onClick={persist}
            disabled={!flow || updateFlow.isPending}
          >
            {updateFlow.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
            ) : null}
            Salvar
          </Button>
          <Button
            type="button"
            onClick={handlePublishClick}
            disabled={!flow || publishFlow.isPending}
            className="gap-2"
          >
            {publishFlow.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
            ) : null}
            Salvar e Ativar
            {validation && validation.errors.length > 0 ? (
              <Badge variant="destructive" className="ml-1 h-5 min-w-[20px] justify-center px-1">
                {validation.errors.length}
              </Badge>
            ) : validation && validation.warnings.length > 0 ? (
              <Badge className="ml-1 h-5 min-w-[20px] justify-center bg-amber-500 px-1 text-white hover:bg-amber-500">
                {validation.warnings.length}
              </Badge>
            ) : null}
          </Button>
        </div>
      </header>

      {isLoading ? (
        <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            Carregando fluxo…
          </span>
        </div>
      ) : error ? (
        <div className="flex flex-1 items-center justify-center text-sm text-destructive">
          Não foi possível carregar o fluxo. {error.message}
        </div>
      ) : !flow ? (
        <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
          Fluxo não encontrado.
        </div>
      ) : null}

      {flow && tab === "editor" ? (
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
              <CriteriaCard
                conditions={flowCriteria.conditions}
                onEdit={() => setCriteriaDialogOpen(true)}
              />
              <DropZone
                index={0}
                isDragging={isDragging}
                onDrop={handleDropAt}
                onMove={handleMoveStep}
              />
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-center gap-3">
                  <StepCard
                    step={step}
                    onRemove={handleRemoveStep}
                    onEdit={setEditingStepId}
                  />
                  <DropZone
                    index={index + 1}
                    isDragging={isDragging}
                    onDrop={handleDropAt}
                    onMove={handleMoveStep}
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
      ) : flow ? (
        <div className="min-h-0 flex-1 overflow-auto">
          {tab === "configuracoes" ? (
            <FlowSettingsPanel
              flow={flow}
              onPatch={patchDefinition}
              onTriggerChange={patchTrigger}
              isPending={updateFlow.isPending}
            />
          ) : tab === "saida" ? (
            <FlowExitPanel
              flow={flow}
              onPatch={patchDefinition}
              isPending={updateFlow.isPending}
            />
          ) : tab === "historico" ? (
            <FlowExecutionsPanel flowId={flow.id} />
          ) : null}
        </div>
      ) : null}

      <CriteriaEditDialog
        open={criteriaDialogOpen}
        onOpenChange={setCriteriaDialogOpen}
        initialConditions={flowCriteria.conditions}
        isPending={updateFlow.isPending}
        onSave={handleSaveCriteria}
      />

      <StepEditDialog
        step={editingStep}
        steps={steps}
        flowId={flow?.id ?? ""}
        onOpenChange={(open) => {
          if (!open) setEditingStepId(null);
        }}
        onSave={(patch) => {
          if (editingStepId) handleUpdateStep(editingStepId, patch);
        }}
      />

      <FlowValidationDialog
        open={validationDialog.open}
        result={validationDialog.result}
        isPublishing={publishFlow.isPending}
        onOpenChange={(open) => {
          if (!open) setValidationDialog({ open: false, result: null });
        }}
        onConfirm={() => {
          if (validationDialog.result) doPublish(validationDialog.result);
        }}
      />

      <SimulatorDialog
        open={simulatorOpen}
        onOpenChange={setSimulatorOpen}
        definition={flow ? { ...flow.definition, steps } : null}
      />
    </div>
  );
}
