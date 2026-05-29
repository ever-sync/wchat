# Plano Completo: Automacoes de Marketing e CRM

Este documento define o plano para transformar a tela atual de automacoes em um sistema funcional de ponta a ponta: criar fluxos, configurar acoes, ativar com validacao, colocar leads em execucao, processar etapas em fila, auditar resultados e medir performance.

## 1. Objetivo

Construir uma plataforma de automacoes onde o usuario consiga:

- criar fluxos de automacao de marketing e CRM;
- definir criterios estruturados de entrada;
- configurar cada acao do fluxo com dados reais;
- ativar somente fluxos validos;
- executar automacoes automaticamente para leads/clientes/negociacoes;
- acompanhar status, historico, erros e metricas;
- pausar, retomar, duplicar, exportar e importar fluxos com seguranca.

## 2. Estado atual

### Ja existe

- Aba `Marketing > Automacoes`.
- Listagem de fluxos com busca, filtro, paginacao, status, duplicar e excluir.
- Criacao de fluxo vazio.
- Criacao a partir de modelos.
- Importacao/exportacao JSON na lista.
- Editor visual em `/marketing/fluxo/:flowId`.
- Canvas com criterios de entrada e blocos arrastaveis.
- Aba de configuracoes.
- Aba de saida.
- Persistencia basica em `marketing_flows`.
- `definition` e `criteria` salvos como `jsonb`.
- RLS baseada em permissao `marketing`.

### Lacunas principais

- As acoes ainda nao possuem configuracao real.
- O botao `Salvar e Ativar` permite ativar fluxos incompletos.
- Os criterios de entrada sao texto livre, nao regras estruturadas.
- Nao existe motor de execucao/worker.
- Nao existe tabela de participantes do fluxo.
- Nao existe fila de proximas execucoes.
- Nao existe historico/auditoria de cada passo executado.
- Nao existe tratamento robusto de erro, retry, pausa ou dead-letter.
- O botao de exportar no editor ainda nao executa acao.

## 3. Principios do produto

- Automacao ativa nunca pode depender apenas de texto livre.
- Toda acao executavel precisa ter schema de configuracao.
- Todo fluxo ativo precisa passar por validacao antes de ativar.
- Toda execucao precisa ser idempotente.
- Todo erro precisa ser visivel e recuperavel.
- O cliente nunca deve receber mensagens duplicadas por falha de retry.
- O motor deve respeitar tenant, permissoes, LGPD e opt-out.
- O usuario deve conseguir entender por que um lead entrou, saiu ou travou.

## 4. Escopo funcional

### 4.1 Fluxos

Cada fluxo deve ter:

- nome;
- status: `rascunho`, `ativo`, `pausado`, `arquivado`;
- gatilho de entrada;
- criterios estruturados;
- passos configurados;
- condicoes de saida;
- configuracoes globais;
- versao publicada;
- data de publicacao;
- usuario que publicou;
- metricas agregadas.

### 4.2 Gatilhos de entrada

Implementar gatilhos por fases.

#### MVP

- Lead criado por formulario de marketing.
- Cliente/lead recebeu etiqueta.
- Negociacao criada.
- Negociacao movida para etapa.

#### Fase 2

- Mensagem recebida no WhatsApp.
- Campo personalizado atualizado.
- Lead ficou X dias sem interacao.
- Tarefa concluida.
- Venda registrada.
- Lead abandonou formulario.

#### Fase 3

- Webhook externo.
- Evento de Ads.
- Segmento dinamico.
- Data comemorativa/aniversario.
- Reentrada programada.

### 4.3 Criterios de entrada

Substituir texto livre por builder estruturado:

- campo;
- operador;
- valor;
- combinador `E` / `OU`;
- grupos de condicoes;
- pre-visualizacao de leads elegiveis.

Exemplos de campos:

- nome;
- telefone;
- email;
- etiquetas;
- origem;
- formulario;
- campanha;
- funil;
- etapa CRM;
- responsavel;
- produto;
- score;
- cidade;
- estado;
- campos personalizados;
- data da ultima interacao.

Operadores:

- igual;
- diferente;
- contem;
- nao contem;
- existe;
- nao existe;
- maior que;
- menor que;
- antes de;
- depois de;
- entre;
- esta em lista;
- nao esta em lista.

### 4.4 Acoes configuraveis

Cada acao precisa de:

- `actionId`;
- nome;
- categoria;
- schema de configuracao;
- componente de formulario;
- validador;
- executor;
- preview no card;
- regras de idempotencia;
- permissao necessaria.

#### Comunicacao

**Enviar WhatsApp**

- canal/conexao;
- mensagem livre ou template;
- variaveis disponiveis;
- anexos opcionais;
- janela de atendimento;
- horario permitido;
- fallback se telefone invalido;
- bloquear se opt-out.

**Enviar email**

- remetente;
- assunto;
- template;
- corpo;
- variaveis;
- anexos;
- unsubscribe;
- tracking de abertura/clique;
- fallback se email ausente.

**Enviar SMS**

- provedor;
- mensagem;
- limite de caracteres;
- controle de creditos;
- opt-out.

**Mensagem inteligente**

- prompt/base;
- tom;
- limite de tamanho;
- aprovacao antes de enviar, se configurado;
- fallback quando IA estiver indisponivel.

#### Espera

**Esperar duracao**

- dias;
- horas;
- minutos;
- respeitar horario comercial opcional.

**Esperar ate data/hora**

- data absoluta;
- timezone;
- ajuste para horario comercial.

**Esperar ate condicao**

- ate abrir email;
- ate responder WhatsApp;
- ate mover etapa;
- ate concluir tarefa;
- timeout e caminho alternativo.

#### CRM

**Criar negociacao**

- funil;
- etapa;
- responsavel;
- titulo;
- valor;
- produtos;
- origem;
- evitar duplicidade.

**Mover negociacao**

- funil;
- etapa;
- validar tarefas obrigatorias;
- criar tarefa automatica quando etapa exigir;
- registrar historico.

**Criar tarefa**

- titulo;
- descricao;
- tipo;
- responsavel;
- vencimento relativo ou absoluto;
- vinculo com cliente/negociacao.

**Atualizar responsavel**

- usuario fixo;
- responsavel do lead;
- fila/pool;
- round-robin.

**Adicionar anotacao**

- texto;
- visibilidade;
- vinculo com cliente/negociacao.

**Atualizar status**

- aberto;
- ganho;
- perdido;
- motivo de perda;
- origem da alteracao.

#### Lead/Cliente

**Adicionar etiqueta**

- seletor de etiquetas reais;
- criar etiqueta opcional, conforme permissao;
- evitar duplicada.

**Remover etiqueta**

- seletor de etiquetas reais;
- comportamento se etiqueta nao existir.

**Atualizar campo**

- campo do cliente;
- campo customizado;
- valor fixo ou variavel;
- validacao de tipo.

**Marcar oportunidade**

- flag;
- score opcional;
- motivo.

**Marcar venda**

- produto;
- valor;
- negociacao;
- responsavel;
- evento de conversao.

#### Caminhos e logica

**Dividir caminho**

- condicao estruturada;
- caminho `sim`;
- caminho `nao`;
- timeout opcional.

**Teste A/B**

- percentual por variante;
- metrica de vitoria;
- minimo de amostra;
- vencedor automatico.

**Adicionar/remover de outro fluxo**

- fluxo alvo;
- comportamento se ja estiver no fluxo;
- preservar historico.

#### Integracoes

**Webhook**

- URL;
- metodo;
- headers;
- body;
- assinatura;
- retry;
- timeout.

**Zapier/Make/n8n**

- endpoint;
- payload padrao;
- segredo;
- log de resposta.

## 5. Modelo de dados proposto

### 5.1 `marketing_flows`

Manter e evoluir:

- `id`;
- `tenant_id`;
- `name`;
- `status`;
- `trigger`;
- `criteria`;
- `definition`;
- `published_definition`;
- `version`;
- `published_at`;
- `published_by`;
- `created_at`;
- `updated_at`.

Observacao: `definition` continua sendo rascunho. `published_definition` e a versao imutavel usada pelo worker enquanto o fluxo esta ativo.

### 5.2 `marketing_flow_versions`

Historico de publicacoes:

- `id`;
- `flow_id`;
- `tenant_id`;
- `version`;
- `definition`;
- `criteria`;
- `trigger`;
- `published_by`;
- `published_at`;
- `validation_snapshot`.

### 5.3 `marketing_flow_participants`

Cada lead/cliente/negociacao dentro de um fluxo:

