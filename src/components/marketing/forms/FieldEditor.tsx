import { AlertTriangle, Plus, Settings2, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { fieldNeedsOptions, type FormField, type FormFieldWidth } from "@/lib/marketing/form-types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ConditionalLogicEditor } from "./ConditionalLogicEditor";

interface FieldEditorProps {
  field: FormField | null;
  allFields?: FormField[];
  errors?: string[];
  onUpdate: (updates: Partial<FormField>) => void;
}

export function FieldEditor({ field, allFields = [], errors = [], onUpdate }: FieldEditorProps) {
  if (!field) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center p-6 text-center">
        <Settings2 className="mb-3 h-8 w-8 text-muted-foreground/40" />
        <p className="text-sm font-medium text-muted-foreground">Nenhum campo selecionado</p>
        <p className="mt-1 text-xs text-muted-foreground/70">Clique em um campo no canvas para editar</p>
      </div>
    );
  }

  const hasOptions = fieldNeedsOptions(field.type);
  const hasPlaceholder = !["hidden", "checkbox", "radio", "date"].includes(field.type);
  const hasValidation = ["text", "textarea", "email", "phone"].includes(field.type);
  const width = (field.layoutWidth ?? 100) as FormFieldWidth;
  const availableConditionFields = allFields.filter((candidate) => candidate.id !== field.id && candidate.type !== "hidden");

  function addOption() {
    if (!field) return;
    const options = [
      ...(field.options ?? []),
      { label: `Opção ${(field.options?.length ?? 0) + 1}`, value: `opcao_${Date.now()}` },
    ];
    onUpdate({ options });
  }

  function updateOption(index: number, label: string) {
    if (!field) return;
    const options = [...(field.options ?? [])];
    options[index] = { label, value: label.toLowerCase().replace(/\s+/g, "_") };
    onUpdate({ options });
  }

  function removeOption(index: number) {
    if (!field) return;
    onUpdate({ options: (field.options ?? []).filter((_, i) => i !== index) });
  }

  return (
    <div className="p-4 space-y-4">
      {errors.length > 0 && (
        <div className="rounded-md border border-amber-200 bg-amber-50 p-2.5">
          <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-amber-800">
            <AlertTriangle className="h-3.5 w-3.5" />
            Ajustes necessários para publicar
          </div>
          <ul className="space-y-1 text-xs text-amber-700">
            {errors.map((error) => (
              <li key={error}>- {error}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Rótulo *</Label>
        <Input
          value={field.label}
          onChange={(e) => onUpdate({ label: e.target.value })}
          placeholder="Nome do campo"
          className="h-8 text-sm"
        />
      </div>

      {!field.mapping || field.mapping.kind === "extra" ? (
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Identificador</Label>
          <Input
            value={field.name}
            onChange={(e) => onUpdate({ name: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "_") })}
            placeholder="nome_do_campo"
            className="h-8 font-mono text-sm"
          />
          <p className="text-[10px] text-muted-foreground">Chave nos dados do lead</p>
        </div>
      ) : (
        <p className="rounded-md bg-muted/50 px-2.5 py-1.5 text-[11px] text-muted-foreground">
          {field.mapping.kind === "default"
            ? "Campo padrão do contato — salva no cadastro."
            : "Campo personalizado do contato — salva no cadastro."}
        </p>
      )}

      {hasPlaceholder && (
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Placeholder</Label>
          <Input
            value={field.placeholder ?? ""}
            onChange={(e) => onUpdate({ placeholder: e.target.value })}
            placeholder="Texto de exemplo..."
            className="h-8 text-sm"
          />
        </div>
      )}

      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Texto de ajuda</Label>
        <Input
          value={field.helpText ?? ""}
          onChange={(e) => onUpdate({ helpText: e.target.value })}
          placeholder="Instrução opcional..."
          className="h-8 text-sm"
        />
      </div>

      <div className="flex items-center justify-between py-0.5">
        <Label className="cursor-pointer text-xs text-muted-foreground">Obrigatório</Label>
        <Switch checked={field.required} onCheckedChange={(checked) => onUpdate({ required: checked })} />
      </div>

      {field.type !== "hidden" ? (
        <div className="flex items-center justify-between py-0.5">
          <div>
            <Label className="cursor-pointer text-xs text-muted-foreground">Começar nova linha</Label>
            <p className="text-[10px] text-muted-foreground">Este campo inicia um novo bloco visual.</p>
          </div>
          <Switch
            checked={field.lineBreakBefore ?? false}
            onCheckedChange={(checked) => onUpdate({ lineBreakBefore: checked })}
          />
        </div>
      ) : null}

      {field.type !== "hidden" ? (
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Largura</Label>
          <Select
            value={String(width)}
            onValueChange={(value) => onUpdate({ layoutWidth: Number(value) as FormFieldWidth })}
          >
            <SelectTrigger className="h-8 text-sm">
              <SelectValue placeholder="Largura do campo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="100">100% - linha inteira</SelectItem>
              <SelectItem value="66">66% - 2/3 da linha</SelectItem>
              <SelectItem value="33">33% - 1/3 da linha</SelectItem>
            </SelectContent>
          </Select>
        </div>
      ) : null}

      {field.type === "hidden" && (
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Valor padrão</Label>
          <Input
            value={field.defaultValue ?? ""}
            onChange={(e) => onUpdate({ defaultValue: e.target.value })}
            placeholder="valor"
            className="h-8 font-mono text-sm"
          />
        </div>
      )}

      {hasOptions && (
        <>
          <Separator />
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold">Opções</Label>
              <Button size="sm" variant="ghost" className="h-6 px-2 text-xs" onClick={addOption}>
                <Plus className="mr-1 h-3 w-3" />
                Adicionar
              </Button>
            </div>

            <div className="space-y-1.5">
              {(field.options ?? []).map((opt, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <Input
                    value={opt.label}
                    onChange={(e) => updateOption(i, e.target.value)}
                    placeholder="Rótulo da opção"
                    className="h-7 flex-1 text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => removeOption(i)}
                    className="flex-shrink-0 p-1 text-muted-foreground/50 transition-colors hover:text-red-500"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
              {(field.options?.length ?? 0) === 0 && (
                <p className="text-xs italic text-muted-foreground">Nenhuma opção ainda</p>
              )}
            </div>
          </div>
        </>
      )}

      {hasValidation && (
        <>
          <Separator />
          <div className="space-y-2.5">
            <Label className="text-xs font-semibold">Validação</Label>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-[10px] text-muted-foreground">Mín. chars</Label>
                <Input
                  type="number"
                  min={0}
                  value={field.validation?.minLength ?? ""}
                  onChange={(e) =>
                    onUpdate({
                      validation: {
                        ...field.validation,
                        minLength: e.target.value ? Number(e.target.value) : undefined,
                      },
                    })
                  }
                  className="h-7 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] text-muted-foreground">Máx. chars</Label>
                <Input
                  type="number"
                  min={0}
                  value={field.validation?.maxLength ?? ""}
                  onChange={(e) =>
                    onUpdate({
                      validation: {
                        ...field.validation,
                        maxLength: e.target.value ? Number(e.target.value) : undefined,
                      },
                    })
                  }
                  className="h-7 text-xs"
                />
              </div>
            </div>
          </div>
        </>
      )}

      {field.type !== "hidden" ? (
        <>
          <Separator />
          <ConditionalLogicEditor
            title="Visibilidade condicional"
            description="Mostra este campo apenas quando outras respostas combinarem."
            logic={field.conditionalLogic}
            availableFields={availableConditionFields}
            onChange={(conditionalLogic) => onUpdate({ conditionalLogic })}
          />
        </>
      ) : null}
    </div>
  );
}
