import React, { useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { supabase } from '../lib/supabase';
import { supabaseReady, listAppUsers, createAppUser, deleteAppUser, updateAppUser, updateUserPassword } from '../lib/api';

const UserManagement: React.FC = () => {
  // Tipo local para usuários com todos os campos necessários
  type LocalUser = {
    id: string;
    auth_user_id: string;
    username: string;
    email?: string;
    role: UserRole;
    rank: string;
    city?: string;
    group?: string;
  };
  const [users, setUsers] = useState<LocalUser[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [resettingPasswordFor, setResettingPasswordFor] = useState<{id: string, username: string} | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  
  const handleResetPassword = async () => {
    if (!resettingPasswordFor) return;
  
    if (newPassword.length < 6) {
      setPasswordError('A senha deve ter pelo menos 6 caracteres');
      return;
    }
  
    if (newPassword !== confirmPassword) {
      setPasswordError('As senhas não conferem');
      return;
    }
  
    try {
      await updateUserPassword(resettingPasswordFor.id, newPassword);
  
      alert(`✅ Senha do usuário ${resettingPasswordFor.username} alterada com sucesso!`);
  
      setResettingPasswordFor(null);
      setNewPassword('');
      setConfirmPassword('');
      setPasswordError('');
  
    } catch (error: any) {
      console.error('Erro ao redefinir senha:', error);
      setPasswordError(error.message || 'Erro ao redefinir senha');
    }
  };
  

  const [formData, setFormData] = useState<{
    username: string;
    email: string;
    rank: string;
    role: UserRole;
    password: string;
    city: string;
    group: string;
  }>({
    username: '',
    email: '',
    rank: 'Sd',
    role: 'USER',
    password: '',
    city: '',
    group: ''
  });

  const ranks = ['Ten Cel', 'Maj', 'Cap', '1º Ten', '2º Ten', 'Sub Ten', '1º Sgt', '2º Sgt', '3º Sgt', 'Cb', 'Sd'];
  
  // Mapeamento de cidades por grupo
  const CITY_GROUPS: { [key: string]: readonly string[] } = {
    '1ª CIA': ['Lajeado', 'Cruzeiro do Sul', 'Santa Clara do Sul', 'Forquetinha', 'Sério', 'Canudos do Vale'] as const,
    '2ª CIA': ['Encantado', 'Roca Sales', 'Nova Bréscia', 'Coqueiro Baixo', 'Muçum', 'Relvado', 'Doutor Ricardo', 'Vespasiano Correa'] as const,
    '3ª CIA': ['Arroio do Meio', 'Capitão', 'Travesseiro', 'Marques de Souza', 'Pouso Novo', 'Progresso'] as const
  } as const;

  // Todas as cidades ordenadas
  const cities = Object.values(CITY_GROUPS).flat().sort();
  
  // Função para obter o grupo com base na cidade
  const getGroupByCity = (city: string): string => {
    for (const [group, cities] of Object.entries(CITY_GROUPS)) {
      if (cities.includes(city)) {
        return group;
      }
    }
    return ''; // Retorna string vazia se a cidade não for encontrada
  };

  // Atualiza o grupo quando a cidade é alterada
  const handleCityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const city = e.target.value;
    const group = getGroupByCity(city);
    setFormData(prev => ({
      ...prev,
      city,
      group
    }));
  };

  useEffect(() => {
    const load = async () => {
      if (supabaseReady) {
        try {
          const rows = await listAppUsers();
          console.log('Dados brutos recebidos do Supabase:', JSON.stringify(rows, null, 2));
          
          const mapped = rows.map(r => ({
            id: r.id,
            auth_user_id: r.auth_user_id,
            username: r.username,
            email: r.email,
            role: r.role,
            rank: r.rank,
            city: r.city || '',
            group: r.group || ''
          }));
          
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
    
    try {
      if (!supabaseReady) {
        throw new Error('Conexão com o banco de dados não está pronta');
      }

      // Validação dos campos obrigatórios
      if (!formData.username || !formData.email || !formData.password) {
        alert('Preencha todos os campos obrigatórios');
        return;
      }

      // Validação do formato do e-mail
      if (!/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/.test(formData.email)) {
        alert('O e-mail informado não é válido');
        return;
      }

      // Validação da senha
      if (formData.password.length < 6) {
        alert('A senha deve ter pelo menos 6 caracteres');
        return;
      }

      // 1. Primeiro, criar o usuário no Auth
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            username: formData.username,
            role: formData.role,
            rank: formData.rank,
            city: formData.city,
            group: formData.group
          }
        }
      });

      if (signUpError) throw signUpError;
      if (!authData.user) throw new Error('Falha ao criar usuário de autenticação');

      // 2. Depois, criar o perfil do usuário na tabela app_users
      const { data: profileData, error: profileError } = await supabase
        .from('app_users')
        .insert([{
          auth_user_id: authData.user.id,
          username: formData.username,
          email: formData.email,
          role: formData.role,
          rank: formData.rank,
          city: formData.city,
          group: formData.group
        }])
        .select();

      if (profileError) throw profileError;

      // Atualiza a lista de usuários
      const updatedUsers = await listAppUsers();
      setUsers(updatedUsers);
      
      // Limpa o formulário
      setFormData({ 
        username: '', 
        email: '', 
        rank: 'Sd', 
        role: 'USER', 
        password: '',
        city: '',
        group: ''
      });
      setIsAdding(false);
      
      alert('Usuário criado com sucesso! Um e-mail de confirmação foi enviado.');
    } catch (error) {
      console.error('Erro ao criar usuário:', error);
      alert(`Erro ao criar usuário: ${error.message}`);
    }
  };

  const deleteUser = async (userId: string) => {
    try {
      await deleteAppUser(userId);
  
      setUsers(prev =>
        prev.filter(u => u.id !== userId)
      );
  
      alert("Usuário excluído com sucesso");
    } catch (e) {
      console.error(e);
      alert("Erro ao excluir usuário");
    }
  };  

  const startEditUser = (user: LocalUser) => {
    setEditingUser(user.id);
    setFormData({
      username: user.username,
      email: user.email || '',
      rank: user.rank,
      role: user.role,
      password: '',
      city: user.city || '',
      group: user.group || ''
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
      password: '',
      city: '',
      group: ''
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
          rank: formData.rank,
          city: formData.city,
          group: formData.group
        });
        
        setUsers(prev => prev.map(u => 
          u.id === editingUser 
            ? { 
                ...u, 
                username: updated.username, 
                role: updated.role, 
                rank: updated.rank,
                city: updated.city || '',
                group: updated.group || ''
              }
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
          <p className="text-gray-400">Controle de acessos e permissões do SGO.</p>
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
          <div className="flex flex-col">
            <label className="text-xs text-gray-500 font-bold uppercase mb-2">Cidade de Atuação</label>
            <select 
              value={formData.city}
              onChange={handleCityChange}
              className="bg-gray-800 border border-gray-700 text-white rounded-xl p-3 outline-none focus:ring-1 focus:ring-blue-500"
              required
            >
              <option value="">Selecione uma cidade</option>
              {cities.map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col">
            <label className="text-xs text-gray-500 font-bold uppercase mb-2">Grupo</label>
            <div className="bg-gray-800 border border-gray-700 text-white rounded-xl p-3 min-h-[52px] flex items-center">
              {formData.group || (
                <span className="text-gray-400 italic">Selecione uma cidade primeiro</span>
              )}
              <input type="hidden" name="group" value={formData.group} required />
            </div>
          </div>
          {!editingUser && (
            <div className="flex flex-col">
              <label className="text-xs text-gray-500 font-bold uppercase mb-2">Senha</label>
              <input 
                type="password" 
                value={formData.password}
                onChange={e => setFormData({...formData, password: e.target.value})}
                className="bg-gray-800 border border-gray-700 text-white rounded-xl p-3 outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="••••••••"
                required={!editingUser}
              />
            </div>
          )}
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
              <th className="px-6 py-4">Cidade</th>
              <th className="px-6 py-4">Grupo</th>
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
                <td className="px-6 py-4">{u.city || '-'}</td>
                <td className="px-6 py-4">{u.group || '-'}</td>
                <td className="px-6 py-4">
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
                    <button 
                      onClick={() => setResettingPasswordFor({ id: u.id, username: u.username })}
                      className="text-yellow-500 hover:text-yellow-400 transition-colors p-2"
                      title="Redefinir senha"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                      </svg>
                    </button>
                    {u.username !== 'comando' && (
                      <button 
                      onClick={() => {
                        if (window.confirm(`Tem certeza que deseja excluir o usuário ${u.username}?`)) {
                          deleteUser(u.auth_user_id);
                        }
                      }}
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

      {/* Modal de redefinição de senha */}
      {resettingPasswordFor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-900 p-6 rounded-lg shadow-xl w-96 border border-gray-700">
            <h3 className="text-lg font-bold text-white mb-4">
              Redefinir senha para {resettingPasswordFor.username}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Nova senha
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    if (passwordError) setPasswordError('');
                  }}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Digite a nova senha"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Confirmar senha
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (passwordError) setPasswordError('');
                  }}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Confirme a nova senha"
                />
              </div>
              
              {passwordError && (
                <div className="text-red-500 text-sm">{passwordError}</div>
              )}
              
              <div className="flex justify-end space-x-3 pt-2">
                <button
                  onClick={() => {
                    setResettingPasswordFor(null);
                    setNewPassword('');
                    setConfirmPassword('');
                    setPasswordError('');
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleResetPassword}
                  className="px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-md hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                >
                  Salvar senha
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
