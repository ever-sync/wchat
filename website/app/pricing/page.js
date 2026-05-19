'use client'
import Layout from "@/components/layout/Layout"
import Pricing from "@/components/sections/home1/Pricing"
import Link from "next/link"
import { useState } from "react"
export default function pricing() {

    const [activeIndex, setActiveIndex] = useState(1)
    const handleOnClick = (index) => {
        setActiveIndex(index)
    }

    return (
        <>
            <Layout headerStyle={1} footerStyle={1} breadcrumbTitle="Planos e preços">


            <section className="pricing-style-two pricing-page sec-pad">
                <div className="auto-container">
                    <div className="sec-title centred">
                        <h6>Planos</h6>
                        <h2>Escolha o plano ideal pro seu time</h2>
                        <p>Comece em minutos. Sem cartão de crédito. Cancele quando quiser.</p>
                    </div>
                    <div className="tabs-box">
                        <div className="tab-btns tab-buttons centred">
                            <li onClick={() => handleOnClick(1)} className={activeIndex === 1 ? "tab-btn active-btn" : "tab-btn"}>Anual</li>
                            <li onClick={() => handleOnClick(2)} className={activeIndex === 2 ? "tab-btn active-btn" : "tab-btn"}>Mensal</li>
                        </div>
                        <div className="tabs-content">
                            <div className={activeIndex === 1 ? "tab active-tab" : "tab"} id="yearly">
                                <div className="row clearfix">
                                    <div className="col-lg-4 col-md-6 col-sm-12 pricing-block">
                                        <div className="pricing-table-two">
                                            <div className="inner-box">
                                                <div className="icon-box"><img src="assets/images/icons/icon-33.png" alt=""/></div>
                                                <h3>Starter</h3>
                                                <p>Para times comerciais que querem automatizar o atendimento no WhatsApp.</p>
                                                <div className="price-box clearfix">
                                                    <h4>R$ 99 <span>/ mês</span></h4>
                                                    <Link href="/contact">Escolher plano</Link>
                                                </div>
                                                <ul className="feature-list clearfix">
                                                    <li>Conversas ilimitadas</li>
                                                    <li>CRM completo</li>
                                                    <li>1 número de WhatsApp</li>
                                                    <li>2 usuários</li>
                                                    <li>Templates HSM</li>
                                                    <li>Relatórios em tempo real</li>
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-lg-4 col-md-6 col-sm-12 pricing-block">
                                        <div className="pricing-table-two active-block">
                                            <div className="inner-box">
                                                <div className="icon-box"><img src="assets/images/icons/icon-34.png" alt=""/></div>
                                                <h3>Times</h3>
                                                <p>Para times comerciais que querem automatizar o atendimento no WhatsApp.</p>
                                                <div className="price-box clearfix">
                                                    <h4>R$ 299 <span>/ mês</span></h4>
                                                    <Link href="/contact">Escolher plano</Link>
                                                </div>
                                                <ul className="feature-list clearfix">
                                                    <li>Conversas ilimitadas</li>
                                                    <li>CRM completo</li>
                                                    <li>Até 3 números de WhatsApp</li>
                                                    <li>Até 10 usuários</li>
                                                    <li>Automações de marketing</li>
                                                    <li>API e webhooks</li>
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-lg-4 col-md-6 col-sm-12 pricing-block">
                                        <div className="pricing-table-two">
                                            <div className="inner-box">
                                                <div className="icon-box"><img src="assets/images/icons/icon-35.png" alt=""/></div>
                                                <h3>Business</h3>
                                                <p>Para times comerciais que querem automatizar o atendimento no WhatsApp.</p>
                                                <div className="price-box clearfix">
                                                    <h4>R$ 699 <span>/ mês</span></h4>
                                                    <Link href="/contact">Escolher plano</Link>
                                                </div>
                                                <ul className="feature-list clearfix">
                                                    <li>Conversas ilimitadas</li>
                                                    <li>CRM completo</li>
                                                    <li>Números ilimitados</li>
                                                    <li>Usuários ilimitados</li>
                                                    <li>Automações e campanhas</li>
                                                    <li>Suporte prioritário</li>
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className={activeIndex === 2 ? "tab active-tab" : "tab"} id="monthly">
                                <div className="row clearfix">
                                    <div className="col-lg-4 col-md-6 col-sm-12 pricing-block">
                                        <div className="pricing-table-two">
                                            <div className="inner-box">
                                                <div className="icon-box"><img src="assets/images/icons/icon-33.png" alt=""/></div>
                                                <h3>Starter</h3>
                                                <p>Para times comerciais que querem automatizar o atendimento no WhatsApp.</p>
                                                <div className="price-box clearfix">
                                                    <h4>R$ 119 <span>/ mês</span></h4>
                                                    <Link href="/contact">Escolher plano</Link>
                                                </div>
                                                <ul className="feature-list clearfix">
                                                    <li>Conversas ilimitadas</li>
                                                    <li>CRM completo</li>
                                                    <li>1 número de WhatsApp</li>
                                                    <li>2 usuários</li>
                                                    <li>Templates HSM</li>
                                                    <li>Relatórios em tempo real</li>
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-lg-4 col-md-6 col-sm-12 pricing-block">
                                        <div className="pricing-table-two active-block">
                                            <div className="inner-box">
                                                <div className="icon-box"><img src="assets/images/icons/icon-34.png" alt=""/></div>
                                                <h3>Times</h3>
                                                <p>Para times comerciais que querem automatizar o atendimento no WhatsApp.</p>
                                                <div className="price-box clearfix">
                                                    <h4>R$ 349 <span>/ mês</span></h4>
                                                    <Link href="/contact">Escolher plano</Link>
                                                </div>
                                                <ul className="feature-list clearfix">
                                                    <li>Conversas ilimitadas</li>
                                                    <li>CRM completo</li>
                                                    <li>Até 3 números de WhatsApp</li>
                                                    <li>Até 10 usuários</li>
                                                    <li>Automações de marketing</li>
                                                    <li>API e webhooks</li>
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-lg-4 col-md-6 col-sm-12 pricing-block">
                                        <div className="pricing-table-two">
                                            <div className="inner-box">
                                                <div className="icon-box"><img src="assets/images/icons/icon-35.png" alt=""/></div>
                                                <h3>Business</h3>
                                                <p>Para times comerciais que querem automatizar o atendimento no WhatsApp.</p>
                                                <div className="price-box clearfix">
                                                    <h4>R$ 799 <span>/ mês</span></h4>
                                                    <Link href="/contact">Escolher plano</Link>
                                                </div>
                                                <ul className="feature-list clearfix">
                                                    <li>Conversas ilimitadas</li>
                                                    <li>CRM completo</li>
                                                    <li>Números ilimitados</li>
                                                    <li>Usuários ilimitados</li>
                                                    <li>Automações e campanhas</li>
                                                    <li>Suporte prioritário</li>
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <Pricing />


            <section className="clients-section pricing-page">
                <div className="pattern-layer" style={{ backgroundImage: "url(assets/images/shape/shape-16.png)" }}></div>
                <div className="outer-container">
                    <div className="sec-title centred">
                        <h6>[ Clientes e parceiros ]</h6>
                        <h2>Mais de 1.500 empresas usam o wChat</h2>
                        <p>Times comerciais, atendimento e suporte vendendo melhor pelo WhatsApp todos os dias.</p>
                    </div>
                    <div className="single-block">
                        <div className="animation">
                            <div className="clients-logo"><Link href="/pricing"><img src="assets/images/clients/clients-1.png" alt=""/></Link></div>
                            <div className="clients-logo"><Link href="/pricing"><img src="assets/images/clients/clients-2.png" alt=""/></Link></div>
                            <div className="clients-logo"><Link href="/pricing"><img src="assets/images/clients/clients-3.png" alt=""/></Link></div>
                            <div className="clients-logo"><Link href="/pricing"><img src="assets/images/clients/clients-4.png" alt=""/></Link></div>
                            <div className="clients-logo"><Link href="/pricing"><img src="assets/images/clients/clients-5.png" alt=""/></Link></div>
                            <div className="clients-logo"><Link href="/pricing"><img src="assets/images/clients/clients-6.png" alt=""/></Link></div>
                            <div className="clients-logo"><Link href="/pricing"><img src="assets/images/clients/clients-7.png" alt=""/></Link></div>
                            <div className="clients-logo"><Link href="/pricing"><img src="assets/images/clients/clients-1.png" alt=""/></Link></div>
                            <div className="clients-logo"><Link href="/pricing"><img src="assets/images/clients/clients-2.png" alt=""/></Link></div>
                            <div className="clients-logo"><Link href="/pricing"><img src="assets/images/clients/clients-3.png" alt=""/></Link></div>
                            <div className="clients-logo"><Link href="/pricing"><img src="assets/images/clients/clients-1.png" alt=""/></Link></div>
                            <div className="clients-logo"><Link href="/pricing"><img src="assets/images/clients/clients-2.png" alt=""/></Link></div>
                            <div className="clients-logo"><Link href="/pricing"><img src="assets/images/clients/clients-3.png" alt=""/></Link></div>
                            <div className="clients-logo"><Link href="/pricing"><img src="assets/images/clients/clients-4.png" alt=""/></Link></div>
                            <div className="clients-logo"><Link href="/pricing"><img src="assets/images/clients/clients-5.png" alt=""/></Link></div>
                            <div className="clients-logo"><Link href="/pricing"><img src="assets/images/clients/clients-6.png" alt=""/></Link></div>
                            <div className="clients-logo"><Link href="/pricing"><img src="assets/images/clients/clients-7.png" alt=""/></Link></div>
                            <div className="clients-logo"><Link href="/pricing"><img src="assets/images/clients/clients-1.png" alt=""/></Link></div>
                            <div className="clients-logo"><Link href="/pricing"><img src="assets/images/clients/clients-2.png" alt=""/></Link></div>
                            <div className="clients-logo"><Link href="/pricing"><img src="assets/images/clients/clients-3.png" alt=""/></Link></div>
                            <div className="clients-logo"><Link href="/pricing"><img src="assets/images/clients/clients-1.png" alt=""/></Link></div>
                            <div className="clients-logo"><Link href="/pricing"><img src="assets/images/clients/clients-2.png" alt=""/></Link></div>
                            <div className="clients-logo"><Link href="/pricing"><img src="assets/images/clients/clients-3.png" alt=""/></Link></div>
                            <div className="clients-logo"><Link href="/pricing"><img src="assets/images/clients/clients-4.png" alt=""/></Link></div>
                            <div className="clients-logo"><Link href="/pricing"><img src="assets/images/clients/clients-5.png" alt=""/></Link></div>
                            <div className="clients-logo"><Link href="/pricing"><img src="assets/images/clients/clients-6.png" alt=""/></Link></div>
                            <div className="clients-logo"><Link href="/pricing"><img src="assets/images/clients/clients-7.png" alt=""/></Link></div>
                            <div className="clients-logo"><Link href="/pricing"><img src="assets/images/clients/clients-1.png" alt=""/></Link></div>
                            <div className="clients-logo"><Link href="/pricing"><img src="assets/images/clients/clients-2.png" alt=""/></Link></div>
                            <div className="clients-logo"><Link href="/pricing"><img src="assets/images/clients/clients-3.png" alt=""/></Link></div>
                            <div className="clients-logo"><Link href="/pricing"><img src="assets/images/clients/clients-1.png" alt=""/></Link></div>
                            <div className="clients-logo"><Link href="/pricing"><img src="assets/images/clients/clients-2.png" alt=""/></Link></div>
                            <div className="clients-logo"><Link href="/pricing"><img src="assets/images/clients/clients-3.png" alt=""/></Link></div>
                            <div className="clients-logo"><Link href="/pricing"><img src="assets/images/clients/clients-4.png" alt=""/></Link></div>
                            <div className="clients-logo"><Link href="/pricing"><img src="assets/images/clients/clients-5.png" alt=""/></Link></div>
                            <div className="clients-logo"><Link href="/pricing"><img src="assets/images/clients/clients-6.png" alt=""/></Link></div>
                            <div className="clients-logo"><Link href="/pricing"><img src="assets/images/clients/clients-7.png" alt=""/></Link></div>
                            <div className="clients-logo"><Link href="/pricing"><img src="assets/images/clients/clients-1.png" alt=""/></Link></div>
                            <div className="clients-logo"><Link href="/pricing"><img src="assets/images/clients/clients-2.png" alt=""/></Link></div>
                            <div className="clients-logo"><Link href="/pricing"><img src="assets/images/clients/clients-3.png" alt=""/></Link></div>
                            <div className="clients-logo"><Link href="/pricing"><img src="assets/images/clients/clients-1.png" alt=""/></Link></div>
                            <div className="clients-logo"><Link href="/pricing"><img src="assets/images/clients/clients-2.png" alt=""/></Link></div>
                            <div className="clients-logo"><Link href="/pricing"><img src="assets/images/clients/clients-3.png" alt=""/></Link></div>
                            <div className="clients-logo"><Link href="/pricing"><img src="assets/images/clients/clients-4.png" alt=""/></Link></div>
                            <div className="clients-logo"><Link href="/pricing"><img src="assets/images/clients/clients-5.png" alt=""/></Link></div>
                            <div className="clients-logo"><Link href="/pricing"><img src="assets/images/clients/clients-6.png" alt=""/></Link></div>
                            <div className="clients-logo"><Link href="/pricing"><img src="assets/images/clients/clients-7.png" alt=""/></Link></div>
                            <div className="clients-logo"><Link href="/pricing"><img src="assets/images/clients/clients-1.png" alt=""/></Link></div>
                            <div className="clients-logo"><Link href="/pricing"><img src="assets/images/clients/clients-2.png" alt=""/></Link></div>
                            <div className="clients-logo"><Link href="/pricing"><img src="assets/images/clients/clients-3.png" alt=""/></Link></div>
                        </div>
                    </div>
                    <div className="single-block">
                        <div className="animation">
                            <div className="clients-logo"><Link href="/pricing"><img src="assets/images/clients/clients-8.png" alt=""/></Link></div>
                            <div className="clients-logo"><Link href="/pricing"><img src="assets/images/clients/clients-9.png" alt=""/></Link></div>
                            <div className="clients-logo"><Link href="/pricing"><img src="assets/images/clients/clients-10.png" alt=""/></Link></div>
                            <div className="clients-logo"><Link href="/pricing"><img src="assets/images/clients/clients-11.png" alt=""/></Link></div>
                            <div className="clients-logo"><Link href="/pricing"><img src="assets/images/clients/clients-12.png" alt=""/></Link></div>
                            <div className="clients-logo"><Link href="/pricing"><img src="assets/images/clients/clients-12.png" alt=""/></Link></div>
                            <div className="clients-logo"><Link href="/pricing"><img src="assets/images/clients/clients-12.png" alt=""/></Link></div>
                            <div className="clients-logo"><Link href="/pricing"><img src="assets/images/clients/clients-8.png" alt=""/></Link></div>
                            <div className="clients-logo"><Link href="/pricing"><img src="assets/images/clients/clients-9.png" alt=""/></Link></div>
                            <div className="clients-logo"><Link href="/pricing"><img src="assets/images/clients/clients-10.png" alt=""/></Link></div>
                            <div className="clients-logo"><Link href="/pricing"><img src="assets/images/clients/clients-8.png" alt=""/></Link></div>
                            <div className="clients-logo"><Link href="/pricing"><img src="assets/images/clients/clients-9.png" alt=""/></Link></div>
                            <div className="clients-logo"><Link href="/pricing"><img src="assets/images/clients/clients-10.png" alt=""/></Link></div>
                            <div className="clients-logo"><Link href="/pricing"><img src="assets/images/clients/clients-11.png" alt=""/></Link></div>
                            <div className="clients-logo"><Link href="/pricing"><img src="assets/images/clients/clients-12.png" alt=""/></Link></div>
                            <div className="clients-logo"><Link href="/pricing"><img src="assets/images/clients/clients-12.png" alt=""/></Link></div>
                            <div className="clients-logo"><Link href="/pricing"><img src="assets/images/clients/clients-12.png" alt=""/></Link></div>
                            <div className="clients-logo"><Link href="/pricing"><img src="assets/images/clients/clients-8.png" alt=""/></Link></div>
                            <div className="clients-logo"><Link href="/pricing"><img src="assets/images/clients/clients-9.png" alt=""/></Link></div>
                            <div className="clients-logo"><Link href="/pricing"><img src="assets/images/clients/clients-10.png" alt=""/></Link></div>
                            <div className="clients-logo"><Link href="/pricing"><img src="assets/images/clients/clients-8.png" alt=""/></Link></div>
                            <div className="clients-logo"><Link href="/pricing"><img src="assets/images/clients/clients-9.png" alt=""/></Link></div>
                            <div className="clients-logo"><Link href="/pricing"><img src="assets/images/clients/clients-10.png" alt=""/></Link></div>
                            <div className="clients-logo"><Link href="/pricing"><img src="assets/images/clients/clients-11.png" alt=""/></Link></div>
                            <div className="clients-logo"><Link href="/pricing"><img src="assets/images/clients/clients-12.png" alt=""/></Link></div>
                            <div className="clients-logo"><Link href="/pricing"><img src="assets/images/clients/clients-12.png" alt=""/></Link></div>
                            <div className="clients-logo"><Link href="/pricing"><img src="assets/images/clients/clients-12.png" alt=""/></Link></div>
                            <div className="clients-logo"><Link href="/pricing"><img src="assets/images/clients/clients-8.png" alt=""/></Link></div>
                            <div className="clients-logo"><Link href="/pricing"><img src="assets/images/clients/clients-9.png" alt=""/></Link></div>
                            <div className="clients-logo"><Link href="/pricing"><img src="assets/images/clients/clients-10.png" alt=""/></Link></div>
                            <div className="clients-logo"><Link href="/pricing"><img src="assets/images/clients/clients-8.png" alt=""/></Link></div>
                            <div className="clients-logo"><Link href="/pricing"><img src="assets/images/clients/clients-9.png" alt=""/></Link></div>
                            <div className="clients-logo"><Link href="/pricing"><img src="assets/images/clients/clients-10.png" alt=""/></Link></div>
                            <div className="clients-logo"><Link href="/pricing"><img src="assets/images/clients/clients-11.png" alt=""/></Link></div>
                            <div className="clients-logo"><Link href="/pricing"><img src="assets/images/clients/clients-12.png" alt=""/></Link></div>
                            <div className="clients-logo"><Link href="/pricing"><img src="assets/images/clients/clients-12.png" alt=""/></Link></div>
                            <div className="clients-logo"><Link href="/pricing"><img src="assets/images/clients/clients-12.png" alt=""/></Link></div>
                            <div className="clients-logo"><Link href="/pricing"><img src="assets/images/clients/clients-8.png" alt=""/></Link></div>
                            <div className="clients-logo"><Link href="/pricing"><img src="assets/images/clients/clients-9.png" alt=""/></Link></div>
                            <div className="clients-logo"><Link href="/pricing"><img src="assets/images/clients/clients-10.png" alt=""/></Link></div>
                            <div className="clients-logo"><Link href="/pricing"><img src="assets/images/clients/clients-8.png" alt=""/></Link></div>
                            <div className="clients-logo"><Link href="/pricing"><img src="assets/images/clients/clients-9.png" alt=""/></Link></div>
                            <div className="clients-logo"><Link href="/pricing"><img src="assets/images/clients/clients-10.png" alt=""/></Link></div>
                            <div className="clients-logo"><Link href="/pricing"><img src="assets/images/clients/clients-11.png" alt=""/></Link></div>
                            <div className="clients-logo"><Link href="/pricing"><img src="assets/images/clients/clients-12.png" alt=""/></Link></div>
                            <div className="clients-logo"><Link href="/pricing"><img src="assets/images/clients/clients-12.png" alt=""/></Link></div>
                            <div className="clients-logo"><Link href="/pricing"><img src="assets/images/clients/clients-12.png" alt=""/></Link></div>
                            <div className="clients-logo"><Link href="/pricing"><img src="assets/images/clients/clients-8.png" alt=""/></Link></div>
                            <div className="clients-logo"><Link href="/pricing"><img src="assets/images/clients/clients-9.png" alt=""/></Link></div>
                            <div className="clients-logo"><Link href="/pricing"><img src="assets/images/clients/clients-10.png" alt=""/></Link></div>
                        </div>
                    </div>
                    <div className="btn-box centred">
                        <Link href="/contact" className="theme-btn btn-one">Testar o wChat grátis</Link>
                    </div>
                </div>
            </section>
            
            </Layout>
        </>
    )
}