import { useRef, useState } from "react";
import { Download, FileText, Paperclip, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import {
  CRM_NEGOTIATION_DOC_MAX_BYTES,
  getCrmNegotiationDocumentSignedUrl,
  useCreateCrmNegotiationDocument,
  useCrmNegotiationDocuments,
  useDeleteCrmNegotiationDocument,
} from "@/lib/api/crm-negotiation-documents";
import { cn } from "@/lib/utils";
import type { CrmNegotiationDocument } from "@/types/domain";

const BRAND_ACCENT = "#5B2FD4";
const RD_RADIUS = "10px";
const RD_CARD_SHADOW = "0 1px 3px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.04)";

function formatDocSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDocDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    return "";
  }
  return d.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

export function CrmNegotiationDocumentsSection({
  negotiationId,
  enabled,
}: {
  negotiationId: string;
  enabled: boolean;
}) {
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [displayName, setDisplayName] = useState("");
  const [pickedFile, setPickedFile] = useState<File | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CrmNegotiationDocument | null>(null);

  const { data: docs = [], isLoading } = useCrmNegotiationDocuments(negotiationId, { enabled });

  const createDoc = useCreateCrmNegotiationDocument();
  const deleteDoc = useDeleteCrmNegotiationDocument();

  const busy = createDoc.isPending || deleteDoc.isPending;

  const onPickFile = () => fileRef.current?.click();

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    e.target.value = "";
    if (!file) {
      setPickedFile(null);
      return;
    }
    if (file.size > CRM_NEGOTIATION_DOC_MAX_BYTES) {
      toast({
        title: "Arquivo grande",
        description: `Tamanho máximo: ${CRM_NEGOTIATION_DOC_MAX_BYTES / (1024 * 1024)} MB.`,
        variant: "destructive",
      });
      setPickedFile(null);
      return;
    }
    setPickedFile(file);
    setDisplayName((prev) => {
      if (prev.trim()) {
        return prev;
      }
      return file.name.replace(/\.[^.]+$/, "") || file.name;
    });
  };

  const handleAttach = () => {
    if (!pickedFile) {
      toast({
        title: "Selecione um arquivo",
        description: "Escolha o documento antes de anexar.",
        variant: "destructive",
      });
      return;
    }
    const name = displayName.trim();
    if (!name) {
      toast({
        title: "Nome obrigatório",
        description: "Informe como este documento deve aparecer.",
        variant: "destructive",
      });
      return;
    }

    void (async () => {
      try {
        await createDoc.mutateAsync({
          negotiationId,
          displayName: name,
          file: pickedFile,
        });
        setDisplayName("");
        setPickedFile(null);
        toast({ title: "Documento anexado", description: "O arquivo foi salvo neste lead." });
      } catch (err) {
        toast({
          title: "Não foi possível anexar",
          description: err instanceof Error ? err.message : "Tente novamente.",
          variant: "destructive",
        });
      }
    })();
  };

  const openDownload = (doc: CrmNegotiationDocument) => {
    void (async () => {
      try {
        const url = await getCrmNegotiationDocumentSignedUrl(doc.storagePath);
        window.open(url, "_blank", "noopener,noreferrer");
      } catch (err) {
        toast({
          title: "Download",
          description: err instanceof Error ? err.message : "Não foi possível abrir o arquivo.",
          variant: "destructive",
        });
      }
    })();
  };

  return (
    <section
      className={cn(
        "overflow-hidden border border-[#e8eaed] bg-white",
        !enabled && "opacity-60",
      )}
      style={{ borderRadius: RD_RADIUS, boxShadow: RD_CARD_SHADOW }}
      aria-busy={isLoading || busy}
    >
      <div className="flex items-center justify-between border-b border-[#eceff1] px-4 py-3">
        <h2 className="text-sm font-semibold text-[#37474f]">Documentos do lead</h2>
        <FileText className="h-4 w-4 text-[#90a4ae]" aria-hidden />
      </div>
      <div className="space-y-4 px-4 py-4 md:px-6">
        <p className="text-xs text-[#78909c]">
          Dê um nome ao documento e selecione o arquivo. Os anexos ficam no seu espaço seguro e vinculados a esta negociação.
        </p>
        <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
          <div className="space-y-1">
            <Label htmlFor="lead-doc-display-name">Nome do documento</Label>
            <Input
              id="lead-doc-display-name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Ex.: Proposta comercial"
              className="border-[#ced4da]"
              disabled={!enabled || busy}
            />
          </div>
          <div className="flex flex-col gap-2 sm:items-stretch">
            <input
              ref={fileRef}
              type="file"
              className="hidden"
              onChange={onFileChange}
              disabled={!enabled || busy}
            />
            <Button
              type="button"
              variant="outline"
              className="border-[#cfd8dc] text-[#37474f]"
              style={{ borderRadius: RD_RADIUS }}
              disabled={!enabled || busy}
              onClick={onPickFile}
            >
              <Paperclip className="mr-2 h-4 w-4" />
              Selecionar arquivo
            </Button>
          </div>
        </div>
        {pickedFile ? (
          <p className="text-xs text-[#546e7a]">
            Arquivo: <span className="break-all font-medium">{pickedFile.name}</span>
          </p>
        ) : null}
        <div className="flex justify-end">
          <Button
            type="button"
            className="border-0 font-semibold text-white shadow-none hover:opacity-95"
            style={{ backgroundColor: BRAND_ACCENT, borderRadius: RD_RADIUS }}
            disabled={!enabled || busy}
            onClick={handleAttach}
          >
            Anexar ao lead
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-2">
            <div className="h-12 animate-pulse rounded-lg bg-[#eceff1]" />
            <div className="h-12 animate-pulse rounded-lg bg-[#eceff1]" />
          </div>
        ) : docs.length === 0 ? (
          <p className="py-4 text-center text-sm text-[#78909c]">Nenhum documento anexado ainda.</p>
        ) : (
          <ul className="space-y-2 border-t border-[#eceff1] pt-4">
            {docs.map((d) => (
              <li
                key={d.id}
                className="flex items-start gap-2 rounded-lg border border-[#eceff1] bg-[#fafbfb] px-3 py-2.5"
              >
                <FileText className="mt-0.5 h-4 w-4 shrink-0 text-[#90a4ae]" aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-[#37474f]">{d.displayName}</p>
                  <p className="mt-0.5 text-xs text-[#78909c]">
                    {d.fileName} · {formatDocSize(d.fileSize)}
                    {d.createdAt ? ` · ${formatDocDate(d.createdAt)}` : ""}
                  </p>
                </div>
                <div className="flex shrink-0 gap-0.5">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-[#90a4ae] hover:bg-[#eceff1]"
                    disabled={busy}
                    aria-label={`Baixar ${d.displayName}`}
                    onClick={() => openDownload(d)}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-[#90a4ae] hover:bg-[#ffebee] hover:text-[#c62828]"
                    disabled={busy}
                    aria-label={`Excluir ${d.displayName}`}
                    onClick={() => setDeleteTarget(d)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <AlertDialog
        open={deleteTarget != null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent className="border-[#cfd8dc]">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir documento?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget
                ? `“${deleteTarget.displayName}” será removido deste lead e o arquivo apagado do armazenamento.`
                : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-[#cfd8dc]">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-[#c62828] text-white hover:bg-[#b71c1c]"
              onClick={() => {
                const t = deleteTarget;
                setDeleteTarget(null);
                if (!t) return;
                void (async () => {
                  try {
                    await deleteDoc.mutateAsync({ id: t.id, negotiationId });
                    toast({ title: "Documento removido" });
                  } catch (err) {
                    toast({
                      title: "Não foi possível excluir",
                      description: err instanceof Error ? err.message : "Tente novamente.",
                      variant: "destructive",
                    });
                  }
                })();
              }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
