
import React, { useRef } from 'react';
import { TrafficInfraction, ProductivityRecord, User } from '../types';

interface DataManagementProps {
  infractions: TrafficInfraction[];
  productivity: ProductivityRecord[];
  onImport: (infractions: TrafficInfraction[], productivity: ProductivityRecord[], users?: User[]) => void;
}

const DataManagement: React.FC<DataManagementProps> = ({ infractions, productivity, onImport }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    try {
      const savedUsersRaw = localStorage.getItem('22bpm_users_list');
      const users: User[] = savedUsersRaw ? JSON.parse(savedUsersRaw) : [];

      const backupData = {
        version: "1.1",
        timestamp: new Date().toISOString(),
        origin: "22BPM_DASHBOARD",
        data: {
          infractions: infractions,
          productivity: productivity,
          users: users
        }
      };

      const dataStr = JSON.stringify(backupData, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const exportFileDefaultName = `BACKUP_COMPLETO_22BPM_${new Date().toISOString().split('T')[0]}.json`;

      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', url);
      linkElement.setAttribute('download', exportFileDefaultName);
      document.body.appendChild(linkElement);
      linkElement.click();
      document.body.removeChild(linkElement);
      URL.revokeObjectURL(url);
    } catch (e) {
      alert("Erro ao gerar arquivo de backup.");
    }
  };

  const handleImportClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = ""; // Limpa para permitir selecionar o mesmo arquivo
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result;
        if (typeof content !== 'string') return;

        const jsonData = JSON.parse(content);
        let infractionsToImport: TrafficInfraction[] = [];
        let productivityToImport: ProductivityRecord[] = [];
        let usersToImport: User[] = [];

        // Detecção de estrutura flexível
        const source = jsonData.data || jsonData;
        
        infractionsToImport = Array.isArray(source.infractions) ? source.infractions : [];
        productivityToImport = Array.isArray(source.productivity) ? source.productivity : [];
        usersToImport = Array.isArray(source.users) ? source.users : [];

        // Caso seja um array simples (formato antigo de trânsito)
        if (Array.isArray(jsonData) && infractionsToImport.length === 0) {
          infractionsToImport = jsonData;
        }

        if (infractionsToImport.length === 0 && productivityToImport.length === 0 && usersToImport.length === 0) {
          throw new Error("Arquivo vazio ou formato inválido.");
        }

        const confirmMessage = `
RESTAURAR SISTEMA?
---------------------------------------
AITs: ${infractionsToImport.length}
Produtividade: ${productivityToImport.length}
Usuários: ${usersToImport.length > 0 ? usersToImport.length : 'Manter atuais'}
---------------------------------------
AVISO: Isso substituirá TODOS os dados atuais.`;

        if (window.confirm(confirmMessage)) {
          onImport(infractionsToImport, productivityToImport, usersToImport.length > 0 ? usersToImport : undefined);
        }
      } catch (err) {
        alert("Erro: O arquivo não é um backup válido.");
        console.error(err);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="animate-fadeIn max-w-4xl mx-auto">
      <div className="mb-10 text-left">
        <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Gestão e Backup</h2>
        <div className="h-1 w-12 bg-blue-600 mt-2 mb-4 rounded-full"></div>
        <p className="text-gray-400">Reinicie ou restaure o sistema através de arquivos de backup.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-gray-900 border border-gray-800 rounded-3xl p-8 shadow-2xl group transition-all hover:border-blue-500/30">
          <div className="flex items-center space-x-4 mb-6">
            <div className="p-4 bg-blue-600/10 rounded-2xl text-blue-500">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0l-4-4m4 4v12"/></svg>
            </div>
            <div>
              <h3 className="text-xl font-black text-white uppercase leading-tight">Exportar</h3>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Salvar Base Completa</p>
            </div>
          </div>
          <button onClick={handleExport} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-2xl transition-all shadow-lg shadow-blue-900/20">
            Gerar Backup (.JSON)
          </button>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-3xl p-8 shadow-2xl group transition-all hover:border-emerald-500/30">
          <div className="flex items-center space-x-4 mb-6">
            <div className="p-4 bg-emerald-600/10 rounded-2xl text-emerald-500">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"/></svg>
            </div>
            <div>
              <h3 className="text-xl font-black text-white uppercase leading-tight">Importar</h3>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Restaurar Sistema</p>
            </div>
          </div>
          <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".json" className="hidden" />
          <button onClick={handleImportClick} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-4 rounded-2xl transition-all shadow-lg shadow-emerald-900/20">
            Carregar Backup
          </button>
        </div>
      </div>
      
      <div className="mt-12 p-6 bg-red-950/20 border border-red-900/30 rounded-2xl">
        <h4 className="text-red-500 font-bold text-sm uppercase mb-2 flex items-center">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
          Zona de Perigo
        </h4>
        <p className="text-gray-500 text-xs mb-4">A restauração de backup apaga todos os dados que não estão no arquivo. Recomenda-se exportar antes de importar.</p>
        <button 
          onClick={() => {
            if(confirm("LIMPAR TUDO? Isso apagará todos os dados e resetará o sistema para o padrão de fábrica.")) {
              localStorage.clear();
              window.location.reload();
            }
          }}
          className="text-red-500 text-[10px] font-bold uppercase tracking-widest hover:underline"
        >
          Reiniciar Sistema (Limpar Tudo)
        </button>
      </div>
    </div>
  );
};

export default DataManagement;
