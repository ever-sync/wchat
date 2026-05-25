# Tier 3 — Guia de deploy

Cinco frentes para o WChat competir com os grandes CRMs do Brasil: **Auditoria**,
**Webhooks de saída + diretório de integrações**, **Forecast / funil ponderado**,
**Times planos (gerente vê o time)** e **2FA (TOTP) + login com Google**.

Tudo já está no código e validado (typecheck, lint, 222 testes). Faltam só as ações de
infra abaixo. Ordem sugerida: **1 → 2 → 3 → 4 → 5**.

> Project ref: `oaqeabqfgbeprrgqdmsk`. `CRON_SECRET` já está setado (o mesmo usado por
> `ai-orchestrator` / `marketing-email-dispatch`) — reutilize-o, não precisa criar outro.

---

## 1. Migrations (`npm run db:push`)

```bash
npm run db:push
```

| Arquivo | Frente | Conteúdo |
|---|---|---|
| `20260622120000_audit_logs.sql` | Auditoria | `audit_logs` (imutável, RLS select = admin), `audit_diff`, trigger genérico `tg_audit_row`, RPC `record_audit_event`, `purge_old_audit_logs`. Triggers em `crm_negotiations`, `customers`, `products`, `profiles`, `tenant_settings`. |
| `20260622130000_outbound_webhooks.sql` | Webhooks | `webhooks` + `webhook_deliveries` (fila com retry/backoff), `enqueue_webhook_event`, triggers em `crm_negotiations`/`customers`/`whatsapp_messages`, `purge_old_webhook_deliveries`. |
| `20260622140000_teams.sql` | Times | `teams` + `profiles.team_id`, helper `manages_user`, **policies SELECT aditivas** (gerente vê chats/mensagens/tags/negociações do time, read-only). |

> Frentes **3 (Forecast)** e **5 (2FA/Google)** não têm migration — são front-end + Auth nativo do Supabase.

**Conferir após o push:**
```bash
npm run db:migration:list
```

---

## 2. Edge function — dispatcher de webhooks

```bash
supabase functions deploy webhook-dispatcher
```

- **webhook-dispatcher** (`verify_jwt=false`):
  - **Cron** (header `x-cron-secret`): drena a fila de **todos** os tenants.
  - **App** (JWT admin, perm `configuracoes/edit`): `POST { webhook_id }` → envia um **ping de teste** síncrono; `POST {}` → drena só o tenant do usuário.
  - Cada entrega vai assinada em `X-WChat-Signature: sha256=<hmac>` (segredo do webhook) + `X-WChat-Event` / `X-WChat-Delivery`.

`SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` já são providos pela plataforma. Nenhum secret novo é necessário (reusa `CRON_SECRET`).

### Cron de drain (pg_cron, rodar 1x no SQL editor)

```sql
select cron.schedule(
  'webhook-dispatcher-drain',
  '30 seconds',
  $$
  select net.http_post(
    url     := 'https://oaqeabqfgbeprrgqdmsk.supabase.co/functions/v1/webhook-dispatcher',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-cron-secret', '<CRON_SECRET>'),
    body    := '{}'::jsonb
  );
  $$
);
```

> Troque `<CRON_SECRET>` pelo valor real. **Atenção ao gotcha conhecido:** se o valor colado vier
> com `\n`, o header racha — limpe com `regexp_replace('<valor>', '\s', '', 'g')` (mesmo problema
> resolvido no cron do `ai-orchestrator`).

Conferir / remover depois, se precisar:
```sql
select jobid, jobname, schedule, active from cron.job where jobname = 'webhook-dispatcher-drain';
-- select cron.unschedule('webhook-dispatcher-drain');
```

### (Opcional) limpeza de entregas antigas

```sql
select cron.schedule(
  'webhook-deliveries-retention',
  '23 3 * * *',
  'select public.purge_old_webhook_deliveries(30);'
);
```

---

## 3. Google OAuth (Supabase Dashboard)

Só para a Frente 5 — **não há comando de CLI**, é configuração no painel.

