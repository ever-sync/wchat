# Relatorio - Alertas de Uso do Plano

Data: 2026-06-04

## O que foi entregue

Foi criada a rotina de alertas automáticos de uso do plano:

- alerta em 80%;
- alerta em 100%;
- dedupe mensal por tenant, métrica e nível;
- envio por e-mail para admins do tenant;
- execução automática a cada 6 horas.

## Métricas monitoradas

- `customers`
- `whatsapp_instances`
- `users`
- `ai_monthly_tokens`
- `marketing_flow_runs_monthly`
- `storage_gb`

## Banco

Migration criada e aplicada na VPS:

- `supabase/migrations/20260628390000_billing_usage_alerts.sql`

Tabela criada:

- `billing_usage_alerts`

RLS:

- usuários autenticados do mesmo tenant podem ler os alertas;
- escrita é feita pelo worker com service role.

## Edge Function

Function criada e publicada na VPS:

- `billing-usage-alerts`

Config adicionada:

- `supabase/config.toml`

## Agendamento

O `pg_cron` não está instalado/ativo nesta VPS, então o agendamento por SQL foi pulado.

Foi criado cron no Ubuntu:

```text
0 */6 * * * root curl -fsS -X POST https://supabasewchat.eversync.space/functions/v1/billing-usage-alerts ...
```

Log:

```text
/var/log/wchat-billing-usage-alerts.log
```

Serviço validado:

```text
systemctl is-active cron
active
```

## Teste real

Primeira execução:

```json
{"ok":true,"checked":18,"inserted":6,"sent":10}
```

Segunda execução para validar dedupe:

```json
{"ok":true,"checked":18,"inserted":0,"sent":0}
```

## Validação

Audit RLS:

```text
severity | code | table_name | detail
(0 rows)

SaaS readiness audit passed: no blocking RLS findings.
```

Typecheck:

```bash
npm run typecheck
```

Resultado: passou sem erros.

## Próximas melhorias

- Exibir histórico de alertas na aba `Plano`.
- Criar painel interno para trocar plano manualmente.
- Criar rotina de alerta via WhatsApp para admins do tenant.
- Criar alerta interno para suporte quando tenant pagante bater 100%.
