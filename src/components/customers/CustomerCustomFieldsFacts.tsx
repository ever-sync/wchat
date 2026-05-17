import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CustomerCustomFieldInput } from "@/components/customers/CustomerCustomFieldInput";
import {
  invalidateCustomerCustomFieldValues,
  upsertCustomerCustomFieldValues,
  useCustomerCustomFields,
  useCustomerCustomFieldValues,
} from "@/lib/api/customer-custom-fields";
import { buildCustomerCustomFieldsDisplayList } from "@/lib/customer-custom-field-display";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";

type CustomerCustomFieldsFactsProps = {
  customerId: string;
  sourceColumns?: Record<string, string> | null;
  className?: string;
  readOnly?: boolean;
};

function CustomFieldRow({ label, value }: { label: string; value: string }) {
  const trimmed = value.trim();
  const empty = trimmed.length === 0;

  return (
    <div className="py-2.5 first:pt-0 last:pb-0">
      <p
        className="text-xs font-medium leading-snug tracking-tight text-[#78909c]"
        title={label}
      >
        {label}
      </p>
      <p
        className={cn(
          "mt-1 text-sm leading-relaxed break-words",
          empty ? "italic text-[#b0bab5]" : "font-medium text-[#334047]",
        )}
      >
        {empty ? "Não informado" : trimmed}
      </p>
    </div>
  );
}

function draftFromItems(items: { field: { id: string }; value: string }[]): Record<string, string> {
  return Object.fromEntries(items.map(({ field, value }) => [field.id, value]));
}

export function CustomerCustomFieldsFacts({
  customerId,
  sourceColumns,
  className,
  readOnly = false,
}: CustomerCustomFieldsFactsProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
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

  const [draft, setDraft] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isLoading) {
      return;
    }
    setDraft(
      draftFromItems(
        buildCustomerCustomFieldsDisplayList({
          fields: fieldDefs,
          valueRows,
          sourceColumns,
        }),
      ),
    );
  }, [customerId, fieldDefs, isLoading, valueRows, sourceColumns]);

  const filledCount = useMemo(
    () => Object.values(draft).filter((v) => v.trim().length > 0).length,
    [draft],
  );

  const isDirty = useMemo(() => {
    const baseline = draftFromItems(items);
    return fieldDefs.some((field) => (draft[field.id] ?? "") !== (baseline[field.id] ?? ""));
  }, [draft, fieldDefs, items]);

  if (fieldDefs.length === 0) {
    return null;
  }

  const handleSave = async () => {
    if (readOnly || saving) {
      return;
    }
    setSaving(true);
    try {
      await upsertCustomerCustomFieldValues(customerId, fieldDefs, draft);
      invalidateCustomerCustomFieldValues(queryClient, customerId);
      toast({ title: "Campos salvos", description: "Os dados personalizados foram atualizados." });
    } catch (e) {
      toast({
        title: "Não foi possível salvar",
        description: e instanceof Error ? e.message : "Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className={cn(
        "rounded-[20px] border border-[#e1e8dc] bg-white/90 p-4 shadow-sm",
        className,
      )}
    >
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#96a29c]">
          Campos personalizados
        </p>
        {!isLoading ? (
          <span className="shrink-0 text-[10px] font-medium tabular-nums text-[#96a29c]">
            {filledCount}/{fieldDefs.length}
          </span>
        ) : null}
      </div>

      <div className="mt-3">
        {isLoading ? (
          <div className="space-y-3" aria-busy="true">
            {[0, 1, 2].map((i) => (
              <div key={i} className="space-y-1.5">
                <div className="h-3 w-24 animate-pulse rounded bg-[#e8eee8]" />
                <div className="h-9 w-full animate-pulse rounded bg-[#f0f4ef]" />
              </div>
            ))}
          </div>
        ) : readOnly ? (
          <div className="divide-y divide-[#e8eee8]">
            {items.map(({ field, value }) => (
              <CustomFieldRow key={field.id} label={field.nome} value={value} />
            ))}
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {fieldDefs.map((field) => (
                <CustomerCustomFieldInput
                  key={field.id}
                  field={field}
                  value={draft[field.id] ?? ""}
                  disabled={saving}
                  onChange={(value) =>
                    setDraft((current) => ({ ...current, [field.id]: value }))
                  }
                  id={`inbox-custom-${field.id}`}
                  labelClassName="text-xs font-medium leading-snug text-[#78909c]"
                  inputClassName="h-9 rounded-xl border-[#dfe6d8] bg-white text-sm"
                />
              ))}
            </div>
            <div className="mt-4 flex justify-end border-t border-[#e8eee8] pt-3">
              <Button
                type="button"
                size="sm"
                className="rounded-xl"
                disabled={!isDirty || saving}
                onClick={() => void handleSave()}
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                    Salvando…
                  </>
                ) : (
                  "Salvar campos"
                )}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
