# Plano de Automacoes WChat

Objetivo: transformar a area de automacoes em uma central completa para WhatsApp, IA, CRM, formularios, campanhas e operacao interna, com visibilidade de execucao, modelos prontos e controle forte contra duplicidade.

## Visao

A pagina de automacoes deve deixar claro:

- O que esta ativo.
- O que esta rodando agora.
- O que falhou.
- Qual fluxo esta gerando resultado.
- Quais automacoes existem para WhatsApp, IA, CRM, formularios e campanhas.
- O que ainda precisa configurar antes de ativar.

A experiencia ideal nao e apenas uma tabela de fluxos. Deve parecer uma central viva de automacao do atendimento e marketing.

## Estado Atual

### Ja Temos

- Criar fluxo.
- Salvar fluxo.
- Publicar e ativar fluxo.
- Renomear fluxo.
- Exportar fluxo.
- Importar fluxos JSON.
- Usar modelos basicos.
- Adicionar leads manualmente.
- Simular fluxo.
- Configurar gatilho de entrada.
- Permitir ou bloquear reentrada do lead.
- Configurar abandono automatico por inatividade.
- Configurar condicoes de saida.
- Acompanhar execucoes.
- Ver participantes do fluxo.
- Ver status do participante.
- Ver proxima acao.
- Ver historico/timeline do participante.
- Ver falhas de jobs.
- Reprocessar jobs com falha.
- Remover participante do fluxo.
- Worker de automacoes rodando por cron.

### Gatilhos Existentes

- Manual.
- Formulario enviado.
- Etiqueta adicionada.
- Negociacao criada.
- Etapa do CRM alterada.

### Acoes Com Executor Real

- Espera.
- Esperar ate condicao.
- Enviar WhatsApp.
- Enviar e-mail.
- Mensagem inteligente com IA.
- Classificar com IA.
- Criar tarefa na negociacao.
- Criar negociacao no CRM.
- Mover negociacao.
- Atualizar nome da negociacao.
- Atualizar status.
- Adicionar anotacao.
- Marcar venda.
- Adicionar tag.
- Remover tag.
- Webhook.
- Teste A/B.
- Dividir caminho por segmentacao.
- Adicionar lead a outro fluxo.
- Remover lead de outro fluxo.
- Unir caminho.

## Lacunas Atuais

### Acoes Que Aparecem Mas Ainda Nao Estao Completas

Estas acoes aparecem no editor, mas nao devem ser tratadas como prontas ate terem executor, validacao e teste:

- Enviar SMS.
- Esperar e agendar hora.
- Esperar e agendar data/hora.
- Enviar para RD Station Conversas.
- Dividir caminho por e-mail.
- Dividir por produto.
- Dividir por qualificacao.
- Dividir por equipe.
- Zapier.
- Adicionar produto a negociacao.
- Atualizar tarefa.
- Atualizar responsavel.
- Adicionar base legal.
- Remover base legal.
- Marcar oportunidade.
- Desmarcar oportunidade.
- Alterar estagio dos leads.
- Alterar responsavel pelos leads.
- Distribuir leads entre responsaveis.
- Notificar por e-mail.
- Notificar responsavel.

### Gatilhos Que Faltam

- Nova mensagem recebida no WhatsApp.
- Conversa criada.
- Cliente respondeu.
- Cliente nao respondeu apos X tempo.
- Atendente assumiu conversa.
- Atendente pausou IA.
- IA foi retomada.
- IA falhou.
- IA teve baixa confianca.
- Conversa marcada como resolvida.
- Etiqueta removida.
- Tarefa criada.
- Tarefa vencida.
- Tarefa concluida.
- Formulario especifico enviado.
- Campo especifico do formulario preenchido.
- Campanha enviada.
- Campanha respondida.
- Webhook recebido.
- Horario comercial iniciado.
- Horario comercial encerrado.

### Acoes Que Faltam

WhatsApp:

- Enviar mensagem com template.
- Enviar midia.
- Enviar documento.
- Enviar audio.
- Encaminhar conversa para atendente.
- Atribuir conversa.
- Atribuir conversa para fila.
- Marcar conversa como lida.
- Marcar conversa como nao lida.
- Adicionar anotacao na conversa.
- Fixar prioridade.

IA:

- Pausar IA.
- Retomar IA.
- Chamar agente de IA.
- Gerar resposta sugerida.
- Resumir conversa.
- Extrair campos da conversa.
- Transcrever audio.
- Detectar sentimento.
- Decidir proximo passo.
- Transferir para humano por baixa confianca.

CRM:

- Atualizar responsavel.
- Atualizar tarefa.
- Concluir tarefa.
- Marcar perda.
- Adicionar produto.
- Atualizar valor.
- Adicionar comentario.
- Criar alerta para atendente.

