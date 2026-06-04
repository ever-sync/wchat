# Relatorio - Gateway Asaas

Data: 2026-06-04

## Decisao

O gateway oficial do WChat sera o Asaas.

Fontes oficiais usadas:

- Checkout Asaas: `POST https://api.asaas.com/v3/checkouts`
- Checkout recorrente: `chargeTypes: ["RECURRENT"]`
- Autenticacao API: header `access_token`
- Webhook: header `asaas-access-token`
- Eventos relevantes: `CHECKOUT_*`, `SUBSCRIPTION_*`, `PAYMENT_*`

## Banco

Migration criada e aplicada na VPS:

- `supabase/migrations/20260628350000_billing_asaas_gateway.sql`

Alteracoes:

- Remove colunas antigas `stripe_*`.
- Adiciona campos `gateway_*` em `billing_subscriptions`.
- Cria `billing_gateway_events`.
- Atualiza `get_tenant_billing_snapshot` para retornar dados do Asaas.

Validacao na VPS:

```text
gateway_checkout_id
gateway_checkout_url
gateway_customer_id
gateway_invoice_url
gateway_metadata
gateway_payment_id
gateway_provider
gateway_status
gateway_subscription_id
gateway_events=0
```

Audit RLS:

```text
severity | code | table_name | detail
(0 rows)

SaaS readiness audit passed: no blocking RLS findings.
```

## Edge Functions

Criadas:

- `asaas-create-checkout`
- `asaas-webhook`

Shared helper:

- `_shared/asaas.ts`

Configuracao adicionada:

- `supabase/config.toml`

Deploy feito na VPS:

- functions copiadas para o volume self-hosted
- `supabase_supabase_functions` reiniciado
- `supabase_supabase_rest` reiniciado para recarregar schema

## Teste realizado

Webhook recebeu evento fake e gravou corretamente:

```text
HTTP/2 200
{"ok":true}
CHECKOUT_CREATED:chk_codex_smoke
```

Evento fake removido depois do teste.

## Secrets necessarios

Configurar no ambiente das Edge Functions:

```bash
ASAAS_API_KEY="sua_chave_asaas"
ASAAS_WEBHOOK_TOKEN="token_forte_configurado_no_webhook_asaas"
ASAAS_API_BASE_URL="https://api.asaas.com/v3"
```

Para sandbox:

```bash
ASAAS_API_BASE_URL="https://api-sandbox.asaas.com/v3"
```

O `ASAAS_WEBHOOK_TOKEN` deve ser o mesmo token definido no webhook do painel Asaas. O Asaas envia esse valor no header `asaas-access-token`.

## URL do webhook no Asaas

Configurar no painel Asaas:

```text
https://supabasewchat.eversync.space/functions/v1/asaas-webhook
```

Eventos recomendados:

- `CHECKOUT_CREATED`
- `CHECKOUT_CANCELED`
- `CHECKOUT_EXPIRED`
- `CHECKOUT_PAID`
- `SUBSCRIPTION_CREATED`
- `SUBSCRIPTION_UPDATED`
- `SUBSCRIPTION_INACTIVATED`
- `SUBSCRIPTION_DELETED`
- `PAYMENT_CREATED`
- `PAYMENT_CONFIRMED`
- `PAYMENT_RECEIVED`
- `PAYMENT_OVERDUE`
- `PAYMENT_CREDIT_CARD_CAPTURE_REFUSED`
- `PAYMENT_REFUNDED`

## Front-end

A aba `Plano` agora tem botao `Pagar assinatura`.

Fluxo:

1. Usuario clica em `Pagar assinatura`.
2. Front chama `asaas-create-checkout`.
3. Function cria checkout recorrente no Asaas.
4. Usuario e redirecionado para o link do Asaas.
5. Webhook atualiza a assinatura no WChat.

## Pendencias

- Configurar secrets reais do Asaas na VPS.
- Criar webhook no painel Asaas com o token forte.
- Fazer teste real em sandbox.
- Criar tela de retorno/feedback depois do pagamento.
- Implementar troca de plano e cancelamento.
- Implementar bloqueios por limite do plano.
