
import React, { useState, useRef } from 'react';
import { User } from '../types';
import { ShieldIcon } from '../constants';
import { supabase, usingFallback } from '../lib/supabase';
import { getOrCreateAppUser, getAppUser, createUserProfile } from '../lib/api';

interface LoginProps {
  onLogin: (user: User, rememberMe?: boolean) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  
  // Login states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const passwordInputRef = useRef<HTMLInputElement>(null);
  
  // Register states
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [registerName, setRegisterName] = useState('');
  const [registerRank, setRegisterRank] = useState('Sd');
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [registerError, setRegisterError] = useState('');
  const [registerLoading, setRegisterLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      console.log('=== LOGIN SUBMIT START ===');
      console.log('Email:', email);
      
      if (!supabase) throw new Error('Supabase não configurado');
      if (!email.includes('@')) throw new Error('Informe um e-mail válido.');

      // Tenta login
      console.log('Attempting Supabase signInWithPassword...');
      const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({ email, password });
      
      console.log('signInErr:', signInErr);
      console.log('signInData:', signInData);
      
      if (signInErr) throw signInErr;
      if (!signInData.user?.id) throw new Error('Falha na autenticação.');

      console.log('Auth successful, user ID:', signInData.user.id);

      // Busca perfil existente em app_users (não cria automaticamente)
      console.log('Looking for app_user profile...');
      const profile = await getAppUser(signInData.user.id);
      console.log('Profile result:', profile);
      
      if (!profile) {
        console.log('No profile found, throwing error');
        throw new Error('Usuário não encontrado. Faça o cadastro primeiro.');
      }
      
      console.log('Profile found, logging in...');
      onLogin(profile, rememberMe);
      console.log('=== LOGIN SUBMIT END ===');
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err?.message || 'Falha na autenticação.');
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterError('');
    setSuccessMessage('');
    setRegisterLoading(true);

