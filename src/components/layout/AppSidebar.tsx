import {
  BarChart3,
  Briefcase,
  Check,
  Gauge,
  LogOut,
  Megaphone,
  MessageCircle,
  Package,
  Settings2,
  UserCog,
  Users2,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { NavLink } from "@/components/NavLink";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { useRolePermissions } from "@/hooks/useRolePermissions";
import { useToast } from "@/hooks/use-toast";
import { useSetMyAvailability } from "@/lib/api/settings";
import { cn } from "@/lib/utils";
import type { UserAvailability } from "@/types/domain";

const AVAILABILITY_OPTIONS: Array<{
  value: UserAvailability;
  label: string;
  dotClass: string;
  description: string;
}> = [
  {
    value: "available",
    label: "Disponível",
    dotClass: "bg-emerald-500",
    description: "Recebe novas conversas pela fila",
  },
  {
    value: "busy",
    label: "Ocupado",
    dotClass: "bg-amber-500",
    description: "Não recebe auto-atribuição",
  },
  {
    value: "offline",
    label: "Offline",
    dotClass: "bg-zinc-400",
    description: "Fora da fila automática",
  },
];

function availabilityMeta(value: UserAvailability | undefined) {
  return AVAILABILITY_OPTIONS.find((opt) => opt.value === value) ?? AVAILABILITY_OPTIONS[0];
}

type MenuItem = {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
  permission: "inbox" | "crm" | "clientes" | "produtos" | "relatorios" | "marketing" | "configuracoes";
};

const primaryItems: MenuItem[] = [
  { title: "Chat", url: "/inbox", icon: MessageCircle, permission: "inbox" },
  { title: "CRM", url: "/crm", icon: Briefcase, permission: "crm" },
  { title: "Clientes", url: "/clientes", icon: Users2, permission: "clientes" },
  { title: "Produtos", url: "/produtos", icon: Package, permission: "produtos" },
  { title: "Painel", url: "/painel", icon: Gauge, permission: "relatorios" },
  { title: "Relatórios", url: "/relatorios", icon: BarChart3, permission: "relatorios" },
  { title: "Marketing", url: "/marketing", icon: Megaphone, permission: "marketing" },
];

function SidebarTooltip({
  label,
  children,
}: {
  label: string;
  children: React.ReactElement;
}) {
  return (
    <Tooltip delayDuration={200}>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent
        side="right"
        align="center"
        className="border-border bg-primary text-xs font-medium text-primary-foreground shadow-xl"
      >
        {label}
      </TooltipContent>
    </Tooltip>
  );
}

function isItemActive(item: MenuItem, pathname: string) {
  if (item.url === "/crm") {
    return pathname === item.url;
  }
  return pathname === item.url || pathname.startsWith(`${item.url}/`);
}

function RailNavLink({ item, pathname }: { item: MenuItem; pathname: string }) {
  const isActive = isItemActive(item, pathname);

  return (
    <SidebarTooltip label={item.title}>
      <NavLink
        to={item.url}
        title={item.title}
        aria-label={item.title}
        end={item.url === "/crm"}
        className={cn(
          "flex h-12 w-12 items-center justify-center rounded-full transition-colors duration-150",
          isActive
            ? "bg-primary text-primary-foreground shadow-sm"
            : "text-muted-foreground hover:bg-wchat-100 hover:text-primary",
        )}
        activeClassName=""
      >
        <item.icon className="h-[22px] w-[22px]" aria-hidden />
      </NavLink>
    </SidebarTooltip>
  );
}

export function AppSidebar() {
  const pathname = useLocation().pathname;
  const navigate = useNavigate();
  const { signOut, profile } = useAuth();
  const { can, isLoading: permissionsLoading } = useRolePermissions();
  const { toast } = useToast();
  const setAvailability = useSetMyAvailability({
    onError: (error) => {
      toast({
        title: "Não foi possível mudar o status",
        description: error instanceof Error ? error.message : "Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const currentAvailability = availabilityMeta(profile?.availability);
  const showAvailabilityToggle = profile?.role === "atendimento";

  const isSettingsActive = pathname === "/configuracoes" || pathname.startsWith("/configuracoes/");
  const initials =
    profile?.nome
      ?.split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join("") || "?";

  return (
    <aside
      className="relative z-50 hidden h-[100dvh] w-[72px] shrink-0 flex-col border-r border-border bg-card py-3 md:flex"
      aria-label="Navegacao principal"
    >
      <div className="flex flex-col items-center gap-1 px-2">
        {!permissionsLoading
          ? primaryItems
              .filter((item) => can(item.permission, "view"))
              .map((item) => <RailNavLink key={item.url} item={item} pathname={pathname} />)
          : null}
      </div>

      <div className="min-h-0 flex-1" aria-hidden />

      <div className="flex flex-col items-center gap-2 px-2 pb-1">
        <DropdownMenu>
          <Tooltip delayDuration={200}>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="relative flex h-12 w-12 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-wchat-100 hover:text-primary"
                  aria-label="Minha conta"
                >
                  <Avatar className="h-9 w-9 border border-border">
                    {profile?.avatar ? <AvatarImage src={profile.avatar} alt="" /> : null}
                    <AvatarFallback className="bg-primary text-[11px] font-semibold text-primary-foreground">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  {showAvailabilityToggle ? (
                    <span
                      className={cn(
                        "absolute bottom-1 right-1 h-3 w-3 rounded-full border-2 border-card",
                        currentAvailability.dotClass,
                      )}
                      aria-label={`Status: ${currentAvailability.label}`}
                    />
                  ) : null}
                </button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent
              side="right"
              className="border-border bg-primary text-primary-foreground"
            >
              {profile?.nome ?? "Conta"}
              {showAvailabilityToggle ? ` · ${currentAvailability.label}` : ""}
            </TooltipContent>
          </Tooltip>
          <DropdownMenuContent side="right" align="end" className="w-60">
            {showAvailabilityToggle ? (
              <>
                <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground">
                  Meu status
                </DropdownMenuLabel>
                {AVAILABILITY_OPTIONS.map((opt) => {
                  const active = currentAvailability.value === opt.value;
                  return (
                    <DropdownMenuItem
                      key={opt.value}
                      disabled={setAvailability.isPending}
                      onSelect={() => {
                        if (active) return;
                        void setAvailability.mutateAsync(opt.value);
                      }}
                      className="flex items-start gap-2"
                    >
                      <span className={cn("mt-1 h-2.5 w-2.5 shrink-0 rounded-full", opt.dotClass)} />
                      <span className="flex-1">
                        <span className="block text-sm font-medium text-foreground">{opt.label}</span>
                        <span className="block text-[11px] text-muted-foreground">{opt.description}</span>
                      </span>
                      {active ? <Check className="mt-1 h-4 w-4 text-primary" /> : null}
                    </DropdownMenuItem>
                  );
                })}
                <DropdownMenuSeparator />
              </>
            ) : null}
            <DropdownMenuItem onSelect={() => navigate("/configuracoes?aba=perfil")}>
              <UserCog className="mr-2 h-4 w-4" />
              Minha conta
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {can("configuracoes", "view") ? (
          <SidebarTooltip label="Configuracoes">
            <NavLink
              to="/configuracoes"
              title="Configuracoes"
              aria-label="Configuracoes"
              className={cn(
                "flex h-12 w-12 items-center justify-center rounded-full transition-colors duration-150",
                isSettingsActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-wchat-100 hover:text-primary",
              )}
              activeClassName=""
            >
              <Settings2 className="h-[22px] w-[22px]" aria-hidden />
            </NavLink>
          </SidebarTooltip>
        ) : null}

        <SidebarTooltip label="Sair">
          <button
            type="button"
            title="Sair"
            aria-label="Sair"
            onClick={async () => {
              await signOut();
              navigate("/login");
            }}
            className="flex h-12 w-12 items-center justify-center rounded-full text-muted-foreground transition-colors duration-150 hover:bg-destructive/10 hover:text-destructive"
          >
            <LogOut className="h-[20px] w-[20px]" aria-hidden />
          </button>
        </SidebarTooltip>
      </div>
    </aside>
  );
}
