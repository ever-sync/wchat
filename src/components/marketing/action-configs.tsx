// Componentes de configuracao por action (Fase 2 do plano completo).
// Cada componente recebe { value, onChange } e edita o config estruturado da
// step (definition.steps[].config). pickConfigComponent(actionId) devolve o
// componente certo ou null quando a action nao tem schema ainda.

import type { ComponentType } from "react";
import { DEFAULT_CRM_FUNNELS } from "@/data/crm-funnels";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  WEBHOOK_METHODS,
  getConfigKind,
  type ActionConfigByKind,
  type ActionConfigKind,
  type CreateDealConfig,
  type CreateTaskConfig,
  type MoveDealConfig,
  type TagConfig,
  type WaitConfig,
  type WebhookConfig,
  type WebhookMethod,
  type WhatsAppConfig,
} from "@/lib/marketing/flow-action-configs";

type ConfigProps<T> = {
  value: T;
  onChange: (next: T) => void;
};

// ---------------------------------------------------------------- Wait

export function WaitActionConfig({ value, onChange }: ConfigProps<WaitConfig>) {
  const set = (patch: Partial<WaitConfig>) => onChange({ ...value, ...patch });
  return (
    <div className="grid grid-cols-3 gap-3">
      {(
        [
          ["days", "Dias"],
          ["hours", "Horas"],
          ["minutes", "Minutos"],
        ] as const
      ).map(([field, label]) => (
        <div key={field} className="flex flex-col gap-2">
          <Label htmlFor={`wait-${field}`} className="text-xs font-semibold uppercase tracking-wide">
            {label}
          </Label>
          <Input
            id={`wait-${field}`}
            type="number"
            min={0}
            value={value[field]}
            onChange={(event) =>
              set({ [field]: Math.max(0, Math.floor(Number(event.target.value) || 0)) })
            }
          />
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------- WhatsApp

export function WhatsAppActionConfig({ value, onChange }: ConfigProps<WhatsAppConfig>) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor="whatsapp-message" className="text-xs font-semibold uppercase tracking-wide">
        Mensagem
      </Label>
      <Textarea
        id="whatsapp-message"
        value={value.message}
        onChange={(event) => onChange({ message: event.target.value })}
        rows={6}
        placeholder="Olá {{cliente.nome}}, tudo bem?"
      />
      <p className="text-xs text-muted-foreground">
        Variáveis disponíveis na Fase 5: <code>{`{{cliente.nome}}`}</code>,{" "}
        <code>{`{{negociacao.titulo}}`}</code>, etc.
      </p>
    </div>
  );
}

// ---------------------------------------------------------------- CreateTask

export function CreateTaskActionConfig({ value, onChange }: ConfigProps<CreateTaskConfig>) {
  const set = (patch: Partial<CreateTaskConfig>) => onChange({ ...value, ...patch });
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2">
        <Label htmlFor="task-title" className="text-xs font-semibold uppercase tracking-wide">
          Título da tarefa
        </Label>
        <Input
          id="task-title"
          value={value.title}
          onChange={(event) => set({ title: event.target.value })}
          placeholder="Entrar em contato com o lead"
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="task-description" className="text-xs font-semibold uppercase tracking-wide">
          Descrição (opcional)
        </Label>
        <Textarea
          id="task-description"
          value={value.description ?? ""}
          onChange={(event) => set({ description: event.target.value })}
          rows={3}
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="task-due" className="text-xs font-semibold uppercase tracking-wide">
          Vencimento (dias a partir da execução)
        </Label>
        <Input
          id="task-due"
          type="number"
          min={0}
          value={value.dueDays}
          onChange={(event) =>
            set({ dueDays: Math.max(0, Math.floor(Number(event.target.value) || 0)) })
          }
          className="max-w-32"
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- Funnel/Stage selector

function FunnelStageFields({
  funnelId,
  stageId,
  onChange,
}: {
  funnelId: string;
  stageId: string;
  onChange: (next: { funnelId: string; stageId: string }) => void;
}) {
  const funnel = DEFAULT_CRM_FUNNELS.find((f) => f.id === funnelId);
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="flex flex-col gap-2">
        <Label htmlFor="deal-funnel" className="text-xs font-semibold uppercase tracking-wide">
          Funil
        </Label>
        <Select
          value={funnelId || undefined}
          onValueChange={(next) => onChange({ funnelId: next, stageId: "" })}
        >
          <SelectTrigger id="deal-funnel">
            <SelectValue placeholder="Selecione um funil" />
          </SelectTrigger>
          <SelectContent>
            {DEFAULT_CRM_FUNNELS.map((f) => (
              <SelectItem key={f.id} value={f.id}>
                {f.listName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="deal-stage" className="text-xs font-semibold uppercase tracking-wide">
          Etapa
        </Label>
        <Select
          value={stageId || undefined}
          onValueChange={(next) => onChange({ funnelId, stageId: next })}
          disabled={!funnel}
        >
          <SelectTrigger id="deal-stage">
            <SelectValue
              placeholder={funnel ? "Selecione uma etapa" : "Escolha o funil primeiro"}
            />
          </SelectTrigger>
          <SelectContent>
            {funnel?.stages.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- CreateDeal

export function CreateDealActionConfig({ value, onChange }: ConfigProps<CreateDealConfig>) {
  return (
    <div className="flex flex-col gap-3">
      <FunnelStageFields
        funnelId={value.funnelId}
        stageId={value.stageId}
        onChange={(next) => onChange({ ...value, ...next })}
      />
      <div className="flex flex-col gap-2">
        <Label htmlFor="deal-title" className="text-xs font-semibold uppercase tracking-wide">
          Título da negociação (opcional)
        </Label>
        <Input
          id="deal-title"
          value={value.title ?? ""}
          onChange={(event) => onChange({ ...value, title: event.target.value })}
          placeholder="Será gerado a partir do nome do lead se vazio"
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- MoveDeal

export function MoveDealActionConfig({ value, onChange }: ConfigProps<MoveDealConfig>) {
  return (
    <FunnelStageFields
      funnelId={value.funnelId}
      stageId={value.stageId}
      onChange={onChange}
    />
  );
}

// ---------------------------------------------------------------- Tag

export function TagActionConfig({ value, onChange }: ConfigProps<TagConfig>) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor="tag-name" className="text-xs font-semibold uppercase tracking-wide">
        Etiqueta
      </Label>
      <Input
        id="tag-name"
        value={value.tag}
        onChange={(event) => onChange({ tag: event.target.value })}
        placeholder="ex.: lead-qualificado"
      />
    </div>
  );
}

// ---------------------------------------------------------------- Webhook

export function WebhookActionConfig({ value, onChange }: ConfigProps<WebhookConfig>) {
  const set = (patch: Partial<WebhookConfig>) => onChange({ ...value, ...patch });
  return (
    <div className="flex flex-col gap-3">
      <div className="grid gap-3 sm:grid-cols-[120px_1fr]">
        <div className="flex flex-col gap-2">
          <Label htmlFor="webhook-method" className="text-xs font-semibold uppercase tracking-wide">
            Método
          </Label>
          <Select
            value={value.method}
            onValueChange={(next) => set({ method: next as WebhookMethod })}
          >
            <SelectTrigger id="webhook-method">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {WEBHOOK_METHODS.map((m) => (
                <SelectItem key={m} value={m}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="webhook-url" className="text-xs font-semibold uppercase tracking-wide">
            URL
          </Label>
          <Input
            id="webhook-url"
            value={value.url}
            onChange={(event) => set({ url: event.target.value })}
            placeholder="https://exemplo.com/webhook"
          />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="webhook-headers" className="text-xs font-semibold uppercase tracking-wide">
          Headers (opcional, formato Key: Value por linha)
        </Label>
        <Textarea
          id="webhook-headers"
          value={value.headers ?? ""}
          onChange={(event) => set({ headers: event.target.value })}
          rows={3}
          placeholder={"Authorization: Bearer xxx\nX-Custom: value"}
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="webhook-body" className="text-xs font-semibold uppercase tracking-wide">
          Body (opcional, JSON)
        </Label>
        <Textarea
          id="webhook-body"
          value={value.body ?? ""}
          onChange={(event) => set({ body: event.target.value })}
          rows={4}
          placeholder={'{ "leadId": "{{cliente.id}}" }'}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- Registry

type AnyConfigComponent = ComponentType<{
  value: ActionConfigByKind[ActionConfigKind];
  onChange: (next: ActionConfigByKind[ActionConfigKind]) => void;
}>;

const COMPONENTS: { [K in ActionConfigKind]: ComponentType<ConfigProps<ActionConfigByKind[K]>> } = {
  wait: WaitActionConfig,
  whatsapp: WhatsAppActionConfig,
  "create-task": CreateTaskActionConfig,
  "create-deal": CreateDealActionConfig,
  "move-deal": MoveDealActionConfig,
  tag: TagActionConfig,
  webhook: WebhookActionConfig,
};

export function pickConfigComponent(actionId: string): AnyConfigComponent | null {
  const kind = getConfigKind(actionId);
  if (!kind) return null;
  return COMPONENTS[kind] as AnyConfigComponent;
}
