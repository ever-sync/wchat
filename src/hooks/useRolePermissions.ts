import { useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useTenantRolePermissions } from "@/lib/api/role-permissions";
import {
  DEFAULT_ROLE_PERMISSIONS,
  canRolePermission,
  type PermissionAction,
  type PermissionFunctionKey,
} from "@/lib/permissions/role-permissions";

export function useRolePermissions() {
  const { profile } = useAuth();
  const { data: config, isLoading } = useTenantRolePermissions();
  const effectiveConfig = config ?? DEFAULT_ROLE_PERMISSIONS;

  const can = useMemo(
    () => (fn: PermissionFunctionKey, action: PermissionAction) => {
      return canRolePermission(effectiveConfig, profile?.role, fn, action);
    },
    [effectiveConfig, profile?.role],
  );

  return { can, isLoading, config };
}
