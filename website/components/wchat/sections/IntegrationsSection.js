const ICONS = [
  "assets/img/icon/icon1.svg",
  "assets/img/icon/icon2.svg",
  "assets/img/icon/icon3.svg",
  "assets/img/icon/icon4.svg",
  "assets/img/icon/icon5.svg",
  "assets/img/icon/icon6.svg",
  "assets/img/icon/icon7.svg",
  "assets/img/icon/icon8.svg",
];

export default function IntegrationsSection() {
  return (
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
              <div className="integration-shape">
                <img src="assets/img/shape/line-shape3.png" alt="" />
              </div>
              <div className="integration-logo">
                <img src="assets/img/shape/logo2.png" alt="wChat" />
              </div>
            </div>
          </div>
          <div className="box-wrapp">
            {ICONS.map((src) => (
              <div key={src} className="integration-icon">
                <img src={src} alt="" />
              </div>
            ))}
          </div>
          <div className="btn-group mt-80 justify-content-center flex-column">
            <a href="#features-sec" className="th-btn2 btn-gradient">
              Ver integrações
            </a>
            <span className="fs-18">WhatsApp, N8N, webhooks e mais</span>
          </div>
        </div>
      </div>
    </div>
  );
}
