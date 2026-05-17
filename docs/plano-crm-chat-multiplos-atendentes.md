# Plano Completo: CRM e Chat com Multiplos Atendentes

Este plano organiza o que falta para o CRM e o Chat ficarem completos, seguros e operacionais para multiplos atendentes, gestor e administracao.

## Estado atual

### Ja implementado e aplicado

- O app usa o projeto Supabase `oaqeabqfgbeprrgqdmsk`.
- Migrations aplicadas via `db query --linked`:
  - `20260616180000_tighten_chat_crm_attendant_guards.sql`
  - `20260617140000_role_permission_rls_hardening.sql`
  - `20260617150000_role_permission_rls_hardening_v2.sql`
  - `20260617160000_multi_attendant_border_rls.sql`
  - `20260617170000_tighten_remaining_multi_attendant_edges.sql`
- A Edge Function `uazapi-send-message` foi deployada no projeto correto.
- Helpers no banco: `can_atendimento_act_on_chat`, `can_modify_crm_negotiation`, `can_access_crm_negotiation`, `can_view_whatsapp_chat`, `has_role_permission`.
- Policies confirmadas (chat, mensagens, CRM, notas, transferencias, tags, documentos, stage history, activities e storage de documentos).
- UX: mensagens de bloqueio, deep link bloqueado, filtro gestor por atendente no inbox.
- Testes unitarios do plano + `inbox-e2e.test.ts` passando.
- E2E Playwright: `e2e/multi-attendant-inbox.spec.ts` (5 cenários mock: isolamento A/B, deep link bloqueado, gestor lista/fila, Assumir ambos no pool).
- Mock E2E: `useChatNegotiation` + negócio pool vinculado ao chat pool (`crm-e2e-fixtures`, `inbox-e2e-fixtures`).
- Script validacao: `supabase/tests/rls_multi_attendant_validation.sql`.
- Roteiro seed manual: `supabase/scripts/manual_multi_attendant_seed.sql`.
- Build de producao passou.

### Fechamento da implementacao (codigo + testes, 2026-06-17)

- Commit no repositorio com migrations `20260617160000` / `20260617170000`, UX inbox/CRM, fixtures E2E, `rls_multi_attendant_validation.sql` e roteiro de seed manual.
- Testes automatizados do escopo: unitarios (`negotiation-assignee`, `sale-rules`, `ai-business-rules`, `inbox-e2e`, `whatsapp`) + 5 cenarios Playwright mock — todos passando localmente.
- **Somente manual / fora do commit:** validacao com JWT real de dois atendentes + gestor (Fase 1 e 5.2); aceite do papel `financeiro` com stakeholders (Fase 2); backlog Fase 7.

### Pendente (nao fecha o plano sozinho — manual ou backlog)

- [ ] **Fase 1:** validacao manual com usuarios reais (A, B, gestor, financeiro) — roteiro e seed em `supabase/scripts/manual_multi_attendant_seed.sql`. *Nao automatizavel sem credenciais JWT no ambiente.*
- [ ] **Fase 2:** validar em producao o papel `financeiro` com stakeholders (decisao de produto registrada abaixo; codigo/RLS ja seguem o padrao conservador).
- Fase 4.2+ / **Fase 7:** painel gestor avancado (SLA, metricas), notificacoes de transferencia, round-robin, auditoria IA para gestor.
- [ ] **Fase 5.2:** executar `supabase/tests/rls_multi_attendant_validation.sql` (ou equivalente) logado como atendente A e B com JWT real — script pronto; CI com dois JWTs ainda nao configurado.
- Pendencia tecnica fora do escopo multi-atendente: `supabase db lint --linked --fail-on error` ainda acusa erros antigos em funcoes SQL (`ensure_trendii_seller_for_profile`, `mark_negotiation_sold_from_chat`, `resolve_negotiation_for_chat`, `register_sale_flow`).

### Regra de negocio atual

- `atendimento`:
  - ve apenas chats atribuidos a si;
  - envia mensagem apenas em chat atribuido a si;
  - altera CRM apenas em negocio atribuido a si;
  - pode assumir conversa/negocio conforme regras de pool;
  - nao deve acessar mensagens, tarefas ou negocios de outro atendente.

