import { useEffect, useMemo, useState } from "react";
import { Loader2, Save, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useSaveTenantRolePermissions, useTenantRolePermissions } from "@/lib/api/role-permissions";
import {
  PERMISSION_ACTION_LABELS,
  PERMISSION_ACTIONS,
  PERMISSION_FUNCTIONS,
  type PermissionAction,
  type PermissionFunctionKey,
  type RolePermissionMatrix,
} from "@/lib/permissions/role-permissions";
import { useToast } from "@/hooks/use-toast";
import type { UserRole } from "@/types/domain";

const roleLabels: Record<UserRole, string> = {
  admin: "Administrador",
  operacao: "Operacao",
  financeiro: "Financeiro",
  atendimento: "Atendimento",
};

type RolePermissionsMatrixProps = {
  canEdit: boolean;
  disabled?: boolean;
};

export function RolePermissionsMatrix({ canEdit, disabled }: RolePermissionsMatrixProps) {
  const { toast } = useToast();
  const { data: storedConfig, isLoading } = useTenantRolePermissions();
  const savePermissions = useSaveTenantRolePermissions();
  const [selectedRole, setSelectedRole] = useState<UserRole>("atendimento");
  const [draft, setDraft] = useState<RolePermissionMatrix | null>(null);

  const roleMatrix = useMemo(() => {
    if (!storedConfig) {
      return null;
    }
    return storedConfig[selectedRole];
  }, [storedConfig, selectedRole]);

  useEffect(() => {
    if (roleMatrix) {
      setDraft(roleMatrix);
    }
  }, [roleMatrix, selectedRole]);

  const setFlag = (fn: PermissionFunctionKey, action: PermissionAction, checked: boolean) => {
    setDraft((prev) => {
      if (!prev) {
        return prev;
      }

      const current = { ...prev[fn] };

      if (action === "view") {
        current.view = checked;
        if (!checked) {
          current.edit = false;
          current.delete = false;
        }
      } else if (action === "edit") {
        current.edit = checked;
        if (checked) {
          current.view = true;
        } else {
          current.delete = false;
        }
      } else {
        current.delete = checked;
        if (checked) {
          current.view = true;
          current.edit = true;
        }
      }

      return { ...prev, [fn]: current };
    });
  };

  const handleSave = async () => {
    if (!draft || !canEdit) {
      return;
    }

    try {
      await savePermissions.mutateAsync({ role: selectedRole, matrix: draft });
      toast({
        title: "Permissoes salvas",
        description: `Matriz atualizada para ${roleLabels[selectedRole]}.`,
      });
    } catch (e) {
      toast({
        title: "Nao foi possivel salvar",
        description: e instanceof Error ? e.message : "Tente novamente.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="border-border/60 bg-card/80">
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <CardTitle className="flex items-center gap-2 text-lg">
            <ShieldCheck className="h-5 w-5 text-accent" />
            Permissoes por funcao
          </CardTitle>
          <CardDescription>
            Escolha o tipo de usuario e defina o que cada papel pode visualizar, editar e excluir.
          </CardDescription>
        </div>
        <div className="w-full space-y-2 sm:w-56">
          <Label htmlFor="perm-role-select">Tipo de usuario</Label>
          <Select
            value={selectedRole}
            onValueChange={(value) => setSelectedRole(value as UserRole)}
            disabled={disabled || isLoading}
          >
            <SelectTrigger id="perm-role-select">
              <SelectValue placeholder="Selecione o papel" />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(roleLabels) as UserRole[]).map((role) => (
                <SelectItem key={role} value={role}>
                  {roleLabels[role]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading || !draft ? (
          <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Carregando permissoes...
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="min-w-[180px] font-semibold">Funcao</TableHead>
                  {PERMISSION_ACTIONS.map((action) => (
                    <TableHead key={action} className="w-28 text-center font-semibold">
                      {PERMISSION_ACTION_LABELS[action]}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {PERMISSION_FUNCTIONS.map((fn) => (
                  <TableRow key={fn.key}>
                    <TableCell className="font-medium text-foreground">{fn.label}</TableCell>
                    {PERMISSION_ACTIONS.map((action) => (
                      <TableCell key={action} className="text-center">
                        <Checkbox
                          checked={draft[fn.key][action]}
                          disabled={!canEdit || disabled || savePermissions.isPending}
                          onCheckedChange={(checked) => setFlag(fn.key, action, checked === true)}
                          aria-label={`${fn.label} — ${PERMISSION_ACTION_LABELS[action]}`}
                        />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {!canEdit ? (
          <p className="text-xs text-warning">Somente administradores podem alterar permissoes.</p>
        ) : null}

        <div className="flex justify-end">
          <Button
            type="button"
            className="bg-accent text-accent-foreground hover:bg-accent/90"
            disabled={!canEdit || disabled || isLoading || !draft || savePermissions.isPending}
            onClick={() => void handleSave()}
          >
            {savePermissions.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Salvar permissoes
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
