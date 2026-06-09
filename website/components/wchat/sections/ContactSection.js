export default function ContactSection() {
  return (
    <section className="contact-sec space overflow-hidden" data-bg-src="assets/img/bg/contact_bg_1.jpg" id="contact-sec">
      <div className="container th-container4">
        <div className="contact-area">
          <div className="row gy-40 gx-100 align-items-end">
            <div className="col-xl-8">
              <form action="mail.php" method="POST" className="contact-form ajax-contact">
                <h3 className="title">Pronto para vender mais pelo WhatsApp?</h3>
                <div className="row">
                  <div className="form-group col-md-6">
                    <input type="text" className="form-control" name="name" id="name" placeholder="Nome completo" />
                  </div>
                  <div className="form-group col-md-6">
                    <input type="email" className="form-control" name="email" id="email" placeholder="E-mail" />
                  </div>
                  <div className="form-group col-md-6">
                    <input type="tel" className="form-control" name="number" id="number" placeholder="Telefone" />
                  </div>
                  <div className="form-group col-md-6">
                    <select name="subject" id="subject" className="form-select nice-select" defaultValue="">
                      <option value="" disabled>
                        Qual plano te interessa?
                      </option>
                      <option value="starter">Starter — R$ 99/mês</option>
                      <option value="times">Times — R$ 299/mês</option>
                      <option value="business">Business — R$ 699/mês</option>
                      <option value="unknown">Ainda não sei</option>
                    </select>
                  </div>
                  <div className="form-group col-12">
                    <textarea
                      name="message"
                      id="message"
                      cols="30"
                      rows="3"
                      className="form-control"
                      placeholder="Sua mensagem"
                    ></textarea>
                  </div>
                  <div className="form-btn col-12">
                    <p className="box-text">
                      Ao enviar este formulário, confirmo que li e aceito a Política de Privacidade.
                    </p>
                    <button className="th-btn">
                      Enviar mensagem{" "}
                      <span className="icon">
                        <img src="assets/img/icon/arrow-right.svg" alt="" />
                      </span>
                    </button>
                  </div>
                </div>
                <p className="form-messages mb-0 mt-3"></p>
              </form>
            </div>
            <div className="col-xl-4">
              <div className="contact-review">
                <div className="box-profile">
                  <div className="box-author">
                    <img src="assets/img/normal/author.png" alt="Marina Oliveira" />
                  </div>
                  <div className="box-quote">
                    <img src="assets/img/icon/quote3.svg" alt="" />
                  </div>
                </div>
                <p className="box-text">
                  O wChat mudou a forma como nossa equipe vende pelo WhatsApp. Recomendo demais!
                </p>
                <div className="box-info">
                  <h3 className="box-title">Marina Oliveira</h3>
                  <span className="box-desig">Gerente comercial</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
