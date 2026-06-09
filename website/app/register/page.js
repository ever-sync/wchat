import Link from "next/link";
import AuthCard from "@/components/wchat/AuthCard";
import WchatLayout from "@/components/wchat/WchatLayout";

export default function RegisterPage() {
  return (
    <WchatLayout breadcrumbTitle="Criar conta">
      <AuthCard
        title="Comece seu teste grátis"
        subtitle="7 dias grátis. Sem cartão de crédito."
        footer={
          <p className="mb-0 text-center">
            Já tem conta? <Link href="/login">Entrar</Link>
          </p>
        }
      >
        <form action="/register" method="post">
          <div className="form-group mb-3">
            <label htmlFor="name" className="form-label">
              Nome completo
            </label>
            <input
              type="text"
              className="form-control"
              name="name"
              id="name"
              placeholder="Seu nome"
              required
            />
          </div>
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
          <div className="form-group mb-4">
            <label htmlFor="password" className="form-label">
              Senha
            </label>
            <input
              type="password"
              className="form-control"
              name="password"
              id="password"
              placeholder="Mínimo 8 caracteres"
              required
            />
          </div>
          <button type="submit" className="th-btn2 btn-gradient w-100">
            Criar conta grátis
          </button>
        </form>
      </AuthCard>
    </WchatLayout>
  );
}