- `admin` e `operacao`:
  - funcionam como gestor;
  - veem e gerenciam chats e CRM;
  - podem transferir conversas;
  - podem devolver negocio ao pool;
  - podem operar os fluxos administrativos.

- `financeiro`:
  - hoje tem leitura ampla em algumas areas;
  - nao envia mensagem pela Edge Function;
  - precisa de decisao de produto para confirmar se deve ver chat, CRM ou apenas relatorios/financeiro.

## Objetivo final

Ter um CRM e Chat em que:

- cada atendente trabalha somente no proprio atendimento;
- gestor acompanha, distribui, transfere e audita tudo;
- IA nao interfere quando existe responsavel humano;
- vendas e devolucoes exigem responsavel correto;
- nenhuma regra critica dependa apenas da interface;
- testes automatizados protejam contra regressao.

## Fase 1: Validacao manual obrigatoria

### Roteiro rapido (copiar na validacao)

1. Login **gestor** (`admin` ou `operacao`) → Inbox → conferir banner **Fila: N sem responsável** e filtro por atendente.
2. Login **atendente A** → Inbox → só conversas de A; abrir `/inbox?chatId=<id-chat-B>` → mensagem *outro atendente*.
3. Login **atendente B** → repetir invertendo A/B.
4. Chat + negócio no pool vinculados → botão **Assumir ambos** no cabeçalho do chat.
5. Gestor transfere conversa A→B → B vê e responde; A deixa de ver.
6. Registrar venda só com conversa e negócio assumidos (atendente).
7. Opcional **financeiro**: só leitura em inbox/CRM, sem enviar mensagem.

Script SQL: `supabase/scripts/manual_multi_attendant_seed.sql`

### 1.1 Preparar usuarios de teste

Criar ou separar no mesmo tenant:

- `admin@...` ou `operacao@...`
- `atendente.a@...`
- `atendente.b@...`
- opcional: `financeiro@...`

Cada usuario deve ter `profile.id`, `tenant_id`, `role` e `status = active` corretos.

### 1.2 Criar dados de teste

Preparar:

- 1 conversa sem responsavel, no pool;
- 1 conversa atribuida ao atendente A;
- 1 conversa atribuida ao atendente B;
- 1 negocio CRM sem responsavel;
- 1 negocio CRM atribuido ao atendente A;
- 1 negocio CRM atribuido ao atendente B;
- pelo menos 1 conversa vinculada a negocio CRM.

### 1.3 Testar como atendente A

Checklist:

- [ ] Ve apenas conversas atribuidas a A.
- [ ] Nao ve conversa atribuida a B na lista.
- [ ] Nao consegue abrir mensagens de B forçando `chatId` na URL.
- [ ] Nao consegue enviar mensagem para conversa de B.
- [ ] Nao consegue alterar etapa de negocio atribuido a B.
- [ ] Consegue enviar mensagem em conversa atribuida a A.
- [ ] Consegue alterar CRM atribuido a A.
- [ ] Consegue criar lead a partir de chat proprio.
- [ ] Consegue registrar venda apenas com conversa e negocio assumidos.
- [ ] Recebe mensagem clara quando precisa assumir conversa ou negocio.

### 1.4 Testar como atendente B

Repetir o mesmo checklist invertendo A e B.

### 1.5 Testar como gestor (`admin` ou `operacao`)

Checklist:

- [ ] Ve conversas de A, B e pool.
- [ ] Ve negocios de A, B e pool.
- [ ] Consegue atribuir conversa para A ou B.
- [ ] Consegue transferir conversa entre atendentes.
- [ ] Consegue assumir/devolver negocio ao pool.
- [ ] Consegue resolver, perder, adiar e reabrir conversas conforme a UI.
- [ ] Consegue corrigir responsavel de negocio vinculado ao chat.

### 1.6 Testar como financeiro

Decidir o comportamento esperado e validar:

- [ ] Deve ver chat?
- [ ] Deve ver mensagens?
- [ ] Deve ver CRM?
- [ ] Deve editar clientes?
- [ ] Deve registrar venda/devolucao?
- [ ] Deve acessar apenas relatorios e financeiro?

Se a resposta for "financeiro nao deve ver chat", abrir tarefa para apertar permissao de leitura.

