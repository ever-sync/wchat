const PLAN_FEATURES = [
  "Conversas ilimitadas",
  "CRM completo com funis",
  "Templates HSM",
  "Relatórios em tempo real",
  "Respostas rápidas",
  "Suporte via WhatsApp",
];

const MONTHLY_PLANS = [
  { key: "starter", name: "Starter", price: 99, subtitle: "1 número · 2 usuários" },
  { key: "times", name: "Times", price: 299, subtitle: "3 números · 10 usuários", popular: true },
  { key: "business", name: "Business", price: 699, subtitle: "Números ilimitados · API" },
];

const YEARLY_PLANS = [
  { key: "starter", name: "Starter", price: 79, subtitle: "1 número · 2 usuários" },
  { key: "times", name: "Times", price: 239, subtitle: "3 números · 10 usuários", popular: true },
  { key: "business", name: "Business", price: 559, subtitle: "Números ilimitados · API" },
];

function PriceCard({ plan }) {
  return (
    <div className="col-xl-4 col-md-6">
      <div className={`price-card style2 extra th-ani${plan.popular ? " active" : ""}`}>
        {plan.popular ? (
          <span className="offer-tag">
            <img src="assets/img/icon/star7.svg" alt="" /> Mais popular
          </span>
        ) : (
          <span className="offer-tag"></span>
        )}
        <div className="box-content">
          <h3 className="box-title">{plan.name}</h3>
          <h4 className="box-price">
            R$ {plan.price}
            <span className="duration">/mês</span>
          </h4>
          <p className="subtitle">{plan.subtitle}</p>
        </div>
        <div className="available-list">
          <ul>
            {PLAN_FEATURES.map((feature) => (
              <li key={feature}>{feature}</li>
            ))}
          </ul>
        </div>
        <div className="btn-group">
          <a href="/register" className="th-btn2 btn-gradient fw-btn">
            Começar agora
          </a>
        </div>
      </div>
    </div>
  );
}

export default function PricingSection({ showHeading = true }) {
  return (
    <section className="position-relative space-extra2-top space-bottom overflow-hidden" id="pricing-sec">
      <div className="container th-container5">
        <div className="row justify-content-center align-items-center">
          <div className="col-lg-8 col-xxl-6">
            {showHeading ? (
              <div className="title-area mb-20 text-center">
                <span className="sub-title style3 text-anime-style-2">[ Preços ]</span>
                <h2 className="sec-title h3 text-anime-style-3">Planos para cada tamanho de time</h2>
                <p className="mt-3 text-body">Comece em minutos. Sem cartão de crédito. Cancele quando quiser.</p>
              </div>
            ) : (
              <p className="mb-20 text-center text-body">Comece em minutos. Sem cartão de crédito. Cancele quando quiser.</p>
            )}
            <div className="sec-btn">
              <div className="pricing-tabs style8 mt-20">
                <div className="switch-area justify-content-center">
                  <label className="toggler toggler--is-active ms-0" id="filt-monthly">
                    Mensal
                  </label>
                  <div className="toggle">
                    <input type="checkbox" id="switcher" className="check" />
                    <b className="b switch"></b>
                  </div>
                  <label className="toggler" id="filt-yearly">
                    Anual
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div id="monthly" className="wrapper-full">
          <div className="row gy-4 justify-content-center">
            {MONTHLY_PLANS.map((plan) => (
              <PriceCard key={`m-${plan.key}`} plan={plan} />
            ))}
          </div>
        </div>
        <div id="yearly" className="wrapper-full hide">
          <div className="row gy-4 justify-content-center">
            {YEARLY_PLANS.map((plan) => (
              <PriceCard key={`y-${plan.key}`} plan={plan} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
