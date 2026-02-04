
import React from 'react';

const ProductivityPlaceholder: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center space-y-6 animate-fadeIn">
      <div className="relative">
        <div className="w-32 h-32 bg-emerald-600/20 rounded-full flex items-center justify-center animate-pulse">
            <svg className="w-16 h-16 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
        </div>
        <div className="absolute -bottom-2 -right-2 bg-gray-900 p-2 rounded-lg border border-gray-700">
            <svg className="w-6 h-6 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
        </div>
      </div>
      
      <div>
        <h2 className="text-3xl font-bold text-white mb-2">Painel de Produtividade</h2>
        <div className="inline-block bg-amber-500/10 border border-amber-500/20 text-amber-500 px-4 py-1 rounded-full text-sm font-bold tracking-wider uppercase mb-6">
            Em Desenvolvimento
        </div>
        <p className="text-gray-400 max-w-md mx-auto leading-relaxed">
          Esta funcionalidade está programada para a próxima versão do Dashboard do 22º BPM. 
          Aqui será possível monitorar ocorrências, prisões e apreensões em tempo real.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-md">
        <div className="p-4 bg-gray-900 rounded-xl border border-gray-800 text-left">
            <div className="w-8 h-8 bg-gray-800 rounded mb-2"></div>
            <div className="h-4 bg-gray-800 rounded w-3/4 mb-1"></div>
            <div className="h-3 bg-gray-800 rounded w-1/2"></div>
        </div>
        <div className="p-4 bg-gray-900 rounded-xl border border-gray-800 text-left">
            <div className="w-8 h-8 bg-gray-800 rounded mb-2"></div>
            <div className="h-4 bg-gray-800 rounded w-3/4 mb-1"></div>
            <div className="h-3 bg-gray-800 rounded w-1/2"></div>
        </div>
      </div>
    </div>
  );
};

export default ProductivityPlaceholder;
