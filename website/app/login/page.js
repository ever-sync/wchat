import Link from "next/link"

export default function login() {

    return (
        <>
            <section className="user-form-section login-section centred">
                <div className="pattern-layer" style={{ backgroundImage: "url(assets/images/shape/shape-6.jpg)" }}></div>
                <div className="auto-container">
                    <div className="sec-title light">
                        <h6>[ Entrar ]</h6>
                        <h2>Bem-vindo de volta ao wChat</h2>
                        <p>Acesse sua conta</p>
                    </div>
                    <div className="inner-box">
                        <div className="form-inner">
                            <div className="shape" style={{ backgroundImage: "url(assets/images/shape/shape-51.png)" }}></div>
                            <form action="/login" method="post">
                                <div className="form-group">
                                    <div className="text-box">
                                        <div className="icon"><img src="assets/images/icons/icon-57.png" alt=""/></div>
                                        <h6>E-mail ou usuário</h6>
                                    </div>
                                    <input type="text" name="name" placeholder="seu@email.com" required=""/>
                                </div>
                                <div className="form-group">
                                    <div className="text-box">
                                        <div className="icon"><img src="assets/images/icons/icon-58.png" alt=""/></div>
                                        <h6>Senha</h6>
                                    </div>
                                    <input type="password" name="password" placeholder="••••••••" required=""/>
                                </div>
                                <div className="form-group option-box">
                                    <div className="check-box">
                                        <input className="check" type="checkbox" id="checkbox1"/>
                                        <label htmlFor="checkbox1">Lembrar-me</label>
                                    </div>
                                    <button type="button" className="forgot-button">Esqueci a senha</button>
                                </div>
                                <div className="form-group message-btn">
                                    <button type="submit" className="theme-btn btn-one">Entrar no wChat</button>
                                </div>
                            </form>
                        </div>
                        <div className="other-text">
                            <h6>ou</h6>
                        </div>
                        <ul className="download-list clearfix">
                            <li><Link href="/login"><img src="assets/images/icons/icon-59.png" alt=""/>Continuar com Google</Link></li>
                            <li><Link href="/login"><img src="assets/images/icons/icon-60.png" alt=""/>Continuar com Apple</Link></li>
                        </ul>
                        <div className="lower-text">
                            <h6>Ainda não tem conta? <Link href="/register">Cadastre-se</Link></h6>
                        </div>
                    </div>
                </div>
            </section>
        </>
    )
}
