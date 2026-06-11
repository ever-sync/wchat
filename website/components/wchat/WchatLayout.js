import SiteBreadcrumb from "./SiteBreadcrumb";
import SiteFooter from "./SiteFooter";
import SiteHeader from "./SiteHeader";
import SiteShell from "./SiteShell";

export default function WchatLayout({ children, breadcrumbTitle, onePage = false, headerAbsolute = false }) {
  return (
    <>
      <SiteShell onePage={onePage} />
      <SiteHeader onePage={onePage} absolute={headerAbsolute} />
      <SiteBreadcrumb title={breadcrumbTitle} />
      {children}
      <SiteFooter onePage={onePage} />
    </>
  );
}
