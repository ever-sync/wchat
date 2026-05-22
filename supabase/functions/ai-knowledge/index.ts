// Ingestão da base de conhecimento da IA (Fase 3).
//  POST   { title, content }        → chunka + embeda (Voyage) + grava fonte/chunks
//  GET                              → lista as fontes do tenant
//  DELETE ?source_id=...            → remove a fonte (chunks caem em cascata)
// Auth: JWT do admin do tenant (requireTenantContext + role === 'admin').

import { embedDocuments } from "../_shared/embeddings.ts";
import { handleCors, jsonResponse } from "../_shared/http.ts";
import { requireTenantContext } from "../_shared/supabase.ts";

const MAX_CHUNK_LEN = 1200;
const MAX_CHUNKS = 200;

Deno.serve(async (request) => {
  const cors = handleCors(request);
  if (cors) return cors;

  let ctx;
  try {
    ctx = await requireTenantContext(request);
  } catch (err) {
    return jsonResponse({ error: err instanceof Error ? err.message : "Unauthorized." }, 401);
  }
  if (ctx.role !== "admin") {
    return jsonResponse({ error: "Apenas administradores podem gerenciar a base de conhecimento." }, 403);
  }

  const { admin, tenantId } = ctx;

  if (request.method === "GET") {
    const { data, error } = await admin
      .from("ai_knowledge_sources")
      .select("id, title, kind, created_at")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false });
    if (error) return jsonResponse({ error: error.message }, 500);
    return jsonResponse({ sources: data ?? [] });
  }

  if (request.method === "DELETE") {
    const sourceId = new URL(request.url).searchParams.get("source_id");
    if (!sourceId) return jsonResponse({ error: "source_id obrigatório." }, 400);
    const { error } = await admin
      .from("ai_knowledge_sources")
      .delete()
      .eq("tenant_id", tenantId)
      .eq("id", sourceId);
    if (error) return jsonResponse({ error: error.message }, 500);
    return jsonResponse({ ok: true });
  }

  if (request.method === "POST") {
    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return jsonResponse({ error: "JSON inválido." }, 400);
    }
    const title = String(body.title ?? "").trim();
    const content = String(body.content ?? "").trim();
    if (!title || !content) {
      return jsonResponse({ error: "title e content são obrigatórios." }, 400);
    }

    const chunks = chunkText(content).slice(0, MAX_CHUNKS);
    if (chunks.length === 0) {
      return jsonResponse({ error: "Conteúdo vazio após processamento." }, 400);
    }

    let embeddings: number[][];
    try {
      embeddings = await embedDocuments(chunks);
    } catch (err) {
      return jsonResponse({ error: err instanceof Error ? err.message : "Falha ao gerar embeddings." }, 502);
    }

    const { data: source, error: srcErr } = await admin
      .from("ai_knowledge_sources")
      .insert({ tenant_id: tenantId, title, kind: "text" })
      .select("id")
      .single();
    if (srcErr || !source) {
      return jsonResponse({ error: srcErr?.message ?? "Falha ao criar a fonte." }, 500);
    }

    const rows = chunks.map((chunk, i) => ({
      tenant_id: tenantId,
      source_id: source.id,
      chunk_index: i,
      content: chunk,
      embedding: embeddings[i],
    }));
    const { error: chunkErr } = await admin.from("ai_knowledge_chunks").insert(rows);
    if (chunkErr) {
      // Rollback best-effort da fonte se os chunks falharem.
      await admin.from("ai_knowledge_sources").delete().eq("id", source.id);
      return jsonResponse({ error: chunkErr.message }, 500);
    }

    return jsonResponse({ ok: true, source_id: source.id, chunks: chunks.length });
  }

  return jsonResponse({ error: "Method not allowed." }, 405);
});

/** Quebra o texto em chunks de ~MAX_CHUNK_LEN, respeitando parágrafos. */
function chunkText(text: string, maxLen = MAX_CHUNK_LEN): string[] {
  const paragraphs = text.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  const chunks: string[] = [];
  let current = "";

  for (const paragraph of paragraphs) {
    let para = paragraph;
    // Parágrafo único maior que o limite: corta em pedaços.
    while (para.length > maxLen) {
      if (current) {
        chunks.push(current);
        current = "";
      }
      chunks.push(para.slice(0, maxLen));
      para = para.slice(maxLen);
    }
    const candidate = current ? `${current}\n\n${para}` : para;
    if (candidate.length > maxLen && current) {
      chunks.push(current);
      current = para;
    } else {
      current = candidate;
    }
  }
  if (current.trim()) chunks.push(current);
  return chunks;
}
