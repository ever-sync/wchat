import { Plus, X } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useAddTagToChat,
  useChatTags,
  useCreateChatTag,
  useRemoveTagFromChat,
} from "@/lib/api/chat-tags";
import { CHAT_TAG_COLOR_PRESETS, DEFAULT_CHAT_TAG_COLOR } from "@/lib/chat-tag-colors";
import { cn } from "@/lib/utils";
import type { ChatTagOnChat } from "@/types/domain";
import { useToast } from "@/hooks/use-toast";

type ChatTagsPickerProps = {
  chatId: string;
  tags: ChatTagOnChat[];
  disabled?: boolean;
};

export function ChatTagsPicker({ chatId, tags, disabled = false }: ChatTagsPickerProps) {
  const { toast } = useToast();
  const { data: catalog = [], isLoading: catalogLoading } = useChatTags();
  const createTag = useCreateChatTag();
  const addTag = useAddTagToChat();
  const removeTag = useRemoveTagFromChat();

  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState<string>(DEFAULT_CHAT_TAG_COLOR);

  const appliedIds = useMemo(() => new Set(tags.map((t) => t.tagId)), [tags]);

  const addable = useMemo(
    () => catalog.filter((t) => !appliedIds.has(t.id)),
    [appliedIds, catalog],
  );

  const isBusy = disabled || createTag.isPending || addTag.isPending || removeTag.isPending;

  const applyExisting = async (tagId: string) => {
    try {
      await addTag.mutateAsync({ chatId, tagId });
    } catch (e) {
      toast({
        title: "Erro ao aplicar etiqueta",
        description: e instanceof Error ? e.message : "Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const createAndApply = async () => {
    const name = newName.trim();
    if (name.length < 2) {
      toast({
        title: "Nome muito curto",
        description: "Use pelo menos 2 caracteres para a etiqueta.",
        variant: "destructive",
      });
      return;
    }

    try {
      const existing = catalog.find((t) => t.name.toLowerCase() === name.toLowerCase());
      const tagId = existing
        ? existing.id
        : (
            await createTag.mutateAsync({
              name,
              color: newColor,
              scope: "global",
            })
          ).id;

      if (!appliedIds.has(tagId)) {
        await addTag.mutateAsync({ chatId, tagId });
      }
      setNewName("");
      setNewColor(DEFAULT_CHAT_TAG_COLOR);
    } catch (e) {
      toast({
        title: "Erro ao criar etiqueta",
        description: e instanceof Error ? e.message : "Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const removeApplied = async (tagId: string) => {
    try {
      await removeTag.mutateAsync({ chatId, tagId });
    } catch (e) {
      toast({
        title: "Erro ao remover etiqueta",
        description: e instanceof Error ? e.message : "Tente novamente.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="rounded-[20px] border border-[var(--inbox-border)] bg-card/90 p-4 shadow-sm">
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--inbox-muted-2)]">Etiquetas</p>
      <div className="mt-2 flex min-h-[36px] flex-wrap gap-2">
        {tags.map((t) => (
          <span
            key={t.tagId}
            className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium"
            style={{ backgroundColor: `${t.color}33`, color: t.color }}
          >
            {t.name}
            <button
              type="button"
              className="rounded-full p-0.5 opacity-80 hover:opacity-100"
              style={{ backgroundColor: `${t.color}44` }}
              aria-label={`Remover etiqueta ${t.name}`}
              disabled={isBusy}
              onClick={() => void removeApplied(t.tagId)}
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        {tags.length === 0 ? (
          <span className="text-sm text-[var(--inbox-muted-2)]">Nenhuma etiqueta.</span>
        ) : null}
      </div>

      <div className="mt-3 space-y-3">
        <div className="space-y-2">
          <Label className="text-xs text-[var(--inbox-muted)]">Adicionar etiqueta já usada na base</Label>
          {catalogLoading ? (
            <p className="text-xs text-[var(--inbox-muted-2)]">Carregando catálogo…</p>
          ) : addable.length === 0 ? (
            <p className="text-xs text-[var(--inbox-muted-2)]">
              Nenhuma outra etiqueta disponível além das já aplicadas.
            </p>
          ) : (
            <Select disabled={isBusy} onValueChange={(tagId) => void applyExisting(tagId)}>
              <SelectTrigger className="h-9 rounded-xl border-[var(--inbox-border)] bg-card">
                <SelectValue placeholder="Escolher etiqueta…" />
              </SelectTrigger>
              <SelectContent>
                {addable.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    <span className="flex items-center gap-2">
                      <span
                        className="inline-block h-2 w-2 rounded-full"
                        style={{ backgroundColor: t.color }}
                      />
                      {t.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        <div className="space-y-2 border-t border-[var(--inbox-border)] pt-3">
          <Label className="text-xs text-[var(--inbox-muted)]">Criar etiqueta nova</Label>
          <div className="flex gap-2">
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Nome da etiqueta"
              className="h-9 flex-1 rounded-xl border-[var(--inbox-border)] bg-card"
              disabled={isBusy}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void createAndApply();
                }
              }}
            />
            <Button
              type="button"
              size="icon"
              variant="secondary"
              className="h-9 w-9 shrink-0 rounded-xl"
              disabled={!newName.trim() || isBusy}
              aria-label="Criar e aplicar etiqueta"
              onClick={() => void createAndApply()}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {CHAT_TAG_COLOR_PRESETS.map((color) => (
              <button
                key={color}
                type="button"
                disabled={isBusy}
                aria-label={`Cor ${color}`}
                className={cn(
                  "h-7 w-7 rounded-full border-2 transition-transform hover:scale-105",
                  newColor === color ? "border-[var(--crm-brand)] ring-2 ring-[var(--crm-brand)]/30" : "border-card shadow-sm",
                )}
                style={{ backgroundColor: color }}
                onClick={() => setNewColor(color)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
