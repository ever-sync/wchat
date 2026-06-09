import { TESTIMONIALS } from "../content/testimonials";

export default function TestimonialsSection({ showCta = true }) {
  return (
    <section className="testi-sec2 overflow-hidden position-relative space overflow-hidden" id="testi-sec">
      <div className="container th-container5">
        <div className="row gy-4 justify-content-between">
          <div className="col-xl-5">
            <div className="title-area pe-xl-4 text-xl-start text-center">
              <span className="sub-title style3 text-anime-style-2">[ Depoimentos ]</span>
              <h2 className="sec-title h3 text-anime-style-3">O que nossos clientes dizem sobre o wChat</h2>
            </div>
            {showCta && (
              <div className="text-xl-start text-center">
                <a href="/contact" className="th-btn2 btn-gradient">
                  Ver todos
                </a>
              </div>
            )}
          </div>
          <div className="col-xl-6">
            <div className="testi-wrapper d-flex flex-column justify-content-center">
              {TESTIMONIALS.map((item) => (
                <div key={item.name} className="testi-card2">
                  <div className="box-wrapp">
                    <div className="box-profile">
                      <div className="box-author">
                        <img src="assets/img/testimonial/testi_2_1.png" alt={item.name} />
                      </div>
                      <div className="box-quote">
                        <img src="assets/img/icon/quote6.svg" alt="" />
                      </div>
                    </div>
                    <span className="rating">
                      <i className="fa-sharp fa-solid fa-star-sharp"></i>
                      <i className="fa-sharp fa-solid fa-star-sharp"></i>
                      <i className="fa-sharp fa-solid fa-star-sharp"></i>
                      <i className="fa-sharp fa-solid fa-star-sharp"></i>
                      <i className="fa-sharp fa-solid fa-star-sharp"></i>
                    </span>
                  </div>
                  <p className="box-text">&ldquo;{item.quote}&rdquo;</p>
                  <div className="box-info">
                    <h3 className="box-title">{item.name}</h3>
                    <span className="box-desig">{item.role}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
