# Relatorio - Monitoramento Operacional

Data: 2026-06-04

## Objetivo

Melhorar o painel `/admin/operacao` para mostrar sinais operacionais dos workers
e das filas internas, alem da saude por tenant que ja existia.

## Entregue

### Edge Function

`operation-admin` agora retorna tambem `workers` no snapshot principal.

Workers monitorados:

- `marketing-flow-worker`
- `ai-orchestrator`
- `webhook-dispatcher`
- `marketing-email-dispatch`
- `marketing-ad-conversion-dispatch`
- `uazapi-instance-sync`
- `billing-usage-alerts`
- `ai-alerts`

Sinais considerados:

- fila pendente;
- jobs rodando;
- jobs travados;
- erros recentes;
- ultimo heartbeat quando existe;
- ultimo sinal de atividade nas tabelas de fila;
- canais sem sync recente ou em erro.

### UI

Foi criada a secao **Workers e filas** em `/admin/operacao`.

Cada card mostra:

- nome do worker;
- agenda esperada;
- status operacional;
- fila pendente;
- itens rodando;
- erros;
- ultimo sinal;
- detalhes curtos.

### Resumo

O resumo superior passou a incluir `Workers alerta`, somando workers em estado
`warning` ou `critical`.

## Validacao

- `npm run typecheck`: passou.
- `npm run build`: passou.
- Edge `operation-admin` publicada na VPS.
- `operation-admin` sem token retornou `401`.
- `health` retornou `200`.

## Proximas melhorias

- Adicionar grafico historico de fila acumulada por worker.

## Atualizacao - Heartbeat generico

Foi adicionada a infraestrutura generica de heartbeat:

- `platform_worker_heartbeats`: ultimo estado de cada worker.
- `platform_worker_runs`: historico das execucoes recentes.
- RPC `record_platform_worker_run(...)`.
- Edge interna `worker-heartbeat`, protegida por `x-cron-secret`.

O wrapper da VPS `/usr/local/sbin/wchat-cron-call` agora:

- executa o worker;
- captura HTTP status;
- mede duracao;
- captura trecho da resposta;
- captura erro de rede/comando;
- registra sucesso ou falha via `worker-heartbeat`;
- incrementa falhas consecutivas quando o worker falha;
- zera falhas consecutivas quando volta a sucesso.

Todos os workers agendados passaram a gravar heartbeat real:

- `ai-orchestrator`
- `marketing-flow-worker`
- `webhook-dispatcher`
- `marketing-email-dispatch`
- `marketing-ad-conversion-dispatch`
- `uazapi-instance-sync`
- `billing-usage-alerts`
- `ai-alerts`

Validacao:

```text
worker-heartbeat sem secret: 401
health: 200
cron: active
todos os workers testados: HTTP 200, 0 falhas consecutivas
```

## Proximas melhorias apos heartbeat

- Criar grafico historico de execucoes por worker usando `platform_worker_runs`.
- Criar acao manual no painel para reexecutar um worker especifico.

## Atualizacao - Alertas proativos

Foi adicionada a camada de alerta generico de workers:

- `platform_worker_alerts`: guarda o historico dos alertas.
- Edge `worker-alerts`: consulta heartbeats e envia e-mail para `platform_admins`.
- Dedupe por `worker_key + alert_type + periodo` para evitar spam.

Alertas cobertos:

- `failure`: o worker acumula falhas consecutivas.
- `stale`: o worker ficou sem heartbeat dentro da janela esperada.

O painel `/admin/operacao` passou a mostrar:

- `Workers alertas 24h`;
- lista recente de alertas de workers;
- detalhes por worker e severidade.

O cron da VPS deve chamar `worker-alerts` a cada poucos minutos para manter o
monitoramento reativo.
