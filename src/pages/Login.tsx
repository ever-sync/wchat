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

export default function Login() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberDevice, setRememberDevice] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const recaptchaRef = useRef<ReCAPTCHA>(null);
  const recaptchaRequired = isRecaptchaEnabled();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signIn } = useAuth();

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

    const { error } = await signIn({ email, password: senha });
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

  const inputClass =
    "h-10 w-full rounded-md border border-input bg-wchat-50 px-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary sm:h-11";

  return (
    <div className="flex h-[100dvh] max-h-[100dvh] w-full flex-col overflow-hidden bg-background">
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden lg:flex-row">
        <aside className="relative hidden h-full min-h-0 overflow-hidden bg-wchat-100 lg:block lg:w-[52%] xl:w-[54%]">
          <img
            src="/login-hero.png"
            alt="wChat — converse, entenda, resolva"
            className="h-full w-full object-cover object-center"
          />
        </aside>

        <aside className="relative h-[clamp(72px,16dvh,120px)] shrink-0 overflow-hidden bg-wchat-100 [@media(max-height:640px)]:hidden lg:hidden">
          <img
            src="/login-hero.png"
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
