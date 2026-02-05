import React, { useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { supabase } from '../lib/supabase';

// Definição dos grupos e cidades correspondentes
const CITY_GROUPS = {
  '1ª CIA': ['Lajeado', 'Cruzeiro do Sul', 'Santa Clara do Sul', 'Forquetinha', 'Sério', 'Canudos do Vale'],
  '2ª CIA': ['Encantado', 'Roca Sales', 'Nova Bréscia', 'Coqueiro Baixo', 'Muçum', 'Relvado', 'Doutor Ricardo', 'Vespasiano Correa'],
  '3ª CIA': ['Arroio do Meio', 'Capitão', 'Travesseiro', 'Marques de Souza', 'Pouso Novo', 'Progresso']
} as const;

type CityGroup = keyof typeof CITY_GROUPS;
type City = typeof CITY_GROUPS[CityGroup][number];

// Todas as cidades disponíveis, ordenadas
const ALL_CITIES = Object.values(CITY_GROUPS)
  .flat()
  .sort((a, b) => a.localeCompare(b));

interface UserProfileProps {
  user: User;
  onUpdate: (updatedUser: Partial<User>) => void;
  onLogout: () => void;
}

const UserProfile: React.FC<UserProfileProps> = ({ user, onUpdate, onLogout }) => {
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  const [formData, setFormData] = useState({
    username: user.username,
    email: user.email || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    rank: user.rank || '',
    city: user.city || '',
    group: user.group || ''
  });
  
  // Encontra o grupo baseado na cidade selecionada
  const findGroupByCity = (cityName: string): string => {
    if (!cityName) return '';
    for (const [group, cities] of Object.entries(CITY_GROUPS)) {
      if (cities.some(city => city === cityName)) {
        return group;
      }
    }
    return '';
  };
  
  // Atualiza o grupo quando a cidade muda
  useEffect(() => {
    if (formData.city) {
      const group = findGroupByCity(formData.city);
      setFormData(prev => ({ ...prev, group }));
    }
  }, [formData.city]);

  useEffect(() => {
    // Verificar estrutura da tabela ao carregar o componente
    const checkTableStructure = async () => {
      try {
        const { data: columns, error } = await supabase
          .rpc('get_table_columns', { table_name: 'app_users' });
          
        if (error) {
          console.error('Erro ao verificar estrutura da tabela:', error);
          return;
        }
        
        console.log('Colunas da tabela app_users:', columns);
      } catch (err) {
        console.error('Erro ao verificar estrutura da tabela:', err);
      }
    };
    
    checkTableStructure();
    
    setFormData(prev => ({
      ...prev,
      username: user.username,
      email: user.email || '',
      rank: user.rank || '',
      city: user.city || '',
      group: user.group || ''
    }));
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      // Atualizar senha se fornecida
      if (formData.newPassword) {
        if (formData.newPassword !== formData.confirmPassword) {
          throw new Error('As senhas não coincidem');
        }
        
        const { error: updateError } = await supabase.auth.updateUser({
          password: formData.newPassword
        });

        if (updateError) throw updateError;
      }

      // Atualizar perfil
      const updates = {
        username: formData.username,
        rank: formData.rank,
        city: formData.city,
        group: formData.group,
        updated_at: new Date().toISOString()
      };

      console.log('Atualizando perfil com os seguintes dados:', updates);
      
      const { data: updatedUser, error: profileError } = await supabase
        .from('app_users')
        .update(updates)
        .eq('id', user.id)
        .select('id, username, email, role, rank, city, group')
        .single();

      console.log('Resposta da atualização:', { updatedUser, profileError });
      
      if (profileError) {
        console.error('Erro detalhado ao atualizar perfil:', {
          message: profileError.message,
          details: profileError.details,
          hint: profileError.hint,
          code: profileError.code
        });
        throw profileError;
      }

      // Atualizar estado do usuário
      onUpdate({
        ...user,
        ...updates
      });

      setMessage({ type: 'success', text: 'Perfil atualizado com sucesso!' });
      setEditing(false);
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Erro ao atualizar perfil' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-gray-900 rounded-xl shadow-lg border border-gray-800">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">Meu Perfil</h2>
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            Editar Perfil
          </button>
        )}
      </div>

      {message && (
        <div 
          className={`mb-6 p-4 rounded-lg ${message.type === 'success' ? 'bg-green-900/50 border border-green-800' : 'bg-red-900/50 border border-red-800'}`}
        >
          <p className={`text-sm ${message.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
            {message.text}
          </p>
        </div>
      )}

      {editing ? (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Nome de Usuário</label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Posto/Graduação</label>
              <select
                name="rank"
                value={formData.rank}
                onChange={handleInputChange}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Selecione...</option>
                <option value="Sd">Soldado</option>
                <option value="Cb">Cabo</option>
                <option value="3º Sgt">3º Sargento</option>
                <option value="2º Sgt">2º Sargento</option>
                <option value="1º Sgt">1º Sargento</option>
                <option value="Subten">Subtenente</option>
                <option value="2º Ten">2º Tenente</option>
                <option value="1º Ten">1º Tenente</option>
                <option value="Cap">Capitão</option>
                <option value="Maj">Major</option>
                <option value="Ten Cel">Tenente-Coronel</option>
                <option value="Cel">Coronel</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Cidade de Atuação</label>
              <select
                name="city"
                value={formData.city}
                onChange={handleInputChange}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Selecione uma cidade</option>
                {ALL_CITIES.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Grupo</label>
              <input
                type="text"
                value={formData.group || 'Selecione uma cidade para ver o grupo'}
                disabled
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-400"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-gray-800">
            <h3 className="text-lg font-medium text-gray-300 mb-4">Alterar Senha</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Nova Senha</label>
                <input
                  type="password"
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleInputChange}
                  placeholder="Deixe em branco para manter a senha atual"
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Confirmar Nova Senha</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  placeholder="Confirme a nova senha"
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-800">
            <button
              type="button"
              onClick={() => {
                setEditing(false);
                setMessage(null);
              }}
              className="px-4 py-2 border border-gray-700 text-gray-300 rounded-lg hover:bg-gray-800 transition-colors"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              disabled={loading}
            >
              {loading ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>
        </form>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-gray-400">Nome de Usuário</p>
              <p className="text-white font-medium">{user.username}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Email</p>
              <p className="text-white font-medium">{user.email || 'Não informado'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Posto/Graduação</p>
              <p className="text-white font-medium">{user.rank || 'Não informado'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Nível de Acesso</p>
              <p className="text-white font-medium">
                {user.role === 'ADMIN' ? 'Administrador' : 
                 user.role === 'COMANDO' ? 'Comando' : 'Usuário'}
              </p>
            </div>
          </div>
          
          <div className="pt-4 border-t border-gray-800">
            <h3 className="text-lg font-medium text-gray-300 mb-4">Segurança</h3>
            <div className="flex justify-between items-center p-4 bg-gray-800/50 rounded-lg">
              <div>
                <p className="font-medium text-white">Senha</p>
                <p className="text-sm text-gray-400">•••••••••••</p>
              </div>
              <button
                onClick={() => setEditing(true)}
                className="text-sm text-blue-400 hover:text-blue-300"
              >
                Alterar Senha
              </button>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-800">
            <button
              onClick={onLogout}
              className="w-full py-2 px-4 bg-red-900/50 border border-red-800 text-red-400 rounded-lg hover:bg-red-900/70 transition-colors"
            >
              Sair da Conta
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfile;
