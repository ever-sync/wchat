import { type ReactNode, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function parseCurrencyInput(value: string): number {
  const digits = value.replace(/\D/g, "");
  return Number(digits || 0) / 100;
}

function formatCurrencyInput(value: number): string {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

type MarkWinDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialValue?: number;
  onConfirm: (totalValue: number) => void | Promise<void>;
  pending?: boolean;
  /** Conteudo extra entre o campo e os botoes (ex.: link para outro fluxo). */
  footerExtra?: ReactNode;
};

export function MarkWinDialog({
  open,
  onOpenChange,
  initialValue = 0,
  onConfirm,
  pending,
  footerExtra,
}: MarkWinDialogProps) {
  const [valueText, setValueText] = useState("");

  useEffect(() => {
    if (open) {
      setValueText(initialValue > 0 ? formatCurrencyInput(initialValue) : "");
    }
  }, [open, initialValue]);

  const totalValue = parseCurrencyInput(valueText);
  const isValid = totalValue > 0;

  const handleConfirm = () => {
    if (!isValid) {
      return;
    }
    void Promise.resolve(onConfirm(totalValue)).then(() => {
      setValueText("");
      onOpenChange(false);
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          setValueText("");
        }
        onOpenChange(next);
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Marcar como venda</DialogTitle>
          <DialogDescription>
            Informe o valor da venda para concluir o negócio e avançar para a etapa de venda.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-1.5">
          <Label htmlFor="sale-value">Valor da venda</Label>
          <Input
            id="sale-value"
            inputMode="numeric"
            value={valueText}
            onChange={(e) => setValueText(e.target.value)}
            placeholder="R$ 0,00"
            className="border-[#ced4da]"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleConfirm();
              }
            }}
          />
          {valueText && !isValid ? (
            <p className="text-xs text-destructive">Informe um valor maior que zero.</p>
          ) : null}
        </div>
        {footerExtra ? (
          <div className="border-t border-border/60 pt-3 text-muted-foreground">{footerExtra}</div>
        ) : null}
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            type="button"
            className="bg-emerald-600 text-white hover:bg-emerald-700"
            data-testid="crm-mark-win-confirm"
            disabled={!isValid || pending}
            onClick={handleConfirm}
          >
            Confirmar venda
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
