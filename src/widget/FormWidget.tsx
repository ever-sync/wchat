import { useEffect, useMemo, useRef, useState } from "react";
import {
  DEFAULT_FORM_THEME,
  type FormField,
  type FormTheme,
} from "@/lib/marketing/form-types";
import { validateFormSubmission } from "@/lib/marketing/form-validation";
import { formatPhone } from "@/lib/brasil-api";

type PublicForm = {
  id: string;
  name: string;
  fields: FormField[];
  settings: Record<string, unknown>;
  theme: Partial<FormTheme>;
  submitMessage: string;
  submitRedirectUrl: string | null;
  variantId?: string | null;
};

const FUNCTION_URL = `${String(import.meta.env.VITE_SUPABASE_URL ?? "").replace(/\/$/, "")}/functions/v1/forms-public`;

function getQueryParam(name: string): string | null {
  return new URLSearchParams(window.location.search).get(name);
}

function collectMeta(): Record<string, unknown> {
  const params = new URLSearchParams(window.location.search);
  const meta: Record<string, unknown> = {};
  for (const key of ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"]) {
    const v = params.get(key);
    if (v) meta[key] = v;
  }
  const variantId = params.get("variant_id") ?? params.get("_variant_id");
  if (variantId) meta.variant_id = variantId;
  if (document.referrer) meta.referrer = document.referrer;
  return meta;
}

function fieldInputType(type: FormField["type"]): string {
  if (type === "phone") return "tel";
  if (type === "email") return "email";
  if (type === "date") return "date";
  return "text";
}

