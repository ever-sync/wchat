import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Customer, DeliveryRoute, Task, TaskUpsertInput, TaskType } from "@/types/domain";

type TaskFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (input: TaskUpsertInput) => Promise<void> | void;
  customers: Customer[];
  routes: DeliveryRoute[];
  task?: Task | null;
  loading?: boolean;
};

function getTypeDescription(type: TaskType) {
  switch (type) {
    case "cliente_inativo":
      return "Cliente sem movimentacao recente";
    case "inadimplente":
      return "Cliente com pendencia financeira";
    case "sem_resposta":
      return "Cliente sem retorno apos abordagem";
    default:
      return "";
  }
}

function getInitialForm(task?: Task | null): TaskUpsertInput {
  if (task) {
    return {
      customerId: task.customerId ?? null,
      routeId: task.routeId ?? null,
      cliente: task.cliente,
      vendedor: task.vendedor,
      tipo: task.tipo,
      prazo: task.prazo,
      status: task.status,
      descricao: task.descricao,
      origem: task.origem ?? "manual",
    };
  }

  return {
    customerId: null,
    routeId: null,
    cliente: "",
    vendedor: "",
    tipo: "cliente_inativo",
    prazo: new Date().toISOString().slice(0, 10),
    status: "aberta",
    descricao: "",
    origem: "manual",
  };
}

export function TaskFormDialog({
  open,
  onOpenChange,
  onSubmit,
  customers,
  routes,
  task,
  loading = false,
}: TaskFormDialogProps) {
  const [form, setForm] = useState<TaskUpsertInput>(getInitialForm(task));

  useEffect(() => {
    if (open) {
      setForm(getInitialForm(task));
    }
  }, [open, task]);

  const selectedCustomer = useMemo(
    () => customers.find((customer) => customer.id === form.customerId) ?? null,
    [customers, form.customerId],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{task ? "Editar tarefa" : "Nova tarefa"}</DialogTitle>
          <DialogDescription>
            Organize a acao, o responsavel e o prazo para acompanhamento operacional.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label>Cliente</Label>
            <Select
              value={form.customerId ?? "manual"}
              onValueChange={(value) => {
                if (value === "manual") {
                  setForm((current) => ({
                    ...current,
                    customerId: null,
                    routeId: null,
                  }));
                  return;
                }

                const customer = customers.find((item) => item.id === value);
                setForm((current) => ({
                  ...current,
                  customerId: value,
                  cliente: customer?.nome ?? current.cliente,
                  vendedor: customer?.vendedor ?? current.vendedor,
                  routeId:
                    routes.find((route) => route.nome === customer?.rota)?.id ?? current.routeId ?? null,
                  descricao: current.descricao || getTypeDescription(current.tipo),
                }));
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um cliente ou deixe manual" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="manual">Preenchimento manual</SelectItem>
                {customers.map((customer) => (
                  <SelectItem key={customer.id} value={customer.id}>
                    {customer.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="task-cliente">Nome para exibicao</Label>
            <Input
              id="task-cliente"
              value={form.cliente}
              onChange={(event) => setForm((current) => ({ ...current, cliente: event.target.value }))}
              placeholder="Cliente ou conta"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="task-vendedor">Responsavel</Label>
            <Input
              id="task-vendedor"
              value={form.vendedor}
              onChange={(event) => setForm((current) => ({ ...current, vendedor: event.target.value }))}
              placeholder="Nome do vendedor ou operador"
            />
          </div>

          <div className="space-y-2">
            <Label>Tipo</Label>
            <Select
              value={form.tipo}
              onValueChange={(value) =>
                setForm((current) => ({
                  ...current,
                  tipo: value as TaskUpsertInput["tipo"],
                  descricao: current.descricao || getTypeDescription(value as TaskType),
                }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cliente_inativo">Cliente inativo</SelectItem>
                <SelectItem value="inadimplente">Inadimplente</SelectItem>
                <SelectItem value="sem_resposta">Sem resposta</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Status</Label>
            <Select
              value={form.status}
              onValueChange={(value) =>
                setForm((current) => ({
                  ...current,
                  status: value as TaskUpsertInput["status"],
                }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="aberta">Aberta</SelectItem>
                <SelectItem value="em_andamento">Em andamento</SelectItem>
                <SelectItem value="concluida">Concluida</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="task-prazo">Prazo</Label>
            <Input
              id="task-prazo"
              type="date"
              value={form.prazo}
              onChange={(event) => setForm((current) => ({ ...current, prazo: event.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label>Rota vinculada</Label>
            <Select
              value={form.routeId ?? "none"}
              onValueChange={(value) =>
                setForm((current) => ({
                  ...current,
                  routeId: value === "none" ? null : value,
                }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Sem rota" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sem rota vinculada</SelectItem>
                {routes.map((route) => (
                  <SelectItem key={route.id} value={route.id}>
                    {route.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="task-descricao">Descricao</Label>
            <Textarea
              id="task-descricao"
              value={form.descricao}
              onChange={(event) =>
                setForm((current) => ({ ...current, descricao: event.target.value }))
              }
              placeholder="Contexto da acao para a equipe."
            />
            {selectedCustomer ? (
              <p className="text-xs text-muted-foreground">
                Cliente selecionado: {selectedCustomer.nome} • rota {selectedCustomer.rota || "nao definida"}
              </p>
            ) : null}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button
            onClick={async () => {
              await onSubmit(form);
            }}
            disabled={loading || !form.cliente.trim() || !form.vendedor.trim() || !form.descricao.trim()}
            className="bg-accent text-accent-foreground hover:bg-accent/90"
          >
            {loading ? "Salvando..." : task ? "Salvar alteracoes" : "Criar tarefa"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
