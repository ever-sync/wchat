# Plano-mestre — Automação 2.0 (Marketing & Vendas)

> Documento definitivo da nova aba **Automação 2.0** em Marketing.
> Consolida tudo que foi discutido: posicionamento, estado real do código,
> integração IA+chat+CRM+funções, catálogo de nós, modos de falha, roadmap.
> **WhatsApp-first.** Não é um clone de n8n.

---

## 0. Sumário executivo

O wChat já tem o **esqueleto** de uma plataforma de automação séria: canvas
visual, worker confiável, gatilhos ricos (incl. "mudou de etapa do funil"),
lead score, funil de vendas e IA. A Automação 2.0 transforma esse esqueleto em
**produto**: fecha os gaps WhatsApp-native, integra os quatro mundos no mesmo
fluxo, adiciona métricas por nó e blinda contra os modos de falha que banem
conta / geram spam.

**Tese:** *visual de canvas tipo n8n, cérebro de plataforma de automação de
vendas* — como ActiveCampaign/RD Station/Kommo fazem, sem a complexidade técnica
(dados/expressões por nó) que afugenta o usuário de marketing.

---

## 1. Posicionamento — por que NÃO é n8n

| n8n (integração técnica) | Automação 2.0 (marketing & vendas) |
|---|---|
| Dados JSON fluindo e inspecionáveis por nó | Um **lead** caminha pelo fluxo; sem JSON por nó |
| Expressões `{{ }}` (sintaxe de dev) | Configs em **formulário simples** |
| Centenas de integrações genéricas | **Paleta curada** WhatsApp/CRM/IA |
| Público: devs/ops | Público: marketing e vendas |

Régua: **"CRM (Kommo/RD/ManyChat) ←→ n8n"** → ficamos firmes no lado do CRM, com
canvas que *lembra* n8n na superfície.

---

## 2. O que JÁ foi entregue nesta frente (na `main`)

### Canvas (UX)
- Edição de ramo **inline** (sem `window.prompt`), com chips de sugestão.
- **Undo/redo** (Ctrl+Z / Ctrl+Shift+Z) + botões.
- **Duplicar nó**; estado de **erro no nó** (anel/ícone); arestas de ramo coloridas.

### Worker / confiabilidade
- **Dead-letter visível**: evento `marketing_flow.failed` quando um lead morre.
- **Claim atômico** + `idempotency_key` UNIQUE → sem envio duplicado.
- Migração do claim atômico do **webhook-dispatcher** (anti pega-dupla).
- Testes da lógica de retry/backoff rodando no CI.

### Marketing (estrutura)
- Aba **"Automação 2.0"** criada (`?aba=automacao-2`), pronta para receber o conteúdo deste plano.

---

## 3. Estado atual (ancorado no código)

### Gatilhos (`flow-triggers.ts`) — todos existem
`manual`, `whatsapp_message_received`, `chat_assigned`, `ai_paused`,
`ai_resumed`, `form_submitted` (**filtra por formulário + campo + valor + lead
novo/existente**), `tag_added`, `tag_removed`, `negotiation_created`,
**`negotiation_stage_changed`** (modelo Kommo), `webhook_received`.

### Ações — **23 executam de 51** na paleta
Executam: espera, webhook, criar-tarefa, add/remove tag, whatsapp, email,
criar/mover negociação, dividir-caminho, dividir-por-segmentação, add/remove de
outros fluxos, teste-ab, esperar-condição, mensagem-inteligente, unir-caminho,
definir-variável, atualizar nome/status, adicionar-anotação, marcar-venda,
classificar-ia.

### Infra que já protege
- `published_definition` **imutável** por versão (editar não quebra leads em voo).
- Tabela `marketing_flow_suppressions` (opt-out por canal) — existe, **subusada**.
- `marketing_flow_pre_send_check` (checagem antes de enviar).
- RLS multi-tenant + worker com `tenant_id` em toda query.

---

