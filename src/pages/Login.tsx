import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import type ReCAPTCHA from "react-google-recaptcha";
import { ChevronDown, Eye, EyeOff } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { LoginRecaptcha } from "@/components/auth/LoginRecaptcha";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useAppStore } from "@/store/useAppStore";
import { isRecaptchaEnabled, verifyRecaptchaToken } from "@/lib/recaptcha";

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38z" />
    </svg>
  );
}

export default function Login() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberDevice, setRememberDevice] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const recaptchaRef = useRef<ReCAPTCHA>(null);
  const recaptchaRequired = isRecaptchaEnabled();
  const [mfaStep, setMfaStep] = useState<{ factorId: string } | null>(null);
  const [mfaCode, setMfaCode] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signIn, verifyMfa, signInWithGoogle } = useAuth();

  const finishLogin = () => {
    if (rememberDevice) {
      localStorage.setItem("wchat-remember-device", "1");
    } else {
      localStorage.removeItem("wchat-remember-device");
    }
    useAppStore.getState().addNotification({
      tipo: "sucesso",
      titulo: "Login realizado",
      descricao: "Sua sessão foi iniciada com sucesso.",
    });
    navigate("/inbox");
  };

  const handleVerifyMfa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mfaStep) return;
    setLoading(true);
    const { error } = await verifyMfa(mfaStep.factorId, mfaCode.trim());
    setLoading(false);
    if (error) {
      toast({ title: "Código inválido", description: error, variant: "destructive" });
      return;
    }
    setMfaStep(null);
    setMfaCode("");
    finishLogin();
  };

  const handleGoogle = async () => {
    setLoading(true);
    const { error } = await signInWithGoogle();
    if (error) {
      setLoading(false);
      toast({ title: "Não foi possível entrar com o Google", description: error, variant: "destructive" });
    }
    // Sucesso => redireciona para o Google (a página será trocada).
  };

  useEffect(() => {
    document.documentElement.classList.add("login-screen");
    return () => document.documentElement.classList.remove("login-screen");
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (recaptchaRequired && !captchaToken) {
      toast({
        title: "Confirme que voce nao e um robo",
        description: "Marque a caixa do reCAPTCHA antes de continuar.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    if (recaptchaRequired && captchaToken) {
      const captcha = await verifyRecaptchaToken(captchaToken);
      if (!captcha.ok) {
        setLoading(false);
        recaptchaRef.current?.reset();
        setCaptchaToken(null);
        toast({
          title: "reCAPTCHA invalido",
          description: captcha.error ?? "Tente marcar a caixa novamente.",
          variant: "destructive",
        });
        return;
      }
    }

    const { error, mfaRequired, factorId } = await signIn({ email, password: senha });
    setLoading(false);

    if (error) {
      recaptchaRef.current?.reset();
      setCaptchaToken(null);
      toast({
        title: "Não foi possível entrar",
        description: error,
        variant: "destructive",
      });
      useAppStore.getState().addNotification({
        tipo: "erro",
        titulo: "Não foi possível entrar",
        descricao: error,
      });
      return;
    }

    if (mfaRequired) {
      if (!factorId) {
        toast({
          title: "Verificação em duas etapas",
          description: "Não foi possível iniciar a verificação. Tente entrar novamente.",
          variant: "destructive",
        });
        return;
      }
      setMfaStep({ factorId });
      return;
    }

    finishLogin();
  };

  const inputClass =
    "h-10 w-full rounded-md border border-input bg-wchat-50 px-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary sm:h-11";

  return (
    <div className="flex h-[100dvh] max-h-[100dvh] w-full flex-col overflow-hidden bg-background">
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden lg:flex-row">
        <aside className="relative hidden h-full min-h-0 overflow-hidden bg-wchat-100 lg:block lg:w-[52%] xl:w-[54%]">
          <img
            src="/login-hero.jpg"
            alt="wChat — converse, entenda, resolva"
            className="h-full w-full object-cover object-center"
          />
        </aside>

        <aside className="relative h-[clamp(72px,16dvh,120px)] shrink-0 overflow-hidden bg-wchat-100 [@media(max-height:640px)]:hidden lg:hidden">
          <img
            src="/login-hero.jpg"
            alt="wChat — converse, entenda, resolva"
            className="h-full w-full object-cover object-[center_20%]"
          />
        </aside>

        <main className="relative flex min-h-0 flex-1 flex-col overflow-hidden bg-background">
          <div className="hidden shrink-0 items-center justify-end gap-3 px-8 py-4 lg:flex xl:px-10">
            <span className="text-sm text-muted-foreground">Ainda não tem uma conta?</span>
            <Link
              to="/cadastro"
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-wchat-700"
            >
              Comece o teste grátis
            </Link>
          </div>

          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <div className="flex min-h-0 flex-1 items-center justify-center overflow-y-auto overscroll-y-contain px-4 py-3 sm:px-6 lg:px-10 lg:py-2 xl:px-12">
              <div className="my-auto w-full max-w-[400px] shrink-0 rounded-xl bg-card px-5 py-5 shadow-[0_1px_8px_hsl(var(--wchat-purple-600)/0.1),0_4px_24px_hsl(var(--wchat-purple-600)/0.06)] sm:px-7 sm:py-6 lg:px-8 lg:py-7">
                <h1 className="text-2xl font-bold text-wchat-900 sm:text-[28px]">Olá!</h1>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  Entre para gerenciar suas conversas no WhatsApp.
                </p>

                {mfaStep ? (
                  <form onSubmit={handleVerifyMfa} className="mt-4 space-y-3 sm:mt-5 sm:space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Verificação em duas etapas. Digite o código de 6 dígitos do seu aplicativo autenticador.
                    </p>
                    <input
                      autoFocus
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      maxLength={6}
                      value={mfaCode}
                      onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ""))}
                      placeholder="000000"
                      className={`${inputClass} text-center tracking-[0.4em]`}
                    />
                    <button
                      type="submit"
                      disabled={loading || mfaCode.length < 6}
                      className="h-11 w-full rounded-md bg-primary text-sm font-semibold text-primary-foreground transition-colors hover:bg-wchat-700 disabled:opacity-60 sm:h-12 sm:text-[15px]"
                    >
                      {loading ? "Verificando..." : "Confirmar código"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setMfaStep(null);
                        setMfaCode("");
                      }}
                      className="w-full text-sm text-muted-foreground hover:text-foreground"
                    >
                      Voltar
                    </button>
                  </form>
                ) : (
                <>
                <form onSubmit={handleLogin} className="mt-4 space-y-3 sm:mt-5 sm:space-y-4">
                  <div className="space-y-1.5">
                    <label htmlFor="email" className="block text-[13px] font-medium text-foreground">
                      Email
                    </label>
                    <input
                      id="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={inputClass}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="senha" className="block text-[13px] font-medium text-foreground">
                      Senha
                    </label>
                    <div className="relative">
                      <input
                        id="senha"
                        type={showPassword ? "text" : "password"}
                        autoComplete="current-password"
                        required
                        value={senha}
                        onChange={(e) => setSenha(e.target.value)}
                        className={`${inputClass} pr-10`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <Link
                    to="/recuperar-senha"
                    className="inline-block text-sm text-primary hover:underline"
                  >
                    Esqueceu sua senha?
                  </Link>

                  <LoginRecaptcha
                    ref={recaptchaRef}
                    onChange={setCaptchaToken}
                    onExpired={() => setCaptchaToken(null)}
                  />

                  <label className="flex cursor-pointer items-start gap-2.5">
                    <Checkbox
                      id="remember"
                      checked={rememberDevice}
                      onCheckedChange={(checked) => setRememberDevice(checked === true)}
                      className="mt-0.5 border-input data-[state=checked]:border-primary data-[state=checked]:bg-primary"
                    />
                    <span className="text-[13px] leading-snug text-muted-foreground">
                      Lembrar deste dispositivo por 14 dias
                    </span>
                  </label>

                  <button
                    type="submit"
                    disabled={loading || (recaptchaRequired && !captchaToken)}
                    className="h-11 w-full rounded-md bg-primary text-sm font-semibold text-primary-foreground transition-colors hover:bg-wchat-700 disabled:opacity-60 sm:h-12 sm:text-[15px]"
                  >
                    {loading ? "Entrando..." : "Avançar"}
                  </button>
                </form>

                <div className="my-4 flex items-center gap-3">
                  <span className="h-px flex-1 bg-border" />
                  <span className="text-xs text-muted-foreground">ou</span>
                  <span className="h-px flex-1 bg-border" />
                </div>
                <button
                  type="button"
                  onClick={() => void handleGoogle()}
                  disabled={loading}
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-md border border-input bg-background text-sm font-medium text-foreground transition-colors hover:bg-secondary/60 disabled:opacity-60 sm:h-12"
                >
                  <GoogleIcon className="h-4 w-4" />
                  Entrar com Google
                </button>
                </>
                )}
              </div>
            </div>

            <footer className="flex shrink-0 items-center justify-between px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 text-xs sm:px-6 lg:px-10 xl:px-12">
              <a href="#" className="text-muted-foreground hover:text-foreground">
                Política de privacidade
              </a>
              <button
                type="button"
                className="inline-flex items-center gap-1 text-primary hover:underline"
              >
                Português
                <ChevronDown className="h-3.5 w-3.5" />
              </button>
            </footer>
          </div>
        </main>
      </div>
    </div>
  );
}
