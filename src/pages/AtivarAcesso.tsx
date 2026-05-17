import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, KeyRound, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAppStore } from "@/store/useAppStore";
import { resolveAuthRedirectSession } from "@/lib/auth-redirect";
import { requireSupabase } from "@/lib/supabase";

export default function AtivarAcesso() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [nome, setNome] = useState("");
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

        const user = session?.user ?? null;
        setSessionReady(Boolean(user));
        setNome((user?.user_metadata?.nome as string | undefined) ?? (user?.user_metadata?.name as string | undefined) ?? "");
        setEmail(user?.email ?? "");
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
      const d = "Use pelo menos 6 caracteres para ativar o acesso.";
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
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user?.email) {
        throw new Error("Nao foi possivel validar o convite atual. Abra novamente o link recebido por e-mail.");
      }

      const { error: authError } = await supabase.auth.updateUser({
        password: senha,
        data: {
          nome: nome.trim() || undefined,
        },
      });

      if (authError) {
        throw authError;
      }

      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          nome: nome.trim() || null,
          status: "active",
        })
        .eq("id", user.id);

      if (profileError) {
        throw profileError;
      }

      const { data: profileRow, error: profileLoadError } = await supabase
        .from("profiles")
        .select("tenant_id")
        .eq("id", user.id)
        .single();

      if (profileLoadError || !profileRow?.tenant_id) {
        throw profileLoadError ?? new Error("Nao foi possivel validar o tenant do convite.");
      }

      const { error: inviteError } = await supabase.rpc("clear_collaborator_invite_after_accept", {
        target_user_id: user.id,
        target_email: user.email,
        target_tenant_id: profileRow.tenant_id,
      });

      if (inviteError) {
        throw inviteError;
      }

      const okDesc = "Sua senha foi definida e sua conta ja pode usar a plataforma.";
      toast({ title: "Acesso ativado", description: okDesc });
      useAppStore.getState().addNotification({ tipo: "sucesso", titulo: "Acesso ativado", descricao: okDesc });

      navigate("/inbox", { replace: true });
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Tente novamente.";
      toast({ title: "Nao foi possivel ativar o acesso", description: msg, variant: "destructive" });
      useAppStore.getState().addNotification({
        tipo: "erro",
        titulo: "Nao foi possivel ativar o acesso",
        descricao: msg,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F9F6FD] p-2 md:p-4">
      <div className="mx-auto flex min-h-[calc(100vh-1rem)] max-w-[1520px] rounded-[28px] border border-[#d9e0d3] bg-white p-[10px] shadow-[0_20px_70px_rgba(84,95,101,0.08)] md:min-h-[calc(100vh-2rem)]">
        <div className="flex w-full items-center justify-center px-6 py-8 sm:px-10 lg:w-[49%] lg:px-16">
          <div className="w-full max-w-[430px]">
            <div className="mb-8 text-center lg:text-left">
              <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#dce3d6] bg-[#f3f7ef] px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-[#4E1BB1]">
                <KeyRound className="h-3.5 w-3.5" />
                Primeiro acesso
              </p>
              <h1 className="text-[40px] font-semibold tracking-[-0.03em] text-[#514E5F]">
                Ativar acesso
              </h1>
              <p className="mt-3 text-[18px] text-[#7d8784]">
                Defina sua senha para entrar como colaborador no tenant convidado.
              </p>
            </div>

            {loading ? (
              <div className="rounded-[18px] border border-[#dce3d6] bg-[#fbfcf9] px-5 py-10 text-center text-sm text-[#7d8784]">
                <Loader2 className="mx-auto mb-3 h-5 w-5 animate-spin text-[#4E1BB1]" />
                Validando seu convite...
              </div>
            ) : !sessionReady ? (
              <div className="space-y-4 rounded-[18px] border border-[#e2d8c7] bg-[#fbfaf6] p-5">
                <p className="text-sm text-[#7d8784]">
                  Este link nao criou uma sessao valida no navegador. Abra novamente o convite recebido por e-mail.
                </p>
                <Button asChild className="w-full bg-[#4E1BB1] text-[#e9edef] hover:bg-[#4015A5]">
                  <Link to="/login">Voltar para o login</Link>
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2.5">
                  <LabelText>Nome</LabelText>
                  <Input
                    value={nome}
                    onChange={(event) => setNome(event.target.value)}
                    placeholder="Seu nome"
                    className="h-[50px] rounded-[12px] border-[#dbe2d5] bg-[#fbfcf9] px-4 text-[15px] text-[#514E5F] shadow-none placeholder:text-[#a4aeab] focus-visible:ring-1 focus-visible:ring-[#4E1BB1]"
                  />
                </div>

                <div className="space-y-2.5">
                  <LabelText>E-mail</LabelText>
                  <Input
                    value={email}
                    disabled
                    className="h-[50px] rounded-[12px] border-[#dbe2d5] bg-[#f4f6f2] px-4 text-[15px] text-[#7d8784] shadow-none"
                  />
                </div>

                <div className="space-y-2.5">
                  <LabelText>Nova senha</LabelText>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={senha}
                      onChange={(event) => setSenha(event.target.value)}
                      placeholder="Crie uma senha"
                      className="h-[50px] rounded-[12px] border-[#dbe2d5] bg-[#fbfcf9] px-4 pr-12 text-[15px] text-[#514E5F] shadow-none placeholder:text-[#a4aeab] focus-visible:ring-1 focus-visible:ring-[#4E1BB1]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((current) => !current)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8d9794] transition-colors hover:text-[#514E5F]"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2.5">
                  <LabelText>Confirmar senha</LabelText>
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={confirmarSenha}
                    onChange={(event) => setConfirmarSenha(event.target.value)}
                    placeholder="Repita a senha"
                    className="h-[50px] rounded-[12px] border-[#dbe2d5] bg-[#fbfcf9] px-4 text-[15px] text-[#514E5F] shadow-none placeholder:text-[#a4aeab] focus-visible:ring-1 focus-visible:ring-[#4E1BB1]"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={saving}
                  className="h-[52px] w-full rounded-[12px] bg-[#4E1BB1] text-[17px] font-medium text-[#e9edef] shadow-[0_14px_30px_rgba(13,59,102,0.35)] hover:bg-[#4015A5]"
                >
                  {saving ? "Ativando..." : "Ativar acesso"}
                </Button>
              </form>
            )}
          </div>
        </div>

        <div className="relative hidden lg:block lg:w-[51%]">
          <div className="relative h-full overflow-hidden rounded-[24px]">
            <img
              src="/login-truck-forest.png"
              alt="Caminhao verde em estrada cercada por mata"
              className="absolute inset-0 h-full w-full object-cover object-center"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function LabelText({ children }: { children: string }) {
  return <label className="block text-[15px] font-medium text-[#514E5F]">{children}</label>;
}
