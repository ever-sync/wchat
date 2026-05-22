import { useMemo, useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { AlertCircle, ArrowLeft, Code2, Eye, Loader2, Monitor, Save, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { DEFAULT_CRM_FUNNELS } from "@/data/crm-funnels";
import { useEffectiveCrmFunnels } from "@/lib/api/crm-funnel-config";
import { useUpdateMarketingForm } from "@/lib/api/marketing-forms";
import { useMarketingEmailTemplates } from "@/lib/api/marketing-email-templates";
import { validateBuilderFields } from "@/lib/marketing/form-validation";
import {
  createDefaultField,
  DEFAULT_FORM_THEME,
  type FormField,
  type FormFieldType,
  type FormSettings,
  type FormTheme,
  type MarketingFormRecord,
} from "@/lib/marketing/form-types";
import { ContactFieldPalette } from "./ContactFieldPalette";
import { SortableFieldItem } from "./SortableFieldItem";
import { FieldEditor } from "./FieldEditor";
import { EmbedSnippetDialog } from "./EmbedSnippetDialog";
import { ABTestPanel } from "./ABTestPanel";
import { EmailTemplatesDialog } from "./EmailTemplatesDialog";

const TENANT_DEFAULT = "__tenant_default__";

function FormPreview({
  fields,
  device,
  submitMessage,
  theme,
}: {
  fields: FormField[];
  device: "desktop" | "mobile";
  submitMessage: string;
  theme: FormTheme;
}) {
  return (
    <div className="h-full overflow-y-auto p-4">
      <div
        className="mx-auto rounded-xl border p-4 shadow-sm"
        style={{
          maxWidth: device === "mobile" ? 420 : 760,
          backgroundColor: theme.backgroundColor,
          color: theme.textColor,
          borderRadius: `${theme.borderRadius}px`,
        }}
      >
        <h3 className="mb-1 text-base font-semibold">Pré-visualização</h3>
        <p className="mb-4 text-xs opacity-70">Visualização local do rascunho atual.</p>

        {fields.length === 0 ? (
          <div className="rounded-lg border border-dashed px-4 py-10 text-center text-sm opacity-60">
            Adicione campos para visualizar o formulário.
          </div>
        ) : (
          <div className="space-y-3">
            {fields.map((field) => {
              if (field.type === "hidden") return null;
              return (
                <div key={field.id} className="space-y-1.5">
                  <label className="text-sm font-medium">
                    {field.label || "Sem rótulo"}
                    {field.required ? <span className="ml-1 text-red-500">*</span> : null}
                  </label>

                  {(field.type === "text" || field.type === "email" || field.type === "phone" || field.type === "date") && (
                    <input
                      disabled
                      type={field.type === "phone" ? "tel" : field.type}
                      placeholder={field.placeholder || ""}
                      className="w-full rounded-md border px-3 py-2 text-sm"
                    />
                  )}

                  {field.type === "textarea" && (
                    <textarea
                      disabled
                      rows={3}
                      placeholder={field.placeholder || ""}
                      className="w-full rounded-md border px-3 py-2 text-sm"
                    />
                  )}

                  {field.type === "select" && (
                    <select disabled className="w-full rounded-md border px-3 py-2 text-sm">
                      <option>Selecione...</option>
                      {(field.options ?? []).map((option) => (
                        <option key={option.value}>{option.label}</option>
                      ))}
                    </select>
                  )}

                  {(field.type === "checkbox" || field.type === "radio") && (
                    <div className="space-y-1.5 rounded-md border p-2.5">
                      {(field.options ?? []).map((option) => (
                        <label key={option.value} className="flex items-center gap-2 text-sm">
                          <input type={field.type} disabled />
                          {option.label}
                        </label>
                      ))}
                    </div>
                  )}

                  {field.helpText ? <p className="text-xs opacity-70">{field.helpText}</p> : null}
                </div>
              );
            })}

            <button
              type="button"
              className="mt-2 w-full px-3 py-2 text-sm font-medium text-white"
              style={{ backgroundColor: theme.primaryColor, borderRadius: `${theme.borderRadius}px` }}
              disabled
            >
              Enviar
            </button>
            <p className="text-center text-xs opacity-60">{submitMessage || "Obrigado!"}</p>
          </div>
        )}
      </div>
    </div>
  );
}

interface MarketingFormBuilderProps {
  form: MarketingFormRecord;
  onClose: () => void;
}

export function MarketingFormBuilder({ form, onClose }: MarketingFormBuilderProps) {
  const { toast } = useToast();
  const { data: funnels = DEFAULT_CRM_FUNNELS } = useEffectiveCrmFunnels();
  const { data: emailTemplates = [] } = useMarketingEmailTemplates();
  const updateForm = useUpdateMarketingForm();

  const [name, setName] = useState(form.name);
  const [fields, setFields] = useState<FormField[]>(form.fields);
  const [theme, setTheme] = useState<FormTheme>({ ...DEFAULT_FORM_THEME, ...form.theme });
  const [settings, setSettings] = useState<FormSettings>(form.settings);
  const [submitMessage, setSubmitMessage] = useState(form.submitMessage || "Obrigado! Recebemos suas informações.");
  const [submitRedirectUrl, setSubmitRedirectUrl] = useState(form.submitRedirectUrl ?? "");
  const [targetFunnelId, setTargetFunnelId] = useState(form.targetFunnelId ?? TENANT_DEFAULT);
  const [targetStageId, setTargetStageId] = useState(form.targetStageId ?? "");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [embedOpen, setEmbedOpen] = useState(false);
  const [emailTemplateId, setEmailTemplateId] = useState(form.emailTemplateId ?? "");
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [view, setView] = useState<"canvas" | "preview">("canvas");
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "mobile">("desktop");

  const validation = useMemo(() => validateBuilderFields(fields), [fields]);
  const selectedField = fields.find((f) => f.id === selectedId) ?? null;
  const selectedFieldErrors = selectedField ? validation.fieldErrors[selectedField.id] ?? [] : [];
  const selectedFunnel = useMemo(
    () => funnels.find((f) => f.id === targetFunnelId) ?? null,
    [funnels, targetFunnelId],
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function markDirty() {
    setDirty(true);
  }

  function addField(type: FormFieldType) {
    const field = createDefaultField(type);
    setFields((prev) => [...prev, field]);
    setSelectedId(field.id);
    markDirty();
  }

  function addContactField(field: FormField) {
    setFields((prev) => [...prev, field]);
    setSelectedId(field.id);
    markDirty();
  }

  function updateField(id: string, updates: Partial<FormField>) {
    setFields((prev) => prev.map((f) => (f.id === id ? { ...f, ...updates } : f)));
    markDirty();
  }

  function removeField(id: string) {
    setFields((prev) => prev.filter((f) => f.id !== id));
    if (selectedId === id) setSelectedId(null);
    markDirty();
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setFields((prev) => {
      const oldIndex = prev.findIndex((f) => f.id === active.id);
      const newIndex = prev.findIndex((f) => f.id === over.id);
      return arrayMove(prev, oldIndex, newIndex);
    });
    markDirty();
  }

  function handleFunnelChange(value: string) {
    setTargetFunnelId(value);
    if (value === TENANT_DEFAULT) {
      setTargetStageId("");
    } else {
      const f = funnels.find((x) => x.id === value);
      setTargetStageId(f?.stages[0]?.id ?? "");
    }
    markDirty();
  }

  const handleSave = () => {
    if (!name.trim()) {
      toast({ title: "Informe o título do formulário", variant: "destructive" });
      return;
    }
    if (validation.hasErrors) {
      toast({
        title: "Corrija os campos antes de salvar",
        description: `${validation.totalErrors} ajuste(s) pendente(s).`,
        variant: "destructive",
      });
      return;
    }
    const usesDefault = targetFunnelId === TENANT_DEFAULT;
    updateForm.mutate(
      {
        id: form.id,
        patch: {
          name: name.trim(),
          fields,
          theme,
          settings,
          submitMessage: submitMessage.trim() || "Obrigado!",
          submitRedirectUrl: submitRedirectUrl.trim() || null,
          targetFunnelId: usesDefault ? null : targetFunnelId,
          targetStageId: usesDefault ? null : targetStageId || null,
          emailTemplateId: emailTemplateId || null,
        },
      },
      {
        onSuccess: () => {
          setDirty(false);
          toast({ title: "Formulário salvo" });
        },
        onError: (e) => {
          toast({ title: "Erro ao salvar", description: e.message, variant: "destructive" });
        },
      },
    );
  };

  return (
    <div className="flex h-full flex-col gap-3">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="h-8" onClick={onClose}>
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            Voltar
          </Button>
          <span className="text-sm font-medium text-muted-foreground">{name || "Formulário"}</span>
          {dirty ? <Badge variant="secondary" className="h-5 text-[11px]">Não salvo</Badge> : null}
          {validation.hasErrors ? (
            <Badge variant="outline" className="h-5 border-amber-300 bg-amber-50 text-[11px] text-amber-800">
              <AlertCircle className="mr-1 h-3 w-3" />
              {validation.totalErrors} ajuste{validation.totalErrors > 1 ? "s" : ""}
            </Badge>
          ) : null}
        </div>
        <div className="flex items-center gap-1.5">
          <Button size="sm" variant="outline" className="h-8" onClick={() => setEmbedOpen(true)}>
            <Code2 className="mr-1.5 h-3.5 w-3.5" />
            Embed
          </Button>
          <Button size="sm" className="h-8" onClick={handleSave} disabled={updateForm.isPending}>
            {updateForm.isPending ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Save className="mr-1.5 h-3.5 w-3.5" />}
            Salvar
          </Button>
        </div>
      </div>

      <Tabs defaultValue="builder" className="flex min-h-0 flex-1 flex-col">
        <TabsList className="w-full justify-start sm:w-auto">
          <TabsTrigger value="builder">Construtor</TabsTrigger>
          <TabsTrigger value="settings">Configurações</TabsTrigger>
          <TabsTrigger value="ab">A/B</TabsTrigger>
        </TabsList>

        {/* Builder */}
        <TabsContent value="builder" className="mt-3 min-h-0 flex-1">
          <div className="flex h-full min-h-[420px] overflow-hidden rounded-xl border bg-card shadow-sm">
            <ContactFieldPalette existingFields={fields} onAddField={addContactField} onAddExtra={addField} />

            <div className="flex flex-1 flex-col overflow-hidden border-x">
              <div className="flex items-center justify-end gap-1.5 border-b bg-muted/40 px-3 py-2">
                <Button size="sm" variant={view === "canvas" ? "default" : "outline"} className="h-8" onClick={() => setView("canvas")}>
                  Canvas
                </Button>
                <Button size="sm" variant={view === "preview" ? "default" : "outline"} className="h-8" onClick={() => setView("preview")}>
                  <Eye className="mr-1.5 h-3.5 w-3.5" />
                  Preview
                </Button>
                {view === "preview" ? (
                  <>
                    <Button size="sm" variant={previewDevice === "desktop" ? "default" : "outline"} className="h-8" onClick={() => setPreviewDevice("desktop")}>
                      <Monitor className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="sm" variant={previewDevice === "mobile" ? "default" : "outline"} className="h-8" onClick={() => setPreviewDevice("mobile")}>
                      <Smartphone className="h-3.5 w-3.5" />
                    </Button>
                  </>
                ) : null}
              </div>

              {view === "canvas" ? (
                <div className="flex-1 overflow-y-auto p-4">
                  {fields.length === 0 ? (
                    <div className="flex h-full min-h-[280px] flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 text-center">
                      <p className="text-sm font-medium text-muted-foreground">Canvas vazio</p>
                      <p className="mt-1 text-xs text-muted-foreground/70">
                        Clique em um tipo de campo no painel esquerdo para adicionar.
                      </p>
                    </div>
                  ) : (
                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                      <SortableContext items={fields.map((f) => f.id)} strategy={verticalListSortingStrategy}>
                        <div className="space-y-2">
                          {fields.map((field) => (
                            <SortableFieldItem
                              key={field.id}
                              field={field}
                              isSelected={selectedId === field.id}
                              errorCount={(validation.fieldErrors[field.id] ?? []).length}
                              onSelect={() => setSelectedId(field.id)}
                              onRemove={() => removeField(field.id)}
                            />
                          ))}
                        </div>
                      </SortableContext>
                    </DndContext>
                  )}
                </div>
              ) : (
                <FormPreview fields={fields} device={previewDevice} submitMessage={submitMessage} theme={theme} />
              )}

              {fields.length > 0 ? (
                <div className="border-t bg-muted/40 px-4 py-2 text-xs text-muted-foreground">
                  {fields.length} campo{fields.length !== 1 ? "s" : ""}
                </div>
              ) : null}
            </div>

            <div className="flex w-64 flex-col overflow-y-auto border-l bg-card">
              <div className="border-b bg-muted/40 px-4 py-3">
                <p className="text-xs font-semibold">Propriedades</p>
              </div>
              <FieldEditor
                field={selectedField}
                errors={selectedFieldErrors}
                onUpdate={(updates) => selectedId && updateField(selectedId, updates)}
              />
            </div>
          </div>
        </TabsContent>

        {/* Settings */}
        <TabsContent value="settings" className="mt-3 min-h-0 flex-1 overflow-y-auto">
          <div className="grid max-w-3xl gap-5">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-xs">Título do formulário</Label>
                <Input
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    markDirty();
                  }}
                  placeholder="Ex: Captação de leads"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Mensagem de sucesso</Label>
                <Input
                  value={submitMessage}
                  onChange={(e) => {
                    setSubmitMessage(e.target.value);
                    markDirty();
                  }}
                  placeholder="Obrigado!"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Redirect após envio</Label>
                <Input
                  value={submitRedirectUrl}
                  onChange={(e) => {
                    setSubmitRedirectUrl(e.target.value);
                    markDirty();
                  }}
                  placeholder="https://seusite.com/obrigado"
                />
              </div>
            </div>

            <Separator />

            {/* Destino no CRM */}
            <div className="space-y-3">
              <div>
                <p className="text-sm font-semibold">Destino do lead no CRM</p>
                <p className="text-xs text-muted-foreground">
                  Cada envio cria um contato e abre uma negociação aqui.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-xs">Funil</Label>
                  <Select value={targetFunnelId} onValueChange={handleFunnelChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Funil de destino" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={TENANT_DEFAULT}>Funil padrão do tenant</SelectItem>
                      {funnels.map((f) => (
                        <SelectItem key={f.id} value={f.id}>
                          {f.listName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Etapa</Label>
                  <Select
                    value={targetStageId}
                    onValueChange={(v) => {
                      setTargetStageId(v);
                      markDirty();
                    }}
                    disabled={targetFunnelId === TENANT_DEFAULT}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Etapa de destino" />
                    </SelectTrigger>
                    <SelectContent>
                      {(selectedFunnel?.stages ?? []).map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <Separator />

            {/* Aparência */}
            <div className="space-y-3">
              <p className="text-sm font-semibold">Aparência</p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">Cor do botão</Label>
                  <Input
                    type="color"
                    value={theme.primaryColor}
                    onChange={(e) => {
                      setTheme((p) => ({ ...p, primaryColor: e.target.value }));
                      markDirty();
                    }}
                    className="h-10"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Fundo</Label>
                  <Input
                    type="color"
                    value={theme.backgroundColor}
                    onChange={(e) => {
                      setTheme((p) => ({ ...p, backgroundColor: e.target.value }));
                      markDirty();
                    }}
                    className="h-10"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Texto</Label>
                  <Input
                    type="color"
                    value={theme.textColor}
                    onChange={(e) => {
                      setTheme((p) => ({ ...p, textColor: e.target.value }));
                      markDirty();
                    }}
                    className="h-10"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Borda (px)</Label>
                  <Input
                    type="number"
                    min={0}
                    max={24}
                    value={theme.borderRadius}
                    onChange={(e) => {
                      const n = Number(e.target.value);
                      setTheme((p) => ({ ...p, borderRadius: Number.isFinite(n) ? n : 8 }));
                      markDirty();
                    }}
                    className="h-10"
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Comportamento */}
            <div className="space-y-3">
              <p className="text-sm font-semibold">Comportamento</p>
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm">Perfil progressivo</Label>
                  <p className="text-xs text-muted-foreground">Atualiza o lead existente em vez de duplicar.</p>
                </div>
                <Switch
                  checked={!!settings.progressiveProfiling}
                  onCheckedChange={(v) => {
                    setSettings((p) => ({ ...p, progressiveProfiling: v }));
                    markDirty();
                  }}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm">Modo conversacional</Label>
                  <p className="text-xs text-muted-foreground">Mostra um campo por vez, estilo chat.</p>
                </div>
                <Switch
                  checked={!!settings.conversational}
                  onCheckedChange={(v) => {
                    setSettings((p) => ({ ...p, conversational: v }));
                    markDirty();
                  }}
                />
              </div>
            </div>

            <Separator />

            {/* E-mail de confirmação */}
            <div className="space-y-3">
              <div>
                <p className="text-sm font-semibold">E-mail de confirmação</p>
                <p className="text-xs text-muted-foreground">
                  Enviado automaticamente ao lead quando ele tem e-mail no formulário.
                </p>
              </div>
              <div className="flex flex-wrap items-end gap-2">
                <div className="min-w-[220px] flex-1 space-y-1.5">
                  <Label className="text-xs">Template</Label>
                  <Select
                    value={emailTemplateId || "__none__"}
                    onValueChange={(v) => {
                      setEmailTemplateId(v === "__none__" ? "" : v);
                      markDirty();
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sem e-mail" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">Sem e-mail</SelectItem>
                      {emailTemplates.map((tpl) => (
                        <SelectItem key={tpl.id} value={tpl.id}>
                          {tpl.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button variant="outline" onClick={() => setEmailDialogOpen(true)}>
                  Gerenciar templates
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="ab" className="mt-3 min-h-0 flex-1 overflow-y-auto">
          <ABTestPanel
            formId={form.id}
            currentFields={fields}
            currentSettings={settings}
            currentTheme={theme}
            onSettingsChange={(s) => {
              setSettings(s);
              markDirty();
            }}
          />
        </TabsContent>
      </Tabs>

      <EmbedSnippetDialog
        formId={form.id}
        formName={name || form.name}
        isActive={form.isActive}
        open={embedOpen}
        onOpenChange={setEmbedOpen}
      />

      <EmailTemplatesDialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen} />
    </div>
  );
}
