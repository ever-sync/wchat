# Painel admin de operacao

Criado o cockpit interno `/admin/operacao` para administradores da plataforma.

## Fontes monitoradas

- `billing_subscriptions`
- `whatsapp_instances`
- `ai_jobs`
- `marketing_flow_jobs`
- `webhook_deliveries`
- RPCs de uso/limite de plano

## Sinais exibidos

- Tenants críticos e em atenção.
- Assinaturas bloqueadas.
- Canais conectados, desconectados, em erro e sem sync recente.
- Jobs de IA pendentes, processando, travados e com erro nas últimas 24h.
- Automações vencidas, rodando, travadas, falhadas e mortas.
- Webhooks pendentes, com erro e entregues nas últimas 24h.
- Limites de plano excedidos.

## Segurança

- A Edge Function `operation-admin` exige JWT válido.
- O usuário precisa existir em `platform_admins`.

## Ações rápidas

- Atualizar contadores de uso do tenant.
- Reabrir webhooks com erro para retry.
- Destravar jobs de IA presos em `processing`.
- Destravar automações presas em `running`.

As ações não apagam dados e não disparam envio direto; elas recolocam filas em estado processável.

## Auditoria master

- Ações sensíveis de `billing-admin`, `ai-admin` e `operation-admin` passam a registrar eventos em `audit_logs`.
- Eventos usam `action = platform_admin_action`.
- Eventos são gravados no tenant afetado.
- `/admin/operacao` mostra os eventos recentes com filtro por tenant e tipo.
- A leitura da auditoria master passa pela Edge `operation-admin`, protegida por `platform_admins`.