export function FormWidget() {
  const formId = getQueryParam("formId") ?? getQueryParam("form");
  const [form, setForm] = useState<PublicForm | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [values, setValues] = useState<Record<string, unknown>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [step, setStep] = useState(0);
  const startedAt = useRef<number>(Date.now());

  const theme = useMemo<FormTheme>(() => ({ ...DEFAULT_FORM_THEME, ...(form?.theme ?? {}) }), [form]);

  useEffect(() => {
    if (!formId) {
      setLoadError("Formulário não especificado.");
      return;
    }
    let cancelled = false;
    fetch(`${FUNCTION_URL}?formId=${encodeURIComponent(formId)}`)
      .then(async (res) => {
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json?.error ?? "Formulário indisponível.");
        if (!cancelled) {
          setForm(json.form as PublicForm);
          startedAt.current = Date.now();
        }
      })
      .catch((e: Error) => {
        if (!cancelled) setLoadError(e.message);
      });
    return () => {
      cancelled = true;
    };
  }, [formId]);

  const visibleFields = useMemo(() => (form?.fields ?? []).filter((f) => f.type !== "hidden"), [form]);
  const conversational = Boolean((form?.settings as Record<string, unknown> | undefined)?.conversational);

  function setValue(name: string, value: unknown) {
    setValues((prev) => ({ ...prev, [name]: value }));
  }

  function toggleCheckbox(name: string, optionValue: string, checked: boolean) {
    setValues((prev) => {
      const current = Array.isArray(prev[name]) ? (prev[name] as string[]) : [];
      const next = checked ? [...current, optionValue] : current.filter((v) => v !== optionValue);
      return { ...prev, [name]: next };
    });
  }

  /** onChange com máscara de telefone (BR). */
  function handleInputChange(field: FormField, raw: string) {
    setValue(field.name, field.type === "phone" ? formatPhone(raw) : raw);
  }

  /** Valida um único campo (e-mail/telefone) no blur, dando feedback imediato. */
  function validateSingleField(field: FormField) {
    const errs = validateFormSubmission([field], { [field.name]: values[field.name] });
    setErrors((prev) => {
      const next = { ...prev };
      if (errs[field.name]) next[field.name] = errs[field.name];
      else delete next[field.name];
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form || submitting) return;

    // hidden fields com valor padrão entram no payload
    const payload: Record<string, unknown> = { ...values };
    for (const field of form.fields) {
      if (field.type === "hidden" && field.defaultValue) payload[field.name] = field.defaultValue;
    }

    const validationErrors = validateFormSubmission(form.fields, payload);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setErrors({});
    setSubmitting(true);

    const meta = collectMeta();
    meta.time_to_complete_seconds = Math.round((Date.now() - startedAt.current) / 1000);
    if (form.variantId) meta.variant_id = form.variantId;

    try {
      const res = await fetch(FUNCTION_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ formId: form.id, data: payload, meta }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error ?? "Não foi possível enviar.");
      if (json.redirect_url) {
        window.location.href = String(json.redirect_url);
        return;
      }
      setDone(true);
    } catch (err) {
      setErrors({ _form: err instanceof Error ? err.message : "Não foi possível enviar." });
    } finally {
      setSubmitting(false);
    }
  }

  const wrapStyle: React.CSSProperties = {
    backgroundColor: theme.backgroundColor,
    color: theme.textColor,
    borderRadius: theme.borderRadius,
    fontFamily: theme.fontFamily,
    padding: 20,
    maxWidth: 640,
    margin: "0 auto",
    boxSizing: "border-box",
  };
  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 12px",
    border: "1px solid #d1d5db",
    borderRadius: 8,
    fontSize: 14,
    boxSizing: "border-box",
    fontFamily: "inherit",
  };
  const labelStyle: React.CSSProperties = { display: "block", fontSize: 14, fontWeight: 500, marginBottom: 6 };
  const primaryBtnStyle: React.CSSProperties = {
    padding: "11px 16px",
    border: "none",
    borderRadius: theme.borderRadius,
    backgroundColor: theme.primaryColor,
    color: "#fff",
    fontSize: 15,
    fontWeight: 600,
    cursor: submitting ? "default" : "pointer",
    opacity: submitting ? 0.7 : 1,
    fontFamily: "inherit",
  };
  const secondaryBtnStyle: React.CSSProperties = {
    padding: "11px 16px",
    border: "1px solid #d1d5db",
    borderRadius: theme.borderRadius,
    background: "transparent",
    color: "inherit",
    fontSize: 15,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "inherit",
  };

  function goNext() {
    const field = visibleFields[step];
    if (!field) return;
    const errs = validateFormSubmission([field], { [field.name]: values[field.name] });
    if (errs[field.name]) {
      setErrors((p) => ({ ...p, [field.name]: errs[field.name] }));
      return;
    }
    setErrors((p) => {
      const next = { ...p };
      delete next[field.name];
      return next;
    });
    setStep((s) => Math.min(s + 1, visibleFields.length - 1));
  }

  function goBack() {
    setStep((s) => Math.max(0, s - 1));
  }

  function renderField(field: FormField) {
    const err = errors[field.name];
    return (
      <div key={field.id}>
        {field.type !== "checkbox" && field.type !== "radio" ? (
          <label style={labelStyle} htmlFor={`f_${field.id}`}>
            {field.label}
            {field.required ? <span style={{ color: "#ef4444", marginLeft: 4 }}>*</span> : null}
          </label>
        ) : (
          <p style={labelStyle}>
            {field.label}
            {field.required ? <span style={{ color: "#ef4444", marginLeft: 4 }}>*</span> : null}
          </p>
        )}

        {(field.type === "text" || field.type === "email" || field.type === "phone" || field.type === "date") && (
          <input
            id={`f_${field.id}`}
            type={fieldInputType(field.type)}
            inputMode={field.type === "phone" ? "tel" : field.type === "email" ? "email" : undefined}
            maxLength={field.type === "phone" ? 16 : undefined}
            placeholder={field.placeholder ?? ""}
            style={inputStyle}
            value={(values[field.name] as string) ?? ""}
            onChange={(e) => handleInputChange(field, e.target.value)}
            onBlur={() => {
              if (field.type === "email" || field.type === "phone") validateSingleField(field);
            }}
          />
        )}

        {field.type === "textarea" && (
          <textarea
            id={`f_${field.id}`}
            rows={3}
            placeholder={field.placeholder ?? ""}
            style={inputStyle}
            value={(values[field.name] as string) ?? ""}
            onChange={(e) => setValue(field.name, e.target.value)}
          />
        )}

        {field.type === "select" && (
          <select
            id={`f_${field.id}`}
            style={inputStyle}
            value={(values[field.name] as string) ?? ""}
            onChange={(e) => setValue(field.name, e.target.value)}
          >
            <option value="">Selecione...</option>
            {(field.options ?? []).map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        )}

        {field.type === "radio" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {(field.options ?? []).map((opt) => (
              <label key={opt.value} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14 }}>
                <input
                  type="radio"
                  name={field.name}
                  value={opt.value}
                  checked={values[field.name] === opt.value}
                  onChange={() => setValue(field.name, opt.value)}
                />
                {opt.label}
              </label>
            ))}
          </div>
        )}

        {field.type === "checkbox" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {(field.options ?? []).map((opt) => {
              const arr = Array.isArray(values[field.name]) ? (values[field.name] as string[]) : [];
              return (
                <label key={opt.value} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14 }}>
                  <input
                    type="checkbox"
                    checked={arr.includes(opt.value)}
                    onChange={(e) => toggleCheckbox(field.name, opt.value, e.target.checked)}
                  />
                  {opt.label}
                </label>
              );
            })}
          </div>
        )}

        {field.helpText ? <p style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>{field.helpText}</p> : null}
        {err ? <p style={{ fontSize: 12, color: "#ef4444", marginTop: 4 }}>{err}</p> : null}
      </div>
    );
  }

  if (loadError) {
    return (
      <div style={{ ...wrapStyle, textAlign: "center" }}>
        <p style={{ fontSize: 14 }}>{loadError}</p>
      </div>
    );
  }
  if (!form) {
    return <div style={{ ...wrapStyle, textAlign: "center", opacity: 0.6 }}>Carregando…</div>;
  }
  if (done) {
    return (
      <div style={{ ...wrapStyle, textAlign: "center" }}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>✓</div>
        <p style={{ fontSize: 15, fontWeight: 500 }}>{form.submitMessage || "Obrigado!"}</p>
      </div>
    );
  }

  return (
    <form style={wrapStyle} onSubmit={handleSubmit} noValidate>
      {/* honeypot anti-bot */}
      <input
        type="text"
        name="_hp"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        style={{ position: "absolute", left: "-9999px", width: 1, height: 1, opacity: 0 }}
        onChange={(e) => setValue("_hp", e.target.value)}
      />

      {conversational && visibleFields.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <p style={{ fontSize: 12, opacity: 0.6, margin: 0 }}>
            Pergunta {Math.min(step + 1, visibleFields.length)} de {visibleFields.length}
          </p>
          {renderField(visibleFields[Math.min(step, visibleFields.length - 1)])}
          {errors._form ? <p style={{ fontSize: 13, color: "#ef4444" }}>{errors._form}</p> : null}
          <div style={{ display: "flex", gap: 8 }}>
            {step > 0 ? (
              <button type="button" onClick={goBack} style={secondaryBtnStyle}>
                Voltar
              </button>
            ) : null}
            {step < visibleFields.length - 1 ? (
              <button type="button" onClick={goNext} style={{ ...primaryBtnStyle, flex: 1 }}>
                Avançar
              </button>
            ) : (
              <button type="submit" disabled={submitting} style={{ ...primaryBtnStyle, flex: 1 }}>
                {submitting ? "Enviando…" : "Enviar"}
              </button>
            )}
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {visibleFields.map((field) => renderField(field))}
          {errors._form ? <p style={{ fontSize: 13, color: "#ef4444" }}>{errors._form}</p> : null}
          <button type="submit" disabled={submitting} style={{ ...primaryBtnStyle, width: "100%" }}>
            {submitting ? "Enviando…" : "Enviar"}
          </button>
        </div>
      )}
    </form>
  );
}
