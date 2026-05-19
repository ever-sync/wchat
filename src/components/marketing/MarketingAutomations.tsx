import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, FileUp, Filter, MoreVertical, Plus, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
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
import { cn } from "@/lib/utils";

type AutomationStatus = "ativo" | "inativo";

type AutomationFlow = {
  id: string;
  name: string;
  status: AutomationStatus;
  leadsEntry: number;
  leadsActive: number | null;
  createdAt: string;
  updatedAt: string;
};

const SAMPLE_FLOWS: AutomationFlow[] = [
  {
    id: "1",
    name: "[GOOGLE] - IR",
    status: "ativo",
    leadsEntry: 5320,
    leadsActive: null,
    createdAt: "2025-08-21T13:47:00",
    updatedAt: "2026-04-01T14:34:00",
  },
  {
    id: "2",
    name: "[FACEBOOK] - IR",
    status: "ativo",
    leadsEntry: 1485,
    leadsActive: null,
    createdAt: "2025-11-13T11:50:00",
    updatedAt: "2026-04-01T14:20:00",
  },
];

type SortField = "createdAt" | "updatedAt";
type SortDirection = "asc" | "desc";

const PAGE_SIZE_OPTIONS = ["10", "25", "50", "100"] as const;

function formatDateTime(iso: string) {
  const date = new Date(iso);
  return date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatNumber(value: number) {
  return value.toLocaleString("pt-BR");
}

export function MarketingAutomations() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState<(typeof PAGE_SIZE_OPTIONS)[number]>("10");
  const [page, setPage] = useState(1);
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
      return;
    }
    setSortField(field);
    setSortDirection("desc");
  };

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    const base = term
      ? SAMPLE_FLOWS.filter((flow) => flow.name.toLowerCase().includes(term))
      : SAMPLE_FLOWS;

    return [...base].sort((a, b) => {
      const av = new Date(a[sortField]).getTime();
      const bv = new Date(b[sortField]).getTime();
      return sortDirection === "asc" ? av - bv : bv - av;
    });
  }, [search, sortField, sortDirection]);

  const total = filtered.length;
  const size = Number(pageSize);
  const totalPages = Math.max(1, Math.ceil(total / size));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * size;
  const visible = filtered.slice(start, start + size);

  const filtersCount = 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">
          Automação de Marketing
        </h2>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="text-primary hover:bg-primary/10"
            aria-label="Importar / exportar"
          >
            <FileUp className="h-5 w-5" aria-hidden />
          </Button>
          <Button
            type="button"
            variant="secondary"
            className="bg-primary/10 text-primary hover:bg-primary/15"
          >
            Modelos
          </Button>
          <Button type="button" className="gap-2">
            <Plus className="h-4 w-4" aria-hidden />
            Criar fluxo
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative max-w-sm flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="Buscar fluxo"
            className="h-10 rounded-full pl-9"
          />
        </div>
        <Button
          type="button"
          variant="secondary"
          className="h-10 gap-2 rounded-full bg-primary/10 text-primary hover:bg-primary/15"
        >
          <Filter className="h-4 w-4" aria-hidden />
          Filtros ({filtersCount})
        </Button>
      </div>

      <div className="rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Nome do fluxo
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Status
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Entrada de leads
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Leads ativos
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <button
                  type="button"
                  onClick={() => toggleSort("createdAt")}
                  className="inline-flex items-center gap-1 hover:text-primary"
                >
                  Criação
                  <ChevronDown
                    className={cn(
                      "h-3.5 w-3.5 transition-transform",
                      sortField === "createdAt" && sortDirection === "asc" ? "rotate-180" : "",
                    )}
                    aria-hidden
                  />
                </button>
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <button
                  type="button"
                  onClick={() => toggleSort("updatedAt")}
                  className="inline-flex items-center gap-1 hover:text-primary"
                >
                  Última alteração
                  <ChevronDown
                    className={cn(
                      "h-3.5 w-3.5 transition-transform",
                      sortField === "updatedAt" && sortDirection === "asc" ? "rotate-180" : "",
                    )}
                    aria-hidden
                  />
                </button>
              </TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="py-10 text-center text-sm text-muted-foreground"
                >
                  Nenhum fluxo encontrado.
                </TableCell>
              </TableRow>
            ) : (
              visible.map((flow) => (
                <TableRow key={flow.id}>
                  <TableCell>
                    <button
                      type="button"
                      onClick={() => navigate(`/marketing/fluxo/${flow.id}`)}
                      className="font-medium text-primary hover:underline"
                    >
                      {flow.name}
                    </button>
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={cn(
                        "rounded-md px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
                        flow.status === "ativo"
                          ? "bg-emerald-500 text-white hover:bg-emerald-500"
                          : "bg-muted text-muted-foreground hover:bg-muted",
                      )}
                    >
                      {flow.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatNumber(flow.leadsEntry)}</TableCell>
                  <TableCell>
                    {flow.leadsActive === null ? "—" : formatNumber(flow.leadsActive)}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-muted-foreground">
                    {formatDateTime(flow.createdAt)}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-muted-foreground">
                    {formatDateTime(flow.updatedAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-md bg-primary/10 text-primary hover:bg-primary/15"
                          aria-label="Ações do fluxo"
                        >
                          <MoreVertical className="h-4 w-4" aria-hidden />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        className="min-w-[220px] rounded-xl p-2 shadow-lg"
                      >
                        <DropdownMenuItem
                          className="px-3 py-2 text-base font-semibold"
                          onSelect={() => navigate(`/marketing/fluxo/${flow.id}`)}
                        >
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem className="px-3 py-2 text-base font-semibold">
                          {flow.status === "ativo" ? "Desativar" : "Ativar"}
                        </DropdownMenuItem>
                        <DropdownMenuItem className="px-3 py-2 text-base font-semibold">
                          Duplicar
                        </DropdownMenuItem>
                        <DropdownMenuItem className="px-3 py-2 text-base font-semibold">
                          Estatísticas
                        </DropdownMenuItem>
                        <DropdownMenuItem className="px-3 py-2 text-base font-semibold">
                          Inserir Leads no fluxo
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="px-3 py-2 text-base font-semibold text-destructive focus:text-destructive">
                          Excluir fluxo
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Exibindo</span>
          <Select
            value={pageSize}
            onValueChange={(value) => {
              setPageSize(value as (typeof PAGE_SIZE_OPTIONS)[number]);
              setPage(1);
            }}
          >
            <SelectTrigger className="h-9 w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAGE_SIZE_OPTIONS.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span>
            de {total} {total === 1 ? "fluxo" : "fluxos"}
          </span>
        </div>

        <div className="flex items-center gap-4 text-sm">
          <button
            type="button"
            disabled={safePage <= 1}
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            className="text-muted-foreground transition-colors hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
          >
            Anterior
          </button>
          <span className="font-semibold text-foreground">{safePage}</span>
          <button
            type="button"
            disabled={safePage >= totalPages}
            onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
            className="text-muted-foreground transition-colors hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
          >
            Próxima
          </button>
        </div>
      </div>
    </div>
  );
}
