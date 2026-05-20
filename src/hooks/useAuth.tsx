import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { E2E_MOCK_PROFILE_ID, getE2eMockRole, isE2eMockAuth } from "@/lib/e2e";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { useAppStore } from "@/store/useAppStore";
import type { AppUserProfile, AuthCredentials, SignUpPayload, UserRole } from "@/types/domain";

async function fetchProfileFromDb(userId: string): Promise<Partial<AppUserProfile> | null> {
  if (!supabase) return null;
  const sb = supabase;

  const runSelect = (columns: string) =>
    sb.from("profiles").select(columns).eq("id", userId).maybeSingle();

  // `availability` pode não existir se a migration ainda não foi aplicada.
  // Sem o fallback, uma coluna ausente derruba toda a query e o `role` não carrega.
  let { data, error } = await runSelect("nome, email, empresa, plano, role, status, availability");
  if (error) {
    ({ data, error } = await runSelect("nome, email, empresa, plano, role, status"));
  }
  if (error || !data) return null;

  const row = data as unknown as Record<string, unknown>;
  const out: Partial<AppUserProfile> = {};
  if (typeof row.nome === "string" && row.nome) out.nome = row.nome;
  if (typeof row.email === "string" && row.email) out.email = row.email;
  if (typeof row.empresa === "string" && row.empresa) out.empresa = row.empresa;
  if (typeof row.plano === "string" && row.plano) out.plano = row.plano as AppUserProfile["plano"];
  if (typeof row.role === "string" && row.role) out.role = row.role as UserRole;
  if (typeof row.status === "string" && row.status) out.status = row.status as AppUserProfile["status"];
  if (typeof row.availability === "string" && row.availability)
    out.availability = row.availability as AppUserProfile["availability"];
  return out;
}

