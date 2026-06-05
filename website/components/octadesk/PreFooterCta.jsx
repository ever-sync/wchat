import React from 'react';

export default function PreFooterCta() {
  return (
    <section className="bg-[#1B233A] text-white pt-20 overflow-hidden relative">
      <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
        {/* Placeholder for background pattern/waves */}
        <div className="absolute inset-0 bg-[url('https://assets.octadesk.com/uploads/2023/11/06161405/bg-pattern-2.svg')] bg-repeat opacity-30 mix-blend-overlay"></div>
      </div>

      <div className="max-w-5xl mx-auto px-4 relative z-10 flex flex-col md:flex-row items-center gap-10 pb-0">
        <div className="md:w-1/2 mb-12 md:mb-20">
          <h2 className="text-3xl md:text-5xl font-bold mb-6 leading-tight">
            Atenda melhor com a plataforma Octadesk
          </h2>
          <p className="text-gray-300 mb-8 max-w-md">
            Comece a automatizar suas conversas e vender mais agora mesmo. Fale com nossos especialistas para encontrar o plano ideal.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <button className="bg-white hover:bg-gray-100 text-octa-dark font-bold px-6 py-3 rounded-lg transition-colors text-center">
              Falar com vendas
            </button>
            <button className="bg-octa-green hover:bg-green-500 text-octa-dark font-bold px-6 py-3 rounded-lg transition-colors text-center">
              Fazer teste grátis
            </button>
          </div>
        </div>

        <div className="md:w-1/2 flex justify-end items-end relative h-full">
          {/* Mock image of support agent */}
          <div className="bg-white/10 backdrop-blur-md p-4 rounded-t-3xl border-t border-x border-white/20 inline-block">
            <img 
              src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80" 
              alt="Atendente" 
              className="rounded-2xl max-h-[400px] object-cover"
            />
            <div className="absolute bottom-10 -left-10 bg-white text-octa-dark p-4 rounded-xl shadow-xl border border-gray-100 flex items-center gap-3">
              <div className="bg-green-100 p-2 rounded-full">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
              </div>
              <div>
                <p className="font-bold text-sm">Estamos online</p>
                <p className="text-xs text-gray-500">Como podemos ajudar?</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
