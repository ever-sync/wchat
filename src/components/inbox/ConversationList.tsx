import { ChevronDown, Search, SquarePen, Tag, X } from "lucide-react";
import { useState, type RefObject } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { ChatTag, InboxChat, WhatsappInstance } from "@/types/domain";
import { ConversationRow } from "./ConversationRow";

export type ConversationListProps = {
  search: string;
  onSearchChange: (value: string) => void;
  instanceId: string;
  onInstanceChange: (value: string) => void;
  status: InboxChat["status"] | "all";
  onStatusChange: (value: InboxChat["status"] | "all") => void;
  assigneeFilter: string;
  onAssigneeFilterChange: (value: string) => void;
  snoozedFilter: "active" | "snoozed";
  onSnoozedFilterChange: (value: "active" | "snoozed") => void;
  selectedTagIds: string[];
  onTagToggle: (tagId: string) => void;
  onClearTags: () => void;
  availableTags: ChatTag[];
  tagsLoading?: boolean;
  instances: WhatsappInstance[];
  chatsLoading: boolean;
  chats: InboxChat[];
  pinnedChats: InboxChat[];
  regularChats: InboxChat[];
  activeChatId: string | null;
  onSelectChat: (chatId: string) => void;
  onPrefetchChat: (chatId: string) => void;
  /** @deprecated Navegação ficou no rail estilo WhatsApp; mantido por compatibilidade. */
  showPainelExit?: boolean;
  searchInputRef?: RefObject<HTMLInputElement>;
};

