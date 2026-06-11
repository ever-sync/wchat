import Link from "next/link";

export default function ErrorPageSection() {
  return (
    <section className="space overflow-hidden">
      <div className="container th-container4">
        <div className="row justify-content-center">
          <div className="col-lg-8 col-xl-6 text-center">
            <div className="error-code mb-3">
              <span className="display-1 fw-bold" style={{ color: "var(--theme-color)" }}>
                404
              </span>
            </div>
            <span className="sub-title style6">Página não encontrada</span>
            <h2 className="sec-title style3 mt-2">Ops! Este endereço não existe</h2>
            <p className="mt-3 mb-4" style={{ color: "var(--body-color)" }}>
              O link pode estar incorreto ou a página foi movida. Volte para a home ou fale com nosso time.
            </p>
            <div className="btn-group justify-content-center">
              <Link href="/" className="th-btn2 btn-gradient">
                Ir para a home
              </Link>
              <Link href="/contact" className="th-btn2 style5">
                Falar com consultor
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
