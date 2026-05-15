import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getCurrentTenantId } from "@/lib/api/tenant";
import { requireSupabase, isSupabaseConfigured } from "@/lib/supabase";

export type TrendiiSeller = {
  id: string;
  tenantId: string;
  userId: string | null;
  salesPointId: string | null;
  name: string;
  email: string | null;
  role: "vendedor" | "gerente" | "admin";
  active: boolean;
};

export type TrendiiSalesPoint = {
  id: string;
  tenantId: string;
  name: string;
  active: boolean;
};

function mapSeller(row: Record<string, unknown>): TrendiiSeller {
  return {
    id: String(row.id),
    tenantId: String(row.tenant_id),
    userId: row.user_id != null ? String(row.user_id) : null,
    salesPointId: row.sales_point_id != null ? String(row.sales_point_id) : null,
    name: String(row.name ?? ""),
    email: row.email != null ? String(row.email) : null,
    role: (row.role as TrendiiSeller["role"]) ?? "vendedor",
    active: Boolean(row.active),
  };
}

export async function listSellers(): Promise<TrendiiSeller[]> {
  if (!isSupabaseConfigured) return [];
  const tenantId = await getCurrentTenantId();
  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from("trendii_sellers")
    .select("id, tenant_id, user_id, sales_point_id, name, email, role, active")
    .eq("tenant_id", tenantId)
    .eq("active", true)
    .order("name");
  if (error) throw new Error(error.message);
  return ((data ?? []) as Record<string, unknown>[]).map(mapSeller);
}

export async function listSalesPoints(): Promise<TrendiiSalesPoint[]> {
  if (!isSupabaseConfigured) return [];
  const tenantId = await getCurrentTenantId();
  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from("trendii_sales_points")
    .select("id, tenant_id, name, active")
    .eq("tenant_id", tenantId)
    .eq("active", true)
    .order("name");
  if (error) throw new Error(error.message);
  return ((data ?? []) as Record<string, unknown>[]).map((row) => ({
    id: String(row.id),
    tenantId: String(row.tenant_id),
    name: String(row.name ?? ""),
    active: Boolean(row.active),
  }));
}

export async function ensureSellerForProfile(profileId: string): Promise<string | null> {
  const supabase = requireSupabase();
  const { data, error } = await supabase.rpc("ensure_trendii_seller_for_profile", {
    p_profile_id: profileId,
  });
  if (error) throw new Error(error.message);
  return data as string | null;
}

export function useSellers() {
  return useQuery({
    queryKey: ["trendii-sellers"],
    queryFn: listSellers,
    enabled: isSupabaseConfigured,
  });
}

export function useSalesPoints() {
  return useQuery({
    queryKey: ["trendii-sales-points"],
    queryFn: listSalesPoints,
    enabled: isSupabaseConfigured,
  });
}

export function useEnsureSellerForProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ensureSellerForProfile,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["trendii-sellers"] });
    },
  });
}
