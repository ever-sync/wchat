import { ChevronDown, ListFilter, Search, Smartphone, SquarePen, Tag, X } from "lucide-react";
import { useRef, useState, type RefObject } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { INBOX_QUICK_FILTER_OPTIONS, inboxQuickFilterLabel } from "@/lib/inbox-quick-filters";
import type { ChatTag, InboxChat, InboxListScope, InboxQuickFilter, UserRole, WhatsappInstance } from "@/types/domain";
import { ConversationRow } from "./ConversationRow";

export type ConversationListProps = {
  search: string;
  onSearchChange: (value: string) => void;
  instanceId: string;
  onInstanceChange: (value: string) => void;
  /** Alinhado aos estados do seletor de resolução no cabeçalho do chat (InboxListScope). */
  listScope: InboxListScope;
  onListScopeChange: (value: InboxListScope) => void;
  assigneeFilter: string;
  onAssigneeFilterChange: (value: string) => void;
  snoozedFilter: "active" | "snoozed";
  onSnoozedFilterChange: (value: "active" | "snoozed") => void;
  quickFilter: InboxQuickFilter | null;
  onQuickFilterChange: (value: InboxQuickFilter | null) => void;
  selectedTagIds: string[];
  onTagToggle: (tagId: string) => void;
  onClearTags: () => void;
  availableTags: ChatTag[];
  tagsLoading?: boolean;
  instances: WhatsappInstance[];
  chatsLoading: boolean;
  chats: InboxChat[];
  activeChatId: string | null;
  onSelectChat: (chatId: string) => void;
  onPrefetchChat: (chatId: string) => void;
  /** Papel do usuário logado: repassado às linhas para ocultar preview de chats do pool. */
  viewerRole?: UserRole;
  /** @deprecated Navegação ficou no rail estilo WhatsApp; mantido por compatibilidade. */
  showPainelExit?: boolean;
  searchInputRef?: RefObject<HTMLInputElement>;
  /** Gestor: filtra inbox por atendente específico. */
  assigneeFilterOptions?: ReadonlyArray<{ id: string; name: string }>;
  /** Gestor: atalho para fila sem responsável. */
  managerUnassignedCount?: number;
  onOpenUnassignedQueue?: () => void;
};

type FilterSelectsProps = {
  listScope: InboxListScope;
  onListScopeChange: (value: InboxListScope) => void;
  snoozedFilter: "active" | "snoozed";
  onSnoozedFilterChange: (value: "active" | "snoozed") => void;
  assigneeFilter: string;
  onAssigneeFilterChange: (value: string) => void;
  assigneeFilterOptions?: ReadonlyArray<{ id: string; name: string }>;
};

function ConversationFilterSelects({
  listScope,
  onListScopeChange,
  snoozedFilter,
  onSnoozedFilterChange,
  assigneeFilter,
  onAssigneeFilterChange,
  assigneeFilterOptions,
}: FilterSelectsProps) {
  return (
    <>
      <Select
        value={listScope}
        onValueChange={(value) => onListScopeChange(value as InboxListScope)}
      >
        <SelectTrigger className="h-9 rounded-lg border-0 bg-wchat-50 text-xs text-foreground focus:ring-primary">
          <SelectValue placeholder="Situacao" />
        </SelectTrigger>
        <SelectContent className="border-border bg-card text-foreground">
          <SelectItem value="all">Todas</SelectItem>
          <SelectItem value="open">Em aberto</SelectItem>
          <SelectItem value="closed">Encerradas</SelectItem>
          <SelectItem value="resolved">Resolvida</SelectItem>
          <SelectItem value="lost">Perdidas</SelectItem>
        </SelectContent>
      </Select>

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
            {assigneeFilterOptions?.map((user) => (
              <SelectItem key={user.id} value={user.id}>
                {user.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </>
  );
}

type TagFilterListProps = {
  tagsLoading: boolean;
  availableTags: ChatTag[];
  selectedTagIds: string[];
  onTagToggle: (tagId: string) => void;
  onClearTags: () => void;
  onAfterClear?: () => void;
};

function ConversationTagFilterList({
  tagsLoading,
  availableTags,
  selectedTagIds,
  onTagToggle,
  onClearTags,
  onAfterClear,
}: TagFilterListProps) {
  const activeTagCount = selectedTagIds.length;

  if (tagsLoading) {
    return <p className="px-1 py-3 text-center text-xs text-muted-foreground">Carregando etiquetas...</p>;
  }
  if (availableTags.length === 0) {
    return (
      <p className="px-1 py-3 text-center text-xs text-muted-foreground">Nenhuma etiqueta cadastrada ainda.</p>
    );
  }

  return (
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
            onAfterClear?.();
          }}
          className="mt-1 w-full rounded-md px-2 py-2 text-center text-xs font-medium text-primary hover:bg-wchat-50"
        >
          Limpar filtro
        </button>
      ) : null}
    </>
  );
}

