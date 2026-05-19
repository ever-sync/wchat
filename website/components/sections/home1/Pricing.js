'use client'
import Link from "next/link"
import { useState } from "react"
export default function Pricing() {

    const [activeIndex, setActiveIndex] = useState(1)
    const handleOnClick = (index) => {
        setActiveIndex(index)
    }
    
    return (
        <>
        <section className="pricing-section bg-color-2">
            <div className="auto-container">
                <div className="inner-container">
                    <div className="tabs-box">
                        <div className="row clearfix">
                            <div className="col-lg-6 col-md-12 col-sm-12 left-column">
                                <div className="left-content">
                                    <div className="sec-title light">
                                        <h6>Planos</h6>
                                        <h2>Planos que cabem no seu negócio</h2>
                                        <p>Escolha o plano ideal para o tamanho do seu time e comece a vender mais pelo WhatsApp hoje mesmo.</p>
                                    </div>
                                    <div className="tab-btn-one">
                                        <ul className="tab-btns tab-buttons clearfix">
                                            <li onClick={() => handleOnClick(1)} className={activeIndex === 1 ? "tab-btn active-btn" : "tab-btn"}>Starter <img src="assets/images/icons/icon-15.png" alt=""/></li>
                                            <li onClick={() => handleOnClick(2)} className={activeIndex === 2 ? "tab-btn active-btn" : "tab-btn"}>Times <img src="assets/images/icons/icon-16.png" alt=""/></li>
                                            <li onClick={() => handleOnClick(3)} className={activeIndex === 3 ? "tab-btn active-btn" : "tab-btn"}>Business <img src="assets/images/icons/icon-17.png" alt=""/></li>
                                        </ul>
                                    </div>
                                    <div className="lower-box">
                                        <div className="shape" style={{ backgroundImage: "url(assets/images/shape/shape-17.png)" }}></div>
                                        <div className="icon-box"><img src="assets/images/icons/icon-14.png" alt=""/></div>
                                        <h3>Está em dúvida? Fale com a gente</h3>
                                        <Link href="mailto:contato@wchat.com.br">contato@wchat.com.br</Link>
                                    </div>
                                </div>
                            </div>
                            <div className="col-lg-6 col-md-12 col-sm-12 right-column">
                                <div className="tabs-content">
                                    <div className={activeIndex === 1 ? "tab active-tab" : "tab"}>
                                        <div className="tabs-box-2">
                                            <div className="tab-btn-two">
                                                <ul className="tab-btns tab-buttons-2 clearfix">
                                                    <li>
                                                        <div className="radio-box">
                                                            <input type="radio" id="checkbox1" name="same" defaultChecked/>
                                                            <label htmlFor="checkbox1">Anual</label>
                                                        </div>
                                                    </li>
                                                    <li>
                                                        <div className="radio-box">
                                                            <input type="radio" id="checkbox2" name="same"/>
                                                            <label htmlFor="checkbox2">Mensal</label>
                                                        </div>
                                                    </li>
                                                </ul>
                                            </div>
                                            <div className="tabs-content-2">
                                                <div className="tab-2 active-tab-2" id="tab-12">
                                                    <div className="pricing-table-one">
                                                        <div className="shape" style={{ backgroundImage: "url(assets/images/shape/shape-21.png)" }}></div>
                                                        <span className="tags">Recomendado</span>
                                                        <div className="table-header">
                                                            <div className="icon-box"><img src="assets/images/icons/icon-18.png" alt=""/></div>
                                                            <h3>Starter</h3>
                                                            <p>Para times comerciais que querem automatizar o atendimento no WhatsApp.</p>
                                                        </div>
                                                        <div className="table-content">
                                                            <ul className="feature-list clearfix">
                                                                <li>Conversas ilimitadas</li>
                                                                <li>CRM completo</li>
                                                                <li>Automações de marketing</li>
                                                                <li>Templates HSM</li>
                                                                <li>Relatórios em tempo real</li>
                                                                <li>Suporte por WhatsApp</li>
                                                            </ul>
                                                        </div>
                                                        <div className="table-footer">
                                                            <h3>R$ 199 <span>/ mês — até 4 usuários</span></h3>
                                                            <Link href="/contact" className="theme-btn btn-two">Escolher&nbsp;plano</Link>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="tab-2" id="tab-13">
                                                    <div className="pricing-table-one">
                                                        <div className="shape" style={{ backgroundImage: "url(assets/images/shape/shape-21.png)" }}></div>
                                                        <div className="table-header">
                                                            <div className="icon-box"><img src="assets/images/icons/icon-18.png" alt=""/></div>
                                                            <h3>Starter</h3>
                                                            <p>Para times comerciais que querem automatizar o atendimento no WhatsApp.</p>
                                                        </div>
                                                        <div className="table-content">
                                                            <ul className="feature-list clearfix">
                                                                <li>Conversas ilimitadas</li>
                                                                <li>CRM completo</li>
                                                                <li>Automações de marketing</li>
                                                                <li>Templates HSM</li>
                                                                <li className="light">Relatórios em tempo real</li>
                                                                <li className="light">Suporte por WhatsApp</li>
                                                            </ul>
                                                        </div>
                                                        <div className="table-footer">
                                                            <h3>R$ 99 <span>/ mês — até 2 usuários</span></h3>
                                                            <Link href="/contact" className="theme-btn btn-two">Escolher&nbsp;plano</Link>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className={activeIndex === 2 ? "tab active-tab" : "tab"} id="teams">
                                        <div className="tabs-box-2">
                                            <div className="tab-btn-two">
                                                <ul className="tab-btns tab-buttons-2 clearfix">
                                                    <li>
                                                        <div className="radio-box">
                                                            <input type="radio" id="checkbox3" name="same" defaultChecked/>
                                                            <label htmlFor="checkbox3">Anual</label>
                                                        </div>
                                                    </li>
                                                    <li>
                                                        <div className="radio-box">
                                                            <input type="radio" id="checkbox4" name="same"/>
                                                            <label htmlFor="checkbox4">Mensal</label>
                                                        </div>
                                                    </li>
                                                </ul>
                                            </div>
                                            <div className="tabs-content-2">
                                                <div className="tab-2 active-tab-2" id="tab-14">
                                                    <div className="pricing-table-one">
                                                        <div className="shape" style={{ backgroundImage: "url(assets/images/shape/shape-21.png)" }}></div>
                                                        <span className="tags">Recomendado</span>
                                                        <div className="table-header">
                                                            <div className="icon-box"><img src="assets/images/icons/icon-18.png" alt=""/></div>
                                                            <h3>Times</h3>
                                                            <p>Para times comerciais que querem automatizar o atendimento no WhatsApp.</p>
                                                        </div>
                                                        <div className="table-content">
                                                            <ul className="feature-list clearfix">
                                                                <li>Conversas ilimitadas</li>
                                                                <li>CRM completo</li>
                                                                <li>Automações de marketing</li>
                                                                <li>Templates HSM</li>
                                                                <li>Relatórios em tempo real</li>
                                                                <li>Suporte por WhatsApp</li>
                                                            </ul>
                                                        </div>
                                                        <div className="table-footer">
                                                            <h3>R$ 199 <span>/ mês — até 4 usuários</span></h3>
                                                            <Link href="/contact" className="theme-btn btn-two">Escolher&nbsp;plano</Link>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="tab-2" id="tab-15">
                                                    <div className="pricing-table-one">
                                                        <div className="shape" style={{ backgroundImage: "url(assets/images/shape/shape-21.png)" }}></div>
                                                        <div className="table-header">
                                                            <div className="icon-box"><img src="assets/images/icons/icon-18.png" alt=""/></div>
                                                            <h3>Times</h3>
                                                            <p>Para times comerciais que querem automatizar o atendimento no WhatsApp.</p>
                                                        </div>
                                                        <div className="table-content">
                                                            <ul className="feature-list clearfix">
                                                                <li>Conversas ilimitadas</li>
                                                                <li>CRM completo</li>
                                                                <li>Automações de marketing</li>
                                                                <li>Templates HSM</li>
                                                                <li className="light">Relatórios em tempo real</li>
                                                                <li className="light">Suporte por WhatsApp</li>
                                                            </ul>
                                                        </div>
                                                        <div className="table-footer">
                                                            <h3>R$ 99 <span>/ mês — até 2 usuários</span></h3>
                                                            <Link href="/contact" className="theme-btn btn-two">Escolher&nbsp;plano</Link>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className={activeIndex === 3 ? "tab active-tab" : "tab"} id="business">
                                        <div className="tabs-box-2">
                                            <div className="tab-btn-two">
                                                <ul className="tab-btns tab-buttons-2 clearfix">
                                                    <li>
                                                        <div className="radio-box">
                                                            <input type="radio" id="checkbox5" name="same" defaultChecked/>
                                                            <label htmlFor="checkbox5">Anual</label>
                                                        </div>
                                                    </li>
                                                    <li>
                                                        <div className="radio-box">
                                                            <input type="radio" id="checkbox6" name="same"/>
                                                            <label htmlFor="checkbox6">Mensal</label>
                                                        </div>
                                                    </li>
                                                </ul>
                                            </div>
                                            <div className="tabs-content-2">
                                                <div className="tab-2 active-tab-2" id="tab-16">
                                                    <div className="pricing-table-one">
                                                        <div className="shape" style={{ backgroundImage: "url(assets/images/shape/shape-21.png)" }}></div>
                                                        <span className="tags">Recomendado</span>
                                                        <div className="table-header">
                                                            <div className="icon-box"><img src="assets/images/icons/icon-18.png" alt=""/></div>
                                                            <h3>Business</h3>
                                                            <p>Para times comerciais que querem automatizar o atendimento no WhatsApp.</p>
                                                        </div>
                                                        <div className="table-content">
                                                            <ul className="feature-list clearfix">
                                                                <li>Conversas ilimitadas</li>
                                                                <li>CRM completo</li>
                                                                <li>Automações de marketing</li>
                                                                <li>Templates HSM</li>
                                                                <li>Relatórios em tempo real</li>
                                                                <li>Suporte por WhatsApp</li>
                                                            </ul>
                                                        </div>
                                                        <div className="table-footer">
                                                            <h3>R$ 199 <span>/ mês — até 4 usuários</span></h3>
                                                            <Link href="/contact" className="theme-btn btn-two">Escolher&nbsp;plano</Link>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="tab-2" id="tab-17">
                                                    <div className="pricing-table-one">
                                                        <div className="shape" style={{ backgroundImage: "url(assets/images/shape/shape-21.png)" }}></div>
                                                        <div className="table-header">
                                                            <div className="icon-box"><img src="assets/images/icons/icon-18.png" alt=""/></div>
                                                            <h3>Business</h3>
                                                            <p>Para times comerciais que querem automatizar o atendimento no WhatsApp.</p>
                                                        </div>
                                                        <div className="table-content">
                                                            <ul className="feature-list clearfix">
                                                                <li>Conversas ilimitadas</li>
                                                                <li>CRM completo</li>
                                                                <li>Automações de marketing</li>
                                                                <li>Templates HSM</li>
                                                                <li className="light">Relatórios em tempo real</li>
                                                                <li className="light">Suporte por WhatsApp</li>
                                                            </ul>
                                                        </div>
                                                        <div className="table-footer">
                                                            <h3>R$ 99 <span>/ mês — até 2 usuários</span></h3>
                                                            <Link href="/contact" className="theme-btn btn-two">Escolher&nbsp;plano</Link>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
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
