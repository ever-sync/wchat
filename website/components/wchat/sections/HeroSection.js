export default function HeroSection() {
  return (
    <div className="th-hero-wrapper hero-8" id="hero" data-bg-src="assets/img/bg/hero_bg_8.png">
      <div className="container th-container5">
        <div className="row align-items-center">
          <div className="col-xl-8">
            <div className="hero-style8">
              <span className="rating">
                <i className="fa-sharp fa-solid fa-star-sharp"></i>
                <i className="fa-sharp fa-solid fa-star-sharp"></i>
                <i className="fa-sharp fa-solid fa-star-sharp"></i>
                <i className="fa-sharp fa-solid fa-star-sharp"></i>
                <i className="fa-sharp fa-solid fa-star-sharp"></i>
                5/5 (1.850+ avaliações)
              </span>
              <h1 className="hero-title">
                Venda mais pelo <span className="title"> WhatsApp</span>, sem perder o controle.
              </h1>
              <p className="hero-text">
                CRM, inbox compartilhada, agentes de IA e automações de marketing em uma única plataforma.
              </p>
              <div className="hero-wrapp">
                <div className="btn-group justify-content-center justify-content-xl-start">
                  <a href="/register" className="th-btn2 btn-gradient">
                    Criar conta grátis
                  </a>
                  <a href="/contact" className="th-btn2 style5">
                    Falar com consultor
                  </a>
                </div>
              </div>
            </div>
          </div>
          <div className="col-xl-4">
            <div className="hero-img7 movingX">
              <img src="assets/img/wchat/image.png" alt="Painel wChat" />
            </div>
          </div>
        </div>
      </div>
      <div className="shape-mockup d-none d-xxl-block spin" data-top="21%" data-left="8%">
        <img src="assets/img/shape/element-15.svg" alt="" />
      </div>
    </div>
  );
}
