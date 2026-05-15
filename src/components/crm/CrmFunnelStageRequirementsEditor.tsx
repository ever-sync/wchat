import { useEffect, useMemo, useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { CrmFunnel, CrmStageRequiredField } from "@/data/crm-funnels";
import { CRM_STAGE_REQUIRED_FIELD_OPTIONS } from "@/lib/crm/stage-requirements";

type CrmFunnelStageRequirementsEditorProps = {
  funnels: CrmFunnel[];
  onChange: (funnels: CrmFunnel[]) => void;
  disabled?: boolean;
};

const FIELD_HEADER_SHORT: Record<CrmStageRequiredField, string> = {
  total_value: "Valor",
  qualification: "Qualif.",
  closing_forecast: "Previsão",
  next_task_at: "Tarefa",
};

const GRID_COLS =
  "grid grid-cols-[minmax(0,1fr)_3.25rem_3.25rem_3.25rem_3.25rem] gap-x-3 sm:grid-cols-[minmax(0,1fr)_3.5rem_3.5rem_3.5rem_3.5rem] sm:gap-x-4";

function toggleStageField(
  funnels: CrmFunnel[],
  funnelId: string,
  stageId: string,
  field: CrmStageRequiredField,
  checked: boolean,
): CrmFunnel[] {
  return funnels.map((funnel) => {
    if (funnel.id !== funnelId) return funnel;
    return {
      ...funnel,
      stages: funnel.stages.map((stage) => {
        if (stage.id !== stageId) return stage;
        const next = new Set(stage.requiredFields ?? []);
        if (checked) next.add(field);
        else next.delete(field);
        const requiredFields = [...next];
        return {
          ...stage,
          requiredFields: requiredFields.length > 0 ? requiredFields : undefined,
        };
      }),
    };
  });
}

export function CrmFunnelStageRequirementsEditor({
  funnels,
  onChange,
  disabled,
}: CrmFunnelStageRequirementsEditorProps) {
  const [funnelId, setFunnelId] = useState(funnels[0]?.id ?? "");

  useEffect(() => {
    if (!funnels.some((f) => f.id === funnelId)) {
      setFunnelId(funnels[0]?.id ?? "");
    }
  }, [funnelId, funnels]);

  const activeFunnel = useMemo(
    () => funnels.find((f) => f.id === funnelId) ?? funnels[0],
    [funnelId, funnels],
  );

  if (funnels.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">Nenhum funil disponível para configurar.</p>
    );
  }

  const selectedId = activeFunnel?.id ?? funnels[0].id;

  return (
    <div className="space-y-5 rounded-xl border border-border/70 bg-muted/20 px-5 py-5 sm:px-6 sm:py-6">
      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="crm-req-funnel" className="text-sm font-medium">
            Funil
          </Label>
          <Select value={selectedId} onValueChange={setFunnelId} disabled={disabled}>
            <SelectTrigger id="crm-req-funnel" className="h-9 max-w-sm bg-background">
              <SelectValue placeholder="Selecione o funil" />
            </SelectTrigger>
            <SelectContent>
              {funnels.map((f) => (
                <SelectItem key={f.id} value={f.id}>
                  {f.listName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <p className="text-xs leading-relaxed text-muted-foreground">
          Marque o que o vendedor precisa preencher antes de mover o card para cada etapa no Kanban.
        </p>
      </div>

      {activeFunnel ? (
        <div className="overflow-x-auto rounded-lg border border-border bg-background shadow-sm">
          <div className="min-w-[min(100%,28rem)] sm:min-w-[32rem]">
            <div
              className={cn(
                GRID_COLS,
                "border-b border-border bg-muted/40 px-4 py-3 sm:px-5",
              )}
            >
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Etapa
              </span>
              {CRM_STAGE_REQUIRED_FIELD_OPTIONS.map((opt) => (
                <span
                  key={opt.id}
                  className="text-center text-[10px] font-semibold leading-tight text-muted-foreground sm:text-[11px]"
                  title={`${opt.label} — ${opt.description}`}
                >
                  {FIELD_HEADER_SHORT[opt.id]}
                </span>
              ))}
            </div>

            <div className="divide-y divide-border">
              {activeFunnel.stages.map((stage, index) => (
                <div
                  key={stage.id}
                  className={cn(
                    GRID_COLS,
                    "items-center px-4 py-3 sm:px-5",
                    index % 2 === 1 && "bg-muted/20",
                  )}
                >
                  <div className="min-w-0 pr-2">
                    <p className="text-sm font-medium leading-snug text-foreground">{stage.title}</p>
                    <p className="mt-0.5 font-mono text-[10px] text-muted-foreground">{stage.id}</p>
                  </div>
                  {CRM_STAGE_REQUIRED_FIELD_OPTIONS.map((opt) => {
                    const checked = (stage.requiredFields ?? []).includes(opt.id);
                    return (
                      <div className="flex justify-center" key={opt.id}>
                        <Checkbox
                          checked={checked}
                          disabled={disabled}
                          aria-label={`${stage.title}: ${opt.label}`}
                          className={cn(
                            checked && "border-primary data-[state=checked]:bg-primary",
                          )}
                          onCheckedChange={(value) => {
                            onChange(
                              toggleStageField(
                                funnels,
                                activeFunnel.id,
                                stage.id,
                                opt.id,
                                value === true,
                              ),
                            );
                          }}
                        />
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
