export default function SiteBreadcrumb({ title }) {
  if (!title) return null;

  return (
    <div
      className="breadcumb-wrapper"
      data-bg-src="assets/img/bg/breadcumb-bg.jpg"
      data-overlay="black"
      data-opacity="5"
    >
      <div className="container">
        <div className="breadcumb-content">
          <h1 className="breadcumb-title">{title}</h1>
          <ul className="breadcumb-menu">
            <li>
              <a href="/">Início</a>
            </li>
            <li>{title}</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