Formularios:

- Criar cliente.
- Atualizar cliente.
- Aplicar tags por resposta.
- Criar negocio por resposta.
- Enviar link de formulario.
- Notificar responsavel.

Integracoes:

- Zapier.
- Make.
- n8n.
- Google Sheets.
- Webhook inbound.
- API externa com autenticacao configuravel.

## Plano De Implementacao

## Fase 1: Nova Pagina De Automações

Objetivo: transformar a pagina em uma central de controle.

Entregas:

- Dashboard superior com metricas:
  - fluxos ativos
  - leads em automacao
  - mensagens enviadas hoje
  - falhas abertas
  - jobs pendentes
  - ultima execucao do worker
- Cards de fluxo com:
  - nome
  - status
  - gatilho
  - canais usados
  - leads ativos
  - ultima execucao
  - falhas
  - botao ativar/pausar
- Filtros por categoria:
  - Todos
  - WhatsApp
  - IA
  - CRM
  - Formularios
  - Campanhas
  - Integracoes
  - Com erro
- Empty state com modelos prontos.
- Selo por acao:
  - Pronto
  - Em breve
  - Precisa configurar
  - Com erro

## Fase 2: Catalogo De Automacoes

Objetivo: o usuario enxergar possibilidades antes de criar do zero.

Categorias:

- WhatsApp.
- IA.
- CRM.
- Formularios.
- Campanhas.
- Integracoes.
- Operacao interna.

Modelos iniciais:

- Boas-vindas no WhatsApp.
- Follow-up sem resposta.
- Reativacao de lead parado.
- Fora do horario comercial.
- Formulario enviado para WhatsApp.
- Formulario enviado para CRM.
- Lead quente para atendimento humano.
- Cliente respondeu campanha.
- Pos-venda.
- Pesquisa de satisfacao.
- Recuperacao de orcamento.
- Sem tarefa futura no CRM.

Cada modelo deve ter:

- Nome.
- Descricao curta.
- Canais usados.
- Preview visual dos passos.
- Estimativa de complexidade.
- Botao "Usar modelo".

## Fase 3: Gatilhos De WhatsApp E Conversa

Objetivo: automatizar o atendimento real, nao apenas marketing.

Entregas:

- Gatilho de nova mensagem recebida.
- Gatilho de conversa criada.
- Gatilho de cliente respondeu.
- Gatilho de cliente sem resposta apos X tempo.
- Gatilho de atendente assumiu.
- Gatilho de conversa resolvida.
- Gatilho de IA pausada.
- Gatilho de IA retomada.
- Gatilho de IA falhou.
- Gatilho de baixa confianca da IA.

Regras necessarias:

- Lock por conversa.
- Idempotencia por conversa/evento/step.
- Janela minima entre mensagens.
- Bloqueio de disparo se humano assumiu.
- Supressao se cliente respondeu.

## Fase 4: Controle De IA

Objetivo: IA ligada por padrao, com controle humano e automacoes.

Entregas:

- Acao pausar IA.
- Acao retomar IA.
- Acao chamar agente IA.
- Acao classificar intencao.
- Acao resumir conversa.
- Acao extrair dados.
- Acao transcrever audio.
- Acao transferir para humano.
- Regras de baixa confianca.
- Historico de quem pausou/retomou.
- Retomada automatica apos inatividade.

Regras de produto:

- IA fica ligada para todas as conversas por padrao.
- Botao pausar e acionado pelo atendente quando ele quer interagir.
- Se humano assumir, IA nao responde.
- IA pode voltar depois de X minutos sem interacao humana.
- Se a IA nao souber responder, transfere para humano.

## Fase 5: Acoes Completas De WhatsApp

Objetivo: automacao conseguir operar a conversa.

Entregas:

- Enviar mensagem.
- Enviar template.
- Enviar midia.
- Enviar documento.
- Enviar audio.
- Atribuir atendente.
- Atribuir fila.
- Encaminhar para humano.
- Marcar como lida.
- Marcar como nao lida.
- Adicionar anotacao na conversa.
- Aplicar etiqueta na conversa.
- Remover etiqueta da conversa.

## Fase 6: Acoes Completas De CRM

Objetivo: automacoes manterem o CRM organizado.

Entregas:

- Criar negociacao.
- Mover negociacao.
- Atualizar status.
- Atualizar responsavel.
- Criar tarefa.
- Atualizar tarefa.
- Concluir tarefa.
- Marcar venda.
- Marcar perda.
- Adicionar produto.
- Atualizar valor.
- Adicionar comentario.
- Criar alerta para atendente.

## Fase 7: Formularios Como Entrada Forte

Objetivo: formularios alimentarem WhatsApp, CRM e IA.

