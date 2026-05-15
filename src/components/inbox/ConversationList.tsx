import { Search, SquarePen, Tag, X } from "lucide-react";
import type { RefObject } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  availableTags: ChatTag[];
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
  availableTags,
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
  const activeTagCount = selectedTagIds.length;

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

          <div className="grid grid-cols-3 gap-2">
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

            {availableTags.length > 0 ? (
              <div className="relative">
                <Select
                  value=""
                  onValueChange={(tagId) => onTagToggle(tagId)}
                >
                  <SelectTrigger className="h-9 rounded-lg border-0 bg-wchat-50 text-xs text-foreground focus:ring-primary">
                    <Tag className="mr-1.5 h-3 w-3 shrink-0" />
                    <span>
                      {activeTagCount > 0 ? `${activeTagCount} etiq.` : "Etiquetas"}
                    </span>
                  </SelectTrigger>
                  <SelectContent className="border-border bg-card text-foreground">
                    {availableTags.map((tag) => (
                      <SelectItem key={tag.id} value={tag.id}>
                        <span className="flex items-center gap-2">
                          <span
                            className="inline-block h-2 w-2 rounded-full"
                            style={{ backgroundColor: tag.color }}
                          />
                          {tag.name}
                          {selectedTagIds.includes(tag.id) ? " ✓" : ""}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}
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
