import { AlertTriangle, CalendarX2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { NegotiationAlert } from "@/lib/crm/negotiation-alerts";

const ICON_BY_KIND = {
  stale: AlertTriangle,
  no_future_task: CalendarX2,
} as const;

type CrmNegotiationAlertBadgesProps = {
  alerts: NegotiationAlert[];
  className?: string;
  compact?: boolean;
};

export function CrmNegotiationAlertBadges({
  alerts,
  className,
  compact = false,
}: CrmNegotiationAlertBadgesProps) {
  if (alerts.length === 0) {
    return null;
  }

  return (
    <div className={cn("flex flex-wrap gap-1", className)}>
      {alerts.map((alert) => {
        const Icon = ICON_BY_KIND[alert.kind];
        return (
          <span
            key={alert.kind}
            className={cn(
              "inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-semibold leading-tight",
              alert.severity === "danger"
                ? "border-[#f5c2c7] bg-[#fdecea] text-[#b71c1c]"
                : "border-[#ffe082] bg-[#fff8e1] text-[#e65100]",
              compact && "px-1 py-px text-[9px]",
            )}
            title={alert.label}
          >
            <Icon className={cn("shrink-0 opacity-90", compact ? "h-3 w-3" : "h-3.5 w-3.5")} aria-hidden />
            {!compact ? alert.label : null}
          </span>
        );
      })}
    </div>
  );
}