1. Google Cloud Console → criar credenciais **OAuth 2.0 (Web application)**.
   - **Authorized redirect URI:** `https://oaqeabqfgbeprrgqdmsk.supabase.co/auth/v1/callback`
2. Supabase Dashboard → **Authentication → Providers → Google** → ativar, colar **Client ID** e **Client Secret** → salvar.
3. Supabase Dashboard → **Authentication → URL Configuration** → garantir que a URL do app
   (produção e local) está em **Redirect URLs** (o botão redireciona para `<origin>/inbox`).

> **2FA (TOTP)** não precisa de configuração: o MFA já vem habilitado no Supabase Auth. Se o projeto
> tiver MFA desativado, ative em **Authentication → Multi-Factor**.

---

## 4. Front-end

```bash
git push   # Railway rebuilda do GitHub (ever-sync/wchat)
```

Sem variáveis novas. As telas novas aparecem em:
- **Configurações → Auditoria** (só admin)
- **Configurações → Integrações → Webhooks & API**
- **Configurações → Colaboradores → Times**
- **Configurações → Perfil → Verificação em duas etapas (2FA)**
- **Relatórios → Previsão**
- **Login** → botão "Entrar com Google" + passo de código 2FA

---

## 5. Smoke tests (validar em produção)

| Frente | Como testar |
|---|---|
| **Auditoria** | Edite uma negociação/cliente; em *Configurações → Auditoria* (logado como admin) deve surgir o evento com o antes/depois. Faça login → evento `Login`. |
| **Webhooks** | Crie um webhook apontando para `https://webhook.site/...`, clique **Testar** → deve chegar um `ping` assinado. Depois ganhe/mova uma negociação e veja a entrega na lista. |
| **Forecast** | Em *Configurações → Funis CRM* defina probabilidades nas etapas; em *Relatórios → Previsão* confira o pipeline ponderado. (Sem configurar, ele estima pela posição da etapa.) |
| **Times** | Crie um time, defina um gerente (com papel *atendimento*) e adicione membros. Logado como esse gerente, ele deve passar a ver as conversas/negociações dos membros. |
| **2FA** | Em *Perfil → 2FA* ative com um autenticador; saia e entre de novo → deve pedir o código de 6 dígitos. |
| **Google** | Botão "Entrar com Google" na tela de login → fluxo OAuth → cai em `/inbox`. |

---

## 6. Notas de escopo / segurança

- **Auditoria** é **somente leitura e só admin** (RLS `current_user_role() = 'admin'`); a escrita é exclusiva de triggers/RPC `SECURITY DEFINER` e do `service_role` — usuários não inserem nem editam a trilha.
- **Times — gerente é read-only:** as policies adicionadas são **SELECT aditivas** (OR com as existentes). O gerente *vê* os dados do time, mas **edição/exclusão** seguem as regras antigas (`can_access_crm_negotiation` / `can_atendimento_act_on_chat`) inalteradas. As policies endurecidas não foram tocadas.
- **Webhooks — `message.received/sent`** são emitidos por trigger no `whatsapp_messages` que curto-circuita barato (só enfileira se houver webhook inscrito). Não exigiu mexer no `domain.ts` nem redeploy do `uazapi-webhook`.
- **Eventos disponíveis:** `contact.created`, `deal.created`, `deal.stage_changed`, `deal.won`, `deal.lost`, `message.received`, `message.sent`.

---

## 7. Diferido (follow-ups possíveis)

- **Auditoria:** agendar `purge_old_audit_logs` (retenção; hoje a função existe mas não está no cron); auditar `whatsapp_instances` (ficou de fora por causa do churn de status de conexão).
- **Webhooks:** UI de "reenviar entrega" manual; mais eventos (ex.: `task.created`).
- **Forecast:** construtor de dashboards arrastáveis (a Previsão entrega o relatório; o builder genérico é um projeto à parte).
- **Times:** hierarquia aninhada (gerente regional) e permitir gerente *editar* o time, se desejado.
- **2FA/SSO:** SSO SAML corporativo (recurso enterprise do Supabase) — o seam de OAuth já existe.
