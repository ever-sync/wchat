# Relatorio SaaS - Fase 0/1

Data da execucao: 2026-06-04  
Ambiente auditado: Supabase self-hosted na VPS `147.93.66.27`  
Escopo: fundacao SaaS, RLS, isolamento por tenant e superficie inicial de Edge Functions.

## Resultado Executivo

O primeiro gate de producao passou:

- Todas as tabelas publicas do banco estao com RLS ligado.
- Nenhuma tabela com `tenant_id` ficou sem policy fora da allowlist interna.
- O teste automatizado `supabase/tests/saas_readiness_audit.sql` passou contra o banco da VPS.
- A importacao historica por `uazapi-poll-sync` foi desativada.
- `crm-lead-ingest` deixou de aceitar service role como credencial externa.

Resultado do teste:

```text
SaaS readiness audit passed: no blocking RLS findings.
```

## O Que Foi Entregue

### 1. Plano mestre SaaS

Arquivo:

- `docs/PLANO_SAAS_PRODUCAO_WCHAT.md`

Conteudo:

- fases de producao
- billing
- onboarding
- observabilidade
- backups
- seguranca
- suporte
- deploy
- escala
- API publica
- checklist de pronto para SaaS pago

### 2. Auditoria real do banco

Foi consultado o banco real da VPS para levantar:

- tabelas publicas
- status de RLS
- presenca de `tenant_id`
- quantidade de policies por tabela
- funcoes `SECURITY DEFINER`

Resumo:

- RLS ligado em todas as tabelas publicas.
- Existem tabelas sem policy, mas elas estao tratadas como internas/deny-by-default.
- Join tables sem `tenant_id` usam RLS baseada em tabelas pai.

### 3. Teste SQL de prontidao SaaS

Arquivo:

- `supabase/tests/saas_readiness_audit.sql`

Esse teste falha se aparecer:

- tabela publica sem RLS
- tabela com `tenant_id` sem policy fora da allowlist interna

### 4. Endurecimento inicial de Edge Functions

Arquivos:

- `supabase/functions/uazapi-poll-sync/index.ts`
- `supabase/functions/crm-lead-ingest/index.ts`
- `docs/RELATORIO_EDGE_FUNCTIONS_SEGURANCA.md`

Mudancas:

- `uazapi-poll-sync` agora retorna `410 disabled` e nao busca historico antigo.
- `crm-lead-ingest` nao aceita mais `SUPABASE_SERVICE_ROLE_KEY` como Bearer externo.
- As mudancas foram copiadas para a VPS e `supabase_supabase_functions` voltou `1/1`.

Comando para rodar:

```bash
psql "$SUPABASE_DB_URL" -f supabase/tests/saas_readiness_audit.sql
```

## Allowlist Interna Sem Policy

Estas tabelas estao com RLS ligado e sem policies. Isso significa que usuarios normais nao acessam diretamente; o acesso deve acontecer por service role, worker ou funcoes controladas.

- `ai_alerts`
- `failed_jobs`
- `tenant_api_keys`
- `webhook_delivery_dedupe`
- `worker_job_locks`
- `platform_admins`

Decisao atual: manter sem policies para negar acesso direto ao cliente.

## Tabelas Sem `tenant_id` Que Precisam Revisao Contínua

Algumas tabelas nao possuem `tenant_id` porque sao join tables ou tabelas de plataforma. Elas devem continuar protegidas por join-based RLS.

- `customer_custom_field_values`
- `instance_send_slots`
- `marketing_flow_worker_heartbeats`
- `product_category_assignments`
- `product_custom_field_values`
- `whatsapp_chat_tags`
- `tenants`

Acao recomendada:

- manter essas tabelas no radar do teste de RLS
- revisar policies quando mudar relacionamento ou permissao

## Edge Functions: Observacao Inicial

Varias functions estao com `verify_jwt = false`, mas muitas validam manualmente:

- JWT do usuario via `requireTenantContext` / `requireTenantPermission`
- chamada interna via `x-cron-secret`
- token de webhook com `timingSafeEqual`
- API key propria do WChat

Isso e aceitavel quando intencional, mas precisa de inventario formal por function.

Funcoes publicas/intencionais:

- `uazapi-webhook`
- `forms-public`
- `twilio-voice-webhook`
- `twilio-voice-twiml`
- `marketing-webhook-ingest`
- `wchat-api`
- workers por `x-cron-secret`

Proxima acao:

- criar matriz function -> modo de autenticacao -> dados acessados -> risco -> teste.

## Riscos Ainda Abertos

### 1. Secrets expostos anteriormente

Ja houve compartilhamento de chaves em conversa. Para SaaS pago, isso precisa rotacao.

Prioridade:

- `OPENAI_API_KEY`
- `VOYAGE_API_KEY`
- `RESEND_API_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `UAZAPI_ADMIN_TOKEN`
- `CRON_SECRET`
- chaves anon/service antigas do Supabase self-hosted

### 2. Service role em Edge Functions

Algumas functions usam service role por necessidade. Precisamos garantir que cada uma valide tenant/permissao antes de tocar dados.

### 3. Billing parcialmente implementado

A fundacao de planos, assinatura, precos e contadores foi criada e aplicada na VPS.

Detalhes: `docs/RELATORIO_BILLING_FUNDACAO.md`.

Ainda falta gateway real de pagamento, webhooks de cobranca e bloqueios por limite.

### 4. Backup/restore ainda nao comprovado neste relatorio

Pode existir backup operacional, mas falta documentar e testar restore como processo SaaS.

### 5. Observabilidade incompleta

Logs existem, mas ainda falta uma matriz clara de alertas:

- webhook sem eventos
- canal desconectado
- fila acumulada
- Edge Function com erro alto
- banco lento
- custo de IA por tenant

## Proxima Execucao Recomendada

### Fase 1A - Matriz de Edge Functions

Entregavel:

- `docs/RELATORIO_EDGE_FUNCTIONS_SEGURANCA.md`
- tabela com:
  - function
  - `verify_jwt`
  - auth real
  - usa service role?
  - escopo de tenant
  - risco
  - correcao necessaria

### Fase 1B - Rotacao de secrets

Entregavel:

- runbook de rotacao
- lista do que foi rotacionado
- deploy/restart validado

### Fase 1C - Fundacao de billing

Entregavel:

- migrations para planos, assinaturas, limites e uso
- helpers de entitlement
- tela inicial de plano atual

Status: concluida a fundacao inicial em `docs/RELATORIO_BILLING_FUNDACAO.md`.

## Status

- Fase 0: iniciada e com auditoria de RLS executada.
- Fase 1: isolamento por tenant passou no primeiro gate.
- Fase 1C: fundacao de billing aplicada na VPS.
- Proximo bloqueio real para SaaS pago: gateway de pagamento + rotacao de secrets + hard limits por tenant.
