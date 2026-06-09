import PricingSection from "@/components/wchat/PricingSection";
import SiteFooter from "@/components/wchat/SiteFooter";
import SiteHeader from "@/components/wchat/SiteHeader";
import SiteShell from "@/components/wchat/SiteShell";

export default function Page() {
  return (
    <>
      <SiteShell onePage />
      <SiteHeader onePage absolute />{/* ==============================
Hero Area
============================== */}
    <div className="th-hero-wrapper hero-8" id="hero" data-bg-src="assets/img/bg/hero_bg_8.png">
        <div className="container th-container5">
            <div className="row align-items-center">
                <div className="col-xl-8">
                    <div className="hero-style8">
                        <span className="rating"><i className="fa-sharp fa-solid fa-star-sharp"></i><i className="fa-sharp fa-solid fa-star-sharp"></i><i className="fa-sharp fa-solid fa-star-sharp"></i><i className="fa-sharp fa-solid fa-star-sharp"></i><i className="fa-sharp fa-solid fa-star-sharp"></i>5/5 (1850+ reviews)</span>
                        <h1 className="hero-title">Venda mais pelo <span className="title"> WhatsApp</span>, sem perder o controle.</h1>
                        <p className="hero-text">CRM, inbox compartilhada, Agentes de IA e automações de marketing em uma única plataforma.</p>
                        <div className="hero-wrapp">
                            <div className="btn-group justify-content-center justify-content-xl-start">
                                <a href="/register" className="th-btn2 btn-gradient">Criar conta grátis</a>
                                <a href="/contact" className="th-btn2 style5">Falar com consultor</a>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-xl-4">
                    <div className="hero-img7 movingX">
                        <img src="assets/img/wchat/image.png" alt="" />
                    </div>
                </div>
            </div>
        </div>
        <div className="shape-mockup d-none d-xxl-block spin" data-top="21%" data-left="8%"><img src="assets/img/shape/element-15.svg" alt="" /></div>
    </div>
    {/* ======== / Hero Section ======== */}
    {/* ==============================
About Area  
============================== */}
    <div className="about-area4 overflow-hidden space" id="about-sec">
        <div className="container th-container5">
            <div className="row gy-4 align-items-center">
                <div className="col-lg-8">
                    <div className="title-area">
                        <span className="sub-title style6 text-anime-style-2"><span className="number">01</span><span className="title">Sobre nós</span></span>
                        <h2 className="sec-title style3 text-anime-style-3">Nascemos pra resolver o caos do atendimento comercial no WhatsApp</h2>
                    </div>
                    <div className="checklist list-two-column about-checklist wow fadeInUp" data-wow-delay=".6s">
                        <ul>
                            <li className="wow fadeInUp" data-wow-delay=".1s">Gestão comercial integrada</li>
                            <li className="wow fadeInUp" data-wow-delay=".2s">Inbox compartilhado</li>
                            <li className="wow fadeInUp" data-wow-delay=".3s">Automações e campanhas</li>
                            <li className="wow fadeInUp" data-wow-delay=".4s">Agente de IA</li>
                            <li className="wow fadeInUp" data-wow-delay=".5s">Novos recursos toda semana</li>
                            <li className="wow fadeInUp" data-wow-delay=".5s">99.9% de uptime</li>
                        </ul>
                    </div>
                    <div className="btn-group mt-45 wow fadeInUp" data-wow-delay=".8s">
                        <a href="/about" className="th-btn3 style5">
                            <span>
                                <span className="text-1">Conheça o wChat </span>
                                <span className="text-2">Conheça o wChat </span>
                            </span>
                            <span className="icon">
                                <i>
                                    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M0.5 0.500016L12.334 0.5M12.334 0.5L12.3339 12.334M12.334 0.5L0.500016 12.3339" stroke="var(--white-color)" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M0.5 0.500016L12.334 0.5M12.334 0.5L12.3339 12.334M12.334 0.5L0.500016 12.3339" stroke="var(--white-color)" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>


                                </i>
                            </span>

                        </a>
                    </div>
                </div>
                <div className="col-lg-4">
                    <div className="img-box4">
                        <div className="img1 image scale">
                            <img src="assets/img/normal/about_4_1.jpg" alt="About" />
                        </div>
                        <div className="th-experience wow fadeInUp" data-wow-delay=".4s">
                            <div className="th-experience_content">
                                <h2 className="experience-year"><span className="counter-number">25</span>+</h2>
                                <p className="experience-text">Recursos Integrados</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    </div>{/* ==============================
Brand Area  
============================== */}
    <div className="overflow-hidden space">
        <div className="container th-container5">
            <div className="row">
                <div className="title-area mb-20 text-center">
                    <h2 className="h6 fw-normal  text-anime-style-2">Mais de 1.500 empresas vendem melhor com o wChat</h2>
                </div>
            </div>
            <div className="slider-area">
                <div className="swiper th-slider" id="brandSlider1" data-slider-options='{"breakpoints":{"0":{"slidesPerView":2},"476":{"slidesPerView":"2"},"768":{"slidesPerView":"2"},"992":{"slidesPerView":"3"},"1200":{"slidesPerView":"4"},"1400":{"slidesPerView":"6"}}}'>
                    <div className="swiper-wrapper">
                        <div className="swiper-slide">
                            <div className="brand-item style2">
                                <a href="">
                                    <img src="assets/img/brand/brand_2_1.svg" alt="Brand Logo" />
                                </a>
                            </div>
                        </div>
                        <div className="swiper-slide">
                            <div className="brand-item style2">
                                <a href="">
                                    <img src="assets/img/brand/brand_2_2.svg" alt="Brand Logo" />
                                </a>
                            </div>
                        </div>
                        <div className="swiper-slide">
                            <div className="brand-item style2">
                                <a href="">
                                    <img src="assets/img/brand/brand_2_3.svg" alt="Brand Logo" />
                                </a>
                            </div>
                        </div>
                        <div className="swiper-slide">
                            <div className="brand-item style2">
                                <a href="">
                                    <img src="assets/img/brand/brand_2_4.svg" alt="Brand Logo" />
                                </a>
                            </div>
                        </div>
                        <div className="swiper-slide">
                            <div className="brand-item style2">
                                <a href="">
                                    <img src="assets/img/brand/brand_2_5.svg" alt="Brand Logo" />
                                </a>
                            </div>
                        </div>
                        <div className="swiper-slide">
                            <div className="brand-item style2">
                                <a href="">
                                    <img src="assets/img/brand/brand_2_6.svg" alt="Brand Logo" />
                                </a>
                            </div>
                        </div>
                        <div className="swiper-slide">
                            <div className="brand-item style2">
                                <a href="">
                                    <img src="assets/img/brand/brand_2_1.svg" alt="Brand Logo" />
                                </a>
                            </div>
                        </div>
                        <div className="swiper-slide">
                            <div className="brand-item style2">
                                <a href="">
                                    <img src="assets/img/brand/brand_2_2.svg" alt="Brand Logo" />
                                </a>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    </div>{/* ==============================
Feature Area  
============================== */}
    <section className="feature-area2 space" id="features-sec">
        <div className="container th-container5">
            <div className="row justify-content-center">
                <div className="col-lg-9">
                    <div className="title-area text-center">
                        <span className="sub-title style3 text-anime-style-2">[ Recursos ]</span>
                        <h2 className="sec-title h3 text-anime-style-3">Tudo o que seu time precisa — em um so lugar</h2>
                    </div>
                </div>
            </div>
            <div className="row gy-4">
                <div className="col-md-6 col-xl-4">
                    <div className="feature-grid4">
                        <div className="shape"></div>
                        <div className="box-icon">
                            <img src="assets/img/icon/feature_4_1.svg" alt="icon" />
                        </div>
                        <div>
                            <h3 className="box-title">CRM no WhatsApp</h3>
                            <p className="box-text">Funis drag-and-drop, etapas personalizaveis e negociacoes sincronizadas em tempo real entre todo o time. Acompanhe cada deal do primeiro contato ao fechamento.</p>
                        </div>
                    </div>
                </div>
                <div className="col-md-6 col-xl-4">
                    <div className="feature-grid4">
                        <div className="shape"></div>
                        <div className="box-icon">
                            <img src="assets/img/icon/feature_4_2.svg" alt="icon" />
                        </div>
                        <div>
                            <h3 className="box-title">Automações de marketing</h3>
                            <p className="box-text">Crie fluxos automaticos para nutrir leads, requalificar inativos e fechar vendas — sem esforco manual. Dispare campanhas segmentadas com poucos cliques.</p>
                        </div>
                    </div>
                </div>
                <div className="col-md-6 col-xl-4">
                    <div className="feature-grid4">
                        <div className="shape"></div>
                        <div className="box-icon">
                            <img src="assets/img/icon/feature_4_3.svg" alt="icon" />
                        </div>
                        <div>
                            <h3 className="box-title">Inbox Compartilhado</h3>
                            <p className="box-text">Toda a equipe atendendo no mesmo número de WhatsApp, com filas de distribuição, etiquetas, respostas rápidas e SLA de primeira resposta.</p>
                        </div>
                    </div>
                </div>
                <div className="col-md-6 col-xl-4">
                    <div className="feature-grid4">
                        <div className="shape"></div>
                        <div className="box-icon">
                            <img src="assets/img/icon/feature_4_4.svg" alt="icon" />
                        </div>
                        <div>
                            <h3 className="box-title">Relatórios em Tempo Real</h3>
                            <p className="box-text">Acompanhe conversao por etapa do funil, performance individual do time, SLA de atendimento e volume de mensagens — tudo em dashboards atualizados ao vivo.</p>
                        </div>
                    </div>
                </div>
                <div className="col-md-6 col-xl-4">
                    <div className="feature-grid4">
                        <div className="shape"></div>
                        <div className="box-icon">
                            <img src="assets/img/icon/feature_4_5.svg" alt="icon" />
                        </div>
                        <div>
                            <h3 className="box-title">Powered by ChatGPT & Gemini AI</h3>
                            <p className="box-text">Automatize o primeiro atendimento com IA de verdade. A IA responde clientes, qualifica leads e escala para um humano quando necessario.</p>
                        </div>
                    </div>
                </div>
                <div className="col-md-6 col-xl-4">
                    <div className="feature-grid4">
                        <div className="shape"></div>
                        <div className="box-icon">
                            <img src="assets/img/icon/feature_4_6.svg" alt="icon" />
                        </div>
                        <div>
                            <h3 className="box-title">API e Webhooks</h3>
                            <p className="box-text">Integre o wChat com qualquer sistema via API REST, webhooks em tempo real ou automações com N8N. Controle total da sua operação.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>{/* ==============================
Process Area  
============================== */}
    <section className="space overflow-hidden position-relative space">
        <div className="container th-container5">
            <div className="row justify-content-center">
                <div className="col-lg-8">
                    <div className="title-area text-center">
                        <span className="sub-title style3 text-anime-style-2">[ Por que escolher ]</span>
                        <h2 className="sec-title h3 text-anime-style-3">Mais do que um chat — uma operação comercial inteira no WhatsApp</h2>
                    </div>
                </div>
            </div>
            <div className="row gy-4 align-items-center">
                <div className="col-xl-6">
                    <div className="row gy-4">
                        <div className="col-12">
                            <div className="process-card2 wow fadeInUp" data-wow-delay=".2s">
                                <span className="number">STEP - 01</span>
                                <div className="box-content">
                                    <h2 className="box-title">10x produtividade</h2>
                                    <p className="box-text">Respostas rápidas, templates HSM, automações e agente IA aceleram o atendimento do seu time.</p>
                                </div>
                            </div>
                        </div>
                        <div className="col-12">
                            <div className="process-card2 wow fadeInUp" data-wow-delay=".4s">
                                <span className="number">STEP - 02</span>
                                <div className="box-content">
                                    <h2 className="box-title">Multiusuario de verdade</h2>
                                    <p className="box-text">Todo o time atendendo no mesmo número com filas inteligentes e carga balanceada.</p>
                                </div>
                            </div>
                        </div>
                        <div className="col-12">
                            <div className="process-card2 wow fadeInUp" data-wow-delay=".6s">
                                <span className="number">STEP - 03</span>
                                <div className="box-content">
                                    <h2 className="box-title">Tempo real</h2>
                                    <p className="box-text">Mudancas no CRM e status refletem instantaneamente para toda a equipe.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-xl-6">
                    <div className="process-image">
                        <img src="assets/img/normal/process-image.png" alt="" />
                    </div>
                </div>
            </div>

        </div>
    </section>{/* ==============================
Cta Area  
============================== */}
    <div className="">
        <div className="cta-area5" data-bg-src="assets/img/bg/cta_bg_5.png">
            <div className="container th-container5">
                <div className="row justify-content-center align-items-center">
                    <div className="col-lg-6">
                        <div className="cta-image">
                            <img src="assets/img/normal/cta-image3.png" alt="" />
                        </div>
                    </div>
                    <div className="col-lg-5">
                        <div className="title-area mb-40 text-center text-lg-start">
                            <h2 className="sec-title h3 text-white text-anime-style-2">Eleve o atendimento comercial do seu time <img src="assets/img/icon/star6.png" alt="" /></h2>
                            <span className="box-text wow fadeInUp text-white">Comece em minutos. Sem cartao de credito.</span>
                        </div>
                        <div className="btn-group justify-content-center justify-content-lg-between">
                            <a href="/register" className="th-btn2 btn-gradient">Começar teste grátis</a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>{/* ==============================
Cta Area  
============================== */}
    <div className="space overflow-hidden">
        <div className="container">
            <div className="row justify-content-center">
                <div className="col-lg-8">
                    <div className="title-area text-center">
                        <span className="sub-title style3 text-anime-style-2">[ Integrações ]</span>
                        <h2 className="sec-title h3 text-anime-style-3">Conecte o wChat às ferramentas que você já usa</h2>
                    </div>
                </div>
            </div>
            <div className="integration-area">
                <div className="integration-wrapp">
                    <div>
                        <div className="integration-shape"><img src="assets/img/shape/line-shape3.png" alt="" /></div>
                        <div className="integration-logo"><img src="assets/img/shape/logo2.png" alt="" /></div>
                    </div>
                </div>
                <div className="box-wrapp">
                    <div className="integration-icon"><img src="assets/img/icon/icon1.svg" alt="" /></div>
                    <div className="integration-icon"><img src="assets/img/icon/icon2.svg" alt="" /></div>
                    <div className="integration-icon"><img src="assets/img/icon/icon3.svg" alt="" /></div>
                    <div className="integration-icon"><img src="assets/img/icon/icon4.svg" alt="" /></div>
                    <div className="integration-icon"><img src="assets/img/icon/icon5.svg" alt="" /></div>
                    <div className="integration-icon"><img src="assets/img/icon/icon6.svg" alt="" /></div>
                    <div className="integration-icon"><img src="assets/img/icon/icon7.svg" alt="" /></div>
                    <div className="integration-icon"><img src="assets/img/icon/icon8.svg" alt="" /></div>
                </div>
                <div className="btn-group mt-80 justify-content-center flex-column">
                    <a href="#features-sec" className="th-btn2 btn-gradient">Ver integrações</a>
                    <span className="fs-18">WhatsApp, N8N, Webhooks e mais</span>
                </div>
            </div>
        </div>
    </div>{/* ==============================
Service Area  
============================== */}
    <section className="service-area3 positive-relative overflow-hidden space overflow-hidden" id="case-studies-sec">
        <div className="container th-container5">
            <div className="row justify-content-lg-between justify-content-center align-items-center">
                <div className="col-lg-7">
                    <div className="title-area text-center text-lg-start">
                        <span className="sub-title style3 text-anime-style-2">[ Funcionalidades ]</span>
                        <h2 className="sec-title h3 text-anime-style-3">Conheça o wChat em detalhes</h2>
                        <p className="wow fadeInUp fs-18">From converting up to 44% of chats into sales and cutting support
                            costs, to gaining actionable insights for new strategies, brands in any industry can thrive with
                            Aiorchat. </p>
                    </div>
                    <div className="sec-btn">
                        <div className="icon-box d-flex justify-content-lg-start justify-content-center">
                            <button data-slider-prev="#serviceSlider9" className="slider-arrow style2 default slider-prev"><img src="assets/img/icon/arrow-left3.svg" alt="" /></button>
                            <button data-slider-next="#serviceSlider9" className="slider-arrow style2 default slider-next"><img src="assets/img/icon/arrow-right3.svg" alt="" /></button>
                        </div>
                    </div>
                </div>
                <div className="col-auto">
                    <div className="btn-group mb-0 mb-md-5">
                        <a href="#case-studies-sec" className="th-btn2 btn-gradient">Ver funcionalidades</a>
                    </div>
                </div>
            </div>
            <div className="swiper th-slider has-shadow serviceSlider9" id="serviceSlider9" data-slider-options='{"loop":false,"mousewheel": {"enabled": true,"sensitivity": 4, "releaseOnEdges":true},"breakpoints":{"0":{"slidesPerView":1},"576":{"slidesPerView":"1"},"991":{"slidesPerView":"1"},"1356":{"slidesPerView":"2"},"1500":{"slidesPerView":"3"}}}'>
                <div className="swiper-wrapper">
                    <div className="swiper-slide">
                        <div className="service-box style2 wow fadeInUp" data-wow-delay=".1s">
                            <div className="box-wrapp">
                                <div className="box-img"><img src="assets/img/service/service_3_1.jpg" alt="" /></div>
                                <div className="box-content">
                                    <span className="sub-title style2">Agente IA</span>
                                    <h3 className="box-title"><a href="/case-details">Agente IA</a></h3>
                                    <p className="box-text">Automatize o atendimento com IA, gerencie vendas no CRM Kanban e conecte toda a equipe no mesmo WhatsApp.</p>
                                    <div className="icon"><img src="assets/img/icon/ser-logo1.png" alt="" /></div>
                                    <a href="#case-studies-sec" className="icon-btn"><span className="icon"><img src="assets/img/icon/arrow-right3.svg" alt="" /></span></a>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="swiper-slide">
                        <div className="service-box style2 wow fadeInUp" data-wow-delay=".3s">
                            <div className="box-wrapp">
                                <div className="box-img"><img src="assets/img/service/service_3_2.jpg" alt="" /></div>
                                <div className="box-content">
                                    <span className="sub-title style2">Dalfilo interior</span>
                                    <h3 className="box-title"><a href="/case-details">Dalfilo interior</a></h3>
                                    <p className="box-text">Automatize o atendimento com IA, gerencie vendas no CRM Kanban e conecte toda a equipe no mesmo WhatsApp.</p>
                                    <div className="icon"><img src="assets/img/icon/ser-logo2.png" alt="" /></div>
                                    <a href="#case-studies-sec" className="icon-btn"><span className="icon"><img src="assets/img/icon/arrow-right3.svg" alt="" /></span></a>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="swiper-slide">
                        <div className="service-box style2 wow fadeInUp" data-wow-delay=".5s">
                            <div className="box-wrapp">
                                <div className="box-img"><img src="assets/img/service/service_3_3.jpg" alt="" /></div>
                                <div className="box-content">
                                    <span className="sub-title style2">Burger Motorsports</span>
                                    <h3 className="box-title"><a href="/case-details">Burger Motorsports</a></h3>
                                    <p className="box-text">Automatize o atendimento com IA, gerencie vendas no CRM Kanban e conecte toda a equipe no mesmo WhatsApp.</p>
                                    <div className="icon"><img src="assets/img/icon/ser-logo3.png" alt="" /></div>
                                    <a href="#case-studies-sec" className="icon-btn"><span className="icon"><img src="assets/img/icon/arrow-right3.svg" alt="" /></span></a>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="swiper-slide">
                        <div className="service-box style2 wow fadeInUp" data-wow-delay=".7s">
                            <div className="box-wrapp">
                                <div className="box-img"><img src="assets/img/service/service_3_1.jpg" alt="" /></div>
                                <div className="box-content">
                                    <span className="sub-title style2">Agente IA</span>
                                    <h3 className="box-title"><a href="/case-details">Agente IA</a></h3>
                                    <p className="box-text">Automatize o atendimento com IA, gerencie vendas no CRM Kanban e conecte toda a equipe no mesmo WhatsApp.</p>
                                    <div className="icon"><img src="assets/img/icon/ser-logo1.png" alt="" /></div>
                                    <a href="#case-studies-sec" className="icon-btn"><span className="icon"><img src="assets/img/icon/arrow-right3.svg" alt="" /></span></a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    </section>{/* ==============================
Testimonial Area  
============================== */}
    <section className="testi-sec2 overflow-hidden position-relative space overflow-hidden" id="testi-sec">
        <div className="container th-container5">
            <div className="row gy-4 justify-content-between">
                <div className="col-xl-5">
                    <div className="title-area pe-xl-4 text-xl-start text-center">
                        <span className="sub-title style3 text-anime-style-2">[ Depoimentos ]</span>
                        <h2 className="sec-title h3 text-anime-style-3">O que nossos clientes dizem sobre o wChat</h2>
                    </div>
                    <div className=" text-xl-start text-center"><a href="/contact" className="th-btn2 btn-gradient">Ver todos</a>
                    </div>
                </div>
                <div className="col-xl-6">
                    <div className="testi-wrapper d-flex flex-column justify-content-center">
                        <div className="testi-card2">
                            <div className="box-wrapp">
                                <div className="box-profile">
                                    <div className="box-author">
                                        <img src="assets/img/testimonial/testi_2_1.png" alt="Avater" />
                                    </div>
                                    <div className="box-quote"><img src="assets/img/icon/quote6.svg" alt="" /></div>
                                </div>
                                <span className="rating"><i className="fa-sharp fa-solid fa-star-sharp"></i><i className="fa-sharp fa-solid fa-star-sharp"></i><i className="fa-sharp fa-solid fa-star-sharp"></i><i className="fa-sharp fa-solid fa-star-sharp"></i><i className="fa-sharp fa-solid fa-star-sharp"></i></span>
                            </div>
                            <p className="box-text">"O wChat transformou nossa operação comercial. Antes perdíamos leads no WhatsApp pessoal; agora temos controle total do funil de vendas."</p>
                            <div className="box-info">
                                <h3 className="box-title">Carlos Silva</h3>
                                <span className="box-desig">Diretor comercial</span>
                            </div>
                        </div>
                        <div className="testi-card2">
                            <div className="box-wrapp">
                                <div className="box-profile">
                                    <div className="box-author">
                                        <img src="assets/img/testimonial/testi_2_1.png" alt="Avater" />
                                    </div>
                                    <div className="box-quote"><img src="assets/img/icon/quote6.svg" alt="" /></div>
                                </div>
                                <span className="rating"><i className="fa-sharp fa-solid fa-star-sharp"></i><i className="fa-sharp fa-solid fa-star-sharp"></i><i className="fa-sharp fa-solid fa-star-sharp"></i><i className="fa-sharp fa-solid fa-star-sharp"></i><i className="fa-sharp fa-solid fa-star-sharp"></i></span>
                            </div>
                            <p className="box-text">"Com a inbox compartilhada, o time atende no mesmo número sem confusão. As automações de marketing reduziram nosso tempo de resposta pela metade."</p>
                            <div className="box-info">
                                <h3 className="box-title">Ana Paula Mendes</h3>
                                <span className="box-desig">Head de marketing</span>
                            </div>
                        </div>
                        <div className="testi-card2">
                            <div className="box-wrapp">
                                <div className="box-profile">
                                    <div className="box-author">
                                        <img src="assets/img/testimonial/testi_2_1.png" alt="Avater" />
                                    </div>
                                    <div className="box-quote"><img src="assets/img/icon/quote6.svg" alt="" /></div>
                                </div>
                                <span className="rating"><i className="fa-sharp fa-solid fa-star-sharp"></i><i className="fa-sharp fa-solid fa-star-sharp"></i><i className="fa-sharp fa-solid fa-star-sharp"></i><i className="fa-sharp fa-solid fa-star-sharp"></i><i className="fa-sharp fa-solid fa-star-sharp"></i></span>
                            </div>
                            <p className="box-text">"O agente de IA qualifica leads antes de chegar ao vendedor. Integramos com nosso ERP via API e tudo ficou centralizado no CRM."</p>
                            <div className="box-info">
                                <h3 className="box-title">Roberto Lima</h3>
                                <span className="box-desig">CEO — TechRetail</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>


    </section>
    <PricingSection />{/* ==============================
Faq Area
==============================  */}

    <div className="faq-area3 position-relative overflow-hidden space overflow-hidden" id="faq-sec">
        <div className="container th-container5">
            <div className="row gy-4 justify-content-center">
                <div className="col-xl-6">
                    <div className="title-area mb-40 text-center">
                        <span className="sub-title style3 text-anime-style-2">[ FAQ ]</span>
                        <h2 className="sec-title h3 text-anime-style-3">Frequently Ask Questions</h2>

                    </div>
                    <div className="btn-group wow fadeInUp justify-content-center mb-60 text-center">
                        <a href="/contact" className="th-btn2 btn-gradient extra style1">Tirar mais duvidas</a>
                    </div>
                </div>
            </div>
            <div className="row justify-content-center">
                <div className="col-lg-10">
                    <div className="accordion-area accordion" id="faqAccordion">


                        <div className="accordion-card style3  wow fadeInUp" data-wow-delay=".1s">


                            <h3 className="accordion-header" id="heading-1">
                                <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse-1" aria-expanded="false" aria-controls="collapse-1">
                                    1. How long does it take to set up Zipchat? </button>
                            </h3>


                            <div id="collapse-1" className="accordion-collapse collapse " aria-labelledby="heading-1" data-bs-parent="#faqAccordion" role="region">

                                <div className="accordion-body">
                                    <p className="faq-text">Aior is a task management platform designed for startups and
                                        growing teams. It helps you organize projects.. They are devoted to delivering
                                        customized support and can provide you with an extensive estimate tailored to
                                        your unique </p>
                                </div>
                            </div>
                        </div>


                        <div className="accordion-card style3 active wow fadeInUp" data-wow-delay=".3s">


                            <h3 className="accordion-header" id="heading-2">
                                <button className="accordion-button " type="button" data-bs-toggle="collapse" data-bs-target="#collapse-2" aria-expanded="true" aria-controls="collapse-2">
                                    2. How does it work? </button>
                            </h3>


                            <div id="collapse-2" className="accordion-collapse collapse show" aria-labelledby="heading-2" data-bs-parent="#faqAccordion" role="region">

                                <div className="accordion-body">
                                    <p className="faq-text">Aior is a task management platform designed for startups and
                                        growing teams. It helps you organize projects.. They are devoted to delivering
                                        customized support and can provide you with an extensive estimate tailored to
                                        your unique </p>
                                </div>
                            </div>
                        </div>


                        <div className="accordion-card style3  wow fadeInUp" data-wow-delay=".5s">


                            <h3 className="accordion-header" id="heading-3">
                                <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse-3" aria-expanded="false" aria-controls="collapse-3">
                                    3. does it work on any site/CMS? </button>
                            </h3>


                            <div id="collapse-3" className="accordion-collapse collapse " aria-labelledby="heading-3" data-bs-parent="#faqAccordion" role="region">

                                <div className="accordion-body">
                                    <p className="faq-text">Aior is a task management platform designed for startups and
                                        growing teams. It helps you organize projects.. They are devoted to delivering
                                        customized support and can provide you with an extensive estimate tailored to
                                        your unique </p>
                                </div>
                            </div>
                        </div>


                        <div className="accordion-card style3  wow fadeInUp" data-wow-delay=".7s">


                            <h3 className="accordion-header" id="heading-4">
                                <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse-4" aria-expanded="false" aria-controls="collapse-4">
                                    4. What languages does it speak? </button>
                            </h3>


                            <div id="collapse-4" className="accordion-collapse collapse " aria-labelledby="heading-4" data-bs-parent="#faqAccordion" role="region">

                                <div className="accordion-body">
                                    <p className="faq-text">Aior is a task management platform designed for startups and
                                        growing teams. It helps you organize projects.. They are devoted to delivering
                                        customized support and can provide you with an extensive estimate tailored to
                                        your unique </p>
                                </div>
                            </div>
                        </div>


                        <div className="accordion-card style3  wow fadeInUp" data-wow-delay=".8s">


                            <h3 className="accordion-header" id="heading-5">
                                <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse-5" aria-expanded="false" aria-controls="collapse-5">
                                    5. can you integrate with CRM and support platform? </button>
                            </h3>


                            <div id="collapse-5" className="accordion-collapse collapse " aria-labelledby="heading-5" data-bs-parent="#faqAccordion" role="region">

                                <div className="accordion-body">
                                    <p className="faq-text">Aior is a task management platform designed for startups and
                                        growing teams. It helps you organize projects.. They are devoted to delivering
                                        customized support and can provide you with an extensive estimate tailored to
                                        your unique </p>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>

        </div>
    </div>{/* ==============================
Blog Area  
============================== */}
    <section className="overflow-hidden space overflow-hidden" id="blog-sec">
        <div className="container">
            <div className="title-area text-center">
                <span className="sub-title style3 text-anime-style-2">[ Blog ]</span>
                <h2 className="sec-title h3 text-anime-style-3">Research Insights & Updates</h2>
            </div>
            <div className="slider-area">
                <div className="swiper th-slider has-shadow" id="blogSlider2" data-slider-options='{"loop":false,"mousewheel": {"enabled": true,"sensitivity": 4, "releaseOnEdges":true},"breakpoints":{"0":{"slidesPerView":1},"576":{"slidesPerView":"1"},"768":{"slidesPerView":"1"},"992":{"slidesPerView":"2"},"1200":{"slidesPerView":"3"}}}'>
                    <div className="swiper-wrapper">
                        <div className="swiper-slide">
                            <div className="blog-card style2 wow fadeInUp">
                                <div className="box-img global-img">
                                    <img src="assets/img/blog/blog_2_1.jpg" alt="blog image" />
                                </div>
                                <div className="box-content">
                                    <div className="blog-meta">
                                        <a href="/blog"> Jan 20, 2025</a>
                                    </div>
                                    <h3 className="box-title"><a href="/blog-details">Como aumentar suas vendas pelo WhatsApp em 2026</a></h3>
                                </div>
                            </div>
                        </div>

                        <div className="swiper-slide">
                            <div className="blog-card style2 wow fadeInUp">
                                <div className="box-img global-img">
                                    <img src="assets/img/blog/blog_2_2.jpg" alt="blog image" />
                                </div>
                                <div className="box-content">
                                    <div className="blog-meta">
                                        <a href="/blog"> Jan 22, 2025</a>
                                    </div>
                                    <h3 className="box-title"><a href="/blog-details">5 automações que todo time comercial precisa</a></h3>
                                </div>
                            </div>
                        </div>

                        <div className="swiper-slide">
                            <div className="blog-card style2 wow fadeInUp">
                                <div className="box-img global-img">
                                    <img src="assets/img/blog/blog_2_3.jpg" alt="blog image" />
                                </div>
                                <div className="box-content">
                                    <div className="blog-meta">
                                        <a href="/blog"> Jan 23, 2025</a>
                                    </div>
                                    <h3 className="box-title"><a href="/blog-details">IA no atendimento: como implementar sem complicacao</a></h3>
                                </div>
                            </div>
                        </div>

                        <div className="swiper-slide">
                            <div className="blog-card style2 wow fadeInUp">
                                <div className="box-img global-img">
                                    <img src="assets/img/blog/blog_2_1.jpg" alt="blog image" />
                                </div>
                                <div className="box-content">
                                    <div className="blog-meta">
                                        <a href="/blog"> Jan 25, 2025</a>
                                    </div>
                                    <h3 className="box-title"><a href="/blog-details">Como aumentar suas vendas pelo WhatsApp em 2026</a></h3>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
                <div className="icon-box mt-60 d-flex justify-content-center">
                    <button data-slider-prev="#blogSlider2" className="slider-arrow default slider-prev"><img src="assets/img/icon/arrow-left2.svg" alt="" /></button>
                    <button data-slider-next="#blogSlider2" className="slider-arrow default slider-next"><img src="assets/img/icon/arrow-right2.svg" alt="" /></button>
                </div>
            </div>
        </div>
    </section>{/* ==============================
Contact Area  
============================== */}
    <section className="contact-sec space overflow-hidden" data-bg-src="assets/img/bg/contact_bg_1.jpg" id="contact-sec">
        <div className="container th-container4">
            <div className="contact-area">
                <div className="row gy-40 gx-100 align-items-end">
                    <div className="col-xl-8">
                        <form action="mail.php" method="POST" className="contact-form ajax-contact">
                            <h3 className="title">Pronto para vender mais pelo WhatsApp?</h3>
                            <div className="row">
                                <div className="form-group col-md-6">
                                    <input type="text" className="form-control" name="name" id="name" placeholder="Nome completo" />

                                </div>
                                <div className="form-group col-md-6">
                                    <input type="email" className="form-control" name="email" id="email" placeholder="E-mail" />
                                </div>
                                <div className="form-group col-md-6">
                                    <input type="tel" className="form-control" name="number" id="number" placeholder="Telefone" />
                                </div>
                                <div className="form-group col-md-6">
                                    <select name="subject" id="subject" className="form-select nice-select">
                                        <option value="" disabled selected hidden>Qual plano te interessa?</option>
                                        <option value="Bridal Makeup">Starter — R$ 99/mes</option>
                                        <option value="Beard Treatments">Times — R$ 299/mes</option>
                                        <option value="Hair Coloring">Business — R$ 699/mes</option>
                                        <option value="Aromatherapy">Ainda nao sei</option>
                                    </select>
                                </div>
                                <div className="form-group col-12">
                                    <textarea name="message" id="message" cols="30" rows="3" className="form-control" placeholder="Sua mensagem"></textarea>
                                </div>
                                <div className="form-btn col-12">
                                    <p className="box-text">By sending this form I confirm that I have read and accept the Privacy Policy</p>
                                    <button className="th-btn">Enviar mensagem <span className="icon"><img src="assets/img/icon/arrow-right.svg" alt="" /></span></button>
                                </div>
                            </div>
                            <p className="form-messages mb-0 mt-3"></p>
                        </form>
                    </div>
                    <div className="col-xl-4">
                        <div className="contact-review">
                            <div className="box-profile">
                                <div className="box-author">
                                    <img src="assets/img/normal/author.png" alt="Avater" />
                                </div>
                                <div className="box-quote"><img src="assets/img/icon/quote3.svg" alt="" /></div>
                            </div>
                            <p className="box-text">O wChat mudou a forma como nossa equipe vende pelo WhatsApp. Recomendo demais!</p>
                            <div className="box-info">
                                <h3 className="box-title">Marina Oliveira</h3>
                                <span className="box-desig">Gerente Comercial</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>
    <SiteFooter onePage />
    </>
  );
}
