# Relatorio de Seguranca das Edge Functions

Data da execucao: 2026-06-04  
Ambiente: Supabase self-hosted na VPS `147.93.66.27`

## Resultado Executivo

Foi iniciada a matriz de seguranca das Edge Functions, com foco nos endpoints publicos e nas functions que usam service role.

Correcoes aplicadas nesta rodada:

- `uazapi-poll-sync` foi desativada para impedir busca/importacao de historico antigo.
- `crm-lead-ingest` deixou de aceitar `SUPABASE_SERVICE_ROLE_KEY` como credencial externa.
- `uazapi-poll-sync` foi subida na VPS e testada em producao, retornando `410 disabled`.

## Correcoes Feitas

### `uazapi-poll-sync`

Antes:

- podia buscar chats/mensagens antigas na Uazapi
- podia criar conversas a partir de `findChats`
- podia processar mensagens antigas via `findMessages`

Depois:

- endpoint responde `410`
- nenhuma busca na Uazapi e feita
- inbox fica somente por webhook em tempo real

Resposta validada:

```json
{
  "success": false,
  "disabled": true,
  "error": "uazapi-poll-sync foi desativado. O inbox recebe mensagens apenas por webhook em tempo real."
}
```

### `crm-lead-ingest`

Antes:

- aceitava `Authorization: Bearer <SUPABASE_SERVICE_ROLE_KEY>`
- tambem aceitava `tenant_integrations.n8n_secret` via Bearer ou HMAC

Depois:

- nao aceita mais a service role do Supabase como credencial de entrada
- permanece aceitando:
  - `tenant_integrations.n8n_secret` via Bearer
  - HMAC com `tenant_integrations.n8n_secret`

Motivo:

- service role e credencial administrativa do banco
- nao deve ser usada como API key externa de integracao

## Classificacao Inicial das Functions

### Autenticadas por usuario/permissao

- `uazapi-instance-create`
- `uazapi-instance-connect`
- `uazapi-instance-sync`
- `uazapi-send-message`
- `invite-collaborator`
- `twilio-call`
- `crm-summarize-negotiation`
- `crm-suggest-next-message`
- `ai-admin`
- `ai-knowledge`
- `ai-playground`
- `wchat-api-keys`

Padrao esperado:

- validar JWT no codigo com `requireTenantContext` ou `requireTenantPermission`
- filtrar por tenant
- usar service role somente apos validar usuario/tenant/permissao

### Internas por `x-cron-secret`

- `ai-alerts`
- `ai-orchestrator`
- `marketing-ad-conversion-dispatch`
- `marketing-email-dispatch`
- `marketing-flow-worker`
- `webhook-dispatcher`
- `uazapi-instance-sync`

Padrao esperado:

- aceitar somente `x-cron-secret`
- nao aceitar chamada anonima
- registrar logs estruturados

### Publicas por webhook externo

- `uazapi-webhook`
- `twilio-voice-webhook`
- `twilio-voice-twiml`
- `forms-public`
- `marketing-webhook-ingest`
- `n8n-reply`
- `crm-lead-ingest`
- `wchat-api`

Padrao esperado:

- token proprio, assinatura ou API key
- nunca usar apenas `tenant_id` enviado no body como autorizacao
- rate limit quando aplicavel
- payload maximo controlado

## Pontos Que Ainda Precisam Revisao

### `forms-public`

Risco:

- endpoint publico por natureza
- precisa continuar com protecoes contra spam, payload grande e abuso de webhook

Proxima acao:

- revisar rate limit por formulario/IP
- revisar tamanho maximo de payload

### `marketing-webhook-ingest`

Estado:

- usa API key WChat e escopo `write`

Proxima acao:

- adicionar rate limit por API key
- registrar logs de uso por tenant

### `wchat-api`

Estado:

- API publica com `wchat_...`

Proxima acao:

- revisar escopos por rota
- adicionar rate limit por API key
- criar logs de API por tenant

### `twilio-voice-webhook` e `twilio-voice-twiml`

Estado:

- validam assinatura Twilio

Proxima acao:

- confirmar URL publica final usada na assinatura em producao
- criar alerta para falhas repetidas

### `n8n-reply`

Estado:

- usa `N8N_SERVICE_KEY` global ou HMAC por tenant

Proxima acao:

- preferir HMAC por tenant em producao
- documentar rotacao do `N8N_SERVICE_KEY`

## Checklist Edge Functions Para SaaS

- [x] Desativar importacao historica por `uazapi-poll-sync`.
- [x] Remover service role como credencial externa em `crm-lead-ingest`.
- [ ] Criar rate limit por API key em `wchat-api`.
- [ ] Criar rate limit por API key em `marketing-webhook-ingest`.
- [ ] Revisar payload maximo em `forms-public`.
- [ ] Registrar logs de API por tenant.
- [ ] Criar dashboard de falhas por function.
- [ ] Rotacionar secrets expostos.

## Comandos de Validacao

Teste do endpoint desativado:

```bash
curl -i -X POST https://supabasewchat.eversync.space/functions/v1/uazapi-poll-sync \
  -H 'Content-Type: application/json' \
  --data '{}'
```

Resultado esperado:

```text
HTTP/2 410
```

