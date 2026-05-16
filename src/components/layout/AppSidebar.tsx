import { BarChart3, Briefcase, LogOut, MessageCircle, Package, Settings2, Users2 } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { NavLink } from "@/components/NavLink";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

type MenuItem = {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
};

const primaryItems: MenuItem[] = [
  { title: "Chat", url: "/inbox", icon: MessageCircle },
  { title: "CRM", url: "/crm", icon: Briefcase },
  { title: "Clientes", url: "/clientes", icon: Users2 },
  { title: "Produtos", url: "/produtos", icon: Package },
  { title: "Relatórios", url: "/relatorios", icon: BarChart3 },
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
        {primaryItems.map((item) => (
          <RailNavLink key={item.url} item={item} pathname={pathname} />
        ))}
      </div>

      <div className="min-h-0 flex-1" aria-hidden />

      <div className="flex flex-col items-center gap-2 px-2 pb-1">
        <Tooltip delayDuration={200}>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={() => navigate("/configuracoes?aba=perfil")}
              className="flex h-12 w-12 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-wchat-100 hover:text-primary"
              aria-label="Minha conta"
            >
              <Avatar className="h-9 w-9 border border-border">
                {profile?.avatar ? <AvatarImage src={profile.avatar} alt="" /> : null}
                <AvatarFallback className="bg-primary text-[11px] font-semibold text-primary-foreground">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </button>
          </TooltipTrigger>
          <TooltipContent side="right" className="border-border bg-primary text-primary-foreground">
            {profile?.nome ?? "Conta"}
          </TooltipContent>
        </Tooltip>

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
