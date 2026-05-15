import { useEffect, useMemo, useState } from "react";
import { Loader2, SearchCheck } from "lucide-react";
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
import { useToast } from "@/hooks/use-toast";
import { useAppStore } from "@/store/useAppStore";
import { useCustomers } from "@/lib/api/customers";
import { useRoutes } from "@/lib/api/routes";
import { useTenantCollaborators } from "@/lib/api/settings";
import {
  fetchCepDetails,
  fetchCnpjDetails,
  formatCep,
  formatCnpj,
  onlyDigits,
} from "@/lib/brasil-api";
import { fallbackCustomerDisplayName } from "@/lib/customer-display-name";
import { normalizePhone } from "@/lib/phone";
import type { Customer, CustomerUpsertInput } from "@/types/domain";

const CUSTOMER_STEPS = [
  {
    key: "empresa",
    title: "Empresa",
    description: "Documento e dados principais do cliente.",
  },
  {
    key: "contato",
    title: "Contato",
    description: "Telefone, endereco e localizacao.",
  },
  {
    key: "operacao",
    title: "Operacao",
    description: "Perfil comercial, rota e indicadores.",
  },
] as const;

type CustomerFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (input: CustomerUpsertInput) => Promise<void> | void;
  customer?: Customer | null;
  /** Mesclado no cadastro novo (sem `customer`). Ex.: telefone/nome vindos da URL ou da inbox. */
  initialOverrides?: Partial<CustomerUpsertInput>;
  loading?: boolean;
};

const purchaseFrequencyOptions = [
  "Diaria",
  "Semanal",
  "Quinzenal",
  "Mensal",
  "Bimestral",
  "Trimestral",
  "Esporadica",
] as const;

function parseCurrencyInput(value: string) {
  const digits = value.replace(/\D/g, "");
  return Number(digits || 0) / 100;
}

function formatCurrencyInput(value: number) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatPhoneE164(value: string) {
  return normalizePhone(value).e164 ?? value.trim();
}

function nextCustomerCode(customers: Array<{ codigo?: string }>) {
  const highestCode = customers.reduce((highest, customer) => {
    const numericCode = Number((customer.codigo ?? "").replace(/\D/g, ""));
    if (!Number.isFinite(numericCode)) {
      return highest;
    }
    return Math.max(highest, numericCode);
  }, 0);

  return String(highestCode + 1).padStart(4, "0");
}

function getInitialForm(customer?: Customer | null): CustomerUpsertInput {
  if (customer) {
    return {
      codigo: customer.codigo,
      tipo:
        customer.tipo === "pf" || customer.tipo === "pj"
          ? customer.tipo
          : customer.cpf && !customer.cnpj
            ? "pf"
            : "pj",
      origem: customer.origem,
      nome: customer.nome,
      telefone: customer.telefone,
      celular: customer.celular,
      email: customer.email,
      cnpj: customer.cnpj,
      endereco: customer.endereco,
      perfil: customer.perfil,
      rota: customer.rota,
      status: customer.status,
      vendedor: customer.vendedor,
      ultimoPedido: customer.ultimoPedido,
      ticketMedio: customer.ticketMedio,
      frequenciaCompra: customer.frequenciaCompra,
      totalGasto: customer.totalGasto,
      cpf: customer.cpf,
      rg: customer.rg,
      nascimento: customer.nascimento,
      nomeSocial: customer.nomeSocial,
      razaoSocial: customer.razaoSocial,
      inscricaoEstadual: customer.inscricaoEstadual,
      inscricaoMunicipal: customer.inscricaoMunicipal,
      cep: customer.cep,
      logradouro: customer.logradouro,
      numero: customer.numero,
      bairro: customer.bairro,
      zone: customer.zone,
      cidade: customer.cidade,
      estado: customer.estado,
      complemento: customer.complemento,
      ativo: customer.ativo,
      observacoes: customer.observacoes,
      cadastradoEm: customer.cadastradoEm,
    };
  }

  return {
    codigo: "",
    tipo: "pj",
    origem: undefined,
    nome: "",
    telefone: "",
    celular: "",
    email: "",
    cnpj: "",
    endereco: "",
    perfil: "B",
    rota: "",
    status: "ativo",
    vendedor: "",
    ultimoPedido: new Date().toISOString().slice(0, 10),
    ticketMedio: 0,
    frequenciaCompra: "Quinzenal",
    totalGasto: 0,
    cpf: "",
    rg: "",
    nascimento: "",
    nomeSocial: "",
    razaoSocial: "",
    inscricaoEstadual: "",
    inscricaoMunicipal: "",
    cep: "",
    logradouro: "",
    numero: "",
    bairro: "",
    zone: "",
    cidade: "",
    estado: "",
    complemento: "",
    ativo: true,
    observacoes: "",
    cadastradoEm: new Date().toISOString().slice(0, 10),
  };
}

