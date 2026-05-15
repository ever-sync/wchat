import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BRAZIL_STATES, buildRouteRegion, fetchCitiesByState, ZONE_OPTIONS } from "@/lib/brazil-regions";
import type { DeliveryRoute, DeliveryRouteUpsertInput } from "@/types/domain";

const DIAS_SEMANA = [
  { key: "seg", label: "Segunda" },
  { key: "ter", label: "Terca" },
  { key: "qua", label: "Quarta" },
  { key: "qui", label: "Quinta" },
  { key: "sex", label: "Sexta" },
  { key: "sab", label: "Sabado" },
  { key: "dom", label: "Domingo" },
];

type RouteFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (input: DeliveryRouteUpsertInput) => Promise<void> | void;
  route?: DeliveryRoute | null;
  loading?: boolean;
};

function getInitialForm(route?: DeliveryRoute | null): DeliveryRouteUpsertInput {
  if (route) {
    return {
      nome: route.nome,
      regiao: route.regiao,
      estado: route.estado ?? "",
      cidade: route.cidade ?? "",
      zona: route.zona ?? "",
      horarioCorte: route.horarioCorte,
      dias: route.dias,
      status: route.status,
      observacoes: route.observacoes ?? "",
    };
  }

  return {
    nome: "",
    regiao: "",
    estado: "",
    cidade: "",
    zona: "",
    horarioCorte: "14:00",
    dias: ["seg", "qua", "sex"],
    status: "ativo",
    observacoes: "",
  };
}

export function RouteFormDialog({
  open,
  onOpenChange,
  onSubmit,
  route,
  loading = false,
}: RouteFormDialogProps) {
  const [form, setForm] = useState<DeliveryRouteUpsertInput>(getInitialForm(route));
  const [cities, setCities] = useState<string[]>([]);
  const [citiesLoading, setCitiesLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(getInitialForm(route));
    }
  }, [open, route]);

  useEffect(() => {
    const nextRegion = buildRouteRegion(form.estado, form.cidade, form.zona);
    setForm((current) => (current.regiao === nextRegion ? current : { ...current, regiao: nextRegion }));
  }, [form.estado, form.cidade, form.zona]);

  useEffect(() => {
    let active = true;

    async function loadCities() {
      if (!form.estado) {
        setCities([]);
        return;
      }

      setCitiesLoading(true);
      const nextCities = await fetchCitiesByState(form.estado);
      if (!active) {
        return;
      }

      setCities(nextCities);
      setCitiesLoading(false);
    }

    void loadCities();

    return () => {
      active = false;
    };
  }, [form.estado]);

  const toggleDay = (day: string, checked: boolean) => {
    setForm((current) => ({
      ...current,
      dias: checked
        ? [...current.dias, day]
        : current.dias.filter((item) => item !== day),
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{route ? "Editar rota" : "Nova rota"}</DialogTitle>
          <DialogDescription>
            Defina estado, cidade, zona e a janela operacional desta rota.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="route-nome">Nome da rota</Label>
            <Input
              id="route-nome"
              value={form.nome}
              onChange={(event) => setForm((current) => ({ ...current, nome: event.target.value }))}
              placeholder="Zona Norte"
            />
          </div>

          <div className="space-y-2">
            <Label>Estado</Label>
            <Select
              value={form.estado ?? ""}
              onValueChange={(value) =>
                setForm((current) => ({
                  ...current,
                  estado: value,
                  cidade: "",
                }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o estado" />
              </SelectTrigger>
              <SelectContent>
                {BRAZIL_STATES.map((state) => (
                  <SelectItem key={state.uf} value={state.uf}>
                    {state.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Cidade</Label>
            <Select
              value={form.cidade ?? ""}
              onValueChange={(value) =>
                setForm((current) => ({
                  ...current,
                  cidade: value,
                }))
              }
              disabled={!form.estado || citiesLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder={citiesLoading ? "Carregando cidades..." : "Selecione a cidade"} />
              </SelectTrigger>
              <SelectContent>
                {cities.map((city) => (
                  <SelectItem key={city} value={city}>
                    {city}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Zona</Label>
            <Select
              value={form.zona ?? ""}
              onValueChange={(value) =>
                setForm((current) => ({
                  ...current,
                  zona: value,
                }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione a zona" />
              </SelectTrigger>
              <SelectContent>
                {ZONE_OPTIONS.map((zone) => (
                  <SelectItem key={zone} value={zone}>
                    {zone}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="route-regiao">Regiao inteligente</Label>
            <Input
              id="route-regiao"
              value={form.regiao}
              readOnly
              placeholder="Zona · Cidade · UF"
              className="bg-muted/60"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="route-horario">Horario de corte</Label>
            <Input
              id="route-horario"
              type="time"
              value={form.horarioCorte}
              onChange={(event) =>
                setForm((current) => ({ ...current, horarioCorte: event.target.value }))
              }
            />
          </div>

          <div className="space-y-2">
            <Label>Status</Label>
            <Select
              value={form.status}
              onValueChange={(value) =>
                setForm((current) => ({
                  ...current,
                  status: value as DeliveryRouteUpsertInput["status"],
                }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ativo">Ativa</SelectItem>
                <SelectItem value="inativo">Inativa</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3 md:col-span-2">
            <Label>Dias de atendimento</Label>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {DIAS_SEMANA.map((day) => {
                const checked = form.dias.includes(day.key);

                return (
                  <label
                    key={day.key}
                    className="flex items-center gap-3 rounded-lg border border-border/60 bg-background/70 px-3 py-2"
                  >
                    <Checkbox
                      checked={checked}
                      onCheckedChange={(value) => toggleDay(day.key, Boolean(value))}
                    />
                    <span className="text-sm text-foreground">{day.label}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="route-observacoes">Observacoes</Label>
            <Textarea
              id="route-observacoes"
              value={form.observacoes ?? ""}
              onChange={(event) =>
                setForm((current) => ({ ...current, observacoes: event.target.value }))
              }
              placeholder="Detalhes de operacao, janela de entrega ou observacoes da equipe."
            />
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
            disabled={
              loading ||
              !form.nome.trim() ||
              !form.estado?.trim() ||
              !form.cidade?.trim() ||
              !form.zona?.trim() ||
              !form.regiao.trim() ||
              !form.dias.length
            }
            className="bg-accent text-accent-foreground hover:bg-accent/90"
          >
            {loading ? "Salvando..." : route ? "Salvar alteracoes" : "Criar rota"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
