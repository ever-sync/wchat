const STEPS = [
  {
    number: "STEP - 01",
    title: "10x produtividade",
    text: "Respostas rápidas, templates HSM, automações e agente IA aceleram o atendimento do seu time.",
    delay: ".2s",
  },
  {
    number: "STEP - 02",
    title: "Multiusuário de verdade",
    text: "Todo o time atendendo no mesmo número com filas inteligentes e carga balanceada.",
    delay: ".4s",
  },
  {
    number: "STEP - 03",
    title: "Tempo real",
    text: "Mudanças no CRM e status refletem instantaneamente para toda a equipe.",
    delay: ".6s",
  },
];

export default function WhyChooseSection() {
  return (
    <section className="space overflow-hidden position-relative space">
      <div className="container th-container5">
        <div className="row justify-content-center">
          <div className="col-lg-8">
            <div className="title-area text-center">
              <span className="sub-title style3 text-anime-style-2">[ Por que escolher ]</span>
              <h2 className="sec-title h3 text-anime-style-3">
                Mais do que um chat — uma operação comercial inteira no WhatsApp
              </h2>
            </div>
          </div>
        </div>
        <div className="row gy-4 align-items-center">
          <div className="col-xl-6">
            <div className="row gy-4">
              {STEPS.map((step) => (
                <div key={step.number} className="col-12">
                  <div className="process-card2 wow fadeInUp" data-wow-delay={step.delay}>
                    <span className="number">{step.number}</span>
                    <div className="box-content">
                      <h2 className="box-title">{step.title}</h2>
                      <p className="box-text">{step.text}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="col-xl-6">
            <div className="process-image">
              <img src="assets/img/normal/process-image.png" alt="Fluxo comercial wChat" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
