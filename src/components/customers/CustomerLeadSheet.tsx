import { useEffect, useMemo, useState } from "react";
import { Briefcase, Calendar, Home, MessageCircle, Plus, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useCustomers } from "@/lib/api/customers";
import { fallbackCustomerDisplayName } from "@/lib/customer-display-name";
import { normalizePhone } from "@/lib/phone";
import type { Customer, CustomerUpsertInput } from "@/types/domain";
import { cn } from "@/lib/utils";

const sheetUi = {
  title: "text-lg font-semibold text-wchat-900",
  label: "text-sm font-semibold text-foreground",
  input:
    "h-10 rounded-[10px] border-input bg-card text-foreground placeholder:text-muted-foreground focus-visible:ring-primary",
  selectTrigger: "h-10 rounded-[10px] border-input bg-card text-foreground",
  selectContent: "border-border bg-card",
  selectItem: "focus:bg-muted",
  linkAdd: "inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline",
  section: "text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground",
  btnSecondary:
    "h-10 rounded-[10px] border-0 bg-wchat-100 px-5 font-semibold text-primary shadow-none hover:bg-wchat-200",
  btnPrimary:
    "h-10 rounded-[10px] border-0 bg-primary px-5 font-semibold text-primary-foreground shadow-none hover:bg-wchat-700",
} as const;

const PHONE_KINDS = [
  { value: "comercial", label: "Comercial", icon: Briefcase },
  { value: "celular", label: "Celular", icon: Smartphone },
  { value: "whatsapp", label: "WhatsApp", icon: MessageCircle },
  { value: "residencial", label: "Residencial", icon: Home },
] as const;

type PhoneKind = (typeof PHONE_KINDS)[number]["value"];

type PhoneRow = { kind: PhoneKind; value: string };

const COMUNICACAO_OPTIONS = [
  "WhatsApp",
  "E-mail",
  "Telefone",
  "SMS",
  "Todos os canais",
  "Nao enviar comunicacoes",
] as const;

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

function baseLeadInput(): CustomerUpsertInput {
  return {
    codigo: "",
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
    tipo: "pj",
    razaoSocial: "",
    inscricaoEstadual: "",
    inscricaoMunicipal: "",
    cpf: "",
    rg: "",
    nascimento: "",
    nomeSocial: "",
    fax: "",
    canal: "colagem_rapida",
    cep: "",
    logradouro: "",
    numero: "",
    bairro: "",
    zone: "",
    complemento: "",
    cidade: "",
    estado: "",
    ativo: true,
    observacoes: "",
    cadastradoEm: new Date().toISOString().slice(0, 10),
    sourceColumns: { origem_importacao: "formulario_contato" },
  };
}

