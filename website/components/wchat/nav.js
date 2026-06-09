export const MAIN_NAV = [
  { label: "Sobre", home: "#about-sec", page: "/#about-sec" },
  { label: "Recursos", home: "#features-sec", page: "/#features-sec" },
  { label: "Funcionalidades", home: "#case-studies-sec", page: "/#case-studies-sec" },
  { label: "Preços", href: "/pricing" },
  { label: "Blog", home: "#blog-sec", page: "/blog" },
  { label: "Contato", home: "#contact-sec", page: "/contact" },
];

export function navHref(item, onePage) {
  if (item.href) return item.href;
  if (item.label === "Blog" && !onePage) return "/blog";
  if (item.label === "Contato" && !onePage) return "/contact";
  return onePage ? item.home : item.page;
}