- `id`;
- `tenant_id`;
- `flow_id`;
- `flow_version_id`;
- `customer_id`;
- `chat_id`;
- `negotiation_id`;
- `status`: `active`, `waiting`, `completed`, `exited`, `failed`, `paused`;
- `current_step_id`;
- `entered_at`;
- `next_run_at`;
- `exited_at`;
- `exit_reason`;
- `dedupe_key`;
- `context`.

### 5.4 `marketing_flow_jobs`

Fila de execucao:

- `id`;
- `tenant_id`;
- `flow_id`;
- `participant_id`;
- `step_id`;
- `status`: `queued`, `running`, `done`, `failed`, `dead`;
- `run_at`;
- `locked_at`;
- `locked_by`;
- `attempts`;
- `max_attempts`;
- `last_error`;
- `idempotency_key`;
- `created_at`;
- `updated_at`.

### 5.5 `marketing_flow_events`

Auditoria:

- `id`;
- `tenant_id`;
- `flow_id`;
- `participant_id`;
- `event_type`;
- `step_id`;
- `message`;
- `metadata`;
- `created_at`.

Eventos:

- `flow_entered`;
- `step_started`;
- `step_completed`;
- `step_waiting`;
- `step_failed`;
- `retry_scheduled`;
- `participant_exited`;
- `participant_completed`;
- `manual_pause`;
- `manual_resume`.

### 5.6 `marketing_flow_suppressions`

Controle de bloqueios:

- `tenant_id`;
- `customer_id`;
- `channel`;
- `reason`;
- `created_at`.

Usos:

- opt-out WhatsApp;
- unsubscribe email;
- telefone invalido;
- email bounced;
- bloqueio manual.

## 6. Motor de execucao

### 6.1 Arquitetura

Componentes:

- gatilhos no app/backend que inserem participantes elegiveis;
- Edge Function/worker para processar jobs vencidos;
- RPCs no Supabase para lock atomico;
- executores por tipo de acao;
- historico de eventos;
- retry/dead-letter.

### 6.2 Fluxo de execucao

1. Evento acontece, por exemplo lead criado.
2. Sistema busca fluxos ativos daquele tenant com gatilho compativel.
3. Avalia criterios estruturados.
4. Cria `marketing_flow_participants` com dedupe.
5. Cria primeiro `marketing_flow_jobs`.
6. Worker busca jobs `queued` com `run_at <= now()`.
7. Worker faz lock atomico.
8. Executor processa a acao.
9. Registra evento.
10. Agenda proximo job ou encerra participante.

### 6.3 Idempotencia

Cada job precisa de `idempotency_key` baseada em:

- tenant;
- flow version;
- participant;
- step;
- action;
- tentativa logica.

Para mensagens:

- nao reenviar se ja existir evento `step_completed` com mesmo idempotency_key;
- salvar provider message id;
- retry somente quando status for desconhecido ou erro recuperavel.

### 6.4 Retry

Politica recomendada:

- tentativa 1: imediata;
- tentativa 2: +1 minuto;
- tentativa 3: +5 minutos;
- tentativa 4: +30 minutos;
- tentativa 5: +2 horas;
- depois: `dead`.

Erros permanentes:

- telefone ausente;
- email invalido;
- opt-out;
- permissao negada;
- configuracao incompleta;
- recurso removido.

Erros temporarios:

- timeout;
- provider indisponivel;
- rate limit;
- lock concorrente;
- falha de rede.

## 7. Validacao antes de ativar

O botao `Salvar e Ativar` deve:

- salvar rascunho;
- rodar validacao completa;
- mostrar lista de erros e avisos;
- bloquear se houver erro;
- publicar uma versao imutavel se passar.

### Erros que bloqueiam

- fluxo sem gatilho;
- fluxo sem criterios quando o gatilho exigir;
- fluxo sem passos;
- acao sem configuracao obrigatoria;
- mensagem vazia;
- template inexistente;
- funil/etapa inexistente;
- etiqueta inexistente;
- responsavel inexistente;
- espera com tempo zero;
- bifurcacao sem caminhos;
- webhook sem URL valida;
- fluxo com loop sem limite/reentrada controlada.

### Avisos que nao bloqueiam

- fluxo sem condicoes de saida;
- envio fora do horario comercial desativado;
- sem fallback quando telefone/email ausente;
- reentrada permitida;
- alta quantidade estimada de leads elegiveis.

## 8. Editor visual

### 8.1 Melhorias de UX

