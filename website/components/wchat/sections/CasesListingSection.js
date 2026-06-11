import { CASE_STUDIES } from "../content/caseStudies";

export default function CasesListingSection() {
  return (
    <section className="service-area3 overflow-hidden space" id="cases-listing">
      <div className="container th-container5">
        <div className="row justify-content-center">
          <div className="col-lg-8">
            <div className="title-area text-center">
              <span className="sub-title style3 text-anime-style-2">[ Funcionalidades ]</span>
              <h2 className="sec-title h3 text-anime-style-3">Tudo que o wChat faz pelo seu time comercial</h2>
              <p className="fs-18 wow fadeInUp">
                Do primeiro contato ao fechamento: CRM, inbox, automações, IA e integrações em uma única plataforma.
              </p>
            </div>
          </div>
        </div>
        <div className="row gy-4">
          {CASE_STUDIES.map((item) => (
            <div key={item.title} className="col-md-6 col-xl-4">
              <div className="service-box style2 wow fadeInUp h-100" data-wow-delay={item.delay}>
                <div className="box-wrapp">
                  <div className="box-img">
                    <img src={item.image} alt={item.title} />
                  </div>
                  <div className="box-content">
                    <span className="sub-title style2">{item.tag}</span>
                    <h3 className="box-title">
                      <a href="/case-details">{item.title}</a>
                    </h3>
                    <p className="box-text">{item.text}</p>
                    <div className="icon">
                      <img src={item.logo} alt="" />
                    </div>
                    <a href="/case-details" className="icon-btn">
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
        <div className="btn-group mt-50 justify-content-center">
          <a href="/register" className="th-btn2 btn-gradient">
            Começar teste grátis
          </a>
        </div>
      </div>
    </section>
  );
}
