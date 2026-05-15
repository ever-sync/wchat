/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  /** Opcional — ativa o SDK do Sentry no browser quando definido */
  readonly VITE_SENTRY_DSN?: string;
  /** Google reCAPTCHA v2 (checkbox). Em dev, usa chaves de teste se omitido. */
  readonly VITE_RECAPTCHA_SITE_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
