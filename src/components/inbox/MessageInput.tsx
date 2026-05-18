import type { ChangeEvent, RefObject } from "react";
import {
  Calculator,
  FileText,
  Loader2,
  Mic,
  Paperclip,
  PenLine,
  Send,
  Smile,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { WHATSAPP_MEDIA_MAX_BYTES } from "@/lib/api/whatsapp-media";
import { resolveComposerAttachmentPreview } from "@/lib/inboxComposerPreview";
import { cn } from "@/lib/utils";
import type { MessageType, QuickReply } from "@/types/domain";
import { useCalculadora } from "@/contexts/CalculadoraContext";
import { QUICK_EMOJIS } from "./inboxComposerOptions";
import { QuickReplyPicker } from "./QuickReplyPicker";
import { TemplatePicker } from "./TemplatePicker";

export type MessageInputProps = {
  bodyTextareaRef: RefObject<HTMLTextAreaElement>;
  mediaUrlInputRef: RefObject<HTMLInputElement>;
  attachmentInputRef: RefObject<HTMLInputElement>;
  messageType: Exclude<MessageType, "system">;
  onMessageTypeChange: (value: Exclude<MessageType, "system">) => void;
  simulateTyping: boolean;
  onSimulateTypingChange: (value: boolean) => void;
  onSync: () => void;
  syncPending: boolean;
  syncDisabled: boolean;
  mediaUrl: string;
  onMediaUrlChange: (value: string) => void;
  payloadText: string;
  onPayloadTextChange: (value: string) => void;
  selectedAttachmentName: string | null;
  attachmentMimeType?: string | null;
  bodyText: string;
  onBodyTextChange: (value: string) => void;
  onSend: () => void;
  sendDisabled: boolean;
  /** Bloqueia anexo, template, áudio e emoji (ex.: lead não assumido). */
  composerActionsDisabled?: boolean;
  showEmojiPicker: boolean;
  onToggleEmojiPicker: () => void;
  onAppendEmoji: (emoji: string) => void;
  templateOpen: boolean;
  onTemplateOpenChange: (open: boolean) => void;
  selectedTemplateId: string | null;
  onSelectTemplate: (id: string) => void;
  onAttachmentButtonClick: () => void;
  onAttachmentChange: (event: ChangeEvent<HTMLInputElement>) => void;
  attachmentUploading?: boolean;
  /** Progresso 0..1 durante upload, null fora dele. */
  attachmentProgress?: number | null;
  microphoneState: "idle" | "requesting" | "granted" | "denied";
  isRecording?: boolean;
  recordingDurationSec?: number;
  onMicrophoneClick: () => void;
  quickReplies?: QuickReply[];
  quickReplyOpen?: boolean;
  onQuickReplyOpenChange?: (open: boolean) => void;
  onSelectQuickReply?: (reply: QuickReply) => void;
  noteMode?: boolean;
  onNoteModeChange?: (value: boolean) => void;
};

export function MessageInput({
  bodyTextareaRef,
  mediaUrlInputRef,
  attachmentInputRef,
  messageType,
  onMessageTypeChange,
  simulateTyping,
  onSimulateTypingChange,
  onSync,
  syncPending,
  syncDisabled,
  mediaUrl,
  onMediaUrlChange,
  payloadText,
  onPayloadTextChange,
  selectedAttachmentName,
  attachmentMimeType = null,
  bodyText,
  onBodyTextChange,
  onSend,
  sendDisabled,
  composerActionsDisabled = false,
  showEmojiPicker,
  onToggleEmojiPicker,
  onAppendEmoji,
  templateOpen,
  onTemplateOpenChange,
  selectedTemplateId,
  onSelectTemplate,
  onAttachmentButtonClick,
  onAttachmentChange,
  attachmentUploading = false,
  attachmentProgress = null,
  microphoneState,
  isRecording = false,
  recordingDurationSec = 0,
  onMicrophoneClick,
  quickReplies = [],
  quickReplyOpen = false,
  onQuickReplyOpenChange,
  onSelectQuickReply,
  noteMode = false,
  onNoteModeChange,
}: MessageInputProps) {
  const { openCalculadora } = useCalculadora();
  const previewKind = resolveComposerAttachmentPreview(
    messageType,
    mediaUrl,
    attachmentMimeType,
  );

  return (
    <div className="relative z-10 shrink-0 border-t border-border bg-card px-3 py-2 md:px-5 md:py-3">
      {(messageType === "media" || messageType === "audio" || messageType === "document") && (
        <div className="mb-3">
          <p className="mb-2 text-xs text-muted-foreground">
            Anexos: ate {WHATSAPP_MEDIA_MAX_BYTES / (1024 * 1024)} MB por arquivo (imagens, video, audio,
            PDF e documentos comuns).
          </p>
          {selectedAttachmentName ? (
            <div className="mb-2 inline-flex items-center rounded-full border border-[#dfe7d9] bg-[#f4fbf2] px-3 py-1 text-xs font-semibold text-[#55705f]">
              Arquivo: {selectedAttachmentName}
            </div>
          ) : null}
          {attachmentUploading && attachmentProgress !== null ? (
            <div className="mb-2 w-full max-w-[320px]">
              <div className="mb-1 flex items-center justify-between text-[11px] text-[#55705f]">
                <span>Subindo arquivo...</span>
                <span className="tabular-nums">{Math.round(attachmentProgress * 100)}%</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#dfe7d9]">
                <div
                  className="h-full rounded-full bg-[#4E1BB1] transition-[width] duration-150"
                  style={{ width: `${Math.max(0, Math.min(1, attachmentProgress)) * 100}%` }}
                />
              </div>
            </div>
          ) : null}
          {previewKind && mediaUrl.trim() ? (
            <div className="mb-3 overflow-hidden rounded-[22px] border border-[#e2e8de] bg-[#f8faf7] p-2 shadow-[0_10px_24px_rgba(37,63,51,0.04)]">
              {previewKind === "image" ? (
                <img
                  src={mediaUrl}
                  alt=""
                  className="mx-auto max-h-40 w-auto max-w-full rounded-xl object-contain"
                />
              ) : null}
              {previewKind === "video" ? (
                <video
                  src={mediaUrl}
                  controls
                  className="mx-auto max-h-40 w-full max-w-full rounded-xl"
                />
              ) : null}
              {previewKind === "audio" ? (
                <audio src={mediaUrl} controls className="h-10 w-full max-w-md" />
              ) : null}
              {previewKind === "document" ? (
                <div className="flex items-center gap-3 rounded-xl bg-white px-3 py-2 text-sm text-[#445159]">
                  <FileText className="h-8 w-8 shrink-0 text-[#4E1BB1]" />
                  <span className="min-w-0 truncate">{selectedAttachmentName ?? "Documento"}</span>
                </div>
              ) : null}
            </div>
          ) : null}
          {/* URL preenchida pelo upload fica apenas no estado; campo visivel gerava ruido (link longo do Storage). */}
          <Input
            ref={mediaUrlInputRef}
            value={mediaUrl}
            onChange={(event) => onMediaUrlChange(event.target.value)}
            tabIndex={-1}
            aria-hidden
            placeholder={
              messageType === "audio"
                ? "URL do audio (opcional) — ou use o botao de microfone para gravar"
                : messageType === "document"
                  ? "URL do arquivo"
                  : "URL da midia ou da imagem"
            }
            className={cn(
              "sr-only",
              "h-px w-px min-w-0 border-0 p-0 shadow-none",
              "focus-visible:ring-0 focus-visible:ring-offset-0",
            )}
          />
        </div>
      )}

      {messageType !== "text" &&
      messageType !== "media" &&
      messageType !== "audio" &&
      messageType !== "document" ? (
        <div className="mb-3">
          <Textarea
            value={payloadText}
            onChange={(event) => onPayloadTextChange(event.target.value)}
            placeholder='Payload extra em JSON. Ex.: {"buttons":[...]}'
            className="min-h-[100px] rounded-[24px] border-[#e2e8de] bg-white font-mono text-xs shadow-[0_8px_18px_rgba(37,63,51,0.04)]"
          />
        </div>
      ) : null}

      {showEmojiPicker ? (
        <div className="mb-3 flex flex-wrap gap-2 rounded-[24px] border border-[#e2e8de] bg-white p-3 shadow-[0_12px_24px_rgba(37,63,51,0.08)]">
          {QUICK_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => onAppendEmoji(emoji)}
              className="flex h-10 w-10 items-center justify-center rounded-2xl text-lg transition-colors hover:bg-[#f3f6f1]"
            >
              {emoji}
            </button>
          ))}
        </div>
      ) : null}

      {noteMode ? (
        <div className="mb-2 flex items-center justify-between rounded-lg border border-[#574500] bg-[#2b2300] px-3 py-1.5">
          <div className="flex items-center gap-2">
            <PenLine className="h-3.5 w-3.5 text-[#c9a020]" />
            <span className="text-xs font-medium text-[#c9a020]">
              Nota interna — visível só para a equipe
            </span>
          </div>
          <button
            type="button"
            onClick={() => onNoteModeChange?.(false)}
            className="ml-2 text-[#8a6b1a] transition-colors hover:text-[#c9a020]"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : null}

      <div className={cn(
        "flex min-h-[52px] items-center gap-1.5 rounded-full px-2 py-1.5 sm:gap-2 sm:px-3 sm:py-2",
        noteMode ? "bg-amber-50 ring-1 ring-amber-200" : "bg-card ring-1 ring-border",
      )}>
        <input
          ref={attachmentInputRef}
          type="file"
          className="hidden"
          accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.zip,.rar"
          onChange={onAttachmentChange}
        />
        <div className="flex shrink-0 items-center gap-1 text-muted-foreground sm:gap-1.5">
          <button
            type="button"
            onClick={onAttachmentButtonClick}
            disabled={attachmentUploading || composerActionsDisabled}
            className={`flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-wchat-200 hover:text-foreground disabled:pointer-events-none disabled:opacity-50 ${messageType === "document" ? "bg-wchat-200 text-primary" : ""}`}
            title={composerActionsDisabled ? "Assuma a conversa e o negócio para anexar" : "Anexar documento"}
          >
            {attachmentUploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Paperclip className="h-4 w-4" />
            )}
          </button>
          <button
            type="button"
            onClick={openCalculadora}
            className="flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-wchat-200 hover:text-foreground"
            title="Calculadora"
            aria-label="Abrir calculadora"
          >
            <Calculator className="h-4 w-4" />
          </button>
          <TemplatePicker
            open={templateOpen}
            onOpenChange={onTemplateOpenChange}
            value={selectedTemplateId}
            onSelect={onSelectTemplate}
            disabled={composerActionsDisabled}
          />
          {onSelectQuickReply ? (
            <QuickReplyPicker
              open={quickReplyOpen}
              onOpenChange={onQuickReplyOpenChange ?? (() => {})}
              replies={quickReplies}
              onSelect={onSelectQuickReply}
              disabled={composerActionsDisabled}
            />
          ) : null}
          {onNoteModeChange ? (
            <button
              type="button"
              disabled={composerActionsDisabled}
              onClick={() => onNoteModeChange(!noteMode)}
              className={`flex h-10 w-10 items-center justify-center rounded-full transition-colors ${noteMode ? "bg-[#4a3500] text-[#f5d96a] hover:bg-[#5c4400]" : "text-muted-foreground hover:bg-wchat-200 hover:text-foreground"}`}
              title={noteMode ? "Sair do modo nota" : "Escrever nota interna"}
            >
              <PenLine className="h-4 w-4" />
            </button>
          ) : null}
          <button
            type="button"
            onClick={onToggleEmojiPicker}
            disabled={composerActionsDisabled}
            className={`flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-wchat-200 hover:text-foreground disabled:pointer-events-none disabled:opacity-50 ${showEmojiPicker ? "bg-wchat-200 text-primary" : ""}`}
            title="Inserir emoji"
          >
            <Smile className="h-4 w-4" />
          </button>
        </div>

        {/* textarea nativo evita border/min-height/ring herdados do shadcn (caixa dentro da pilula) */}
        <textarea
          ref={bodyTextareaRef}
          value={bodyText}
          rows={1}
          disabled={composerActionsDisabled}
          data-gramm_editor="false"
          data-grammarly-ignore="true"
          onChange={(event) => onBodyTextChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              void onSend();
            }
          }}
          placeholder={noteMode ? "Escrever nota interna..." : "Digite uma mensagem"}
          className={cn(
            "min-h-[40px] max-h-36 min-w-0 flex-1 resize-none bg-transparent px-2 py-2",
            "text-[15px] font-medium leading-6 text-foreground",
            "placeholder:text-muted-foreground",
            "border-0 shadow-none outline-none ring-0 ring-offset-0",
            "focus:border-0 focus:outline-none focus:ring-0 focus-visible:border-0 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0",
          )}
        />

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => {
              void onMicrophoneClick();
            }}
            disabled={composerActionsDisabled}
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-full transition-colors",
              isRecording
                ? "bg-red-900/40 text-red-300 ring-2 ring-red-500/50 animate-pulse"
                : microphoneState === "granted"
                  ? "bg-wchat-200 text-primary hover:bg-wchat-200"
                  : microphoneState === "denied"
                    ? "bg-red-900/30 text-red-300 hover:bg-red-900/50"
                    : "text-muted-foreground hover:bg-wchat-200 hover:text-foreground",
            )}
            title={
              isRecording
                ? `Gravando (${recordingDurationSec}s) — clique para parar e salvar`
                : "Gravar audio (clique para iniciar; clique de novo para parar)"
            }
          >
            {microphoneState === "requesting" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Mic className="h-4 w-4" />
            )}
          </button>
          {isRecording ? (
            <span className="hidden text-xs tabular-nums text-red-600 sm:inline">{recordingDurationSec}s</span>
          ) : null}
          <Button
            className={cn(
              "h-11 shrink-0 rounded-full px-5 text-foreground shadow-none",
              noteMode ? "bg-amber-600 hover:bg-amber-700" : "bg-primary hover:bg-wchat-700 text-primary-foreground",
            )}
            disabled={sendDisabled || composerActionsDisabled || attachmentUploading}
            aria-busy={attachmentUploading}
            onClick={() => {
              void onSend();
            }}
          >
            {noteMode ? (
              <>
                <PenLine className="mr-2 h-4 w-4" />
                Nota
              </>
            ) : attachmentUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Subindo arquivo...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Enviar
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