export function CustomerFormDialog({
  open,
  onOpenChange,
  onSubmit,
  customer,
  initialOverrides,
  loading = false,
}: CustomerFormDialogProps) {
  const { toast } = useToast();
  const { data: collaborators = [] } = useTenantCollaborators({ enabled: open });
  const { data: customers = [] } = useCustomers({}, { enabled: open });
  const { data: routes = [] } = useRoutes({ enabled: open });
  const [form, setForm] = useState<CustomerUpsertInput>(getInitialForm(customer));
  const [cnpjLoading, setCnpjLoading] = useState(false);
  const [cepLoading, setCepLoading] = useState(false);
  const [lastFetchedCnpj, setLastFetchedCnpj] = useState("");
  const [lastFetchedCep, setLastFetchedCep] = useState("");
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    if (open) {
      const base = getInitialForm(customer);
      setForm(customer ? base : { ...base, ...initialOverrides });
      setLastFetchedCnpj("");
      setLastFetchedCep("");
      setCnpjLoading(false);
      setCepLoading(false);
      setStepIndex(0);
    }
  }, [customer, initialOverrides, open]);

  const cnpjDigits = useMemo(() => onlyDigits(form.cnpj), [form.cnpj]);
  const cepDigits = useMemo(() => onlyDigits(form.cep ?? ""), [form.cep]);
  const isPessoaFisica = form.tipo === "pf";
  const routeOptions = useMemo(
    () => routes.map((route) => route.nome).filter(Boolean).sort((left, right) => left.localeCompare(right, "pt-BR")),
    [routes],
  );

  useEffect(() => {
    if (!open || isPessoaFisica || cnpjDigits.length !== 14 || cnpjDigits === lastFetchedCnpj) {
      return;
    }

    let active = true;
    setCnpjLoading(true);

    const timer = window.setTimeout(async () => {
      try {
        const data = await fetchCnpjDetails(cnpjDigits);
        if (!active) {
          return;
        }

        setForm((current) => ({
          ...current,
          cnpj: formatCnpj(data.cnpj || cnpjDigits),
          nome: current.nome || data.nome_fantasia || data.razao_social,
          razaoSocial: data.razao_social || current.razaoSocial,
          email: current.email || data.email || "",
          telefone: current.telefone || formatPhoneE164(data.ddd_telefone_1 || ""),
          cep: data.cep ? formatCep(data.cep) : current.cep,
          endereco: data.logradouro || current.endereco,
          bairro: data.bairro || current.bairro,
          cidade: data.municipio || current.cidade,
          estado: data.uf || current.estado,
          complemento: current.complemento || data.complemento || "",
        }));
        setLastFetchedCnpj(cnpjDigits);
      } catch (error) {
        if (active) {
          const desc = error instanceof Error ? error.message : "Tente novamente.";
          toast({
            title: "Nao foi possivel consultar o CNPJ",
            description: desc,
            variant: "destructive",
          });
          useAppStore.getState().addNotification({
            tipo: "erro",
            titulo: "Nao foi possivel consultar o CNPJ",
            descricao: desc,
          });
        }
      } finally {
        if (active) {
          setCnpjLoading(false);
        }
      }
    }, 350);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [cnpjDigits, isPessoaFisica, lastFetchedCnpj, open, toast]);

  useEffect(() => {
    if (!open || cepDigits.length !== 8 || cepDigits === lastFetchedCep) {
      return;
    }

    let active = true;
    setCepLoading(true);

    const timer = window.setTimeout(async () => {
      try {
        const data = await fetchCepDetails(cepDigits);
        if (!active) {
          return;
        }

        setForm((current) => ({
          ...current,
          cep: formatCep(data.cep || cepDigits),
          endereco: current.endereco || data.street || "",
          bairro: current.bairro || data.neighborhood || "",
          cidade: current.cidade || data.city || "",
          estado: current.estado || data.state || "",
        }));
        setLastFetchedCep(cepDigits);
      } catch (error) {
        if (active) {
          const desc = error instanceof Error ? error.message : "Tente novamente.";
          toast({
            title: "Nao foi possivel consultar o CEP",
            description: desc,
            variant: "destructive",
          });
          useAppStore.getState().addNotification({
            tipo: "erro",
            titulo: "Nao foi possivel consultar o CEP",
            descricao: desc,
          });
        }
      } finally {
        if (active) {
          setCepLoading(false);
        }
      }
    }, 350);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [cepDigits, lastFetchedCep, open, toast]);

  const isFirstStep = stepIndex === 0;
  const isLastStep = stepIndex === CUSTOMER_STEPS.length - 1;
  const currentStep = CUSTOMER_STEPS[stepIndex];
  const availableSellers = useMemo(
    () =>
      collaborators
        .filter((member) => member.status === "active")
        .map((member) => ({
          id: member.id,
          nome: member.nome?.trim() || member.email,
          role: member.role,
        }))
        .filter((member) => Boolean(member.nome))
        .sort((left, right) => left.nome.localeCompare(right.nome, "pt-BR")),
    [collaborators],
  );

  useEffect(() => {
    if (!open || customer || (form.codigo ?? "").trim() || customers.length === 0) {
      return;
    }

    setForm((current) => ({
      ...current,
      codigo: nextCustomerCode(customers),
    }));
  }, [customer, customers, form.codigo, open]);

  function canAdvance() {
    if (stepIndex === 0) {
      return true;
    }

    if (stepIndex === 1) {
      return Boolean(normalizePhone(form.telefone).jid);
    }

    return Boolean(form.perfil && form.status && form.ultimoPedido);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{customer ? "Editar cliente" : "Novo cliente"}</DialogTitle>
          <DialogDescription>
            Preencha os dados do cliente em etapas para manter o cadastro mais organizado.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          <div className="grid gap-2 sm:grid-cols-3">
            {CUSTOMER_STEPS.map((step, index) => {
              const isActive = index === stepIndex;
              const isDone = index < stepIndex;

              return (
                <button
                  key={step.key}
                  type="button"
                  className={`rounded-2xl border px-4 py-3 text-left transition-colors ${
                    isActive
                      ? "border-accent bg-accent/10"
                      : isDone
                        ? "border-[#cfe4bd] bg-[#f4faef]"
                        : "border-border bg-background"
                  }`}
                  onClick={() => setStepIndex(index)}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
                        isActive || isDone
                          ? "bg-accent text-accent-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {index + 1}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-foreground">{step.title}</p>
                      <p className="text-xs text-muted-foreground">{step.description}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="rounded-[24px] border border-border/60 bg-card/50 p-5">
            <div className="mb-5">
              <p className="text-sm font-semibold text-foreground">{currentStep.title}</p>
              <p className="text-xs text-muted-foreground">{currentStep.description}</p>
            </div>

            {stepIndex === 0 ? (
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="customer-codigo">Codigo</Label>
                  <Input
                    id="customer-codigo"
                    value={form.codigo ?? ""}
                    onChange={(event) => setForm((current) => ({ ...current, codigo: event.target.value }))}
                    placeholder="Codigo interno"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label>Tipo de cadastro</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      type="button"
                      variant={isPessoaFisica ? "default" : "outline"}
                      className={isPessoaFisica ? "bg-accent text-accent-foreground hover:bg-accent/90" : ""}
                      onClick={() =>
                        setForm((current) => ({
                          ...current,
                          tipo: "pf",
                          cnpj: "",
                          razaoSocial: "",
                          inscricaoEstadual: "",
                          inscricaoMunicipal: "",
                        }))
                      }
                    >
                      Pessoa fisica
                    </Button>
                    <Button
                      type="button"
                      variant={!isPessoaFisica ? "default" : "outline"}
                      className={!isPessoaFisica ? "bg-accent text-accent-foreground hover:bg-accent/90" : ""}
                      onClick={() =>
                        setForm((current) => ({
                          ...current,
                          tipo: "pj",
                          cpf: "",
                          rg: "",
                          nascimento: "",
                        }))
                      }
                    >
                      Pessoa juridica
                    </Button>
                  </div>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <div className="flex items-center justify-between gap-3">
                    <Label htmlFor="customer-cnpj">{isPessoaFisica ? "CPF" : "CNPJ"}</Label>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {!isPessoaFisica ? (
                        <>
                          {cnpjLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <SearchCheck className="h-3.5 w-3.5" />}
                          <span>Preenchimento automatico por CNPJ</span>
                        </>
                      ) : (
                        <span>Informe o CPF do lead</span>
                      )}
                    </div>
                  </div>
                  {isPessoaFisica ? (
                    <Input
                      id="customer-cnpj"
                      value={form.cpf ?? ""}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          cpf: event.target.value,
                        }))
                      }
                      placeholder="000.000.000-00"
                    />
                  ) : (
                    <Input
                      id="customer-cnpj"
                      value={form.cnpj}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          cnpj: formatCnpj(event.target.value),
                        }))
                      }
                      placeholder="00.000.000/0000-00"
                    />
                  )}
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="customer-nome">
                    {isPessoaFisica ? "Nome completo" : "Nome / nome fantasia"} (opcional)
                  </Label>
                  <Input
                    id="customer-nome"
                    value={form.nome}
                    onChange={(event) => setForm((current) => ({ ...current, nome: event.target.value }))}
                    placeholder="Deixe em branco para usar o numero no disparo (ex.: WhatsApp (11) 98765-4321)"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="customer-nome-social">Nome social</Label>
                  <Input
                    id="customer-nome-social"
                    value={form.nomeSocial ?? ""}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, nomeSocial: event.target.value }))
                    }
                    placeholder="Nome social"
                  />
                </div>

                {isPessoaFisica ? (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="customer-rg">RG</Label>
                      <Input
                        id="customer-rg"
                        value={form.rg ?? ""}
                        onChange={(event) => setForm((current) => ({ ...current, rg: event.target.value }))}
                        placeholder="RG"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="customer-nascimento">Data de nascimento</Label>
                      <Input
                        id="customer-nascimento"
                        type="date"
                        value={form.nascimento ?? ""}
                        onChange={(event) =>
                          setForm((current) => ({ ...current, nascimento: event.target.value }))
                        }
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="customer-razao-social">Razao social</Label>
                      <Input
                        id="customer-razao-social"
                        value={form.razaoSocial ?? ""}
                        onChange={(event) =>
                          setForm((current) => ({ ...current, razaoSocial: event.target.value }))
                        }
                        placeholder="Razao social da empresa"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="customer-ie">I.E.</Label>
                      <Input
                        id="customer-ie"
                        value={form.inscricaoEstadual ?? ""}
                        onChange={(event) =>
                          setForm((current) => ({ ...current, inscricaoEstadual: event.target.value }))
                        }
                        placeholder="Inscricao estadual"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="customer-im">I.M.</Label>
                      <Input
                        id="customer-im"
                        value={form.inscricaoMunicipal ?? ""}
                        onChange={(event) =>
                          setForm((current) => ({ ...current, inscricaoMunicipal: event.target.value }))
                        }
                        placeholder="Inscricao municipal"
                      />
                    </div>
                  </>
                )}

                <div className="space-y-2">
                  <Label htmlFor="customer-cadastrado-em">Cadastrado em</Label>
                  <Input
                    id="customer-cadastrado-em"
                    type="date"
                    value={form.cadastradoEm ?? ""}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, cadastradoEm: event.target.value }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="customer-email">E-mail</Label>
                  <Input
                    id="customer-email"
                    type="email"
                    value={form.email}
                    onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                    placeholder="contato@cliente.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="customer-telefone">Telefone</Label>
                  <Input
                    id="customer-telefone"
                    value={form.telefone}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        telefone: event.target.value,
                      }))
                    }
                    onBlur={(event) =>
                      setForm((current) => ({
                        ...current,
                        telefone: formatPhoneE164(event.target.value),
                      }))
                    }
                    placeholder="+5511999999999"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="customer-celular">Celular</Label>
                  <Input
                    id="customer-celular"
                    value={form.celular ?? ""}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        celular: event.target.value,
                      }))
                    }
                    onBlur={(event) =>
                      setForm((current) => ({
                        ...current,
                        celular: event.target.value.trim() ? formatPhoneE164(event.target.value) : "",
                      }))
                    }
                    placeholder="+5511999999999"
                  />
                </div>
              </div>
            ) : null}

            {stepIndex === 1 ? (
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <Label htmlFor="customer-cep">CEP</Label>
                    {cepLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" /> : null}
                  </div>
                  <Input
                    id="customer-cep"
                    value={form.cep ?? ""}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        cep: formatCep(event.target.value),
                      }))
                    }
                    placeholder="00000-000"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Responsavel</Label>
                  <Select
                    value={form.vendedor || "unassigned"}
                    onValueChange={(value) =>
                      setForm((current) => ({
                        ...current,
                        vendedor: value === "unassigned" ? "" : value,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um membro da plataforma" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">Sem responsavel</SelectItem>
                      {availableSellers.map((member) => (
                        <SelectItem key={member.id} value={member.nome}>
                          {member.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Os vendedores sao os membros ativos cadastrados na plataforma.
                  </p>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="customer-logradouro">Logradouro</Label>
                  <Input
                    id="customer-logradouro"
                    value={form.logradouro ?? form.endereco}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        logradouro: event.target.value,
                        endereco: event.target.value,
                      }))
                    }
                    placeholder="Rua, avenida ou logradouro"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="customer-numero">Numero</Label>
                  <Input
                    id="customer-numero"
                    value={form.numero ?? ""}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, numero: event.target.value }))
                    }
                    placeholder="123"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="customer-bairro">Bairro</Label>
                  <Input
                    id="customer-bairro"
                    value={form.bairro ?? ""}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, bairro: event.target.value }))
                    }
                    placeholder="Bairro"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="customer-zone">Zona</Label>
                  <Input
                    id="customer-zone"
                    value={form.zone ?? ""}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, zone: event.target.value }))
                    }
                    placeholder="Ex.: Zona Norte, Centro"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="customer-complemento">Complemento</Label>
                  <Input
                    id="customer-complemento"
                    value={form.complemento ?? ""}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, complemento: event.target.value }))
                    }
                    placeholder="Numero, sala, referencia"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="customer-cidade">Cidade</Label>
                  <Input
                    id="customer-cidade"
                    value={form.cidade ?? ""}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, cidade: event.target.value }))
                    }
                    placeholder="Cidade"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="customer-estado">Estado</Label>
                  <Input
                    id="customer-estado"
                    value={form.estado ?? ""}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, estado: event.target.value.toUpperCase().slice(0, 2) }))
                    }
                    placeholder="UF"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="customer-endereco-completo">Endereco completo</Label>
                  <Input
                    id="customer-endereco-completo"
                    value={form.endereco}
                    onChange={(event) => setForm((current) => ({ ...current, endereco: event.target.value }))}
                    placeholder="Endereco completo para uso interno"
                  />
                </div>
              </div>
            ) : null}

            {stepIndex === 2 ? (
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Ativo</Label>
                  <Select
                    value={form.ativo === false ? "false" : "true"}
                    onValueChange={(value) =>
                      setForm((current) => ({ ...current, ativo: value === "true" }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Sim</SelectItem>
                      <SelectItem value="false">Nao</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Origem</Label>
                  <Select
                    value={form.origem ?? ""}
                    onValueChange={(value) =>
                      setForm((current) => ({
                        ...current,
                        origem: (value || undefined) as CustomerUpsertInput["origem"],
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a origem" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="organico">Organico</SelectItem>
                      <SelectItem value="pago">Pago</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Perfil</Label>
                  <Select
                    value={form.perfil}
                    onValueChange={(value) =>
                      setForm((current) => ({ ...current, perfil: value as CustomerUpsertInput["perfil"] }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A">Perfil A</SelectItem>
                      <SelectItem value="B">Perfil B</SelectItem>
                      <SelectItem value="C">Perfil C</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={form.status}
                    onValueChange={(value) =>
                      setForm((current) => ({ ...current, status: value as CustomerUpsertInput["status"] }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ativo">Ativo</SelectItem>
                      <SelectItem value="inativo">Inativo</SelectItem>
                      <SelectItem value="bloqueado">Bloqueado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Rota</Label>
                  <Select
                    value={form.rota || "no-route"}
                    onValueChange={(value) =>
                      setForm((current) => ({
                        ...current,
                        rota: value === "no-route" ? "" : value,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma rota" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="no-route">Sem rota</SelectItem>
                      {routeOptions.map((routeName) => (
                        <SelectItem key={routeName} value={routeName}>
                          {routeName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="customer-ultimo-pedido">Ultimo pedido</Label>
                  <Input
                    id="customer-ultimo-pedido"
                    type="date"
                    value={form.ultimoPedido}
                    onChange={(event) => setForm((current) => ({ ...current, ultimoPedido: event.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="customer-ticket">Ticket medio</Label>
                  <Input
                    id="customer-ticket"
                    inputMode="numeric"
                    value={formatCurrencyInput(form.ticketMedio)}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, ticketMedio: parseCurrencyInput(event.target.value) }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="customer-total-gasto">Total gasto</Label>
                  <Input
                    id="customer-total-gasto"
                    inputMode="numeric"
                    value={formatCurrencyInput(form.totalGasto)}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, totalGasto: parseCurrencyInput(event.target.value) }))
                    }
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label>Frequencia de compra</Label>
                  <Select
                    value={form.frequenciaCompra}
                    onValueChange={(value) =>
                      setForm((current) => ({ ...current, frequenciaCompra: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a frequencia" />
                    </SelectTrigger>
                    <SelectContent>
                      {purchaseFrequencyOptions.map((frequency) => (
                        <SelectItem key={frequency} value={frequency}>
                          {frequency}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="customer-observacoes">Observacoes</Label>
                  <Textarea
                    id="customer-observacoes"
                    value={form.observacoes ?? ""}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, observacoes: event.target.value }))
                    }
                    placeholder="Notas internas, lembretes ou palavras-chave para filtrar na lista e nas campanhas."
                    rows={4}
                    className="min-h-[100px] resize-y"
                  />
                  <p className="text-xs text-muted-foreground">
                    Aparece nos filtros de Clientes e Nova campanha (campo Observacoes).
                  </p>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          {!isFirstStep ? (
            <Button
              variant="outline"
              onClick={() => setStepIndex((current) => current - 1)}
              disabled={loading}
            >
              Voltar
            </Button>
          ) : null}
          {isLastStep ? (
            <Button
              onClick={async () => {
                const payload: CustomerUpsertInput = {
                  ...form,
                  nome: fallbackCustomerDisplayName(form.telefone, form.nome),
                  telefone: formatPhoneE164(form.telefone),
                  celular: form.celular?.trim() ? formatPhoneE164(form.celular) : "",
                };
                await onSubmit(payload);
              }}
              disabled={loading || !normalizePhone(form.telefone).jid}
              className="bg-accent text-accent-foreground hover:bg-accent/90"
            >
              {loading ? "Salvando..." : customer ? "Salvar alteracoes" : "Criar cliente"}
            </Button>
          ) : (
            <Button
              onClick={() => setStepIndex((current) => current + 1)}
              disabled={loading || !canAdvance()}
              className="bg-accent text-accent-foreground hover:bg-accent/90"
            >
              Proxima etapa
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
