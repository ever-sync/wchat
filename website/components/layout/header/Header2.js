import Link from "next/link"
import Menu from "../Menu"
import MobileMenu from "../MobileMenu"

export default function Header2({ scroll, isMobileMenu, handleMobileMenu, isSidebar, handlePopup, handleSidebar }) {
    return (
        <>
            {/* <header className="main-header header-style-two"> */}
            <header className={`main-header header-style-two ${scroll ? "fixed-header" : ""}`}>
                <div className="header-top centred">
                    <div className="shape" style={{ backgroundImage: "url(assets/images/shape/shape-26.png)" }}></div>
                    <div className="auto-container">
                        <div className="text">
                            <p><img src="assets/images/icons/icon-19.png" alt=""/>Estamos aqui pra ajudar. Fale com a gente: <Link href="mailto:contato@wchat.com.br">contato@wchat.com.br</Link></p>
                        </div>
                    </div>
                </div>
                {/* header lower */}
                <div className="header-lower">
                    <div className="outer-container">
                        <div className="outer-box">
                            <div className="left-column">
                                <div className="logo-box">
                                    <figure className="logo">
                                        <Link href="/">
                                        <img src="assets/images/logo.png" alt="wChat" />
                                        </Link>
                                    </figure>
                                </div>
                                <div className="menu-area clearfix">
                                    {/* mobile navigation toggler */}
                                    <div className="mobile-nav-toggler" onClick={handleMobileMenu}>
                                        <i className="icon-bar"></i>
                                        <i className="icon-bar"></i>
                                        <i className="icon-bar"></i>
                                    </div>
                                    <nav className="main-menu navbar-expand-md navbar-light">
                                        <div className="collapse navbar-collapse show clearfix" id="navbarSupportedContent">
                                            <Menu />
                                        </div>
                                    </nav>
                                </div>
                            </div>
                            <div className="menu-right-content">
                                <div className="user-box">
                                    <Link href="/login"><i className="flaticon-log-in"></i><span className="flaticon-add"></span></Link>
                                </div>
                                <div className="btn-box">
                                    <Link href="/" className="theme-btn btn-two"><span>Começar Agora</span></Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* sticky header */}
                <div className={`sticky-header ${scroll ? "animated slideInDown" : ""}`}>
                    <div className="outer-container">
                        <div className="outer-box">
                            <div className="left-column">
                                <div className="logo-box">
                                    <figure className="logo">
                                        <Link href="/">
                                        <img src="assets/images/logo.png" alt="/" />
                                        </Link>
                                    </figure>
                                </div>
                                <div className="menu-area clearfix">
                                <nav className="main-menu clearfix">
                                        <div className="collapse navbar-collapse show clearfix" id="navbarSupportedContent">
                                            <Menu />
                                        </div>
                                    </nav>
                                </div>
                            </div>
                            <div className="menu-right-content">
                                <div className="user-box">
                                    <Link href="/login"><i className="flaticon-log-in"></i><span className="flaticon-add"></span></Link>
                                </div>
                                <div className="btn-box">
                                    <Link href="/" className="theme-btn btn-one"><span>Começar Agora</span></Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <MobileMenu handleMobileMenu={handleMobileMenu} handleSidebar={handleSidebar} isSidebar={isSidebar} />


        </>
    )
}
