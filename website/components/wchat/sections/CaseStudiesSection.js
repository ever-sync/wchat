import { CASE_STUDIES } from "../content/caseStudies";

export default function CaseStudiesSection() {
  const slides = [...CASE_STUDIES, CASE_STUDIES[0]];

  return (
    <section className="service-area3 positive-relative overflow-hidden space overflow-hidden" id="case-studies-sec">
      <div className="container th-container5">
        <div className="row justify-content-lg-between justify-content-center align-items-center">
          <div className="col-lg-7">
            <div className="title-area text-center text-lg-start">
              <span className="sub-title style3 text-anime-style-2">[ Funcionalidades ]</span>
              <h2 className="sec-title h3 text-anime-style-3">Conheça o wChat em detalhes</h2>
              <p className="wow fadeInUp fs-18">
                Do primeiro contato ao fechamento: CRM, inbox, automações e IA trabalhando juntos para converter mais
                conversas em vendas.
              </p>
            </div>
            <div className="sec-btn">
              <div className="icon-box d-flex justify-content-lg-start justify-content-center">
                <button data-slider-prev="#serviceSlider9" className="slider-arrow style2 default slider-prev">
                  <img src="assets/img/icon/arrow-left3.svg" alt="Anterior" />
                </button>
                <button data-slider-next="#serviceSlider9" className="slider-arrow style2 default slider-next">
                  <img src="assets/img/icon/arrow-right3.svg" alt="Próximo" />
                </button>
              </div>
            </div>
          </div>
          <div className="col-auto">
            <div className="btn-group mb-0 mb-md-5">
              <a href="/cases" className="th-btn2 btn-gradient">
                Ver casos de uso
              </a>
            </div>
          </div>
        </div>
        <div
          className="swiper th-slider has-shadow serviceSlider9"
          id="serviceSlider9"
          data-slider-options='{"loop":false,"mousewheel": {"enabled": true,"sensitivity": 4, "releaseOnEdges":true},"breakpoints":{"0":{"slidesPerView":1},"576":{"slidesPerView":"1"},"991":{"slidesPerView":"1"},"1356":{"slidesPerView":"2"},"1500":{"slidesPerView":"3"}}}'
        >
          <div className="swiper-wrapper">
            {slides.map((item, i) => (
              <div key={`${item.title}-${i}`} className="swiper-slide">
                <div className="service-box style2 wow fadeInUp" data-wow-delay={item.delay}>
                  <div className="box-wrapp">
                    <div className="box-img">
                      <img src={item.image} alt={item.title} />
                    </div>
                    <div className="box-content">
                      <span className="sub-title style2">{item.tag}</span>
                      <h3 className="box-title">
                        <a href="/cases">{item.title}</a>
                      </h3>
                      <p className="box-text">{item.text}</p>
                      <div className="icon">
                        <img src={item.logo} alt="" />
                      </div>
                      <a href="/cases" className="icon-btn">
                        <span className="icon">
                          <img src="assets/img/icon/arrow-right3.svg" alt="" />
                        </span>
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
