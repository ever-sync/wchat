import Link from "next/link";
import WchatLayout from "@/components/wchat/WchatLayout";

export default function forgot_password() {
  return (
    <WchatLayout breadcrumbTitle="Recuperar senha">
      <section className="contact-sec space overflow-hidden">
        <div className="container th-container4">
          <div className="row justify-content-center">
            <div className="col-lg-6 col-xl-5">
              <div className="contact-form rounded-3 border border-[var(--th-border-color)] bg-white p-4 p-md-5 shadow-sm">
                <h3 className="title mb-1">Esqueceu a senha?</h3>
                <p className="mb-4 text-body">
                  Informe seu e-mail e enviaremos um link para redefinir sua senha.
                </p>
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
                <p className="mt-4 mb-0 text-center text-body">
                  <Link href="/login">Voltar para o login</Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </WchatLayout>
  );
}
