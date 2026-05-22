# Privacidade — Atendimento com Inteligência Artificial (modelo)

> **Aviso:** este é um **modelo** que descreve, de forma fiel, como a IA de atendimento
> funciona neste produto. **Não é aconselhamento jurídico.** Submeta a um advogado/DPO
> antes de publicar e adapte às suas bases legais, ao seu DPO e ao seu contexto.

---

## A) Trecho para a SUA política de privacidade (empresa → clientes)

**Uso de inteligência artificial no atendimento**

Para agilizar e melhorar o atendimento, parte das conversas conduzidas pelos nossos
canais (por exemplo, WhatsApp) pode ser processada por um **assistente de inteligência
artificial (IA)**. Esse assistente pode:

- ler e responder às mensagens da conversa;
- **transcrever mensagens de voz** (áudio) em texto para entender o pedido;
- **analisar imagens** que você enviar (por exemplo, a foto de um documento), quando
  necessárias ao atendimento;
- consultar uma **base de conhecimento** (informações sobre nossos produtos, serviços e
  políticas) para responder com precisão;
- registrar dados de cadastro e do atendimento (como nome, contato e o andamento da
  conversa) para dar continuidade ao atendimento.

**Dados tratados.** Conteúdo das mensagens (texto, áudio transcrito e imagens enviadas),
dados de contato e informações necessárias ao atendimento.

**Finalidade e base legal.** O tratamento ocorre para a **execução do atendimento e de
medidas pré-contratuais/contratuais** e com base no **legítimo interesse** de prestar um
atendimento eficiente, nos termos da LGPD (Lei nº 13.709/2018). Quando aplicável,
solicitaremos o seu **consentimento**.

**Decisões automatizadas.** A IA **auxilia** o atendimento e **encaminha para um atendente
humano** quando necessário; ela **não toma decisões com efeitos jurídicos relevantes sem
revisão humana**. Você pode solicitar atendimento humano a qualquer momento.

**Compartilhamento e transferência internacional.** Para operar a IA, utilizamos
provedores de tecnologia que podem processar os dados **fora do Brasil (ex.: Estados
Unidos)**, com salvaguardas contratuais adequadas. São eles, conforme a configuração:
provedores de **modelos de linguagem** (Anthropic e/ou OpenAI), de **transcrição de áudio**
(OpenAI) e de **indexação da base de conhecimento** (Voyage AI). Esses provedores atuam como
**operadores**, tratando os dados apenas para prestar o serviço.

**Retenção.** Os **registros das interações com a IA** (conteúdo e metadados do atendimento)
são mantidos por **até 90 dias** e, depois, **excluídos automaticamente**. Ao apagarmos uma
conversa, os registros de IA correspondentes também são **excluídos**.

**Seus direitos.** Você pode solicitar **acesso, correção, exclusão, portabilidade,
informação sobre compartilhamento e revisão de decisões automatizadas**, além de **revogar
consentimento**, pelos canais de contato do nosso Encarregado (DPO): **[e-mail/contato]**.

---

## B) Nota de sub-processadores (WChat → cliente/tenant)

Caso você seja um cliente que contrata o atendimento por IA, informamos os
**sub-processadores** acionados pelo recurso, conforme a sua configuração:

| Sub-processador | Finalidade | Local |
|---|---|---|
| **Anthropic** (Claude) | Modelo de linguagem (gerar respostas) | EUA |
| **OpenAI** | Modelo de linguagem (opcional) e transcrição de áudio | EUA |
| **Voyage AI** | Embeddings da base de conhecimento (busca semântica) | EUA |
| **Resend** | Envio de e-mails transacionais (alertas) | EUA |
| **Supabase** | Banco de dados e infraestrutura | conforme região do projeto |

**Tratamento e retenção pela plataforma:** o conteúdo das conversas e a transcrição de
áudios ficam disponíveis para a IA durante o atendimento; os **logs de interação** são
retidos por **até 90 dias** e excluídos automaticamente. A exclusão de uma conversa remove
os logs de IA associados (direito ao esquecimento).

**Recomendações de conformidade (checklist):**
- [ ] Revisão jurídica/DPO do texto acima.
- [ ] Atualizar o **Registro de Operações de Tratamento (ROPA)** com os sub-processadores.
- [ ] Firmar/atualizar **acordos de tratamento de dados (DPA)** com os provedores.
- [ ] Informar os titulares (ex.: mensagem de abertura no canal: "Você está sendo atendido
      por um assistente de IA; a conversa pode ser registrada para melhorar o atendimento").
- [ ] Definir o contato do **Encarregado (DPO)**.