## Fase 2: Decisoes de produto pendentes

### 2.1 Papel de gestor

Decidir uma das opcoes:

- **Opcao A: manter gestor como `operacao`**
  - Mais simples.
  - Ja encaixa no codigo atual.

- **Opcao B: criar role `gestor`**
  - Mais claro para o negocio.
  - Exige alterar tipos, permissoes, RLS, telas e seeds.

Recomendacao: manter `operacao` como gestor nesta etapa e so criar `gestor` se houver diferenca real entre operacao e gestor.

### 2.2 Regra do financeiro

Definir:

- financeiro ve conversas ou nao?
- financeiro ve mensagens ou so vendas/relatorios?
- financeiro pode editar cliente?
- financeiro pode ver CRM inteiro?

**Decisao registrada (implementacao atual, 2026-06):**

- `operacao` = gestor (sem role `gestor` separada nesta etapa).
- `financeiro`: leitura ampla em inbox/CRM onde `has_role_permission` permite `view`; **sem** envio de mensagem (Edge Function) nem edicao de chat/negocio de terceiros; foco em vendas/relatorios/financeiro.
- Validar com usuario `financeiro@...` no roteiro da Fase 1.6 antes de fechar o criterio de aceite.

### 2.3 Pool de atendimento

Definir se atendente pode ver pool:

- Chat:
  - hoje atendimento ve apenas chat atribuido a si;
  - para assumir conversa do pool, a UI precisa expor um fluxo controlado ou o gestor precisa distribuir.

- CRM:
  - atendimento pode ver leads no pool em algumas regras antigas;
  - precisa confirmar se isso e desejado.

Decisao recomendada:

- Chat pool: visivel para gestor; atendente recebe por distribuicao ou botao "proximo atendimento".
- CRM pool: visivel para gestor; atendente pode assumir apenas se liberado explicitamente.

## Fase 3: Revisao das bordas de seguranca

Status: executada no Supabase correto em `20260617170000_tighten_remaining_multi_attendant_edges.sql`.

Foram apertadas as policies de:

- `chat_notes` update/delete;
- `chat_transfers` insert;
- `whatsapp_chat_tags` insert;
- `crm_stage_history` insert;
- `crm_activities` insert;
- `crm_negotiation_documents` select;
- `storage.objects` para bucket `crm-lead-documents`.

O nucleo foi fechado, mas ainda vale revisar tabelas e RPCs auxiliares.

### 3.1 Chat notes

Validar policies de:

- `chat_notes`
- criacao de nota;
- leitura de nota;
- exclusao/edicao, se existir.

Regra esperada:

- atendimento so ve/edita nota de chat proprio;
- gestor ve tudo.

### 3.2 Chat tags

Validar:

- `chat_tags`
- `whatsapp_chat_tags`
- tags globais vs privadas.

Regra esperada:

- atendimento so tagueia chat proprio;
- gestor tagueia qualquer chat;
- tag privada deve continuar privada.

### 3.3 Historico de transferencia

Validar:

- `chat_transfers`

Regra esperada:

- gestor ve historico completo;
- atendimento ve apenas historico de chats em que participa ou participou;
- nenhum atendente deve conseguir forjar transferencia.

### 3.4 CRM activities e stage history

Validar:

- `crm_activities`
- `crm_stage_history`

Regra esperada:

- atendimento ve apenas atividades de negocios proprios;
- gestor ve tudo;
- inserts automaticos por triggers/functions continuam funcionando.

### 3.5 Documentos do CRM

Validar:

- `crm_negotiation_documents`
- storage bucket de documentos.

Regra esperada:

- atendimento so acessa documento de negocio proprio;
- gestor acessa tudo;
- delete segue regra de responsavel.

### 3.6 Relatorios

Validar RPCs e telas de relatorio:

- gestor ve todos;
- atendimento ve apenas seus indicadores;
- financeiro ve conforme decisao de produto.

## Fase 4: Ajustes de UX para completar o fluxo

### 4.1 Estados vazios e bloqueios claros

Criar mensagens consistentes:

- "Conversa atribuida a outro atendente."
- "Assuma a conversa para responder."
- "Assuma o negocio para alterar o CRM."
- "Apenas gestor pode transferir esta conversa."
- "Apenas gestor pode devolver ao pool."

