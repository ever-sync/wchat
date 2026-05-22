import { Type, Mail, Phone, AlignLeft, List, Circle, CheckSquare, Calendar, EyeOff } from "lucide-react";
import type { FormFieldType } from "@/lib/marketing/form-types";

const FIELD_TYPES: { type: FormFieldType; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { type: "text", label: "Texto", icon: Type },
  { type: "email", label: "E-mail", icon: Mail },
  { type: "phone", label: "Telefone", icon: Phone },
  { type: "textarea", label: "Texto longo", icon: AlignLeft },
  { type: "select", label: "Lista suspensa", icon: List },
  { type: "radio", label: "Múltipla escolha", icon: Circle },
  { type: "checkbox", label: "Caixas de seleção", icon: CheckSquare },
  { type: "date", label: "Data", icon: Calendar },
  { type: "hidden", label: "Campo oculto", icon: EyeOff },
];

interface FieldPaletteProps {
  onAddField: (type: FormFieldType) => void;
}

export function FieldPalette({ onAddField }: FieldPaletteProps) {
  return (
    <div className="w-52 flex-shrink-0 overflow-y-auto bg-muted/40 p-3">
      <p className="mb-2.5 px-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
        Tipos de campo
      </p>
      <div className="space-y-0.5">
        {FIELD_TYPES.map(({ type, label, icon: Icon }) => (
          <button
            key={type}
            type="button"
            onClick={() => onAddField(type)}
            className="group flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-medium text-muted-foreground transition-all hover:bg-background hover:text-foreground hover:shadow-sm"
          >
            <Icon className="h-4 w-4 flex-shrink-0 text-muted-foreground transition-colors group-hover:text-foreground" />
            {label}
          </button>
        ))}
      </div>

      <div className="mt-4 px-1">
        <p className="text-[10px] leading-relaxed text-muted-foreground">
          Clique em um campo para adicioná-lo ao formulário.
          <br />
          Arraste os campos no canvas para reordenar.
        </p>
      </div>
    </div>
  );
}
