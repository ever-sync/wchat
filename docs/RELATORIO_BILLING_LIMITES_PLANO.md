# Relatorio - Limites Por Plano

Data: 2026-06-04

## O que foi entregue

Foi criada a primeira camada de hard limits por plano.

Limites aplicados agora:

- `whatsapp_instances`: quantidade de canais WhatsApp ativos.
- `users`: usuarios ativos + convites pendentes.

## Banco

Migration criada e aplicada na VPS:

- `supabase/migrations/20260628360000_billing_plan_limits.sql`

Funcoes criadas:

- `get_tenant_plan_limit(p_tenant_id, p_metric)`
- `get_tenant_current_usage(p_tenant_id, p_metric)`
- `assert_tenant_plan_limit(p_tenant_id, p_metric, p_increment)`

`assert_tenant_plan_limit` bloqueia a acao quando o uso solicitado passa do limite do plano.

## Enforcement

Edge Functions atualizadas e publicadas na VPS:

- `uazapi-instance-create`
  - bloqueia criacao de novo canal quando `whatsapp_instances` passa do limite.

- `invite-collaborator`
  - bloqueia criacao de novo usuario/convite quando `users` passa do limite.
  - reenviar convite existente nao consome novo assento.

## Validacao na VPS

Audit RLS:

```text
severity | code | table_name | detail
(0 rows)

SaaS readiness audit passed: no blocking RLS findings.
```

Uso atual encontrado:

```text
04dd40ea-e056-47f4-b57e-66115b419ace plan=starter users=1/3 whatsapp=1/1
9016bf66-aba3-4afb-9ae2-ecb645409258 plan=starter users=1/3 whatsapp=2/1
cdee9d21-3703-4754-a85e-aba7e321b09d plan=starter users=4/3 whatsapp=3/1
```

Observacao: tenants que ja estavam acima do limite nao foram reduzidos automaticamente. O bloqueio impede novos excessos sem derrubar a operacao existente.

## Proximos limites recomendados

- `customers`: entregue em `docs/RELATORIO_BILLING_LIMITES_AVANCADOS.md`.
- `ai_monthly_tokens`: entregue em `docs/RELATORIO_BILLING_LIMITES_AVANCADOS.md`.
- `marketing_flow_runs_monthly`: entregue em `docs/RELATORIO_BILLING_LIMITES_AVANCADOS.md`.
- `storage_gb`: entregue em `docs/RELATORIO_BILLING_LIMITES_AVANCADOS.md`.
