# Bloqueio operacional por status de assinatura

Implementada a primeira camada de controle para tenants inadimplentes ou suspensos.

## Status bloqueados

- `past_due`
- `paused`
- `canceled`
- `incomplete`

## Ações bloqueadas

- Enviar mensagens pelo WhatsApp.
- Criar novos canais Uazapi.
- Conectar canais existentes.
- Sincronizar canais manualmente.
- Convidar usuários.
- Enviar respostas automáticas via n8n.
- Executar jobs de automação de marketing.
- Rodar IA no chat.

## Comportamento

- Tenants sem assinatura ainda continuam funcionando para permitir migração comercial gradual.
- Leitura, recebimento de mensagens e dados existentes não foram bloqueados nesta etapa.
- A mensagem de erro orienta regularizar o plano.

## Arquivos

- `_shared/supabase.ts`: helper `assertTenantBillingActive`.
- `uazapi-send-message`
- `uazapi-instance-create`
- `uazapi-instance-connect`
- `uazapi-instance-sync`
- `invite-collaborator`
- `n8n-reply`
- `marketing-flow-worker`
- `ai-orchestrator`
