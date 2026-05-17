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
    role: metadata.role ?? "admin",
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

      void supabase.auth.getSession().then(async ({ data }) => {
        if (!isMounted) {
          return;
        }

        const validSession = await resolveValidSession(data.session);

        if (!isMounted) {
          return;
        }

        setSession(validSession);
        setProfile(validSession?.user ? mapUserToProfile(validSession.user) : null);
        setIsLoading(false);
      });

      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, nextSession) => {
        void resolveValidSession(nextSession).then((validSession) => {
          setSession(validSession);
          setProfile(validSession?.user ? mapUserToProfile(validSession.user) : null);
          setIsLoading(false);
        });
      });

      return () => {
        isMounted = false;
        subscription.unsubscribe();
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
