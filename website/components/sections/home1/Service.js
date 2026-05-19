import Link from "next/link"

export default function Service() {
    return (
        <> 

        <section className="service-section bg-color-1">
            <div className="auto-container">
                <div className="row clearfix">
                    <div className="col-lg-3 col-md-12 col-sm-12 service-block">
                        <div className="service-block-one">
                            <div className="inner-box">
                                <div className="content-box">
                                    <h3><Link href="/case-details"><span>CRM no</span><span>WhatsApp</span></Link></h3>
                                    <p>Funis, etapas e negociações sincronizadas em tempo real entre todo o time.</p>
                                    <div className="link-box">
                                        <div className="icon-box"><img src="assets/images/icons/icon-5.png" alt=""/></div>
                                        <Link href="/case-details">Saiba mais</Link>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="col-lg-6 col-md-12 col-sm-12 service-block">
                        <div className="service-block-two">
                            <div className="inner-box">
                                <div className="shape" style={{ backgroundImage: "url(assets/images/shape/shape-3.png)" }}></div>
                                <div className="sec-title light">
                                    <h6>[ Recursos ]</h6>
                                    <h2>Recursos mais usados</h2>
                                </div>
                                <div className="text-box">
                                    <p>Tudo o que seu time precisa pra vender e atender pelo WhatsApp em um só lugar.</p>
                                    <Link href="/case-details" className="theme-btn btn-two">Ver todos os recursos</Link>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="col-lg-3 col-md-12 col-sm-12 service-block">
                        <div className="service-block-one">
                            <div className="inner-box">
                                <div className="content-box">
                                    <h3><Link href="/case-details"><span>Automações de</span><span>Marketing</span></Link></h3>
                                    <p>Fluxos automáticos para nutrir leads, requalificar e fechar venda sem esforço manual.</p>
                                    <div className="link-box">
                                        <div className="icon-box"><img src="assets/images/icons/icon-6.png" alt=""/></div>
                                        <Link href="/case-details">Saiba mais</Link>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="col-lg-6 col-md-12 col-sm-12 service-block">
                        <div className="service-block-one">
                            <div className="inner-box">
                                <div className="row clearfix">
                                    <div className="col-lg-6 col-md-6 col-sm-12 content-column">
                                        <div className="content-box">
                                            <h3><Link href="/case-details"><span>Inbox</span><span>Compartilhado</span></Link></h3>
                                            <p>Toda a equipe atendendo no mesmo WhatsApp, com filas, etiquetas e respostas rápidas.</p>
                                            <div className="link-box">
                                                <div className="icon-box"><img src="assets/images/icons/icon-7.png" alt=""/></div>
                                                <Link href="/case-details">Saiba mais</Link>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-lg-6 col-md-6 col-sm-12 image-column">
                                        <div className="image-box">
                                            <figure className="image"><img src="assets/images/resource/dashboard-2.jpg" alt=""/></figure>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="col-lg-6 col-md-12 col-sm-12 service-block">
                        <div className="service-block-one">
                            <div className="inner-box">
                                <div className="row clearfix">
                                    <div className="col-lg-6 col-md-6 col-sm-12 content-column">
                                        <div className="content-box">
                                            <h3><Link href="/case-details"><span>Relatórios</span><span>e Funis</span></Link></h3>
                                            <p>Acompanhe conversão por etapa, performance do time e SLA de atendimento em tempo real.</p>
                                            <div className="link-box">
                                                <div className="icon-box"><img src="assets/images/icons/icon-8.png" alt=""/></div>
                                                <Link href="/case-details">Saiba mais</Link>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-lg-6 col-md-6 col-sm-12 image-column">
                                        <div className="image-box">
                                            <figure className="image"><img src="assets/images/resource/dashboard-3.jpg" alt=""/></figure>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        </>
    )
}
