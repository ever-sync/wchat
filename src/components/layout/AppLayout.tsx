import { Outlet } from "react-router-dom";
import { CalculadoraProvider } from "@/contexts/CalculadoraContext";
import { CommandPalette } from "@/components/CommandPalette";
import { AppSidebar } from "./AppSidebar";
import { CrmNotificationListener } from "./CrmNotificationListener";
import { MobileNav } from "./MobileNav";

export function AppLayout() {
  return (
    <CalculadoraProvider>
      <div className="flex h-[100dvh] max-h-[100dvh] flex-col overflow-hidden bg-background md:flex-row">
        <AppSidebar />
        <CrmNotificationListener />
        <CommandPalette />

        <div className="flex min-h-0 min-w-0 flex-1 flex-col pb-[max(5.5rem,env(safe-area-inset-bottom))] md:pb-0">
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <Outlet />
          </div>
        </div>

        <MobileNav />
      </div>
    </CalculadoraProvider>
  );
}