## 4. Os 4 mundos no mesmo fluxo (o diferencial vs RD)

| Mundo | No fluxo |
|---|---|
| **IA de atendimento** | Classificar com IA ✅ · Mensagem Inteligente ✅ · pausar/retomar IA (gatilhos) ✅ · transferir p/ humano 🆕 |
| **Chat (WhatsApp)** | Enviar mensagem ✅ · gatilho "mensagem recebida" ✅ · "chat atribuído" ✅ · esperar resposta 🆕 |
| **CRM** | Criar/mover negociação ✅ · tarefa ✅ · status/anotação ✅ · marcar venda ✅ · **definir estrelas** 🆕 |
| **Funções** | Webhook ✅ · definir variável ✅ · add/remover de outros fluxos ✅ |

Na RD a automação é separada do atendimento; aqui é **um motor só**.

---

## 5. Princípios de design

1. **Tudo que aparece, executa.** Itens futuros vão para "Em breve" separado.
2. **WhatsApp-first.** Os nós mais ricos são os de conversa.
3. **Três paradigmas, um motor:** jornada (canvas), regra por etapa do funil, cadência de vendas.
4. **Medir é parte do produto.** Contadores por nó; funil por fluxo.
5. **Seguro por padrão.** Opt-out, horário comercial, throttle, idempotência.

---

## 6. Arquitetura

```
        ┌────────────── Aba "Automação 2.0" ──────────────┐
        │  Lista de fluxos · Templates · Canvas · Analytics │
        └────────────────────────┬─────────────────────────┘
                                 │ publica (versão imutável)
                                 ▼
 GATILHO ─► [CONDIÇÃO/RAMO] ─► AÇÃO ─► ESPERA ─► … ─► META
    │                                                   │
 (comportamento, dados, etapa do funil,        (converteu? sai)
  tempo, formulário, webhook, lead score)      (opt-out? suprime)
                                 │
                                 ▼
               marketing-flow-worker (cron 1min)
      claim atômico · retry/backoff · idempotência · dead-letter
            │            │             │              │
         WhatsApp       CRM           IA          Webhook/
         (uazapi)    (negócio)   (classifica)    integrações
```

A construir: tabela `marketing_flow_node_stats` (contadores) · novos executores
(estrelas, template HSM, esperar-resposta, transferir-humano, opt-out, horário) ·
`useFlowAnalytics` no front.

---

## 7. Catálogo completo (com status)

Legenda: ✅ executa · 🔶 na paleta sem executor · 🆕 novo

### Gatilhos
Mensagem WhatsApp ✅ · **Mudou de etapa do funil** ✅ · Negócio criado ✅ ·
Tag add/remove ✅ · Formulário (filtra campo) ✅ · Chat atribuído ✅ ·
IA pausada/retomada ✅ · Webhook ✅ · Manual/massa ✅ ·
Lead score cruzou limiar 🆕 · Data/agendado 🆕 · Negócio ganho/perdido 🆕

### Condições / ramos
Dividir caminho ✅ · Esperar até condição ✅ · Teste A/B ✅ · Unir caminho ✅ ·
Split por lead score 🆕 · Branch por resposta do lead 🆕

### Ações — Comunicação WhatsApp
Enviar WhatsApp (janela) ✅ · Mensagem Inteligente (IA) ✅ · Email ✅ ·
**Template/HSM oficial** 🆕 · **Botões/lista interativa** 🆕 ·
**Esperar resposta do lead** 🆕 · **Transferir p/ humano** 🆕 · SMS 🔶

### Ações — IA
Classificar com IA ✅ · Qualificar via bot (perguntas) 🆕 · Resumir/extrair 🆕

### Ações — CRM / Vendas
Criar/mover negociação ✅ · Tarefa ✅ · Status/nome/anotação ✅ · Marcar venda ✅ ·
**Definir estrelas (qualificação)** 🆕 · Atribuir vendedor (round-robin) 🆕 ·
Agendar reunião 🆕

