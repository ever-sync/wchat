import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Calendar,
  ChevronDown,
  Hash,
  Loader2,
  Package,
  Pencil,
  Plus,
  Trash2,
  Type,
} from "lucide-react";
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { isSupabaseConfigured } from "@/lib/supabase";
import { useCreateProduct, useProducts, useUpdateProduct } from "@/lib/api/products";
import {
  listCategoryIdsForProduct,
  useCreateProductCategory,
  useCreateProductCustomField,
  useCustomFieldValues,
  useDeleteProductCategory,
  useDeleteProductCustomField,
  useProductCategories,
  useProductCategoryAssignments,
  useProductCustomFields,
  useSetProductCategories,
  useUpsertCustomFieldValue,
  type ProductCustomFieldKind,
} from "@/lib/api/product-catalog";
import type { Product, ProductUpsertInput } from "@/types/domain";
import { cn } from "@/lib/utils";

const PAGE_TABS = ["produtos", "campos", "categorias"] as const;
type PageTab = (typeof PAGE_TABS)[number];

function parseTab(raw: string | null): PageTab {
  if (raw && (PAGE_TABS as readonly string[]).includes(raw)) {
    return raw as PageTab;
  }
  return "produtos";
}

const FIELD_KIND_LABEL: Record<ProductCustomFieldKind, string> = {
  texto: "Texto",
  numero: "Número",
  data: "Data",
};

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
  const productIds = useMemo(() => [...products.map((p) => p.id)].sort(), [products]);
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
  const [categorySelection, setCategorySelection] = useState<string[]>([]);
  const [categoriesOpen, setCategoriesOpen] = useState(false);

  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const setProductCats = useSetProductCategories();

  const [newCategoryNome, setNewCategoryNome] = useState("");
  const [categoryToDelete, setCategoryToDelete] = useState<{ id: string; nome: string } | null>(null);

  const [newFieldNome, setNewFieldNome] = useState("");
  const [newFieldKind, setNewFieldKind] = useState<ProductCustomFieldKind>("texto");
  const [fieldToDelete, setFieldToDelete] = useState<{ id: string; nome: string } | null>(null);

  const [linkProductId, setLinkProductId] = useState<string>("");
  const [linkCats, setLinkCats] = useState<string[]>([]);

  const [valuesProductId, setValuesProductId] = useState<string>("");

  useEffect(() => {
    if (products.length && !valuesProductId) {
      setValuesProductId(products[0].id);
      setLinkProductId((prev) => prev || products[0].id);
    }
  }, [products, valuesProductId]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!dialogOpen || !editingId) return;
      try {
        const ids = await listCategoryIdsForProduct(editingId);
        if (!cancelled) setCategorySelection(ids);
      } catch {
        if (!cancelled) setCategorySelection([]);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [dialogOpen, editingId]);

  const openCreate = () => {
    setEditingId(null);
    setForm(defaultProductInput());
    setCategorySelection([]);
    setDialogOpen(true);
  };

  const openEdit = (p: Product) => {
    setEditingId(p.id);
    setForm(productToInput(p));
    setDialogOpen(true);
  };

  const saveProduct = async () => {
    if (!form.codigo.trim() || !form.nome.trim()) {
      toast({ title: "Preencha código e nome", variant: "destructive" });
      return;
    }
    try {
      let id = editingId;
      if (editingId) {
        await updateProduct.mutateAsync({ id: editingId, input: form });
      } else {
        const created = await createProduct.mutateAsync(form);
        id = created.id;
      }
      if (id) {
        await setProductCats.mutateAsync({ productId: id, categoryIds: categorySelection });
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



  const categoryById = useMemo(() => new Map(categories.map((c) => [c.id, c.nome])), [categories]);

  const extrasDisabled = !isSupabaseConfigured;

  return (
    <div className={screen}>
      <div className="mx-auto max-w-5xl space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <h1 className="text-xl font-semibold tracking-tight text-foreground md:text-2xl">Produtos</h1>
            <p className="text-sm text-muted-foreground">
              Cadastro com código e nome; personalize campos e categorias por tenant.
            </p>
          </div>
        </div>

        {extrasDisabled ? (
          <Card className="border-amber-200 bg-amber-50/50">
            <CardHeader className="py-3">
              <CardTitle className="text-base">Modo offline</CardTitle>
              <CardDescription>
                Campos extras e categorias ficam disponíveis com Supabase configurado. A lista de produtos pode usar
                armazenamento local.
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
              Campos extras
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
                  <CardDescription>Código interno e nome são o núcleo do cadastro.</CardDescription>
                </div>
                <Button type="button" size="sm" className="gap-2 rounded-[10px]" onClick={openCreate}>
                  <Plus className="h-4 w-4" />
                  Novo produto
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                <div className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-3">
                  <Input
                    placeholder="Buscar por nome ou código…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="max-w-xs rounded-[10px]"
                  />
                </div>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="w-[120px]">Código</TableHead>
                        <TableHead>Nome</TableHead>
                        <TableHead className="hidden sm:table-cell">Categorias</TableHead>
                        <TableHead className="w-[100px]" />
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
                          const cats = assignmentMap?.get(p.id) ?? [];
                          return (
                            <TableRow key={p.id} className="border-border">
                              <TableCell className="font-mono text-sm">{p.codigo}</TableCell>
                              <TableCell className="font-medium">{p.nome}</TableCell>
                              <TableCell className="hidden sm:table-cell">
                                <div className="flex flex-wrap gap-1">
                                  {cats.length === 0 ? (
                                    <span className="text-xs text-muted-foreground">—</span>
                                  ) : (
                                    cats.map((cid) => (
                                      <Badge key={cid} variant="secondary" className="text-[10px] font-normal">
                                        {categoryById.get(cid) ?? cid.slice(0, 6)}
                                      </Badge>
                                    ))
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="text-right">
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
                <CardTitle className="text-base">Definições de campos</CardTitle>
                <CardDescription>
                  Crie atributos adicionais (texto, número ou data) e preencha por produto abaixo.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-wrap items-end gap-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="field-nome">Nome do campo</Label>
                    <Input
                      id="field-nome"
                      value={newFieldNome}
                      onChange={(e) => setNewFieldNome(e.target.value)}
                      placeholder="Ex.: Validade, Lote, Garantia"
                      className="w-[220px] rounded-[10px]"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Tipo</Label>
                    <Select value={newFieldKind} onValueChange={(v) => setNewFieldKind(v as ProductCustomFieldKind)}>
                      <SelectTrigger className="w-[140px] rounded-[10px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="texto">Texto</SelectItem>
                        <SelectItem value="numero">Número</SelectItem>
                        <SelectItem value="data">Data</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    type="button"
                    className="rounded-[10px]"
                    disabled={!newFieldNome.trim() || createField.isPending}
                    onClick={() => {
                      createField.mutate(
                        { nome: newFieldNome, kind: newFieldKind },
                        {
                          onSuccess: () => {
                            toast({ title: "Campo criado" });
                            setNewFieldNome("");
                          },
                          onError: (e) =>
                            toast({ title: "Erro ao criar campo", description: e.message, variant: "destructive" }),
                        },
                      );
                    }}
                  >
                    {createField.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Adicionar"}
                  </Button>
                </div>

                <div className="overflow-x-auto rounded-lg border border-border">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead>Campo</TableHead>
                        <TableHead className="w-[100px]">Tipo</TableHead>
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
                            Nenhum campo extra definido.
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

                <ValuesEditor
                  products={products}
                  productId={valuesProductId}
                  onProductId={setValuesProductId}
                  fieldDefs={fieldDefs}
                />
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
                              {p.codigo} — {p.nome}
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
              Informe código e nome. Opcionalmente abra &quot;Mais dados&quot; para preço, estoque e outros campos do
              ERP.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="codigo">Código (ID)</Label>
                <div className="relative">
                  <Hash className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="codigo"
                    className="rounded-[10px] pl-8"
                    value={form.codigo}
                    onChange={(e) => setForm((f) => ({ ...f, codigo: e.target.value }))}
                    disabled={Boolean(editingId)}
                  />
                </div>
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="nome">Nome</Label>
                <div className="relative">
                  <Package className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="nome"
                    className="rounded-[10px] pl-8"
                    value={form.nome}
                    onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            <Collapsible open={categoriesOpen} onOpenChange={setCategoriesOpen}>
              <CollapsibleTrigger asChild>
                <Button type="button" variant="outline" className="w-full justify-between rounded-[10px]">
                  Categorias
                  <ChevronDown
                    className={cn("h-4 w-4 transition-transform", categoriesOpen && "rotate-180")}
                  />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2 space-y-2 rounded-[10px] border border-border p-3">
                {categories.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Crie categorias na aba Categorias.</p>
                ) : (
                  categories.map((c) => (
                    <label key={c.id} className="flex cursor-pointer items-center gap-2 text-sm">
                      <Checkbox
                        checked={categorySelection.includes(c.id)}
                        onCheckedChange={(chk) =>
                          setCategorySelection((prev) =>
                            chk === true ? [...prev, c.id] : prev.filter((id) => id !== c.id),
                          )
                        }
                      />
                      {c.nome}
                    </label>
                  ))
                )}
              </CollapsibleContent>
            </Collapsible>

            <Collapsible>
              <CollapsibleTrigger asChild>
                <Button type="button" variant="ghost" className="w-full justify-between rounded-[10px] text-primary">
                  Mais dados (ERP)
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2 space-y-3 rounded-[10px] border border-border bg-muted/30 p-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Preço venda</Label>
                    <Input
                      type="number"
                      className="h-8 rounded-[8px] text-sm"
                      value={form.precoVenda}
                      onChange={(e) => setForm((f) => ({ ...f, precoVenda: Number(e.target.value) || 0 }))}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Preço compra</Label>
                    <Input
                      type="number"
                      className="h-8 rounded-[8px] text-sm"
                      value={form.precoCompra}
                      onChange={(e) => setForm((f) => ({ ...f, precoCompra: Number(e.target.value) || 0 }))}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Estoque</Label>
                    <Input
                      type="number"
                      className="h-8 rounded-[8px] text-sm"
                      value={form.qtdEstoque}
                      onChange={(e) => setForm((f) => ({ ...f, qtdEstoque: Number(e.target.value) || 0 }))}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Unidade</Label>
                    <Input
                      className="h-8 rounded-[8px] text-sm"
                      value={form.unidade}
                      onChange={(e) => setForm((f) => ({ ...f, unidade: e.target.value }))}
                    />
                  </div>
                  <div className="col-span-2 space-y-1">
                    <Label className="text-xs">Grupo</Label>
                    <Input
                      className="h-8 rounded-[8px] text-sm"
                      value={form.grupo}
                      onChange={(e) => setForm((f) => ({ ...f, grupo: e.target.value }))}
                    />
                  </div>
                  <div className="col-span-2 space-y-1">
                    <Label className="text-xs">Código de barras</Label>
                    <Input
                      className="h-8 rounded-[8px] text-sm"
                      value={form.codigoBarras}
                      onChange={(e) => setForm((f) => ({ ...f, codigoBarras: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Status</Label>
                    <Select
                      value={form.status}
                      onValueChange={(v) => setForm((f) => ({ ...f, status: v as ProductUpsertInput["status"] }))}
                    >
                      <SelectTrigger className="h-8 rounded-[8px] text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ativo">Ativo</SelectItem>
                        <SelectItem value="inativo">Inativo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
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

function ValuesEditor({
  products,
  productId,
  onProductId,
  fieldDefs,
}: {
  products: Product[];
  productId: string;
  onProductId: (id: string) => void;
  fieldDefs: { id: string; nome: string; kind: ProductCustomFieldKind }[];
}) {
  const { toast } = useToast();
  const { data: values = [], isLoading } = useCustomFieldValues(productId || null);
  const upsert = useUpsertCustomFieldValue();

  const valMap = useMemo(() => new Map(values.map((v) => [v.fieldId, v])), [values]);

  return (
    <div className="space-y-3 rounded-lg border border-border p-4">
      <Label className="text-base font-semibold">Valores por produto</Label>
      <Select value={productId} onValueChange={onProductId}>
        <SelectTrigger className="max-w-md rounded-[10px]">
          <SelectValue placeholder="Escolha o produto" />
        </SelectTrigger>
        <SelectContent className="max-h-64">
          {products.map((p) => (
            <SelectItem key={p.id} value={p.id}>
              {p.codigo} — {p.nome}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {!productId || fieldDefs.length === 0 ? (
        <p className="text-sm text-muted-foreground">Escolha um produto e defina ao menos um campo extra.</p>
      ) : isLoading ? (
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {fieldDefs.map((f) => {
            const row = valMap.get(f.id);
            const defaultStr =
              f.kind === "texto"
                ? (row?.valueText ?? "")
                : f.kind === "numero"
                  ? row?.valueNumeric != null
                    ? String(row.valueNumeric)
                    : ""
                  : row?.valueDate ?? "";

            return (
              <FieldValueInput
                key={f.id}
                label={f.nome}
                kind={f.kind}
                defaultValue={defaultStr}
                onCommit={(raw) =>
                  upsert.mutate(
                    { productId, fieldId: f.id, kind: f.kind, raw },
                    {
                      onError: (e) =>
                        toast({ title: "Não salvou", description: e.message, variant: "destructive" }),
                    },
                  )
                }
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

function FieldValueInput({
  label,
  kind,
  defaultValue,
  onCommit,
}: {
  label: string;
  kind: ProductCustomFieldKind;
  defaultValue: string;
  onCommit: (raw: string) => void;
}) {
  const [local, setLocal] = useState(defaultValue);

  useEffect(() => {
    setLocal(defaultValue);
  }, [defaultValue, kind]);

  const Icon = kind === "data" ? Calendar : kind === "numero" ? Hash : Type;

  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Icon className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            className="rounded-[10px] pl-8 text-sm"
            type={kind === "data" ? "date" : kind === "numero" ? "text" : "text"}
            inputMode={kind === "numero" ? "decimal" : undefined}
            value={local}
            onChange={(e) => setLocal(e.target.value)}
            onBlur={() => {
              if (local !== defaultValue) onCommit(local);
            }}
          />
        </div>
        <Button type="button" variant="secondary" size="sm" className="shrink-0 rounded-[8px]" onClick={() => onCommit(local)}>
          OK
        </Button>
      </div>
    </div>
  );
}
