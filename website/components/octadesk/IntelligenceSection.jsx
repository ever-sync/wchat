"use client";

import React, { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';

export default function IntelligenceSection() {
  const [activeTab, setActiveTab] = useState('conversa');

  return (
    <section className="bg-octa-bgLight py-20 px-4">
      <div className="max-w-5xl mx-auto text-center">
        <div className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-semibold mb-4">
          Chatbots Octadesk
        </div>
        <h2 className="text-3xl md:text-4xl font-bold text-octa-dark mb-4">
          A inteligência central da sua<br />operação de atendimento
        </h2>
        <p className="text-gray-600 mb-12 max-w-2xl mx-auto">
          Resolva demandas do dia a dia, direcione os clientes para os times corretos e venda de forma automática.
        </p>

        <div className="bg-white rounded-3xl p-2 shadow-sm border border-gray-100 inline-flex mb-8 w-full max-w-3xl justify-between overflow-x-auto">
          <button 
            className={`px-6 py-3 rounded-2xl font-semibold text-sm flex-1 whitespace-nowrap transition-colors ${activeTab === 'conversa' ? 'bg-octa-dark text-white' : 'text-gray-500 hover:text-octa-dark'}`}
            onClick={() => setActiveTab('conversa')}
          >
            Conversa inteligente
          </button>
          <button 
            className={`px-6 py-3 rounded-2xl font-semibold text-sm flex-1 whitespace-nowrap transition-colors ${activeTab === 'aquisicao' ? 'bg-octa-dark text-white' : 'text-gray-500 hover:text-octa-dark'}`}
            onClick={() => setActiveTab('aquisicao')}
          >
            Aquisição
          </button>
          <button 
            className={`px-6 py-3 rounded-2xl font-semibold text-sm flex-1 whitespace-nowrap transition-colors ${activeTab === 'agente' ? 'bg-octa-dark text-white' : 'text-gray-500 hover:text-octa-dark'}`}
            onClick={() => setActiveTab('agente')}
          >
            Agente de IA
          </button>
        </div>

        <div className="bg-white rounded-3xl p-8 md:p-12 shadow-xl border border-gray-100 text-left flex flex-col md:flex-row items-center gap-10">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-4">
              <span className="bg-gray-100 p-2 rounded-lg">🤖</span>
              <span className="font-semibold text-sm text-gray-500">Inteligência Artificial</span>
            </div>
            <h3 className="text-2xl md:text-3xl font-bold text-octa-dark mb-4 leading-tight">
              Acabe com a lentidão no atendimento ao cliente
            </h3>
            <p className="text-gray-600 mb-6">
              Use a nossa plataforma para integrar Chatbots de IA para WhatsApp, Instagram e Messenger, respondendo rapidamente e sem perder o tom da sua marca.
            </p>
            <ul className="space-y-3 mb-8">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="text-octa-green shrink-0 mt-0.5" size={20} />
                <span className="text-gray-700">Diminua o tempo de resposta</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="text-octa-green shrink-0 mt-0.5" size={20} />
                <span className="text-gray-700">Atenda simultaneamente mais clientes</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="text-octa-green shrink-0 mt-0.5" size={20} />
                <span className="text-gray-700">Tenha um atendimento padronizado 24h</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="text-octa-green shrink-0 mt-0.5" size={20} />
                <span className="text-gray-700">Dispare automações de follow-up e remarketing</span>
              </li>
            </ul>
            <button className="bg-octa-green hover:bg-green-500 text-octa-dark font-bold px-6 py-3 rounded-lg transition-colors">
              Falar com especialista
            </button>
          </div>
          <div className="flex-1 flex justify-center">
            {/* Imagem de mock do celular */}
            <img src="https://assets.octadesk.com/uploads/2023/12/11100914/mockup-whatsapp-inteligencia.png" alt="Mockup WhatsApp" className="max-w-full h-auto" />
          </div>
        </div>
      </div>
    </section>
  );
}
