import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationOptions,
  type UseQueryOptions,
} from "@tanstack/react-query";
import { invokeAuthedFunction } from "@/lib/api/functions";
import { getCurrentTenantId } from "@/lib/api/tenant";
import { isSupabaseConfigured, requireSupabase } from "@/lib/supabase";

// ---------------------------------------------------------------------------
// Config do agente (tenant_ai_config)
// ---------------------------------------------------------------------------

export type AiProvider = "off" | "n8n" | "native";
export type LlmProvider = "anthropic" | "openai";

export type TenantAiConfig = {
  provider: AiProvider;
  llmProvider: LlmProvider;
  model: string;
  systemPrompt: string;
  debounceSeconds: number;
  maxOutputTokens: number;
  monthlyTokenLimit: number | null;
};

export const DEFAULT_AI_CONFIG: TenantAiConfig = {
  provider: "off",
  llmProvider: "anthropic",
  model: "claude-sonnet-4-6",
  systemPrompt: "",
  debounceSeconds: 8,
  maxOutputTokens: 1024,
  monthlyTokenLimit: null,
};

const CONFIG_KEY = ["tenant-ai-config"] as const;
const USAGE_KEY = ["ai-usage-month"] as const;
const KNOWLEDGE_KEY = ["ai-knowledge-sources"] as const;
const TURNS_KEY = ["ai-turns"] as const;
const CHANNELS_KEY = ["ai-channels"] as const;

export async function fetchTenantAiConfig(): Promise<TenantAiConfig> {
  if (!isSupabaseConfigured) return DEFAULT_AI_CONFIG;
  const supabase = requireSupabase();
  const tenantId = await getCurrentTenantId();
  const { data, error } = await supabase
    .from("tenant_ai_config")
    .select("provider, llm_provider, model, system_prompt, debounce_seconds, max_output_tokens, monthly_token_limit")
    .eq("tenant_id", tenantId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return DEFAULT_AI_CONFIG;
  return {
    provider: (data.provider as AiProvider) ?? "off",
    llmProvider: data.llm_provider === "openai" ? "openai" : "anthropic",
    model: data.model ?? DEFAULT_AI_CONFIG.model,
    systemPrompt: data.system_prompt ?? "",
    debounceSeconds: data.debounce_seconds ?? DEFAULT_AI_CONFIG.debounceSeconds,
    maxOutputTokens: data.max_output_tokens ?? DEFAULT_AI_CONFIG.maxOutputTokens,
    monthlyTokenLimit: data.monthly_token_limit ?? null,
  };
}

export async function upsertTenantAiConfig(input: TenantAiConfig): Promise<void> {
  if (!isSupabaseConfigured) throw new Error("Supabase não configurado.");
  const supabase = requireSupabase();
  const tenantId = await getCurrentTenantId();
  const { error } = await supabase.from("tenant_ai_config").upsert(
    {
      tenant_id: tenantId,
      provider: input.provider,
      llm_provider: input.llmProvider,
      model: input.model.trim() || DEFAULT_AI_CONFIG.model,
      system_prompt: input.systemPrompt.trim() || null,
      debounce_seconds: input.debounceSeconds,
      max_output_tokens: input.maxOutputTokens,
      monthly_token_limit: input.monthlyTokenLimit,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "tenant_id" },
  );
  if (error) throw new Error(error.message);
}

export function useTenantAiConfig(
  options?: Omit<UseQueryOptions<TenantAiConfig, Error>, "queryKey" | "queryFn">,
) {
  return useQuery({ queryKey: CONFIG_KEY, queryFn: fetchTenantAiConfig, staleTime: 60_000, ...options });
}

export function useUpsertTenantAiConfig(options?: UseMutationOptions<void, Error, TenantAiConfig>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: upsertTenantAiConfig,
    ...options,
    onSuccess: async (data, variables, context) => {
      await queryClient.invalidateQueries({ queryKey: CONFIG_KEY });
      await options?.onSuccess?.(data, variables, context);
    },
  });
}

// ---------------------------------------------------------------------------
// Base de conhecimento (edge function ai-knowledge)
// ---------------------------------------------------------------------------

export type KnowledgeSource = {
  id: string;
  title: string;
  kind: string;
  created_at: string;
};

export async function listKnowledgeSources(): Promise<KnowledgeSource[]> {
  const res = await invokeAuthedFunction<{ sources: KnowledgeSource[] }>("ai-knowledge", undefined, "GET");
  return res.sources ?? [];
}

export async function addKnowledgeSource(input: { title: string; content: string }): Promise<void> {
  await invokeAuthedFunction("ai-knowledge", input, "POST");
}

export async function deleteKnowledgeSource(id: string): Promise<void> {
  await invokeAuthedFunction(`ai-knowledge?source_id=${encodeURIComponent(id)}`, undefined, "DELETE");
}

export function useKnowledgeSources(
  options?: Omit<UseQueryOptions<KnowledgeSource[], Error>, "queryKey" | "queryFn">,
) {
  return useQuery({ queryKey: KNOWLEDGE_KEY, queryFn: listKnowledgeSources, staleTime: 30_000, ...options });
}

export function useAddKnowledgeSource(
  options?: UseMutationOptions<void, Error, { title: string; content: string }>,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: addKnowledgeSource,
    ...options,
    onSuccess: async (data, variables, context) => {
      await queryClient.invalidateQueries({ queryKey: KNOWLEDGE_KEY });
      await options?.onSuccess?.(data, variables, context);
    },
  });
}

