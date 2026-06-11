import { FEATURES } from "../content/features";

export default function FeaturesSection({ showHeading = true }) {
  return (
    <section className="feature-area2 space" id="features-sec">
      <div className="container th-container5">
        {showHeading && (
          <div className="row justify-content-center">
            <div className="col-lg-9">
              <div className="title-area text-center">
                <span className="sub-title style3 text-anime-style-2">[ Recursos ]</span>
                <h2 className="sec-title h3 text-anime-style-3">Tudo o que seu time precisa — em um só lugar</h2>
              </div>
            </div>
          </div>
        )}
        <div className="row gy-4">
          {FEATURES.map((feature) => (
            <div key={feature.title} className="col-md-6 col-xl-4">
              <div className="feature-grid4">
                <div className="shape"></div>
                <div className="box-icon">
                  <img src={feature.icon} alt="" />
                </div>
                <div>
                  <h3 className="box-title">{feature.title}</h3>
                  <p className="box-text">{feature.text}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
