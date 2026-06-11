import CtaSection from "./CtaSection";

export default function BlogDetailSection() {
  return (
    <>
      <section className="overflow-hidden space">
        <div className="container th-container5">
          <div className="row justify-content-center">
            <div className="col-lg-8">
              <div className="title-area mb-40">
                <div className="blog-meta mb-3">
                  <span>20 jan 2026</span>
                  <span> · Vendas</span>
                  <span> · 6 min de leitura</span>
                </div>
                <h1 className="sec-title style3">Como aumentar suas vendas pelo WhatsApp em 2026</h1>
              </div>
              <div className="blog-img global-img mb-40">
                <img src="assets/img/blog/blog_2_1.jpg" alt="Vendas pelo WhatsApp" />
              </div>
              <div className="blog-content">
                <p className="fs-18 mb-4">
                  O WhatsApp deixou de ser apenas um canal de suporte. Para times comerciais brasileiros, é onde
                  negociações começam, avançam e fecham — mas só quando há processo, visibilidade e ferramentas certas.
                </p>
                <p className="mb-4">
                  O maior erro que vemos é tratar o WhatsApp como mensagem avulsa: cada vendedor no seu celular, sem
                  histórico compartilhado e sem funil. O resultado é lead perdido, follow-up esquecido e gestão no escuro.
                </p>
                <h3 className="h4 mb-3">1. Centralize o atendimento em um inbox compartilhado</h3>
                <p className="mb-4">
                  Um número oficial, vários atendentes, filas e etiquetas. Assim nenhuma conversa fica sem dono e o gestor
                  enxerga volume, SLA e gargalos em tempo real.
                </p>
                <h3 className="h4 mb-3">2. Use CRM visual no próprio WhatsApp</h3>
                <p className="mb-4">
                  Funil Kanban com etapas claras — lead novo, qualificado, proposta, fechado — evita que oportunidades
                  morram no meio do caminho. Cada mudança de etapa pode disparar automações de follow-up.
                </p>
                <h3 className="h4 mb-3">3. Automatize o repetitivo, humanize o estratégico</h3>
                <p className="mb-4">
                  Respostas rápidas, templates HSM e agente de IA para qualificação inicial liberam o time para negociar.
                  A IA coleta dados e transfere para humano quando o lead está pronto ou pede ajuda.
                </p>
                <blockquote className="mb-4 p-4" style={{ background: "var(--smoke-color4)", borderRadius: "12px" }}>
                  <p className="mb-0 fs-18">
                    &ldquo;Times que unem inbox, CRM e automações no mesmo lugar convertem até 3x mais conversas em
                    vendas.&rdquo;
                  </p>
                </blockquote>
                <p className="mb-4">
                  Comece pelo básico: conecte o número oficial, defina etapas do funil e crie duas automações — boas-vindas
                  e reativação de inativos. Em uma semana você já mede diferença em tempo de resposta e taxa de conversão.
                </p>
              </div>
              <div className="btn-group mt-40">
                <a href="/blog" className="th-btn2 style5 me-3">
                  Voltar ao blog
                </a>
                <a href="/register" className="th-btn2 btn-gradient">
                  Testar o wChat grátis
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
      <CtaSection />
    </>
  );
}
