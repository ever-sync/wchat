import {
  customFieldValueToString,
  type CustomerCustomFieldDefinition,
  type CustomerCustomFieldValueRow,
} from "@/lib/api/customer-custom-fields";
import { formatCustomFieldValueForDisplay } from "@/lib/custom-field-kinds";
import { slugifyFunnelKey } from "@/lib/crm/funnel-editor-utils";

function normalizeCustomFieldMatchKey(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

/** Chaves legadas em `customers.source_columns` que podem guardar o valor do campo. */
export function customerCustomFieldSourceColumnKeys(fieldNome: string): string[] {
  const trimmed = fieldNome.trim();
  if (!trimmed) {
    return [];
  }
  const keys = new Set<string>();
  keys.add(trimmed);
  keys.add(trimmed.toLowerCase());
  const slug = slugifyFunnelKey(trimmed);
  keys.add(slug);
  keys.add(slug.replace(/-/g, "_"));
  return [...keys];
}

export function readCustomerCustomFieldFromSourceColumns(
  sourceColumns: Record<string, string> | undefined | null,
  fieldNome: string,
): string {
  if (!sourceColumns) {
    return "";
  }
  for (const key of customerCustomFieldSourceColumnKeys(fieldNome)) {
    const raw = sourceColumns[key];
    if (raw != null && String(raw).trim() !== "") {
      return String(raw).trim();
    }
  }
  const target = normalizeCustomFieldMatchKey(fieldNome);
  if (!target) {
    return "";
  }
  for (const [key, raw] of Object.entries(sourceColumns)) {
    if (raw == null || String(raw).trim() === "") {
      continue;
    }
    if (normalizeCustomFieldMatchKey(key) === target) {
      return String(raw).trim();
    }
  }
  return "";
}

export type CustomerCustomFieldDisplayItem = {
  field: CustomerCustomFieldDefinition;
  value: string;
};

const EMPTY_VALUE_ROW: CustomerCustomFieldValueRow = {
  fieldId: "",
  valueText: null,
  valueNumeric: null,
  valueDate: null,
};

export function buildCustomerCustomFieldsDisplayList(input: {
  fields: CustomerCustomFieldDefinition[];
  valueRows: CustomerCustomFieldValueRow[];
  sourceColumns?: Record<string, string> | null;
}): CustomerCustomFieldDisplayItem[] {
  const values = new Map(input.valueRows.map((row) => [row.fieldId, row]));
  return input.fields.map((field) => {
    const row = values.get(field.id);
    let raw = customFieldValueToString(field.kind, row ?? { ...EMPTY_VALUE_ROW, fieldId: field.id });
    if (!raw.trim()) {
      raw = readCustomerCustomFieldFromSourceColumns(input.sourceColumns, field.nome);
    }
    const display = raw.trim() ? formatCustomFieldValueForDisplay(field.kind, raw) : "";
    return { field, value: display };
  });
}
