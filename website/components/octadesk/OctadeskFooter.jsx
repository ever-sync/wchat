import React from 'react';

export default function OctadeskFooter() {
  return (
    <footer className="bg-[#1B233A] text-gray-400 py-12 px-4 border-t border-white/10">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start gap-8 mb-12">
        <div>
          <div className="flex items-center gap-2 text-white mb-6">
            <div className="bg-white p-1 rounded-md">
              <span className="text-octa-dark font-bold text-sm leading-none">O</span>
            </div>
            <span className="font-bold tracking-tight">octadesk</span>
          </div>
          <div className="flex gap-4">
            <a href="#" className="bg-white/10 p-2 rounded-lg hover:bg-white/20 transition-colors">
              <span className="text-xs font-bold text-white">Google Play</span>
            </a>
            <a href="#" className="bg-white/10 p-2 rounded-lg hover:bg-white/20 transition-colors">
              <span className="text-xs font-bold text-white">App Store</span>
            </a>
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-16 w-full md:w-auto">
          <div>
            <h4 className="text-white font-bold mb-4 text-sm uppercase tracking-wider">Produto</h4>
            <ul className="space-y-3 text-sm">
              <li><a href="#" className="hover:text-white">Atendimento ao Cliente</a></li>
              <li><a href="#" className="hover:text-white">Chatbot WhatsApp</a></li>
              <li><a href="#" className="hover:text-white">Integrações</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-bold mb-4 text-sm uppercase tracking-wider">Conteúdos</h4>
            <ul className="space-y-3 text-sm">
              <li><a href="#" className="hover:text-white">Blog</a></li>
              <li><a href="#" className="hover:text-white">Materiais Ricos</a></li>
              <li><a href="#" className="hover:text-white">Central de Ajuda</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-bold mb-4 text-sm uppercase tracking-wider">A Empresa</h4>
            <ul className="space-y-3 text-sm">
              <li><a href="#" className="hover:text-white">Sobre nós</a></li>
              <li><a href="#" className="hover:text-white">Trabalhe conosco</a></li>
              <li><a href="#" className="hover:text-white">Contato</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-bold mb-4 text-sm uppercase tracking-wider">Legal</h4>
            <ul className="space-y-3 text-sm">
              <li><a href="#" className="hover:text-white">Termos de uso</a></li>
              <li><a href="#" className="hover:text-white">Política de privacidade</a></li>
            </ul>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center text-xs">
        <p>© 2024 Octadesk. Todos os direitos reservados.</p>
        <div className="flex gap-4 mt-4 md:mt-0">
          <a href="#" className="hover:text-white">LinkedIn</a>
          <a href="#" className="hover:text-white">Instagram</a>
          <a href="#" className="hover:text-white">YouTube</a>
        </div>
      </div>
    </footer>
  );
}
