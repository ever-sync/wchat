import { requireSupabase } from "@/lib/supabase";

export function getApiClient() {
  return requireSupabase();
}
