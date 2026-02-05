
import React, { useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { supabaseReady, listAppUsers, createAppUser, deleteAppUser, updateAppUser } from '../lib/api';

const UserManagement: React.FC = () => {
  // Usando um tipo local para permitir usuários sem email
  type LocalUser = Omit<User, 'email'> & { email?: string };
  const [users, setUsers] = useState<LocalUser[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    rank: 'Sd',
    role: 'USER' as UserRole,
    password: ''
  });

  const ranks = ['Ten Cel', 'Maj', 'Cap', '1º Ten', '2º Ten', 'Sub Ten', '1º Sgt', '2º Sgt', '3º Sgt', 'Cb', 'Sd'];

  useEffect(() => {
    const load = async () => {
      if (supabaseReady) {
        try {
          console.log('Iniciando carregamento de usuários...');
          const rows = await listAppUsers();
          console.log('Dados brutos recebidos do Supabase:', JSON.stringify(rows, null, 2));
          
          const mapped = rows.map(r => {
            console.log(`Processando usuário: ${r.username}`, r);
            return { 
              id: r.id, 
              username: r.username, 
              email: r.email || '', 
              role: r.role, 
              rank: r.rank 
            };
          });
          
          console.log('Usuários mapeados para exibição:', JSON.stringify(mapped, null, 2));
          setUsers(mapped);
          return;
        } catch (e) {
          console.error('Erro ao carregar usuários:', e);
          console.warn('Falha ao carregar usuários do Supabase, usando localStorage...', e);
        }
      }
      const saved = localStorage.getItem('22bpm_users_list');
      if (saved) setUsers(JSON.parse(saved));
    };
    
    load();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validação dos campos obrigatórios
    if (!formData.username || !formData.role || !formData.rank) {
      alert('Preencha todos os campos obrigatórios');
      return;
    }
    
    // Validação de e-mail para novos usuários ou edições
    if (!formData.email) {
      alert('O e-mail é obrigatório');
      return;
    }
    
    // Validação do formato do e-mail
    if (!/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/.test(formData.email)) {
      alert('O e-mail informado não é válido');
      return;
    }
    
    try {
      if (supabaseReady) {
        if (editingUser) {
          // Atualizar usuário existente
          const updatedUser = await updateAppUser(editingUser, {
            username: formData.username,
            email: formData.email,
            role: formData.role,
            rank: formData.rank,
          });
          
          setUsers(users.map(u => 
            u.id === editingUser ? { ...u, ...updatedUser } : u
          ));
          setEditingUser(null);
        } else {
          // Criar novo usuário
          const created = await createAppUser({
            username: formData.username,
            email: formData.email,
            role: formData.role,
            rank: formData.rank,
          });
          
          setUsers([...users, {
            id: created.id,
            username: created.username,
            email: created.email || '',
            role: created.role,
            rank: created.rank
          }]);
        }
      } else {
        // Fallback localStorage
        const newUser: LocalUser = {
          id: crypto.randomUUID(),
          username: formData.username,
          rank: formData.rank,
          role: formData.role,
          password: formData.password,
          email: formData.email
        };
        setUsers([...users, newUser]);
        localStorage.setItem('22bpm_users_list', JSON.stringify([...users, newUser]));
      }
      
      // Limpar formulário
      setFormData({ username: '', email: '', rank: 'Sd', role: 'USER', password: '' });
      setIsAdding(false);
    } catch (err) {
      console.error('Erro ao salvar usuário:', err);
      alert('Falha ao salvar usuário. Verifique o console para mais detalhes.');
    }
  };

  const deleteUser = async (id: string) => {
    if (!confirm("Deseja realmente remover este usuário?")) return;
    if (supabaseReady) {
      try {
        await deleteAppUser(id);
        setUsers(prev => prev.filter(u => u.id !== id));
        return;
      } catch (err) {
        alert('Falha ao remover usuário no Supabase.');
        return;
      }
    }
    const updated = users.filter(u => u.id !== id);
    setUsers(updated);
    localStorage.setItem('22bpm_users_list', JSON.stringify(updated));
  };

  const startEditUser = (user: LocalUser) => {
    setEditingUser(user.id);
    setFormData({
      username: user.username,
      email: (user as any).email || '',
      rank: user.rank,
      role: user.role,
      password: ''
    });
    setIsAdding(false);
  };

  const cancelEdit = () => {
    setEditingUser(null);
    setFormData({
      username: '',
      email: '',
      rank: 'Sd',
      role: 'USER',
      password: ''
    });
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    if (supabaseReady) {
      try {
        const updated = await updateAppUser(editingUser, {
          username: formData.username,
          email: formData.email || null,
          role: formData.role,
          rank: formData.rank
        });
        
        setUsers(prev => prev.map(u => 
          u.id === editingUser 
            ? { ...u, username: updated.username, role: updated.role, rank: updated.rank }
            : u
        ));
        
        cancelEdit();
        return;
      } catch (err) {
        alert('Falha ao atualizar usuário no Supabase. Verifique permissões RLS.');
        return;
      }
    }
    
    // Fallback localStorage
    const updated = users.map(u => 
      u.id === editingUser 
        ? { ...u, username: formData.username, role: formData.role, rank: formData.rank }
        : u
    );
    setUsers(updated);
    localStorage.setItem('22bpm_users_list', JSON.stringify(updated));
    cancelEdit();
  };

  return (
    <div className="animate-fadeIn">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-white">Gestão de Usuários</h2>
          <p className="text-gray-400">Controle de acessos e permissões do SIOP.</p>
        </div>
        <button 
          onClick={() => {
            if (editingUser) {
              cancelEdit();
            } else {
              setIsAdding(!isAdding);
            }
          }}
          className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 px-6 rounded-xl transition-all shadow-lg shadow-blue-900/20 active:scale-95 flex items-center space-x-2"
        >
          {editingUser ? (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
              <span>Cancelar Edição</span>
            </>
          ) : isAdding ? (
            <span>Cancelar</span>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
              </svg>
              <span>Novo Usuário</span>
            </>
          )}
        </button>
      </div>

      {(isAdding || editingUser) && (
        <form onSubmit={editingUser ? handleUpdate : handleSave} className="bg-gray-900 border border-gray-800 p-6 rounded-3xl mb-8 shadow-2xl grid grid-cols-1 md:grid-cols-4 gap-4 animate-slideDown">
          <div className="flex flex-col">
            <label className="text-xs text-gray-500 font-bold uppercase mb-2">Usuário</label>
            <input 
              type="text" 
              required
              value={formData.username}
              onChange={e => setFormData({...formData, username: e.target.value})}
              className="bg-gray-800 border border-gray-700 text-white rounded-xl p-3 outline-none focus:ring-1 focus:ring-blue-500"
              placeholder={editingUser ? "Nome do usuário" : "ex: p3.sobrenome"}
            />
          </div>
          <div className="flex flex-col">
            <label className="text-xs text-gray-500 font-bold uppercase mb-2">E-mail</label>
            <input 
              type="email" 
              value={formData.email}
              onChange={e => setFormData({...formData, email: e.target.value})}
              className="bg-gray-800 border border-gray-700 text-white rounded-xl p-3 outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="email@exemplo.com"
            />
          </div>
          <div className="flex flex-col">
            <label className="text-xs text-gray-500 font-bold uppercase mb-2">Posto / Graduação</label>
            <select 
              value={formData.rank}
              onChange={e => setFormData({...formData, rank: e.target.value})}
              className="bg-gray-800 border border-gray-700 text-white rounded-xl p-3 outline-none focus:ring-1 focus:ring-blue-500"
            >
              {ranks.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div className="flex flex-col">
            <label className="text-xs text-gray-500 font-bold uppercase mb-2">Nível de Acesso</label>
            <select 
              value={formData.role}
              onChange={e => setFormData({...formData, role: e.target.value as UserRole})}
              className="bg-gray-800 border border-gray-700 text-white rounded-xl p-3 outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="ADMIN">ADMINISTRADOR (Total)</option>
              <option value="COMANDO">COMANDO (Consulta)</option>
              <option value="USER">USUÁRIO (Consulta)</option>
            </select>
          </div>
          <div className="flex flex-col md:col-span-4">
            <label className="text-xs text-gray-500 font-bold uppercase mb-2">Ações</label>
            <div className="flex items-center space-x-4">
              <button type="submit" className="bg-emerald-600 hover:bg-emerald-500 px-6 py-3 rounded-xl transition-all text-white font-bold">
                {editingUser ? 'Atualizar Usuário' : 'Salvar Usuário'}
              </button>
              <button 
                type="button"
                onClick={() => {
                  if (editingUser) {
                    cancelEdit();
                  } else {
                    setIsAdding(false);
                  }
                }}
                className="bg-gray-700 hover:bg-gray-600 px-6 py-3 rounded-xl transition-all text-white font-bold"
              >
                Cancelar
              </button>
            </div>
            <p className="text-[10px] text-gray-500 mt-2">
              {editingUser 
                ? "Edite os dados do usuário e clique em 'Atualizar Usuário' para salvar as alterações."
                : "Observação: a criação no Supabase registra o perfil. O próprio usuário deve usar a tela de login para criar sua conta (e‑mail/senha) e vincular automaticamente."
              }
            </p>
          </div>
        </form>
      )}

      <div className="bg-gray-900 border border-gray-800 rounded-3xl overflow-hidden shadow-xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-800/50 text-gray-500 text-[10px] uppercase font-black tracking-widest">
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Posto/Grad</th>
              <th className="px-6 py-4">Nome de Usuário</th>
              <th className="px-6 py-4">E-mail</th>
              <th className="px-6 py-4">Perfil</th>
              <th className="px-6 py-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {users.map(u => (
              <tr key={u.id} className="hover:bg-gray-800/20 transition-colors">
                <td className="px-6 py-4">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                </td>
                <td className="px-6 py-4 text-white font-bold">{u.rank}</td>
                <td className="px-6 py-4 text-gray-300 font-mono text-sm">{u.username}</td>
                <td className="px-6 py-4 text-gray-400 text-sm">{u.email || '-'}</td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                    u.role === 'ADMIN' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : 
                    u.role === 'COMANDO' ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20' :
                    'bg-gray-800 text-gray-400'
                  }`}>
                    {u.role}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end space-x-2">
                    <button 
                      onClick={() => startEditUser(u)}
                      className="text-blue-500 hover:text-blue-400 transition-colors p-2"
                      title="Editar usuário"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                      </svg>
                    </button>
                    {u.username !== 'comando' && (
                      <button 
                        onClick={() => deleteUser(u.id)}
                        className="text-gray-600 hover:text-red-500 transition-colors p-2"
                        title="Remover usuário"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                        </svg>
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserManagement;
