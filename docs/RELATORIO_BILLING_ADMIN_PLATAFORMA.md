# Billing admin da plataforma

Implementado um painel interno para administradores da plataforma controlarem planos de tenants.

## Entregue

- Nova Edge Function `billing-admin`, protegida por JWT e por `platform_admins`.
- Listagem de tenants com plano atual, status, ciclo de cobrança e uso real dos limites.
- Destaque automático para tenants acima do limite contratado.
- Troca manual de plano, status e ciclo mensal/anual.
- Atualização de `billing_subscriptions`, sincronização do campo legado `profiles.plano` e refresh dos contadores.
- Tela `/admin/billing` no app.

## Observação

O painel é uma ferramenta operacional de suporte. O fluxo financeiro principal continua sendo o Asaas.
