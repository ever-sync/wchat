import { Check } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export type SearchSelectOption = { id: string; name: string; subtitle: string };

export function SearchSelect({
  open,
  onOpenChange,
  value,
  placeholder,
  emptyLabel,
  icon: Icon,
  options,
  onSelect,
  compact = false,
  filterMode = "client",
  onSearchQueryChange,
  searchInputPlaceholder,
  triggerClassName,
  disabled = false,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: string | null;
  placeholder: string;
  emptyLabel: string;
  icon: LucideIcon;
  options: SearchSelectOption[];
  onSelect: (id: string) => void;
  compact?: boolean;
  disabled?: boolean;
  /** `server`: sem filtro local — a lista vem da API conforme o texto digitado. */
  filterMode?: "client" | "server";
  onSearchQueryChange?: (query: string) => void;
  searchInputPlaceholder?: string;
  /** Sobrescreve estilos do trigger (principalmente modo compact no composer). */
  triggerClassName?: string;
}) {
  const selectedOption = options.find((option) => option.id === value) ?? null;

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          title={placeholder}
          className={cn(
            compact
              ? cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-0 bg-white px-0 text-[#54656f] shadow-none hover:bg-[#f0f2f5] hover:text-[#3d4f5c]",
                  triggerClassName,
                )
              : cn(
                  "h-11 min-w-[220px] justify-between rounded-2xl border-[#e2e8de] bg-white px-4 text-[#516066] hover:bg-white",
                  triggerClassName,
                ),
          )}
        >
          {compact ? (
            <Icon className={cn("h-4 w-4", value ? "text-[#6eb3ff]" : "text-current")} />
          ) : (
            <span className="flex min-w-0 items-center gap-2">
              <Icon className="h-4 w-4 shrink-0 text-[#7f8a85]" />
              <span className="truncate">{selectedOption?.name ?? placeholder}</span>
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align={compact ? "start" : "end"}
        className="w-[320px] rounded-[24px] border-[#e2e8de] p-0 shadow-[0_18px_42px_rgba(84,95,101,0.12)]"
      >
        <Command shouldFilter={filterMode === "client"}>
          <CommandInput
            placeholder={searchInputPlaceholder ?? `Buscar ${placeholder.toLowerCase()}`}
            {...(filterMode === "server" && onSearchQueryChange
              ? { onValueChange: onSearchQueryChange }
              : {})}
          />
          <CommandList>
            <CommandEmpty>{emptyLabel}</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.id}
                  value={`${option.id} ${option.name} ${option.subtitle}`}
                  onSelect={() => {
                    onSelect(option.id);
                    onOpenChange(false);
                  }}
                  className="flex items-start gap-3 rounded-2xl px-3 py-3"
                >
                  <Check
                    className={cn(
                      "mt-0.5 h-4 w-4 text-[#4E1BB1]",
                      value === option.id ? "opacity-100" : "opacity-0",
                    )}
                  />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-[#334047]">{option.name}</p>
                    <p className="truncate text-xs text-[#86938d]">{option.subtitle}</p>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
