const BASE_FAQ = [
  {
    id: "1",
    question: "Quanto tempo leva para configurar o wChat?",
    answer:
      "A maioria dos times conecta o WhatsApp e começa a atender no mesmo dia. O CRM, inbox e automações básicas ficam prontos em poucos minutos, sem necessidade de desenvolvedor.",
    open: false,
  },
  {
    id: "2",
    question: "Como funciona o inbox compartilhado?",
    answer:
      "Vários atendentes usam o mesmo número oficial. As conversas entram em fila, recebem etiquetas e podem ser distribuídas por regras — com histórico único e visível para todo o time.",
    open: true,
  },
  {
    id: "3",
    question: "Preciso da API oficial do WhatsApp?",
    answer:
      "Sim, o wChat trabalha com a API oficial do WhatsApp Business. Ajudamos na configuração do número e dos templates HSM para campanhas.",
    open: false,
  },
  {
    id: "4",
    question: "Posso integrar com meu CRM ou ERP?",
    answer:
      "Sim. Via API REST, webhooks e conectores como N8N você sincroniza negociações, contatos e eventos com as ferramentas que já usa.",
    open: false,
  },
  {
    id: "5",
    question: "Existe período de teste gratuito?",
    answer:
      "Sim — 7 dias grátis, sem cartão de crédito. Você testa CRM, inbox, automações e IA antes de escolher um plano.",
    open: false,
  },
];

export const FAQ_ITEMS = BASE_FAQ;

export const FAQ_PAGE_ITEMS = [
  ...BASE_FAQ.map((item) => ({ ...item, open: false })),
  {
    id: "6",
    question: "Quantos atendentes posso ter no mesmo número?",
    answer:
      "Depende do plano. O Starter inclui até 3 usuários; Times e Business permitem escalar o time com filas e permissões por função.",
    open: false,
  },
  {
    id: "7",
    question: "O agente de IA substitui meu time?",
    answer:
      "Não. A IA qualifica e responde no primeiro contato; quando o lead está pronto ou pede ajuda humana, a conversa é transferida para um atendente.",
    open: false,
  },
  {
    id: "8",
    question: "Meus dados ficam seguros?",
    answer:
      "Sim. Utilizamos criptografia em trânsito, backups automáticos e controles de acesso por usuário. Você mantém a propriedade dos seus contatos e conversas.",
    open: false,
  },
];
