import { requireSupabase } from "@/lib/supabase";

export async function getCurrentUserId() {
  const supabase = requireSupabase();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    throw new Error("Sessão inválida. Faça login novamente.");
  }

  return data.user.id;
}

export async function getCurrentTenantId() {
  const supabase = requireSupabase();
  const userId = await getCurrentUserId();
  const { data, error } = await supabase
    .from("profiles")
    .select("tenant_id")
    .eq("id", userId)
    .single();

  if (error) {
    throw new Error(
      "Não foi possível localizar o perfil do usuário. Confirme se as migrations de profiles foram aplicadas no Supabase.",
    );
  }

  if (!data?.tenant_id) {
    throw new Error("O usuário autenticado ainda não possui tenant associado.");
  }

  return data.tenant_id as string;
}
