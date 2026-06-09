import { useMutation, useQuery, useQueryClient, type UseMutationOptions, type UseQueryOptions } from "@tanstack/react-query";
import { invokeAuthedFunction } from "@/lib/api/functions";
import type { BillingPeriod, BillingPlan, BillingStatus } from "@/lib/api/billing";

export type BillingAdminUsage = {
  metric: string;
  used: number;
  limit_value: number | null;
};

export type BillingAdminSubscription = {
  tenant_id: string;
  plan_id: string;
  status: BillingStatus;
  billing_period: BillingPeriod;
  current_period_end: string | null;
  gateway_provider: string | null;
  gateway_status: string | null;
  gateway_subscription_id: string | null;
};

export type BillingAdminTenant = {
  tenant_id: string;
  nome: string;
  created_at: string;
  subscription: BillingAdminSubscription | null;
  usage: BillingAdminUsage[];
  exceeded_metrics: string[];
};

export type BillingAdminSnapshot = {
  plans: BillingPlan[];
  tenants: BillingAdminTenant[];
};

export type BillingAdminPlanInput = {
  tenantId: string;
  planId: string;
  status: BillingStatus;
  billingPeriod: BillingPeriod;
};

export type BillingAdminPlanPrice = {
  currency: string;
  amount_cents: number;
  active: boolean;
};

export type BillingAdminCatalogPlan = {
  id: string;
  name: string;
  description: string | null;
  entitlements: Record<string, unknown>;
  features: string[];
  status: "active" | "archived";
  sort_order: number;
  created_at: string;
  updated_at: string;
  prices: {
    monthly: BillingAdminPlanPrice | null;
    yearly: BillingAdminPlanPrice | null;
  };
};

export type BillingAdminCatalogSnapshot = {
  plans: BillingAdminCatalogPlan[];
};

export type BillingAdminUpsertPlanInput = {
  id: string;
  name: string;
  description: string;
  sort_order: number;
  status: "active" | "archived";
  entitlements: Record<string, unknown>;
  features: string[];
  prices: {
    monthly: number;
    yearly: number;
  };
};

export const billingAdminQueryKey = ["billing-admin", "tenants"] as const;
export const billingAdminCatalogQueryKey = ["billing-admin", "catalog"] as const;

export async function listBillingAdminTenants(): Promise<BillingAdminSnapshot> {
  const res = await invokeAuthedFunction<BillingAdminSnapshot>("billing-admin", undefined, "GET");
  return {
    plans: Array.isArray(res.plans) ? res.plans : [],
    tenants: Array.isArray(res.tenants) ? res.tenants : [],
  };
}

export async function setBillingAdminTenantPlan(input: BillingAdminPlanInput): Promise<void> {
  await invokeAuthedFunction(
    "billing-admin",
    {
      intent: "set_tenant_plan",
      tenant_id: input.tenantId,
      plan_id: input.planId,
      status: input.status,
      billing_period: input.billingPeriod,
    },
    "POST",
  );
}

export async function listBillingAdminCatalog(): Promise<BillingAdminCatalogSnapshot> {
  const res = await invokeAuthedFunction<BillingAdminCatalogSnapshot>("billing-admin?view=catalog", undefined, "GET");
  return {
    plans: Array.isArray(res.plans) ? res.plans : [],
  };
}

export async function upsertBillingAdminPlan(input: BillingAdminUpsertPlanInput): Promise<{ plan_id: string }> {
  const res = await invokeAuthedFunction<{ ok?: boolean; plan_id?: string }>(
    "billing-admin",
    {
      intent: "upsert_plan",
      plan: {
        id: input.id,
        name: input.name,
        description: input.description,
        sort_order: input.sort_order,
        status: input.status,
        entitlements: input.entitlements,
        features: input.features,
      },
      prices: {
        monthly: input.prices.monthly,
        yearly: input.prices.yearly,
      },
    },
    "POST",
  );
  return { plan_id: res.plan_id ?? input.id };
}

export function useBillingAdminTenants(
  options?: Omit<UseQueryOptions<BillingAdminSnapshot, Error>, "queryKey" | "queryFn">,
) {
  return useQuery({
    queryKey: billingAdminQueryKey,
    queryFn: listBillingAdminTenants,
    staleTime: 30_000,
    retry: false,
    ...options,
  });
}

export function useSetBillingAdminTenantPlan(
  options?: UseMutationOptions<void, Error, BillingAdminPlanInput>,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: setBillingAdminTenantPlan,
    ...options,
    onSuccess: async (data, variables, context) => {
      await queryClient.invalidateQueries({ queryKey: billingAdminQueryKey });
      await options?.onSuccess?.(data, variables, context);
    },
  });
}

export function useBillingAdminCatalog(
  options?: Omit<UseQueryOptions<BillingAdminCatalogSnapshot, Error>, "queryKey" | "queryFn">,
) {
  return useQuery({
    queryKey: billingAdminCatalogQueryKey,
    queryFn: listBillingAdminCatalog,
    staleTime: 30_000,
    retry: false,
    ...options,
  });
}

export function useUpsertBillingAdminPlan(
  options?: UseMutationOptions<{ plan_id: string }, Error, BillingAdminUpsertPlanInput>,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: upsertBillingAdminPlan,
    ...options,
    onSuccess: async (data, variables, context) => {
      await queryClient.invalidateQueries({ queryKey: billingAdminCatalogQueryKey });
      await queryClient.invalidateQueries({ queryKey: billingAdminQueryKey });
      await options?.onSuccess?.(data, variables, context);
    },
  });
}
