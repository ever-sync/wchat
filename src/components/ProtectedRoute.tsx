import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useRolePermissions } from "@/hooks/useRolePermissions";
import type { PermissionAction, PermissionFunctionKey } from "@/lib/permissions/role-permissions";

function FullScreenMessage({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 text-sm text-muted-foreground">
      {children}
    </div>
  );
}

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <FullScreenMessage>Carregando sessão...</FullScreenMessage>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

export function PublicOnlyRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <FullScreenMessage>Carregando sessão...</FullScreenMessage>;
  }

  if (isAuthenticated) {
    return <Navigate to="/inbox" replace />;
  }

  return <>{children}</>;
}

export function PermissionRoute({
  permission,
  action = "view",
  fallback = "/inbox",
  children,
}: {
  permission: PermissionFunctionKey;
  action?: PermissionAction;
  fallback?: string;
  children: ReactNode;
}) {
  const { can, isLoading: permissionsLoading } = useRolePermissions();

  if (permissionsLoading) {
    return <FullScreenMessage>Carregando permissões...</FullScreenMessage>;
  }

  if (!can(permission, action)) {
    return <Navigate to={fallback} replace />;
  }

  return <>{children}</>;
}
