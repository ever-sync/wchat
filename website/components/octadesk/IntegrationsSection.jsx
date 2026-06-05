import React from 'react';

export default function IntegrationsSection() {
  const mockIntegrations = Array(21).fill(null);

  return (
    <section className="bg-octa-bgLight py-20 px-4 text-center overflow-hidden">
      <div className="max-w-5xl mx-auto">
        <div className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-semibold mb-4">
          Integrações
        </div>
        <h2 className="text-3xl md:text-4xl font-bold text-octa-dark mb-4">
          Integre a Octadesk ao<br />seu ecossistema
        </h2>
        <p className="text-gray-600 mb-12 max-w-2xl mx-auto">
          Conecte sua operação com as principais ferramentas do mercado: ERPs, CRMs e muito mais.
        </p>

        <div className="flex flex-wrap justify-center gap-4 max-w-4xl mx-auto">
          {mockIntegrations.map((_, idx) => (
            <div key={idx} className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center hover:-translate-y-1 transition-transform">
              <div className={`w-8 h-8 rounded-full ${['bg-blue-500', 'bg-orange-500', 'bg-green-500', 'bg-pink-500', 'bg-cyan-500'][idx % 5]}`}></div>
            </div>
          ))}
        </div>

        <div className="mt-12">
          <button className="bg-octa-green hover:bg-green-500 text-octa-dark font-bold px-8 py-4 rounded-lg transition-colors">
            Ver todas integrações
          </button>
        </div>
      </div>
    </section>
  );
}
