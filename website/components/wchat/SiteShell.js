import SiteMobileMenu from "./SiteMobileMenu";
import SitePreloader from "./SitePreloader";
import SiteScrollTop from "./SiteScrollTop";

export default function SiteShell({ onePage = false }) {
  return (
    <>
      <SitePreloader />
      <div className="popup-search-box d-none d-lg-block">
        <button type="button" className="searchClose">
          <i className="fal fa-times"></i>
        </button>
        <form action="#">
          <input type="text" placeholder="O que você procura?" />
          <button type="submit">
            <i className="fal fa-search"></i>
          </button>
        </form>
      </div>
      <SiteMobileMenu onePage={onePage} />
      <SiteScrollTop />
    </>
  );
}