export function ConversationList({
  search,
  onSearchChange,
  instanceId,
  onInstanceChange,
  status,
  onStatusChange,
  assigneeFilter,
  onAssigneeFilterChange,
  snoozedFilter,
  onSnoozedFilterChange,
  selectedTagIds,
  onTagToggle,
  onClearTags,
  availableTags,
  tagsLoading = false,
  instances,
  chatsLoading,
  chats,
  pinnedChats,
  regularChats,
  activeChatId,
  onSelectChat,
  onPrefetchChat,
  searchInputRef,
}: ConversationListProps) {
  const [tagsPopoverOpen, setTagsPopoverOpen] = useState(false);
  const activeTagCount = selectedTagIds.length;
  const tagFilterLabel =
    activeTagCount > 0
      ? `${activeTagCount} etiqueta${activeTagCount > 1 ? "s" : ""}`
      : "Etiquetas";

  return (
    <aside className="flex min-h-0 min-w-0 max-w-full flex-col overflow-hidden border-r border-border bg-card md:max-w-[420px]">
      <div className="shrink-0 border-b border-border px-3 pb-2 pt-3">
        <div className="flex items-center justify-between gap-2 px-1">
          <h1 className="truncate text-[22px] font-semibold text-foreground">Conversas</h1>
          <button
            type="button"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-wchat-100 hover:text-foreground"
            aria-label="Nova conversa"
          >
            <SquarePen className="h-5 w-5" strokeWidth={1.75} />
          </button>
        </div>

        <div className="mt-3 space-y-2.5">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              ref={searchInputRef}
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Pesquisar"
              className="h-10 rounded-lg border-0 bg-wchat-50 pl-10 text-sm text-foreground shadow-none placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-primary"
            />
          </div>

          <div className="grid grid-cols-[minmax(0,1fr)_100px] gap-2">
            <Select value={instanceId} onValueChange={onInstanceChange}>
              <SelectTrigger className="h-9 rounded-lg border-0 bg-wchat-50 text-xs text-foreground focus:ring-primary">
                <SelectValue placeholder="Instancia" />
              </SelectTrigger>
              <SelectContent className="border-border bg-card text-foreground">
                <SelectItem value="all">Todas as instancias</SelectItem>
                {instances.map((instance) => (
                  <SelectItem key={instance.id} value={instance.id}>
                    {instance.displayName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={status} onValueChange={(value) => onStatusChange(value as InboxChat["status"] | "all")}>
              <SelectTrigger className="h-9 rounded-lg border-0 bg-wchat-50 text-xs text-foreground focus:ring-primary">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="border-border bg-card text-foreground">
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="open">Abertas</SelectItem>
                <SelectItem value="closed">Fechadas</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Select
              value={snoozedFilter}
              onValueChange={(value) => onSnoozedFilterChange(value as "active" | "snoozed")}
            >
              <SelectTrigger className="h-9 rounded-lg border-0 bg-wchat-50 text-xs text-foreground focus:ring-primary">
                <SelectValue placeholder="Fila" />
              </SelectTrigger>
              <SelectContent className="border-border bg-card text-foreground">
                <SelectItem value="active">Ativas</SelectItem>
                <SelectItem value="snoozed">Adiadas</SelectItem>
              </SelectContent>
            </Select>

            <Select value={assigneeFilter} onValueChange={onAssigneeFilterChange}>
              <SelectTrigger className="h-9 rounded-lg border-0 bg-wchat-50 text-xs text-foreground focus:ring-primary">
                <SelectValue placeholder="Responsável" />
              </SelectTrigger>
              <SelectContent className="border-border bg-card text-foreground">
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="mine">Meus</SelectItem>
                <SelectItem value="unassigned">Sem responsável</SelectItem>
              </SelectContent>
            </Select>

          </div>

          <Popover open={tagsPopoverOpen} onOpenChange={setTagsPopoverOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                className={cn(
                  "flex h-9 w-full items-center justify-between gap-2 rounded-lg bg-wchat-50 px-3 text-xs text-foreground transition-colors hover:bg-wchat-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary",
                  activeTagCount > 0 && "ring-1 ring-primary/35",
                )}
                aria-label="Filtrar por etiquetas"
              >
                <span className="flex min-w-0 items-center gap-1.5 truncate">
                  <Tag className="h-3 w-3 shrink-0 text-muted-foreground" />
                  {tagFilterLabel}
                </span>
                <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              </button>
            </PopoverTrigger>
            <PopoverContent
              align="start"
              className="w-[var(--radix-popover-trigger-width)] border-border bg-card p-1.5 text-foreground"
            >
              {tagsLoading ? (
                <p className="px-2 py-3 text-center text-xs text-muted-foreground">Carregando etiquetas...</p>
              ) : availableTags.length === 0 ? (
                <p className="px-2 py-3 text-center text-xs text-muted-foreground">
                  Nenhuma etiqueta cadastrada ainda.
                </p>
              ) : (
                <>
                  <div className="max-h-52 space-y-0.5 overflow-y-auto overscroll-y-contain">
                    {availableTags.map((tag) => {
                      const checked = selectedTagIds.includes(tag.id);
                      return (
                        <label
                          key={tag.id}
                          className="flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-2 text-xs hover:bg-wchat-50"
                        >
                          <Checkbox
                            checked={checked}
                            onCheckedChange={() => onTagToggle(tag.id)}
                            aria-label={tag.name}
                          />
                          <span
                            className="inline-block h-2 w-2 shrink-0 rounded-full"
                            style={{ backgroundColor: tag.color }}
                          />
                          <span className="min-w-0 flex-1 truncate font-medium">{tag.name}</span>
                        </label>
                      );
                    })}
                  </div>
                  {activeTagCount > 0 ? (
                    <button
                      type="button"
                      onClick={() => {
                        onClearTags();
                        setTagsPopoverOpen(false);
                      }}
                      className="mt-1 w-full rounded-md px-2 py-2 text-center text-xs font-medium text-primary hover:bg-wchat-50"
                    >
                      Limpar filtro
                    </button>
                  ) : null}
                </>
              )}
            </PopoverContent>
          </Popover>

          {selectedTagIds.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {selectedTagIds.map((tagId) => {
                const tag = availableTags.find((t) => t.id === tagId);
                if (!tag) return null;
                return (
                  <button
                    key={tagId}
                    type="button"
                    onClick={() => onTagToggle(tagId)}
                    className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium"
                    style={{ backgroundColor: `${tag.color}33`, color: tag.color }}
                  >
                    {tag.name}
                    <X className="h-2.5 w-2.5" />
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-y-contain scrollbar-hide">
        <div className="min-w-0 max-w-full space-y-4 px-2 py-2">
          {chatsLoading ? (
            <div className="rounded-lg bg-wchat-50 px-3 py-6 text-center text-sm text-muted-foreground">Carregando conversas...</div>
          ) : chats.length === 0 ? (
            <div className="rounded-lg bg-wchat-50 px-3 py-6 text-center text-sm text-muted-foreground">Nenhuma conversa encontrada.</div>
          ) : (
            <>
              {pinnedChats.length > 0 ? (
                <section>
                  <div className="mb-2 flex items-center gap-2 px-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    <span className="h-1 w-1 rounded-full bg-primary" />
                    Fixadas
                  </div>
                  <div className="space-y-0.5">
                    {pinnedChats.map((chat) => (
                      <ConversationRow
                        key={chat.id}
                        chat={chat}
                        active={activeChatId === chat.id}
                        onClick={() => onSelectChat(chat.id)}
                        onPointerEnter={() => onPrefetchChat(chat.id)}
                      />
                    ))}
                  </div>
                </section>
              ) : null}

              <section>
                <div className="mb-2 flex items-center justify-between px-2">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Todas</p>
                  <span className="text-[11px] text-muted-foreground">{chats.length}</span>
                </div>
                <div className="space-y-0.5">
                  {regularChats.map((chat) => (
                    <ConversationRow
                      key={chat.id}
                      chat={chat}
                      active={activeChatId === chat.id}
                      onClick={() => onSelectChat(chat.id)}
                      onPointerEnter={() => onPrefetchChat(chat.id)}
                    />
                  ))}
                </div>
              </section>
            </>
          )}
        </div>
      </div>
    </aside>
  );
}