### 4.2 Tela de gestor

- [x] Banner **Fila: N sem responsável** (`inbox-manager-queue`) + filtro por atendente na sidebar (admin/operacao).
- [x] E2E: banner e fila visíveis para gestor mock.

Ainda desejavel (Fase 7 / backlog):

- fila de conversas sem responsavel;
- conversas por atendente;
- tempo desde ultima mensagem;
- SLA de primeira resposta;
- botao transferir;
- botao devolver ao pool;
- filtro por atendente/status/tag.

### 4.3 Indicadores no CRM

Adicionar sinalizacao:

- negocio no pool;
- negocio sem tarefa futura;
- negocio parado;
- negocio sem responsavel;
- conversa vinculada;
- atendente responsavel.

### 4.4 Fluxo de assumir

- [x] "Assumir conversa" e "Assumir negocio" (inbox)
- [x] "Assumir ambos" quando chat e negocio vinculados estao no pool (`inbox-claim-both`)

Quando chat e CRM estiverem vinculados, preferir acao atomica para evitar conversa com A e negocio com B sem querer.

### 4.5 Transferencia segura

Fluxo recomendado:

- gestor escolhe atendente destino;
- informa motivo opcional;
- sistema grava `chat_transfers`;
- se houver negocio vinculado e sincronizacao ativa, atualiza responsavel do CRM;
- notifica destino.

## Fase 5: Testes automatizados

### 5.1 Testes unitarios

Expandir testes de:

- `negotiation-assignee`
- `sale-rules`
- `ai-business-rules`
- filtros de inbox;
- permissao por role.

### 5.2 Testes de API/RLS

Script SQL de validacao: `supabase/tests/rls_multi_attendant_validation.sql` (rodar com `supabase db query --linked` apos seed manual).

Pendente — **somente manual** com JWT de sessao real:

- [ ] login como atendente A;
- [ ] tentar ler chat de B;
- [ ] tentar buscar mensagens de B;
- [ ] tentar enviar mensagem em chat de B;
- [ ] tentar atualizar CRM de B;
- [ ] tentar deletar tarefa de CRM de B;
- [ ] validar gestor com acesso amplo.

### 5.3 Testes E2E Playwright

Implementados em `e2e/multi-attendant-inbox.spec.ts` (mock `VITE_E2E_MOCK_AUTH`):

- [x] atendente A ve apenas conversa propria;
- [x] atendente A: deep link de B bloqueado (`inbox-chat-blocked`);
- [x] gestor ve pool, A e B;
- [x] gestor: banner fila sem responsavel;
- [x] gestor: **Assumir ambos** no chat pool com negocio vinculado (mock).

Pendentes (exigem Supabase ou mock de RPC):

- [ ] gestor transfere conversa de A para B; B responde; A deixa de ver;
- [ ] gestor devolve negocio ao pool;
- [ ] venda so com responsavel correto (fluxo completo).

### 5.4 Testes de regressao SQL

Criar um arquivo de validacao com queries de policies:

- policies esperadas existem;
- funcoes esperadas existem;
- roles e permissoes batem com matriz;
- tabelas sensiveis possuem RLS habilitado.

## Fase 6: Operacao, deploy e auditoria

### 6.1 Organizar historico de migrations

As migrations foram aplicadas via:

```bash
supabase db query --linked -f supabase/migrations/20260616180000_tighten_chat_crm_attendant_guards.sql
supabase db query --linked -f supabase/migrations/20260617170000_tighten_remaining_multi_attendant_edges.sql
```

Isso aplica o SQL, mas pode nao registrar as migrations no historico remoto como `db push`.

Acao recomendada:

- confirmar estrategia de migrations do projeto;
- evitar rodar `supabase db push` enquanto o historico local/remoto estiver divergente;
- documentar que esta migration ja foi aplicada manualmente;
- se necessario, registrar equivalente no fluxo oficial de release.

### 6.2 Deploy de Edge Functions

Confirmar sempre:

```bash
cat supabase/.temp/project-ref
```

Deve retornar:

```text
oaqeabqfgbeprrgqdmsk
```

Deploy correto:

```bash
supabase functions deploy uazapi-send-message
```

### 6.3 Projeto Supabase errado

