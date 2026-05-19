'use client'
import Layout from "@/components/layout/Layout"
import VideoPopup from "@/components/elements/VideoPopup"
import CounterUp from "@/components/elements/CounterUp"
import { Autoplay, Navigation, Pagination } from "swiper/modules"
import { Swiper, SwiperSlide } from "swiper/react"
import Link from "next/link"
import { useState } from "react"


const swiperOptions = {
    modules: [Autoplay, Pagination, Navigation],
    slidesPerView: 1,
    spaceBetween: 30,
    autoplay: {
        delay: 2500,
        disableOnInteraction: false,
    },
    loop: true,

    // Navigation
    navigation: {
        nextEl: '.owl-prev',
        prevEl: '.owl-next',
    },

    // Pagination
    pagination: {
        el: '.swiper-pagination',
        clickable: true,
    },

    breakpoints: {
        320: {
            slidesPerView: 1,
            spaceBetween: 30,
        },
        575: {
            slidesPerView: 1,
            spaceBetween: 30,
        },
        767: {
            slidesPerView: 2,
            spaceBetween: 30,
        },
        991: {
            slidesPerView: 2,
            spaceBetween: 30,
        },
        1199: {
            slidesPerView: 3,
            spaceBetween: 30,
        },
        1350: {
            slidesPerView: 3,
            spaceBetween: 30,
        },
    }
}


