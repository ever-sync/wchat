import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { invokeAuthedFunction } from "@/lib/api/functions";
import { isSupabaseConfigured, requireSupabase } from "@/lib/supabase";

export type BillingPeriod = "monthly" | "yearly";
export type BillingStatus = "trialing" | "active" | "past_due" | "paused" | "canceled" | "incomplete";

export type BillingPlan = {
  id: string;
  name: string;
  description: string | null;
  entitlements: Record<string, unknown>;
  features: string[];
};

export type BillingPrice = {
  billing_period: BillingPeriod;
  currency: string;
  amount_cents: number;
};

export type BillingSubscription = {
  tenant_id: string;
  plan_id: string;
  status: BillingStatus;
  billing_period: BillingPeriod;
  trial_ends_at: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  gateway_provider: "asaas" | string;
  gateway_customer_id: string | null;
  gateway_subscription_id: string | null;
  gateway_checkout_id: string | null;
  gateway_checkout_url: string | null;
  gateway_invoice_url: string | null;
  gateway_status: string | null;
  plan: BillingPlan;
  price: BillingPrice | null;
};

export type BillingUsageCounter = {
  metric: string;
  used: number;
  limit_value: number | null;
  period_start: string;
  period_end: string;
};

export type BillingSnapshot = {
  subscription: BillingSubscription | null;
  usage: BillingUsageCounter[];
};

export type CreateAsaasCheckoutInput = {
  planId?: string;
  billingPeriod?: BillingPeriod;
  billingTypes?: string[];
};

export type CreateAsaasCheckoutResult = {
  checkoutId: string | null;
  checkoutUrl: string | null;
  gatewaySubscriptionId: string | null;
  raw: unknown;
};

const DEFAULT_SNAPSHOT: BillingSnapshot = {
  subscription: null,
  usage: [],
};

export const billingSnapshotQueryKey = ["billing", "snapshot"] as const;

function normalizeSnapshot(value: unknown): BillingSnapshot {
  if (!value || typeof value !== "object") return DEFAULT_SNAPSHOT;
  const raw = value as Partial<BillingSnapshot>;
  return {
    subscription: raw.subscription ?? null,
    usage: Array.isArray(raw.usage) ? raw.usage : [],
  };
}

export async function getTenantBillingSnapshot(): Promise<BillingSnapshot> {
  if (!isSupabaseConfigured) return DEFAULT_SNAPSHOT;

  const supabase = requireSupabase();
  const { data, error } = await supabase.rpc("get_tenant_billing_snapshot");
  if (error) {
    throw new Error(error.message);
  }

  return normalizeSnapshot(data);
}

export function useTenantBillingSnapshot(
  options?: Omit<UseQueryOptions<BillingSnapshot, Error>, "queryKey" | "queryFn">,
) {
  return useQuery<BillingSnapshot, Error>({
    queryKey: billingSnapshotQueryKey,
    queryFn: getTenantBillingSnapshot,
    enabled: isSupabaseConfigured && (options?.enabled ?? true),
    staleTime: 60_000,
    ...options,
  });
}

export async function createAsaasCheckout(input: CreateAsaasCheckoutInput = {}) {
  return invokeAuthedFunction<CreateAsaasCheckoutResult>("asaas-create-checkout", {
    method: "POST",
    body: JSON.stringify(input),
  });
}