export function useDeleteKnowledgeSource(options?: UseMutationOptions<void, Error, string>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteKnowledgeSource,
    ...options,
    onSuccess: async (data, variables, context) => {
      await queryClient.invalidateQueries({ queryKey: KNOWLEDGE_KEY });
      await options?.onSuccess?.(data, variables, context);
    },
  });
}

// ---------------------------------------------------------------------------
// Atividade / consumo (ai_usage)
// ---------------------------------------------------------------------------

export type AiUsageSummary = {
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  messages: number;
};

export async function fetchAiUsageThisMonth(): Promise<AiUsageSummary> {
  const empty: AiUsageSummary = { inputTokens: 0, outputTokens: 0, cacheReadTokens: 0, messages: 0 };
  if (!isSupabaseConfigured) return empty;
  const supabase = requireSupabase();
  const tenantId = await getCurrentTenantId();
  const monthStart = new Date();
  monthStart.setUTCDate(1);
  monthStart.setUTCHours(0, 0, 0, 0);
  const { data, error } = await supabase
    .from("ai_usage")
    .select("input_tokens, output_tokens, cache_read_tokens")
    .eq("tenant_id", tenantId)
    .gte("created_at", monthStart.toISOString());
  if (error) throw new Error(error.message);
  const rows = data ?? [];
  return rows.reduce<AiUsageSummary>(
    (acc, r) => ({
      inputTokens: acc.inputTokens + (r.input_tokens ?? 0),
      outputTokens: acc.outputTokens + (r.output_tokens ?? 0),
      cacheReadTokens: acc.cacheReadTokens + (r.cache_read_tokens ?? 0),
      messages: acc.messages + 1,
    }),
    empty,
  );
}

export function useAiUsageThisMonth(
  options?: Omit<UseQueryOptions<AiUsageSummary, Error>, "queryKey" | "queryFn">,
) {
  return useQuery({ queryKey: USAGE_KEY, queryFn: fetchAiUsageThisMonth, staleTime: 60_000, ...options });
}

// ---------------------------------------------------------------------------
// Observabilidade — turnos da IA (ai_turns)
// ---------------------------------------------------------------------------

export type AiTurnRetrieved = { content: string; similarity: number };

export type AiTurn = {
  id: string;
  created_at: string;
  user_message: string | null;
  reply: string | null;
  retrieved: AiTurnRetrieved[];
  tools: Array<{ name?: string; is_error?: boolean }>;
  stop_reason: string | null;
  input_tokens: number;
  output_tokens: number;
};

export async function fetchAiTurns(): Promise<AiTurn[]> {
  if (!isSupabaseConfigured) return [];
  const supabase = requireSupabase();
  const tenantId = await getCurrentTenantId();
  const { data, error } = await supabase
    .from("ai_turns")
    .select("id, created_at, user_message, reply, retrieved, tools, stop_reason, input_tokens, output_tokens")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false })
    .limit(20);
  if (error) throw new Error(error.message);
  return (data ?? []) as AiTurn[];
}

export function useAiTurns(options?: Omit<UseQueryOptions<AiTurn[], Error>, "queryKey" | "queryFn">) {
  return useQuery({ queryKey: TURNS_KEY, queryFn: fetchAiTurns, staleTime: 15_000, ...options });
}

// ---------------------------------------------------------------------------
// Canais (IA por instância de WhatsApp)
// ---------------------------------------------------------------------------

export type AiDefaultMode = "qualifying" | "full";

export type AiChannel = {
  id: string;
  display_name: string;
  phone_number: string | null;
  status: string;
  ai_enabled: boolean;
  ai_default_mode: AiDefaultMode;
  ai_persona: string | null;
};

export type AiChannelPatch = {
  ai_enabled?: boolean;
  ai_default_mode?: AiDefaultMode;
  ai_persona?: string | null;
};

export async function listAiChannels(): Promise<AiChannel[]> {
  if (!isSupabaseConfigured) return [];
  const supabase = requireSupabase();
  const tenantId = await getCurrentTenantId();
  const { data, error } = await supabase
    .from("whatsapp_instances")
    .select("id, display_name, phone_number, status, ai_enabled, ai_default_mode, ai_persona")
    .eq("tenant_id", tenantId)
    .is("archived_at", null)
    .order("display_name", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as AiChannel[];
}

export async function updateAiChannel(id: string, patch: AiChannelPatch): Promise<void> {
  if (!isSupabaseConfigured) throw new Error("Supabase não configurado.");
  const supabase = requireSupabase();
  const tenantId = await getCurrentTenantId();
  const { error } = await supabase.from("whatsapp_instances").update(patch).eq("tenant_id", tenantId).eq("id", id);
  if (error) throw new Error(error.message);
}

export function useAiChannels(options?: Omit<UseQueryOptions<AiChannel[], Error>, "queryKey" | "queryFn">) {
  return useQuery({ queryKey: CHANNELS_KEY, queryFn: listAiChannels, staleTime: 30_000, ...options });
}

export function useUpdateAiChannel(
  options?: UseMutationOptions<void, Error, { id: string; patch: AiChannelPatch }>,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: AiChannelPatch }) => updateAiChannel(id, patch),
    ...options,
    onSuccess: async (data, variables, context) => {
      await queryClient.invalidateQueries({ queryKey: CHANNELS_KEY });
      await options?.onSuccess?.(data, variables, context);
    },
  });
}
