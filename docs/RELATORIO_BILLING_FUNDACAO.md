# Relatorio - Billing SaaS Fundacao

Data: 2026-06-04

## O que foi entregue

Foi criada a primeira fundacao de billing para o WChat operar como SaaS:

- Catalogo de planos no banco.
- Precos por ciclo mensal/anual.
- Assinatura por tenant.
- Contadores de uso por tenant e ciclo.
- Eventos de uso para auditoria futura.
- RPC de snapshot de billing para o front-end.
- Aba `Plano` em Configuracoes.

## Tabelas criadas

- `billing_plans`
- `billing_plan_prices`
- `billing_subscriptions`
- `billing_usage_counters`
- `billing_usage_events`

## Planos seedados

- `starter`
- `profissional`
- `enterprise`

Os valores seguem o catalogo atual do cadastro:

- Starter: R$ 497 mensal / R$ 397 anual
- Profissional: R$ 997 mensal / R$ 797 anual
- Enterprise: R$ 1.997 mensal / R$ 1.597 anual

## RLS

Todas as tabelas novas foram criadas com RLS ativo.

Regras:

- `billing_plans` e `billing_plan_prices`: leitura para usuarios autenticados.
- `billing_subscriptions`: leitura apenas do mesmo tenant.
- `billing_usage_counters`: leitura apenas do mesmo tenant.
- `billing_usage_events`: leitura apenas do mesmo tenant.
- Escrita fica reservada para backend/service role, sem policy publica de insert/update/delete.

## Aplicado na VPS

Migration aplicada no Supabase self-hosted da VPS.

Resultado validado:

```text
plans=3
prices=6
subscriptions=3
usage_counters=18
usage_events=0
```

Audit RLS:

```text
severity | code | table_name | detail
(0 rows)

SaaS readiness audit passed: no blocking RLS findings.
```

Observacao: `billing_plans` e `billing_plan_prices` foram registradas no audit como tabelas globais revisadas, porque sao catalogo de plataforma e nao dados de tenant.

## Front-end

Arquivos adicionados/alterados:

- `src/lib/api/billing.ts`
- `src/components/settings/BillingSettingsCard.tsx`
- `src/pages/Configuracoes.tsx`

A nova aba `Plano` exibe:

- Plano atual.
- Status da assinatura.
- Ciclo mensal/anual.
- Inicio e fim do ciclo.
- Renovacao/cancelamento.
- Recursos inclusos.
- Limites de uso do ciclo atual.

## Limites por plano

Primeira camada de hard limits entregue em `docs/RELATORIO_BILLING_LIMITES_PLANO.md`.

## Validacao local

Comando executado:

```bash
npm run typecheck
```

Resultado: passou sem erros.

## Proximo passo recomendado

Gateway Asaas iniciado.

Detalhes: `docs/RELATORIO_ASAAS_GATEWAY.md`.

Proximo passo:

- Configurar `ASAAS_API_KEY` e `ASAAS_WEBHOOK_TOKEN`.
- Configurar webhook no painel Asaas apontando para `/functions/v1/asaas-webhook`.
- Fazer teste real em sandbox/producao.
- Implementar troca/cancelamento de plano.
