import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronDown, Eye, EyeOff } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useAppStore } from "@/store/useAppStore";

function WChatLogo({ className = "" }: { className?: string }) {
  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden>
        <rect width="32" height="32" rx="9" fill="hsl(var(--wchat-purple-600))" />
        <circle cx="11" cy="16" r="1.6" fill="white" />
        <circle cx="16" cy="16" r="1.6" fill="white" />
        <circle cx="21" cy="16" r="1.6" fill="white" />
      </svg>
      <span className="text-[20px] font-bold tracking-tight text-wchat-600">wChat</span>
    </div>
  );
}

function RecaptchaPlaceholder() {
  return (
    <div
      className="flex h-[74px] items-center justify-between rounded border border-border bg-muted/40 px-3"
      aria-hidden
    >
      <label className="flex cursor-default items-center gap-3">
        <span className="flex h-[28px] w-[28px] items-center justify-center rounded-sm border-2 border-border bg-card" />
        <span className="text-[14px] text-muted-foreground">Não sou um robô</span>
      </label>
      <div className="flex flex-col items-center gap-0.5 text-muted-foreground">
        <span className="text-[10px] leading-none">reCAPTCHA</span>
        <span className="text-[8px] opacity-70">Privacidade · Termos</span>
      </div>
    </div>
  );
}

export default function Login() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberDevice, setRememberDevice] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signIn } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await signIn({ email, password: senha });
    setLoading(false);

    if (error) {
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
    "h-[44px] w-full rounded-md border border-input bg-wchat-50 px-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary";

  return (
    <div className="flex min-h-screen flex-col bg-background font-poppins">
      <header className="flex shrink-0 items-center justify-between border-b border-border bg-card px-6 py-3.5 md:px-10">
        <WChatLogo />
        <div className="hidden items-center gap-3 sm:flex lg:hidden">
          <span className="text-[13px] text-muted-foreground">Ainda não tem uma conta?</span>
          <Link
            to="/cadastro"
            className="rounded-md bg-primary px-3.5 py-1.5 text-[13px] font-medium text-primary-foreground transition-colors hover:bg-wchat-700"
          >
            Comece o teste grátis
          </Link>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <aside className="relative hidden min-h-0 overflow-hidden bg-wchat-100 lg:block lg:w-[52%] xl:w-[54%]">
          <img
            src="/login-hero.png"
            alt="wChat — converse, entenda, resolva"
            className="h-full w-full object-cover object-center"
          />
        </aside>

        <aside className="relative h-[220px] shrink-0 overflow-hidden bg-wchat-100 sm:h-[280px] lg:hidden">
          <img
            src="/login-hero.png"
            alt="wChat — converse, entenda, resolva"
            className="h-full w-full object-cover object-[center_20%]"
          />
        </aside>

        <main className="relative flex flex-1 flex-col bg-background">
          <div className="hidden items-center justify-end gap-3 px-10 pt-7 lg:flex">
            <span className="text-sm text-muted-foreground">Ainda não tem uma conta?</span>
            <Link
              to="/cadastro"
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-wchat-700"
            >
              Comece o teste grátis
            </Link>
          </div>

          <div className="flex flex-1 items-center justify-center px-6 py-8 sm:px-10 lg:px-12 lg:py-6">
            <div className="w-full max-w-[400px] rounded-xl bg-card px-8 py-9 shadow-[0_1px_8px_hsl(var(--wchat-purple-600)/0.1),0_4px_24px_hsl(var(--wchat-purple-600)/0.06)] sm:px-10 sm:py-10">
              <h1 className="text-[32px] font-bold text-wchat-900">Olá!</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Entre para gerenciar suas conversas no WhatsApp.
              </p>

              <form onSubmit={handleLogin} className="mt-7 space-y-5">
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

                <RecaptchaPlaceholder />

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
                  disabled={loading}
                  className="h-12 w-full rounded-md bg-primary text-[15px] font-semibold text-primary-foreground transition-colors hover:bg-wchat-700 disabled:opacity-60"
                >
                  {loading ? "Entrando..." : "Avançar"}
                </button>

                <p className="text-center">
                  <button type="button" className="text-sm text-primary hover:underline">
                    Entrar com SSO
                  </button>
                </p>
              </form>
            </div>
          </div>

          <footer className="flex items-center justify-between px-6 pb-6 pt-2 text-xs sm:px-10 lg:px-12">
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
        </main>
      </div>
    </div>
  );
}
