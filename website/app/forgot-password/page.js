import Link from "next/link";
import AuthCard from "@/components/wchat/AuthCard";
import WchatLayout from "@/components/wchat/WchatLayout";

export default function ForgotPasswordPage() {
  return (
    <WchatLayout breadcrumbTitle="Recuperar senha">
      <AuthCard
        title="Esqueceu a senha?"
        subtitle="Informe seu e-mail e enviaremos um link para redefinir sua senha."
        footer={
          <p className="mb-0 text-center">
            <Link href="/login">Voltar para o login</Link>
          </p>
        }
      >
        <form action="/forgot-password" method="post">
          <div className="form-group mb-4">
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
          <button type="submit" className="th-btn2 btn-gradient w-100">
            Enviar link de recuperação
          </button>
        </form>
      </AuthCard>
    </WchatLayout>
  );
}
