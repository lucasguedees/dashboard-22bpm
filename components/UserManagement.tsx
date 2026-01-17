
import React, { useState, useEffect } from 'react';
import { User, UserRole } from '../types';

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    rank: 'Sd',
    role: 'USER' as UserRole,
    password: ''
  });

  const ranks = ['Ten Cel', 'Maj', 'Cap', '1º Ten', '2º Ten', 'Sub Ten', '1º Sgt', '2º Sgt', '3º Sgt', 'Cb', 'Sd'];

  useEffect(() => {
    const saved = localStorage.getItem('22bpm_users_list');
    if (saved) setUsers(JSON.parse(saved));
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const newUser: User = {
      id: crypto.randomUUID(),
      username: formData.username,
      rank: formData.rank,
      role: formData.role,
      password: formData.password
    };
    const updated = [...users, newUser];
    setUsers(updated);
    localStorage.setItem('22bpm_users_list', JSON.stringify(updated));
    setIsAdding(false);
    setFormData({ username: '', rank: 'Sd', role: 'USER', password: '' });
  };

  const deleteUser = (id: string) => {
    if (confirm("Deseja realmente remover este usuário?")) {
      const updated = users.filter(u => u.id !== id);
      setUsers(updated);
      localStorage.setItem('22bpm_users_list', JSON.stringify(updated));
    }
  };

  return (
    <div className="animate-fadeIn">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-white">Gestão de Usuários</h2>
          <p className="text-gray-400">Controle de acessos e permissões do SIOP.</p>
        </div>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 px-6 rounded-xl transition-all shadow-lg shadow-blue-900/20 active:scale-95 flex items-center space-x-2"
        >
          {isAdding ? <span>Cancelar</span> : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/></svg>
              <span>Novo Usuário</span>
            </>
          )}
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleSave} className="bg-gray-900 border border-gray-800 p-6 rounded-3xl mb-8 shadow-2xl grid grid-cols-1 md:grid-cols-4 gap-4 animate-slideDown">
          <div className="flex flex-col">
            <label className="text-xs text-gray-500 font-bold uppercase mb-2">Usuário de Rede</label>
            <input 
              type="text" 
              required
              value={formData.username}
              onChange={e => setFormData({...formData, username: e.target.value.toLowerCase()})}
              className="bg-gray-800 border border-gray-700 text-white rounded-xl p-3 outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="ex: p3.sobrenome"
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
            <label className="text-xs text-gray-500 font-bold uppercase mb-2">Senha Inicial</label>
            <div className="flex items-center space-x-2">
              <input 
                type="password" 
                required
                value={formData.password}
                onChange={e => setFormData({...formData, password: e.target.value})}
                className="flex-1 bg-gray-800 border border-gray-700 text-white rounded-xl p-3 outline-none focus:ring-1 focus:ring-blue-500"
              />
              <button type="submit" className="bg-emerald-600 hover:bg-emerald-500 p-3 rounded-xl transition-all">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"/></svg>
              </button>
            </div>
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
                  {u.username !== 'comando' && (
                    <button 
                      onClick={() => deleteUser(u.id)}
                      className="text-gray-600 hover:text-red-500 transition-colors p-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                    </button>
                  )}
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
