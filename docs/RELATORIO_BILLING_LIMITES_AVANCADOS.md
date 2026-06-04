# Relatorio - Limites Avancados Por Plano

Data: 2026-06-04

## O que foi entregue

Foram aplicados limites por plano para:

- `customers`
- `ai_monthly_tokens`
- `marketing_flow_runs_monthly`
- `storage_gb`

Esses limites complementam os ja entregues:

- `users`
- `whatsapp_instances`

## Banco

Migrations criadas e aplicadas na VPS:

- `supabase/migrations/20260628370000_billing_usage_hard_limits.sql`
- `supabase/migrations/20260628380000_billing_snapshot_live_usage.sql`

Alteracoes principais:

- `get_tenant_current_usage` agora calcula uso real para:
  - clientes
  - usuarios
  - canais WhatsApp
  - tokens de IA no mes
  - execucoes de automacao no mes
  - storage em GB
- `refresh_current_billing_usage` atualiza os contadores do ciclo atual.
- `get_tenant_billing_snapshot` passou a retornar uso ao vivo.
- Trigger `customers_billing_plan_limit` bloqueia novos clientes acima do limite.
- Trigger `storage_objects_billing_plan_limit` bloqueia uploads acima do limite.

## Edge Functions / Workers

Atualizados e publicados na VPS:

- `marketing-flow-worker`
  - chama `assert_tenant_plan_limit` antes de executar um job.
  - ao atingir limite mensal de automacoes, o job falha com mensagem clara.

- `ai-orchestrator`
  - inclui `ai_monthly_tokens` do plano no calculo do limite efetivo.
  - se o tenant passar do limite, a IA nao executa novos turnos.

- `_shared/domain.ts`
  - midias recebidas pelo WhatsApp respeitam o limite de storage.
  - o trigger do Storage tambem protege uploads por outros caminhos.

## Validacao na VPS

Uso real atual:

```text
04dd40ea-e056-47f4-b57e-66115b419ace plan=starter customers=100/500 ai=0/200000 flows=0/3000 storage_gb=1/5
9016bf66-aba3-4afb-9ae2-ecb645409258 plan=starter customers=126/500 ai=0/200000 flows=0/3000 storage_gb=1/5
cdee9d21-3703-4754-a85e-aba7e321b09d plan=starter customers=1497/500 ai=286846/200000 flows=0/3000 storage_gb=1/5
```

Observacao: o tenant `cdee9d21-3703-4754-a85e-aba7e321b09d` ja esta acima dos limites Starter de clientes e tokens de IA. O sistema nao remove dados existentes, mas bloqueia novos excessos.

## Validacao local

Comandos executados:

```bash
npm run typecheck
npm run build
```

Resultado: passaram sem erros. O build manteve apenas o aviso ja existente de chunks grandes.

## Proximas melhorias

- Tela de upgrade/regularizacao quando limite for atingido. Entregue em `docs/RELATORIO_BILLING_UI_UPGRADE.md`.
- Alertas de 80% e 100% para clientes, IA, automacoes e storage.
- Botao interno para mover tenant de plano manualmente.
- Webhook/checkout Asaas atualizando plano automaticamente apos pagamento.
