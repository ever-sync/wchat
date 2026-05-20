import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  BarChart3,
  BookOpen,
  Loader2,
  Mail,
  MessageSquare,
  Pencil,
  Plus,
  QrCode,
  RefreshCw,
  ShieldCheck,
  Trash2,
  UserCog,
  Users,
} from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { useRolePermissions } from "@/hooks/useRolePermissions";
import { useToast } from "@/hooks/use-toast";
import { ApiKeysSettingsCard } from "@/components/settings/ApiKeysSettingsCard";
import {
  useCollaboratorInvites,
  useInviteCollaborator,
  useMyProfile,
  useDeleteCollaboratorInvite,
  useRevokeCollaboratorInvite,
  useTenantCollaborators,
  useUpdateCollaboratorRole,
  useUpdateMyProfile,
} from "@/lib/api/settings";
import {
  useDeleteTenantCrmFunnelConfig,
  useTenantCrmFunnelConfig,
  useUpsertTenantCrmFunnelConfig,
} from "@/lib/api/crm-funnel-config";
import { PlatformLogSection } from "@/components/settings/PlatformLogSection";
import { getCurrentTenantId } from "@/lib/api/tenant";
import {
  useConnectWhatsappInstance,
  useDeleteWhatsappInstance,
  useSyncWhatsappInstances,
  useWhatsappInstances,
} from "@/lib/api/whatsapp";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { useAppStore } from "@/store/useAppStore";
import { CrmFunnelConfigEditor } from "@/components/crm/CrmFunnelConfigEditor";
import {
  applyPendingFunnelMigrations,
  countCrmNegotiationsByFunnelId,
  countCrmNegotiationsByFunnelStage,
} from "@/lib/api/crm-funnel-migration";
import { validateFunnelsDraft } from "@/lib/crm/funnel-editor-utils";
import type { CrmFunnel } from "@/data/crm-funnels";
import { DEFAULT_CRM_FUNNELS, parseTenantCrmFunnelsJson } from "@/data/crm-funnels";
import {
  buildUnresolvedConfigRemovals,
  type PendingFunnelMigration,
} from "@/lib/crm/funnel-migration";
import {
  useCreateQuickReply,
  useDeleteQuickReply,
  useQuickReplies,
  useUpdateQuickReply,
} from "@/lib/api/quick-replies";
import {
  useTenantIntegrations,
  useTenantSettings,
  useUpsertTenantIntegrations,
  useUpsertTenantSettings,
} from "@/lib/api/integrations";
import { RolePermissionsMatrix } from "@/components/settings/RolePermissionsMatrix";
import { ChatTagsSettingsSection } from "@/components/settings/ChatTagsSettingsSection";
import {
  ChatConfigSectionNav,
  parseChatConfigSectionParam,
  type ChatConfigSettingsSection,
} from "@/components/settings/ChatConfigSectionNav";
import {
  CollaboratorsSectionNav,
  parseCollaboratorsSectionParam,
  type CollaboratorsSettingsSection,
} from "@/components/settings/CollaboratorsSectionNav";
import {
  IntegrationsSectionNav,
  parseIntegrationsSectionParam,
  type IntegrationsSettingsSection,
} from "@/components/settings/IntegrationsSectionNav";
import type { QuickReply, QuickReplyScope, UserRole } from "@/types/domain";
import { ROLE_LABELS } from "@/lib/permissions/role-permissions";

const statusStyles = {
  connected: "bg-success/20 text-success",
  connecting: "bg-warning/20 text-warning",
  disconnected: "bg-muted text-muted-foreground",
  error: "bg-destructive/20 text-destructive",
};


const SETTINGS_TAB_VALUES = [
  "perfil",
  "integracoes",
  "colaboradores",
  "funis",
  "configuracao-chat",
  "log",
] as const;
type SettingsTab = (typeof SETTINGS_TAB_VALUES)[number];

function parseSettingsTabParam(raw: string | null): SettingsTab {
  if (raw && (SETTINGS_TAB_VALUES as readonly string[]).includes(raw)) {
    return raw as SettingsTab;
  }
  return "perfil";
}

function qrSrc(value?: string | null) {
  if (!value?.trim()) return null;
  if (value.startsWith("data:image") || value.startsWith("http")) return value;
  return `data:image/png;base64,${value.trim()}`;
}

