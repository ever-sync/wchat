import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import {
  ChevronDown,
  FileText,
  LayoutTemplate,
  Link2,
  type LucideIcon,
  Megaphone,
  MessageCircle,
  Send,
  Shuffle,
  Workflow,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MarketingAutomations } from "@/components/marketing/MarketingAutomations";
import { MarketingCampaigns } from "@/components/marketing/MarketingCampaigns";
import { MarketingFormsTab } from "@/components/marketing/forms/MarketingFormsTab";
import { PageShell } from "@/components/layout/PageShell";
import { cn } from "@/lib/utils";

const CONVERTER_SUB_TABS = [
  { value: "landing-pages", label: "Landing Pages", icon: LayoutTemplate },
  { value: "formularios", label: "Formulários", icon: FileText },
  { value: "botoes-whatsapp", label: "Botões de WhatsApp", icon: MessageCircle },
  { value: "link-na-bio", label: "Link na Bio", icon: Link2 },
] as const;

const TABS = [
  "campanhas",
  "automacoes",
  ...CONVERTER_SUB_TABS.map((t) => t.value),
] as const;
type MarketingTab = (typeof TABS)[number];

const DEFAULT_TAB: MarketingTab = "campanhas";

const CONVERTER_VALUES = new Set<string>(CONVERTER_SUB_TABS.map((t) => t.value));

function parseTab(value: string | null): MarketingTab {
  if (value && (TABS as readonly string[]).includes(value)) {
    return value as MarketingTab;
  }
  return DEFAULT_TAB;
}

function ConverterTabLabel({
  activeSubLabel,
}: {
  activeSubLabel: string | null;
}) {
  return (
    <span className="inline-flex items-center gap-2">
      <Shuffle className="h-4 w-4" aria-hidden />
      {activeSubLabel ?? "Converter"}
      <ChevronDown className="h-3.5 w-3.5" aria-hidden />
    </span>
  );
}

function ConverterTabTrigger({
  active,
  activeSubLabel,
  onSelect,
}: {
  active: boolean;
  activeSubLabel: string | null;
  onSelect: (value: MarketingTab) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex items-center justify-center whitespace-nowrap rounded-lg px-4 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            active
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
          aria-haspopup="menu"
        >
          <ConverterTabLabel activeSubLabel={activeSubLabel} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-[220px]">
        {CONVERTER_SUB_TABS.map((item) => (
          <DropdownMenuItem
            key={item.value}
            onSelect={() => onSelect(item.value)}
            className="flex items-center gap-2.5 py-2 text-sm font-medium"
          >
            <item.icon className="h-4 w-4 text-muted-foreground" aria-hidden />
            <span>{item.label}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ComingSoon({ icon: Icon, title }: { icon: LucideIcon; title: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-muted/30 py-20 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Icon className="h-6 w-6" aria-hidden />
      </div>
      <div className="space-y-0.5">
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground">Em breve</p>
      </div>
    </div>
  );
}

export default function Marketing() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = useMemo(() => parseTab(searchParams.get("aba")), [searchParams]);

  const handleTabChange = (value: string) => {
    const next = parseTab(value);
    const params = new URLSearchParams(searchParams);
    params.set("aba", next);
    setSearchParams(params, { replace: true });
  };

  const isConverterActive = CONVERTER_VALUES.has(activeTab);
  const activeSubLabel = isConverterActive
    ? CONVERTER_SUB_TABS.find((t) => t.value === activeTab)?.label ?? null
    : null;

  return (
    <PageShell contentClassName="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Megaphone className="h-5 w-5" aria-hidden />
        </div>
        <h1 className="text-xl font-semibold tracking-tight">Marketing</h1>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="flex flex-col gap-5">
        <TabsList className="h-11 w-full justify-start gap-1 rounded-xl bg-muted/60 p-1 sm:w-auto">
          <TabsTrigger value="campanhas" className="gap-2 rounded-lg px-4 data-[state=active]:shadow-sm">
            <Send className="h-4 w-4" aria-hidden />
            Campanhas
          </TabsTrigger>
          <TabsTrigger value="automacoes" className="gap-2 rounded-lg px-4 data-[state=active]:shadow-sm">
            <Workflow className="h-4 w-4" aria-hidden />
            Automações
          </TabsTrigger>
          <ConverterTabTrigger
            active={isConverterActive}
            activeSubLabel={activeSubLabel}
            onSelect={handleTabChange}
          />
        </TabsList>

        <TabsContent value="campanhas" className="mt-0">
          <MarketingCampaigns />
        </TabsContent>

        <TabsContent value="automacoes" className="mt-0">
          <MarketingAutomations />
        </TabsContent>

        {CONVERTER_SUB_TABS.map((item) => (
          <TabsContent key={item.value} value={item.value} className="mt-0">
            {item.value === "formularios" ? (
              <MarketingFormsTab />
            ) : (
              <ComingSoon icon={item.icon} title={item.label} />
            )}
          </TabsContent>
        ))}
      </Tabs>
    </PageShell>
  );
}
