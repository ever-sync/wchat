import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ProductUpsertInput } from "@/types/domain";

type ProductImportDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rows: ProductUpsertInput[];
  errors: string[];
  fileName: string | null;
  loading?: boolean;
  onConfirm: () => Promise<void> | void;
};

export function ProductImportDialog({
  open,
  onOpenChange,
  rows,
  errors,
  fileName,
  loading = false,
  onConfirm,
}: ProductImportDialogProps) {
  const previewRows = rows.slice(0, 8);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl">
        <DialogHeader>
          <DialogTitle>Importar produtos por planilha</DialogTitle>
          <DialogDescription>
            {fileName ? `Arquivo selecionado: ${fileName}` : "Revise os dados antes de importar."}
            {" "}
            Use o separador ponto e virgula (;) no CSV, como no export do sistema. Colunas obrigatorias:{" "}
            <strong>Codigo</strong> e <strong>Nome do produto</strong>.
          </DialogDescription>
        </DialogHeader>

        {errors.length > 0 && (
          <Alert variant="destructive">
            <AlertTitle>Linhas com problema</AlertTitle>
            <AlertDescription>
              {errors.slice(0, 5).map((error) => (
                <div key={error}>{error}</div>
              ))}
              {errors.length > 5 && <div>...e mais {errors.length - 5} erro(s).</div>}
            </AlertDescription>
          </Alert>
        )}

        <div className="rounded-xl border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Codigo</TableHead>
                <TableHead>Produto</TableHead>
                <TableHead>Estoque</TableHead>
                <TableHead>Compra</TableHead>
                <TableHead>Venda</TableHead>
                <TableHead>Grupo</TableHead>
                <TableHead>Unidade</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {previewRows.map((row, index) => (
                <TableRow key={`${row.codigo}-${index}`}>
                  <TableCell className="font-medium text-foreground">{row.codigo}</TableCell>
                  <TableCell className="text-foreground">{row.nome}</TableCell>
                  <TableCell className="text-muted-foreground">{row.qtdEstoque}</TableCell>
                  <TableCell className="text-muted-foreground">{row.precoCompra}</TableCell>
                  <TableCell className="text-muted-foreground">{row.precoVenda}</TableCell>
                  <TableCell className="text-muted-foreground">{row.grupo}</TableCell>
                  <TableCell className="text-muted-foreground">{row.unidade}</TableCell>
                  <TableCell className="text-muted-foreground">{row.status}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <p className="text-sm text-muted-foreground">
          {rows.length} linha(s) valida(s) pronta(s) para importar.
          {rows.length > previewRows.length ? ` Exibindo apenas as primeiras ${previewRows.length}.` : ""}
        </p>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button
            onClick={async () => {
              await onConfirm();
            }}
            disabled={loading || rows.length === 0}
            className="bg-accent text-accent-foreground hover:bg-accent/90"
          >
            {loading ? "Importando..." : "Confirmar importacao"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