Foi feito um deploy acidental de `uazapi-send-message` no projeto:

```text
tcamppydxvmkxhxveeaf
```

Acao:

- confirmar se esse projeto e usado;
- se for usado por outro produto, redeployar a versao correta daquele produto;
- se nao for usado, apenas registrar o ocorrido.

### 6.4 Auditoria de producao

Criar checklist semanal:

- revisar usuarios com role `admin` e `operacao`;
- revisar atendentes inativos ainda com chats;
- revisar chats sem responsavel;
- revisar negocios sem responsavel;
- revisar function logs de envio negado;
- revisar erros de RLS no frontend.

## Fase 7: Melhorias de produto

### 7.1 Distribuicao automatica

Completar round-robin:

- distribuir por menor carga;
- ignorar atendente offline/inativo;
- respeitar horario de atendimento;
- limitar numero maximo de chats por atendente;
- logar motivo `auto_round_robin`.

### 7.2 SLA e produtividade

Indicadores:

- tempo ate primeira resposta;
- tempo medio de resolucao;
- conversas abertas por atendente;
- conversas resolvidas;
- conversas perdidas;
- vendas por atendente;
- taxa de conversao por funil.

### 7.3 Notificacoes

Adicionar:

- nova conversa atribuida;
- transferencia recebida;
- lead sem tarefa;
- lead parado;
- mensagem nova em chat proprio;
- SLA prestes a vencer.

### 7.4 Auditoria humana vs IA

Garantir:

- IA nao responde chat com atendente;
- IA nao responde negocio assumido;
- handoff grava historico;
- gestor consegue ver porque a IA foi bloqueada.

## Criterios de aceite final

O CRM e Chat podem ser considerados completos quando:

- [ ] Atendente A nao consegue ler, responder ou alterar dados de B por UI, URL ou API. *(E2E mock + RLS no banco; falta validar manual/API com JWT real)*
- [ ] Gestor consegue ver, transferir e auditar todos os atendimentos. *(E2E mock lista OK; falta checklist manual)*
- [ ] Financeiro tem permissao definida e validada. *(padrao no codigo/RLS; falta decisao + teste manual)*
- [x] Chat, mensagens, CRM, tarefas, notas, tags, documentos seguem matriz no banco (migrations aplicadas).
- [x] Venda e devolucao exigem responsavel correto (regras + `sale-rules` testados).
- [x] IA respeita handoff e responsavel humano (`ai-business-rules` testados).
- [x] Testes automatizados cobrindo dois atendentes e gestor (unit + 5 E2E mock inbox).
- [x] Fluxo deploy/migration documentado neste arquivo e comandos abaixo.
- [ ] Logs e auditoria permitem investigar transferencias e bloqueios (Fase 6.4 / 7).

## Ordem recomendada de execucao

1. Validar manualmente com atendente A, atendente B e gestor.
2. Decidir papel de financeiro e se existe role `gestor`.
3. Revisar bordas: notas, tags, documentos, historico e relatorios.
4. Ajustar UX de gestor, pool e transferencia.
5. Criar testes E2E de multiplos atendentes.
6. Organizar historico de migrations.
7. Adicionar monitoramento/auditoria operacional.

## Comandos uteis

Confirmar projeto correto:

```bash
cat supabase/.temp/project-ref
```

Aplicar SQL pontual:

```bash
supabase db query --linked -f supabase/migrations/20260616180000_tighten_chat_crm_attendant_guards.sql
```

Deploy da function de envio:

```bash
supabase functions deploy uazapi-send-message
```

Validar policies aplicadas:

```bash
supabase db query --linked "select schemaname, tablename, policyname, cmd from pg_policies where schemaname = 'public' and tablename in ('whatsapp_chats','whatsapp_messages','crm_negotiations','crm_tasks') order by tablename, policyname"
```

Rodar testes relevantes:

```bash
npm test -- --run src/lib/crm/negotiation-assignee.test.ts src/lib/crm/sale-rules.test.ts src/lib/crm/ai-business-rules.test.ts src/lib/api/whatsapp.test.ts src/lib/inbox-e2e.test.ts
npx playwright test e2e/multi-attendant-inbox.spec.ts
```

Build:

```bash
npm run build
```
