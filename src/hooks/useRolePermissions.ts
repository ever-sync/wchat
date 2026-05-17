import { useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useTenantRolePermissions } from "@/lib/api/role-permissions";
import {
  canRolePermission,
  type PermissionAction,
  type PermissionFunctionKey,
} from "@/lib/permissions/role-permissions";

export function useRolePermissions() {
  const { profile } = useAuth();
  const { data: config, isLoading } = useTenantRolePermissions();

  const can = useMemo(
    () => (fn: PermissionFunctionKey, action: PermissionAction) => {
      if (!config) {
        return true;
      }
      return canRolePermission(config, profile?.role, fn, action);
    },
    [config, profile?.role],
  );

  return { can, isLoading, config };
}