Entregas:

- Gatilho por formulario especifico.
- Gatilho por resposta especifica.
- Criar cliente.
- Atualizar cliente.
- Criar negociacao.
- Adicionar etiquetas por resposta.
- Qualificar com IA.
- Enviar WhatsApp de boas-vindas.
- Notificar responsavel.
- Entrar em sequencia.

## Fase 8: Builder Visual Profissional

Objetivo: editor parecer ferramenta de automacao top de mercado.

Entregas:

- Canvas com zoom.
- Mini mapa.
- Arrastar e soltar mais fluido.
- Organizacao automatica do fluxo.
- Conectores visuais claros.
- Ramos sim/nao.
- Blocos com estado visual.
- Avisos em blocos incompletos.
- Duplicar bloco.
- Copiar e colar bloco.
- Testar bloco isolado.
- Testar fluxo completo.
- Historico de versoes.
- Comparar versoes.
- Restaurar versao anterior.

## Fase 9: Variaveis E Personalizacao

Objetivo: cada mensagem e acao usar contexto real.

Variaveis:

- Nome do cliente.
- Telefone.
- E-mail.
- Tags.
- Ultima mensagem.
- Resumo da conversa.
- Etapa do CRM.
- Responsavel.
- Campos do formulario.
- Campos personalizados.
- Resposta da IA.
- Resposta de webhook.
- Data atual.
- Hora atual.

Entregas:

- Botao de inserir variaveis.
- Preview renderizado.
- Teste com cliente real.
- Fallback para variavel vazia.
- Variaveis criadas por webhook.
- Variaveis criadas por IA.

## Fase 10: Execucoes, Logs E Observabilidade

Objetivo: o usuario entender por que algo rodou ou nao rodou.

Entregas:

- Painel de jobs.
- Jobs pendentes.
- Jobs rodando.
- Jobs com falha.
- Jobs mortos.
- Reprocessamento em massa.
- Ver payload do job.
- Ver erro completo.
- Ver tempo medio de execucao.
- Ver ultima execucao do worker.
- Alerta se cron parar.
- Alerta se WhatsApp/API falhar.
- Logs por fluxo.
- Logs por lead.
- Logs por etapa.

## Fase 11: Segurança, Limites E Anti-Duplicidade

Objetivo: evitar mensagens duplicadas, loop e disparos indevidos.

Entregas:

- Idempotencia por lead/step.
- Idempotencia por conversa/evento.
- Lock por conversa.
- Lock por participante.
- Limite por canal.
- Limite por cliente.
- Limite diario por fluxo.
- Horario permitido.
- Supressao se cliente respondeu.
- Supressao se virou cliente.
- Supressao se esta em atendimento humano.
- Anti-loop.
- Deteccao de ciclo perigoso.
- Janela minima entre mensagens.
- Auditoria de edicao.
- Auditoria de ativacao.

## Fase 12: Integracoes

Objetivo: conectar o WChat ao ecossistema externo.

Entregas:

- Webhook outbound avancado.
- Webhook inbound.
- n8n.
- Make.
- Zapier.
- Google Sheets.
- API externa.
- Headers customizados.
- Autenticacao por token.
- Teste de webhook no editor.
- Log de resposta de webhook.

## Ordem Recomendada

1. Nova pagina de automacoes com dashboard, cards e filtros.
2. Selo "Pronto / Em breve / Precisa configurar / Com erro".
3. Gatilho de nova mensagem no WhatsApp.
4. Acoes pausar IA e retomar IA.
5. Atribuir conversa para atendente/fila.
6. Follow-up automatico se cliente nao respondeu.
7. Modelos prontos de WhatsApp, IA, CRM e formulario.
8. Logs fortes de execucao.
9. Variaveis e preview.
10. Builder visual com canvas mais profissional.
11. Integracoes externas.
12. Limites avancados e auditoria completa.

## Prioridade De Produto

Para o WChat se diferenciar rapido:

- Automacao por mensagem recebida no WhatsApp.
- IA ligada por padrao com pausa humana.
- Retomada automatica da IA por inatividade.
- Follow-up se cliente nao respondeu.
- Criacao de CRM/tarefa/tag conforme conversa.
- Modelos prontos de atendimento.
- Logs claros por conversa e por fluxo.

Esses itens transformam a automacao em algo diretamente ligado ao atendimento diario, nao apenas a marketing.

## Criterio De Pronto

Uma automacao deve ser considerada pronta apenas quando tiver:

- Acao visivel no editor.
- Formulario de configuracao.
- Validacao antes de publicar.
- Executor no worker.
- Registro de evento.
- Registro de erro.
- Idempotencia.
- Teste manual ou automatizado.
- Status claro na UI.

