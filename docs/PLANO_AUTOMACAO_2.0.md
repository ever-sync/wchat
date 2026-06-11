# Plano completo — Automação 2.0 (Marketing & Vendas)

> Documento de planejamento da nova aba **Automação 2.0** em Marketing.
> Foco: evoluir o construtor de fluxos atual para uma plataforma de automação
> de **marketing + vendas** competitiva com o mercado (HubSpot, ActiveCampaign,
> RD Station, Kommo, Salesloft), porém **WhatsApp-first**.

---

## 1. Visão

Um único lugar onde marketing e vendas desenham, executam e medem automações
que conversam com o lead pelo WhatsApp, movem o negócio no funil e acionam o
time — com IA no meio e métricas em cada passo.

Princípio-guia: **não copiar a complexidade do n8n** (dados/expressões por nó,
que afugentam o usuário de marketing). Copiar o **modelo** das plataformas de
CRM (jornada visual + regras por etapa + cadência), com ações que executam de
verdade.

---

## 2. Estado atual (ancorado no código)

### Já existe e funciona
- **Canvas visual** (React Flow) em `FlowCanvas.tsx` — com o polimento recente:
  edição de ramo inline (sem `window.prompt`), undo/redo, duplicar nó, estado de
  erro no nó, arestas de ramo coloridas.
- **Editor** `MarketingFlowEditor.tsx` — paleta, validação, simulador, publicação.
- **Worker** `supabase/functions/marketing-flow-worker` — claim atômico, retry
  com backoff, idempotência por step, dead-letter agora **visível** via webhook.
- **Gatilhos** (`flow-triggers.ts`): `manual`, `whatsapp_message_received`,
  `chat_assigned`, `ai_paused`, `ai_resumed`, `form_submitted`, `tag_added`,
  `tag_removed`, `negotiation_created`, **`negotiation_stage_changed`**,
  `webhook_received`.
- **Lead scoring** (`lib/crm/lead-score`) e **funil/pipeline** de vendas (kanban).
- **23 ações executáveis** no worker: espera, webhook, criar-tarefa, add/remove
  tag, whatsapp, email, criar/mover negociação, dividir-caminho,
  dividir-por-segmentação, add/remove de outros fluxos, teste-ab,
  esperar-condição, mensagem-inteligente, unir-caminho, definir-variável,
  atualizar nome/status, adicionar-anotação, marcar-venda, classificar-ia.

### Gaps (o que falta para ser "completo")
1. **~28 ações na paleta não executam** (51 na paleta, 23 com executor) — viram
   o aviso âmbar "sem executor". Armadilha de UX: o usuário monta e metade não roda.
2. **Falta o essencial WhatsApp-native**: template/HSM oficial (fora da janela de
   24h), botões/listas interativas, **esperar resposta do lead**, transferir para
   humano, horário comercial.
3. **Sem analytics por nó** — não dá pra ver quantos entraram/converteram/caíram
   em cada passo.
4. **Sem metas (goals) e supressão/opt-out de primeira classe**.
5. **Sem cadência de vendas** (sequência de toques com tarefa manual para o SDR).
6. **Paleta herdada do RD Station** (categoria "RD Station CRM", "Zapier") em vez
   de orientada ao WhatsApp/wChat.

---

## 3. Princípios de design

1. **Tudo que aparece, executa.** Nada de nó decorativo. Itens futuros ficam
   numa seção "Em breve" claramente separada.
2. **WhatsApp-first.** Os nós mais ricos são os de conversa no WhatsApp.
3. **Três paradigmas, um motor.** Jornada (canvas), regra por etapa do funil e
   cadência de vendas — todos disparam o mesmo worker.
4. **Medir é parte do produto.** Cada nó tem contadores; cada fluxo tem funil.
5. **Seguro por padrão.** Opt-out respeitado, horário comercial, limite de envio,
   sem duplicação (idempotência já garantida no worker).

---

## 4. Arquitetura

