import Link from "next/link"

export default function Banner() {
    return (
        <> 

        <section className="banner-style-two">
            <div className="pattern-layer">
                <div className="pattern-2" style={{ backgroundImage: "url(assets/images/shape/shape-28.png)" }}></div>
                <div className="pattern-1" style={{ backgroundImage: "url(assets/images/shape/shape-27.png)" }}></div>
            </div>
            <div className="outer-container">
                <div className="row align-items-center">
                    <div className="col-lg-6 col-md-12 col-sm-12 content-column">
                        <div className="content-box">
                            <h2>Venda mais pelo WhatsApp com o <span>wChat</span></h2>
                            <ul className="list-item clearfix">
                                <li>Sem cartão de crédito</li>
                                <li>Cancele quando quiser</li>
                                <li>7 dias grátis</li>
                            </ul>
                            <p>CRM, inbox compartilhado e automações de marketing em uma só plataforma para o seu time vender e atender melhor.</p>
                            <Link href="/pricing" className="theme-btn btn-two">Ver planos</Link>
                        </div>
                    </div>
                    <div className="col-lg-6 col-md-12 col-sm-12 image-column">
                        <div className="image-box">
                            <figure className="image image-1"><img src="assets/images/resource/dashboard-6.png" alt=""/></figure>
                            <figure className="image image-2 float-bob-y"><img src="assets/images/resource/animation-1.png" alt=""/></figure>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        </>
    )
}
