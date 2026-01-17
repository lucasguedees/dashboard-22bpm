
import React, { useState, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { TrafficInfraction } from '../types';
import { MONTHS } from '../constants';

interface AitInsightsProps {
  data: TrafficInfraction[];
  selectedCities: string[];
}

const AitInsights: React.FC<AitInsightsProps> = ({ data, selectedCities }) => {
  const [insight, setInsight] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const generateInsights = async () => {
    if (data.length === 0) return;
    setLoading(true);
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      // Preparar dados simplificados para o prompt (economia de tokens e clareza)
      const historicalContext = data
        .filter(d => selectedCities.includes(d.city))
        .map(d => ({
          cidade: d.city,
          periodo: `${MONTHS[d.month]}/${d.year}`,
          total: d.total,
          detalhes: `Carros: ${d.cars}, Motos: ${d.motorcycles}, Caminhões: ${d.trucks}`
        }));

      const prompt = `
        Aja como um analista de dados estratégico da Polícia Militar (22º BPM).
        Analise o seguinte histórico de Autos de Infração de Trânsito das cidades: ${selectedCities.join(', ')}.
        
        Dados Históricos:
        ${JSON.stringify(historicalContext)}

        Sua tarefa:
        1. Identifique a tendência atual (crescimento, queda ou estabilidade).
        2. Com base na sazonalidade e médias, preveja o comportamento para os próximos 3 meses.
        3. Dê uma recomendação operacional curta para o comando da unidade.
        
        Formate a resposta em 3 blocos curtos usando Markdown:
        ### 📈 Tendência Identificada
        (sua análise aqui)
        
        ### 🔮 Previsão para Próximos Meses
        (sua previsão aqui)
        
        ### 🛡️ Recomendação Estratégica
        (sua recomendação aqui)

        Seja objetivo, técnico e use um tom profissional. Responda em Português.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: prompt,
      });

      setInsight(response.text || "Não foi possível gerar insights no momento.");
    } catch (error) {
      console.error("Erro ao gerar insights:", error);
      setInsight("Erro ao conectar com o módulo de inteligência artificial. Verifique sua conexão.");
    } finally {
      setLoading(false);
    }
  };

  // Gerar insights sempre que as cidades selecionadas mudarem ou ao carregar
  useEffect(() => {
    if (selectedCities.length > 0 && data.length > 5) {
      generateInsights();
    }
  }, [selectedCities, data.length]);

  if (data.length < 5) {
    return (
      <div className="mt-8 p-6 bg-gray-900/50 border border-dashed border-gray-700 rounded-3xl text-center">
        <p className="text-gray-500 text-sm italic">
          Dados insuficientes para gerar previsões. Continue alimentando o sistema para ativar a IA (Mínimo 5 registros).
        </p>
      </div>
    );
  }

  return (
    <div className="mt-12 space-y-6 animate-fadeIn">
      <div className="flex items-center space-x-3 mb-2">
        <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-900/20">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
          </svg>
        </div>
        <h3 className="text-xl font-bold text-white">Insights Inteligentes e Previsões</h3>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden group">
        {/* Efeito decorativo de fundo */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-indigo-600/5 rounded-full blur-3xl group-hover:bg-indigo-600/10 transition-all"></div>
        
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mb-4"></div>
            <p className="text-indigo-400 font-medium animate-pulse">A IA está processando o histórico e calculando tendências...</p>
          </div>
        ) : insight ? (
          <div className="prose prose-invert max-w-none prose-h3:text-indigo-400 prose-h3:mt-6 prose-h3:mb-2 prose-p:text-gray-300 prose-p:leading-relaxed">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
               {/* O conteúdo do Markdown será renderizado aqui de forma simples para este contexto */}
               {insight.split('###').filter(Boolean).map((section, idx) => (
                 <div key={idx} className="bg-gray-800/30 p-5 rounded-2xl border border-gray-700/50 hover:border-indigo-500/30 transition-colors">
                    <h4 className="text-indigo-400 font-bold mb-3 flex items-center">
                       {section.split('\n')[0].trim()}
                    </h4>
                    <p className="text-sm text-gray-400">
                       {section.split('\n').slice(1).join('\n').trim()}
                    </p>
                 </div>
               ))}
            </div>
            <div className="mt-8 pt-6 border-t border-gray-800 flex items-center justify-between">
              <span className="text-[10px] text-gray-600 font-bold uppercase tracking-widest">Processado via Gemini AI Engine</span>
              <button 
                onClick={generateInsights}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-bold flex items-center space-x-1 transition-colors"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
                <span>Recalcular Agora</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
             <button 
              onClick={generateInsights}
              className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold shadow-lg transition-all"
             >
               Gerar Insights Preditivos
             </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AitInsights;
