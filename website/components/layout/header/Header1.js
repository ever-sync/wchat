import Link from "next/link"
import Menu from "../Menu"
import MobileMenu from "../MobileMenu"


export default function Header1({ scroll, isMobileMenu, handleMobileMenu, isSidebar, handlePopup, handleSidebar }) {
    return (
        <>

        {/* main header */}
        <header className={`main-header header-style-one ${scroll ? "fixed-header" : ""}`}>
            {/* header lower */}
            <div className="header-lower">
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
                                <Link href="/" className="theme-btn btn-one"><span>Começar Agora</span></Link>
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

            <MobileMenu handleMobileMenu={handleMobileMenu} />
        </header>
        </>
    )
}
