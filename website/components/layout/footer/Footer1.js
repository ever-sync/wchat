import Link from "next/link"

export default function Footer1() {
    return (
        <>
        <footer className="main-footer bg-color-2">
            <div className="widget-section">
                <div className="auto-container">
                    <div className="row clearfix">
                        <div className="col-lg-4 col-md-6 col-sm-12 footer-column">
                            <div className="footer-widget about-widget">
                                <div className="widget-title">
                                    <h3>Nossa comunidade</h3>
                                </div>
                                <div className="widget-content">
                                    <ul className="clients-list clearfix">
                                        <li><img src="assets/images/resource/clients-1.jpg" alt=""/></li>
                                        <li><img src="assets/images/resource/clients-2.jpg" alt=""/></li>
                                        <li><img src="assets/images/resource/clients-3.jpg" alt=""/></li>
                                        <li><h5>+5k</h5></li>
                                    </ul>
                                    <h3>Quem usa, recomenda</h3>
                                    <p>Times comerciais que adotaram o wChat ganham tempo no atendimento e fecham mais negócios pelo WhatsApp.</p>
                                    <h4>Time wChat</h4>
                                    <span className="designation">Construindo o melhor CRM no WhatsApp</span>
                                    <h6><i className="fa-brands fa-facebook"></i><Link href="/">Participe da comunidade</Link></h6>
                                </div>
                            </div>
                        </div>
                        <div className="col-lg-2 col-md-6 col-sm-12 footer-column">
                            <div className="footer-widget links-widget">
                                <div className="widget-title">
                                    <h3>Recursos</h3>
                                </div>
                                <div className="widget-content">
                                    <ul className="links-list clearfix">
                                        <li><Link href="/">CRM</Link></li>
                                        <li><Link href="/">Inbox compartilhado</Link></li>
                                        <li><Link href="/">Automações</Link></li>
                                        <li><Link href="/">Campanhas</Link></li>
                                        <li><Link href="/">Formulários</Link></li>
                                        <li><Link href="/">Funis de venda</Link></li>
                                        <li><Link href="/">Relatórios</Link></li>
                                        <li><Link href="/">API e webhooks</Link></li>
                                        <li><Link href="/">Multiusuário</Link></li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                        <div className="col-lg-2 col-md-6 col-sm-12 footer-column">
                            <div className="footer-widget links-widget">
                                <div className="widget-title">
                                    <h3>Empresa</h3>
                                </div>
                                <div className="widget-content">
                                    <ul className="links-list clearfix">
                                        <li><Link href="/about">Sobre nós</Link></li>
                                        <li><Link href="/pricing">Preços</Link></li>
                                        <li><Link href="/">Imprensa</Link></li>
                                        <li><Link href="/">Parceiros</Link></li>
                                        <li><h3>Suporte</h3></li>
                                        <li><Link href="/">Central de ajuda</Link></li>
                                        <li><Link href="/">Treinamentos ao vivo</Link></li>
                                        <li><Link href="/">Comunidade</Link></li>
                                        <li><Link href="/">Status</Link></li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                        <div className="col-lg-4 col-md-6 col-sm-12 footer-column">
                            <div className="footer-widget subscribe-widget">
                                <div className="widget-title">
                                    <h3>Receba novidades</h3>
                                </div>
                                <div className="widget-content">
                                    <p>Inscreva-se na nossa newsletter e receba atualizações direto no seu e-mail.</p>
                                    <div className="form-inner">
                                        <div className="shape" style={{ backgroundImage: 'url(assets/images/shape/shape-25.png)' }}></div>
                                        <form method="post" action="/contact">
                                            <div className="form-group">
                                                <div className="icon"><i className="far fa-envelope-open"></i></div>
                                                <input type="email" name="email" placeholder="Seu e-mail..." required/>
                                                <button type="submit" className="theme-btn btn-one">Inscrever-se</button>
                                            </div>
                                        </form>
                                    </div>
                                    <h3>Siga a gente</h3>
                                    <ul className="social-links clearfix">
                                        <li><Link href="/"><i className="fa-brands fa-facebook"></i></Link></li>
                                        <li><Link href="/"><i className="fa-brands fa-square-twitter"></i></Link></li>
                                        <li><Link href="/"><i className="fa-solid fa-basketball"></i></Link></li>
                                        <li><Link href="/"><i className="fa-brands fa-youtube"></i></Link></li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div className="footer-bottom">
                <div className="auto-container">
                    <div className="bottom-inner">
                        <div className="copyright"><p>Copyright {new Date().getFullYear()} <Link href="/">wChat.</Link> Todos os direitos reservados.</p></div>
                        <ul className="footer-nav clearfix">
                            <li><Link href="/">Política de Privacidade</Link></li>
                            <li><Link href="">Termos de Uso</Link></li>
                            <li><Link href="/">Jurídico</Link></li>
                        </ul>
                    </div>
                </div>
            </div>
        </footer>

        </>
    )
}
