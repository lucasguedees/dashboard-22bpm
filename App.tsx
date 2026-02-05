
import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import AitForm from './components/AitForm';
import AitDashboard from './components/AitDashboard';
import ProductivityForm from './components/ProductivityForm';
import ProductivityDashboard from './components/ProductivityDashboard';
import DataManagement from './components/DataManagement';
import UserManagement from './components/UserManagement';
import UserProfile from './components/UserProfile';
import Login from './components/Login';
import { ViewType, TrafficInfraction, ProductivityRecord, User } from './types';
import { ShieldIcon } from './constants';
import { supabase } from './lib/supabase';
import { supabaseReady, fetchInfractions, fetchProductivity, insertInfraction, updateInfraction, deleteInfractionById, insertProductivity, updateProductivity, deleteProductivityById } from './lib/api';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [activeView, setActiveView] = useState<ViewType>('HOME');
  const [infractions, setInfractions] = useState<TrafficInfraction[]>([]);
  const [productivity, setProductivity] = useState<ProductivityRecord[]>([]);
  const [editingAit, setEditingAit] = useState<TrafficInfraction | null>(null);
  const [editingProd, setEditingProd] = useState<ProductivityRecord | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [supabaseReady, setSupabaseReady] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const init = async () => {
      console.log('=== APP INIT START ===');
      console.log('Environment:', import.meta.env.MODE);
      console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL ? 'Set' : 'Not set');
      console.log('Supabase Key:', import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Set' : 'Not set');
      
      try {
        const savedUsers = localStorage.getItem('22bpm_users_list');
        if (!savedUsers) {
          const defaultUsers: User[] = [
            { 
              id: '1', 
              username: 'admin', 
              email: 'admin@22bpm.pm.ba.gov.br',
              role: 'ADMIN', 
              rank: 'Ten Cel', 
              password: '22' 
            },
            { 
              id: '2', 
              username: 'comando', 
              email: 'comando@22bpm.pm.ba.gov.br',
              role: 'COMANDO', 
              rank: 'Maj', 
              password: '22' 
            }
          ];
          localStorage.setItem('22bpm_users_list', JSON.stringify(defaultUsers));
        }

        // Check if Supabase is properly configured
        if (supabase) {
          console.log('Supabase client is available');
          setSupabaseReady(true);
        } else {
          console.warn('Supabase not available, using localStorage mode');
          setSupabaseReady(false);
        }

        // Verificar se há usuário salvo no localStorage
        const savedUser = localStorage.getItem('22bpm_user');
        if (savedUser) {
          try {
            const parsedUser = JSON.parse(savedUser);
            setUser(parsedUser);
            console.log('User restored from localStorage:', parsedUser.username);
          } catch (e) {
            // Se houver erro ao parsear, remover dados corrompidos
            localStorage.removeItem('22bpm_user');
          }
        }
      } finally {
        setIsInitializing(false);
        console.log('=== APP INIT END ===');
      }
    };
    init();
  }, []);

  useEffect(() => {
    const loadData = async () => {
      if (supabaseReady && user) {
        // Fetch from Supabase
        const [ait, prod] = await Promise.all([
          fetchInfractions().catch(() => [] as TrafficInfraction[]),
          fetchProductivity().catch(() => [] as ProductivityRecord[])
        ]);
        if (ait.length) setInfractions(ait);
        if (prod.length) setProductivity(prod);
      } else if (!supabaseReady && user) {
        // Fallback to localStorage
        const savedAit = localStorage.getItem('22bpm_infractions');
        if (savedAit) setInfractions(JSON.parse(savedAit));
        const savedProd = localStorage.getItem('22bpm_productivity');
        if (savedProd) setProductivity(JSON.parse(savedProd));
      }
    };
    loadData();
  }, [user]);

  const handleLogin = (authenticatedUser: User, rememberMe?: boolean) => {
    setUser(authenticatedUser);
    if (rememberMe) {
      localStorage.setItem('22bpm_user', JSON.stringify(authenticatedUser));
    } else {
      // Remove any existing session data if not remembering
      localStorage.removeItem('22bpm_user');
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('22bpm_user');
    setActiveView('HOME');
  };

  const saveInfraction = async (data: Omit<TrafficInfraction, 'id' | 'timestamp' | 'total'>) => {
    const total = data.cars + data.motorcycles + data.trucks + data.others;
    if (supabaseReady) {
      try {
        if (editingAit) {
          await updateInfraction(editingAit.id, data);
          setEditingAit(null);
          const refreshed = await fetchInfractions();
          setInfractions(refreshed);
          setActiveView('AIT_DASHBOARD');
        } else {
          await insertInfraction(data);
          const refreshed = await fetchInfractions();
          setInfractions(refreshed);
        }
      } catch (e) {
        alert('Falha ao salvar no servidor. Verifique a conexão.');
      }
      return;
    }
    // Fallback localStorage
    setInfractions(prev => {
      let updated: TrafficInfraction[];
      if (editingAit) {
        updated = prev.map(item => 
          item.id === editingAit.id ? { ...data, id: item.id, timestamp: item.timestamp, total } as TrafficInfraction : item
        );
        setEditingAit(null);
        setActiveView('AIT_DASHBOARD');
      } else {
        const newRecord: TrafficInfraction = {
          ...data,
          id: crypto.randomUUID(),
          timestamp: Date.now(),
          total
        };
        updated = [...prev, newRecord];
      }
      localStorage.setItem('22bpm_infractions', JSON.stringify(updated));
      return updated;
    });
  };

  const deleteInfraction = useCallback(async (id: string) => {
    console.log('=== DELETE INFRACTION START ===');
    console.log('ID received:', id);
    console.log('Current infractions count:', infractions.length);
    
    if (!window.confirm("CONFIRMA EXCLUSÃO DEFINITIVA?\nOs gráficos e relatórios serão atualizados imediatamente.")) {
      console.log('User cancelled');
      return;
    }

    const itemToDelete = infractions.find(item => item.id === id);
    console.log('Item to delete:', itemToDelete);
    
    if (!itemToDelete) {
      alert('Erro: Item não encontrado');
      return;
    }

    console.log('supabaseReady:', supabaseReady);
    
    // Simple optimistic update
    setInfractions(prev => {
      const updated = prev.filter(item => item.id !== id);
      console.log('Updated count:', updated.length);
      return updated;
    });

    if (supabaseReady) {
      try {
        console.log('Attempting Supabase delete...');
        await deleteInfractionById(id);
        console.log('Supabase delete successful');
      } catch (error) {
        console.error('Supabase delete failed:', error);
        alert('Falha ao excluir no servidor: ' + error.message);
        // Rollback
        setInfractions(prev => [...prev, itemToDelete]);
      }
    } else {
      console.log('Using localStorage mode');
      localStorage.setItem('22bpm_infractions', JSON.stringify(
        infractions.filter(item => item.id !== id)
      ));
    }
    
    console.log('=== DELETE INFRACTION END ===');
  }, [infractions, supabaseReady]);

  const saveProductivity = async (data: Omit<ProductivityRecord, 'id' | 'timestamp'>) => {
    if (supabaseReady) {
      try {
        if (editingProd) {
          await updateProductivity(editingProd.id, data);
          setEditingProd(null);
          const refreshed = await fetchProductivity();
          setProductivity(refreshed);
          setActiveView('PRODUCTIVITY_DASHBOARD');
        } else {
          await insertProductivity(data);
          const refreshed = await fetchProductivity();
          setProductivity(refreshed);
        }
      } catch (e) {
        alert('Falha ao salvar no servidor. Verifique a conexão.');
      }
      return;
    }
    setProductivity(prev => {
      let updated: ProductivityRecord[];
      if (editingProd) {
        updated = prev.map(item => 
          item.id === editingProd.id ? { ...data, id: item.id, timestamp: item.timestamp } as ProductivityRecord : item
        );
        setEditingProd(null);
        setActiveView('PRODUCTIVITY_DASHBOARD');
      } else {
        const newRecord: ProductivityRecord = {
          ...data,
          id: crypto.randomUUID(),
          timestamp: Date.now()
        };
        updated = [...prev, newRecord];
      }
      localStorage.setItem('22bpm_productivity', JSON.stringify(updated));
      return updated;
    });
  };

  const deleteProductivity = useCallback(async (id: string) => {
    if (!window.confirm("CONFIRMA EXCLUSÃO DEFINITIVA DO REGISTRO DE PRODUTIVIDADE?")) return;
    
    // Get the item being deleted to restore if needed
    const itemToDelete = productivity.find(item => item.id === id);
    if (!itemToDelete) return;

    // Optimistic UI update first
    setProductivity(prev => {
      const updated = prev.filter(item => item.id !== id);
      if (!supabaseReady) {
        localStorage.setItem('22bpm_productivity', JSON.stringify(updated));
      }
      return updated;
    });

    if (supabaseReady) {
      try {
        await deleteProductivityById(id);
        // Force refresh the data from the server
        const refreshed = await fetchProductivity();
        setProductivity(refreshed);
      } catch (e) {
        console.error('Error deleting productivity record:', e);
        alert('Falha ao excluir no servidor. O registro será restaurado.');
        // Rollback by adding the item back
        setProductivity(prev => {
          const updated = [...prev, itemToDelete];
          localStorage.setItem('22bpm_productivity', JSON.stringify(updated));
          return updated;
        });
      }
    } else {
      // For local storage, force a state update to ensure UI refreshes
      setProductivity(prev => {
        const updated = prev.filter(item => item.id !== id);
        localStorage.setItem('22bpm_productivity', JSON.stringify(updated));
        return updated;
      });
    }
  }, [productivity, supabaseReady]);

  const handleImportAll = (newInfractions: TrafficInfraction[], newProductivity: ProductivityRecord[], newUsers?: User[]) => {
    try {
      localStorage.setItem('22bpm_infractions', JSON.stringify(newInfractions));
      localStorage.setItem('22bpm_productivity', JSON.stringify(newProductivity));
      if (newUsers && newUsers.length > 0) localStorage.setItem('22bpm_users_list', JSON.stringify(newUsers));
      setInfractions(newInfractions);
      setProductivity(newProductivity);
      alert("SISTEMA RESTAURADO COM SUCESSO!");
      setActiveView('HOME');
    } catch (e) {
      alert("Erro crítico ao importar dados.");
    }
  };

  const handleNavigate = (view: ViewType) => {
    if (user?.role !== 'ADMIN' && (view === 'AIT_FORM' || view === 'PRODUCTIVITY_FORM' || view === 'DATA_MANAGEMENT' || view === 'USER_MANAGEMENT')) {
      alert("Acesso restrito apenas para Administradores.");
      return;
    }
    setEditingAit(null);
    setEditingProd(null);
    setActiveView(view);
    setIsSidebarOpen(false); 
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <ShieldIcon className="w-16 h-auto mx-auto mb-4" />
          <div className="text-white text-xl">Inicializando Dashboard 22º BPM...</div>
          <div className="text-gray-400 text-sm mt-2">
            {supabase ? 'Conectando ao Supabase...' : 'Usando modo local...'}
          </div>
        </div>
      </div>
    );
  } if (!user) return <Login onLogin={handleLogin} />;

  const renderContent = () => {
    switch (activeView) {
      case 'HOME':
        return (
          <div className="flex flex-col items-center justify-center h-full text-center p-4 animate-fadeIn">
            <ShieldIcon className="w-40 h-40 md:w-56 md:h-56 mb-8 text-blue-600 drop-shadow-[0_0_30px_rgba(30,64,175,0.4)]" />
            <h1 className="text-3xl md:text-5xl font-black mb-2 text-white uppercase tracking-tighter">22º Batalhão de Polícia Militar</h1>
            <p className="text-blue-400 font-bold mb-8 uppercase text-sm tracking-widest">{user.rank} {user.username}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl">
              <button onClick={() => handleNavigate('AIT_DASHBOARD')} className="p-6 bg-gray-900 border border-gray-800 rounded-2xl hover:border-blue-500 transition-all text-left group shadow-lg">
                <h3 className="text-white font-bold mb-1 group-hover:text-blue-400 transition-colors">Painel Trânsito</h3>
                <p className="text-xs text-gray-500">Análise e Gestão de Autos de Infração.</p>
              </button>
              <button onClick={() => handleNavigate('PRODUCTIVITY_DASHBOARD')} className="p-6 bg-gray-900 border border-gray-800 rounded-2xl hover:border-emerald-500 transition-all text-left group shadow-lg">
                <h3 className="text-white font-bold mb-1 group-hover:text-emerald-400 transition-colors">Produtividade</h3>
                <p className="text-xs text-gray-500">Estatísticas de Prisões e Ocorrências.</p>
              </button>
            </div>
          </div>
        );
      case 'AIT_FORM': 
        return <AitForm onSave={saveInfraction} onCancel={() => setActiveView('AIT_DASHBOARD')} initialData={editingAit || undefined} />;
      case 'AIT_DASHBOARD': 
        return <AitDashboard 
          data={infractions} 
          isAdmin={user.role === 'ADMIN'} 
          onDelete={deleteInfraction} 
          onEdit={(item) => { setEditingAit(item); setActiveView('AIT_FORM'); }} 
          userGroup={user.group}
          userCity={user.city}
        />;
      case 'PRODUCTIVITY_FORM': 
        return <ProductivityForm onSave={saveProductivity} onCancel={() => setActiveView('PRODUCTIVITY_DASHBOARD')} initialData={editingProd || undefined} />;
      case 'PRODUCTIVITY_DASHBOARD': 
        return <ProductivityDashboard 
          data={productivity} 
          isAdmin={user.role === 'ADMIN'} 
          onDelete={deleteProductivity} 
          onEdit={(item) => { setEditingProd(item); setActiveView('PRODUCTIVITY_FORM'); }} 
          userGroup={user.group}
          userCity={user.city}
        />;
      case 'DATA_MANAGEMENT': 
        return <DataManagement infractions={infractions} productivity={productivity} onImport={handleImportAll} />;
      case 'USER_MANAGEMENT': 
        return <UserManagement />;
      case 'USER_PROFILE':
        return <UserProfile 
          user={user} 
          onUpdate={(updatedUser) => setUser({ ...user, ...updatedUser })} 
          onLogout={handleLogout} 
        />;
      default: return null;
    }
  };

  return (
    <div className="flex h-screen bg-gray-950 text-gray-100 overflow-hidden font-sans">
      <Sidebar 
        activeView={activeView} 
        setActiveView={handleNavigate} 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
        user={user} 
        onLogout={handleLogout} 
      />
      <div className="flex-1 flex flex-col min-w-0 bg-gray-950">
        <header className="md:hidden flex items-center justify-between px-4 py-3 bg-gray-900 border-b border-gray-800 z-40">
          <ShieldIcon className="w-8 h-8" />
          <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-gray-400 hover:text-white transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7" /></svg>
          </button>
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-8 relative">
          <div className="max-w-7xl mx-auto h-full">{renderContent()}</div>
        </main>
      </div>
      
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}
    </div>
  );
};

export default App;