export default function about() {

    const [activeIndex, setActiveIndex] = useState(1)
    const handleOnClick = (index) => {
        setActiveIndex(index)
    }

    return (
        <>
            <Layout headerStyle={1} footerStyle={1} breadcrumbTitle="Conheça o wChat">
                {/* about-section */}
                <section className="exploring-section about-page">
                    <div className="pattern-layer" style={{ backgroundImage: "url(assets/images/shape/shape-43.png)" }}></div>
                    <div className="auto-container">
                        <div className="upper-box">
                            <div className="row clearfix">
                                <div className="col-lg-7 col-md-12 col-sm-12 video-column">
                                    <div className="video-inner">
                                        <div className="bg-layer" style={{ backgroundImage: "url(assets/images/resource/video-1.jpg)" }}></div>
                                        <div className="btn-box">
                                            <div className="video-btn">
                                                <VideoPopup />
                                            </div>
                                            <h6>Como funciona</h6>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-lg-5 col-md-12 col-sm-12 content-column">
                                    <div className="content-box">
                                        <div className="sec-title">
                                            <h6>[ Sobre o wChat ]</h6>
                                            <h2>Atendimento e CRM <br />no WhatsApp</h2>
                                        </div>
                                        <div className="text-box">
                                            <div className="bold-text">Tudo o que o seu time comercial precisa, em um só lugar.</div>
                                            <p>O wChat nasceu para resolver um problema simples: como um time inteiro pode atender, vender e fechar negócio no WhatsApp sem perder histórico, sem usar planilhas, e sem trocar de ferramenta.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="lower-box centred">
                            <div className="row clearfix">
                                <div className="col-lg-4 col-md-6 col-sm-12 single-column">
                                    <div className="single-item">
                                        <h3>10× produtividade</h3>
                                        <p>Automações, templates e respostas rápidas que aceleram o atendimento do time.</p>
                                    </div>
                                </div>
                                <div className="col-lg-4 col-md-6 col-sm-12 single-column">
                                    <div className="single-item">
                                        <h3>Equipe ilimitada</h3>
                                        <p>Atenda em equipe no mesmo número, com filas, etiquetas e permissões.</p>
                                    </div>
                                </div>
                                <div className="col-lg-4 col-md-6 col-sm-12 single-column">
                                    <div className="single-item">
                                        <h3>7 dias grátis</h3>
                                        <p>Comece grátis por 7 dias. Sem cartão. Sem amarração.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
                {/* about-section end */}


                {/* values-section */}
                <section className="values-section sec-pad bg-color-1">
                    <div className="pattern-layer" style={{ backgroundImage: "url(assets/images/shape/shape-48.png)" }}></div>
                    <div className="auto-container">
                        <div className="title-box">
                            <div className="row clearfix">
                                <div className="col-lg-6 col-md-12 col-sm-12 title-column">
                                    <div className="sec-title">
                                        <h6>[ Valores ]</h6>
                                        <h2>O que nos move</h2>
                                    </div>
                                </div>
                                <div className="col-lg-6 col-md-12 col-sm-12 text-column">
                                    <div className="title-text">
                                        <p>Os princípios que guiam o jeito que construímos o wChat todos os dias.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="tabs-box">
                            <div className="row align-items-center">
                                <div className="col-lg-6 col-md-12 col-sm-12 btn-column">
                                    <div className="tab-btns tab-buttons">
                                        <li onClick={() => handleOnClick(1)} className={activeIndex === 1 ? "tab-btn active-btn" : "tab-btn"}>01. Nossa abordagem <Link href="/about"><i className="flaticon-right-arrow"></i></Link></li>
                                        <li onClick={() => handleOnClick(2)} className={activeIndex === 2 ? "tab-btn active-btn" : "tab-btn"}>02. Proposta de valor única <Link href="/about"><i className="flaticon-right-arrow"></i></Link></li>
                                        <li onClick={() => handleOnClick(3)} className={activeIndex === 3 ? "tab-btn active-btn" : "tab-btn"}>03. Compromisso com qualidade <Link href="/about"><i className="flaticon-right-arrow"></i></Link></li>
                                        <li onClick={() => handleOnClick(4)} className={activeIndex === 4 ? "tab-btn active-btn" : "tab-btn"}>04. Evolução contínua <Link href="/about"><i className="flaticon-right-arrow"></i></Link></li>
                                        <li onClick={() => handleOnClick(5)} className={activeIndex === 5 ? "tab-btn active-btn" : "tab-btn"}>05. Privacidade e segurança <Link href="/about"><i className="flaticon-right-arrow"></i></Link></li>
                                    </div>
                                </div>
                                <div className="col-lg-6 col-md-12 col-sm-12 content-column">
                                    <div className="tabs-content">
                                        <div className={activeIndex === 1 ? "tab active-tab" : "tab"}>
                                            <div className="content-box">
                                                <h3>Nossa <br />abordagem</h3>
                                                <p>Construímos software simples para resolver problemas complexos do dia a dia comercial. Foco no resultado de quem usa o wChat para atender e vender pelo WhatsApp.</p>
                                            </div>
                                        </div>
                                        <div className={activeIndex === 2 ? "tab active-tab" : "tab"} id="content_two">
                                            <div className="content-box">
                                                <h3>Proposta de valor única</h3>
                                                <p>CRM, inbox compartilhado e automações em uma plataforma só, conectada direto ao seu WhatsApp. Menos ferramentas, mais resultado.</p>
                                            </div>
                                        </div>
                                        <div className={activeIndex === 3 ? "tab active-tab" : "tab"} id="content_three">
                                            <div className="content-box">
                                                <h3>Compromisso com qualidade</h3>
                                                <p>Cada recurso é testado em produção pelo nosso próprio time antes de chegar a você. Qualidade vem antes de quantidade.</p>
                                            </div>
                                        </div>
                                        <div className={activeIndex === 4 ? "tab active-tab" : "tab"} id="content_four">
                                            <div className="content-box">
                                                <h3>Evolução <br />contínua</h3>
                                                <p>Novas funcionalidades todo mês, baseadas no feedback de quem usa o wChat de verdade. Roadmap aberto e transparente.</p>
                                            </div>
                                        </div>
                                        <div className={activeIndex === 5 ? "tab active-tab" : "tab"} id="content_five">
                                            <div className="content-box">
                                                <h3>Privacidade e segurança</h3>
                                                <p>Infraestrutura na nuvem com criptografia, isolamento por tenant, permissões por papel e LGPD por padrão. Seus dados e os do seu cliente protegidos.</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
                {/* values-section end */}


                {/* chooseus-section */}
                <section className="chooseus-section sec-pad">
                    <div className="pattern-layer" style={{ backgroundImage: "url(assets/images/shape/shape-12.png)" }}></div>
                    <div className="auto-container">
                        <div className="sec-title centred">
                            <h6>[ Por que escolher ]</h6>
                            <h2>Motivos para escolher o wChat</h2>
                            <p>Por que centenas de empresas escolhem o wChat para atender e vender pelo WhatsApp.</p>
                        </div>
                        <div className="row clearfix">
                            <div className="col-lg-4 col-md-12 col-sm-12 left-column">
                                <div className="left-content">
                                    <div className="single-item">
                                        <div className="shape" style={{ backgroundImage: "url(assets/images/shape/shape-8.png)" }}></div>
                                        <div className="icon-box"><img src="assets/images/icons/icon-10.png" alt=""/></div>
                                        <div className="text-box">
                                            <h3>10× produtividade</h3>
                                            <p>Respostas rápidas, automações e templates aceleram o atendimento do time.</p>
                                        </div>
                                    </div>
                                    <div className="single-item">
                                        <div className="shape" style={{ backgroundImage: "url(assets/images/shape/shape-9.png)" }}></div>
                                        <div className="text-box">
                                            <h3>Eficiência e padrão</h3>
                                            <p>Mudanças no CRM, etapas e atribuições refletem em tempo real para toda a equipe.</p>
                                        </div>
                                        <div className="icon-box"><img src="assets/images/icons/icon-11.png" alt=""/></div>
                                    </div>
                                </div>
                            </div>
                            <div className="col-lg-4 col-md-12 col-sm-12 image-column">
                                <div className="image-box">
                                    <figure className="image"><img src="assets/images/resource/chooseus-1.jpg" alt=""/></figure>
                                </div>
                            </div>
                            <div className="col-lg-4 col-md-12 col-sm-12 right-column">
                                <div className="right-content text-right">
                                    <div className="single-item">
                                        <div className="shape" style={{ backgroundImage: "url(assets/images/shape/shape-10.png)" }}></div>
                                        <div className="icon-box"><img src="assets/images/icons/icon-12.png" alt=""/></div>
                                        <div className="text-box">
                                            <h3>Multiusuário</h3>
                                            <p>Respostas rápidas, automações e templates aceleram o atendimento do time.</p>
                                        </div>
                                    </div>
                                    <div className="single-item">
                                        <div className="shape" style={{ backgroundImage: "url(assets/images/shape/shape-11.png)" }}></div>
                                        <div className="text-box">
                                            <h3>Tempo real</h3>
                                            <p>Mudanças no CRM, etapas e atribuições refletem em tempo real para toda a equipe.</p>
                                        </div>
                                        <div className="icon-box"><img src="assets/images/icons/icon-13.png" alt=""/></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
                {/* chooseus-section end */}


                {/* funfact-section */}
                <section className="funfact-section">
                    <div className="pattern-layer" style={{ backgroundImage: "url(assets/images/shape/shape-49.png)" }}></div>
                    <div className="auto-container">
                        <div className="inner-container">
                            <div className="row clearfix">
                                <div className="col-lg-6 col-md-12 col-sm-12 funfact-block">
                                    <div className="funfact-block-one">
                                        <h3>Empresas</h3>
                                        <div className="inner-box">
                                            <div className="count-outer count-box">
                                                <CounterUp end={24} /><span>k</span>
                                            </div>
                                            <p>Empresas usando o wChat para atender e vender pelo WhatsApp.</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-lg-6 col-md-12 col-sm-12 funfact-block">
                                    <div className="funfact-block-one">
                                        <h3>Nota dos usuários</h3>
                                        <div className="inner-box">
                                            <div className="count-outer count-box">
                                                <CounterUp end={4.9} /><span>/5</span>
                                            </div>
<p>Nota média da plataforma na avaliação dos nossos clientes.</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-lg-6 col-md-12 col-sm-12 funfact-block">
                                    <div className="funfact-block-one">
                                        <h3>Conversas por dia</h3>
                                        <div className="inner-box">
                                            <div className="count-outer count-box">
                                                <CounterUp end={2} /><span>m+</span>
                                            </div>
                                            <p>Conversas trafegando pela plataforma todos os dias.</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-lg-6 col-md-12 col-sm-12 funfact-block">
                                    <div className="funfact-block-one">
                                        <h3>Seguro e privado</h3>
                                        <div className="inner-box">
                                            <div className="count-outer count-box">
                                                <CounterUp end={100} /><span>%</span>
                                            </div>
                                            <p>Infra segura, criptografia em trânsito e isolamento total por cliente.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
                {/* funfact-section end */}


                {/* team-section */}
                <section className="team-section sec-pad">
                    <div className="auto-container">
                        <div className="sec-title centred">
                            <h6>[ Time ]</h6>
                            <h2>Quem está por trás do wChat</h2>
                            <p>Um time obcecado em fazer o seu time comercial vender mais e melhor pelo WhatsApp.</p>
                        </div>
                        <div className="inner-container">
                            <Swiper {...swiperOptions} className="theme_carousel">
                                <SwiperSlide className="slide-item">
                                    <div className="team-block-one">
                                        <div className="inner-box">
                                            <figure className="image-box"><img src="assets/images/team/team-1.jpg" alt=""/></figure>
                                            <div className="lower-content">
                                                <div className="share-box">
                                                    <div className="share-icon"><i className="fa-solid fa-share-nodes"></i></div>
                                                    <ul className="social-links clearfix">
                                                        <li><Link href="/about"><i className="fa-brands fa-facebook"></i></Link></li>
                                                        <li><Link href="/about"><i className="fa-brands fa-square-twitter"></i></Link></li>
                                                        <li><Link href="/about"><i className="fa-brands fa-pinterest"></i></Link></li>
                                                        <li><Link href="/about"><i className="fa-brands fa-youtube"></i></Link></li>
                                                    </ul>
                                                </div>
                                                <h3><Link href="/about">Rafael Costa</Link></h3>
                                                <span className="designation">[ Time wChat ]</span>
                                            </div>
                                        </div>
                                    </div>
                                </SwiperSlide>
                                <SwiperSlide className="slide-item">
                                    <div className="team-block-one">
                                        <div className="inner-box">
                                            <figure className="image-box"><img src="assets/images/team/team-2.jpg" alt=""/></figure>
                                            <div className="lower-content">
                                                <div className="share-box">
                                                    <div className="share-icon"><i className="fa-solid fa-share-nodes"></i></div>
                                                    <ul className="social-links clearfix">
                                                        <li><Link href="/about"><i className="fa-brands fa-facebook"></i></Link></li>
                                                        <li><Link href="/about"><i className="fa-brands fa-square-twitter"></i></Link></li>
                                                        <li><Link href="/about"><i className="fa-brands fa-pinterest"></i></Link></li>
                                                        <li><Link href="/about"><i className="fa-brands fa-youtube"></i></Link></li>
                                                    </ul>
                                                </div>
                                                <h3><Link href="/about">Mariana Lima</Link></h3>
                                                <span className="designation">[ Time wChat ]</span>
                                            </div>
                                        </div>
                                    </div>
                                </SwiperSlide>
                                <SwiperSlide className="slide-item">
                                    <div className="team-block-one">
                                        <div className="inner-box">
                                            <figure className="image-box"><img src="assets/images/team/team-3.jpg" alt=""/></figure>
                                            <div className="lower-content">
                                                <div className="share-box">
                                                    <div className="share-icon"><i className="fa-solid fa-share-nodes"></i></div>
                                                    <ul className="social-links clearfix">
                                                        <li><Link href="/about"><i className="fa-brands fa-facebook"></i></Link></li>
                                                        <li><Link href="/about"><i className="fa-brands fa-square-twitter"></i></Link></li>
                                                        <li><Link href="/about"><i className="fa-brands fa-pinterest"></i></Link></li>
                                                        <li><Link href="/about"><i className="fa-brands fa-youtube"></i></Link></li>
                                                    </ul>
                                                </div>
                                                <h3><Link href="/about">Diego Martins</Link></h3>
                                                <span className="designation">[ Time wChat ]</span>
                                            </div>
                                        </div>
                                    </div>
                                </SwiperSlide>
                                <SwiperSlide className="slide-item">
                                    <div className="team-block-one">
                                        <div className="inner-box">
                                            <figure className="image-box"><img src="assets/images/team/team-1.jpg" alt=""/></figure>
                                            <div className="lower-content">
                                                <div className="share-box">
                                                    <div className="share-icon"><i className="fa-solid fa-share-nodes"></i></div>
                                                    <ul className="social-links clearfix">
                                                        <li><Link href="/about"><i className="fa-brands fa-facebook"></i></Link></li>
                                                        <li><Link href="/about"><i className="fa-brands fa-square-twitter"></i></Link></li>
                                                        <li><Link href="/about"><i className="fa-brands fa-pinterest"></i></Link></li>
                                                        <li><Link href="/about"><i className="fa-brands fa-youtube"></i></Link></li>
                                                    </ul>
                                                </div>
                                                <h3><Link href="/about">Rafael Costa</Link></h3>
                                                <span className="designation">[ Time wChat ]</span>
                                            </div>
                                        </div>
                                    </div>
                                </SwiperSlide>
                                <SwiperSlide className="slide-item">
                                    <div className="team-block-one">
                                        <div className="inner-box">
                                            <figure className="image-box"><img src="assets/images/team/team-2.jpg" alt=""/></figure>
                                            <div className="lower-content">
                                                <div className="share-box">
                                                    <div className="share-icon"><i className="fa-solid fa-share-nodes"></i></div>
                                                    <ul className="social-links clearfix">
                                                        <li><Link href="/about"><i className="fa-brands fa-facebook"></i></Link></li>
                                                        <li><Link href="/about"><i className="fa-brands fa-square-twitter"></i></Link></li>
                                                        <li><Link href="/about"><i className="fa-brands fa-pinterest"></i></Link></li>
                                                        <li><Link href="/about"><i className="fa-brands fa-youtube"></i></Link></li>
                                                    </ul>
                                                </div>
                                                <h3><Link href="/about">Mariana Lima</Link></h3>
                                                <span className="designation">[ Time wChat ]</span>
                                            </div>
                                        </div>
                                    </div>
                                </SwiperSlide>
                                <SwiperSlide className="slide-item">
                                    <div className="team-block-one">
                                        <div className="inner-box">
                                            <figure className="image-box"><img src="assets/images/team/team-3.jpg" alt=""/></figure>
                                            <div className="lower-content">
                                                <div className="share-box">
                                                    <div className="share-icon"><i className="fa-solid fa-share-nodes"></i></div>
                                                    <ul className="social-links clearfix">
                                                        <li><Link href="/about"><i className="fa-brands fa-facebook"></i></Link></li>
                                                        <li><Link href="/about"><i className="fa-brands fa-square-twitter"></i></Link></li>
                                                        <li><Link href="/about"><i className="fa-brands fa-pinterest"></i></Link></li>
                                                        <li><Link href="/about"><i className="fa-brands fa-youtube"></i></Link></li>
                                                    </ul>
                                                </div>
                                                <h3><Link href="/about">Diego Martins</Link></h3>
                                                <span className="designation">[ Time wChat ]</span>
                                            </div>
                                        </div>
                                    </div>
                                </SwiperSlide>
                                <SwiperSlide className="slide-item">
                                    <div className="team-block-one">
                                        <div className="inner-box">
                                            <figure className="image-box"><img src="assets/images/team/team-1.jpg" alt=""/></figure>
                                            <div className="lower-content">
                                                <div className="share-box">
                                                    <div className="share-icon"><i className="fa-solid fa-share-nodes"></i></div>
                                                    <ul className="social-links clearfix">
                                                        <li><Link href="/about"><i className="fa-brands fa-facebook"></i></Link></li>
                                                        <li><Link href="/about"><i className="fa-brands fa-square-twitter"></i></Link></li>
                                                        <li><Link href="/about"><i className="fa-brands fa-pinterest"></i></Link></li>
                                                        <li><Link href="/about"><i className="fa-brands fa-youtube"></i></Link></li>
                                                    </ul>
                                                </div>
                                                <h3><Link href="/about">Rafael Costa</Link></h3>
                                                <span className="designation">[ Time wChat ]</span>
                                            </div>
                                        </div>
                                    </div>
                                </SwiperSlide>
                                <SwiperSlide className="slide-item">
                                    <div className="team-block-one">
                                        <div className="inner-box">
                                            <figure className="image-box"><img src="assets/images/team/team-2.jpg" alt=""/></figure>
                                            <div className="lower-content">
                                                <div className="share-box">
                                                    <div className="share-icon"><i className="fa-solid fa-share-nodes"></i></div>
                                                    <ul className="social-links clearfix">
                                                        <li><Link href="/about"><i className="fa-brands fa-facebook"></i></Link></li>
                                                        <li><Link href="/about"><i className="fa-brands fa-square-twitter"></i></Link></li>
                                                        <li><Link href="/about"><i className="fa-brands fa-pinterest"></i></Link></li>
                                                        <li><Link href="/about"><i className="fa-brands fa-youtube"></i></Link></li>
                                                    </ul>
                                                </div>
                                                <h3><Link href="/about">Mariana Lima</Link></h3>
                                                <span className="designation">[ Time wChat ]</span>
                                            </div>
                                        </div>
                                    </div>
                                </SwiperSlide>
                                <SwiperSlide className="slide-item">
                                    <div className="team-block-one">
                                        <div className="inner-box">
                                            <figure className="image-box"><img src="assets/images/team/team-3.jpg" alt=""/></figure>
                                            <div className="lower-content">
                                                <div className="share-box">
                                                    <div className="share-icon"><i className="fa-solid fa-share-nodes"></i></div>
                                                    <ul className="social-links clearfix">
                                                        <li><Link href="/about"><i className="fa-brands fa-facebook"></i></Link></li>
                                                        <li><Link href="/about"><i className="fa-brands fa-square-twitter"></i></Link></li>
                                                        <li><Link href="/about"><i className="fa-brands fa-pinterest"></i></Link></li>
                                                        <li><Link href="/about"><i className="fa-brands fa-youtube"></i></Link></li>
                                                    </ul>
                                                </div>
                                                <h3><Link href="/about">Diego Martins</Link></h3>
                                                <span className="designation">[ Time wChat ]</span>
                                            </div>
                                        </div>
                                    </div>
                                </SwiperSlide>
                            </Swiper>

                            <div className="owl-nav">
                                <button type="button" className="owl-prev"><span className="flaticon-left-arrow"></span></button>
                                <button type="button" className="owl-next"><span className="flaticon-right-arrow"></span></button>
                            </div>
                        </div>
                    </div>
                </section>
                {/* team-section end */}

            </Layout>
        </>
    )
}


