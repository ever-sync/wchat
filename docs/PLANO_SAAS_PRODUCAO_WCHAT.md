# Plano SaaS de Producao do WChat

Este documento organiza o caminho para transformar o WChat em um SaaS pronto para clientes pagantes, com seguranca, cobranca, operacao, suporte e confiabilidade.

## Objetivo

Fazer o WChat operar como um SaaS profissional:

- Cada empresa isolada em seu proprio tenant.
- Usuarios, permissoes, limites e planos funcionando de forma previsivel.
- WhatsApp, IA, CRM, formularios e automacoes com monitoramento real.
- Cobrança, upgrades, bloqueios e faturas integrados.
- Backups, logs, auditoria e suporte preparados para producao.
- Deploy, migrations e rollback com processo confiavel.

## Principios

- **Confiabilidade antes de volume:** cliente pagante precisa confiar que mensagens, CRM e IA nao somem.
- **Seguranca antes de escala:** nenhuma feature compensa vazamento entre tenants.
- **Operacao visivel:** quando algo falhar, o time precisa saber onde, por que e quem foi afetado.
- **Limites claros:** todo recurso caro ou sensivel precisa ter limite por plano.
- **Onboarding simples:** o cliente deve chegar no primeiro valor em poucos minutos.

## Estado Atual Resumido

O app ja possui bases importantes:

- Atendimento/inbox com WhatsApp.
- CRM e funis.
- Agente IA.
- Automacoes de marketing.
- Formularios com webhook, layout avancado, condicoes e analytics.
- Supabase self-hosted na VPS.
- Edge Functions para Uazapi, IA, formularios, automacoes e integrações.
- Algumas permissoes e papeis ja existem.

O que falta agora e a camada SaaS:

- cobranca
- planos
- limites
- RLS auditado
- onboarding completo
- observabilidade
- backups testados
- suporte
- operacao de incidentes
- deploy/staging/rollback

## Fase 0 - Fundacao e Auditoria

Objetivo: saber exatamente o que ja esta seguro e o que ainda e risco.

### Entregas

- Inventario de tabelas, Edge Functions e secrets.
- Mapa de dados por tenant.
- Mapa de rotas publicas e privadas.
- Mapa de endpoints externos:
  - Uazapi
  - OpenAI
  - Voyage
  - Resend
  - n8n
  - webhooks de formularios
- Checklist de RLS por tabela.
- Checklist de service role por Edge Function.
- Lista de secrets a rotacionar.

### Criterio de pronto

- Existe uma tabela/documento dizendo:
  - quais tabelas tem `tenant_id`
  - quais tabelas tem RLS ativo
  - quais funcoes usam service role
  - quais endpoints sao publicos
  - quais secrets precisam rotacao

### Prioridade

Alta. Sem isso, qualquer escala vira risco.

## Fase 1 - Multi-Tenant e Permissoes

Objetivo: garantir isolamento total entre empresas.

### Entregas

- Revisar RLS em todas as tabelas de negocio.
- Garantir `tenant_id` em entidades principais:
  - clientes
  - conversas
  - mensagens
  - instancias WhatsApp
  - CRM
  - tarefas
  - etiquetas
  - formularios
  - automacoes
  - IA
  - logs
  - billing
- Criar testes de isolamento:
  - tenant A nao le tenant B
  - atendente nao ve chat que nao pode ver
  - gestor ve equipe
  - admin ve tudo do tenant
- Revisar papeis:
  - owner
  - admin
  - gestor
  - atendimento
  - financeiro
  - auditor/leitura
- Criar tela de usuarios:
  - convidar
  - remover
  - alterar papel
  - transferir ownership

### Criterio de pronto

- Testes automatizados cobrem os principais cenarios de isolamento.
- Nenhuma consulta critica depende apenas de filtro no frontend.
- Rotas administrativas validam papel no backend.

## Fase 2 - Planos, Limites e Billing

Objetivo: permitir vender o produto com planos claros e cobranca automatizada.

### Planos sugeridos

#### Starter

- 1 canal WhatsApp
- 3 usuarios
- 1.000 conversas/mes
- IA basica
- formularios basicos
- automacoes simples

#### Pro

- 3 canais WhatsApp
- 10 usuarios
- 10.000 conversas/mes
- IA completa
- automacoes avancadas
- formularios avancados
- relatorios

