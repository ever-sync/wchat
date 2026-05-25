import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, KeyRound, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAppStore } from "@/store/useAppStore";
import { resolveAuthRedirectSession } from "@/lib/auth-redirect";
import { requireSupabase } from "@/lib/supabase";

export default function RedefinirSenha() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadSession() {
      try {
        const session = await resolveAuthRedirectSession();

        if (cancelled) {
          return;
        }

        setSessionReady(Boolean(session?.user));
        setEmail(session?.user?.email ?? "");
      } catch {
        if (!cancelled) {
          setSessionReady(false);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadSession();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (senha.length < 6) {
      const d = "Use pelo menos 6 caracteres.";
      toast({ title: "Senha muito curta", description: d, variant: "destructive" });
      useAppStore.getState().addNotification({ tipo: "aviso", titulo: "Senha muito curta", descricao: d });
      return;
    }

    if (senha !== confirmarSenha) {
      const d = "Confirme a mesma senha nos dois campos.";
      toast({ title: "Senhas diferentes", description: d, variant: "destructive" });
      useAppStore.getState().addNotification({ tipo: "aviso", titulo: "Senhas diferentes", descricao: d });
      return;
    }

    setSaving(true);

    try {
      const supabase = requireSupabase();
      const { error } = await supabase.auth.updateUser({ password: senha });

      if (error) {
        throw error;
      }

      const okDesc = "Sua senha foi atualizada com sucesso.";
      toast({ title: "Senha redefinida", description: okDesc });
      useAppStore.getState().addNotification({ tipo: "sucesso", titulo: "Senha redefinida", descricao: okDesc });

      navigate("/inbox", { replace: true });
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Tente novamente.";
      toast({ title: "Nao foi possivel redefinir a senha", description: msg, variant: "destructive" });
      useAppStore.getState().addNotification({
        tipo: "erro",
        titulo: "Nao foi possivel redefinir a senha",
        descricao: msg,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--crm-surface)] p-2 md:p-4">
      <div className="mx-auto flex min-h-[calc(100vh-1rem)] max-w-[1520px] rounded-[28px] border border-[var(--crm-border-2)] bg-card p-[10px] shadow-[0_20px_70px_rgba(84,95,101,0.08)] md:min-h-[calc(100vh-2rem)]">
        <div className="flex w-full items-center justify-center px-6 py-8 sm:px-10 lg:w-[49%] lg:px-16">
          <div className="w-full max-w-[430px]">
            <div className="mb-8 text-center lg:text-left">
              <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-[var(--crm-border-2)] bg-[var(--crm-surface)] px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-[var(--crm-brand)]">
                <KeyRound className="h-3.5 w-3.5" />
                Nova senha
              </p>
              <h1 className="text-[40px] font-semibold tracking-[-0.03em] text-[var(--crm-ink-2)]">
                Redefinir senha
              </h1>
              <p className="mt-3 text-[18px] text-[var(--crm-ink-3)]">
                Escolha uma nova senha para voltar ao painel.
              </p>
            </div>

            {loading ? (
              <div className="rounded-[18px] border border-[var(--crm-border-2)] bg-[var(--crm-surface)] px-5 py-10 text-center text-sm text-[var(--crm-ink-3)]">
                <Loader2 className="mx-auto mb-3 h-5 w-5 animate-spin text-[var(--crm-brand)]" />
                Validando seu link...
              </div>
            ) : !sessionReady ? (
              <div className="space-y-4 rounded-[18px] border border-[var(--crm-surface-2)] bg-[var(--crm-surface)] p-5">
                <p className="text-sm text-[var(--crm-ink-3)]">
                  Este link nao criou uma sessao valida. Solicite uma nova recuperacao e tente de novo.
                </p>
                <Button asChild className="w-full bg-[var(--crm-brand)] text-[var(--crm-surface-2)] hover:bg-[var(--crm-brand-strong)]">
                  <Link to="/recuperar-senha">Solicitar novo link</Link>
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2.5">
                  <label className="block text-[15px] font-medium text-[var(--crm-ink-2)]">
                    E-mail
                  </label>
                  <Input
                    value={email}
                    disabled
                    className="h-[50px] rounded-[12px] border-[var(--crm-border-2)] bg-[var(--crm-surface)] px-4 text-[15px] text-[var(--crm-ink-3)] shadow-none"
                  />
                </div>

                <div className="space-y-2.5">
                  <label className="block text-[15px] font-medium text-[var(--crm-ink-2)]">
                    Nova senha
                  </label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={senha}
                      onChange={(event) => setSenha(event.target.value)}
                      placeholder="Crie uma nova senha"
                      className="h-[50px] rounded-[12px] border-[var(--crm-border-2)] bg-[var(--crm-surface)] px-4 pr-12 text-[15px] text-[var(--crm-ink-2)] shadow-none placeholder:text-[var(--crm-ink-3)] focus-visible:ring-1 focus-visible:ring-[var(--crm-brand)]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((current) => !current)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--crm-ink-3)] transition-colors hover:text-[var(--crm-ink-2)]"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2.5">
                  <label className="block text-[15px] font-medium text-[var(--crm-ink-2)]">
                    Confirmar senha
                  </label>
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={confirmarSenha}
                    onChange={(event) => setConfirmarSenha(event.target.value)}
                    placeholder="Repita a nova senha"
                    className="h-[50px] rounded-[12px] border-[var(--crm-border-2)] bg-[var(--crm-surface)] px-4 text-[15px] text-[var(--crm-ink-2)] shadow-none placeholder:text-[var(--crm-ink-3)] focus-visible:ring-1 focus-visible:ring-[var(--crm-brand)]"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={saving}
                  className="h-[52px] w-full rounded-[12px] bg-[var(--crm-brand)] text-[17px] font-medium text-[var(--crm-surface-2)] shadow-[0_14px_30px_rgba(13,59,102,0.35)] hover:bg-[var(--crm-brand-strong)]"
                >
                  {saving ? "Salvando..." : "Salvar nova senha"}
                </Button>
              </form>
            )}
          </div>
        </div>

        <div className="relative hidden lg:block lg:w-[51%]">
          <div className="relative h-full overflow-hidden rounded-[24px]">
            <img
              src="/login-truck-forest.jpg"
              alt="Caminhao verde em estrada cercada por mata"
              className="absolute inset-0 h-full w-full object-cover object-center"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