function parseBrDateToIso(value: string): string | undefined {
  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }
  const match = trimmed.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) {
    return undefined;
  }
  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return undefined;
  }
  const iso = `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  const date = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(date.getTime())) {
    return undefined;
  }
  return iso;
}

function isoToBrDisplay(iso: string): string {
  const [y, m, d] = iso.slice(0, 10).split("-");
  if (!y || !m || !d) {
    return "";
  }
  return `${d}/${m}/${y}`;
}

function empresaOptionLabel(c: Customer): string {
  const rs = c.razaoSocial?.trim();
  if (rs) {
    return rs;
  }
  const nome = c.nome?.trim();
  if (nome) {
    return nome;
  }
  return c.id.slice(0, 8);
}

type CustomerLeadSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (input: CustomerUpsertInput) => Promise<void> | void;
  initialOverrides?: Partial<CustomerUpsertInput>;
  loading?: boolean;
};

export function CustomerLeadSheet({
  open,
  onOpenChange,
  onSubmit,
  initialOverrides,
  loading = false,
}: CustomerLeadSheetProps) {
  const { data: customers = [] } = useCustomers({}, { enabled: open });
  const [phoneRows, setPhoneRows] = useState<PhoneRow[]>([{ kind: "comercial", value: "" }]);
  const [leadNome, setLeadNome] = useState("");
  const [emails, setEmails] = useState<string[]>([""]);
  const [empresaId, setEmpresaId] = useState<string>("");
  const [comunicacao, setComunicacao] = useState<string>("");
  const [nascimentoDisplay, setNascimentoDisplay] = useState("");

  const empresas = useMemo(
    () =>
      [...customers]
        .filter((c) => c.tipo === "pj" || (c.cnpj ?? "").replace(/\D/g, "").length >= 8)
        .sort((a, b) => empresaOptionLabel(a).localeCompare(empresaOptionLabel(b), "pt-BR")),
    [customers],
  );

  useEffect(() => {
    if (!open) {
      return;
    }
    const tel = initialOverrides?.telefone?.trim() ?? "";
    setPhoneRows([{ kind: "comercial", value: tel }]);
    setLeadNome(initialOverrides?.nome?.trim() ?? "");
    const em = initialOverrides?.email?.trim() ?? "";
    setEmails(em ? [em] : [""]);
    setEmpresaId("");
    setComunicacao("");
    const nasc = initialOverrides?.nascimento?.trim();
    setNascimentoDisplay(nasc && /^\d{4}-\d{2}-\d{2}$/.test(nasc) ? isoToBrDisplay(nasc) : "");
  }, [open, initialOverrides]);

  const primaryJid = useMemo(() => {
    for (const row of phoneRows) {
      const jid = normalizePhone(row.value).jid;
      if (jid) {
        return jid;
      }
    }
    return undefined;
  }, [phoneRows]);

  async function handleSubmit() {
    const base = baseLeadInput();
    const codigo =
      customers.length > 0 ? nextCustomerCode(customers) : (base.codigo ?? "");

    const normalizedPhones = phoneRows
      .map((row) => ({ ...row, e164: row.value.trim() ? formatPhoneE164(row.value) : "" }))
      .filter((row) => row.e164 && normalizePhone(row.e164).jid);

    const telefone = normalizedPhones[0]?.e164 ?? "";
    const celular =
      normalizedPhones.length > 1 && normalizedPhones[1].e164 !== telefone
        ? normalizedPhones[1].e164
        : "";

    const emailList = emails.map((e) => e.trim()).filter(Boolean);
    const email = emailList[0] ?? "";

    const nascimentoIso = parseBrDateToIso(nascimentoDisplay);

    const empresa = empresaId ? customers.find((c) => c.id === empresaId) : undefined;
    const empresaLabel = empresa ? empresaOptionLabel(empresa) : "";

    const sourceColumns: Record<string, string> = {
      ...base.sourceColumns,
      ...(comunicacao ? { contato_envio_comunicacao: comunicacao } : {}),
      ...(empresa
        ? {
            empresa_contato_id: empresa.id,
            empresa_contato_nome: empresaLabel,
          }
        : {}),
      ...(emailList.length > 1
        ? { emails_secundarios: JSON.stringify(emailList.slice(1)) }
        : {}),
      ...(normalizedPhones.length > 1
        ? {
            telefones_lead: JSON.stringify(
              normalizedPhones.map((p, i) => ({
                tipo: phoneRows[i]?.kind ?? "comercial",
                numero: p.e164,
              })),
            ),
          }
        : {}),
    };

    const payload: CustomerUpsertInput = {
      ...base,
      codigo,
      telefone,
      celular: celular && celular !== telefone ? celular : "",
      email,
      nome: fallbackCustomerDisplayName(telefone, leadNome.trim() || null),
      nascimento: nascimentoIso ?? "",
      tipo: nascimentoIso ? "pf" : base.tipo,
      sourceColumns,
    };

    await onSubmit(payload);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        disableInnerScroll
        className="flex w-full flex-col border-l border-[#e0e0e0] p-0 sm:max-w-none sm:w-[min(100vw-1rem,440px)] md:w-[40vw] md:min-w-[380px] md:max-w-[480px]"
      >
        <div className="flex min-h-0 flex-1 flex-col bg-white">
          <SheetHeader className="shrink-0 space-y-0 border-b border-[#eeeeee] px-6 pb-4 pt-6 text-left">
            <SheetTitle className={sheetUi.title}>Criar Contato</SheetTitle>
          </SheetHeader>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-6 py-5">
            <div className="flex flex-col gap-6">
              <div className="space-y-2">
                <Label className={sheetUi.label}>Telefone</Label>
                <div className="flex flex-col gap-3">
                  {phoneRows.map((row, index) => {
                    const KindIcon =
                      PHONE_KINDS.find((k) => k.value === row.kind)?.icon ?? Briefcase;
                    return (
                      <div key={index} className="flex gap-2">
                        <Select
                          value={row.kind}
                          onValueChange={(value) => {
                            const kind = value as PhoneKind;
                            setPhoneRows((rows) =>
                              rows.map((r, i) => (i === index ? { ...r, kind } : r)),
                            );
                          }}
                        >
                          <SelectTrigger
                            className={cn(
                              sheetUi.selectTrigger,
                              "w-[140px] shrink-0 justify-start gap-2 px-3",
                            )}
                          >
                            <KindIcon className="h-3.5 w-3.5 shrink-0 text-[#546e7a]" />
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className={sheetUi.selectContent}>
                            {PHONE_KINDS.map((k) => {
                              const Icon = k.icon;
                              return (
                                <SelectItem key={k.value} value={k.value} className={sheetUi.selectItem}>
                                  <span className="flex items-center gap-2">
                                    <Icon className="h-3.5 w-3.5 text-[#546e7a]" />
                                    {k.label}
                                  </span>
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                        <Input
                          className={cn(sheetUi.input, "min-w-0 flex-1")}
                          placeholder="+55 (11) 9999-9999"
                          value={row.value}
                          onChange={(event) => {
                            const v = event.target.value;
                            setPhoneRows((rows) => rows.map((r, i) => (i === index ? { ...r, value: v } : r)));
                          }}
                          onBlur={(event) => {
                            const v = event.target.value.trim();
                            if (!v) {
                              return;
                            }
                            const formatted = formatPhoneE164(v);
                            setPhoneRows((rows) =>
                              rows.map((r, i) => (i === index ? { ...r, value: formatted } : r)),
                            );
                          }}
                        />
                      </div>
                    );
                  })}
                </div>
                <button
                  type="button"
                  className={sheetUi.linkAdd}
                  onClick={() => setPhoneRows((rows) => [...rows, { kind: "celular", value: "" }])}
                >
                  <Plus className="h-4 w-4" />
                  Adicionar telefone
                </button>
              </div>

              <div className="space-y-2">
                <Label className={sheetUi.label}>Nome do contato</Label>
                <Input
                  className={sheetUi.input}
                  placeholder="Como aparece no WhatsApp ou nome completo"
                  value={leadNome}
                  onChange={(event) => setLeadNome(event.target.value)}
                  autoComplete="name"
                />
                <p className="text-xs text-[#90a4ae]">
                  Se ficar em branco, o nome sera gerado a partir do telefone.
                </p>
              </div>

              <div className="space-y-2">
                <Label className={sheetUi.label}>E-mail</Label>
                <div className="flex flex-col gap-3">
                  {emails.map((email, index) => (
                    <Input
                      key={index}
                      type="email"
                      className={sheetUi.input}
                      placeholder="seunome@email.com"
                      value={email}
                      onChange={(event) => {
                        const v = event.target.value;
                        setEmails((list) => list.map((e, i) => (i === index ? v : e)));
                      }}
                    />
                  ))}
                </div>
                <button
                  type="button"
                  className={sheetUi.linkAdd}
                  onClick={() => setEmails((list) => [...list, ""])}
                >
                  <Plus className="h-4 w-4" />
                  Adicionar e-mail
                </button>
              </div>

              <div className="space-y-2">
                <Label className={sheetUi.label}>Empresa do contato</Label>
                <Select value={empresaId || "__none__"} onValueChange={(v) => setEmpresaId(v === "__none__" ? "" : v)}>
                  <SelectTrigger className={sheetUi.selectTrigger}>
                    <SelectValue placeholder="Selecionar" />
                  </SelectTrigger>
                  <SelectContent className={sheetUi.selectContent}>
                    <SelectItem value="__none__" className={sheetUi.selectItem}>
                      Selecionar
                    </SelectItem>
                    {empresas.map((c) => (
                      <SelectItem key={c.id} value={c.id} className={sheetUi.selectItem}>
                        {empresaOptionLabel(c)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className={sheetUi.label}>Contato e envio de comunicacao</Label>
                <Select value={comunicacao || "__none__"} onValueChange={(v) => setComunicacao(v === "__none__" ? "" : v)}>
                  <SelectTrigger className={sheetUi.selectTrigger}>
                    <SelectValue placeholder="Selecionar" />
                  </SelectTrigger>
                  <SelectContent className={sheetUi.selectContent}>
                    <SelectItem value="__none__" className={sheetUi.selectItem}>
                      Selecionar
                    </SelectItem>
                    {COMUNICACAO_OPTIONS.map((opt) => (
                      <SelectItem key={opt} value={opt} className={sheetUi.selectItem}>
                        {opt}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <p className={cn(sheetUi.section, "pt-1")}>Informacoes adicionais</p>

              <div className="space-y-2">
                <Label className={sheetUi.label}>Data de nascimento</Label>
                <div className="relative max-w-[200px]">
                  <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#90a4ae]" />
                  <Input
                    className={cn(sheetUi.input, "pl-10")}
                    placeholder="DD/MM/AAAA"
                    inputMode="numeric"
                    autoComplete="bday"
                    value={nascimentoDisplay}
                    onChange={(event) => {
                      let v = event.target.value.replace(/\D/g, "").slice(0, 8);
                      if (v.length >= 5) {
                        v = `${v.slice(0, 2)}/${v.slice(2, 4)}/${v.slice(4)}`;
                      } else if (v.length >= 3) {
                        v = `${v.slice(0, 2)}/${v.slice(2)}`;
                      }
                      setNascimentoDisplay(v);
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex shrink-0 items-center justify-end gap-2 border-t border-[#eeeeee] bg-white px-6 py-4">
            <Button
              type="button"
              variant="ghost"
              className={sheetUi.btnSecondary}
              disabled={loading}
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              className={sheetUi.btnPrimary}
              disabled={loading || !primaryJid}
              onClick={() => void handleSubmit()}
            >
              {loading ? "Salvando..." : "Criar Contato"}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