#### Business

- 10 canais WhatsApp
- 50 usuarios
- volume maior
- SLA operacional
- filas/equipes
- auditoria avancada
- webhooks e API

#### Enterprise

- limites customizados
- suporte prioritario
- contrato
- onboarding assistido
- retencao customizada

### Recursos com limite

- usuarios
- canais WhatsApp
- mensagens enviadas
- conversas abertas
- execucoes de automacao
- formularios publicados
- respostas de IA
- tokens de IA
- armazenamento de midia
- webhooks por minuto
- chamadas de API

### Entregas

- Tabelas de billing:
  - `billing_plans`
  - `billing_subscriptions`
  - `billing_usage_counters`
  - `billing_invoices`
  - `billing_entitlements`
- Integracao com Asaas.
- Portal de assinatura.
- Tela de plano atual.
- Upgrade/downgrade.
- Avisos de limite.
- Bloqueio suave:
  - avisar em 80%
  - alertar em 100%
  - bloquear recurso caro depois do limite
- Webhook de pagamento.
- Estado de conta:
  - trial
  - active
  - past_due
  - cancelled
  - suspended

### Criterio de pronto

- Um tenant novo consegue iniciar trial.
- Um admin consegue assinar plano.
- Uso e contabilizado.
- Excesso de limite gera aviso.
- Conta inadimplente entra em estado controlado.

## Fase 3 - Onboarding de Cliente

Objetivo: reduzir friccao ate o primeiro atendimento funcionando.

### Fluxo ideal

1. Criar conta.
2. Criar empresa.
3. Escolher objetivo:
   - atendimento
   - vendas
   - suporte
   - recuperacao
4. Conectar WhatsApp por QR Code.
5. Criar primeiro atendente.
6. Configurar IA basica.
7. Criar ou importar etiquetas.
8. Criar primeiro formulario ou fluxo.
9. Enviar mensagem de teste.
10. Checklist concluido.

### Entregas

- Wizard inicial.
- Checklist persistente por tenant.
- Estado de setup por recurso:
  - WhatsApp conectado
  - IA configurada
  - atendente criado
  - CRM configurado
  - formulario publicado
  - automacao ativa
- Templates iniciais:
  - funil de vendas
  - etiquetas comuns
  - respostas rapidas
  - script base da IA

### Criterio de pronto

- Um cliente sem ajuda consegue conectar um canal e receber uma mensagem.
- O app mostra claramente o que falta configurar.

## Fase 4 - Confiabilidade do WhatsApp

Objetivo: WhatsApp ser tratato como infraestrutura critica.

### Entregas

- Painel de saude por canal:
  - conectado
  - desconectado
  - aguardando QR
  - erro de webhook
  - ultima mensagem recebida
  - ultimo envio
  - latencia media
- Reconexao por QR.
- Alertas:
  - canal caiu
  - webhook sem evento ha X minutos
  - envio falhando
  - fila acumulada
- Retry de envio com idempotencia.
- Logs de webhook por instancia.
- Deduplicacao forte de mensagens.
- Bloqueio contra importacao de historico antigo.
- Monitor de eventos Uazapi esperados:
  - `connection`
  - `messages`

### Criterio de pronto

- Quando o canal cai, o admin ve e sabe reconectar.
- Mensagens nao duplicam em fluxo normal.
- O sistema nao busca historico antigo sem acao explicita.

## Fase 5 - Observabilidade e Logs

Objetivo: saber o que esta acontecendo sem depender de chute.

### Entregas

- Sentry no frontend e Edge Functions.
- Logs estruturados por:
  - tenant
  - usuario
  - instancia WhatsApp
  - chat
  - funcao
  - request id
- Dashboards:
  - erros por hora
  - webhooks recebidos
  - mensagens enviadas
  - mensagens com falha
  - execucoes de IA
  - execucoes de automacao
  - formularios enviados
- Alertas:
  - Edge Function com erro alto
  - webhook caiu
  - realtime caiu
  - banco lento
  - storage falhando
  - fila de automacao acumulando

### Criterio de pronto

- Um incidente pode ser investigado por tenant, chat ou request id.
- O time recebe alerta antes do cliente reclamar em casos previsiveis.

## Fase 6 - Backups, Restore e Continuidade

