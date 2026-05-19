import Link from "next/link"

export default function Footer2() {
    return (
        <>

        <footer className="footer-style-two">
            <div className="widget-section">
                <div className="auto-container">
                    <div className="row clearfix">
                        <div className="col-lg-3 col-md-6 col-sm-12 footer-column">
                            <div className="footer-widget about-widget">
                                <div className="widget-title">
                                    <h3>Sobre Nós</h3>
                                </div>
                                <div className="widget-content">
                                    <p>O wChat reúne CRM, inbox compartilhado e automações de marketing no WhatsApp para o seu time vender e atender em um só lugar.</p>
                                    <div className="copyright">&copy; {new Date().getFullYear()} <Link href="/">wChat.</Link> Todos os direitos reservados.</div>
                                    <figure className="footer-logo"><Link href="/"><img src="assets/images/logo-2.png" alt=""/></Link></figure>
                                </div>
                            </div>
                        </div>
                        <div className="col-lg-3 col-md-6 col-sm-12 footer-column">
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
                                    </ul>
                                </div>
                            </div>
                        </div>
                        <div className="col-lg-3 col-md-6 col-sm-12 footer-column">
                            <div className="footer-widget links-widget">
                                <div className="widget-title">
                                    <h3>Empresa</h3>
                                </div>
                                <div className="widget-content">
                                    <ul className="links-list clearfix">
                                        <li><Link href="/about">Sobre nós</Link></li>
                                        <li><Link href="/pricing">Preços</Link></li>
                                        <li><Link href="/contact">Contato</Link></li>
                                        <li><Link href="/">Parceiros</Link></li>
                                        <li><Link href="/">Central de ajuda</Link></li>
                                        <li><Link href="/">Treinamentos ao vivo</Link></li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                        <div className="col-lg-3 col-md-6 col-sm-12 footer-column">
                            <div className="footer-widget social-widget">
                                <div className="widget-title">
                                    <h3>Conecte-se</h3>
                                </div>
                                <div className="widget-content">
                                    <ul className="social-list clearfix">
                                        <li><Link href="/">Facebook<i className="fa-brands fa-facebook"></i></Link></li>
                                        <li><Link href="/">Twitter<i className="fa-brands fa-square-twitter"></i></Link></li>
                                        <li><Link href="/">Instagram<i className="fa-brands fa-square-instagram"></i></Link></li>
                                        <li><Link href="/">Linkedin<i className="fa-brands fa-linkedin"></i></Link></li>
                                        <li><Link href="/">Pinterest<i className="fa-brands fa-pinterest"></i></Link></li>
                                    </ul>
                                    <div className="chat-box">
                                        <button type="button"><span>Chat ao vivo</span></button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div className="footer-bottom-two">
                <div className="auto-container">
                    <div className="bottom-inner">
                        <ul className="footer-nav clearfix">
                            <li><Link href="/">Política de Privacidade</Link></li>
                            <li><Link href="/">Termos de Uso</Link></li>
                            <li><Link href="/">Jurídico</Link></li>
                        </ul>
                        <a className="scroll-to-target scroll-top-two" href="#top"><i className="flaticon-down-arrow"></i>Voltar ao topo</a>
                    </div>
                </div>
            </div>
        </footer>


        </>
    )
}
