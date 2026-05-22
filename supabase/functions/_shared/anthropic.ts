// Cliente mínimo da Messages API da Anthropic via fetch (Deno edge function).
// Sem SDK — mesmo padrão do gerador de formulários (ai-form-generator.ts).

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_VERSION = "2023-06-01";

export type CacheControl = { type: "ephemeral" };

export type AnthropicSystemBlock = {
  type: "text";
  text: string;
  cache_control?: CacheControl;
};

export type AnthropicTool = {
  name: string;
  description: string;
  input_schema: Record<string, unknown>;
  cache_control?: CacheControl;
};

export type AnthropicContentBlock = {
  type: string;
  // tool_use
  id?: string;
  name?: string;
  input?: Record<string, unknown>;
  // text
  text?: string;
  [key: string]: unknown;
};

export type AnthropicMessage = {
  role: "user" | "assistant";
  content: string | AnthropicContentBlock[];
};

export type AnthropicUsage = {
  input_tokens: number;
  output_tokens: number;
  cache_creation_input_tokens?: number;
  cache_read_input_tokens?: number;
};

export type AnthropicResponse = {
  id: string;
  stop_reason: string | null;
  content: AnthropicContentBlock[];
  usage: AnthropicUsage;
};

export type CreateMessageInput = {
  model: string;
  maxTokens: number;
  system: AnthropicSystemBlock[];
  tools: AnthropicTool[];
  messages: AnthropicMessage[];
};

/** Uma chamada POST /v1/messages. Lança em status != 2xx. */
export async function createMessage(input: CreateMessageInput): Promise<AnthropicResponse> {
  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY not configured");
  }

  const res = await fetch(ANTHROPIC_API_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": ANTHROPIC_VERSION,
    },
    body: JSON.stringify({
      model: input.model,
      max_tokens: input.maxTokens,
      // Resposta de chat: rápido e barato. (Adaptive thinking pode entrar numa fase futura.)
      thinking: { type: "disabled" },
      system: input.system,
      tools: input.tools,
      messages: input.messages,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Anthropic API ${res.status}: ${errText}`);
  }

  return (await res.json()) as AnthropicResponse;
}
