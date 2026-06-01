# Marketing → Formulários — Guia de deploy

Migração do app **TrackingForm** (`/formularios`, Next.js standalone) para dentro do WChat,
em **Marketing → Converter → Formulários**. Construir formulário → embedar em site externo →
submissão vira **contato + negociação** no CRM, com scoring, enriquecimento, A/B, e-mail, Ads e LGPD.

## 1. Migrations (aplicar com `npm run db:push`)

| Arquivo | Conteúdo |
|---|---|
| `20260621120000_marketing_forms_foundation.sql` | `marketing_forms`, sidecar `crm_negotiation_marketing`, RPC `submit_marketing_form`, bucket `marketing-forms`, RLS |
| `20260621130000_marketing_capture_intelligence.sql` | colunas de enriquecimento, `marketing_form_variants`, RPCs de contador |
| `20260621140000_marketing_email_platform.sql` | templates, fila de dispatch, suppressions, provider events, `tenant_email_settings` |
| `20260621150000_marketing_ads_analytics_lgpd.sql` | consentimentos LGPD, configs/eventos/fila de Ads, trigger de conversão, `apply_marketing_ab_auto_winners` |

A permissão usada é `marketing` — `admin` e `operacao` têm acesso por padrão; `financeiro`/`atendimento` não.

## 2. Edge functions (deploy)

```bash
supabase functions deploy forms-public marketing-email-dispatch
```

- **forms-public** (público, `verify_jwt=false`): `GET ?formId=` devolve config (variante A/B); `POST` registra submissão (scoring + dedup + e-mail + enriquecimento + consentimento).
- **marketing-email-dispatch**: processa a fila de e-mails. Cron via header `x-cron-secret`; admin via JWT processa só o próprio tenant.

## 3. Secrets (Supabase → Functions)

| Secret | Uso | Obrigatório |
|---|---|---|
| `RESEND_API_KEY` | envio de e-mail | sim (para e-mail) |
| `MARKETING_EMAIL_FROM` | remetente fallback `Nome <email@dominio>` | se não usar `tenant_email_settings` |
| `IPINFO_TOKEN` | enriquecimento de IP | opcional (degrada sem) |
| `CRON_SECRET` | autoriza o cron do dispatch | sim (para cron) |

`SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` já são providos pela plataforma.

## 4. Cron (recomendado)

- Dispatch de e-mail (a cada 1–5 min): chamar `POST <functions-url>/marketing-email-dispatch` com header `x-cron-secret: <CRON_SECRET>`.
- Auto-winner A/B (diário): `select public.apply_marketing_ab_auto_winners();` (via pg_cron) ou expor por função.

## 5. Widget público (embed)

`npm run build` gera:
- `dist/` — app principal
- `dist/embed/` — widget leve (~48KB gzip), servir em `<origin>/embed/`
- `public/embed.js` → `<origin>/embed.js`

O build do widget precisa de `VITE_SUPABASE_URL` (mesmo `.env` do app). Snippet para o cliente (botão **Embed** no construtor):

```html
<div id="wchat-form-FORM_ID"></div>
<script src="https://SEU-APP/embed.js" data-form="FORM_ID"></script>
```

Modos: `inline` (padrão), `popup`, `slide-right`, `slide-left`, `top-bar`, `exit-intent` (atributo `data-mode`).

## 6. Diferido / stubs (paridade pendente)

- **E-mail:** campanhas em massa, recovery de abandono, ingestão de webhooks Resend (open/click/bounce), UI de suppressions, editor TipTap rico.
- **Ads:** push HTTP real às APIs Google/Meta (eventos são enfileirados em `marketing_ad_conversion_dispatches`; falta o worker que envia).
- **Analytics:** friction-by-field (precisa de tracking de abandono/drafts).
- **Widget:** render multi-step / conversacional (toggles salvam; render é linear).

## 7. App standalone `/formularios`

Continua na pasta, **não versionado**. Antes de remover, faça backup ou commit — não há histórico git.

---

# Worker das Automações de Marketing (Fase 0)

Liga o motor de execução dos fluxos. Sem isso os leads entram nos fluxos (gatilhos
criam jobs `queued`), mas nada é processado e o card "Worker" fica Inativo.

## 1. Banco

```bash
npm run db:push
```

Aplica `20260628190000_marketing_flow_worker_ops.sql`: tabela de heartbeat
(`marketing_flow_worker_heartbeats`), RPC `get_marketing_flow_worker_last_seen()`
e — se os GUCs abaixo estiverem setados — o agendamento `marketing-flow-worker-tick`.

## 2. Edge function

```bash
npx supabase functions deploy marketing-flow-worker
```

Reusa o secret `CRON_SECRET` já existente (mesma convenção do dispatch de e-mail).

## 3. GUCs + cron (rodar UMA vez no SQL Editor)

A migration **não** versiona o secret. Configure os GUCs e reaplique:

```sql
create extension if not exists pg_net;
create extension if not exists pg_cron;

alter database postgres
  set app.settings.functions_base_url = 'https://oaqeabqfgbeprrgqdmsk.supabase.co/functions/v1';
alter database postgres
  set app.settings.cron_secret = '<MESMO valor do CRON_SECRET das functions>';
```

Depois `npm run db:push` de novo (migration idempotente: lê os GUCs e agenda o tick
de 1/min). Sem os GUCs, a tabela de heartbeat é criada mas o tick é pulado.

## 4. Verificar

- Card **"Worker: Ativo"** (verde) em até ~1 min, mesmo com a fila vazia.
- Ativar um fluxo, disparar o gatilho → job sai de `queued` e "Última atividade" se move.
