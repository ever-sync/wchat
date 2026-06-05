import React from 'react';

export default function CasesSection() {
  return (
    <section className="bg-[#242A3E] py-20 px-4 text-white">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-block bg-blue-900/50 text-blue-200 px-3 py-1 rounded-full text-xs font-semibold mb-4 border border-blue-800">
            Cases de Sucesso
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Transformando conversas em lucro real
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Veja como empresas parceiras usam nossa plataforma de atendimento para crescer, vender mais e fidelizar clientes.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="relative rounded-3xl overflow-hidden group h-96">
            <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-colors z-10"></div>
            <img 
              src="https://images.unsplash.com/photo-1553877522-43269d4ea984?auto=format&fit=crop&q=80" 
              alt="Case Konecta" 
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-octa-dark via-octa-dark/80 to-transparent z-10"></div>
            
            <div className="absolute bottom-0 left-0 right-0 p-8 z-20">
              <div className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-lg inline-block text-white font-bold mb-4 border border-white/30">
                Konecta
              </div>
              <h3 className="text-5xl font-bold mb-2">50%</h3>
              <p className="font-semibold text-lg mb-2">de eficiência na conversão de vendas</p>
              <p className="text-gray-300 text-sm mb-6">
                Reduzimos o tempo de resposta e qualificamos os leads automaticamente, focando o time nos fechamentos.
              </p>
              <button className="bg-white text-octa-dark text-sm font-bold px-4 py-2 rounded-lg">
                Ver caso
              </button>
            </div>
          </div>

          <div className="relative rounded-3xl overflow-hidden group h-96">
            <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-colors z-10"></div>
            <img 
              src="https://images.unsplash.com/photo-1586528116311-ad8ed7c83a7f?auto=format&fit=crop&q=80" 
              alt="Case FMVZ" 
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-octa-dark via-octa-dark/80 to-transparent z-10"></div>
            
            <div className="absolute bottom-0 left-0 right-0 p-8 z-20">
              <div className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-lg inline-block text-white font-bold mb-4 border border-white/30">
                FMVZ
              </div>
              <h3 className="text-5xl font-bold mb-2">70%</h3>
              <p className="font-semibold text-lg mb-2">de redução no custo de atendimento</p>
              <p className="text-gray-300 text-sm mb-6">
                Centralizamos as operações de WhatsApp e automatizamos o triagem inicial de alunos com IA.
              </p>
              <button className="bg-white text-octa-dark text-sm font-bold px-4 py-2 rounded-lg">
                Ver caso
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
