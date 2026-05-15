import { useEffect, useState } from "react";
import { Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { SearchSelectOption } from "./SearchSelect";

export function ProductQuickSelector({
  open,
  onOpenChange,
  selectedHighlightId,
  options,
  productsLoading,
  onSelectProducts,
  onSearchQueryChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Último produto inserido (ícone destacado). */
  selectedHighlightId?: string | null;
  options: SearchSelectOption[];
  productsLoading: boolean;
  onSelectProducts: (ids: string[]) => void;
  onSearchQueryChange?: (query: string) => void;
}) {
  const [selected, setSelected] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    if (!open) {
      setSelected(new Set());
    }
  }, [open]);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function handleInsert() {
    if (selected.size === 0) {
      return;
    }
    onSelectProducts(Array.from(selected));
    setSelected(new Set());
    onOpenChange(false);
  }

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          title="Produtos"
          className={cn(
            "h-10 w-10 shrink-0 justify-center rounded-full border-0 bg-white px-0 text-[#54656f] shadow-none hover:bg-[#f0f2f5] hover:text-[#3d4f5c]",
            selectedHighlightId ? "text-[#6eb3ff]" : "text-current",
          )}
        >
          <Package className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-[320px] rounded-[24px] border-[#e2e8de] p-0 shadow-[0_18px_42px_rgba(84,95,101,0.12)]"
      >
        <Command shouldFilter={false} className="rounded-[24px]">
          <CommandInput
            placeholder="Código, nome ou código de barras..."
            onValueChange={onSearchQueryChange}
          />
          <CommandList className="max-h-[240px]">
            <CommandEmpty>
              {productsLoading ? "Carregando produtos..." : "Nenhum produto encontrado."}
            </CommandEmpty>
            <CommandGroup className="p-1">
              {options.map((option) => {
                const isOn = selected.has(option.id);
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => toggle(option.id)}
                    className={cn(
                      "flex w-full items-start gap-3 rounded-2xl px-3 py-3 text-left transition-colors",
                      "hover:bg-accent/80 focus-visible:bg-accent/80 focus-visible:outline-none",
                    )}
                  >
                    <Checkbox
                      checked={isOn}
                      className="mt-0.5 pointer-events-none"
                      aria-hidden
                    />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-[#334047]">{option.name}</p>
                      <p className="truncate text-xs text-[#86938d]">{option.subtitle}</p>
                    </div>
                  </button>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
        <div className="flex gap-2 border-t border-[#e8ede4] p-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="shrink-0 rounded-xl"
            disabled={selected.size === 0}
            onClick={() => setSelected(new Set())}
          >
            Limpar
          </Button>
          <Button
            type="button"
            size="sm"
            className="min-w-0 flex-1 rounded-xl bg-[#4E1BB1] text-white hover:bg-[#4015A5] disabled:opacity-50"
            disabled={selected.size === 0}
            onClick={handleInsert}
          >
            Inserir{selected.size > 0 ? ` (${selected.size})` : ""}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
