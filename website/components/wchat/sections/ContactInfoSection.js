export default function ContactInfoSection() {
  return (
    <section className="space-top">
      <div className="container th-container5">
        <div className="title-area text-center mb-50">
          <span className="sub-title style3 text-anime-style-2">[ Contato ]</span>
          <h2 className="sec-title h3 text-anime-style-3">Vamos conversar e descobrir o melhor plano</h2>
          <p className="fs-18">Estamos prontos para te ajudar a vender mais pelo WhatsApp.</p>
        </div>
        <div className="row gy-4 justify-content-center">
          <div className="col-md-4">
            <div className="feature-grid4 text-center h-100">
              <div className="box-icon mx-auto mb-3">
                <i className="fa-solid fa-phone fa-2x" style={{ color: "var(--theme-color)" }}></i>
              </div>
              <h3 className="box-title">Telefone</h3>
              <p className="box-text">Fale com o nosso time e tire suas dúvidas agora mesmo.</p>
              <a href="tel:+5511999999999" className="fw-semibold">
                +55 (11) 99999-9999
              </a>
            </div>
          </div>
          <div className="col-md-4">
            <div className="feature-grid4 text-center h-100">
              <div className="box-icon mx-auto mb-3">
                <i className="fa-solid fa-envelope fa-2x" style={{ color: "var(--theme-color)" }}></i>
              </div>
              <h3 className="box-title">E-mail</h3>
              <p className="box-text">Mande sua dúvida ou peça uma demonstração.</p>
              <a href="mailto:contato@wchat.com.br" className="fw-semibold">
                contato@wchat.com.br
              </a>
            </div>
          </div>
          <div className="col-md-4">
            <div className="feature-grid4 text-center h-100">
              <div className="box-icon mx-auto mb-3">
                <i className="fa-solid fa-clock fa-2x" style={{ color: "var(--theme-color)" }}></i>
              </div>
              <h3 className="box-title">Horário</h3>
              <p className="box-text">Segunda a sexta, das 9h às 18h (horário de Brasília).</p>
              <span className="fw-semibold">Resposta em até 24h</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
