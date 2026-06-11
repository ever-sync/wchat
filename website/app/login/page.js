import Link from "next/link";
import AuthCard from "@/components/wchat/AuthCard";
import WchatLayout from "@/components/wchat/WchatLayout";

export default function LoginPage() {
  return (
    <WchatLayout breadcrumbTitle="Entrar">
      <AuthCard
        title="Bem-vindo de volta"
        subtitle="Acesse sua conta wChat"
        footer={
          <p className="mb-0 text-center">
            Ainda não tem conta? <Link href="/register">Cadastre-se</Link>
          </p>
        }
      >
        <form action="/login" method="post">
          <div className="form-group mb-3">
            <label htmlFor="email" className="form-label">
              E-mail
            </label>
            <input
              type="email"
              className="form-control"
              name="email"
              id="email"
              placeholder="seu@email.com"
              required
            />
          </div>
          <div className="form-group mb-3">
            <label htmlFor="password" className="form-label">
              Senha
            </label>
            <input
              type="password"
              className="form-control"
              name="password"
              id="password"
              placeholder="••••••••"
              required
            />
          </div>
          <div className="wchat-auth-row mb-4">
            <label className="d-flex align-items-center gap-2">
              <input className="check" type="checkbox" id="remember" />
              <span>Lembrar-me</span>
            </label>
            <Link href="/forgot-password">Esqueci a senha</Link>
          </div>
          <button type="submit" className="th-btn2 btn-gradient w-100">
            Entrar
          </button>
        </form>
      </AuthCard>
    </WchatLayout>
  );
}
