import type { MessageType } from "@/types/domain";

export const MESSAGE_TYPE_LABELS: Array<{ value: Exclude<MessageType, "system">; label: string }> = [
  { value: "text", label: "Texto" },
  { value: "media", label: "Midia" },
  { value: "menu", label: "Menu" },
  { value: "poll", label: "Enquete" },
  { value: "location", label: "Localizacao" },
  { value: "contact", label: "Contato" },
  { value: "audio", label: "Audio" },
  { value: "document", label: "Documento" },
];

export const QUICK_EMOJIS = ["😀", "👍", "🙏", "✅", "🚚", "📦", "💬", "😉"];

export const INBOX_TEMPLATE_OPTIONS = [
  {
    id: "abertura-comercial",
    name: "Abertura comercial",
    subtitle: "Primeiro contato",
    body: "Olá! Tudo bem? Separei uma condição especial para você hoje. Posso te mostrar os valores disponíveis?",
  },
  {
    id: "followup-resposta",
    name: "Follow-up de resposta",
    subtitle: "Cliente ainda não respondeu",
    body: "Passando para reforçar minha mensagem anterior. Se quiser, eu te envio agora as condições atualizadas.",
  },
  {
    id: "reativacao",
    name: "Reativação",
    subtitle: "Cliente sem compra recente",
    body: "Percebi que você está sem pedido recente. Quer que eu te apresente uma condição para retomarmos o abastecimento?",
  },
  {
    id: "cobranca-amigavel",
    name: "Cobrança amigável",
    subtitle: "Lembrete cordial",
    body: "Olá! Tudo bem? Estou te chamando para alinhar uma pendência em aberto. Se preferir, posso te mandar o resumo por aqui.",
  },
] as const;