```
            ┌─────────────── Aba "Automação 2.0" ───────────────┐
            │  Lista de fluxos · Templates · Canvas · Analytics  │
            └───────────────────────┬────────────────────────────┘
                                    │ publica (versão imutável)
                                    ▼
   GATILHO ──► [CONDIÇÃO/RAMO] ──► AÇÃO ──► ESPERA ──► … ──► META
      │                                                        │
  (comportamento, dados, etapa do funil,            (converteu? sai)
   tempo, formulário, webhook, lead score)          (opt-out? suprime)
                                    │
                                    ▼
                 marketing-flow-worker (cron 1min)
        claim atômico · retry/backoff · idempotência · dead-letter
                                    │
              ┌─────────────┬───────┴───────┬──────────────┐
              ▼             ▼               ▼              ▼
          WhatsApp        CRM            IA            Webhook/
          (uazapi)     (negócio,      (classifica,    integrações
                        tarefa)       responde)
```

Componentes a adicionar:
- `marketing_flow_node_stats` (tabela) — contadores por nó/versão.
- Executores novos no worker (ver §5).
- `useFlowAnalytics` no front — lê os contadores e desenha o funil.

---

## 5. Catálogo completo (com status)

Legenda: ✅ já executa · 🔶 existe na paleta sem executor · 🆕 novo

### 5.1 Gatilhos
| Gatilho | Status | Uso |
|---|---|---|
| Mensagem recebida no WhatsApp | ✅ | palavra-chave, tipo, origem |
| Mudou de etapa no funil | ✅ | **modelo Kommo** — vendas |
| Negócio criado | ✅ | |
| Tag adicionada/removida | ✅ | |
| Formulário enviado | ✅ | |
| Chat atribuído / IA pausada/retomada | ✅ | |
| Webhook recebido | ✅ | entrada externa |
| Manual / em massa | ✅ | |
| **Lead score cruzou limiar** | 🆕 | virou quente → dispara |
| **Data/agendado** (aniversário, X dias após) | 🆕 | nutrição temporal |
| **Negócio ganho/perdido** | 🆕 | pós-venda / reativação |

### 5.2 Condições e ramos
| Bloco | Status |
|---|---|
| Dividir caminho (sim/não, segmentação) | ✅ |
| Esperar até condição | ✅ |
| Teste A/B | ✅ |
| Unir caminho | ✅ |
| **Split por lead score** | 🆕 |
| **Branch por resposta do lead** (botão clicado) | 🆕 |

### 5.3 Ações — Comunicação WhatsApp (o coração)
| Ação | Status |
|---|---|
| Enviar WhatsApp (texto livre, dentro da janela) | ✅ |
| Mensagem Inteligente (IA) | ✅ |
| **Enviar template/HSM oficial** (fora da janela 24h) | 🆕 |
| **Botões / lista interativa** | 🆕 |
| **Esperar resposta do lead** (captura clique/texto) | 🆕 |
| **Transferir para humano / fila** | 🆕 |
| Enviar email | ✅ |
| Enviar SMS | 🔶 |

### 5.4 Ações — IA
| Ação | Status |
|---|---|
| Classificar com IA | ✅ |
| **Qualificar lead via bot (perguntas)** | 🆕 |
| **Resumir conversa / extrair dados** | 🆕 |

### 5.5 Ações — CRM / Vendas
| Ação | Status |
|---|---|
| Criar / mover negociação | ✅ |
| Criar tarefa na negociação | ✅ |
| Atualizar status / nome / anotação | ✅ |
| Marcar venda | ✅ |
| **Atribuir vendedor (round-robin / pool)** | 🆕 (há auto-assign no CRM, falta nó) |
| **Agendar reunião / lembrete** | 🆕 |

### 5.6 Ações — Gerenciar lead / Roteamento
| Ação | Status |
|---|---|
| Add / remover tag | ✅ |
| Definir variável | ✅ |
| Add / remover de outro fluxo | ✅ |
| **Opt-out / suprimir canal** | 🆕 (tabela `marketing_flow_suppressions` já existe) |
| Notificar responsável | 🔶 |

