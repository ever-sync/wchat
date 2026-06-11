export default function SiteFooter({ onePage = false }) {
  const featureHref = onePage ? "#features-sec" : "/#features-sec";
  const testiHref = onePage ? "#testi-sec" : "/#testi-sec";

  return (
    <footer className="footer-wrapper footer-layout2 footer-layout8" data-bg-src="assets/img/bg/footer_bg_3.png">
      <div className="widget-area">
        <div className="container th-container5">
          <div className="footer-top ">
            <div className="row gx-40 gy-4 justify-content-center justify-content-lg-between">
              <div className="col-lg-5">
                <div className="footer-logo">
                  <img src="assets/img/logo9.svg" alt="wChat" />
                </div>
              </div>
              <div className="col-lg-6">
                <div className="ps-xl-5">
                  <h2 className="box-title text-white">Comece a vender mais hoje</h2>
                  <div className="btn-group justify-content-center justify-content-lg-start">
                    <a href="/register" className="th-btn2 btn-gradient">
                      Começar grátis
                    </a>
                    <a href="/contact" className="th-btn2 style3">
                      Falar com consultor
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="container th-container5">
        <div className="row gy-4 justify-content-between">
          <div className="col-md-6 col-xl-4">
            <div className="widget footer-widget">
              <h3 className="widget_title">[ Sobre ]</h3>
              <div className="th-widget-about">
                <p className="about-text">
                  O wChat é a plataforma completa de CRM, inbox compartilhado e IA para times que vendem pelo
                  WhatsApp. Teste 7 dias grátis.
                </p>
                <div className="th-social">
                  <a href="https://www.facebook.com/">
                    <i className="fab fa-facebook-f"></i>
                  </a>
                  <a href="https://www.twitter.com/">
                    <i className="fab fa-twitter"></i>
                  </a>
                  <a href="https://www.youtube.com/">
                    <i className="fa-brands fa-instagram"></i>
                  </a>
                  <a href="https://www.linkedin.com/">
                    <i className="fab fa-linkedin-in"></i>
                  </a>
                </div>
              </div>
            </div>
          </div>
          <div className="col-md-6 col-xl-auto">
            <div className="widget widget_nav_menu footer-widget">
              <h3 className="widget_title">[ Produto ]</h3>
              <div className="menu-all-pages-container">
                <ul className="menu">
                  <li>
                    <a href={featureHref}>CRM no WhatsApp</a>
                  </li>
                  <li>
                    <a href={featureHref}>Inbox compartilhado</a>
                  </li>
                  <li>
                    <a href={featureHref}>Automações de marketing</a>
                  </li>
                  <li>
                    <a href={featureHref}>Agente IA</a>
                  </li>
                  <li>
                    <a href={featureHref}>Relatórios</a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          <div className="col-md-6 col-xl-auto">
            <div className="widget widget_nav_menu footer-widget">
              <h3 className="widget_title">[ Empresa ]</h3>
              <div className="menu-all-pages-container">
                <ul className="menu">
                  <li>
                    <a href="/about">Sobre nós</a>
                  </li>
                  <li>
                    <a href="/blog">Blog</a>
                  </li>
                  <li>
                    <a href="/faq">Perguntas frequentes</a>
                  </li>
                  <li>
                    <a href="/contact">Seja parceiro</a>
                  </li>
                  <li>
                    <a href="/about">Como funciona</a>
                  </li>
                  <li>
                    <a href={testiHref}>Depoimentos</a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          <div className="col-md-6 col-xl-auto">
            <div className="widget widget_nav_menu footer-widget">
              <h3 className="widget_title">[ Recursos ]</h3>
              <div className="menu-all-pages-container">
                <ul className="menu">
                  <li>
                    <a href={featureHref}>Painel em tempo real</a>
                  </li>
                  <li>
                    <a href={featureHref}>Integrações e API</a>
                  </li>
                  <li>
                    <a href={featureHref}>Relatórios automáticos</a>
                  </li>
                  <li>
                    <a href={featureHref}>Suporte dedicado</a>
                  </li>
                  <li>
                    <a href={featureHref}>Webhooks e N8N</a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="container">
        <div className="copyright-wrap">
          <div className="row gy-2 align-items-center justify-content-between">
            <p className="copyright-text">
              <i className="fal fa-copyright"></i> Copyright wChat 2026. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
