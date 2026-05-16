import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { CustomerCustomFieldInput } from "@/components/customers/CustomerCustomFieldInput";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { isSupabaseConfigured } from "@/lib/supabase";
import { useCreateProduct, useDeleteProducts, useProducts, useUpdateProduct } from "@/lib/api/products";
import {
  customFieldValueToString,
  listCategoryIdsForProduct,
  listCustomFieldValuesForProduct,
  upsertProductCustomFieldValues,
  useCreateProductCategory,
  useCreateProductCustomField,
  useDeleteProductCategory,
  useDeleteProductCustomField,
  useProductCategories,
  useProductCategoryAssignments,
  useProductCustomFields,
  useSetProductCategories,
} from "@/lib/api/product-catalog";
import {
  CUSTOM_FIELD_KINDS,
  FIELD_KIND_GROUPS,
  FIELD_KIND_LABEL,
  type CustomFieldKind,
} from "@/lib/custom-field-kinds";
import type { Product, ProductUpsertInput } from "@/types/domain";
import {
  formatCurrencyInput,
  maskCurrencyInputChange,
  parseCurrencyInput,
} from "@/lib/currency-input";
import { cn } from "@/lib/utils";

const PAGE_TABS = ["produtos", "campos", "categorias"] as const;
type PageTab = (typeof PAGE_TABS)[number];

function parseTab(raw: string | null): PageTab {
  if (raw && (PAGE_TABS as readonly string[]).includes(raw)) {
    return raw as PageTab;
  }
  return "produtos";
}

