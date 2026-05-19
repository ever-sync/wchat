import React from 'react'
import Link from "next/link"

export default function Easier() {
  return (
    <>
      <section className="easier-section bg-color-2">
            <div className="auto-container">
                <div className="inner-box">
                    <div className="shape" style={{ backgroundImage: "url(assets/images/shape/shape-24.png)" }}></div>
                    <div className="row align-items-center">
                        <div className="col-lg-8 col-md-12 col-sm-12 title-column">
                            <div className="sec-title">
                                <h6>[ simplifique o atendimento ]</h6>
                                <h2>Eleve o atendimento <br />comercial do seu time <br />pelo WhatsApp</h2>
                                <Link href="/pricing" className="theme-btn btn-one"><span>Começar teste grátis</span></Link>
                            </div>
                        </div>
                        <div className="col-lg-4 col-md-12 col-sm-12 content-column">
                            <div className="content-box">
                                <ul className="list-item clearfix">
                                    <li>Sem cartão de crédito</li>
                                    <li>Cancele quando quiser</li>
                                    <li>Mais de 50 recursos comerciais</li>
                                    <li>7 dias grátis</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    </>
  )
}
