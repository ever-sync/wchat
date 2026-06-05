import React from 'react';

export default function OctadeskHeader() {
  return (
    <header className="bg-octa-dark text-white border-b border-white/10 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2">
            <div className="bg-white p-1.5 rounded-md">
              <span className="text-octa-dark font-bold text-xl leading-none">O</span>
            </div>
            <span className="text-xl font-bold tracking-tight">octadesk</span>
          </div>
          
          <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-gray-300">
            <a href="#" className="hover:text-white transition-colors">Produtos</a>
            <a href="#" className="hover:text-white transition-colors">Soluções</a>
            <a href="#" className="hover:text-white transition-colors">Preços</a>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <a href="#" className="hidden md:block text-sm font-semibold hover:text-gray-300 transition-colors">Entrar</a>
          <button className="bg-transparent border border-white/30 hover:bg-white/10 text-white text-sm font-bold px-4 py-2 rounded-lg transition-colors">
            Falar com especialista
          </button>
        </div>
      </div>
    </header>
  );
}
