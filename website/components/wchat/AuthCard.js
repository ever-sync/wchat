export default function AuthCard({ title, subtitle, children, footer }) {
  return (
    <section className="contact-sec space overflow-hidden wchat-auth-page">
      <div className="container th-container4">
        <div className="row justify-content-center">
          <div className="col-lg-6 col-xl-5">
            <div className="wchat-auth-card contact-form">
              <h3 className="title mb-1">{title}</h3>
              {subtitle && <p className="wchat-auth-subtitle mb-4">{subtitle}</p>}
              {children}
              {footer && <div className="wchat-auth-footer">{footer}</div>}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