function formatMoney(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function parseOptionsText(text: string): string[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function nextProductCode(products: Product[]) {
  const highest = products.reduce((max, product) => {
    const numeric = Number((product.codigo ?? "").replace(/\D/g, ""));
    if (!Number.isFinite(numeric)) {
      return max;
    }
    return Math.max(max, numeric);
  }, 0);
  return String(highest + 1);
}

function defaultProductInput(): ProductUpsertInput {
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

function productToInput(p: Product): ProductUpsertInput {
  return {
    codigo: p.codigo,
    qtdEstoque: p.qtdEstoque,
    nome: p.nome,
    precoCompra: p.precoCompra,
    precoVenda: p.precoVenda,
    codigoBarras: p.codigoBarras,
    unidade: p.unidade,
    ncm: p.ncm,
    cest: p.cest,
    grupo: p.grupo,
    pesoBruto: p.pesoBruto,
    pesoLiquido: p.pesoLiquido,
    comissao: p.comissao,
    status: p.status,
  };
}

const screen =
  "min-h-0 flex-1 overflow-y-auto bg-background px-4 py-4 pb-24 md:px-6 md:pb-8";

export default function Produtos() {
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = parseTab(searchParams.get("aba"));

  const setTab = useCallback(
    (next: PageTab) => {
      const nextParams = new URLSearchParams(searchParams);
      nextParams.set("aba", next);
      setSearchParams(nextParams, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  const [search, setSearch] = useState("");
  const productQuery = useProducts({ search });

  const products = productQuery.data ?? [];
  const productIds = useMemo(() => products.map((p) => p.id).sort(), [products]);
  const { data: assignmentMap } = useProductCategoryAssignments(productIds);

  const { data: categories = [], isLoading: catLoading } = useProductCategories();
  const createCategory = useCreateProductCategory();
  const deleteCategory = useDeleteProductCategory();

  const { data: fieldDefs = [], isLoading: fieldsLoading } = useProductCustomFields();
  const createField = useCreateProductCustomField();
  const deleteField = useDeleteProductCustomField();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ProductUpsertInput>(() => defaultProductInput());
  const [valorDisplay, setValorDisplay] = useState("");
  const [customValues, setCustomValues] = useState<Record<string, string>>({});
  const [customFieldsLoading, setCustomFieldsLoading] = useState(false);

  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProducts = useDeleteProducts();
  const setProductCats = useSetProductCategories();

  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  const [newCategoryNome, setNewCategoryNome] = useState("");
  const [categoryToDelete, setCategoryToDelete] = useState<{ id: string; nome: string } | null>(null);

  const [newFieldNome, setNewFieldNome] = useState("");
  const [newFieldKind, setNewFieldKind] = useState<CustomFieldKind>("texto");
  const [listaOptionsText, setListaOptionsText] = useState("");
  const [fieldToDelete, setFieldToDelete] = useState<{ id: string; nome: string } | null>(null);

  const [linkProductId, setLinkProductId] = useState<string>("");
  const [linkCats, setLinkCats] = useState<string[]>([]);

  useEffect(() => {
    if (products.length && !linkProductId) {
      setLinkProductId(products[0].id);
    }
  }, [products, linkProductId]);

  useEffect(() => {
    if (!dialogOpen) {
      return;
    }

    if (!editingId) {
      setCustomValues({});
      setCustomFieldsLoading(false);
      return;
    }

    if (fieldDefs.length === 0) {
      setCustomValues({});
      setCustomFieldsLoading(false);
      return;
    }

    let active = true;
    setCustomFieldsLoading(true);

    void listCustomFieldValuesForProduct(editingId)
      .then((rows) => {
        if (!active) {
          return;
        }
        const byField = new Map(rows.map((row) => [row.fieldId, row]));
        const next: Record<string, string> = {};
        for (const field of fieldDefs) {
          const row = byField.get(field.id);
          next[field.id] = row ? customFieldValueToString(field.kind, row) : "";
        }
        setCustomValues(next);
      })
      .catch(() => {
        if (active) {
          setCustomValues({});
        }
      })
      .finally(() => {
        if (active) {
          setCustomFieldsLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [dialogOpen, editingId, fieldDefs]);

  const openCreate = () => {
    setEditingId(null);
    const base = defaultProductInput();
    setForm({
      ...base,
      codigo: products.length > 0 ? nextProductCode(products) : "1",
    });
    setValorDisplay("");
    setCustomValues({});
    setDialogOpen(true);
  };

  const openEdit = (p: Product) => {
    setEditingId(p.id);
    setForm(productToInput(p));
    setValorDisplay(formatCurrencyInput(p.precoVenda));
    setDialogOpen(true);
  };

  const saveProduct = async () => {
    if (!form.nome.trim()) {
      toast({ title: "Informe o nome do produto", variant: "destructive" });
      return;
    }
    const precoVenda = parseCurrencyInput(valorDisplay);
    const payload: ProductUpsertInput = {
      ...(editingId ? form : { ...defaultProductInput(), codigo: form.codigo.trim() || nextProductCode(products) }),
      nome: form.nome.trim(),
      precoVenda,
    };

    try {
      let id = editingId;
      if (editingId) {
        await updateProduct.mutateAsync({ id: editingId, input: payload });
      } else {
        const created = await createProduct.mutateAsync(payload);
        id = created.id;
      }
      if (id && fieldDefs.length > 0) {
        await upsertProductCustomFieldValues(id, fieldDefs, customValues);
      }
      toast({ title: editingId ? "Produto atualizado" : "Produto criado" });
      setDialogOpen(false);
    } catch (e) {
      toast({
        title: "Não foi possível salvar",
        description: e instanceof Error ? e.message : undefined,
        variant: "destructive",
      });
    }
  };



  const listaOptions = parseOptionsText(listaOptionsText);
  const canSubmitField =
    newFieldNome.trim() && !createField.isPending && (newFieldKind !== "lista" || listaOptions.length > 0);

  const categoryById = useMemo(() => new Map(categories.map((c) => [c.id, c.nome])), [categories]);

  const extrasDisabled = !isSupabaseConfigured;

  return (
    <div className={screen}>
      <div className="mx-auto max-w-5xl space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <h1 className="text-xl font-semibold tracking-tight text-foreground md:text-2xl">Serviços e produtos</h1>
            <p className="text-sm text-muted-foreground">
              Cadastro com nome e valor; campos extras e categorias na aba correspondente.
            </p>
          </div>
        </div>

        {extrasDisabled ? (
          <Card className="border-amber-200 bg-amber-50/50">
            <CardHeader className="py-3">
              <CardTitle className="text-base">Modo offline</CardTitle>
              <CardDescription>
                Campos personalizados e categorias ficam disponíveis com Supabase configurado. A lista de produtos pode
                usar armazenamento local.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : null}

        <Tabs value={tab} onValueChange={(v) => setTab(v as PageTab)} className="space-y-4">
          <TabsList className="h-auto flex-wrap rounded-[10px] bg-muted/60 p-1">
            <TabsTrigger value="produtos" className="rounded-[8px] px-4">
              Catálogo
            </TabsTrigger>
            <TabsTrigger value="campos" className="rounded-[8px] px-4" disabled={extrasDisabled}>
              Campos personalizados
            </TabsTrigger>
            <TabsTrigger value="categorias" className="rounded-[8px] px-4" disabled={extrasDisabled}>
              Categorias
            </TabsTrigger>
          </TabsList>

          <TabsContent value="produtos" className="space-y-4 focus-visible:outline-none">
            <Card className="overflow-hidden rounded-[10px] border-border shadow-sm">
              <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 border-b border-border bg-card py-4">
                <div>
                  <CardTitle className="text-base">Seus produtos</CardTitle>
                  <CardDescription>Nome e valor são os dados principais de cada item.</CardDescription>
                </div>
                <Button type="button" size="sm" className="gap-2 rounded-[10px]" onClick={openCreate}>
                  <Plus className="h-4 w-4" />
                  Novo produto
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                <div className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-3">
                  <Input
                    placeholder="Buscar por nome…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="max-w-xs rounded-[10px]"
                  />
                </div>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead>Nome</TableHead>
                        <TableHead className="w-[140px]">Valor</TableHead>
                        <TableHead className="hidden min-w-[160px] sm:table-cell">Categoria</TableHead>
                        <TableHead className="w-[120px]" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {productQuery.isLoading ? (
                        <TableRow>
                          <TableCell colSpan={4} className="py-10 text-center text-muted-foreground">
                            <Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin" />
                            Carregando…
                          </TableCell>
                        </TableRow>
                      ) : products.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="py-10 text-center text-muted-foreground">
                            Nenhum produto encontrado.
                          </TableCell>
                        </TableRow>
                      ) : (
                        products.map((p) => {
                          const catIds = assignmentMap?.get(p.id) ?? [];
                          return (
                          <TableRow key={p.id} className="border-border">
                            <TableCell className="font-medium">{p.nome}</TableCell>
                            <TableCell className="tabular-nums text-muted-foreground">
                              {p.precoVenda > 0 ? formatMoney(p.precoVenda) : "—"}
                            </TableCell>
                            <TableCell className="hidden sm:table-cell">
                              <div className="flex flex-wrap gap-1">
                                {catIds.length === 0 ? (
                                  <span className="text-xs text-muted-foreground">—</span>
                                ) : (
                                  catIds.map((cid) => (
                                    <Badge key={cid} variant="secondary" className="text-[10px] font-normal">
                                      {categoryById.get(cid) ?? cid.slice(0, 6)}
                                    </Badge>
                                  ))
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 gap-1 rounded-[8px]"
                                  onClick={() => openEdit(p)}
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                  Editar
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 rounded-[8px] text-destructive hover:text-destructive"
                                  aria-label={`Excluir ${p.nome}`}
                                  onClick={() => setProductToDelete(p)}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="campos" className="space-y-4 focus-visible:outline-none">
            <Card className="rounded-[10px]">
              <CardHeader>
                <CardTitle className="text-base">Campos personalizados</CardTitle>
                <CardDescription>
                  Defina atributos extras (texto, números, datas, listas e mais). Eles aparecem ao criar ou editar um
                  produto.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3 rounded-lg border border-border bg-muted/20 p-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5 sm:col-span-2">
                      <Label htmlFor="field-nome">Nome do campo</Label>
                      <Input
                        id="field-nome"
                        value={newFieldNome}
                        onChange={(e) => setNewFieldNome(e.target.value)}
                        placeholder="Ex.: Validade, Lote, Garantia"
                        className="rounded-[10px]"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Tipo</Label>
                      <Select value={newFieldKind} onValueChange={(v) => setNewFieldKind(v as CustomFieldKind)}>
                        <SelectTrigger className="rounded-[10px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="max-h-[min(60dvh,320px)]">
                          {FIELD_KIND_GROUPS.map((group) => (
                            <SelectGroup key={group}>
                              <SelectLabel>{group}</SelectLabel>
                              {CUSTOM_FIELD_KINDS.filter((k) => k.group === group).map((k) => (
                                <SelectItem key={k.value} value={k.value}>
                                  {k.label}
                                </SelectItem>
                              ))}
                            </SelectGroup>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-end">
                      <Button
                        type="button"
                        className="w-full rounded-[10px]"
                        disabled={!canSubmitField}
                        onClick={() => {
                          createField.mutate(
                            {
                              nome: newFieldNome,
                              kind: newFieldKind,
                              options: newFieldKind === "lista" ? listaOptions : undefined,
                            },
                            {
                              onSuccess: () => {
                                toast({ title: "Campo criado" });
                                setNewFieldNome("");
                                setListaOptionsText("");
                              },
                              onError: (e) =>
                                toast({ title: "Erro ao criar campo", description: e.message, variant: "destructive" }),
                            },
                          );
                        }}
                      >
                        {createField.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Cadastrar campo"}
                      </Button>
                    </div>
                  </div>

                  {newFieldKind === "lista" ? (
                    <div className="space-y-1.5">
                      <Label htmlFor="field-opcoes">Opções da lista (uma por linha)</Label>
                      <Textarea
                        id="field-opcoes"
                        value={listaOptionsText}
                        onChange={(e) => setListaOptionsText(e.target.value)}
                        placeholder={"Opção A\nOpção B\nOpção C"}
                        className="min-h-[88px] rounded-[10px]"
                      />
                    </div>
                  ) : null}
                </div>
                <div className="overflow-x-auto rounded-lg border border-border">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead>Campo</TableHead>
                        <TableHead className="min-w-[140px]">Tipo</TableHead>
                        <TableHead className="w-[80px]" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {fieldsLoading ? (
                        <TableRow>
                          <TableCell colSpan={3} className="py-8 text-center text-muted-foreground">
                            Carregando…
                          </TableCell>
                        </TableRow>
                      ) : fieldDefs.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={3} className="py-8 text-center text-muted-foreground">
                            Nenhum campo definido.
                          </TableCell>
                        </TableRow>
                      ) : (
                        fieldDefs.map((f) => (
                          <TableRow key={f.id}>
                            <TableCell className="font-medium">{f.nome}</TableCell>
                            <TableCell className="text-muted-foreground">{FIELD_KIND_LABEL[f.kind]}</TableCell>
                            <TableCell className="text-right">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive"
                                onClick={() => setFieldToDelete({ id: f.id, nome: f.nome })}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>

              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="categorias" className="space-y-4 focus-visible:outline-none">
            <Card className="rounded-[10px]">
              <CardHeader>
                <CardTitle className="text-base">Categorias do catálogo</CardTitle>
                <CardDescription>Agrupe produtos livremente e vincule na segunda seção.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-wrap items-end gap-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="cat-nome">Nova categoria</Label>
                    <Input
                      id="cat-nome"
                      value={newCategoryNome}
                      onChange={(e) => setNewCategoryNome(e.target.value)}
                      placeholder="Nome da categoria"
                      className="w-[220px] rounded-[10px]"
                    />
                  </div>
                  <Button
                    type="button"
                    className="rounded-[10px]"
                    disabled={!newCategoryNome.trim() || createCategory.isPending}
                    onClick={() => {
                      createCategory.mutate(newCategoryNome.trim(), {
                        onSuccess: () => {
                          toast({ title: "Categoria criada" });
                          setNewCategoryNome("");
                        },
                        onError: (e) =>
                          toast({ title: "Erro", description: e.message, variant: "destructive" }),
                      });
                    }}
                  >
                    {createCategory.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Adicionar"}
                  </Button>
                </div>

                <div className="overflow-x-auto rounded-lg border border-border">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead>Nome</TableHead>
                        <TableHead className="w-[80px]" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {catLoading ? (
                        <TableRow>
                          <TableCell colSpan={2} className="py-8 text-center text-muted-foreground">
                            Carregando…
                          </TableCell>
                        </TableRow>
                      ) : categories.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={2} className="py-8 text-center text-muted-foreground">
                            Nenhuma categoria ainda.
                          </TableCell>
                        </TableRow>
                      ) : (
                        categories.map((c) => (
                          <TableRow key={c.id}>
                            <TableCell className="font-medium">{c.nome}</TableCell>
                            <TableCell className="text-right">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive"
                                onClick={() => setCategoryToDelete({ id: c.id, nome: c.nome })}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>

                <div className="space-y-3 rounded-lg border border-dashed border-border p-4">
                  <Label className="text-base font-semibold">Vincular categorias a um produto</Label>
                  <p className="text-sm text-muted-foreground">Marque todas as categorias que se aplicam ao produto.</p>
                  <div className="flex flex-wrap gap-3">
                    <div className="space-y-1.5">
                      <Label>Produto</Label>
                      <Select value={linkProductId} onValueChange={setLinkProductId}>
                        <SelectTrigger className="w-[260px] rounded-[10px]">
                          <SelectValue placeholder="Escolha" />
                        </SelectTrigger>
                        <SelectContent className="max-h-64">
                          {products.map((p) => (
                            <SelectItem key={p.id} value={p.id}>
                              {p.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <LoadLinkCats productId={linkProductId} onLoaded={setLinkCats} />
                  <div className="grid gap-2 sm:grid-cols-2">
                    {categories.map((c) => (
                      <label
                        key={c.id}
                        className={cn(
                          "flex cursor-pointer items-center gap-2 rounded-[10px] border border-transparent px-2 py-1.5 hover:bg-muted/60",
                          linkCats.includes(c.id) && "border-primary/30 bg-primary/5",
                        )}
                      >
                        <Checkbox
                          checked={linkCats.includes(c.id)}
                          onCheckedChange={(chk) => {
                            setLinkCats((prev) =>
                              chk === true ? [...prev, c.id] : prev.filter((id) => id !== c.id),
                            );
                          }}
                        />
                        <span className="text-sm">{c.nome}</span>
                      </label>
                    ))}
                  </div>
                  <Button
                    type="button"
                    className="rounded-[10px]"
                    disabled={!linkProductId || setProductCats.isPending}
                    onClick={() =>
                      setProductCats.mutate(
                        { productId: linkProductId, categoryIds: linkCats },
                        {
                          onSuccess: () => toast({ title: "Categorias atualizadas" }),
                          onError: (e) =>
                            toast({ title: "Erro ao salvar", description: e.message, variant: "destructive" }),
                        },
                      )
                    }
                  >
                    {setProductCats.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Salvar vínculos
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto rounded-[12px] sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar produto" : "Novo produto"}</DialogTitle>
            <DialogDescription>
              Informe nome e valor. Campos extras definidos na aba Campos personalizados aparecem abaixo.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="nome">Nome</Label>
              <Input
                id="nome"
                className="rounded-[10px]"
                value={form.nome}
                onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
                placeholder="Nome do produto"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="valor">Valor</Label>
              <Input
                id="valor"
                className="rounded-[10px]"
                inputMode="numeric"
                value={valorDisplay}
                onChange={(e) => setValorDisplay(maskCurrencyInputChange(e.target.value))}
                placeholder="R$ 0,00"
              />
            </div>

            {fieldDefs.length > 0 ? (
              <div className="space-y-4 border-t border-border/60 pt-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Campos personalizados
                </p>
                {customFieldsLoading ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Carregando…
                  </div>
                ) : (
                  fieldDefs.map((field) => (
                    <CustomerCustomFieldInput
                      key={field.id}
                      field={field}
                      value={customValues[field.id] ?? ""}
                      onChange={(value) =>
                        setCustomValues((current) => ({ ...current, [field.id]: value }))
                      }
                    />
                  ))
                )}
              </div>
            ) : null}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" className="rounded-[10px]" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              type="button"
              className="rounded-[10px]"
              disabled={createProduct.isPending || updateProduct.isPending}
              onClick={() => void saveProduct()}
            >
              {(createProduct.isPending || updateProduct.isPending) && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(productToDelete)} onOpenChange={(o) => !o && setProductToDelete(null)}>
        <AlertDialogContent className="rounded-[12px]">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir produto?</AlertDialogTitle>
            <AlertDialogDescription>
              {productToDelete
                ? `“${productToDelete.nome}” será removido do catálogo. Esta ação não pode ser desfeita.`
                : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-[10px]" disabled={deleteProducts.isPending}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              className="rounded-[10px] bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteProducts.isPending}
              onClick={(e) => {
                e.preventDefault();
                if (!productToDelete) {
                  return;
                }
                void (async () => {
                  try {
                    await deleteProducts.mutateAsync([productToDelete.id]);
                    if (linkProductId === productToDelete.id) {
                      setLinkProductId("");
                      setLinkCats([]);
                    }
                    if (editingId === productToDelete.id) {
                      setDialogOpen(false);
                      setEditingId(null);
                    }
                    toast({
                      title: "Produto excluído",
                      description: `${productToDelete.nome} foi removido.`,
                    });
                    setProductToDelete(null);
                  } catch (err) {
                    toast({
                      title: "Não foi possível excluir",
                      description: err instanceof Error ? err.message : "Tente novamente.",
                      variant: "destructive",
                    });
                  }
                })();
              }}
            >
              {deleteProducts.isPending ? "Excluindo…" : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={Boolean(categoryToDelete)} onOpenChange={(o) => !o && setCategoryToDelete(null)}>
        <AlertDialogContent className="rounded-[12px]">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir categoria?</AlertDialogTitle>
            <AlertDialogDescription>
              {categoryToDelete?.nome} será removida e desvinculada dos produtos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-[10px]">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-[10px]"
              onClick={() => {
                if (!categoryToDelete) return;
                deleteCategory.mutate(categoryToDelete.id, {
                  onSuccess: () => {
                    toast({ title: "Categoria removida" });
                    setCategoryToDelete(null);
                  },
                  onError: (e) =>
                    toast({ title: "Erro", description: e.message, variant: "destructive" }),
                });
              }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={Boolean(fieldToDelete)} onOpenChange={(o) => !o && setFieldToDelete(null)}>
        <AlertDialogContent className="rounded-[12px]">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir campo?</AlertDialogTitle>
            <AlertDialogDescription>
              {fieldToDelete?.nome}: valores salvos nos produtos serão apagados em cascata.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-[10px]">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-[10px]"
              onClick={() => {
                if (!fieldToDelete) return;
                deleteField.mutate(fieldToDelete.id, {
                  onSuccess: () => {
                    toast({ title: "Campo removido" });
                    setFieldToDelete(null);
                  },
                  onError: (e) =>
                    toast({ title: "Erro", description: e.message, variant: "destructive" }),
                });
              }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function LoadLinkCats({ productId, onLoaded }: { productId: string; onLoaded: (ids: string[]) => void }) {
  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!productId || !isSupabaseConfigured) {
        onLoaded([]);
        return;
      }
      try {
        const ids = await listCategoryIdsForProduct(productId);
        if (!cancelled) onLoaded(ids);
      } catch {
        if (!cancelled) onLoaded([]);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [productId, onLoaded]);

  return null;
}
