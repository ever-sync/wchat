import ArrowIcon from "../ArrowIcon";

const CHECKLIST = [
  "Gestão comercial integrada",
  "Inbox compartilhado",
  "Automações e campanhas",
  "Agente de IA",
  "Novos recursos toda semana",
  "99,9% de uptime",
];

export default function AboutSection({ variant = "home" }) {
  const isPage = variant === "page";

  return (
    <div className="about-area4 overflow-hidden space" id="about-sec">
      <div className="container th-container5">
        <div className="row gy-4 align-items-center">
          <div className="col-lg-8">
            <div className="title-area">
              <span className="sub-title style6 text-anime-style-2">
                <span className="number">01</span>
                <span className="title">Sobre nós</span>
              </span>
              <h2 className="sec-title style3 text-anime-style-3">
                {isPage
                  ? "Construímos o wChat para times que vendem pelo WhatsApp todos os dias"
                  : "Nascemos pra resolver o caos do atendimento comercial no WhatsApp"}
              </h2>
              {isPage && (
                <p className="mt-3 fs-18 wow fadeInUp">
                  O wChat une CRM, inbox compartilhado, automações e IA em uma plataforma pensada para operações
                  comerciais reais — sem planilhas, sem WhatsApp pessoal e sem leads perdidos no meio do caminho.
                </p>
              )}
            </div>
            <div className="checklist list-two-column about-checklist wow fadeInUp" data-wow-delay=".6s">
              <ul>
                {CHECKLIST.map((item, i) => (
                  <li key={item} className="wow fadeInUp" data-wow-delay={`.${i + 1}s`}>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="btn-group mt-45 wow fadeInUp" data-wow-delay=".8s">
              {isPage ? (
                <a href="/register" className="th-btn2 btn-gradient">
                  Começar teste grátis
                </a>
              ) : (
                <a href="/about" className="th-btn3 style5">
                  <span>
                    <span className="text-1">Conheça o wChat </span>
                    <span className="text-2">Conheça o wChat </span>
                  </span>
                  <ArrowIcon />
                </a>
              )}
            </div>
          </div>
          <div className="col-lg-4">
            <div className="img-box4">
              <div className="img1 image scale">
                <img src="assets/img/normal/about_4_1.jpg" alt="Equipe usando wChat" />
              </div>
              <div className="th-experience wow fadeInUp" data-wow-delay=".4s">
                <div className="th-experience_content">
                  <h2 className="experience-year">
                    <span className="counter-number">25</span>+
                  </h2>
                  <p className="experience-text">Recursos integrados</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
