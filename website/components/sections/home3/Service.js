'use client'
import { useState } from "react"
export default function Service() {

    const [activeIndex, setActiveIndex] = useState(1)
    const handleOnClick = (index) => {
        setActiveIndex(index)
    }

    return (
        <>
        <section className="service-style-three centred">
            <div className="auto-container">
                <div className="sec-title">
                    <h6>[ Recursos ]</h6>
                    <h2>Recursos mais usados</h2>
                    <p>Conheça as principais ferramentas que sua equipe vai usar todos os dias no wChat.</p>
                </div>
                <div className="tabs-box">
                    <div className="tab-btns tab-buttons centred clearfix">
                        <li onClick={() => handleOnClick(1)} className={activeIndex === 1 ? "tab-btn active-btn" : "tab-btn"}>CRM <br />no WhatsApp</li>
                        <li onClick={() => handleOnClick(2)} className={activeIndex === 2 ? "tab-btn active-btn" : "tab-btn"}>Automações <br />de Marketing</li>
                        <li onClick={() => handleOnClick(3)} className={activeIndex === 3 ? "tab-btn active-btn" : "tab-btn"}>Inbox <br />Compartilhado</li>
                        <li onClick={() => handleOnClick(4)} className={activeIndex === 4 ? "tab-btn active-btn" : "tab-btn"}>Relatórios <br />e Funis</li>
                    </div>
                    <div className="tabs-content">
                        <div className={activeIndex === 1 ? "tab active-tab" : "tab"} id="content">
                            <div className="content-box">
                                <div className="icon-box"><img src="assets/images/icons/icon-42.png" alt=""/></div>
                                <h2>CRM completo no WhatsApp</h2>
                                <p>Funis personalizados, etapas, tarefas e negociações com sincronização <br />em tempo real entre todo o time.</p>
                                <div className="image-box">
                                    <div className="shape" style={{ backgroundImage: "url(assets/images/shape/shape-40.png)" }}></div>
                                    <figure className="image"><img src="assets/images/resource/dashboard-12.jpg" alt=""/></figure>
                                </div>
                            </div>
                        </div>
                        <div className={activeIndex === 2 ? "tab active-tab" : "tab"} id="marketing">
                            <div className="content-box">
                                <div className="icon-box"><img src="assets/images/icons/icon-42.png" alt=""/></div>
                                <h2>Automações de marketing</h2>
                                <p>Fluxos automáticos, campanhas e sequências para nutrir, qualificar <br />e converter leads sem esforço manual.</p>
                                <div className="image-box">
                                    <div className="shape" style={{ backgroundImage: "url(assets/images/shape/shape-40.png)" }}></div>
                                    <figure className="image"><img src="assets/images/resource/dashboard-12.jpg" alt=""/></figure>
                                </div>
                            </div>
                        </div>
                        <div className={activeIndex === 3 ? "tab active-tab" : "tab"} id="editing">
                            <div className="content-box">
                                <div className="icon-box"><img src="assets/images/icons/icon-42.png" alt=""/></div>
                                <h2>Inbox compartilhado</h2>
                                <p>O time inteiro atendendo no mesmo número, com filas, etiquetas, <br />respostas rápidas e atribuição automática.</p>
                                <div className="image-box">
                                    <div className="shape" style={{ backgroundImage: "url(assets/images/shape/shape-40.png)" }}></div>
                                    <figure className="image"><img src="assets/images/resource/dashboard-12.jpg" alt=""/></figure>
                                </div>
                            </div>
                        </div>
                        <div className={activeIndex === 4 ? "tab active-tab" : "tab"} id="language">
                            <div className="content-box">
                                <div className="icon-box"><img src="assets/images/icons/icon-42.png" alt=""/></div>
                                <h2>Relatórios e funis</h2>
                                <p>Conversão por etapa, produtividade do time e SLA de atendimento <br />em painéis em tempo real.</p>
                                <div className="image-box">
                                    <div className="shape" style={{ backgroundImage: "url(assets/images/shape/shape-40.png)" }}></div>
                                    <figure className="image"><img src="assets/images/resource/dashboard-12.jpg" alt=""/></figure>
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
