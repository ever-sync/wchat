// One-off admin backfill: reprocessa midias antigas (audio/foto enviados pelo
// celular do atendente) que ficaram com a URL encriptada do WhatsApp e por isso
// nao tocavam no Inbox. Reusa a mesma logica de espelhamento do webhook.
//
// Protegida por segredo dedicado (x-backfill-secret == BACKFILL_SECRET), nao por
// JWT de usuario — ver config.toml (verify_jwt = false). Idempotente e
// reexecutavel. Pode ser removida apos rodar (`supabase functions delete`).
import { backfillEncryptedMediaForInstance, getInstanceById } from "../_shared/domain.ts";
import { handleCors, jsonResponse } from "../_shared/http.ts";
import { createAdminClient } from "../_shared/supabase.ts";
import { timingSafeEqual } from "../_shared/timing-safe-equal.ts";

Deno.serve(async (request) => {
  const corsResponse = handleCors(request);
  if (corsResponse) {
    return corsResponse;
  }

  if (request.method !== "POST") {
    return jsonResponse({ error: "Method not allowed." }, 405);
  }

  const expected = Deno.env.get("BACKFILL_SECRET");
  const provided = request.headers.get("x-backfill-secret");
  if (!expected || !provided || !timingSafeEqual(expected, provided)) {
    return jsonResponse({ error: "Unauthorized." }, 401);
  }

  try {
    const admin = createAdminClient();
    const body = (await request.json().catch(() => ({}))) as {
      instanceId?: string;
      limit?: number;
    };

    const instances: Array<Awaited<ReturnType<typeof getInstanceById>>> = [];
    if (body.instanceId) {
      instances.push(await getInstanceById(admin, body.instanceId));
    } else {
      const { data, error } = await admin
        .from("whatsapp_instances")
        .select("*")
        .is("archived_at", null);
      if (error) {
        throw new Error(error.message);
      }
      instances.push(...(data ?? []));
    }

    const perInstance: Array<{
      instanceId: string;
      scanned: number;
      mirrored: number;
      failed: number;
    }> = [];
    const totals = { scanned: 0, mirrored: 0, failed: 0 };

    for (const instance of instances) {
      const result = await backfillEncryptedMediaForInstance(admin, instance, {
        limit: body.limit,
      });
      perInstance.push({ instanceId: instance.id, ...result });
      totals.scanned += result.scanned;
      totals.mirrored += result.mirrored;
      totals.failed += result.failed;
    }

    return jsonResponse({
      success: true,
      instances: instances.length,
      totals,
      perInstance,
    });
  } catch (error) {
    return jsonResponse(
      { error: error instanceof Error ? error.message : "Unexpected error." },
      400,
    );
  }
});