### Ações — Lead / Roteamento / Timing / Metas
Add/remover tag ✅ · Definir variável ✅ · Add/remover de outro fluxo ✅ ·
Espera ✅ · **Opt-out/suprimir** 🆕 · Notificar responsável 🔶 ·
**Horário comercial / janela** 🆕 · **Meta (goal): sai se converteu** 🆕 ·
**Throttle (limite/hora)** 🆕

---

## 8. Receita real — o fluxo da RD mapeado

> "Lead entra no formulário TAL, seleciona campo TAL → **ganha estrelas**, **entra
> no CRM**, **recebe mensagem**. Se não seguir os requisitos, nem entra no CRM nem
> recebe nada."

| Passo | Como fica | Status |
|---|---|---|
| Gatilho: form TAL + campo = valor | "Formulário enviado" com filtro `formIds`+`fieldName`/`fieldValue` | ✅ já existe |
| "Se não bate, nem entra" | O **gatilho filtra na entrada** — quem não bate não é inscrito (de graça) | ✅ já existe |
| Ganha estrelas | Nó "Definir qualificação" | 🆕 **gap** (campo existe, falta executor) |
| Entra no CRM | "Criar negociação" | ✅ executa |
| Recebe mensagem | "Enviar WhatsApp" / "Mensagem Inteligente" | ✅ executa |
| Ramo alternativo (entrou, campos diferentes) | "Dividir caminho" | ✅ executa |

**~90% já roda hoje.** Único bloqueio: o nó de **estrelas**. Será o **template
"Formulário qualificado → CRM + WhatsApp"** da galeria.

---

## 9. UX da aba

1. **Lista de fluxos** — cards com métricas-resumo (em jornada, convertidos, falhas).
2. **Galeria de templates** — boas-vindas, recuperação, reativação, pós-venda,
   qualificação por bot, e o "Formulário qualificado → CRM + WhatsApp".
3. **Canvas** (editor atual evoluído) — paleta por família, Comunicação WhatsApp
   no topo, "Em breve" separado.
4. **Painel do fluxo (Analytics)** — funil da automação + lista de "presos e por quê".

---

## 10. Observabilidade e analytics

- **Funil por nó**: contar `step_started`/`completed`/`failed` por nó/versão.
- **Por que parou**: timeline do participante (eventos já gravados).
- **Dead-letter**: evento `marketing_flow.failed` (feito) + alerta no painel se N falham/h.
- **Atribuição**: goal + receita do CRM (via marcar-venda).

---

## 11. Modos de falha (o que pode dar errado)

### 🔴 Crítico — risco de negócio
| Falha | Status | Mitigação |
|---|---|---|
| Banir instância do WhatsApp (spam/massa) | ❌ aberto | Throttle + só template fora da janela |
| Janela 24h (texto livre fora dela) | ⚠️ parcial | Nó template/HSM + validação |
| Opt-out ignorado (LGPD) | ⚠️ parcial | Tabela existe; falta nó + checagem em todo envio |
| Loop de mensagens (A↔B) | ❌ aberto | Limite de re-entrada + detecção de ciclo no publish |
| Telefone errado (E164) | ⚠️ parcial | Validação no pré-send |
| Fan-out em massa (10k jobs/min) | ❌ aberto | Throttle global + fila escalonada |

### 🟠 Execução
| Falha | Status |
|---|---|
| Envio duplicado | ✅ resolvido (claim atômico + idempotência) |
| Fluxo morre em silêncio | ✅ resolvido (evento failed) |
| **Job `running` órfão (worker morre)** | ⚠️ **a verificar** (flow-worker pega só `queued`) |
| Cron parado | ✅ coberto (heartbeat/alerts) |
| Nó "sem executor" publicado | ⚠️ parcial (validação avisa) |

