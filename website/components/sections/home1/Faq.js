'use client'
import Link from "next/link"
import { useState } from 'react'
export default function Faq() {
    const [isActive, setIsActive] = useState({
        status: false,
        key: 1,
    })

    const handleToggle = (key) => {
        if (isActive.key === key) {
            setIsActive({
                status: false,
            })
        } else {
            setIsActive({
                status: true,
                key,
            })
        }
    }
    return (
    <>
        <section className="faq-section sec-pad">
            <div className="pattern-layer" style={{ backgroundImage: "url(assets/images/shape/shape-23.png)" }}></div>
            <div className="auto-container">
                <div className="sec-title centred">
                    <h6>[ Dúvidas ]</h6>
                    <h2>Perguntas frequentes</h2>
                </div>
                <div className="inner-box">
                    <ul className="accordion-box">
                        <li className="accordion block">
                            <div className={isActive.key == 1 ? "acc-btn active" : "acc-btn"} onClick={() => handleToggle(1)}>
                                <div className="icon-box"></div>
                                <h4>O que é o wChat?</h4>
                            </div>
                            <div className={isActive.key == 1 ? "acc-content current" : "acc-content"}>
                                <p>O wChat é uma plataforma de CRM, atendimento e automações no WhatsApp. Centraliza conversas, negociações e campanhas em uma única interface, com permissões por papel e isolamento por tenant.</p>
                            </div>
                        </li>
                        <li className="accordion block">
                            <div className={isActive.key == 2 ? "acc-btn active" : "acc-btn"} onClick={() => handleToggle(2)}>
                                <div className="icon-box"></div>
                                <h4>Como funciona a integração com o WhatsApp?</h4>
                            </div>
                            <div className={isActive.key == 2 ? "acc-content current" : "acc-content"}>
                                <p>O wChat é uma plataforma de CRM, atendimento e automações no WhatsApp. Centraliza conversas, negociações e campanhas em uma única interface, com permissões por papel e isolamento por tenant.</p>
                            </div>
                        </li>
                        <li className="accordion block">
                            <div className={isActive.key == 3 ? "acc-btn active" : "acc-btn"} onClick={() => handleToggle(3)}>
                                <div className="icon-box"></div>
                                <h4>Quantos atendentes podem usar ao mesmo tempo?</h4>
                            </div>
                            <div className={isActive.key == 3 ? "acc-content current" : "acc-content"}>
                                <p>O wChat é uma plataforma de CRM, atendimento e automações no WhatsApp. Centraliza conversas, negociações e campanhas em uma única interface, com permissões por papel e isolamento por tenant.</p>
                            </div>
                        </li>
                        <li className="accordion block">
                            <div className={isActive.key == 4 ? "acc-btn active" : "acc-btn"} onClick={() => handleToggle(4)}>
                                <div className="icon-box"></div>
                                <h4>Posso testar antes de assinar?</h4>
                            </div>
                            <div className={isActive.key == 4 ? "acc-content current" : "acc-content"}>
                                <p>O wChat é uma plataforma de CRM, atendimento e automações no WhatsApp. Centraliza conversas, negociações e campanhas em uma única interface, com permissões por papel e isolamento por tenant.</p>
                            </div>
                        </li>
                    </ul>
                    <div className="btn-box">
                        <Link href="/contact" className="theme-btn btn-one">Tirar mais dúvidas</Link>
                    </div>
                </div>
            </div>
        </section>

    </>

  )
}