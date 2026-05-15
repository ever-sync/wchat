import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient, type UseMutationOptions } from "@tanstack/react-query";
import { isSupabaseConfigured, requireSupabase } from "@/lib/supabase";
import type { ChatNote } from "@/types/domain";

type NoteRow = {
  id: string;
  tenant_id: string;
  chat_id: string;
  author_id: string;
  body_text: string;
  edited_at: string | null;
  created_at: string;
  profiles: { nome: string } | null;
};

function mapNote(row: NoteRow): ChatNote {
  return {
    _noteKind: true,
    id: row.id,
    tenantId: row.tenant_id,
    chatId: row.chat_id,
    authorId: row.author_id,
    authorName: row.profiles?.nome ?? "Equipe",
    bodyText: row.body_text,
    editedAt: row.edited_at,
    createdAt: row.created_at,
  };
}

export async function listChatNotes(chatId: string): Promise<ChatNote[]> {
  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from("chat_notes")
    .select("id, tenant_id, chat_id, author_id, body_text, edited_at, created_at, profiles(nome)")
    .eq("chat_id", chatId)
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => mapNote(row as unknown as NoteRow));
}

export async function createChatNote(chatId: string, bodyText: string): Promise<ChatNote> {
  const supabase = requireSupabase();
  const { data: authData } = await supabase.auth.getUser();
  const userId = authData.user?.id;
  if (!userId) throw new Error("Não autenticado");

  const { data: profileRow } = await supabase
    .from("profiles")
    .select("tenant_id")
    .eq("id", userId)
    .single();

  const { data, error } = await supabase
    .from("chat_notes")
    .insert({
      tenant_id: profileRow?.tenant_id,
      chat_id: chatId,
      author_id: userId,
      body_text: bodyText.trim(),
    })
    .select("id, tenant_id, chat_id, author_id, body_text, edited_at, created_at, profiles(nome)")
    .single();
  if (error) throw new Error(error.message);
  return mapNote(data as unknown as NoteRow);
}

export async function deleteChatNote(noteId: string): Promise<void> {
  const supabase = requireSupabase();
  const { error } = await supabase.from("chat_notes").delete().eq("id", noteId);
  if (error) throw new Error(error.message);
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function useChatNotes(chatId: string | null | undefined) {
  return useQuery({
    queryKey: ["chat-notes", chatId],
    queryFn: () => listChatNotes(chatId!),
    enabled: Boolean(chatId) && isSupabaseConfigured,
    staleTime: 30_000,
  });
}

export function useCreateChatNote(
  options?: UseMutationOptions<ChatNote, Error, { chatId: string; bodyText: string }>,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ chatId, bodyText }) => createChatNote(chatId, bodyText),
    ...options,
    onSuccess: async (data, variables, context) => {
      // Patch cache optimistically: insert sorted by createdAt
      queryClient.setQueryData<ChatNote[]>(
        ["chat-notes", variables.chatId],
        (prev = []) => {
          if (prev.some((n) => n.id === data.id)) return prev;
          return [...prev, data].sort((a, b) =>
            a.createdAt.localeCompare(b.createdAt),
          );
        },
      );
      await options?.onSuccess?.(data, variables, context);
    },
  });
}

export function useDeleteChatNote(
  options?: UseMutationOptions<void, Error, { noteId: string; chatId: string }>,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ noteId }) => deleteChatNote(noteId),
    ...options,
    onSuccess: async (data, variables, context) => {
      queryClient.setQueryData<ChatNote[]>(
        ["chat-notes", variables.chatId],
        (prev = []) => prev.filter((n) => n.id !== variables.noteId),
      );
      await options?.onSuccess?.(data, variables, context);
    },
  });
}

/** Realtime: INSERT/DELETE em chat_notes para o chat ativo. */
export function useChatNotesRealtime(chatId: string | null | undefined) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!chatId || !isSupabaseConfigured) return;

    const supabase = requireSupabase();

    const channel = supabase
      .channel(`chat-notes:${chatId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_notes",
          filter: `chat_id=eq.${chatId}`,
        },
        async (payload) => {
          const row = payload.new as NoteRow | undefined;
          if (!row) return;

          // Fetch author name since realtime payload won't have the join
          const supabaseClient = requireSupabase();
          const { data: profile } = await supabaseClient
            .from("profiles")
            .select("nome")
            .eq("id", row.author_id)
            .single();

          const note = mapNote({ ...row, profiles: profile ?? null });

          queryClient.setQueryData<ChatNote[]>(
            ["chat-notes", chatId],
            (prev = []) => {
              if (prev.some((n) => n.id === note.id)) return prev;
              return [...prev, note].sort((a, b) =>
                a.createdAt.localeCompare(b.createdAt),
              );
            },
          );
        },
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "chat_notes",
          filter: `chat_id=eq.${chatId}`,
        },
        (payload) => {
          const row = payload.old as { id?: string } | undefined;
          if (!row?.id) return;
          queryClient.setQueryData<ChatNote[]>(
            ["chat-notes", chatId],
            (prev = []) => prev.filter((n) => n.id !== row.id),
          );
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [chatId, queryClient]);
}