    try {
      if (!supabase) throw new Error('Supabase não configurado');
      
      // Validações
      if (!registerEmail.includes('@')) throw new Error('Informe um e-mail válido.');
      if (registerPassword.length < 6) throw new Error('A senha deve ter pelo menos 6 caracteres.');
      if (registerPassword !== confirmPassword) throw new Error('As senhas não coincidem.');
      if (!registerName.trim()) throw new Error('Informe seu nome completo.');

      // Verificar se usuário já existe no Supabase Auth
      console.log('=== REGISTRATION START ===');
      console.log('Environment:', import.meta.env.MODE);
      console.log('Supabase available:', !!supabase);
      console.log('Using fallback:', usingFallback);
      console.log('Email:', registerEmail);
      console.log('Checking if user exists in Supabase Auth...');
      
      if (!supabase) {
        throw new Error('Supabase não está configurado no ambiente de produção');
      }
      
      const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({ 
        email: registerEmail, 
        password: registerPassword 
      });
      
      console.log('SignIn error:', signInErr?.message);
      console.log('SignIn data:', signInData?.user?.id ? 'User found' : 'No user');
      
      if (signInErr?.message.includes('Invalid login credentials')) {
        // Usuário não existe no Auth, pode criar novo
        console.log('User not found in Auth, creating new account...');
        const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({ 
          email: registerEmail, 
          password: registerPassword 
        });
        
        console.log('SignUp error:', signUpErr?.message);
        console.log('SignUp data:', signUpData?.user?.id ? 'User created' : 'No user');
        
        if (signUpErr) throw signUpErr;
        if (!signUpData.user?.id) throw new Error('Falha ao criar conta.');

        // Criar perfil em app_users
        console.log('Creating profile for new user...');
        const profile = await createUserProfile(signUpData.user.id, registerName, registerEmail, registerRank);
        console.log('Profile created:', profile);
        
        setSuccessMessage('Conta criada com sucesso! Você já pode fazer login.');
      } else if (!signInErr && signInData.user?.id) {
        // Usuário existe no Auth mas não tem perfil, criar apenas o perfil
        console.log('User exists in Auth, creating profile only...');
        console.log('Auth user ID:', signInData.user.id);
        
        const profile = await createUserProfile(signInData.user.id, registerName, registerEmail, registerRank);
        console.log('Profile created for existing user:', profile);
        
        setSuccessMessage('Perfil criado com sucesso! Você já pode fazer login.');
        
        // Fazer logout para limpar a sessão
        await supabase.auth.signOut();
        console.log('Logged out after profile creation');
      } else {
        console.error('Unexpected error:', signInErr);
        throw signInErr || new Error('Erro ao verificar usuário existente');
      }
      
      setRegisterLoading(false);
      
      // Limpar formulário
      setRegisterEmail('');
      setRegisterPassword('');
      setConfirmPassword('');
      setRegisterName('');
      setRegisterRank('Sd');
      
      // Mudar para aba de login após 2 segundos
      setTimeout(() => {
        setActiveTab('login');
        setEmail(registerEmail);
        setPassword(registerPassword);
      }, 2000);
      
    } catch (err: any) {
      console.error('=== REGISTRATION ERROR ===');
      console.error('Error type:', typeof err);
      console.error('Error message:', err?.message);
      console.error('Error details:', err);
      console.error('=== END REGISTRATION ERROR ===');
      
      setRegisterError(err?.message || 'Falha no cadastro.');
      setRegisterLoading(false);
    }
  };

  return (
    <div className="h-screen w-full bg-gray-950 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/10 via-transparent to-transparent opacity-50 pointer-events-none"></div>
      
      <div className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-3xl p-8 shadow-2xl relative z-10">
        <div className="flex flex-col items-center mb-8">
          <div className="w-24 h-24 mb-4 flex items-center justify-center relative">
            <div className="absolute inset-0 bg-blue-500/10 blur-2xl rounded-full scale-150"></div>
            <ShieldIcon className="w-full h-full relative z-10" />
          </div>
          <h1 className="text-xl font-black text-white tracking-tighter uppercase">SIOP 22º BPM</h1>
          <p className="text-blue-500 text-[9px] font-black uppercase tracking-[0.2em] mt-1">Sistema de Gestão Operacional</p>
          {usingFallback && (
            <div className="mt-2 px-3 py-1 bg-yellow-500/20 border border-yellow-500/30 rounded-full">
              <span className="text-yellow-400 text-xs font-medium">⚠️ Modo Emergência</span>
            </div>
          )}
        </div>

        {/* Abas */}
        <div className="flex mb-6 bg-gray-800 rounded-xl p-1">
          <button
            onClick={() => setActiveTab('login')}
            className={`flex-1 py-2 px-4 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'login' 
                ? 'bg-blue-600 text-white shadow-lg' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Entrar
          </button>
          <button
            onClick={() => setActiveTab('register')}
            className={`flex-1 py-2 px-4 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'register' 
                ? 'bg-emerald-600 text-white shadow-lg' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Cadastrar
          </button>
        </div>

        {/* Aba de Login */}
        {activeTab === 'login' && (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-xs font-bold flex items-center space-x-2 animate-shake">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                </svg>
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-1 mb-2 block">E-mail</label>
              <input 
                type="email" 
                value={email}
                autoComplete="email"
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-gray-600 text-sm"
                placeholder="seu@email.com"
                required
              />
            </div>

            <div>
              <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-1 mb-2 block">Senha</label>
              <div className="relative">
                <input 
                  ref={passwordInputRef}
                  type={showPassword ? "text" : "password"}
                  value={password}
                  autoComplete="current-password"
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 pr-10 py-3 outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-gray-600 text-sm"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300 focus:outline-none"
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showPassword ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between mt-4">
              <label className="flex items-center space-x-2 cursor-pointer group">
                <input 
                  type="checkbox" 
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 border-gray-600 rounded bg-gray-800 text-blue-600 focus:ring-blue-500 focus:ring-2 cursor-pointer"
                />
                <span className="text-xs text-gray-400 group-hover:text-gray-300 transition-colors">Manter conectado</span>
              </label>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-gray-800 text-white font-black py-3 rounded-xl transition-all shadow-lg shadow-blue-900/20 active:scale-95 flex items-center justify-center space-x-2 text-sm"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"/>
                  </svg>
                  <span>Entrar no Sistema</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* Aba de Cadastro */}
        {activeTab === 'register' && (
          <form onSubmit={handleRegister} className="space-y-4">
            {successMessage && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3 rounded-xl text-xs font-bold flex items-center space-x-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <span>{successMessage}</span>
              </div>
            )}

            {registerError && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-xs font-bold flex items-center space-x-2 animate-shake">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                </svg>
                <span>{registerError}</span>
              </div>
            )}

            <div>
              <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-1 mb-2 block">Nome Completo</label>
              <input 
                type="text" 
                value={registerName}
                autoComplete="name"
                onChange={(e) => setRegisterName(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-500 transition-all placeholder:text-gray-600 text-sm"
                placeholder="Seu nome completo"
                required
              />
            </div>

            <div>
              <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-1 mb-2 block">E-mail</label>
              <input 
                type="email" 
                value={registerEmail}
                autoComplete="email"
                onChange={(e) => setRegisterEmail(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-500 transition-all placeholder:text-gray-600 text-sm"
                placeholder="seu@email.com"
                required
              />
            </div>

            <div>
              <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-1 mb-2 block">Posto/Graduação</label>
              <select 
                value={registerRank}
                onChange={(e) => setRegisterRank(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-sm"
              >
                <option value="Sd">Soldado</option>
                <option value="Cabo">Cabo</option>
                <option value="3º Sgt">3º Sargento</option>
                <option value="2º Sgt">2º Sargento</option>
                <option value="1º Sgt">1º Sargento</option>
                <option value="Sub Ten">Sub Tenente</option>
                <option value="1º Ten">1º Tenente</option>
                <option value="Cap">Capitão</option>
                <option value="Maj">Major</option>
                <option value="Ten Cel">Tenente Coronel</option>
                <option value="Cel">Coronel</option>
              </select>
            </div>

            <div>
              <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-1 mb-2 block">Senha</label>
              <div className="relative">
                <input 
                  type={showRegisterPassword ? "text" : "password"}
                  value={registerPassword}
                  autoComplete="new-password"
                  onChange={(e) => setRegisterPassword(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 pr-10 py-3 outline-none focus:ring-2 focus:ring-emerald-500 transition-all placeholder:text-gray-600 text-sm"
                  placeholder="Mínimo 6 caracteres"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300 focus:outline-none"
                >
                  {showRegisterPassword ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div>
              <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-1 mb-2 block">Confirmar Senha</label>
              <div className="relative">
                <input 
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  autoComplete="new-password"
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 pr-10 py-3 outline-none focus:ring-2 focus:ring-emerald-500 transition-all placeholder:text-gray-600 text-sm"
                  placeholder="Confirme sua senha"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300 focus:outline-none"
                >
                  {showConfirmPassword ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={registerLoading}
              className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-800 text-white font-black py-3 rounded-xl transition-all shadow-lg shadow-emerald-900/20 active:scale-95 flex items-center justify-center space-x-2 text-sm"
            >
              {registerLoading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"/>
                  </svg>
                  <span>Criar Conta</span>
                </>
              )}
            </button>
          </form>
        )}

        <div className="mt-6 pt-4 border-t border-gray-800/50 text-center">
          <p className="text-[8px] text-gray-600 font-bold uppercase tracking-widest leading-loose">
            Uso exclusivo da Brigada Militar / 22º BPM<br/>
            Acesso monitorado e sigiloso
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