- painel lateral de acoes permanece;
- clique no card abre configuracao da acao;
- card mostra resumo da configuracao;
- passos incompletos aparecem com alerta;
- botao de ativar mostra quantidade de pendencias;
- zoom com percentual visivel;
- exportar fluxo no editor funcionando;
- auto-save opcional do rascunho;
- indicador de alteracoes nao salvas.

### 8.2 Configuracao por acao

Criar componentes:

- `WhatsAppActionConfig`;
- `EmailActionConfig`;
- `WaitActionConfig`;
- `CreateDealActionConfig`;
- `MoveDealActionConfig`;
- `CreateTaskActionConfig`;
- `TagActionConfig`;
- `WebhookActionConfig`;
- `SplitConditionConfig`.

Cada componente recebe:

- `value`;
- `onChange`;
- `context`;
- `errors`;
- `availableVariables`.

### 8.3 Variaveis

Disponibilizar variaveis no editor:

- `{{cliente.nome}}`;
- `{{cliente.telefone}}`;
- `{{cliente.email}}`;
- `{{negociacao.titulo}}`;
- `{{negociacao.valor}}`;
- `{{responsavel.nome}}`;
- `{{formulario.nome}}`;
- `{{campo.<chave>}}`.

O preview deve indicar variaveis invalidas.

## 9. Permissoes e RLS

### 9.1 Permissoes

Permissao `marketing`:

- `view`: listar e visualizar fluxos;
- `edit`: criar, editar, publicar, pausar;
- `delete`: excluir/arquivar.

Permissao operacional do worker:

- service role executa jobs;
- todas as acoes precisam validar tenant;
- eventos devem registrar origem `automation`.

### 9.2 RLS

Tabelas com RLS:

- `marketing_flows`;
- `marketing_flow_versions`;
- `marketing_flow_participants`;
- `marketing_flow_jobs`;
- `marketing_flow_events`;
- `marketing_flow_suppressions`.

Leitura:

- usuarios com `marketing.view` veem fluxos/eventos do tenant.

Escrita:

- usuarios com `marketing.edit` editam rascunho e publicam;
- service role cria participantes/jobs/eventos;
- delete fisico deve ser restrito; preferir arquivar.

## 10. Integracao com modulos existentes

### 10.1 Formularios de marketing

Ao submeter formulario:

- criar/atualizar cliente;
- criar negociacao, se configurado;
- disparar gatilho `form_submitted`;
- avaliar fluxos ativos.

### 10.2 CRM

Eventos do CRM:

- negociacao criada;
- etapa alterada;
- tarefa criada;
- tarefa concluida;
- venda registrada;
- perda registrada.

Esses eventos podem disparar fluxos ou mover participantes existentes.

### 10.3 Inbox/WhatsApp

Eventos:

- mensagem recebida;
- conversa atribuida;
- conversa resolvida;
- etiqueta adicionada/removida;
- opt-out detectado.

Automacao deve respeitar:

- conversa atribuida a humano;
- janela de atendimento;
- status de opt-out;
- limites de envio por tenant.

### 10.4 IA

Mensagem inteligente pode usar IA, mas precisa:

- registrar prompt e resposta;
- limitar tokens;
- respeitar configuracao do tenant;
- permitir aprovacao manual em fases futuras.

## 11. Observabilidade

### 11.1 Na UI

Na lista de automacoes:

- leads que entraram;
- leads ativos;
- concluidos;
- falhas;
- taxa de conversao;
- ultima execucao;
- status de saude.

No editor:

- painel "Historico";
- participantes recentes;
- erros recentes;
- botao "Reprocessar falhas";
- botao "Pausar fluxo".

No perfil do cliente/negociacao:

- aba ou bloco "Automacoes";
- fluxos ativos do cliente;
- passos executados;
- proxima acao agendada;
- botao para remover do fluxo, conforme permissao.

### 11.2 Logs tecnicos

Registrar:

- inicio/fim de job;
- tempo de execucao;
- erro normalizado;
- provider response;
- payload resumido;
- idempotency key;
- correlation id.

## 12. Testes

### 12.1 Unitarios

- parser de criteria;
- avaliador de condicoes;
- validador de fluxo;
- scheduler de esperas;
- idempotencia;
- retry policy;
- mapping de action config.

### 12.2 Integracao

- criar fluxo;
- publicar versao;
- disparar gatilho;
- criar participante;
- processar job;
- enviar mensagem mock;
- mover CRM mock;
- falha e retry;
- opt-out bloqueia envio.

