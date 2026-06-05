import React from 'react';
import { ShoppingCart, Headset, Megaphone, Settings } from 'lucide-react';

export default function SegmentSection() {
  const segments = [
    {
      title: 'Vendas em Escala',
      description: 'Atenda todos os seus clientes em um só lugar.',
      content: 'Reduza o tempo de espera do seu cliente. Não perca nenhuma oportunidade de venda enquanto seu time estiver ocupado e aumente as suas taxas de conversão.',
      linkText: 'Conheça o Chatbot de Vendas para WhatsApp',
      icon: <ShoppingCart className="text-blue-600" size={24} />
    },
    {
      title: 'Atendimento',
      description: 'Humanize e resolva dúvidas em instantes.',
      content: 'Melhore os KPIs de atendimento, ganhe tempo com respostas automáticas e transfira apenas as demandas mais complexas para a sua equipe.',
      linkText: 'Ver Chatbot para Atendimento no WhatsApp',
      icon: <Headset className="text-blue-600" size={24} />
    },
    {
      title: 'Marketing e CRM',
      description: 'Escale os resultados de vendas com fluxos personalizados.',
      content: 'Mantenha todos os seus contatos engajados. Crie listas, faça disparos em massa, segmente sua audiência e nutra os seus clientes com as melhores ofertas e conteúdos.',
      linkText: 'Aprenda a fazer automações no WhatsApp com IA',
      icon: <Megaphone className="text-blue-600" size={24} />
    },
    {
      title: 'Gestão e Qualidade',
      description: 'Tenha segurança e previsibilidade na sua operação.',
      content: 'Acompanhe métricas cruciais de tempo de resposta, volumetria de chats, taxa de retenção e veja o desempenho individual de cada membro da sua equipe em tempo real.',
      linkText: 'Aprenda como ter controle total do seu fluxo de atendimento',
      icon: <Settings className="text-blue-600" size={24} />
    }
  ];

  return (
    <section className="bg-white py-20 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-semibold mb-4">
            Octadesk na prática
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-octa-dark mb-4">
            Funciona no seu segmento.<br />Veja como.
          </h2>
          <p className="text-gray-600">
            Seja qual for o seu desafio, o Octadesk adapta-se perfeitamente à sua necessidade.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {segments.map((segment, idx) => (
            <div key={idx} className="bg-white border border-gray-200 rounded-3xl p-8 hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-blue-50 p-3 rounded-xl">
                  {segment.icon}
                </div>
                <h3 className="text-xl font-bold text-octa-dark">{segment.title}</h3>
              </div>
              <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">{segment.description}</p>
              <p className="text-gray-600 mb-6 leading-relaxed">
                {segment.content}
              </p>
              <a href="#" className="text-blue-600 font-semibold hover:text-blue-800 flex items-center gap-1 text-sm bg-blue-50/50 p-3 rounded-lg border border-blue-100">
                {segment.linkText} &rarr;
              </a>
            </div>
          ))}
        </div>

        <div className="text-center">
          <button className="bg-octa-green hover:bg-green-500 text-octa-dark font-bold px-8 py-4 rounded-lg transition-colors">
            Falar com especialista
          </button>
        </div>
      </div>
    </section>
  );
}
