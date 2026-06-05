"use client";

import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

export default function FaqSection() {
  const [openIndex, setOpenIndex] = useState(null);

  const faqs = [
    { q: 'O que é a Octadesk?', a: 'A Octadesk é uma plataforma completa de atendimento ao cliente...' },
    { q: 'Quanto custa a plataforma?', a: 'Temos planos que se adequam ao tamanho da sua operação...' },
    { q: 'Posso usar no meu e-commerce?', a: 'Sim, integramos perfeitamente com diversas plataformas...' },
    { q: 'O que é o Chat GPT?', a: 'É uma inteligência artificial avançada que a Octadesk utiliza...' },
    { q: 'Qual a diferença entre a Octadesk e o WhatsApp?', a: 'A Octadesk permite usar o WhatsApp de forma escalável e com múltiplos atendentes...' },
  ];

  return (
    <section className="bg-white py-20 px-4">
      <div className="max-w-4xl mx-auto flex flex-col md:flex-row gap-12">
        <div className="md:w-1/3">
          <div className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-semibold mb-4">
            Dúvidas
          </div>
          <h2 className="text-3xl font-bold text-octa-dark mb-4">
            Perguntas Frequentes
          </h2>
          <p className="text-gray-600">
            Ainda com dúvidas? Fale com nosso time de especialistas.
          </p>
        </div>
        
        <div className="md:w-2/3 flex flex-col gap-3">
          {faqs.map((faq, idx) => (
            <div key={idx} className="border border-gray-200 rounded-2xl overflow-hidden">
              <button 
                className="w-full text-left px-6 py-4 flex items-center justify-between font-semibold text-octa-dark hover:bg-gray-50 transition-colors"
                onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
              >
                {faq.q}
                {openIndex === idx ? <ChevronUp size={20} className="text-blue-600" /> : <ChevronDown size={20} className="text-gray-400" />}
              </button>
              {openIndex === idx && (
                <div className="px-6 pb-4 text-gray-600 bg-gray-50/50">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
