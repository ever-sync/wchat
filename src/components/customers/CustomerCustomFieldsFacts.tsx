import { useMemo } from "react";
import {
  useCustomerCustomFields,
  useCustomerCustomFieldValues,
} from "@/lib/api/customer-custom-fields";
import { buildCustomerCustomFieldsDisplayList } from "@/lib/customer-custom-field-display";
import { cn } from "@/lib/utils";

function infoValue(value: string) {
  const trimmed = value.trim();
  return trimmed || "Não informado";
}

export function CustomerCustomFieldsFacts({
  customerId,
  sourceColumns,
  className,
}: {
  customerId: string;
  sourceColumns?: Record<string, string> | null;
  className?: string;
}) {
  const { data: fieldDefs = [] } = useCustomerCustomFields();
  const { data: valueRows = [], isLoading } = useCustomerCustomFieldValues(customerId);

  const items = useMemo(
    () =>
      buildCustomerCustomFieldsDisplayList({
        fields: fieldDefs,
        valueRows,
        sourceColumns,
      }),
    [fieldDefs, valueRows, sourceColumns],
  );

  if (fieldDefs.length === 0) {
    return null;
  }

  const row = (label: string, value: string) => (
    <div key={label} className="flex justify-between gap-3 text-sm">
      <span className="shrink-0 text-[#6f7b76]">{label}</span>
      <span className="min-w-0 break-words text-right font-medium text-[#334047]">{infoValue(value)}</span>
    </div>
  );

  return (
    <div
      className={cn(
        "rounded-[20px] border border-[#e1e8dc] bg-white/90 p-4 shadow-sm",
        className,
      )}
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#96a29c]">
        Campos personalizados
      </p>
      <div className="mt-3 space-y-2">
        {isLoading ? (
          <p className="text-sm text-[#6f7b76]">Carregando…</p>
        ) : (
          items.map(({ field, value }) => row(field.nome, value))
        )}
      </div>
    </div>
  );
}