export function ConversationList({
  search,
  onSearchChange,
  instanceId,
  onInstanceChange,
  listScope,
  onListScopeChange,
  assigneeFilter,
  onAssigneeFilterChange,
  snoozedFilter,
  onSnoozedFilterChange,
  quickFilter,
  onQuickFilterChange,
  selectedTagIds,
  onTagToggle,
  onClearTags,
  availableTags,
  tagsLoading = false,
  instances,
  chatsLoading,
  chats,
  activeChatId,
  onSelectChat,
  onPrefetchChat,
  viewerRole,
  searchInputRef,
  assigneeFilterOptions,
  managerUnassignedCount,
  onOpenUnassignedQueue,
}: ConversationListProps) {
  const [tagsPopoverOpen, setTagsPopoverOpen] = useState(false);
  const [filtersPanelOpen, setFiltersPanelOpen] = useState(false);
  const activeTagCount = selectedTagIds.length;
  const tagFilterLabel =
    activeTagCount > 0
      ? `${activeTagCount} etiqueta${activeTagCount > 1 ? "s" : ""}`
      : "Etiquetas";

  const listHeading = inboxQuickFilterLabel(quickFilter);

  const hasCustomFilters =
    instanceId !== "all" ||
    listScope !== "open" ||
    assigneeFilter !== "all" ||
    snoozedFilter !== "active" ||
    quickFilter !== null ||
    activeTagCount > 0;

  const scrollRef = useRef<HTMLDivElement>(null);
  const rowVirtualizer = useVirtualizer({
    count: chats.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => 64,
    getItemKey: (index) => chats[index]?.id ?? index,
    overscan: 8,
  });

  return (
    <aside className="flex h-full min-h-0 min-w-0 w-full max-w-full flex-col overflow-hidden border-r border-border bg-card md:max-w-[336px] lg:max-w-none">
      <div className="shrink-0 border-b border-border px-2.5 pb-1.5 pt-2.5">
        <div className="flex items-center justify-between gap-1.5 px-0.5">
          <h1 className="truncate text-lg font-semibold leading-tight text-foreground">Conversas</h1>
          <div className="flex shrink-0 items-center gap-0.5">
            <Popover open={filtersPanelOpen} onOpenChange={setFiltersPanelOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-wchat-100 hover:text-foreground"
                  aria-label="Filtros"
                >
                  <ListFilter className="h-[18px] w-[18px]" strokeWidth={1.75} aria-hidden />
                  {hasCustomFilters ? (
                    <span
                      className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-primary shadow-sm ring-2 ring-card"
                      aria-hidden
                    />
                  ) : null}
                </button>
              </PopoverTrigger>
              <PopoverContent
                align="end"
                sideOffset={6}
                className="w-[min(calc(100vw-1.5rem),20rem)] border-border bg-card p-3 text-foreground"
              >
                <p className="mb-2 text-sm font-semibold tracking-tight">Filtros</p>
                <div className="space-y-2.5">
                  <ConversationFilterSelects
                    listScope={listScope}
                    onListScopeChange={onListScopeChange}
                    snoozedFilter={snoozedFilter}
                    onSnoozedFilterChange={onSnoozedFilterChange}
                    assigneeFilter={assigneeFilter}
                    onAssigneeFilterChange={onAssigneeFilterChange}
                    assigneeFilterOptions={assigneeFilterOptions}
                  />
                  <div className="border-t border-border pt-2.5">
                    <p className="mb-2 text-xs font-medium text-muted-foreground">Etiquetas</p>
                    <ConversationTagFilterList
                      tagsLoading={tagsLoading}
                      availableTags={availableTags}
                      selectedTagIds={selectedTagIds}
                      onTagToggle={onTagToggle}
                      onClearTags={onClearTags}
                      onAfterClear={() => setFiltersPanelOpen(false)}
                    />
                  </div>
                </div>
              </PopoverContent>
            </Popover>
            <button
              type="button"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-wchat-100 hover:text-foreground"
              aria-label="Nova conversa"
            >
              <SquarePen className="h-[18px] w-[18px]" strokeWidth={1.75} />
            </button>
          </div>
        </div>

        {managerUnassignedCount != null && managerUnassignedCount > 0 && onOpenUnassignedQueue ? (
          <button
            type="button"
            data-testid="inbox-manager-queue"
            onClick={onOpenUnassignedQueue}
            className="mt-2 flex w-full items-center justify-between rounded-lg border border-[var(--crm-amber-border)] bg-[var(--crm-amber-tint)] px-2.5 py-2 text-left text-xs font-medium text-[var(--crm-amber-ink)] transition-colors hover:bg-[var(--crm-amber-tint)]"
          >
            <span>Fila: {managerUnassignedCount} sem responsável</span>
            <span className="text-[10px] font-semibold uppercase tracking-wide text-[var(--crm-amber-ink)]">Ver</span>
          </button>
        ) : null}

        <div className="mt-2 space-y-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              ref={searchInputRef}
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Pesquisar"
              className="h-9 rounded-lg border-0 bg-wchat-50 pl-9 text-[13px] text-foreground shadow-none placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-primary"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <Select value={instanceId} onValueChange={onInstanceChange}>
              <SelectTrigger
                aria-label="Filtrar por instância"
                className={cn(
                  "h-8 flex-1 min-w-0 rounded-lg border-0 bg-wchat-50 px-2.5 text-[11px] text-foreground shadow-none focus:ring-1 focus:ring-primary [&>svg]:h-3.5 [&>svg]:w-3.5 [&>svg]:opacity-100 [&>svg]:text-muted-foreground",
                  instanceId !== "all" && "ring-1 ring-primary/35",
                )}
              >
                <span className="flex min-w-0 items-center gap-1.5 truncate">
                  <Smartphone className="h-3 w-3 shrink-0 text-muted-foreground" />
                  <SelectValue placeholder="Instância" />
                </span>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as instâncias</SelectItem>
                {instances.map((instance) => (
                  <SelectItem key={instance.id} value={instance.id}>
                    {instance.displayName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Popover open={tagsPopoverOpen} onOpenChange={setTagsPopoverOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className={cn(
                    "flex h-8 flex-1 min-w-0 items-center justify-between gap-2 rounded-lg bg-wchat-50 px-2.5 text-[11px] text-foreground transition-colors hover:bg-wchat-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary",
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
                <ConversationTagFilterList
                  tagsLoading={tagsLoading}
                  availableTags={availableTags}
                  selectedTagIds={selectedTagIds}
                  onTagToggle={onTagToggle}
                  onClearTags={onClearTags}
                  onAfterClear={() => setTagsPopoverOpen(false)}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div
            className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-hide"
            role="tablist"
            aria-label="Filtros rápidos de conversas"
          >
            {INBOX_QUICK_FILTER_OPTIONS.map(({ id, label }) => {
              const active = quickFilter === id;
              return (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => onQuickFilterChange(active ? null : id)}
                  className={cn(
                    "shrink-0 rounded-full px-3 py-1 text-[11px] font-medium transition-colors",
                    active
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-wchat-50 text-muted-foreground hover:bg-wchat-100 hover:text-foreground",
                  )}
                >
                  {label}
                </button>
              );
            })}
          </div>

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

      {chatsLoading ? (
        <div className="min-h-0 flex-1 overflow-y-auto px-1.5 py-1.5 scrollbar-hide">
          <div className="rounded-lg bg-wchat-50 px-3 py-6 text-center text-sm text-muted-foreground">
            Carregando conversas...
          </div>
        </div>
      ) : chats.length === 0 ? (
        <div className="min-h-0 flex-1 overflow-y-auto px-1.5 py-1.5 scrollbar-hide">
          <div className="rounded-lg bg-wchat-50 px-3 py-6 text-center text-sm text-muted-foreground">
            Nenhuma conversa encontrada.
          </div>
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="flex shrink-0 items-center justify-between px-3.5 pb-1 pt-1.5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              {listHeading}
            </p>
            <span className="text-[11px] tabular-nums text-muted-foreground">{chats.length}</span>
          </div>
          <div
            ref={scrollRef}
            className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-y-contain px-1.5 pb-1.5 scrollbar-hide"
          >
            {/* Virtualizado: só renderiza as linhas visíveis (+overscan). */}
            <div className="relative w-full" style={{ height: rowVirtualizer.getTotalSize() }}>
              {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                const chat = chats[virtualRow.index];
                return (
                  <div
                    key={virtualRow.key}
                    data-index={virtualRow.index}
                    ref={rowVirtualizer.measureElement}
                    className="absolute left-0 top-0 w-full pb-0.5"
                    style={{ transform: `translateY(${virtualRow.start}px)` }}
                  >
                    <ConversationRow
                      chat={chat}
                      active={activeChatId === chat.id}
                      onSelect={onSelectChat}
                      onPrefetch={onPrefetchChat}
                      viewerRole={viewerRole}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