export default function Configuracoes() {
  const { toast } = useToast();
  const { profile } = useAuth();
  const { can } = useRolePermissions();
  const [searchParams, setSearchParams] = useSearchParams();
  const [tab, setTab] = useState<SettingsTab>(() => parseSettingsTabParam(searchParams.get("aba")));
  const [collaboratorsSection, setCollaboratorsSection] = useState<CollaboratorsSettingsSection>(() =>
    parseCollaboratorsSectionParam(searchParams.get("secao")),
  );
  const [integrationsSection, setIntegrationsSection] = useState<IntegrationsSettingsSection>(() =>
    parseIntegrationsSectionParam(searchParams.get("secao")),
  );
  const [chatConfigSection, setChatConfigSection] = useState<ChatConfigSettingsSection>(() =>
    parseChatConfigSectionParam(searchParams.get("secao")),
  );
  const [dialogOpen, setDialogOpen] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [instanceName, setInstanceName] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [baseUrl, setBaseUrl] = useState("https://api.uazapi.com");
  const [isDefault, setIsDefault] = useState(true);
  const [profileName, setProfileName] = useState("");
  const [profileCompany, setProfileCompany] = useState("");
  const [profilePhone, setProfilePhone] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<UserRole>("operacao");
  const [resendingInviteId, setResendingInviteId] = useState<string | null>(null);
  const [deletingInviteId, setDeletingInviteId] = useState<string | null>(null);
  const [funnelDraft, setFunnelDraft] = useState<CrmFunnel[]>(DEFAULT_CRM_FUNNELS);
  const [funnelJsonDraft, setFunnelJsonDraft] = useState("");
  const [funnelJsonOpen, setFunnelJsonOpen] = useState(false);
  const [pendingFunnelMigrations, setPendingFunnelMigrations] = useState<PendingFunnelMigration[]>(
    [],
  );
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [qrEditingId, setQrEditingId] = useState<string | null>(null);
  const [qrTitle, setQrTitle] = useState("");
  const [qrShortcut, setQrShortcut] = useState("");
  const [qrBodyText, setQrBodyText] = useState("");
  const [qrScope, setQrScope] = useState<QuickReplyScope>("global");
  const [sessionStatus, setSessionStatus] = useState<"valid" | "invalid" | "missing">("missing");
  const [sessionHint, setSessionHint] = useState("");
  const [diagnosticsLoading, setDiagnosticsLoading] = useState(true);
  const canUseAuthenticatedActions = !diagnosticsLoading && sessionStatus === "valid";
  const canViewCollaborators = can("colaboradores", "view");
  const canEditConfiguracoes = can("configuracoes", "edit");
  const canDeleteConfiguracoes = can("configuracoes", "delete");
  const canEditCollaborators = can("colaboradores", "edit");
  const canDeleteCollaborators = can("colaboradores", "delete");

  const abaKey = searchParams.get("aba");
  const secaoKey = searchParams.get("secao");
  useEffect(() => {
    setTab(parseSettingsTabParam(abaKey));
  }, [abaKey]);

  useEffect(() => {
    const currentTab = parseSettingsTabParam(abaKey);
    if (currentTab === "colaboradores") {
      setCollaboratorsSection(parseCollaboratorsSectionParam(secaoKey));
    } else if (currentTab === "integracoes") {
      setIntegrationsSection(parseIntegrationsSectionParam(secaoKey));
    } else if (currentTab === "configuracao-chat") {
      setChatConfigSection(parseChatConfigSectionParam(secaoKey));
    }
  }, [abaKey, secaoKey]);

  const handleIntegrationsSectionChange = useCallback(
    (section: IntegrationsSettingsSection) => {
      setIntegrationsSection(section);
      setSearchParams(
        (prev) => {
          const p = new URLSearchParams(prev);
          p.set("aba", "integracoes");
          if (section === "whatsapp") {
            p.delete("secao");
          } else {
            p.set("secao", section);
          }
          return p;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const handleChatConfigSectionChange = useCallback(
    (section: ChatConfigSettingsSection) => {
      setChatConfigSection(section);
      setSearchParams(
        (prev) => {
          const p = new URLSearchParams(prev);
          p.set("aba", "configuracao-chat");
          if (section === "respostas") {
            p.delete("secao");
          } else {
            p.set("secao", section);
          }
          return p;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const handleCollaboratorsSectionChange = useCallback(
    (section: CollaboratorsSettingsSection) => {
      setCollaboratorsSection(section);
      setSearchParams(
        (prev) => {
          const p = new URLSearchParams(prev);
          p.set("aba", "colaboradores");
          if (section === "usuarios") {
            p.delete("secao");
          } else {
            p.set("secao", section);
          }
          return p;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const handleTabChange = useCallback((value: string) => {
    const next = parseSettingsTabParam(value);
    setTab(next);
    setSearchParams(
      (prev) => {
        const p = new URLSearchParams(prev);
        if (next === "perfil") {
          p.delete("aba");
          p.delete("secao");
        } else {
          p.set("aba", next);
          const secao = p.get("secao");
          if (next === "colaboradores") {
            if (secao !== "usuarios" && secao !== "permissoes" && secao !== "fila") {
              p.delete("secao");
            }
          } else if (next === "integracoes") {
            if (secao !== "whatsapp" && secao !== "automacao") {
              p.delete("secao");
            }
          } else if (next === "configuracao-chat") {
            if (secao !== "respostas" && secao !== "etiquetas") {
              p.delete("secao");
            }
          } else if (next === "log") {
            p.delete("secao");
          } else {
            p.delete("secao");
          }
        }
        return p;
      },
      { replace: true },
    );
  }, [setSearchParams]);

  useEffect(() => {
    if (tab === "colaboradores" && !canViewCollaborators) {
      handleTabChange("perfil");
    }
  }, [canViewCollaborators, handleTabChange, tab]);

  const { data: myProfile } = useMyProfile({ enabled: tab !== "integracoes" && canUseAuthenticatedActions });
  const { data: savedCrmFunnels, isLoading: crmFunnelsLoading } = useTenantCrmFunnelConfig({
    enabled: tab === "funis" && canUseAuthenticatedActions,
  });
  const upsertCrmFunnels = useUpsertTenantCrmFunnelConfig();
  const deleteCrmFunnels = useDeleteTenantCrmFunnelConfig();
  const { data: quickRepliesList = [] } = useQuickReplies();
  const createQR = useCreateQuickReply();
  const updateQR = useUpdateQuickReply();
  const deleteQR = useDeleteQuickReply();
  const { data: collaborators = [] } = useTenantCollaborators({ enabled: tab === "colaboradores" && canUseAuthenticatedActions });
  const { data: invites = [] } = useCollaboratorInvites({ enabled: tab === "colaboradores" && canUseAuthenticatedActions });
  const updateProfile = useUpdateMyProfile();
  const inviteCollaborator = useInviteCollaborator();
  const revokeInvite = useRevokeCollaboratorInvite();
  const deleteInvite = useDeleteCollaboratorInvite();
  const updateCollaboratorRole = useUpdateCollaboratorRole();
  const { data: instances = [], isLoading, error } = useWhatsappInstances({ enabled: tab === "integracoes" && canUseAuthenticatedActions });
  const { data: tenantIntegrations } = useTenantIntegrations();
  const { data: tenantSettings } = useTenantSettings();
  const upsertIntegrations = useUpsertTenantIntegrations();
  const upsertSettings = useUpsertTenantSettings();
  const [n8nUrl, setN8nUrl] = useState("");
  const [n8nSecret, setN8nSecret] = useState("");
  const [n8nEnabled, setN8nEnabled] = useState(false);
  const [autoLead, setAutoLead] = useState(true);
  const [autoAssignLead, setAutoAssignLead] = useState(false);
  const [defaultAiMode, setDefaultAiMode] = useState<"off" | "qualifying" | "full" | "handoff">("off");
  const [staleNegotiationDays, setStaleNegotiationDays] = useState(7);

  useEffect(() => {
    if (tenantIntegrations) {
      setN8nUrl(tenantIntegrations.n8nWebhookUrl ?? "");
      setN8nSecret(tenantIntegrations.n8nSecret ?? "");
      setN8nEnabled(tenantIntegrations.n8nEnabled);
    }
  }, [tenantIntegrations]);

  useEffect(() => {
    if (tenantSettings) {
      setAutoLead(tenantSettings.autoLeadOnInbound);
      setAutoAssignLead(tenantSettings.autoAssignOnLead);
      setDefaultAiMode(tenantSettings.defaultAiMode);
      setStaleNegotiationDays(tenantSettings.staleNegotiationDays);
    }
  }, [tenantSettings]);
  const connectInstance = useConnectWhatsappInstance();
  const syncInstances = useSyncWhatsappInstances({
    onSuccess: (_data, variables) => {
      const descricao = variables?.instanceId
        ? "Esta instancia foi sincronizada na UAZAPI."
        : "Todas as instancias foram sincronizadas na UAZAPI.";
      toast({ title: "Sincronizacao concluida", description: descricao });
      useAppStore.getState().addNotification({
        tipo: "sucesso",
        titulo: "Sincronizacao concluida",
        descricao,
      });
    },
    onError: (error) => {
      const msg = error instanceof Error ? error.message : "Tente novamente.";
      toast({ title: "Falha na sincronizacao", description: msg, variant: "destructive" });
      useAppStore.getState().addNotification({
        tipo: "erro",
        titulo: "Falha na sincronizacao",
        descricao: msg,
      });
    },
  });
  const deleteInstance = useDeleteWhatsappInstance();

  const metrics = useMemo(() => ({
    activeInstances: instances.filter((item) => item.status === "connected").length,
    totalInstances: instances.length,
  }), [instances]);

  useEffect(() => {
    if (!myProfile) return;
    setProfileName(myProfile.nome);
    setProfileCompany(myProfile.empresa);
    setProfilePhone(myProfile.callPhone ?? "");
  }, [myProfile]);

  useEffect(() => {
    if (tab !== "funis") {
      return;
    }
    if (crmFunnelsLoading) {
      return;
    }
    const effective = savedCrmFunnels ?? DEFAULT_CRM_FUNNELS;
    setFunnelDraft(structuredClone(effective));
    setFunnelJsonDraft(JSON.stringify(effective, null, 2));
    setPendingFunnelMigrations([]);
  }, [crmFunnelsLoading, savedCrmFunnels, tab]);

  const syncFunnelDraftToJson = (next: CrmFunnel[]) => {
    setFunnelDraft(next);
    setFunnelJsonDraft(JSON.stringify(next, null, 2));
  };

  const saveFunnelConfig = async (funnels: CrmFunnel[]) => {
    const draftError = validateFunnelsDraft(funnels);
    if (draftError) {
      toast({
        title: "Configuração incompleta",
        description: draftError,
        variant: "destructive",
      });
      return;
    }
    const valid = parseTenantCrmFunnelsJson(funnels);
    if (!valid) {
      toast({
        title: "Formato inválido",
        description: "Cada funil precisa de id, listName e stages não vazios.",
        variant: "destructive",
      });
      return;
    }

    const baseline = savedCrmFunnels ?? DEFAULT_CRM_FUNNELS;
    const autoMigrations: PendingFunnelMigration[] = [];
    const removals = buildUnresolvedConfigRemovals(baseline, valid);

    for (const removal of removals) {
      if (removal.kind === "funnel_rename") {
        autoMigrations.push({
          kind: "funnel_rename",
          fromFunnelId: removal.from,
          toFunnelId: removal.to,
        });
        continue;
      }
      if (removal.kind === "funnel") {
        const covered = pendingFunnelMigrations.some(
          (m) =>
            (m.kind === "funnel" && m.fromFunnelId === removal.funnelId) ||
            (m.kind === "funnel_stage" && m.fromFunnelId === removal.funnelId) ||
            (m.kind === "funnel_clear" && m.fromFunnelId === removal.funnelId),
        );
        if (covered) {
          continue;
        }
        if (isSupabaseConfigured) {
          const count = await countCrmNegotiationsByFunnelId(removal.funnelId);
          if (count > 0) {
            toast({
              title: "Funil com negociações",
              description: `O funil removido ainda tem ${count} negociação(ões). Use "Excluir funil" no editor visual para migrar antes de salvar.`,
              variant: "destructive",
            });
            return;
          }
        }
        continue;
      }
      const covered = pendingFunnelMigrations.some(
        (m) =>
          m.kind === "stage" &&
          m.funnelId === removal.funnelId &&
          m.fromStageId === removal.stageId,
      );
      if (covered) {
        continue;
      }
      if (isSupabaseConfigured) {
        const count = await countCrmNegotiationsByFunnelStage(removal.funnelId, removal.stageId);
        if (count > 0) {
          toast({
            title: "Etapa com negociações",
            description: `A etapa removida ainda tem ${count} negociação(ões). Exclua a etapa pelo editor visual e escolha o destino da migração.`,
            variant: "destructive",
          });
          return;
        }
      }
    }

    const allMigrations = [...pendingFunnelMigrations, ...autoMigrations];
    if (allMigrations.length > 0 && isSupabaseConfigured) {
      const { negotiationsUpdated, customersAligned } =
        await applyPendingFunnelMigrations(allMigrations);
      if (negotiationsUpdated > 0 || customersAligned > 0) {
        toast({
          title: "Negociações atualizadas",
          description: `${negotiationsUpdated} negociação(ões) e ${customersAligned} cliente(s) alinhados aos novos funis.`,
        });
      }
    }

    await upsertCrmFunnels.mutateAsync(valid);
    syncFunnelDraftToJson(valid);
    setPendingFunnelMigrations([]);
    toast({
      title: "Funis salvos",
      description: "O quadro CRM vai usar esta definição.",
    });
  };

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setDiagnosticsLoading(true);
      try {
        if (!supabase) {
          if (!cancelled) {
            setSessionStatus("missing");
            setSessionHint("Supabase nao esta disponivel.");
          }
          return;
        }
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) {
          if (!cancelled) {
            setSessionStatus("missing");
            setSessionHint("Nenhuma sessao ativa encontrada.");
            setTenantId(null);
          }
          return;
        }
        const userResult = await supabase.auth.getUser(session.access_token);
        if (userResult.error || !userResult.data.user) {
          if (!cancelled) {
            setSessionStatus("invalid");
            setSessionHint("Sessao invalida. Faca logout e login novamente.");
            setTenantId(null);
          }
          return;
        }
        const nextTenantId = await getCurrentTenantId();
        if (!cancelled) {
          setSessionStatus("valid");
          setSessionHint("Sessao pronta para chamar as Edge Functions.");
          setTenantId(nextTenantId);
        }
      } catch (e) {
        if (!cancelled) {
          setSessionStatus("invalid");
          setSessionHint(e instanceof Error ? e.message : "Nao foi possivel validar a sessao.");
          setTenantId(null);
        }
      } finally {
        if (!cancelled) setDiagnosticsLoading(false);
      }
    }
    void load();
    return () => { cancelled = true; };
  }, []);

  const collaboratorMetrics = {
    active: collaborators.filter((item) => item.status === "active").length,
    admins: collaborators.filter((item) => item.role === "admin").length,
    pending: invites.filter((item) => item.status === "pending").length,
  };

  return (
    <div className="min-h-0 w-full flex-1 space-y-6 overflow-y-auto bg-background px-4 py-4 pb-24 md:px-6 md:py-8 md:pb-8 lg:px-8">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Configuracoes</h1>
          <p className="text-sm text-muted-foreground">Perfil, integracoes, funis do CRM e acessos do tenant.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge className="bg-secondary text-secondary-foreground">
            {myProfile ? ROLE_LABELS[myProfile.role] : "Conta"}
          </Badge>
          <Badge className="bg-accent/15 text-accent">
            {tenantId ? "Tenant conectado" : "Tenant pendente"}
          </Badge>
        </div>
      </div>

      <Tabs value={tab} onValueChange={handleTabChange} className="space-y-6">
        <TabsList className="h-auto flex-wrap justify-start rounded-2xl border border-border/60 bg-card/80 p-1">
          <TabsTrigger value="perfil"><UserCog className="mr-2 h-4 w-4" />Perfil</TabsTrigger>
          <TabsTrigger value="integracoes"><MessageSquare className="mr-2 h-4 w-4" />Integracoes</TabsTrigger>
          {canViewCollaborators ? (
            <TabsTrigger value="colaboradores">
              <Users className="mr-2 h-4 w-4" />
              Colaboradores
            </TabsTrigger>
          ) : null}
          <TabsTrigger value="funis"><BarChart3 className="mr-2 h-4 w-4" />Funis CRM</TabsTrigger>
          <TabsTrigger value="configuracao-chat"><MessageSquare className="mr-2 h-4 w-4" />Configuracao do chat</TabsTrigger>
          <TabsTrigger value="log"><BookOpen className="mr-2 h-4 w-4" />Log da plataforma</TabsTrigger>
        </TabsList>

        <TabsContent value="perfil" className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
          <Card className="border-border/60 bg-card/80">
            <CardHeader>
              <CardTitle className="text-lg">Meu perfil</CardTitle>
              <CardDescription>Edite seus dados basicos de acesso.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Nome</Label>
                  <Input value={profileName} onChange={(e) => setProfileName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input value={myProfile?.email ?? profile?.email ?? ""} disabled />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Empresa</Label>
                  <Input value={profileCompany} onChange={(e) => setProfileCompany(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Plano</Label>
                  <Input value={myProfile?.plano ?? profile?.plano ?? "starter"} disabled />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Telefone para ligações</Label>
                  <Input
                    value={profilePhone}
                    onChange={(e) => setProfilePhone(e.target.value)}
                    placeholder="+55 11 99999-9999"
                    inputMode="tel"
                  />
                  <p className="text-xs text-muted-foreground">
                    Usado no click-to-call: ligamos para você primeiro, depois conectamos o lead. Formato E.164 (ex.: +5511999998888).
                  </p>
                </div>
              </div>
              <div className="flex justify-end">
                <Button
                  className="bg-accent text-accent-foreground hover:bg-accent/90"
                  disabled={
                    updateProfile.isPending ||
                    !profileName.trim() ||
                    !profileCompany.trim() ||
                    !canUseAuthenticatedActions ||
                    !canEditConfiguracoes
                  }
                  onClick={async () => {
                    if (!canEditConfiguracoes) {
                      toast({
                        title: "Ação indisponível",
                        description: "Seu papel nao tem permissao para salvar o perfil.",
                        variant: "destructive",
                      });
                      return;
                    }
                    if (!canUseAuthenticatedActions) {
                      toast({
                        title: "Sessao indisponivel",
                        description: "Faca login novamente antes de salvar o perfil.",
                        variant: "destructive",
                      });
                      useAppStore.getState().addNotification({
                        tipo: "erro",
                        titulo: "Sessao indisponivel",
                        descricao: "Faca login novamente antes de salvar o perfil.",
                      });
                      return;
                    }

                    try {
                      await updateProfile.mutateAsync({
                        nome: profileName,
                        empresa: profileCompany,
                        callPhone: profilePhone,
                      });
                      toast({ title: "Perfil atualizado", description: "Dados salvos com sucesso." });
                      useAppStore.getState().addNotification({
                        tipo: "sucesso",
                        titulo: "Perfil atualizado",
                        descricao: "Dados salvos com sucesso.",
                      });
                    } catch (e) {
                      const desc = e instanceof Error ? e.message : "Tente novamente.";
                      toast({ title: "Erro ao salvar", description: desc, variant: "destructive" });
                      useAppStore.getState().addNotification({
                        tipo: "erro",
                        titulo: "Erro ao salvar",
                        descricao: desc,
                      });
                    }
                  }}
                >
                  {updateProfile.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Salvar perfil
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-card/80">
            <CardHeader>
              <CardTitle className="text-lg">Resumo da conta</CardTitle>
              <CardDescription>Visao rapida da sessao e do tenant atual.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-2xl border border-border bg-secondary/40 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Cargo</p>
                <p className="mt-2 text-sm font-medium text-foreground">{myProfile ? ROLE_LABELS[myProfile.role] : "Carregando..."}</p>
              </div>
              <div className="rounded-2xl border border-border bg-secondary/40 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Tenant</p>
                <p className="mt-2 break-all text-sm font-medium text-foreground">{diagnosticsLoading ? "Validando..." : tenantId ?? "Nao encontrado"}</p>
              </div>
              <div className="rounded-2xl border border-border bg-secondary/40 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Sessao Supabase</p>
                <div className="mt-2">
                  <Badge className={sessionStatus === "valid" ? "bg-success/20 text-success" : sessionStatus === "missing" ? "bg-warning/20 text-warning" : "bg-destructive/20 text-destructive"}>
                    {diagnosticsLoading ? "Validando" : sessionStatus === "valid" ? "Valida" : sessionStatus === "missing" ? "Ausente" : "Invalida"}
                  </Badge>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">{sessionHint}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integracoes" className="space-y-6">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
            <IntegrationsSectionNav
              value={integrationsSection}
              onChange={handleIntegrationsSectionChange}
            />
            <div className="min-w-0 flex-1 space-y-6">
              {integrationsSection === "whatsapp" ? (
                <>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-xl font-bold text-foreground">Integrações operacionais</h2>
              <p className="text-sm text-muted-foreground">Conecte instancias UAZAPI e acompanhe a operacao.</p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  if (!canEditConfiguracoes) {
                    toast({
                      title: "Ação indisponível",
                      description: "Seu papel nao tem permissao para sincronizar instancias.",
                      variant: "destructive",
                    });
                    return;
                  }
                  if (!canUseAuthenticatedActions) {
                    toast({
                      title: "Sessao indisponivel",
                      description: "Faca login novamente antes de sincronizar instancias.",
                      variant: "destructive",
                    });
                    useAppStore.getState().addNotification({
                      tipo: "erro",
                      titulo: "Sessao indisponivel",
                      descricao: "Faca login novamente antes de sincronizar instancias.",
                    });
                    return;
                  }

                  syncInstances.mutate({});
                }}
                disabled={syncInstances.isPending || !canUseAuthenticatedActions || !canEditConfiguracoes}
              >
                {syncInstances.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                Sincronizar tudo
              </Button>
              <Dialog
                open={dialogOpen && canEditConfiguracoes}
                onOpenChange={(open) => {
                  if (!canEditConfiguracoes) {
                    setDialogOpen(false);
                    return;
                  }
                  setDialogOpen(open);
                }}
              >
                <DialogTrigger asChild>
                  <Button
                    className="bg-accent text-accent-foreground hover:bg-accent/90"
                    disabled={!canEditConfiguracoes}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Nova instancia
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Conectar instancia UAZAPI</DialogTitle>
                    <DialogDescription>Informe uma instancia existente na sua conta.</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 pt-2">
                    <div className="space-y-2"><Label>Nome exibido</Label><Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Comercial SP" /></div>
                    <div className="space-y-2">
                      <Label>Nome tecnico da instancia</Label>
                      <Input
                        value={instanceName}
                        onChange={(e) => setInstanceName(e.target.value)}
                        placeholder="Opcional na UAZAPI v2, obrigatorio na v1"
                      />
                    </div>
                    <div className="space-y-2"><Label>Token da instancia</Label><Input value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="Token da instancia na UAZAPI" /></div>
                    <div className="space-y-2"><Label>Base URL</Label><Input value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} /></div>
                    <div className="flex items-center justify-between rounded-xl border border-border p-3">
                      <div><p className="text-sm font-medium text-foreground">Definir como padrao</p><p className="text-xs text-muted-foreground">Novas campanhas usam essa instancia.</p></div>
                      <Button variant={isDefault ? "default" : "outline"} size="sm" onClick={() => setIsDefault((v) => !v)}>{isDefault ? "Sim" : "Nao"}</Button>
                    </div>
                    <Button
                      className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
                      disabled={connectInstance.isPending || !displayName || !apiKey || !canUseAuthenticatedActions || !canEditConfiguracoes}
                      onClick={async () => {
                        if (!canEditConfiguracoes) {
                          toast({
                            title: "Ação indisponível",
                            description: "Seu papel nao tem permissao para conectar uma instancia.",
                            variant: "destructive",
                          });
                          return;
                        }
                        if (!canUseAuthenticatedActions) {
                          toast({
                            title: "Sessao indisponivel",
                            description: "Faca login novamente antes de conectar uma instancia.",
                            variant: "destructive",
                          });
                          useAppStore.getState().addNotification({
                            tipo: "erro",
                            titulo: "Sessao indisponivel",
                            descricao: "Faca login novamente antes de conectar uma instancia.",
                          });
                          return;
                        }

                        try {
                          const instance = await connectInstance.mutateAsync({ displayName, uazapiInstanceName: instanceName, apiKey, uazapiBaseUrl: baseUrl, isDefault });
                          const title = instance.lastError ? "Instancia vinculada com alerta" : "Instancia conectada";
                          const desc = instance.lastError ?? "QR, webhook e status sincronizados.";
                          toast({ title, description: desc });
                          useAppStore.getState().addNotification({
                            tipo: instance.lastError ? "aviso" : "sucesso",
                            titulo: title,
                            descricao: desc,
                          });
                          setDialogOpen(false);
                          setDisplayName(""); setInstanceName(""); setApiKey(""); setBaseUrl("https://api.uazapi.com"); setIsDefault(true);
                        } catch (e) {
                          const message = e instanceof Error ? e.message : "Tente novamente.";
                          const hint = message.includes("Sua sessao atual nao foi aceita")
                            ? "Faca logout, entre novamente e tente mais uma vez."
                            : message;
                          toast({ title: "Falha ao conectar", description: hint, variant: "destructive" });
                          useAppStore.getState().addNotification({
                            tipo: "erro",
                            titulo: "Falha ao conectar",
                            descricao: hint,
                          });
                        }
                      }}
                    >
                      {connectInstance.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      Conectar
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {[{ label: "Instancias conectadas", value: metrics.activeInstances, icon: MessageSquare }, { label: "Instancias cadastradas", value: metrics.totalInstances, icon: ShieldCheck }].map((metric) => (
              <Card key={metric.label} className="border-border/60 bg-card/80">
                <CardContent className="flex items-center justify-between p-5">
                  <div><p className="text-xs text-muted-foreground">{metric.label}</p><p className="text-2xl font-bold text-foreground">{metric.value}</p></div>
                  <div className="rounded-xl bg-accent/10 p-3 text-accent"><metric.icon className="h-5 w-5" /></div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="border-border/60 bg-card/80">
            <CardHeader>
              <CardTitle className="text-lg">Instancias WhatsApp</CardTitle>
              <CardDescription>Estados reais vindos da UAZAPI e do banco.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoading ? <p className="text-sm text-muted-foreground">Carregando instancias...</p> : error ? <p className="text-sm text-destructive">{error.message}</p> : instances.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">Nenhuma instancia conectada ainda.</div>
              ) : instances.map((instance) => {
                const src = qrSrc(instance.lastQr);
                return (
                  <div key={instance.id} className="rounded-2xl border border-border p-5">
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                      <div className="space-y-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-lg font-bold text-foreground">{instance.displayName}</h3>
                          <Badge className={statusStyles[instance.status]}>{instance.status === "connected" ? "Conectada" : instance.status === "connecting" ? "Conectando" : instance.status === "error" ? "Erro" : "Desconectada"}</Badge>
                          {instance.isDefault ? <Badge className="bg-accent text-accent-foreground">Padrao</Badge> : null}
                        </div>
                        <div className="grid gap-2 text-sm text-muted-foreground md:grid-cols-2">
                          <p><strong className="text-foreground">Instancia:</strong> {instance.uazapiInstanceName}</p>
                          <p><strong className="text-foreground">Numero:</strong> {instance.phoneNumber ?? "aguardando leitura"}</p>
                          <p><strong className="text-foreground">Base URL:</strong> {instance.uazapiBaseUrl}</p>
                          <p><strong className="text-foreground">Ultima sync:</strong> {instance.lastSyncAt ?? "nunca"}</p>
                        </div>
                        {instance.lastError ? <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"><AlertTriangle className="mr-2 inline h-4 w-4" />{instance.lastError}</div> : null}
                        {src ? <div className="w-full max-w-[260px] rounded-2xl border border-border bg-white p-3"><img src={src} alt={`QR Code da instancia ${instance.displayName}`} className="h-auto w-full rounded-xl border border-border bg-white" /><p className="mt-3 text-xs text-muted-foreground">Escaneie este QR no WhatsApp.</p></div> : null}
                      </div>
                      <div className="grid gap-3 sm:grid-cols-3 xl:w-[420px]">
                        <Card className="border-border/60 bg-secondary/50"><CardContent className="flex flex-col items-center justify-center gap-2 p-4 text-center"><QrCode className="h-6 w-6 text-accent" /><p className="text-xs text-muted-foreground">QR para conectar</p><p className="text-xs text-foreground">{src ? "Escaneie no WhatsApp" : "Aguardando QR"}</p></CardContent></Card>
                        <Button
                          variant="outline"
                          onClick={() => {
                            if (!canUseAuthenticatedActions) {
                              toast({
                                title: "Sessao indisponivel",
                                description: "Faca login novamente antes de sincronizar esta instancia.",
                                variant: "destructive",
                              });
                              useAppStore.getState().addNotification({
                                tipo: "erro",
                                titulo: "Sessao indisponivel",
                                descricao: "Faca login novamente antes de sincronizar esta instancia.",
                              });
                              return;
                            }

                          if (!canEditConfiguracoes) {
                            toast({
                              title: "Ação indisponível",
                              description: "Seu papel nao tem permissao para sincronizar instancias.",
                              variant: "destructive",
                            });
                            return;
                          }

                          syncInstances.mutate({ instanceId: instance.id });
                        }}
                          disabled={syncInstances.isPending || !canUseAuthenticatedActions || !canEditConfiguracoes}
                        >
                          <RefreshCw className="mr-2 h-4 w-4" />
                          Sync
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={async () => {
                            if (!canUseAuthenticatedActions) {
                              toast({
                                title: "Sessao indisponivel",
                                description: "Faca login novamente antes de remover uma instancia.",
                                variant: "destructive",
                              });
                              useAppStore.getState().addNotification({
                                tipo: "erro",
                                titulo: "Sessao indisponivel",
                                descricao: "Faca login novamente antes de remover uma instancia.",
                              });
                              return;
                            }

                            if (!canEditConfiguracoes) {
                              toast({
                                title: "Ação indisponível",
                                description: "Seu papel nao tem permissao para remover uma instancia.",
                                variant: "destructive",
                              });
                              return;
                            }
                            await deleteInstance.mutateAsync(instance.id);
                            const archived = `${instance.displayName} saiu da operacao e as conversas ficaram arquivadas.`;
                            toast({ title: "Canal arquivado", description: archived });
                            useAppStore.getState().addNotification({
                              tipo: "aviso",
                              titulo: "Canal arquivado",
                              descricao: archived,
                            });
                          }}
                          disabled={deleteInstance.isPending || !canUseAuthenticatedActions || !canEditConfiguracoes}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Remover
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
                </>
              ) : null}

              {integrationsSection === "automacao" ? (
          <>
          <Card className="border-border/60 bg-card/80">
            <CardHeader>
              <CardTitle className="text-lg">IA no n8n</CardTitle>
              <CardDescription className="space-y-2">
                <span className="block">
                  Webhook para o n8n responder leads no mesmo WhatsApp. Use a edge function{" "}
                  <code className="text-xs">n8n-reply</code> para enviar mensagens. A IA só é acionada
                  quando as regras de negócio permitem (sem atendente no chat, negócio sem responsável,
                  cliente sem opt-out, etc.). Para CRM e envios genéricos, use a API REST{" "}
                  <code className="text-xs">wchat-api</code>.
                </span>
                <Button variant="link" className="h-auto p-0 text-accent" asChild>
                  <Link to="/configuracoes/api-docs">
                    <BookOpen className="mr-1 inline h-3.5 w-3.5" />
                    Documentação Swagger (duas APIs)
                  </Link>
                </Button>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="n8n-enabled"
                  checked={n8nEnabled}
                  onChange={(e) => setN8nEnabled(e.target.checked)}
                  className="h-4 w-4 rounded border-border"
                />
                <Label htmlFor="n8n-enabled">Ativar integração n8n</Label>
              </div>
              <div className="space-y-2">
                <Label>URL do webhook n8n</Label>
                <Input value={n8nUrl} onChange={(e) => setN8nUrl(e.target.value)} placeholder="https://seu-n8n.com/webhook/..." />
              </div>
              <div className="space-y-2">
                <Label>Segredo (HMAC)</Label>
                <Input type="password" value={n8nSecret} onChange={(e) => setN8nSecret(e.target.value)} placeholder="shared-secret" />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="auto-lead"
                    checked={autoLead}
                    onChange={(e) => setAutoLead(e.target.checked)}
                    className="h-4 w-4 rounded border-border"
                  />
                  <Label htmlFor="auto-lead">Criar lead CRM ao receber mensagem</Label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="auto-assign"
                    checked={autoAssignLead}
                    onChange={(e) => setAutoAssignLead(e.target.checked)}
                    className="h-4 w-4 rounded border-border"
                  />
                  <Label htmlFor="auto-assign">Distribuir chat automaticamente</Label>
                </div>
              </div>
              <div className="space-y-2 border-t border-border/60 pt-4">
                <Label htmlFor="stale-negotiation-days">Dias sem contato para alerta &quot;Parado&quot;</Label>
                <Input
                  id="stale-negotiation-days"
                  type="number"
                  min={1}
                  max={90}
                  value={staleNegotiationDays}
                  onChange={(e) => setStaleNegotiationDays(Number(e.target.value))}
                />
                <p className="text-xs text-muted-foreground">
                  Negócios em andamento sem interação há esse prazo exibem alerta no quadro CRM (1 a 90 dias).
                </p>
              </div>
              <div className="space-y-2">
                <Label>Modo IA padrão em novos chats</Label>
                <Select value={defaultAiMode} onValueChange={(v) => setDefaultAiMode(v as typeof defaultAiMode)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="off">Desligado</SelectItem>
                    <SelectItem value="qualifying">Qualificação</SelectItem>
                    <SelectItem value="full">Completo</SelectItem>
                    <SelectItem value="handoff">Handoff (só humano)</SelectItem>
                  </SelectContent>
                </Select>
                <ul className="list-disc space-y-1 pl-5 text-xs text-muted-foreground">
                  <li>
                    <strong>Qualificação:</strong> responde só em estágios iniciais (lead/contato) e
                    nunca se o negócio ou o chat já tiver responsável.
                  </li>
                  <li>
                    <strong>Completo:</strong> pode responder em qualquer estágio ativo, desde que não
                    haja humano no chat nem dono no CRM.
                  </li>
                  <li>
                    <strong>Handoff:</strong> não chama o n8n; use após transferir para vendedor.
                  </li>
                </ul>
              </div>
              <Button
                className="bg-accent text-accent-foreground hover:bg-accent/90"
                disabled={!canUseAuthenticatedActions || upsertIntegrations.isPending || !canEditConfiguracoes}
                onClick={async () => {
                  if (!canEditConfiguracoes) {
                    toast({
                      title: "Ação indisponível",
                      description: "Seu papel nao tem permissao para salvar integrações.",
                      variant: "destructive",
                    });
                    return;
                  }
                  try {
                    await upsertIntegrations.mutateAsync({
                      n8nWebhookUrl: n8nUrl.trim() || null,
                      n8nSecret: n8nSecret.trim() || null,
                      n8nEnabled,
                    });
                    await upsertSettings.mutateAsync({
                      autoLeadOnInbound: autoLead,
                      autoAssignOnLead: autoAssignLead,
                      defaultAiMode,
                      staleNegotiationDays,
                    });
                    toast({ title: "Integração salva", description: "Configurações de CRM e n8n atualizadas." });
                  } catch (e) {
                    toast({
                      title: "Erro",
                      description: e instanceof Error ? e.message : "Falha ao salvar",
                      variant: "destructive",
                    });
                  }
                }}
              >
                Salvar IA e CRM
              </Button>
            </CardContent>
          </Card>

          <ApiKeysSettingsCard
            canEdit={canEditConfiguracoes}
            disabled={!canUseAuthenticatedActions}
          />
          </>
              ) : null}
            </div>
          </div>
        </TabsContent>

        {canViewCollaborators ? (
          <TabsContent value="colaboradores" className="space-y-6">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
              <CollaboratorsSectionNav
                value={collaboratorsSection}
                onChange={handleCollaboratorsSectionChange}
              />
              <div className="min-w-0 flex-1 space-y-6">
                {collaboratorsSection === "permissoes" ? (
                  <RolePermissionsMatrix
                    canEdit={myProfile?.role === "admin"}
                    disabled={!canUseAuthenticatedActions}
                  />
                ) : null}

                {collaboratorsSection === "fila" ? (
                  <Card className="border-primary/20 bg-primary/5">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Fila de atendimento</CardTitle>
                      <CardDescription>
                        Configure quem recebe conversas do pool, limites de carga e distribuição automática.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button variant="secondary" asChild>
                        <Link to="/configuracoes/fila">Abrir configuração da fila</Link>
                      </Button>
                    </CardContent>
                  </Card>
                ) : null}

                {collaboratorsSection === "usuarios" ? (
                  <Tabs defaultValue="equipe" className="space-y-6">
                    <TabsList className="h-auto flex-wrap justify-start rounded-2xl border border-border/60 bg-card/80 p-1">
                      <TabsTrigger value="equipe"><Users className="mr-2 h-4 w-4" />Equipe ativa</TabsTrigger>
                      <TabsTrigger value="criar"><Plus className="mr-2 h-4 w-4" />Criar acesso</TabsTrigger>
                      <TabsTrigger value="convites"><Mail className="mr-2 h-4 w-4" />Convites</TabsTrigger>
                    </TabsList>

                    <TabsContent value="equipe" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            {[{ label: "Colaboradores ativos", value: collaboratorMetrics.active, icon: Users }, { label: "Administradores", value: collaboratorMetrics.admins, icon: ShieldCheck }, { label: "Convites pendentes", value: collaboratorMetrics.pending, icon: Mail }].map((metric) => (
              <Card key={metric.label} className="border-border/60 bg-card/80"><CardContent className="flex items-center justify-between p-5"><div><p className="text-xs text-muted-foreground">{metric.label}</p><p className="text-2xl font-bold text-foreground">{metric.value}</p></div><div className="rounded-xl bg-accent/10 p-3 text-accent"><metric.icon className="h-5 w-5" /></div></CardContent></Card>
            ))}
          </div>

          <Card className="border-border/60 bg-card/80">
            <CardHeader><CardTitle className="text-lg">Equipe ativa</CardTitle><CardDescription>Usuarios ja vinculados ao tenant.</CardDescription></CardHeader>
            <CardContent className="space-y-3">
              {collaborators.length === 0 ? <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">Nenhum colaborador ativo encontrado.</div> : collaborators.map((member) => {
                const isSelf = member.id === myProfile?.id;
                const canChangeRole = canEditCollaborators && !isSelf;
                const isUpdatingRole =
                  updateCollaboratorRole.isPending &&
                  updateCollaboratorRole.variables?.profileId === member.id;
                return (
                  <div key={member.id} className="flex flex-col gap-3 rounded-2xl border border-border p-4 md:flex-row md:items-center md:justify-between">
                    <div className="min-w-0"><p className="truncate font-medium text-foreground">{member.nome || member.email}</p><p className="truncate text-sm text-muted-foreground">{member.email}</p></div>
                    <div className="flex flex-wrap items-center gap-2 md:shrink-0">
                      {canChangeRole ? (
                        <Select
                          value={member.role}
                          disabled={isUpdatingRole}
                          onValueChange={async (value) => {
                            const nextRole = value as UserRole;
                            if (nextRole === member.role) return;
                            try {
                              await updateCollaboratorRole.mutateAsync({ profileId: member.id, role: nextRole });
                              toast({ title: "Funcao atualizada", description: `${member.nome || member.email} agora e ${ROLE_LABELS[nextRole]}.` });
                            } catch (error) {
                              toast({
                                title: "Nao foi possivel atualizar a funcao",
                                description: error instanceof Error ? error.message : "Tente novamente em instantes.",
                                variant: "destructive",
                              });
                            }
                          }}
                        >
                          <SelectTrigger className="h-9 w-[170px] text-xs">
                            {isUpdatingRole ? (
                              <span className="flex items-center gap-2"><Loader2 className="h-3 w-3 animate-spin" />Atualizando...</span>
                            ) : (
                              <SelectValue />
                            )}
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">Administrador</SelectItem>
                            <SelectItem value="operacao">Operacao</SelectItem>
                            <SelectItem value="financeiro">Financeiro</SelectItem>
                            <SelectItem value="atendimento">Atendimento</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <Badge className="bg-secondary text-secondary-foreground">{ROLE_LABELS[member.role]}</Badge>
                      )}
                      <Badge className="bg-success/20 text-success">{member.status === "active" ? "Ativo" : "Inativo"}</Badge>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
                    </TabsContent>

                    <TabsContent value="criar" className="space-y-6">
            <Card className="border-border/60 bg-card/80">
              <CardHeader>
                <CardTitle className="text-lg">Criar acesso de colaborador</CardTitle>
                <CardDescription>Convide por e-mail e defina o papel inicial.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2"><Label>Nome</Label><Input value={inviteName} onChange={(e) => setInviteName(e.target.value)} placeholder="Maria da operacao" /></div>
                <div className="space-y-2"><Label>Email</Label><Input value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="maria@empresa.com.br" type="email" /></div>
                <div className="space-y-2">
                  <Label>Nivel de acesso</Label>
                  <Select value={inviteRole} onValueChange={(value) => setInviteRole(value as UserRole)}>
                    <SelectTrigger><SelectValue placeholder="Selecione um papel" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Administrador</SelectItem>
                      <SelectItem value="operacao">Operacao</SelectItem>
                      <SelectItem value="financeiro">Financeiro</SelectItem>
                      <SelectItem value="atendimento">Atendimento</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
                  disabled={
                    inviteCollaborator.isPending ||
                    !canUseAuthenticatedActions ||
                    !canEditCollaborators ||
                    !inviteName.trim() ||
                    !inviteEmail.trim()
                  }
                  onClick={async () => {
                    if (!canEditCollaborators) {
                      toast({
                        title: "Ação indisponível",
                        description: "Seu papel nao tem permissao para criar acessos.",
                        variant: "destructive",
                      });
                      return;
                    }
                    if (!canUseAuthenticatedActions) {
                      toast({
                        title: "Sessao indisponivel",
                        description: "Faca login novamente antes de criar acessos.",
                        variant: "destructive",
                      });
                      useAppStore.getState().addNotification({
                        tipo: "erro",
                        titulo: "Sessao indisponivel",
                        descricao: "Faca login novamente antes de criar acessos.",
                      });
                      return;
                    }

                    try {
                      const result = await inviteCollaborator.mutateAsync({ nome: inviteName, email: inviteEmail, role: inviteRole });
                      const createdTitle = result.warning
                        ? "Convite salvo com aviso"
                        : result.emailSent
                          ? "E-mail de ativacao enviado"
                          : "Acesso criado";
                      const createdDesc =
                        result.warning ??
                        (result.emailSent
                          ? `Enviamos o link para ${result.invite.email}. Peça para checar spam e lixo eletronico.`
                          : "Convite registrado para o colaborador.");
                      toast({
                        title: createdTitle,
                        description: createdDesc,
                        variant: result.warning ? "destructive" : "default",
                      });
                      useAppStore.getState().addNotification({
                        tipo: result.warning ? "aviso" : "sucesso",
                        titulo: createdTitle,
                        descricao: createdDesc,
                      });
                      setInviteName(""); setInviteEmail(""); setInviteRole("operacao");
                    } catch (e) {
                      const desc = e instanceof Error ? e.message : "Tente novamente.";
                      toast({ title: "Nao foi possivel criar o acesso", description: desc, variant: "destructive" });
                      useAppStore.getState().addNotification({
                        tipo: "erro",
                        titulo: "Nao foi possivel criar o acesso",
                        descricao: desc,
                      });
                    }
                  }}
                >
                  {inviteCollaborator.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                  Criar acesso
                </Button>
                {!canEditCollaborators ? <p className="text-xs text-warning">Seu papel nao tem permissão para convidar colaboradores.</p> : null}
              </CardContent>
            </Card>
                    </TabsContent>

                    <TabsContent value="convites" className="space-y-6">
            <Card className="border-border/60 bg-card/80">
              <CardHeader><CardTitle className="text-lg">Convites e pendencias</CardTitle><CardDescription>Controle do que ainda nao foi aceito.</CardDescription></CardHeader>
                <CardContent className="space-y-3">
                  {invites.length === 0 ? <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">Ainda nao existem convites registrados.</div> : invites.map((invite) => (
                    <div key={invite.id} className="flex flex-col gap-3 rounded-2xl border border-border p-4 md:flex-row md:items-center md:justify-between">
                      <div><p className="font-medium text-foreground">{invite.nome}</p><p className="text-sm text-muted-foreground">{invite.email}</p></div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge className="bg-secondary text-secondary-foreground">{ROLE_LABELS[invite.role]}</Badge>
                        <Badge className={invite.status === "accepted" ? "bg-success/20 text-success" : invite.status === "revoked" ? "bg-destructive/20 text-destructive" : "bg-warning/20 text-warning"}>{invite.status === "accepted" ? "Aceito" : invite.status === "revoked" ? "Revogado" : "Pendente"}</Badge>
                        {invite.status === "pending" ? (
                          <>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={
                              resendingInviteId === invite.id ||
                              inviteCollaborator.isPending ||
                              !canUseAuthenticatedActions ||
                              !canEditCollaborators
                            }
                            onClick={async () => {
                              if (!canUseAuthenticatedActions) {
                                toast({
                                  title: "Sessao indisponivel",
                                  description: "Faca login novamente antes de reenviar convites.",
                                  variant: "destructive",
                                });
                                return;
                              }

                              setResendingInviteId(invite.id);
                              try {
                                const result = await inviteCollaborator.mutateAsync({
                                  nome: invite.nome,
                                  email: invite.email,
                                  role: invite.role,
                                  resend: true,
                                });
                                const resendTitle = result.warning
                                  ? "Nao foi possivel reenviar"
                                  : result.emailSent
                                    ? "E-mail reenviado"
                                    : "Convite atualizado";
                                const resendDesc =
                                  result.warning ??
                                  `Novo link enviado para ${invite.email}. Peça para checar spam.`;
                                toast({
                                  title: resendTitle,
                                  description: resendDesc,
                                  variant: result.warning ? "destructive" : "default",
                                });
                                useAppStore.getState().addNotification({
                                  tipo: result.warning ? "aviso" : "sucesso",
                                  titulo: resendTitle,
                                  descricao: resendDesc,
                                });
                              } catch (e) {
                                const desc = e instanceof Error ? e.message : "Tente novamente.";
                                toast({ title: "Nao foi possivel reenviar", description: desc, variant: "destructive" });
                              } finally {
                                setResendingInviteId(null);
                              }
                            }}
                          >
                            {resendingInviteId === invite.id ? (
                              <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                            ) : (
                              <Mail className="mr-1 h-3 w-3" />
                            )}
                            Reenviar e-mail
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={revokeInvite.isPending || !canUseAuthenticatedActions || !canEditCollaborators}
                            onClick={async () => {
                              if (!canEditCollaborators) {
                                toast({
                                  title: "Ação indisponível",
                                  description: "Seu papel nao tem permissao para revogar convites.",
                                  variant: "destructive",
                                });
                                return;
                              }
                              if (!canUseAuthenticatedActions) {
                                toast({
                                  title: "Sessao indisponivel",
                                  description: "Faca login novamente antes de revogar convites.",
                                  variant: "destructive",
                                });
                                useAppStore.getState().addNotification({
                                  tipo: "erro",
                                  titulo: "Sessao indisponivel",
                                  descricao: "Faca login novamente antes de revogar convites.",
                                });
                                return;
                              }

                              try {
                                await revokeInvite.mutateAsync(invite.id);
                                const revoked = `${invite.email} foi marcado como revogado.`;
                                toast({ title: "Convite revogado", description: revoked });
                                useAppStore.getState().addNotification({
                                  tipo: "aviso",
                                  titulo: "Convite revogado",
                                  descricao: revoked,
                                });
                              } catch (e) {
                                const desc = e instanceof Error ? e.message : "Tente novamente.";
                                toast({ title: "Nao foi possivel revogar", description: desc, variant: "destructive" });
                                useAppStore.getState().addNotification({
                                  tipo: "erro",
                                  titulo: "Nao foi possivel revogar",
                                  descricao: desc,
                                });
                              }
                            }}
                          >
                            Revogar
                          </Button>
                          </>
                        ) : null}
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          disabled={
                            deletingInviteId === invite.id ||
                            deleteInvite.isPending ||
                            !canUseAuthenticatedActions ||
                            !canDeleteCollaborators
                          }
                          onClick={async () => {
                            if (!canDeleteCollaborators) {
                              toast({
                                title: "Ação indisponível",
                                description: "Seu papel nao tem permissao para excluir convites.",
                                variant: "destructive",
                              });
                              return;
                            }
                            if (!canUseAuthenticatedActions) {
                              toast({
                                title: "Sessao indisponivel",
                                description: "Faca login novamente antes de excluir convites.",
                                variant: "destructive",
                              });
                              return;
                            }

                            setDeletingInviteId(invite.id);
                            try {
                              await deleteInvite.mutateAsync(invite.id);
                              const removed = `Convite de ${invite.email} removido.`;
                              toast({ title: "Convite excluido", description: removed });
                              useAppStore.getState().addNotification({
                                tipo: "sucesso",
                                titulo: "Convite excluido",
                                descricao: removed,
                              });
                            } catch (e) {
                              const desc = e instanceof Error ? e.message : "Tente novamente.";
                              toast({ title: "Nao foi possivel excluir", description: desc, variant: "destructive" });
                            } finally {
                              setDeletingInviteId(null);
                            }
                          }}
                        >
                          {deletingInviteId === invite.id ? (
                            <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                          ) : (
                            <Trash2 className="mr-1 h-3 w-3" />
                          )}
                          Excluir
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
                    </TabsContent>
                  </Tabs>
                ) : null}
              </div>
            </div>
          </TabsContent>
        ) : null}

        <TabsContent value="funis" className="space-y-6">
          <Card className="border-border/60 bg-card/80">
            <CardHeader>
              <CardTitle className="text-lg">Funis do CRM</CardTitle>
              <CardDescription>
                Crie e edite funis, etapas do Kanban e campos obrigatórios usados em <strong>/crm</strong>.
                Sem configuração salva, o app usa os funis padrão.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {crmFunnelsLoading ? (
                <p className="text-sm text-muted-foreground">Carregando…</p>
              ) : (
                <>
                  <CrmFunnelConfigEditor
                    funnels={funnelDraft}
                    onChange={syncFunnelDraftToJson}
                    disabled={!canUseAuthenticatedActions || upsertCrmFunnels.isPending}
                    countNegotiationsByFunnel={
                      isSupabaseConfigured ? countCrmNegotiationsByFunnelId : undefined
                    }
                    countNegotiationsByStage={
                      isSupabaseConfigured ? countCrmNegotiationsByFunnelStage : undefined
                    }
                    pendingMigrations={pendingFunnelMigrations}
                    onPendingMigrationsChange={setPendingFunnelMigrations}
                  />

                  <Collapsible open={funnelJsonOpen} onOpenChange={setFunnelJsonOpen}>
                    <CollapsibleTrigger asChild>
                      <Button type="button" variant="ghost" size="sm" className="h-8 px-2 text-xs text-muted-foreground">
                        {funnelJsonOpen ? "Ocultar" : "Mostrar"} editor JSON avançado
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="space-y-2 pt-2">
                      <div className="space-y-2">
                        <Label htmlFor="crm-funnels-json">JSON dos funis (estrutura completa)</Label>
                        <Textarea
                          id="crm-funnels-json"
                          value={funnelJsonDraft}
                          onChange={(e) => setFunnelJsonDraft(e.target.value)}
                          className="min-h-[240px] font-mono text-xs"
                          spellCheck={false}
                          disabled={!canUseAuthenticatedActions}
                        />
                        <p className="text-xs text-muted-foreground">
                          Importação/exportação manual da configuração completa (útil para backup ou cópia entre
                          ambientes).
                        </p>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      disabled={upsertCrmFunnels.isPending || !canUseAuthenticatedActions || !canEditConfiguracoes}
                      onClick={() => {
                        if (!canEditConfiguracoes) {
                          toast({
                            title: "Ação indisponível",
                            description: "Seu papel nao tem permissao para salvar funis.",
                            variant: "destructive",
                          });
                          return;
                        }
                        if (!canUseAuthenticatedActions) {
                          toast({
                            title: "Sessão indisponível",
                            description: "Faça login novamente.",
                            variant: "destructive",
                          });
                          return;
                        }
                        void (async () => {
                          try {
                            if (funnelJsonOpen) {
                              let parsed: unknown;
                              try {
                                parsed = JSON.parse(funnelJsonDraft) as unknown;
                              } catch {
                                toast({
                                  title: "JSON inválido",
                                  description: "Verifique vírgulas e aspas.",
                                  variant: "destructive",
                                });
                                return;
                              }
                              const valid = parseTenantCrmFunnelsJson(parsed);
                              if (!valid) {
                                toast({
                                  title: "Formato inválido",
                                  description: "Cada funil precisa de id, listName e stages não vazios.",
                                  variant: "destructive",
                                });
                                return;
                              }
                              await saveFunnelConfig(valid);
                              return;
                            }
                            await saveFunnelConfig(funnelDraft);
                          } catch (e) {
                            toast({
                              title: "Não foi possível salvar",
                              description: e instanceof Error ? e.message : "Tente novamente.",
                              variant: "destructive",
                            });
                          }
                        })();
                      }}
                    >
                      {upsertCrmFunnels.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      Salvar funis
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={deleteCrmFunnels.isPending || !canUseAuthenticatedActions || !canDeleteConfiguracoes}
                      onClick={() => {
                        if (!canDeleteConfiguracoes) {
                          toast({
                            title: "Ação indisponível",
                            description: "Seu papel nao tem permissao para remover funis.",
                            variant: "destructive",
                          });
                          return;
                        }
                        if (!canUseAuthenticatedActions) {
                          return;
                        }
                        void (async () => {
                          try {
                            await deleteCrmFunnels.mutateAsync();
                            syncFunnelDraftToJson(structuredClone(DEFAULT_CRM_FUNNELS));
                            toast({
                              title: "Funis padrao",
                              description: "Configuracao customizada removida. O CRM voltou ao padrao do sistema.",
                            });
                          } catch (e) {
                            toast({
                              title: "Nao foi possivel restaurar",
                              description: e instanceof Error ? e.message : "Tente novamente.",
                              variant: "destructive",
                            });
                          }
                        })();
                      }}
                    >
                      {deleteCrmFunnels.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      Usar funis padrao
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Responsáveis no filtro do CRM vêm dos <button type="button" className="font-medium text-primary underline" onClick={() => handleTabChange("colaboradores")}>colaboradores ativos</button> deste tenant.
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="configuracao-chat" className="space-y-6">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
            <ChatConfigSectionNav value={chatConfigSection} onChange={handleChatConfigSectionChange} />
            <div className="min-w-0 flex-1 space-y-6">
              {chatConfigSection === "respostas" ? (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Respostas rapidas</CardTitle>
                        <CardDescription>
                          Mensagens pré-definidas acessíveis no chat pelo botão ⚡ ou digitando /.
                          Globais são visíveis a toda a equipe; Minhas são só suas.
                        </CardDescription>
                      </div>
                      <Button
                        size="sm"
                        className="rounded-xl"
                        disabled={!canEditConfiguracoes}
                        onClick={() => {
                          if (!canEditConfiguracoes) {
                            toast({
                              title: "Ação indisponível",
                              description: "Seu papel nao tem permissao para criar respostas rápidas.",
                              variant: "destructive",
                            });
                            return;
                          }
                          setQrEditingId(null);
                          setQrTitle("");
                          setQrShortcut("");
                          setQrBodyText("");
                          setQrScope("global");
                          setQrDialogOpen(true);
                        }}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Nova resposta
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {quickRepliesList.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
                        Nenhuma resposta cadastrada. Clique em "Nova resposta" para começar.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {quickRepliesList.map((qr) => (
                          <div
                            key={qr.id}
                            className="flex items-start gap-3 rounded-xl border border-border/60 bg-card/60 px-4 py-3"
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium">{qr.title}</span>
                                {qr.shortcut ? (
                                  <span className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground">
                                    /{qr.shortcut}
                                  </span>
                                ) : null}
                                <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${qr.scope === "global" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" : "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"}`}>
                                  {qr.scope === "global" ? "Global" : "Minha"}
                                </span>
                              </div>
                              <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{qr.bodyText}</p>
                            </div>
                            <div className="flex shrink-0 items-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-lg"
                                disabled={!canEditConfiguracoes}
                                onClick={() => {
                                  if (!canEditConfiguracoes) {
                                    toast({
                                      title: "Ação indisponível",
                                      description: "Seu papel nao tem permissao para editar respostas rápidas.",
                                      variant: "destructive",
                                    });
                                    return;
                                  }
                                  setQrEditingId(qr.id);
                                  setQrTitle(qr.title);
                                  setQrShortcut(qr.shortcut ?? "");
                                  setQrBodyText(qr.bodyText);
                                  setQrScope(qr.scope);
                                  setQrDialogOpen(true);
                                }}
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-lg text-destructive hover:text-destructive"
                                disabled={deleteQR.isPending || !canDeleteConfiguracoes}
                                onClick={() => {
                                  if (!canDeleteConfiguracoes) {
                                    toast({
                                      title: "Ação indisponível",
                                      description: "Seu papel nao tem permissao para excluir respostas rápidas.",
                                      variant: "destructive",
                                    });
                                    return;
                                  }
                                  void deleteQR.mutateAsync(qr.id).then(() => {
                                    toast({ title: "Resposta removida" });
                                  }).catch((e: Error) => {
                                    toast({ title: "Erro ao remover", description: e.message, variant: "destructive" });
                                  });
                                }}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ) : null}

              {chatConfigSection === "etiquetas" ? (
                <ChatTagsSettingsSection
                  canEdit={canEditConfiguracoes}
                  canDelete={canDeleteConfiguracoes}
                />
              ) : null}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="log" className="space-y-6">
          <PlatformLogSection />
        </TabsContent>
      </Tabs>

      {/* Dialog criar / editar resposta rápida */}
      <Dialog
        open={qrDialogOpen && canEditConfiguracoes}
        onOpenChange={(open) => {
          if (!canEditConfiguracoes) {
            setQrDialogOpen(false);
            return;
          }
          setQrDialogOpen(open);
        }}
      >
        <DialogContent className="max-w-lg rounded-2xl">
          <DialogHeader>
            <DialogTitle>{qrEditingId ? "Editar resposta" : "Nova resposta rápida"}</DialogTitle>
            <DialogDescription>
              O título é o nome que aparece na busca. O atalho (opcional) é ativado digitando /atalho no chat.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Título *</Label>
                <Input
                  value={qrTitle}
                  onChange={(e) => setQrTitle(e.target.value)}
                  placeholder="Ex: Saudação inicial"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Atalho</Label>
                <div className="flex items-center rounded-md border border-input bg-background">
                  <span className="border-r px-2 text-sm text-muted-foreground">/</span>
                  <Input
                    value={qrShortcut}
                    onChange={(e) => setQrShortcut(e.target.value.replace(/\s/g, ""))}
                    placeholder="oi"
                    className="border-0 shadow-none focus-visible:ring-0"
                  />
                </div>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Mensagem *</Label>
              <Textarea
                value={qrBodyText}
                onChange={(e) => setQrBodyText(e.target.value)}
                placeholder="Olá! Tudo bem? Em que posso ajudar?"
                className="min-h-[100px] resize-none"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Visibilidade</Label>
              <Select value={qrScope} onValueChange={(v) => setQrScope(v as QuickReplyScope)}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="global">Global — visível para toda a equipe</SelectItem>
                  <SelectItem value="private">Minha — só eu vejo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-2 border-t pt-4">
            <Button variant="outline" className="rounded-xl" onClick={() => setQrDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              className="rounded-xl"
              disabled={!canEditConfiguracoes || !qrTitle.trim() || !qrBodyText.trim() || createQR.isPending || updateQR.isPending}
              onClick={() => {
                if (!canEditConfiguracoes) {
                  toast({
                    title: "Ação indisponível",
                    description: "Seu papel nao tem permissao para salvar respostas rápidas.",
                    variant: "destructive",
                  });
                  return;
                }
                const payload = {
                  title: qrTitle.trim(),
                  shortcut: qrShortcut.trim() || null,
                  bodyText: qrBodyText,
                  scope: qrScope,
                };
                const promise = qrEditingId
                  ? updateQR.mutateAsync({ id: qrEditingId, ...payload })
                  : createQR.mutateAsync(payload);
                void promise
                  .then(() => {
                    toast({ title: qrEditingId ? "Resposta atualizada" : "Resposta criada" });
                    setQrDialogOpen(false);
                  })
                  .catch((e: Error) => {
                    toast({ title: "Erro ao salvar", description: e.message, variant: "destructive" });
                  });
              }}
            >
              {(createQR.isPending || updateQR.isPending) ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              {qrEditingId ? "Salvar alterações" : "Criar resposta"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
