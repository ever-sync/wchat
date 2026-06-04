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

export const billingAdminQueryKey = ["billing-admin", "tenants"] as const;

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
      tenant_id: input.tenantId,
      plan_id: input.planId,
      status: input.status,
      billing_period: input.billingPeriod,
    },
    "POST",
  );
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
