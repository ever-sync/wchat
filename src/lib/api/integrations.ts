import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getCurrentTenantId } from "@/lib/api/tenant";
import { DEFAULT_STALE_NEGOTIATION_DAYS, normalizeStaleNegotiationDays } from "@/lib/crm/negotiation-alerts";
import { requireSupabase, isSupabaseConfigured } from "@/lib/supabase";

export type TenantIntegrations = {
  tenantId: string;
  n8nWebhookUrl: string | null;
  n8nSecret: string | null;
  n8nEnabled: boolean;
  n8nRateLimitPerMinute: number;
};

export type TenantSettings = {
  tenantId: string;
  syncAssigneeChatCrm: boolean;
  autoLeadOnInbound: boolean;
  autoAssignOnLead: boolean;
  defaultAiMode: "off" | "qualifying" | "full" | "handoff";
  /** Dias sem interação para alerta "Parado" no Kanban (1–90). */
  staleNegotiationDays: number;
};

function mapIntegrations(row: Record<string, unknown>): TenantIntegrations {
  return {
    tenantId: String(row.tenant_id ?? ""),
    n8nWebhookUrl: row.n8n_webhook_url != null ? String(row.n8n_webhook_url) : null,
    n8nSecret: row.n8n_secret != null ? String(row.n8n_secret) : null,
    n8nEnabled: Boolean(row.n8n_enabled),
    n8nRateLimitPerMinute: Number(row.n8n_rate_limit_per_minute ?? 30),
  };
}

function mapSettings(row: Record<string, unknown>): TenantSettings {
  return {
    tenantId: String(row.tenant_id ?? ""),
    syncAssigneeChatCrm: row.sync_assignee_chat_crm !== false,
    autoLeadOnInbound: row.auto_lead_on_inbound !== false,
    autoAssignOnLead: Boolean(row.auto_assign_on_lead),
    defaultAiMode: (row.default_ai_mode as TenantSettings["defaultAiMode"]) ?? "off",
    staleNegotiationDays: normalizeStaleNegotiationDays(row.stale_negotiation_days),
  };
}

export async function fetchTenantIntegrations(): Promise<TenantIntegrations | null> {
  if (!isSupabaseConfigured) return null;
  const tenantId = await getCurrentTenantId();
  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from("tenant_integrations")
    .select("*")
    .eq("tenant_id", tenantId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) {
    return {
      tenantId,
      n8nWebhookUrl: null,
      n8nSecret: null,
      n8nEnabled: false,
      n8nRateLimitPerMinute: 30,
    };
  }
  return mapIntegrations(data as Record<string, unknown>);
}

export async function upsertTenantIntegrations(
  patch: Partial<Pick<TenantIntegrations, "n8nWebhookUrl" | "n8nSecret" | "n8nEnabled" | "n8nRateLimitPerMinute">>,
): Promise<TenantIntegrations> {
  const tenantId = await getCurrentTenantId();
  const supabase = requireSupabase();
  const row: Record<string, unknown> = { tenant_id: tenantId };
  if (patch.n8nWebhookUrl !== undefined) row.n8n_webhook_url = patch.n8nWebhookUrl;
  if (patch.n8nSecret !== undefined) row.n8n_secret = patch.n8nSecret;
  if (patch.n8nEnabled !== undefined) row.n8n_enabled = patch.n8nEnabled;
  if (patch.n8nRateLimitPerMinute !== undefined) {
    row.n8n_rate_limit_per_minute = patch.n8nRateLimitPerMinute;
  }

  const { data, error } = await supabase
    .from("tenant_integrations")
    .upsert(row, { onConflict: "tenant_id" })
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return mapIntegrations(data as Record<string, unknown>);
}

export async function fetchTenantSettings(): Promise<TenantSettings | null> {
  if (!isSupabaseConfigured) return null;
  const tenantId = await getCurrentTenantId();
  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from("tenant_settings")
    .select("*")
    .eq("tenant_id", tenantId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) {
    return {
      tenantId,
      syncAssigneeChatCrm: true,
      autoLeadOnInbound: true,
      autoAssignOnLead: false,
      defaultAiMode: "off",
      staleNegotiationDays: DEFAULT_STALE_NEGOTIATION_DAYS,
    };
  }
  return mapSettings(data as Record<string, unknown>);
}

export async function upsertTenantSettings(
  patch: Partial<
    Pick<
      TenantSettings,
      | "syncAssigneeChatCrm"
      | "autoLeadOnInbound"
      | "autoAssignOnLead"
      | "defaultAiMode"
      | "staleNegotiationDays"
    >
  >,
): Promise<TenantSettings> {
  const tenantId = await getCurrentTenantId();
  const supabase = requireSupabase();
  const row: Record<string, unknown> = { tenant_id: tenantId };
  if (patch.syncAssigneeChatCrm !== undefined) row.sync_assignee_chat_crm = patch.syncAssigneeChatCrm;
  if (patch.autoLeadOnInbound !== undefined) row.auto_lead_on_inbound = patch.autoLeadOnInbound;
  if (patch.autoAssignOnLead !== undefined) row.auto_assign_on_lead = patch.autoAssignOnLead;
  if (patch.defaultAiMode !== undefined) row.default_ai_mode = patch.defaultAiMode;
  if (patch.staleNegotiationDays !== undefined) {
    row.stale_negotiation_days = normalizeStaleNegotiationDays(patch.staleNegotiationDays);
  }

  const { data, error } = await supabase
    .from("tenant_settings")
    .upsert(row, { onConflict: "tenant_id" })
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return mapSettings(data as Record<string, unknown>);
}

export function useTenantIntegrations() {
  return useQuery({
    queryKey: ["tenant-integrations"],
    queryFn: fetchTenantIntegrations,
    enabled: isSupabaseConfigured,
  });
}

export function useTenantSettings() {
  return useQuery({
    queryKey: ["tenant-settings"],
    queryFn: fetchTenantSettings,
    enabled: isSupabaseConfigured,
  });
}

export function useUpsertTenantIntegrations() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: upsertTenantIntegrations,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["tenant-integrations"] });
    },
  });
}

export function useUpsertTenantSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: upsertTenantSettings,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["tenant-settings"] });
    },
  });
}
