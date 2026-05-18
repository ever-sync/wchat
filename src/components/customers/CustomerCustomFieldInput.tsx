import type { ReactNode } from "react";
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
import { parseCustomFieldOptions, type CustomFieldKind } from "@/lib/custom-field-kinds";
import {
  applyCustomFieldInputMask,
  customFieldKindHasInputMask,
  getCustomFieldInputMaxLength,
} from "@/lib/custom-field-masks";

export type CustomFieldDefinitionLike = {
  id: string;
  nome: string;
  kind: CustomFieldKind;
  options?: string[];
};

type CustomerCustomFieldInputProps = {
  field: CustomFieldDefinitionLike;
  value: string;
  onChange: (value: string) => void;
  id?: string;
  labelClassName?: string;
  inputClassName?: string;
  disabled?: boolean;
};

function boolFromValue(value: string): boolean {
  const v = value.trim().toLowerCase();
  return v === "1" || v === "true" || v === "sim" || v === "yes";
}

function FieldShell({
  label,
  labelClassName,
  htmlFor,
  children,
}: {
  label: string;
  labelClassName?: string;
  htmlFor: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={htmlFor} className={labelClassName}>
        {label}
      </Label>
      {children}
    </div>
  );
}

function BoolRow({ children }: { children: ReactNode }) {
  return <div className="flex items-center gap-2">{children}</div>;
}

function getNativeInputProps(kind: CustomFieldKind): {
  type: string;
  inputMode?: "numeric" | "decimal" | "email" | "tel" | "url";
  placeholder?: string;
} {
  if (customFieldKindHasInputMask(kind)) {
    return {
      type: "text",
      inputMode: kind === "inteiro" || kind === "moeda" || kind === "porcentagem" || kind === "numero" ? "decimal" : "numeric",
      placeholder: getMaskedPlaceholder(kind),
    };
  }

  switch (kind) {
    case "email":
      return { type: "email", inputMode: "email", placeholder: "email@exemplo.com" };
    case "url":
      return { type: "url", inputMode: "url", placeholder: "https://…" };
    case "data":
      return { type: "date" };
    case "hora":
      return { type: "time" };
    case "data_hora":
      return { type: "datetime-local" };
    default:
      return { type: "text" };
  }
}

function getMaskedPlaceholder(kind: CustomFieldKind): string | undefined {
  switch (kind) {
    case "cpf":
      return "000.000.000-00";
    case "cnpj":
      return "00.000.000/0000-00";
    case "cep":
      return "00000-000";
    case "telefone":
      return "(11) 99999-9999";
    case "moeda":
      return "R$ 0,00";
    case "porcentagem":
      return "0%";
    case "numero":
      return "0,00";
    default:
      return undefined;
  }
}

function handleMaskedChange(kind: CustomFieldKind, raw: string, onChange: (value: string) => void) {
  onChange(applyCustomFieldInputMask(kind, raw));
}

export function CustomerCustomFieldInput({
  field,
  value,
  onChange,
  id,
  labelClassName,
  inputClassName = "rounded-[10px]",
  disabled = false,
}: CustomerCustomFieldInputProps) {
  const inputId = id ?? `customer-custom-${field.id}`;
  const { kind } = field;
  const options = parseCustomFieldOptions(field.options ?? []);
  const isMasked = customFieldKindHasInputMask(kind);
  const maxLength = getCustomFieldInputMaxLength(kind);

  if (kind === "booleano") {
    return (
      <FieldShell label={field.nome} labelClassName={labelClassName} htmlFor={inputId}>
        <BoolRow>
          <Switch
            id={inputId}
            checked={boolFromValue(value)}
            disabled={disabled}
            onCheckedChange={(checked) => onChange(checked ? "1" : "0")}
          />
          <span className="text-sm text-muted-foreground">{boolFromValue(value) ? "Sim" : "Não"}</span>
        </BoolRow>
      </FieldShell>
    );
  }

  if (kind === "lista" && options.length > 0) {
    return (
      <FieldShell label={field.nome} labelClassName={labelClassName} htmlFor={inputId}>
        <Select value={value || undefined} onValueChange={onChange} disabled={disabled}>
          <SelectTrigger id={inputId} className={inputClassName}>
            <SelectValue placeholder="Selecione…" />
          </SelectTrigger>
          <SelectContent>
            {options.map((opt) => (
              <SelectItem key={opt} value={opt}>
                {opt}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FieldShell>
    );
  }

  if (kind === "texto_longo") {
    return (
      <FieldShell label={field.nome} labelClassName={labelClassName} htmlFor={inputId}>
        <Textarea
          id={inputId}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          className={inputClassName}
          rows={3}
        />
      </FieldShell>
    );
  }

  if (kind === "cor") {
    return (
      <FieldShell label={field.nome} labelClassName={labelClassName} htmlFor={inputId}>
        <div className="flex items-center gap-2">
          <Input
            id={inputId}
            type="color"
            value={value || "#6366f1"}
            disabled={disabled}
            onChange={(e) => onChange(e.target.value)}
            className="h-10 w-14 cursor-pointer rounded-[10px] p-1"
          />
          <Input
            type="text"
            value={value}
            disabled={disabled}
            onChange={(e) => onChange(e.target.value)}
            placeholder="#6366f1"
            className={`${inputClassName} flex-1`}
          />
        </div>
      </FieldShell>
    );
  }

  const inputProps = getNativeInputProps(kind);

  return (
    <FieldShell label={field.nome} labelClassName={labelClassName} htmlFor={inputId}>
      <Input
        id={inputId}
        type={inputProps.type}
        inputMode={inputProps.inputMode}
        placeholder={inputProps.placeholder}
        maxLength={maxLength}
        value={value}
        disabled={disabled}
        onChange={(e) =>
          isMasked
            ? handleMaskedChange(kind, e.target.value, onChange)
            : onChange(e.target.value)
        }
        className={inputClassName}
      />
    </FieldShell>
  );
}
