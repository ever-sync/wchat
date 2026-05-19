'use client'
import Link from "next/link"
import { Autoplay, Navigation, Pagination } from "swiper/modules"
import { Swiper, SwiperSlide } from "swiper/react"

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
            slidesPerView: 1,
            spaceBetween: 30,
        },
        991: {
            slidesPerView: 1,
            spaceBetween: 30,
        },
        1199: {
            slidesPerView: 1,
            spaceBetween: 30,
        },
        1350: {
            slidesPerView: 1,
            spaceBetween: 30,
        },
    }
}
export default function Masterpiece() {
    return (
        <>
        <section className="masterpiece-section">
            <div className="pattern-layer" style={{ backgroundImage: "url(assets/images/shape/shape-13.png)" }}></div>
            <div className="auto-container">
                <div className="title-box">
                    <div className="row clearfix">
                        <div className="col-lg-6 col-md-6 col-sm-12 title-column">
                            <div className="sec-title light">
                                <h6>[ destaques ]</h6>
                                <h2>Tudo o que você precisa pra vender</h2>
                            </div>
                        </div>
                        <div className="col-lg-6 col-md-6 col-sm-12 text-column">
                            <div className="title-text">
                                <p>O wChat reúne em uma plataforma só tudo o que o seu time precisa pra atender, vender e fidelizar pelo WhatsApp.</p>
                            </div>
                        </div>
                    </div>
                </div>
                <Swiper {...swiperOptions} className="theme_carousel owl-theme">
                    <SwiperSlide className="slide-item">
                        <div className="inner-box">
                            <div className="row clearfix">
                                <div className="col-lg-6 col-md-12 col-sm-12 image-column">
                                    <div className="image-box">
                                        <div className="shape" style={{ backgroundImage: "url(assets/images/shape/shape-14.png)" }}></div>
                                        <figure className="image"><img src="assets/images/resource/dashboard-5.jpg" alt=""/></figure>
                                    </div>
                                </div>
                                <div className="col-lg-6 col-md-12 col-sm-12 content-column">
                                    <div className="content-box">
                                        <h2>Mais de 50 <span>recursos <br />comerciais</span> em um só lugar</h2>
                                        <div className="text-box">
                                            <div className="shape" style={{ backgroundImage: "url(assets/images/shape/shape-15.png)" }}></div>
                                            <p>CRM, inbox compartilhado, automações, campanhas, formulários, funis, relatórios em tempo real e muito mais — tudo conectado direto ao seu WhatsApp.</p>
                                            <p>Centralize o operacional, ganhe produtividade e escale o atendimento sem perder o controle.</p>
                                            <Link href="/pricing" className="theme-btn btn-two">Começar agora</Link>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </SwiperSlide>
                    <SwiperSlide className="slide-item">
                        <div className="inner-box">
                            <div className="row clearfix">
                                <div className="col-lg-6 col-md-12 col-sm-12 image-column">
                                    <div className="image-box">
                                        <div className="shape" style={{ backgroundImage: "url(assets/images/shape/shape-14.png)" }}></div>
                                        <figure className="image"><img src="assets/images/resource/dashboard-5.jpg" alt=""/></figure>
                                    </div>
                                </div>
                                <div className="col-lg-6 col-md-12 col-sm-12 content-column">
                                    <div className="content-box">
                                        <h2>Mais de 50 <span>recursos <br />comerciais</span> em um só lugar</h2>
                                        <div className="text-box">
                                            <div className="shape" style={{ backgroundImage: "url(assets/images/shape/shape-15.png)" }}></div>
                                            <p>CRM, inbox compartilhado, automações, campanhas, formulários, funis, relatórios em tempo real e muito mais — tudo conectado direto ao seu WhatsApp.</p>
                                            <p>Centralize o operacional, ganhe produtividade e escale o atendimento sem perder o controle.</p>
                                            <Link href="/pricing" className="theme-btn btn-two">Começar agora</Link>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </SwiperSlide>
                    <SwiperSlide className="slide-item">
                        <div className="inner-box">
                            <div className="row clearfix">
                                <div className="col-lg-6 col-md-12 col-sm-12 image-column">
                                    <div className="image-box">
                                        <div className="shape" style={{ backgroundImage: "url(assets/images/shape/shape-14.png)" }}></div>
                                        <figure className="image"><img src="assets/images/resource/dashboard-5.jpg" alt=""/></figure>
                                    </div>
                                </div>
                                <div className="col-lg-6 col-md-12 col-sm-12 content-column">
                                    <div className="content-box">
                                        <h2>Mais de 50 <span>recursos <br />comerciais</span> em um só lugar</h2>
                                        <div className="text-box">
                                            <div className="shape" style={{ backgroundImage: "url(assets/images/shape/shape-15.png)" }}></div>
                                            <p>CRM, inbox compartilhado, automações, campanhas, formulários, funis, relatórios em tempo real e muito mais — tudo conectado direto ao seu WhatsApp.</p>
                                            <p>Centralize o operacional, ganhe produtividade e escale o atendimento sem perder o controle.</p>
                                            <Link href="/pricing" className="theme-btn btn-two">Começar agora</Link>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </SwiperSlide>
                </Swiper>
            </div>

            <div className="owl-nav">
                <button type="button" className="owl-prev"><span className="flaticon-left-arrow"></span></button>
                <button type="button" className="owl-next"><span className="flaticon-right-arrow"></span></button>
            </div>

            <div className="owl-dots">
                <div className="swiper-pagination"></div>
            </div>
        </section>
        </>
    )
}


