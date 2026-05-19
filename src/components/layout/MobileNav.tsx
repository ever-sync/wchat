import { Briefcase, LogOut, Megaphone, MessageSquare, Package, Settings2, Users2 } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/hooks/useAuth";
import { useRolePermissions } from "@/hooks/useRolePermissions";
import { cn } from "@/lib/utils";

type NavIcon = typeof MessageSquare;

const linkItems: { title: string; url: string; icon: NavIcon; permission: "inbox" | "crm" | "clientes" | "produtos" | "marketing" | "configuracoes" }[] = [
  { title: "Chat", url: "/inbox", icon: MessageSquare, permission: "inbox" },
  { title: "CRM", url: "/crm", icon: Briefcase, permission: "crm" },
  { title: "Clientes", url: "/clientes", icon: Users2, permission: "clientes" },
  { title: "Produtos", url: "/produtos", icon: Package, permission: "produtos" },
  { title: "Marketing", url: "/marketing", icon: Megaphone, permission: "marketing" },
  { title: "Ajustes", url: "/configuracoes", icon: Settings2, permission: "configuracoes" },
];

function pathMatches(pathname: string, url: string) {
  if (url === "/crm") {
    return pathname === url;
  }
  return pathname === url || pathname.startsWith(`${url}/`);
}

export function MobileNav() {
  const pathname = useLocation().pathname;
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { can, isLoading: permissionsLoading } = useRolePermissions();

  return (
    <nav
      className="fixed bottom-[max(0.5rem,env(safe-area-inset-bottom,0px))] left-2 right-2 z-40 rounded-2xl border border-border bg-card/95 p-1.5 shadow-lg backdrop-blur-md md:hidden"
      aria-label="Navegacao principal"
    >
      <div className="flex items-stretch justify-between gap-0.5">
        {!permissionsLoading
          ? linkItems.filter((item) => can(item.permission, "view")).map((item) => {
          const isActive = pathMatches(pathname, item.url);

          return (
            <NavLink
              key={item.url}
              to={item.url}
              end={item.url === "/crm"}
              className={cn(
                "flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-xl px-1 py-2 text-[9px] font-medium leading-tight transition-colors sm:text-[10px]",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-wchat-100 hover:text-primary",
              )}
              activeClassName=""
            >
              <item.icon className="h-[18px] w-[18px] shrink-0" aria-hidden />
              <span className="max-w-full truncate">{item.title}</span>
            </NavLink>
          );
        })
          : null}

        <button
          type="button"
          aria-label="Sair"
          onClick={async () => {
            await signOut();
            navigate("/login");
          }}
          className="flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-xl px-1 py-2 text-[9px] font-medium leading-tight text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive sm:text-[10px]"
        >
          <LogOut className="h-[18px] w-[18px] shrink-0" aria-hidden />
          <span className="max-w-full truncate">Sair</span>
        </button>
      </div>
    </nav>
  );
}
