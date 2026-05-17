import { useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useTenantRolePermissions } from "@/lib/api/role-permissions";
import { isSupabaseConfigured } from "@/lib/supabase";
import {
  DEFAULT_ROLE_PERMISSIONS,
  canRolePermission,
  type PermissionAction,
  type PermissionFunctionKey,
  type TenantRolePermissionsConfig,
} from "@/lib/permissions/role-permissions";

export function useRolePermissions() {
  const { profile } = useAuth();
  const { data: config, isLoading: queryLoading, isFetched } = useTenantRolePermissions();

  const effectiveConfig = useMemo((): TenantRolePermissionsConfig | null => {
    if (config) {
      return config;
    }
    if (!isSupabaseConfigured || isFetched) {
      return DEFAULT_ROLE_PERMISSIONS;
    }
    return null;
  }, [config, isFetched]);

  const isLoading = isSupabaseConfigured && (!isFetched || queryLoading);

  const can = useMemo(
    () => (fn: PermissionFunctionKey, action: PermissionAction) => {
      if (!effectiveConfig) {
        return false;
      }
      return canRolePermission(effectiveConfig, profile?.role, fn, action);
    },
    [effectiveConfig, profile?.role],
  );

  return {
    can,
    isLoading,
    config: effectiveConfig ?? DEFAULT_ROLE_PERMISSIONS,
  };
}
