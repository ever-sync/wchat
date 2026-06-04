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

export type BillingPlanCatalogItem = BillingPlan & {
  sort_order: number;
  prices: Record<BillingPeriod, BillingPrice | null>;
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

export type BillingPlansCatalog = BillingPlanCatalogItem[];

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
export const billingPlansCatalogQueryKey = ["billing", "plans"] as const;

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

export async function getBillingPlansCatalog(): Promise<BillingPlansCatalog> {
  if (!isSupabaseConfigured) return [];

  const client = requireSupabase();

  const [plansRes, pricesRes] = await Promise.all([
    client.from("billing_plans").select("id, name, description, entitlements, features, sort_order, status").eq("status", "active").order("sort_order"),
    client.from("billing_plan_prices").select("plan_id, billing_period, currency, amount_cents, active").eq("active", true),
  ]);

  if (plansRes.error) throw new Error(plansRes.error.message);
  if (pricesRes.error) throw new Error(pricesRes.error.message);

  const pricesByPlan = new Map<string, Partial<Record<BillingPeriod, BillingPrice>>>();
  for (const price of pricesRes.data ?? []) {
    const billingPeriod = price.billing_period as BillingPeriod;
    const current = pricesByPlan.get(price.plan_id) ?? {};
    current[billingPeriod] = {
      billing_period: billingPeriod,
      currency: String(price.currency ?? "BRL"),
      amount_cents: Number(price.amount_cents ?? 0),
    };
    pricesByPlan.set(price.plan_id, current);
  }

  return (plansRes.data ?? []).map((plan) => ({
    id: String(plan.id),
    name: String(plan.name ?? plan.id),
    description: plan.description == null ? null : String(plan.description),
    entitlements: (plan.entitlements as Record<string, unknown>) ?? {},
    features: Array.isArray(plan.features) ? (plan.features as string[]) : [],
    sort_order: Number(plan.sort_order ?? 0),
    prices: {
      monthly: pricesByPlan.get(String(plan.id))?.monthly ?? null,
      yearly: pricesByPlan.get(String(plan.id))?.yearly ?? null,
    },
  }));
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

export function useBillingPlansCatalog(
  options?: Omit<UseQueryOptions<BillingPlansCatalog, Error>, "queryKey" | "queryFn">,
) {
  return useQuery<BillingPlansCatalog, Error>({
    queryKey: billingPlansCatalogQueryKey,
    queryFn: getBillingPlansCatalog,
    staleTime: 5 * 60 * 1000,
    retry: false,
    ...options,
  });
}

export async function createAsaasCheckout(input: CreateAsaasCheckoutInput = {}) {
  return invokeAuthedFunction<CreateAsaasCheckoutResult>("asaas-create-checkout", {
    method: "POST",
    body: JSON.stringify(input),
  });
}
