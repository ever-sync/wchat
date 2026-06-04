# Relatorio - Workers Cron na VPS

Data: 2026-06-04

## Objetivo

Como `pg_cron` nao esta ativo no Supabase self-hosted, os workers internos foram
agendados via cron do Ubuntu na VPS.

## Workers agendados

- `ai-orchestrator`: a cada 1 minuto.
- `marketing-flow-worker`: a cada 1 minuto.
- `webhook-dispatcher`: a cada 1 minuto.
- `marketing-email-dispatch`: a cada 1 minuto.
- `marketing-ad-conversion-dispatch`: a cada 5 minutos.
- `uazapi-instance-sync`: a cada 5 minutos.
- `billing-usage-alerts`: a cada 6 horas.
- `ai-alerts`: a cada 6 horas.
- `worker-alerts`: a cada 5 minutos.

## Arquivos na VPS

Arquivos de cron:

```text
/etc/cron.d/wchat-ai-alerts
/etc/cron.d/wchat-ai-orchestrator
/etc/cron.d/wchat-billing-usage-alerts
/etc/cron.d/wchat-marketing-ad-conversion-dispatch
/etc/cron.d/wchat-marketing-email-dispatch
/etc/cron.d/wchat-marketing-flow-worker
/etc/cron.d/wchat-uazapi-instance-sync
/etc/cron.d/wchat-webhook-dispatcher
/etc/cron.d/wchat-worker-alerts
```

Wrapper root-only:

```text
/usr/local/sbin/wchat-cron-call
```

O `CRON_SECRET` fica somente no wrapper com permissao `700`, evitando expor o
secret diretamente nos arquivos de `/etc/cron.d`.

O wrapper tambem registra cada execucao no banco via Edge Function
`worker-heartbeat`:

- HTTP status;
- duracao;
- sucesso/falha;
- trecho da resposta;
- trecho do erro;
- falhas consecutivas por worker.

## Logs

Cada worker escreve em `/var/log/wchat-<worker>.log`.

## Validacao

O servico `cron` ficou ativo e todos os workers testados manualmente responderam
`HTTP 200`.

Exemplos de retorno:

```json
{"ok":true,"scope":"all","processed":0,"success":0,"failed":0}
{"ok":true,"scope":"all","processed":0,"sent":0,"failed":0,"skipped":0}
{"ok":true,"claimed":0,"sent":0,"skipped":0,"retried":0,"failed":0}
{"success":true,"synced":["..."]}
{"ok":true,"sent":0}
{"ok":true,"checked":18,"inserted":0,"sent":0}
```

## Proximo cuidado

Criar alertas proativos quando algum worker acumular falhas consecutivas ou ficar
sem heartbeat dentro da janela esperada.
