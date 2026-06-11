import { MAIN_NAV, navHref } from "./nav";

export default function SiteHeader({ onePage = false, absolute = false }) {
  const headerClass = [
    "th-header",
    "header-layout8",
    absolute ? "header-absolute onepage-nav" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <header className={headerClass}>
      <div className="sticky-wrapper">
        <div className="container th-container">
          <div className="menu-area">
            <div className="row align-items-center justify-content-between">
              <div className="col-auto">
                <div className="header-logo">
                  <a className="icon-masking" href="/">
                    <img src="assets/img/logo8.svg" alt="wChat" />
                  </a>
                </div>
              </div>
              <div className="col-auto">
                <nav className="main-menu d-none d-lg-inline-block">
                  <ul>
                    {MAIN_NAV.map((item) => (
                      <li key={item.label}>
                        <a href={navHref(item, onePage)}>{item.label}</a>
                      </li>
                    ))}
                  </ul>
                </nav>
                <button type="button" className="th-menu-toggle d-block d-lg-none">
                  <i className="far fa-bars"></i>
                </button>
              </div>
              <div className="col-auto d-none d-xl-block">
                <div className="header-button">
                  <a href="/login" className="icon-btn">
                    <i className="fa-solid fa-user"></i>
                  </a>
                  <a href="/register" className="th-btn2 btn-gradient">
                    Começar grátis
                  </a>
                  <button type="button" className="th-menu-toggle d-inline-block d-xl-none">
                    <i className="far fa-bars"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
