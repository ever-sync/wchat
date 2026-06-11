import { FAQ_ITEMS } from "../content/faq";

export default function FaqSection({
  items = FAQ_ITEMS,
  accordionId = "faqAccordion",
  showCta = true,
  sectionId = "faq-sec",
  title = "Perguntas frequentes",
  subtitle = "[ FAQ ]",
}) {
  return (
    <div className="faq-area3 position-relative overflow-hidden space overflow-hidden" id={sectionId}>
      <div className="container th-container5">
        <div className="row gy-4 justify-content-center">
          <div className="col-xl-6">
            <div className="title-area mb-40 text-center">
              <span className="sub-title style3 text-anime-style-2">{subtitle}</span>
              <h2 className="sec-title h3 text-anime-style-3">{title}</h2>
            </div>
            {showCta && (
              <div className="btn-group wow fadeInUp justify-content-center mb-60 text-center">
                <a href="/contact" className="th-btn2 btn-gradient extra style1">
                  Tirar mais dúvidas
                </a>
              </div>
            )}
          </div>
        </div>
        <div className="row justify-content-center">
          <div className="col-lg-10">
            <div className="accordion-area accordion" id={accordionId}>
              {items.map((item, index) => (
                <div
                  key={item.id}
                  className={`accordion-card style3 ${item.open ? "active" : ""} wow fadeInUp`}
                  data-wow-delay={`.${index * 2 + 1}s`}
                >
                  <h3 className="accordion-header" id={`heading-${item.id}`}>
                    <button
                      className={`accordion-button ${item.open ? "" : "collapsed"}`}
                      type="button"
                      data-bs-toggle="collapse"
                      data-bs-target={`#collapse-${item.id}`}
                      aria-expanded={item.open}
                      aria-controls={`collapse-${item.id}`}
                    >
                      {index + 1}. {item.question}
                    </button>
                  </h3>
                  <div
                    id={`collapse-${item.id}`}
                    className={`accordion-collapse collapse ${item.open ? "show" : ""}`}
                    aria-labelledby={`heading-${item.id}`}
                    data-bs-parent={`#${accordionId}`}
                    role="region"
                  >
                    <div className="accordion-body">
                      <p className="faq-text">{item.answer}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
