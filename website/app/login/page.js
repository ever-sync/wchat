import Link from "next/link";
import WchatLayout from "@/components/wchat/WchatLayout";

export default function login() {
  return (
    <WchatLayout breadcrumbTitle="Entrar">
      <section className="contact-sec space overflow-hidden">
        <div className="container th-container4">
          <div className="row justify-content-center">
            <div className="col-lg-6 col-xl-5">
              <div className="contact-form rounded-3 border border-[var(--th-border-color)] bg-white p-4 p-md-5 shadow-sm">
                <h3 className="title mb-1">Bem-vindo de volta</h3>
                <p className="mb-4 text-body">Acesse sua conta wChat</p>
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
                  <div className="d-flex align-items-center justify-content-between mb-4">
                    <label className="d-flex align-items-center gap-2">
                      <input className="check" type="checkbox" id="remember" />
                      <span>Lembrar-me</span>
                    </label>
                    <Link href="/forgot-password" className="text-decoration-none">
                      Esqueci a senha
                    </Link>
                  </div>
                  <button type="submit" className="th-btn2 btn-gradient w-100">
                    Entrar
                  </button>
                </form>
                <p className="mt-4 mb-0 text-center text-body">
                  Ainda não tem conta? <Link href="/register">Cadastre-se</Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </WchatLayout>
  );
}
