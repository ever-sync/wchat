import { Zap } from "lucide-react";
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
import type { QuickReply } from "@/types/domain";

export function QuickReplyPicker({
  open,
  onOpenChange,
  replies,
  onSelect,
  disabled = false,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  replies: QuickReply[];
  onSelect: (reply: QuickReply) => void;
  disabled?: boolean;
}) {
  const globalReplies = replies.filter((r) => r.scope === "global");
  const privateReplies = replies.filter((r) => r.scope === "private");

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          disabled={disabled}
          title="Respostas rápidas (ou digite /)"
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-0 bg-transparent px-0 text-muted-foreground shadow-none hover:bg-wchat-200 hover:text-foreground disabled:pointer-events-none disabled:opacity-50 ${open ? "bg-wchat-200 text-primary" : ""}`}
        >
          <Zap className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        side="top"
        align="start"
        className="mb-1 w-[360px] rounded-[20px] border-border bg-card p-0 shadow-[0_18px_42px_rgba(0,0,0,0.35)]"
      >
        <Command className="bg-transparent">
          <CommandInput
            placeholder="Buscar resposta..."
            className="border-b border-border text-foreground placeholder:text-muted-foreground"
          />
          <CommandList className="max-h-72">
            <CommandEmpty className="py-4 text-center text-sm text-muted-foreground">
              Nenhuma resposta encontrada.
            </CommandEmpty>

            {globalReplies.length > 0 ? (
              <CommandGroup
                heading="Compartilhadas"
                className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
              >
                {globalReplies.map((reply) => (
                  <QuickReplyItem key={reply.id} reply={reply} onSelect={onSelect} onClose={() => onOpenChange(false)} />
                ))}
              </CommandGroup>
            ) : null}

            {privateReplies.length > 0 ? (
              <CommandGroup
                heading="Minhas"
                className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
              >
                {privateReplies.map((reply) => (
                  <QuickReplyItem key={reply.id} reply={reply} onSelect={onSelect} onClose={() => onOpenChange(false)} />
                ))}
              </CommandGroup>
            ) : null}

            {replies.length === 0 ? (
              <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                Nenhuma resposta cadastrada.
                <br />
                <span className="text-xs">Adicione em Configurações → Respostas Rápidas.</span>
              </div>
            ) : null}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

function QuickReplyItem({
  reply,
  onSelect,
  onClose,
}: {
  reply: QuickReply;
  onSelect: (reply: QuickReply) => void;
  onClose: () => void;
}) {
  return (
    <CommandItem
      value={`${reply.title} ${reply.shortcut ?? ""} ${reply.bodyText}`}
      onSelect={() => {
        onSelect(reply);
        onClose();
      }}
      className="flex cursor-pointer flex-col items-start gap-0.5 rounded-xl px-3 py-2.5 hover:bg-wchat-100 aria-selected:bg-wchat-100"
    >
      <div className="flex w-full items-center gap-2">
        <span className="truncate text-[14px] font-medium text-foreground">{reply.title}</span>
        {reply.shortcut ? (
          <span className="ml-auto shrink-0 rounded-md bg-[#1a2b33] px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
            /{reply.shortcut}
          </span>
        ) : null}
      </div>
      <p className="line-clamp-2 text-[12px] leading-4 text-muted-foreground">{reply.bodyText}</p>
    </CommandItem>
  );
}
