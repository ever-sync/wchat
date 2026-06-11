import { MAIN_NAV, navHref } from "./nav";

export default function SiteMobileMenu({ onePage = false }) {
  return (
    <div className="th-menu-wrapper">
      <div className="th-menu-area text-center">
        <button type="button" className="th-menu-toggle">
          <i className="fal fa-times"></i>
        </button>
        <div className="mobile-logo">
          <a href="/">
            <img src="assets/img/logo8.svg" alt="wChat" />
          </a>
        </div>
        <div className="th-mobile-menu">
          <ul>
            <li>
              <a href="/">Início</a>
            </li>
            {MAIN_NAV.map((item) => (
              <li key={item.label}>
                <a href={navHref(item, onePage)}>{item.label}</a>
              </li>
            ))}
            <li>
              <a href="/login">Entrar</a>
            </li>
            <li>
              <a href="/register">Criar conta</a>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
