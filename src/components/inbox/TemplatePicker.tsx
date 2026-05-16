import { LayoutTemplate } from "lucide-react";
import { INBOX_TEMPLATE_OPTIONS } from "./inboxComposerOptions";
import { SearchSelect } from "./SearchSelect";

const TEMPLATE_OPTIONS = INBOX_TEMPLATE_OPTIONS.map(({ id, name, subtitle }) => ({ id, name, subtitle }));

export function TemplatePicker({
  open,
  onOpenChange,
  value,
  onSelect,
  disabled = false,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: string | null;
  onSelect: (id: string) => void;
  disabled?: boolean;
}) {
  return (
    <SearchSelect
      open={open}
      onOpenChange={onOpenChange}
      value={value}
      placeholder="Templates"
      emptyLabel="Nenhum template encontrado."
      icon={LayoutTemplate}
      options={TEMPLATE_OPTIONS}
      onSelect={onSelect}
      compact
      disabled={disabled}
    />
  );
}
