import Link from "next/link"
import Menu from "../Menu"
import MobileMenu from "../MobileMenu"
export default function Header3({ scroll, isMobileMenu, handleMobileMenu, isSidebar, handlePopup, handleSidebar }) {
    return (
        <>
            {/* <header className="main-header header-style-three"> */}
            
            <header className={`main-header header-style-three ${scroll ? "fixed-header" : ""}`}>
                <div className="header-top-two">
                    <div className="auto-container">
                        <div className="top-inner">
                            <div className="text">
                                <p>Send Queries: <Link href="mailto:supportme@example.com">supportme@example.com</Link></p>
                            </div>
                            <div className="right-column">
                                <div className="account-box">
                                    <div className="select-box">
                                        <select className="selectmenu">
                                            <option>My&nbsp;Account</option>
                                            <option>Login</option>
                                            <option>Logout</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="language-box">
                                    <div className="select-box">
                                        <select className="selectmenu">
                                            <option>En</option>
                                            <option>Chi</option>
                                            <option>Tu</option>
                                            <option>Hi</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                {/* header lower */}
                <div className="header-lower">
                    <div className="auto-container">
                        <div className="outer-box">
                            <div className="logo-box">
                                <figure className="logo">
                                    <Link href="/">
                                    <img src="assets/images/logo-2.png" alt="/" />
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
                            <div className="menu-right-content">
                                <div className="btn-box">
                                    <Link href="/" className="theme-btn btn-one"><span>Start Writing</span></Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* sticky header */}
                <div className={`sticky-header ${scroll ? "animated slideInDown" : ""}`}>
                    <div className="auto-container">
                        <div className="outer-box">
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
                            <div className="menu-right-content">
                                <div className="btn-box">
                                    <Link href="/" className="theme-btn btn-one"><span>Start Writing</span></Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <MobileMenu handleMobileMenu={handleMobileMenu} isSidebar={isSidebar} handleSidebar={handleSidebar} />
            

            
        </>
    )
}
