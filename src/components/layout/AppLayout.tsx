import { Outlet, useLocation } from "react-router-dom";
import { AppSidebar } from "./AppSidebar";
import { CrmNotificationListener } from "./CrmNotificationListener";
import { MobileNav } from "./MobileNav";
import { cn } from "@/lib/utils";

export function AppLayout() {
  const { pathname } = useLocation();
  const isInbox = pathname === "/inbox" || pathname.startsWith("/inbox/");
  const isCrmBoard = pathname === "/crm";

  return (
    <div
      className={cn(
        "flex flex-col md:flex-row",
        isInbox || isCrmBoard
          ? "h-[100dvh] max-h-[100dvh] overflow-hidden bg-background"
          : "min-h-[100dvh] bg-background",
      )}
    >
      <AppSidebar />
      <CrmNotificationListener />

      <div
        className={cn(
          "flex min-h-0 min-w-0 flex-1 flex-col",
          "pb-[max(5.5rem,env(safe-area-inset-bottom))] md:pb-0",
        )}
      >
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <Outlet />
        </div>
      </div>

      <MobileNav />
    </div>
  );
}
