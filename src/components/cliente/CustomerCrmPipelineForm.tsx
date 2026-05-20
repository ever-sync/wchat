import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import type { CrmFunnel } from "@/data/crm-funnels";
import { toCustomerUpsertInput, useUpdateCustomer } from "@/lib/api/customers";
import {
  useCreateCrmNegotiation,
  useCrmNegotiationsForCustomer,
  useUpdateCrmNegotiation,
} from "@/lib/api/crm-negotiations";
import type { Customer } from "@/types/domain";
import { CRM_FUNNEL_ID_KEY, CRM_PIPELINE_STAGE_KEY } from "@/lib/crm-pipeline";
import { negotiationAssigneeBlockedMessage } from "@/lib/crm/negotiation-assignee";

const FUNNEL_NONE = "__funnel_none__";

export function CustomerCrmPipelineForm({
  customer,
  funnels,
  readOnly = false,
  className,
}: {
  customer: Customer;
  funnels: CrmFunnel[];
  readOnly?: boolean;
  className?: string;
}) {
  const { toast } = useToast();
  const updateCustomer = useUpdateCustomer();
  const updateNegotiation = useUpdateCrmNegotiation();
  const createNegotiation = useCreateCrmNegotiation();
  const { data: linkedNegotiations = [], isLoading: negotiationsLoading } =
    useCrmNegotiationsForCustomer(customer.id);

  const storedFunnel = customer.sourceColumns?.[CRM_FUNNEL_ID_KEY]?.trim() ?? "";
  const storedStage = customer.sourceColumns?.[CRM_PIPELINE_STAGE_KEY]?.trim() ?? "";

  const [draftFunnel, setDraftFunnel] = useState(storedFunnel);
  const [draftStage, setDraftStage] = useState(storedStage);

  useEffect(() => {
    setDraftFunnel(storedFunnel);
    setDraftStage(storedStage);
  }, [customer.id, storedFunnel, storedStage]);

  const draftFunnelOk = Boolean(draftFunnel && funnels.some((f) => f.id === draftFunnel));
  const draftCurrentFunnel = draftFunnelOk
    ? funnels.find((f) => f.id === draftFunnel)!
    : null;
  const stages = draftCurrentFunnel?.stages ?? [];
  const draftStageOk = Boolean(
    draftCurrentFunnel && draftStage && draftCurrentFunnel.stages.some((s) => s.id === draftStage),
  );

  const isSaving =
    updateCustomer.isPending || updateNegotiation.isPending || createNegotiation.isPending;
  // Sem negociação ativa, salvar deve poder criar uma mesmo que funil/etapa não tenham mudado
  // (ex.: cadastro com sourceColumns gravado por uma versão anterior, sem negociação no CRM).
  const noOpenNegotiation =
    !negotiationsLoading && linkedNegotiations.every((n) => n.status !== "em_andamento");
  const hasChanges = draftFunnel !== storedFunnel || draftStage !== storedStage;
  const canSave =
    !readOnly &&
    !isSaving &&
    (hasChanges || noOpenNegotiation) &&
    draftFunnelOk &&
    draftStageOk;

  const persist = async (funnelId: string, stageId: string) => {
    if (readOnly) {
      toast({
        title: "Assuma o negócio",
        description: negotiationAssigneeBlockedMessage(),
        variant: "destructive",
      });
      return;
    }
    try {
      await updateCustomer.mutateAsync({
        id: customer.id,
        input: {
          ...toCustomerUpsertInput(customer),
          sourceColumns: {
            ...customer.sourceColumns,
            [CRM_FUNNEL_ID_KEY]: funnelId,
            [CRM_PIPELINE_STAGE_KEY]: stageId,
          },
        },
      });

      const openNegotiations = linkedNegotiations.filter((n) => n.status === "em_andamento");

      if (openNegotiations.length === 0) {
        // Sem negociação ativa: cria uma para refletir no Kanban e habilitar Arquivos.
        await createNegotiation.mutateAsync({
          title: customer.nome?.trim() || "Nova negociação",
          funnelId,
          stageId,
          customerId: customer.id,
        });
        toast({
          title: "Negociação criada",
          description: "Lead adicionado ao CRM no funil e etapa selecionados.",
        });
        return;
      }

      const targets = openNegotiations.filter(
        (n) => n.funnelId !== funnelId || n.stageId !== stageId,
      );
      if (targets.length > 0) {
        await Promise.all(
          targets.map((n) =>
            updateNegotiation.mutateAsync({
              id: n.id,
              patch: { funnelId, stageId },
            }),
          ),
        );
      }

      toast({
        title: "Funil atualizado",
        description: "As mudanças foram salvas no cadastro e no CRM.",
      });
    } catch (e) {
      toast({
        title: "Erro ao salvar funil",
        description: e instanceof Error ? e.message : "Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleSave = () => {
    if (!canSave) return;
    void persist(draftFunnel, draftStage);
  };

  const handleReset = () => {
    setDraftFunnel(storedFunnel);
    setDraftStage(storedStage);
  };

  const funnelSelectValue = draftFunnelOk ? draftFunnel : FUNNEL_NONE;
  const stageSelectValue = draftStageOk ? draftStage : FUNNEL_NONE;

  return (
    <div
      className={
        className ??
        "rounded-[20px] border border-[#e1e8dc] bg-white/90 p-4 shadow-sm"
      }
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#96a29c]">
        CRM · Funil e etapa
      </p>
      <p className="mt-1 text-xs text-[#6f7b76]">
        Refletem no Kanban e negociações vinculadas a este cadastro.
      </p>
      <div className="mt-3 space-y-3">
        <div className="space-y-1">
          <Label htmlFor="customer-crm-funnel" className="text-xs text-[#5f6d66]">
            Pipeline
          </Label>
          <Select
            value={funnelSelectValue}
            disabled={readOnly || isSaving}
            onValueChange={(fid) => {
              if (fid === FUNNEL_NONE) return;
              const f = funnels.find((x) => x.id === fid);
              const first = f?.stages[0]?.id ?? "";
              setDraftFunnel(fid);
              setDraftStage(first);
            }}
          >
            <SelectTrigger
              id="customer-crm-funnel"
              className="rounded-xl border-[#dfe6d8] bg-white"
            >
              <SelectValue placeholder="Selecionar funil" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={FUNNEL_NONE} disabled className="text-muted-foreground">
                Selecionar funil…
              </SelectItem>
              {funnels.map((f) => (
                <SelectItem key={f.id} value={f.id}>
                  {f.listName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="customer-crm-stage" className="text-xs text-[#5f6d66]">
            Etapa
          </Label>
          <Select
            value={stageSelectValue}
            disabled={readOnly || isSaving || !draftFunnelOk || stages.length === 0}
            onValueChange={(sid) => {
              if (sid === FUNNEL_NONE || !draftFunnelOk) return;
              setDraftStage(sid);
            }}
          >
            <SelectTrigger
              id="customer-crm-stage"
              className="rounded-xl border-[#dfe6d8] bg-white"
            >
              <SelectValue placeholder="Selecionar etapa" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={FUNNEL_NONE} disabled className="text-muted-foreground">
                Selecionar etapa…
              </SelectItem>
              {stages.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {!readOnly ? (
        <div className="mt-4 flex items-center justify-end gap-2">
          {hasChanges ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleReset}
              disabled={isSaving}
              className="rounded-full"
            >
              Cancelar
            </Button>
          ) : null}
          <Button
            type="button"
            size="sm"
            onClick={handleSave}
            disabled={!canSave}
            className="rounded-full"
          >
            {isSaving ? "Salvando…" : "Salvar"}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
