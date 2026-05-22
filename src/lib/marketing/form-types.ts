// Tipos do construtor de formulários (Marketing → Converter → Formulários).
// Portado de formularios/types/index.ts, adaptado ao modelo do WChat.

export type FormFieldType =
  | "text"
  | "email"
  | "phone"
  | "select"
  | "checkbox"
  | "radio"
  | "date"
  | "textarea"
  | "hidden";

export interface FormFieldOption {
  label: string;
  value: string;
}

export interface FormField {
  id: string;
  type: FormFieldType;
  name: string;
  label: string;
  placeholder?: string;
  required: boolean;
  options?: FormFieldOption[];
  defaultValue?: string;
  helpText?: string;
  validation?: {
    minLength?: number;
    maxLength?: number;
    pattern?: string;
  };
  conditionalLogic?: {
    showIf: { field: string; operator: string; value: string };
  };
}

export interface FormStep {
  title: string;
  fields: string[];
}

export interface FormAutoWinnerConfig {
  enabled: boolean;
  minDays: number;
  minViews: number;
  appliedAt?: string | null;
  winnerVariantId?: string | null;
}

export interface FormSettings {
  multiStep: boolean;
  steps?: FormStep[];
  showProgressBar: boolean;
  allowDuplicates: boolean;
  requireEmailVerification: boolean;
  conversational?: boolean;
  progressiveProfiling?: boolean;
  abAutoWinner?: FormAutoWinnerConfig;
}

export interface FormTheme {
  primaryColor: string;
  backgroundColor: string;
  textColor: string;
  fontFamily: string;
  borderRadius: number;
  logoUrl?: string;
}

/** Registro de formulário no formato consumido pela aplicação (camelCase). */
export interface MarketingFormRecord {
  id: string;
  tenantId: string;
  name: string;
  slug: string | null;
  description: string | null;
  fields: FormField[];
  settings: FormSettings;
  theme: FormTheme;
  allowedDomains: string[];
  isActive: boolean;
  /** Funil/etapa de destino do lead no CRM (null => padrão do tenant). */
  targetFunnelId: string | null;
  targetStageId: string | null;
  emailTemplateId: string | null;
  submitRedirectUrl: string | null;
  submitMessage: string;
  totalViews: number;
  totalSubmissions: number;
  createdAt: string;
  updatedAt: string;
}

export const FIELD_TYPE_LABELS: Record<FormFieldType, string> = {
  text: "Texto",
  email: "E-mail",
  phone: "Telefone",
  select: "Lista suspensa",
  checkbox: "Caixas de seleção",
  radio: "Múltipla escolha",
  date: "Data",
  textarea: "Texto longo",
  hidden: "Campo oculto",
};

export const DEFAULT_FORM_SETTINGS: FormSettings = {
  multiStep: false,
  showProgressBar: true,
  allowDuplicates: true,
  requireEmailVerification: false,
  conversational: false,
  progressiveProfiling: false,
};

export const DEFAULT_FORM_THEME: FormTheme = {
  primaryColor: "#6d28d9",
  backgroundColor: "#ffffff",
  textColor: "#0f172a",
  fontFamily: "Inter, system-ui, sans-serif",
  borderRadius: 8,
};

const FIELDS_WITH_OPTIONS: ReadonlySet<FormFieldType> = new Set(["select", "radio", "checkbox"]);

export function fieldNeedsOptions(type: FormFieldType): boolean {
  return FIELDS_WITH_OPTIONS.has(type);
}

/** Slug curto único o suficiente para nomear campos novos. */
function shortId(): string {
  return Math.random().toString(36).slice(2, 8);
}

/** Identificador (name) sugerido a partir de um rótulo. */
export function slugifyFieldName(label: string): string {
  const base = label
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .replace(/^([0-9])/, "campo_$1");
  return base || `campo_${shortId()}`;
}

export function slugifyFormName(name: string): string {
  const base = name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return base ? `${base}-${shortId()}` : `form-${shortId()}`;
}

/** Cria um campo novo com defaults sãos para o tipo informado. */
export function createDefaultField(type: FormFieldType): FormField {
  const id = `field_${shortId()}`;
  const label = FIELD_TYPE_LABELS[type];
  const field: FormField = {
    id,
    type,
    name: `${type}_${shortId()}`,
    label,
    required: false,
  };
  if (fieldNeedsOptions(type)) {
    field.options = [
      { label: "Opção 1", value: "opcao_1" },
      { label: "Opção 2", value: "opcao_2" },
    ];
  }
  return field;
}
