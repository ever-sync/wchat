import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
import type { Product, ProductUpsertInput } from "@/types/domain";

const UNIT_OPTIONS = ["UN", "CX", "KG", "G", "LT", "ML", "PC", "FD"] as const;
const GROUP_OPTIONS = [
  "Bebidas",
  "Alimentos",
  "Limpeza",
  "Higiene",
  "Utilidades",
  "Papelaria",
  "Automotivo",
  "Outros",
] as const;

function getInitialForm(product?: Product | null): ProductUpsertInput {
  if (product) {
    return {
      codigo: product.codigo,
      qtdEstoque: product.qtdEstoque,
      nome: product.nome,
      precoCompra: product.precoCompra,
      precoVenda: product.precoVenda,
      codigoBarras: product.codigoBarras,
      unidade: product.unidade,
      ncm: product.ncm,
      cest: product.cest,
      grupo: product.grupo,
      pesoBruto: product.pesoBruto,
      pesoLiquido: product.pesoLiquido,
      comissao: product.comissao,
      status: product.status,
    };
  }

  return {
    codigo: "",
    qtdEstoque: 0,
    nome: "",
    precoCompra: 0,
    precoVenda: 0,
    codigoBarras: "",
    unidade: "UN",
    ncm: "",
    cest: "",
    grupo: "Outros",
    pesoBruto: 0,
    pesoLiquido: 0,
    comissao: 0,
    status: "ativo",
  };
}

function parseNumber(value: string) {
  const normalized = value.replace(",", ".");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function ProductFormDialog({
  open,
  onOpenChange,
  onSubmit,
  product,
  loading = false,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (input: ProductUpsertInput) => Promise<void> | void;
  product?: Product | null;
  loading?: boolean;
}) {
  const [form, setForm] = useState<ProductUpsertInput>(getInitialForm(product));

  useEffect(() => {
    if (open) {
      setForm(getInitialForm(product));
    }
  }, [open, product]);

  const isValid = useMemo(
    () => form.codigo.trim() && form.nome.trim() && form.unidade.trim() && form.grupo.trim(),
    [form],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{product ? "Editar produto" : "Novo produto"}</DialogTitle>
          <DialogDescription>
            Cadastre codigo, precos, estoque e classificacao do produto.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="product-codigo">Codigo</Label>
            <Input
              id="product-codigo"
              value={form.codigo}
              onChange={(event) => setForm((current) => ({ ...current, codigo: event.target.value }))}
              placeholder="PROD-001"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="product-estoque">Qtd. estoque</Label>
            <Input
              id="product-estoque"
              type="number"
              min="0"
              value={form.qtdEstoque}
              onChange={(event) => setForm((current) => ({ ...current, qtdEstoque: parseNumber(event.target.value) }))}
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="product-nome">Nome do produto</Label>
            <Input
              id="product-nome"
              value={form.nome}
              onChange={(event) => setForm((current) => ({ ...current, nome: event.target.value }))}
              placeholder="Nome do produto"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="product-preco-compra">Preco de compra</Label>
            <Input
              id="product-preco-compra"
              type="number"
              min="0"
              step="0.01"
              value={form.precoCompra}
              onChange={(event) => setForm((current) => ({ ...current, precoCompra: parseNumber(event.target.value) }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="product-preco-venda">Preco de venda</Label>
            <Input
              id="product-preco-venda"
              type="number"
              min="0"
              step="0.01"
              value={form.precoVenda}
              onChange={(event) => setForm((current) => ({ ...current, precoVenda: parseNumber(event.target.value) }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="product-barcode">Codigo de barras (GTIN/EAN)</Label>
            <Input
              id="product-barcode"
              value={form.codigoBarras}
              onChange={(event) => setForm((current) => ({ ...current, codigoBarras: event.target.value }))}
              placeholder="7890000000000"
            />
          </div>

          <div className="space-y-2">
            <Label>Unidade</Label>
            <Select value={form.unidade} onValueChange={(value) => setForm((current) => ({ ...current, unidade: value }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {UNIT_OPTIONS.map((unit) => (
                  <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="product-ncm">NCM</Label>
            <Input
              id="product-ncm"
              value={form.ncm}
              onChange={(event) => setForm((current) => ({ ...current, ncm: event.target.value }))}
              placeholder="0000.00.00"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="product-cest">CEST</Label>
            <Input
              id="product-cest"
              value={form.cest}
              onChange={(event) => setForm((current) => ({ ...current, cest: event.target.value }))}
              placeholder="00.000.00"
            />
          </div>

          <div className="space-y-2">
            <Label>Grupo do produto</Label>
            <Select value={form.grupo} onValueChange={(value) => setForm((current) => ({ ...current, grupo: value }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {GROUP_OPTIONS.map((group) => (
                  <SelectItem key={group} value={group}>{group}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={form.status} onValueChange={(value) => setForm((current) => ({ ...current, status: value as ProductUpsertInput["status"] }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ativo">Ativo</SelectItem>
                <SelectItem value="inativo">Inativo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="product-peso-bruto">Peso bruto (quilos)</Label>
            <Input
              id="product-peso-bruto"
              type="number"
              min="0"
              step="0.001"
              value={form.pesoBruto}
              onChange={(event) => setForm((current) => ({ ...current, pesoBruto: parseNumber(event.target.value) }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="product-peso-liquido">Peso liquido (quilos)</Label>
            <Input
              id="product-peso-liquido"
              type="number"
              min="0"
              step="0.001"
              value={form.pesoLiquido}
              onChange={(event) => setForm((current) => ({ ...current, pesoLiquido: parseNumber(event.target.value) }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="product-comissao">Comissao (%)</Label>
            <Input
              id="product-comissao"
              type="number"
              min="0"
              step="0.01"
              value={form.comissao}
              onChange={(event) => setForm((current) => ({ ...current, comissao: parseNumber(event.target.value) }))}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button
            onClick={async () => onSubmit(form)}
            disabled={loading || !isValid}
            className="bg-accent text-accent-foreground hover:bg-accent/90"
          >
            {loading ? "Salvando..." : product ? "Salvar produto" : "Criar produto"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
