import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.8";

export function getRequiredEnv(name: string) {
  const value = Deno.env.get(name);
  if (!value) {
    throw new Error(`Missing env: ${name}`);
  }

  return value;
}

export function createAdminClient() {
  return createClient(
    getRequiredEnv("SUPABASE_URL"),
    getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY"),
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}

export function isInternalRequest(request: Request) {
  const expectedSecret = Deno.env.get("CRON_SECRET");
  const providedSecret = request.headers.get("x-cron-secret");

  return Boolean(expectedSecret && providedSecret && expectedSecret === providedSecret);
}

export async function requireTenantContext(request: Request) {
  const admin = createAdminClient();
  const authorization = request.headers.get("Authorization");
  const token = authorization?.replace(/^Bearer\s+/i, "");

  if (!token) {
    throw new Error("Missing bearer token.");
  }

  const { data: userData, error: userError } = await admin.auth.getUser(token);
  if (userError || !userData.user) {
    throw new Error("Invalid bearer token.");
  }

  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("tenant_id")
    .eq("id", userData.user.id)
    .single();

  if (profileError || !profile?.tenant_id) {
    throw new Error("User has no tenant.");
  }

  return {
    admin,
    userId: userData.user.id,
    tenantId: profile.tenant_id as string,
  };
}

export async function requireTenantContextOrInternal(request: Request) {
  if (isInternalRequest(request)) {
    return {
      admin: createAdminClient(),
      userId: null,
      tenantId: null,
      isInternal: true as const,
    };
  }

  const context = await requireTenantContext(request);
  return {
    ...context,
    isInternal: false as const,
  };
}

export function getFunctionsBaseUrl() {
  return `${getRequiredEnv("SUPABASE_URL")}/functions/v1`;
}
