import React from 'react';
import { ArrowRight } from 'lucide-react';

export default function HeroSection() {
  return (
    <section className="bg-octa-dark text-white pt-24 pb-20 relative overflow-hidden flex flex-col items-center justify-center text-center">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/40 via-octa-dark to-octa-dark opacity-80 pointer-events-none"></div>
      
      <div className="max-w-4xl mx-auto px-4 relative z-10">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-xs font-semibold mb-8 text-blue-200">
          Reconhecido como melhor software de atendimento
        </div>
        
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-tight mb-6">
          Resolva metade dos seus atendimentos automaticamente, 24h por dia.
        </h1>
        
        <p className="text-lg text-gray-300 mb-10 max-w-2xl mx-auto">
          Centralize canais e escale com Chatbots e Chat-GPT para WhatsApp, Instagram, Messenger e Site.
        </p>
        
        <button className="bg-octa-green hover:bg-green-500 text-octa-dark font-bold text-lg px-8 py-4 rounded-lg flex items-center justify-center gap-2 mx-auto transition-colors">
          Quero conversar com um especialista <ArrowRight size={20} />
        </button>
        <p className="text-sm text-gray-400 mt-4">100% gratuito. Sem compromisso.</p>
      </div>

      <div className="mt-16 w-full max-w-5xl mx-auto px-4 relative z-10">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-2 backdrop-blur-sm shadow-2xl">
          <img src="https://assets.octadesk.com/uploads/2024/03/15104233/hero-dashboard.png" alt="Dashboard Octadesk" className="rounded-xl w-full" />
        </div>
      </div>
      
      <div className="mt-20 w-full max-w-5xl mx-auto px-4 text-center z-10">
        <p className="text-sm text-gray-400 mb-6 uppercase tracking-wider font-semibold">A Octadesk atende mais de 3 mil clientes em 4 continentes</p>
        <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-50 grayscale">
          {/* Logo placeholders */}
          <span className="text-xl font-bold">Localiza</span>
          <span className="text-xl font-bold">Unimed</span>
          <span className="text-xl font-bold">Moura</span>
          <span className="text-xl font-bold">Zenni</span>
          <span className="text-xl font-bold">Unicesumar</span>
        </div>
      </div>
    </section>
  );
}