### 5.7 Timing e metas
| Bloco | Status |
|---|---|
| Espera (dias/horas) | ✅ |
| **Esperar até horário comercial / janela de envio** | 🆕 |
| **Meta (goal): sai se converteu** | 🆕 |
| **Limite de envio (throttle)** | 🆕 |

---

## 6. UX da aba Automação 2.0

Telas:
1. **Início / Lista de fluxos** — cards de fluxos (ativos/rascunho/pausado) com
   métricas-resumo (em jornada, convertidos, falhas). Botão "Novo fluxo".
2. **Galeria de templates** — boas-vindas, recuperação de orçamento, reativação
   de frio, pós-venda, qualificação por bot. Clicar = clona o fluxo pronto.
3. **Canvas** (o editor atual, evoluído) — paleta reorganizada por família
   (Comunicação WhatsApp no topo), seção "Em breve" separada.
4. **Painel do fluxo (Analytics)** — funil da automação: entraram → cada passo →
   convertidos / caíram; lista de quem está parado e por quê (usa os
   `marketing_flow_events` que o worker já grava).

---

## 7. Observabilidade e analytics

- **Funil por nó**: contar `step_started`/`step_completed`/`step_failed` por nó.
- **Por que parou**: timeline do participante (eventos já existem).
- **Dead-letter visível**: evento `marketing_flow.failed` (já implementado) +
  alerta no painel quando N leads morrem em 1h.
- **Atribuição**: marcar conversão (goal) e ligar à receita do CRM.

---

## 8. Roadmap por release

### v2.0 — Fundação WhatsApp-native (maior valor, destrava o resto)
- Nós: **template/HSM**, **botões/lista interativa**, **esperar resposta**,
  **transferir para humano**, **horário comercial**.
- Limpeza: esconder/“em breve” os ~28 nós sem executor; reorganizar paleta por
  família com Comunicação WhatsApp no topo.
- Gatilho de etapa do funil em destaque (já existe) com template "mudou de etapa → WhatsApp".

### v2.1 — Vendas (modelo Kommo + cadência)
- **Cadência de vendas**: sequência de toques (WhatsApp → email → ligação) com
  **tarefa manual** para o vendedor entre passos.
- Nó **atribuir vendedor** (round-robin/pool) e **agendar reunião**.
- Gatilhos novos: **lead score cruzou limiar**, **negócio ganho/perdido**.

### v2.2 — Medição e otimização
- **Analytics por nó** (funil da automação) + painel do fluxo.
- **Metas/goals** + **supressão/opt-out** de primeira classe.
- **Galeria de templates** prontos.

### v2.3 — Inteligência e escala
- **Bot de qualificação** por IA (perguntas → preenche campos → roteia).
- **Throttle / janela de envio** e otimização de horário por IA.
- **Split por lead score** e branch por resposta.

---

## 9. Métricas de sucesso
- % de fluxos publicados sem nó "sem executor" (meta: 100% após v2.0).
- Taxa de conclusão dos fluxos (entraram → meta).
- Tempo de resposta no WhatsApp via automação.
- Receita atribuída a automações (via marcar-venda + goal).
- Redução de leads "presos" (dead-letter) por mês.

---

## 10. Riscos e mitigação
- **Política do WhatsApp (HSM/janela 24h)**: o nó de template precisa validar
  template aprovado e janela; senão a mensagem falha silenciosamente. → validação
  no editor + pré-send check (já existe `marketing_flow_pre_send_check`).
- **Prop drilling no editor**: a evolução do canvas deve agrupar estado em hooks
  (lição da refatoração do CRM) antes de inchar.
- **Custo de IA**: nós de IA consomem créditos — expor custo estimado no nó.
- **Duplicação de envio**: já mitigado (idempotência + claim atômico no worker).

---

## 11. Próximo passo concreto
Começar a **v2.0** pelo nó **"Esperar resposta do lead"** + **"Botões interativos"**
— juntos eles transformam o fluxo de "disparo" em "conversa", que é o pulo do gato
do WhatsApp. Em seguida, template/HSM e transferir para humano.