Objetivo: garantir recuperacao real em caso de falha.

### Entregas

- Backup diario do Postgres.
- Backup de storage/midias.
- Backup de configs criticas.
- Retencao:
  - 7 dias diario
  - 4 semanas semanal
  - 3 meses mensal
- Runbook de restore.
- Teste mensal de restore em ambiente separado.
- Snapshot antes de migrations grandes.
- Plano de desastre:
  - VPS caiu
  - banco corrompeu
  - storage perdeu arquivo
  - secrets vazaram

### Criterio de pronto

- Existe restore testado, nao apenas backup teorico.
- Tempo estimado de recuperacao documentado.

## Fase 7 - Deploy, Staging e CI/CD

Objetivo: publicar sem medo.

### Entregas

- Ambientes:
  - local
  - staging
  - producao
- Banco separado para staging.
- Supabase/Edge Functions separadas por ambiente.
- Variaveis separadas por ambiente.
- CI:
  - typecheck
  - testes
  - lint
  - build
  - migrations dry-run
- CD:
  - deploy frontend
  - deploy Edge Functions
  - aplicar migrations
  - health check
- Rollback:
  - frontend
  - functions
  - migrations reversiveis quando possivel

### Criterio de pronto

- Toda mudanca passa por staging antes de producao.
- Deploy tem checklist e rollback documentado.

## Fase 8 - Segurança e Compliance

Objetivo: proteger dados e reduzir risco juridico/operacional.

### Entregas

- Rotacao de secrets expostos.
- Politica de acesso por papel.
- Auditoria de acoes sensiveis:
  - login
  - convite
  - alteracao de permissao
  - exportacao
  - exclusao
  - alteracao de billing
  - alteracao de webhook
- Rate limit em:
  - login
  - formularios publicos
  - webhooks
  - API publica
- Protecao contra abuso:
  - spam de formulario
  - webhook malicioso
  - payload grande
  - loop de automacao
- LGPD:
  - politica de privacidade
  - termos de uso
  - exportacao de dados
  - exclusao/anominizacao
  - consentimento em formularios
- 2FA para admins.

### Criterio de pronto

- Secrets principais foram rotacionados.
- Acoes sensiveis ficam registradas.
- Cliente consegue solicitar exclusao/exportacao de dados.

## Fase 9 - Suporte e Operacao Interna

Objetivo: dar suporte a clientes sem depender de acesso direto ao banco.

### Entregas

- Painel interno de suporte:
  - buscar tenant
  - status da conta
  - canais conectados
  - ultimos erros
  - billing
  - usuarios
  - logs recentes
- Impersonation controlado:
  - somente admins internos
  - com auditoria
  - tempo limitado
- Central de ajuda.
- Chat de suporte dentro do app.
- Runbooks:
  - canal desconectado
  - mensagens duplicadas
  - mensagem nao chega
  - IA nao responde
  - formulario nao envia webhook
  - automacao parada
  - cliente inadimplente

### Criterio de pronto

- Suporte resolve problemas comuns sem pedir acesso ao servidor.
- Toda entrada como suporte fica auditada.

## Fase 10 - Produto Comercial

Objetivo: deixar o WChat vendavel.

### Entregas

- Landing page.
- Pagina de precos.
- Pagina de status.
- Termos de uso.
- Politica de privacidade.
- Pagina de contato.
- Materiais de onboarding:
  - video curto
  - guia de conectar WhatsApp
  - guia de IA
  - guia de automacoes
  - guia de formularios
- Templates prontos por nicho:
  - advocacia/previdenciario
  - clinicas
  - ecommerce
  - escolas
  - imobiliarias
  - servicos locais

### Criterio de pronto

- Um lead consegue entender preco, valor, teste gratis e como comecar.

## Fase 11 - Performance e Escala

Objetivo: preparar o app para muitos tenants e muitas mensagens.

### Entregas

- Indices nas tabelas mais acessadas.
- Revisao de queries lentas.
- Paginacao consistente.
- Retencao/arquivamento de mensagens antigas.
- Storage com lifecycle.
- Separacao de jobs pesados.
- Fila para:
  - IA
  - automacoes
  - envio de campanha
  - webhook externo
- Cache para dashboards.
- Teste de carga:
  - mensagens por minuto
  - formularios por minuto
  - automacoes por minuto
  - usuarios simultaneos

