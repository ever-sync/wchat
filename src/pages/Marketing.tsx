import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { ChevronDown, Megaphone, Send, Shuffle, Workflow } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MarketingAutomations } from "@/components/marketing/MarketingAutomations";
import { MarketingFormsTab } from "@/components/marketing/forms/MarketingFormsTab";
import { cn } from "@/lib/utils";

const CONVERTER_SUB_TABS = [
  { value: "landing-pages", label: "Landing Pages" },
  { value: "formularios", label: "Formulários" },
  { value: "botoes-whatsapp", label: "Botões de WhatsApp" },
  { value: "link-na-bio", label: "Link na Bio" },
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
            "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
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
            className="flex items-center gap-3 py-2 text-sm font-semibold"
          >
            <span>{item.label}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
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
    <div className="flex h-full flex-col gap-6 p-4 md:p-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Megaphone className="h-5 w-5" aria-hidden />
        </div>
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Marketing</h1>
          <p className="text-sm text-muted-foreground">
            Campanhas e automações de relacionamento.
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="flex flex-col gap-4">
        <TabsList className="w-full justify-start sm:w-auto">
          <TabsTrigger value="campanhas" className="gap-2">
            <Send className="h-4 w-4" aria-hidden />
            Campanhas
          </TabsTrigger>
          <TabsTrigger value="automacoes" className="gap-2">
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
          <Card>
            <CardHeader>
              <CardTitle>Campanhas</CardTitle>
              <CardDescription>
                Disparos em massa e segmentação de contatos.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Em breve: criação, agendamento e acompanhamento de campanhas.
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="automacoes" className="mt-0">
          <MarketingAutomations />
        </TabsContent>

        {CONVERTER_SUB_TABS.map((item) => (
          <TabsContent key={item.value} value={item.value} className="mt-0">
            {item.value === "formularios" ? (
              <MarketingFormsTab />
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>{item.label}</CardTitle>
                  <CardDescription>
                    Conversor de leads — {item.label.toLowerCase()}.
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  Em breve.
                </CardContent>
              </Card>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
