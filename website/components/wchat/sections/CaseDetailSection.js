import { CASE_STUDIES } from "../content/caseStudies";
import CtaSection from "./CtaSection";

const DETAIL = CASE_STUDIES[0];

export default function CaseDetailSection() {
  return (
    <>
      <section className="overflow-hidden space">
        <div className="container th-container5">
          <div className="row gy-40 align-items-center">
            <div className="col-lg-6">
              <div className="global-img">
                <img src={DETAIL.image} alt={DETAIL.title} />
              </div>
            </div>
            <div className="col-lg-6">
              <span className="sub-title style3 text-anime-style-2">[ {DETAIL.tag} ]</span>
              <h1 className="sec-title style3 mb-4">{DETAIL.title}</h1>
              <p className="fs-18 mb-4">{DETAIL.text}</p>
              <p className="mb-4">
                Com o agente de IA do wChat, seu time responde leads 24 horas por dia. A IA faz perguntas de
                qualificação, registra dados no CRM e encaminha para o vendedor certo quando o lead está pronto para
                avançar — ou quando pede atendimento humano.
              </p>
              <ul className="checklist about-checklist mb-4">
                <li>Qualificação automática por regras que você define</li>
                <li>Handoff suave para atendente com contexto completo</li>
                <li>Histórico unificado no inbox compartilhado</li>
                <li>Integração com funil CRM e automações de follow-up</li>
              </ul>
              <div className="btn-group">
                <a href="/cases" className="th-btn2 style5 me-3">
                  Ver todas as funcionalidades
                </a>
                <a href="/register" className="th-btn2 btn-gradient">
                  Testar grátis
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
