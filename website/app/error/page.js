import Link from "next/link";
import WchatLayout from "@/components/wchat/WchatLayout";

export default function error() {
  return (
    <WchatLayout breadcrumbTitle="Página não encontrada">
      <section className="space overflow-hidden">
        <div className="container th-container4">
          <div className="row justify-content-center">
            <div className="col-lg-8 col-xl-6 text-center">
              <span className="sub-title style6">Erro 404</span>
              <h2 className="sec-title style3 mt-2">Página não encontrada</h2>
              <p className="mt-3 mb-4 text-body">
                O endereço que você acessou não existe ou foi movido. Volte para a home ou fale com nosso time.
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
    </WchatLayout>
  );
}
