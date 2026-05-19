import React from 'react'

function Contact() {
  return (
    <>
      <section className="contact-section sec-pad-2">
            <div className="pattern-layer" style={{ backgroundImage: "url(assets/images/shape/shape-4.jpg)" }}></div>
            <div className="auto-container">
                <div className="row align-items-center">
                    <div className="col-lg-6 col-md-12 col-sm-12 content-column">
                        <div className="content-box">
                            <div className="sec-title light">
                                <h6>[ Fale com a gente ]</h6>
                                <h2>Vamos conversar <br />sobre o seu time</h2>
                            </div>
                            <div className="inner-box">
                                <h4>Quero saber sobre;</h4>
                                <ul className="list-item clearfix">
                                    <li>
                                        <div className="check-box">
                                            <input className="check" type="checkbox" id="checkbox1"/>
                                            <label htmlFor="checkbox1">Demonstração do wChat</label>
                                        </div>
                                    </li>
                                    <li>
                                        <div className="check-box">
                                            <input className="check" type="checkbox" id="checkbox2"/>
                                            <label htmlFor="checkbox2">Migração e onboarding</label>
                                        </div>
                                    </li>
                                    <li>
                                        <div className="check-box">
                                            <input className="check" type="checkbox" id="checkbox3"/>
                                            <label htmlFor="checkbox3">Integrações e API</label>
                                        </div>
                                    </li>
                                    <li>
                                        <div className="check-box">
                                            <input className="check" type="checkbox" id="checkbox4"/>
                                            <label htmlFor="checkbox4">Plano corporativo</label>
                                        </div>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                    <div className="col-lg-6 col-md-12 col-sm-12 form-column">
                        <div className="form-inner">
                            <form method="post" action="contact.html">
                                <div className="form-group">
                                    <div className="text">
                                        <div className="icon"><img src="assets/images/icons/icon-37.png" alt=""/></div>
                                        <label>Seu nome</label>
                                    </div>
                                    <input type="text" name="name" placeholder="Digite seu nome" required/>
                                </div>
                                <div className="form-group">
                                    <div className="text">
                                        <div className="icon"><img src="assets/images/icons/icon-38.png" alt=""/></div>
                                        <label>E-mail</label>
                                    </div>
                                    <input type="email" name="email" placeholder="seu@email.com" required/>
                                </div>
                                <div className="form-group">
                                    <div className="text">
                                        <div className="icon"><img src="assets/images/icons/icon-39.png" alt=""/></div>
                                        <label>Mensagem</label>
                                    </div>
                                    <textarea name="message" placeholder="Como podemos ajudar?"></textarea>
                                </div>
                                <div className="form-group message-btn">
                                    <button type="submit" className="theme-btn btn-two">Enviar mensagem</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    </>
  )
}

export default Contact
