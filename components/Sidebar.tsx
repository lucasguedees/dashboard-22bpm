
import React, { useState } from 'react';
import { ViewType, User } from '../types.ts';
import { ShieldIcon } from '../constants.tsx';

interface SidebarProps {
  activeView: ViewType;
  setActiveView: (view: ViewType) => void;
  isOpen: boolean;
  onClose: () => void;
  user: User;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeView, setActiveView, isOpen, onClose, user, onLogout }) => {
  const [openSection, setOpenSection] = useState<string | null>(() => {
    if (activeView.includes('AIT')) return 'ait';
    if (activeView.includes('PRODUCTIVITY')) return 'prod';
    if (activeView.includes('MANAGEMENT')) return 'sys';
    return 'ait';
  });

  const toggleSection = (section: string) => {
    setOpenSection(openSection === section ? null : section);
  };

  const isAdmin = user.role === 'ADMIN';

  const NavItem = ({ label, view, active }: { label: string, view: ViewType, active: boolean }) => (
    <button
      onClick={() => setActiveView(view)}
      className={`w-full text-left px-4 py-2.5 text-sm rounded-lg transition-all mb-1 flex items-center space-x-3 ${
        active 
          ? 'bg-blue-600 text-white font-semibold shadow-lg shadow-blue-900/20' 
          : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
      }`}
    >
      <div className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-white' : 'bg-transparent'}`}></div>
      <span>{label}</span>
    </button>
  );

  const SectionHeader = ({ id, label, icon }: { id: string, label: string, icon: React.ReactNode }) => (
    <button 
      onClick={() => toggleSection(id)} 
      className={`w-full flex items-center justify-between px-4 py-3.5 transition-colors rounded-xl mb-1 ${
        openSection === id ? 'text-white bg-gray-900/50' : 'text-gray-400 hover:bg-gray-800/30'
      }`}
    >
      <div className="flex items-center space-x-3">
        {icon}
        <span className="font-bold text-xs tracking-widest uppercase">{label}</span>
      </div>
      <svg 
        className={`w-4 h-4 transition-transform duration-300 ${openSection === id ? 'rotate-180' : ''}`} 
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
      >
        <path d="M19 9l-7 7-7-7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </button>
  );

  return (
    <aside className={`fixed md:relative inset-y-0 left-0 w-72 bg-gray-950 border-r border-gray-900 flex flex-col z-50 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
      <div className="p-6 border-b border-gray-900 flex items-center justify-between bg-gray-950">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 flex items-center justify-center">
            <ShieldIcon className="w-8 h-8" />
          </div>
          <div>
            <h2 className="font-black text-white text-base tracking-tighter leading-none uppercase">22º BPM</h2>
            <p className="text-[9px] text-blue-500 font-black uppercase mt-1 tracking-widest">SIOP / BM</p>
          </div>
        </div>
        <button onClick={onClose} className="md:hidden text-gray-500 hover:text-white">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto p-4 space-y-1 bg-gray-950">
        <button 
          onClick={() => setActiveView('HOME')} 
          className={`w-full text-left px-4 py-3.5 rounded-xl flex items-center space-x-3 mb-4 transition-all ${
            activeView === 'HOME' 
              ? 'bg-gray-800 text-white border border-gray-700' 
              : 'text-gray-500 hover:text-gray-300'
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
          <span className="font-bold text-sm">Painel Central</span>
        </button>

        <div>
          <SectionHeader 
            id="ait" 
            label="Trânsito (AIT)" 
            icon={<svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z"/><path d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1-1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" strokeWidth="2"/></svg>}
          />
          <div className={`overflow-hidden transition-all duration-300 ${openSection === 'ait' ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}>
            <div className="pl-4 mt-1 border-l border-gray-800 ml-6 space-y-1">
              {isAdmin && <NavItem label="Lançar Dados" view="AIT_FORM" active={activeView === 'AIT_FORM'} />}
              <NavItem label="Painel de Análise" view="AIT_DASHBOARD" active={activeView === 'AIT_DASHBOARD'} />
            </div>
          </div>
        </div>

        <div className="mt-2">
          <SectionHeader 
            id="prod" 
            label="Produtividade" 
            icon={<svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/></svg>}
          />
          <div className={`overflow-hidden transition-all duration-300 ${openSection === 'prod' ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}>
            <div className="pl-4 mt-1 border-l border-gray-800 ml-6 space-y-1">
              {isAdmin && <NavItem label="Lançar Produtividade" view="PRODUCTIVITY_FORM" active={activeView === 'PRODUCTIVITY_FORM'} />}
              <NavItem label="Estatísticas Gerais" view="PRODUCTIVITY_DASHBOARD" active={activeView === 'PRODUCTIVITY_DASHBOARD'} />
            </div>
          </div>
        </div>

        {isAdmin && (
          <div className="mt-2">
            <SectionHeader 
              id="sys" 
              label="Sistema" 
              icon={<svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>}
            />
            <div className={`overflow-hidden transition-all duration-300 ${openSection === 'sys' ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}>
              <div className="pl-4 mt-1 border-l border-gray-800 ml-6 space-y-1">
                <NavItem label="Gestão de Usuários" view="USER_MANAGEMENT" active={activeView === 'USER_MANAGEMENT'} />
                <NavItem label="Backup de Dados" view="DATA_MANAGEMENT" active={activeView === 'DATA_MANAGEMENT'} />
              </div>
            </div>
          </div>
        )}
      </nav>

      <div className="p-4 border-t border-gray-900 bg-gray-900/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 truncate">
            <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center font-black text-xs text-white border-2 border-blue-500/30">
              {user.username.charAt(0).toUpperCase()}
            </div>
            <div className="truncate">
              <p className="text-xs font-black text-white truncate leading-none mb-1">{user.rank} {user.username}</p>
              <p className={`text-[9px] uppercase font-black tracking-widest ${user.role === 'ADMIN' ? 'text-amber-500' : 'text-gray-500'}`}>
                {user.role}
              </p>
            </div>
          </div>
          <button 
            onClick={onLogout} 
            className="p-2 text-gray-500 hover:text-red-500 transition-colors"
            title="Sair do Sistema"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
