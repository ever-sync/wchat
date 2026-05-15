import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getCurrentTenantId } from "@/lib/api/tenant";
import { isSupabaseConfigured, requireSupabase } from "@/lib/supabase";

export type UnifiedTag = {
  id: string;
  name: string;
  color: string;
  scope: "all" | "chat" | "customer" | "negotiation";
};

export type EntityTagType = "chat" | "customer" | "negotiation";

export async function listUnifiedTags(scope?: UnifiedTag["scope"]): Promise<UnifiedTag[]> {
  if (!isSupabaseConfigured) return [];
  const tenantId = await getCurrentTenantId();
  const supabase = requireSupabase();
  let q = supabase
    .from("tags")
    .select("id, name, color, scope")
    .eq("tenant_id", tenantId)
    .order("name");
  if (scope) {
    q = q.in("scope", [scope, "all"]);
  }
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return ((data ?? []) as Record<string, unknown>[]).map((row) => ({
    id: String(row.id),
    name: String(row.name),
    color: String(row.color ?? "#6366f1"),
    scope: (row.scope as UnifiedTag["scope"]) ?? "all",
  }));
}

export async function attachEntityTag(
  entityType: EntityTagType,
  entityId: string,
  tagId: string,
): Promise<void> {
  const tenantId = await getCurrentTenantId();
  const supabase = requireSupabase();
  const { error } = await supabase.from("entity_tags").upsert(
    { tenant_id: tenantId, tag_id: tagId, entity_type: entityType, entity_id: entityId },
    { onConflict: "tag_id,entity_type,entity_id", ignoreDuplicates: true },
  );
  if (error) throw new Error(error.message);
}

export function useUnifiedTags(scope?: UnifiedTag["scope"]) {
  return useQuery({
    queryKey: ["unified-tags", scope],
    queryFn: () => listUnifiedTags(scope),
    enabled: isSupabaseConfigured,
  });
}

export function useAttachEntityTag() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      entityType,
      entityId,
      tagId,
    }: {
      entityType: EntityTagType;
      entityId: string;
      tagId: string;
    }) => attachEntityTag(entityType, entityId, tagId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["unified-tags"] });
    },
  });
}