### Criterio de pronto

- O sistema suporta uma meta definida de carga sem degradar o atendimento.

## Fase 12 - API Publica e Ecossistema

Objetivo: permitir integracoes de clientes e parceiros.

### Entregas

- API keys por tenant.
- Escopos por API key.
- Rate limit por API key.
- Logs de API.
- Webhooks configuraveis:
  - mensagem recebida
  - lead criado
  - negociacao criada
  - etapa alterada
  - formulario enviado
  - venda marcada
- Documentacao OpenAPI.
- Exemplos:
  - n8n
  - Make
  - Zapier
  - cURL

### Criterio de pronto

- Um cliente consegue integrar sem pedir acesso ao banco.

## Ordem Recomendada de Execucao

### Primeiro ciclo - deixar seguro para piloto pago

1. Auditoria de RLS e service role.
2. Rotacao de secrets expostos.
3. Onboarding minimo.
4. Monitor de WhatsApp.
5. Backups automaticos e restore testado.
6. Logs por tenant.
7. Planos manuais sem gateway, se precisar vender rapido.

### Segundo ciclo - cobrar e operar

1. Asaas.
2. Planos e limites.
3. Tela de assinatura.
4. Avisos de limite.
5. Painel interno de suporte.
6. Auditoria de acoes sensiveis.

### Terceiro ciclo - escala e maturidade

1. Staging completo.
2. CI/CD.
3. Alertas.
4. Teste de carga.
5. API publica.
6. Central de ajuda.
7. Pagina de status.

## Checklist de Pronto Para Produção

- [ ] RLS revisado em todas as tabelas de negocio.
- [ ] Edge Functions revisadas por uso de service role.
- [ ] Secrets rotacionados.
- [ ] Backups automaticos ativos.
- [ ] Restore testado.
- [ ] Monitor de WhatsApp ativo.
- [ ] Alertas de webhook e mensagens ativos.
- [ ] Billing implementado ou processo manual documentado.
- [ ] Limites por plano funcionando.
- [ ] Onboarding guiado.
- [ ] Logs estruturados por tenant.
- [ ] Sentry/observabilidade configurada.
- [ ] Auditoria de acoes sensiveis.
- [ ] Termos e politica publicados.
- [ ] Suporte interno consegue diagnosticar tenant.
- [ ] Staging separado.
- [ ] Deploy com rollback documentado.

## Riscos Principais

### Vazamento entre tenants

Mitigacao: RLS, testes automatizados, revisao de queries e uso minimo de service role.

### Mensagens duplicadas ou antigas

Mitigacao: idempotencia, nao importar historico sem acao explicita, logs por message id.

### Custo de IA fora de controle

Mitigacao: limite por tenant, tracking de tokens, alertas e bloqueio por plano.

### Cliente perder WhatsApp e nao perceber

Mitigacao: health check por canal, alerta e reconexao simples.

### Falha de backup

Mitigacao: restore testado periodicamente.

### Deploy quebrar producao

Mitigacao: staging, CI/CD, health check e rollback.

## Metricas de SaaS

### Produto

- ativacao: tenant conectou WhatsApp
- tempo ate primeira mensagem recebida
- tempo ate primeiro atendimento respondido
- automacoes ativas por tenant
- formularios publicados por tenant

### Comercial

- trial started
- trial activated
- trial converted
- MRR
- churn
- expansion revenue

### Operacao

- uptime por canal
- mensagens com falha
- tempo medio de resposta
- erros de Edge Functions
- webhooks por minuto

### IA

- respostas geradas
- tokens por tenant
- custo por tenant
- falhas de IA
- conversas pausadas por humano

## Definicao de MVP SaaS Pago

O WChat pode ser considerado pronto para primeiros clientes pagantes quando tiver:

- tenant isolado com RLS revisado
- WhatsApp conectando e monitorado
- mensagens chegando sem importacao indesejada de historico
- usuarios e papeis funcionando
- backup diario com restore testado
- suporte interno basico
- plano/limite manual ou automatizado
- termos e politica publicados
- processo claro de deploy e rollback

Asaas e billing completo podem vir logo depois se a venda inicial for assistida, mas seguranca, backup e operacao nao deveriam esperar.