### 🟡 IA / CRM / timing
| Falha | Status |
|---|---|
| Loop de tool-use sem timeout por iteração | ❌ aberto (gap no `ai-orchestrator`) |
| Estouro de créditos de IA em massa | ❌ aberto (expor custo no nó) |
| IA responde errado ao cliente | ⚠️ parcial (critique/circuit breaker) |
| **Negociação duplicada (card sintético)** | ⚠️ **a verificar** |
| Espera longa + lead já converteu | ❌ aberto (precisa goal/saída) |
| "Esperar até condição" que nunca ocorre | ❌ aberto (timeout máximo) |
| Horário comercial sem timezone do tenant | ❌ aberto |

### 🟢 Publicação / multi-tenant
Editar fluxo ativo ✅ (versão imutável) · Cross-tenant ✅ (RLS) ·
Webhook vazando PII ⚠️ (há `pii-redaction`, aplicar em tudo).

---

## 12. Roadmap por release

### v2.0 — Fundação WhatsApp-native + caso real
- Nós: **Esperar resposta do lead**, **Botões/lista interativa**, **Template/HSM**,
  **Transferir p/ humano**, **Horário comercial**.
- Nó **Definir estrelas (qualificação)** → fecha 100% do fluxo da RD.
- Limpeza: esconder/"em breve" os ~28 nós sem executor; paleta por família.
- **Template** "Formulário qualificado → CRM + WhatsApp" na galeria.
- Blindagem mínima: **opt-out** checado em todo envio + **throttle** básico.

### v2.1 — Vendas (Kommo + cadência)
- **Cadência** multicanal com tarefa manual para o vendedor.
- Nós **atribuir vendedor (round-robin/pool)** e **agendar reunião**.
- Gatilhos **lead score cruzou limiar** e **negócio ganho/perdido**.

### v2.2 — Medição e otimização
- **Analytics por nó** (funil) + painel do fluxo.
- **Metas/goals** + **supressão/opt-out** de primeira classe.
- **Galeria de templates** completa.

### v2.3 — Inteligência e escala
- **Bot de qualificação** por IA (perguntas → preenche campos → roteia).
- **Throttle/janela** avançado + otimização de horário por IA.
- **Split por lead score** e branch por resposta.

---

## 13. Métricas de sucesso
- 100% dos fluxos publicados sem nó "sem executor" (pós v2.0).
- Taxa de conclusão (entraram → meta).
- Tempo de resposta no WhatsApp via automação.
- Receita atribuída a automações.
- Redução de leads "presos" (dead-letter)/mês.

---

## 14. Riscos & compliance
- **Política WhatsApp (HSM/24h):** validar template aprovado + janela no editor.
- **LGPD:** opt-in/opt-out de primeira classe, respeitar STOP.
- **Custo de IA:** expor custo estimado por nó.
- **Prop drilling no editor:** agrupar estado em hooks antes de inchar (lição do CRM).

---

## 15. Dívidas / a verificar (confirmáveis no código)
1. O flow-worker **reivindica jobs `running` órfãos** (worker morto no meio)?
2. Materialização de **card sintético** pode **duplicar negociação**?
3. `ai-orchestrator` sem **timeout por iteração** no loop de tool-use.
4. Migração `20260629100000_webhook_deliveries_atomic_claim.sql` precisa ser
   **aplicada** (`npm run db:push`) para o dispatcher novo funcionar.
5. `main` tem **erros de `tsc`** herdados de commits de CRM de outra pessoa
   (`crm-kanban-card-accent.ts` etc.) — build passa, typecheck não.

---

## 16. Próximo passo concreto (recomendado)
1. **Nó "Definir estrelas (qualificação)"** — pequeno; destrava o fluxo real da RD.
2. **Nó "Esperar resposta do lead" + "Botões interativos"** — transforma disparo
   em conversa (a sensação "n8n sério" sem a complexidade).
3. **Template** "Formulário qualificado → CRM + WhatsApp" na galeria.

Esses três, juntos, entregam um caso de uso ponta-a-ponta visível e vendável já
na v2.0.
