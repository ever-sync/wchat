'use client'
import Layout from "@/components/layout/Layout"
import Faq from "@/components/sections/home1/Faq"
import Contact from "@/components/sections/home2/Contact"
import Link from "next/link"
import { useState } from "react"
export default function contact() {

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
            <Layout headerStyle={1} footerStyle={1} breadcrumbTitle="Fale com a gente">
            <section className="contact-info-section sec-pad">
                <div className="auto-container">
                    <div className="sec-title centred">
                        <h2>Vamos conversar <br />e descobrir o melhor plano</h2>
                        <p>Estamos prontos pra te ajudar a vender mais <br />pelo WhatsApp.</p>
                        <h6><Link href="https://www.google.com/maps" target="_blank"><i className="flaticon-right-arrow"></i>Ver no mapa</Link></h6>
                    </div>
                    <div className="row clearfix">
                        <div className="col-lg-6 col-md-6 col-sm-12 info-column">
                            <div className="info-block-one">
                                <div className="inner-box">
                                    <div className="icon-box"><img src="assets/images/icons/icon-79.png" alt=""/></div>
                                    <h4>Telefone</h4>
                                    <p>Fale com o nosso time e tire suas dúvidas agora mesmo.</p>
                                    <Link href="tel:+5511999999999">+55 (11) 99999-9999</Link>
                                </div>
                            </div>
                        </div>
                        <div className="col-lg-6 col-md-6 col-sm-12 info-column">
                            <div className="info-block-one">
                                <div className="inner-box">
                                    <div className="icon-box"><img src="assets/images/icons/icon-80.png" alt=""/></div>
                                    <h4>E-mail</h4>
                                    <p>Mande sua dúvida ou peça uma demonstração.</p>
                                    <Link href="mailto:contato@wchat.com.br">contato@wchat.com.br</Link>
                                </div>
                            </div>
                        </div>
                    </div>
                    <ul className="social-links clearfix centred">
                        <li><Link href="/contact"><i className="fa-brands fa-facebook"></i></Link></li>
                        <li><Link href="/contact"><i className="fa-brands fa-square-twitter"></i></Link></li>
                        <li><Link href="/contact"><i className="fa-solid fa-basketball"></i></Link></li>
                        <li><Link href="/contact"><i className="fa-brands fa-youtube"></i></Link></li>
                    </ul>
                </div>
            </section>

            <Contact />
            <Faq />

            </Layout>
        </>
    )
}