### 12.3 RLS

Validar:

- tenant A nao ve tenant B;
- usuario sem `marketing.view` nao lista;
- usuario sem `marketing.edit` nao publica;
- service role processa jobs;
- usuario comum nao manipula jobs diretamente.

### 12.4 E2E

Cenarios Playwright:

- criar automacao simples de WhatsApp;
- configurar criterio;
- bloquear ativacao incompleta;
- ativar fluxo valido;
- duplicar fluxo;
- importar/exportar;
- visualizar erro de execucao;
- pausar fluxo.

## 13. Fases de implementacao

### Fase 0: Fundacao tecnica

- [ ] Revisar migration atual `marketing_flows`.
- [ ] Ajustar status para `rascunho`, `ativo`, `pausado`, `arquivado`.
- [ ] Criar tabelas de versions, participants, jobs, events e suppressions.
- [ ] Criar indices por tenant/status/run_at.
- [ ] Criar RLS.
- [ ] Criar RPC de lock atomico para jobs.
- [ ] Criar tipos TypeScript compartilhados para definition/actions.

Criterio de aceite:

- migrations aplicam limpas;
- typecheck passa;
- RLS basica validada.

### Fase 1: Validacao e publicacao

- [ ] Criar schemas de acoes.
- [ ] Criar validador de fluxo.
- [ ] Bloquear `Salvar e Ativar` quando houver erro.
- [ ] Criar `published_definition`.
- [ ] Criar `marketing_flow_versions`.
- [ ] Exibir erros/avisos de validacao no editor.
- [ ] Implementar exportar fluxo no editor.

Criterio de aceite:

- fluxo incompleto nao ativa;
- fluxo valido publica versao;
- edicoes futuras nao alteram versao em execucao ate nova publicacao.

### Fase 2: Configuradores de acoes MVP

- [ ] Espera.
- [ ] Enviar WhatsApp.
- [ ] Criar tarefa.
- [ ] Criar negociacao.
- [ ] Mover negociacao.
- [ ] Adicionar/remover etiqueta.
- [ ] Webhook.

Criterio de aceite:

- cada card abre formulario real;
- card mostra resumo;
- validacao aponta campo faltante;
- definition salva config estruturada.

### Fase 3: Gatilhos e entrada no fluxo

- [ ] Gatilho formulario enviado.
- [ ] Gatilho etiqueta adicionada.
- [ ] Gatilho negociacao criada.
- [ ] Gatilho etapa alterada.
- [ ] Criar avaliador de criterios.
- [ ] Criar dedupe de participante.
- [ ] Criar evento `flow_entered`.

Criterio de aceite:

- evento real cria participante e primeiro job;
- lead nao entra duplicado quando nao permitido;
- criterios estruturados funcionam.

### Fase 4: Worker de execucao

- [ ] Criar Edge Function `marketing-flow-worker`.
- [ ] Criar lock atomico de jobs.
- [ ] Implementar executor `wait`.
- [ ] Implementar executor `webhook`.
- [ ] Implementar executor `create_task`.
- [ ] Implementar executor `tag`.
- [ ] Implementar retry/dead-letter.
- [ ] Registrar eventos.

Criterio de aceite:

- jobs vencidos processam;
- falhas temporarias reprocessam;
- falhas permanentes aparecem na UI/log.

### Fase 5: Comunicacao e CRM real

- [ ] Executor WhatsApp usando infraestrutura existente de envio.
- [ ] Executor email usando fila/plataforma de email existente.
- [ ] Executor criar negociacao.
- [ ] Executor mover negociacao.
- [ ] Executor criar tarefa.
- [ ] Respeitar opt-out/suppressions.
- [ ] Respeitar regras de CRM, etapa e responsavel.

Criterio de aceite:

- fluxo real consegue criar tarefa, mover CRM e enviar mensagem;
- acoes sao idempotentes;
- auditoria mostra cada passo.

### Fase 6: Monitoramento na UI

- [ ] Adicionar metricas na lista.
- [ ] Criar painel de execucoes no editor.
- [ ] Criar detalhes de participante.
- [ ] Criar tela/lista de falhas.
- [ ] Botao reprocessar falha.
- [ ] Botao remover lead do fluxo.
- [ ] Mostrar automacoes no perfil do cliente/negociacao.

