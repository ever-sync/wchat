import Link from "next/link";
import WchatLayout from "@/components/wchat/WchatLayout";

export default function register() {
  return (
    <WchatLayout breadcrumbTitle="Criar conta">
      <section className="contact-sec space overflow-hidden">
        <div className="container th-container4">
          <div className="row justify-content-center">
            <div className="col-lg-6 col-xl-5">
              <div className="contact-form rounded-3 border border-[var(--th-border-color)] bg-white p-4 p-md-5 shadow-sm">
                <h3 className="title mb-1">Comece seu teste grátis</h3>
                <p className="mb-4 text-body">7 dias grátis. Sem cartão de crédito.</p>
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
                <p className="mt-4 mb-0 text-center text-body">
                  Já tem conta? <Link href="/login">Entrar</Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </WchatLayout>
  );
}