type AuthContextValue = {
  profile: AppUserProfile | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isSupabaseConfigured: boolean;
  signIn: (credentials: AuthCredentials) => Promise<{ error: string | null }>;
  signUp: (payload: SignUpPayload) => Promise<{ error: string | null; requiresEmailConfirmation: boolean }>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function mapUserToProfile(user: User): AppUserProfile {
  const metadata = user.user_metadata ?? {};
  const fallbackName = user.email?.split("@")[0] ?? "Usuário";

  return {
    id: user.id,
    nome: metadata.nome ?? metadata.name ?? fallbackName,
    email: user.email ?? "",
    empresa: metadata.empresa ?? metadata.company ?? "DistribuiBot",
    plano: metadata.plano ?? "starter",
    role: metadata.role ?? "atendimento",
    status: metadata.status ?? "active",
    avatar: metadata.avatar_url,
  };
}

async function resolveValidSession(nextSession: Session | null) {
  if (!supabase || !nextSession?.access_token) {
    return null;
  }

  const userResult = await supabase.auth.getUser(nextSession.access_token);
  if (userResult.error || !userResult.data.user) {
    await supabase.auth.signOut().catch(() => undefined);
    return null;
  }

  return nextSession;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<AppUserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isE2eMockAuth) {
      const mockRole = getE2eMockRole();
      setProfile({
        id: E2E_MOCK_PROFILE_ID,
        nome: "E2E User",
        email: "e2e@wchat.test",
        empresa: "E2E Tenant",
        plano: "starter",
        role: mockRole,
        status: "active",
      });
      setSession(null);
      setIsLoading(false);
      return undefined;
    }

    if (supabase) {
      let isMounted = true;
      let profileChannel: ReturnType<NonNullable<typeof supabase>["channel"]> | null = null;

      const applyDbProfile = (dbProfile: Partial<AppUserProfile>) => {
        if (!isMounted) return;
        setProfile((prev) => (prev ? { ...prev, ...dbProfile } : prev));
      };

      const hydrateProfile = async (user: User | null) => {
        if (profileChannel) {
          await supabase.removeChannel(profileChannel).catch(() => undefined);
          profileChannel = null;
        }
        if (!user) {
          setProfile(null);
          return;
        }
        const base = mapUserToProfile(user);
        // Re-hidratação (token refresh / foco da janela): preserva o profile já conhecido
        // — inclusive o `role` real (que vem da tabela profiles, não do metadata) — até o
        // fetch do DB confirmar. Sem isso, o role piscava para o fallback "atendimento" e
        // o PermissionRoute expulsava o admin para /inbox.
        setProfile((prev) => (prev && prev.id === user.id ? { ...base, ...prev } : base));
        const dbProfile = await fetchProfileFromDb(user.id);
        if (!isMounted) return;
        if (dbProfile) applyDbProfile(dbProfile);

        profileChannel = supabase
          .channel(`profile:${user.id}`)
          .on(
            "postgres_changes",
            { event: "UPDATE", schema: "public", table: "profiles", filter: `id=eq.${user.id}` },
            (payload) => {
              const next = payload.new as Record<string, unknown>;
              const update: Partial<AppUserProfile> = {};
              if (typeof next.nome === "string" && next.nome) update.nome = next.nome;
              if (typeof next.email === "string" && next.email) update.email = next.email;
              if (typeof next.empresa === "string" && next.empresa) update.empresa = next.empresa;
              if (typeof next.plano === "string" && next.plano) update.plano = next.plano as AppUserProfile["plano"];
              if (typeof next.role === "string" && next.role) update.role = next.role as UserRole;
              if (typeof next.status === "string" && next.status) update.status = next.status as AppUserProfile["status"];
              if (typeof next.availability === "string" && next.availability)
                update.availability = next.availability as AppUserProfile["availability"];
              applyDbProfile(update);
            },
          )
          .subscribe();
      };

      void supabase.auth.getSession().then(async ({ data }) => {
        if (!isMounted) {
          return;
        }

        const validSession = await resolveValidSession(data.session);

        if (!isMounted) {
          return;
        }

        setSession(validSession);
        await hydrateProfile(validSession?.user ?? null);
        setIsLoading(false);
      });

      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, nextSession) => {
        void resolveValidSession(nextSession).then(async (validSession) => {
          if (!isMounted) return;
          setSession(validSession);
          await hydrateProfile(validSession?.user ?? null);
          setIsLoading(false);
        });
      });

      return () => {
        isMounted = false;
        subscription.unsubscribe();
        if (profileChannel && supabase) {
          void supabase.removeChannel(profileChannel).catch(() => undefined);
          profileChannel = null;
        }
      };
    }

    setIsLoading(false);
    return undefined;
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      profile,
      session,
      isAuthenticated: Boolean(profile),
      isLoading,
      isSupabaseConfigured,
      signIn: async ({ email, password }) => {
        if (!supabase) {
          return {
            error:
              "Supabase não configurado. Preencha as variáveis VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.",
          };
        }

        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          return { error: error.message };
        }

        const {
          data: { session: nextSession },
        } = await supabase.auth.getSession();
        const validSession = await resolveValidSession(nextSession);

        if (!validSession) {
          return {
            error:
              "A sessao foi criada, mas nao ficou valida neste navegador. Tente entrar novamente.",
          };
        }

        return { error: null };
      },
      signUp: async ({ nome, email, telefone, empresa, cnpj, password, plano }) => {
        if (!supabase) {
          return {
            error:
              "Supabase não configurado. Preencha as variáveis VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.",
            requiresEmailConfirmation: false,
          };
        }

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              nome,
              telefone,
              empresa,
              cnpj,
              plano: plano ?? "profissional",
            },
          },
        });

        return {
          error: error?.message ?? null,
          requiresEmailConfirmation: !data.session,
        };
      },
      signOut: async () => {
        if (supabase) {
          await supabase.auth.signOut();
        }

        useAppStore.getState().clearNotifications();
        setSession(null);
        setProfile(null);
      },
    }),
    [isLoading, profile, session],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}