Criterio de aceite:

- gestor entende o estado da automacao sem acessar banco;
- erros sao acionaveis.

### Fase 7: Recursos avancados

- [ ] Dividir caminho por condicao.
- [ ] Teste A/B.
- [ ] Esperar ate condicao.
- [ ] Adicionar/remover de outro fluxo.
- [ ] Mensagem inteligente com IA.
- [ ] Rate limits por tenant/canal.
- [ ] Horario comercial por tenant.
- [ ] Simulador de fluxo.

Criterio de aceite:

- fluxos complexos podem ser construidos sem quebrar execucao;
- simulador mostra caminho esperado para um lead.

## 14. Ordem recomendada de entrega

1. Banco + RLS + tipos.
2. Validador + publicar versao.
3. Configuradores das acoes MVP.
4. Worker com `wait`, `webhook`, `tag` e `create_task`.
5. Gatilho formulario enviado.
6. Gatilhos CRM.
7. WhatsApp/email real.
8. Monitoramento e reprocessamento.
9. Caminhos condicionais.
10. Teste A/B e IA.

## 15. MVP recomendado

O MVP deve permitir este fluxo real:

1. Lead entra por formulario.
2. Criterio: origem/formulario/etiqueta.
3. Adicionar etiqueta.
4. Criar negociacao.
5. Criar tarefa para atendente.
6. Esperar 1 dia.
7. Enviar WhatsApp.
8. Se etapa mudar ou venda acontecer, sair do fluxo.

Esse MVP cobre marketing, CRM, tarefas e WhatsApp sem exigir bifurcacoes complexas no primeiro ciclo.

## 16. Riscos

- Envio duplicado de mensagem em retry.
- Fluxo ativo com configuracao incompleta.
- Criterio textual impossivel de executar.
- Mudanca de rascunho afetando execucoes ativas.
- Worker sem lock processando job duas vezes.
- Permissao/RLS permitindo vazamento entre tenants.
- Mensagens enviadas apesar de opt-out.
- Fluxos grandes sem rate limit.
- Falta de visibilidade para suporte.

## 17. Mitigacoes

- `published_definition` imutavel.
- idempotency key em todo job.
- lock atomico com `locked_at`/`locked_by`.
- validacao forte antes de ativar.
- suppressions por canal.
- eventos detalhados.
- dead-letter e reprocessamento manual.
- rate limit por tenant/canal.
- testes de RLS e integracao.

## 18. Criterios de pronto

O projeto de automacoes pode ser considerado pronto quando:

- fluxo incompleto nao ativa;
- fluxo ativo executa automaticamente;
- cada acao MVP tem configuracao real;
- worker processa jobs com lock e retry;
- toda execucao gera historico;
- erros aparecem para o usuario;
- reprocessamento funciona;
- opt-out e permissoes sao respeitados;
- existem testes unitarios, integracao e RLS;
- existe documentacao de deploy/cron/secrets;
- suporte consegue diagnosticar uma automacao sem acessar codigo.

## 19. Checklist de deploy

- [ ] Aplicar migrations.
- [ ] Configurar secrets do worker.
- [ ] Deploy da Edge Function do worker.
- [ ] Configurar cron do worker.
- [ ] Validar RLS com usuarios reais.
- [ ] Criar fluxo MVP em tenant de teste.
- [ ] Disparar lead de teste.
- [ ] Confirmar jobs/eventos.
- [ ] Confirmar tarefa/CRM/mensagem.
- [ ] Confirmar logs e metricas.
- [ ] Ativar em producao para tenant piloto.

## 20. Arquivos principais atuais

- `src/components/marketing/MarketingAutomations.tsx`
- `src/pages/MarketingFlowEditor.tsx`
- `src/components/marketing/MarketingFlowActionsPanel.tsx`
- `src/components/marketing/flow-actions.ts`
- `src/lib/api/marketing-flows.ts`
- `supabase/migrations/20260628120000_marketing_flows.sql`

## 21. Proxima tarefa sugerida

Comecar pela Fase 1:

- criar tipos estruturados de `MarketingFlowDefinition`;
- criar schemas de configuracao por action;
- criar validador de fluxo;
- trocar `Salvar e Ativar` para publicar versao somente se passar na validacao;
- exibir painel de erros no editor.

Essa etapa reduz o risco principal: ativar uma automacao que parece pronta na interface, mas nao tem dados suficientes para executar.
