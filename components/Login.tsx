
import React, { useState, useRef } from 'react';
import { User } from '../types';
import { ShieldIcon } from '../constants';
import { supabase } from '../lib/supabase';
import { getOrCreateAppUser } from '../lib/api';

interface LoginProps {
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const passwordInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (!supabase) throw new Error('Supabase não configurado');
      if (!email.includes('@')) throw new Error('Informe um e-mail válido.');

      // Tenta login. Se não existir, tenta criar conta rapidamente.
      const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({ email, password });
      let authUserId: string | null = signInData?.user?.id || null;

      if (signInErr) {
        // Tentativa de cadastro (fluxo simples)
        const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({ email, password });
        if (signUpErr) throw signUpErr;
        authUserId = signUpData.user?.id || null;
      }

      if (!authUserId) throw new Error('Falha de autenticação.');

      // Busca ou cria perfil em app_users
      const profile = await getOrCreateAppUser(authUserId, email.split('@')[0]);
      onLogin(profile);
    } catch (err: any) {
      setError(err?.message || 'Falha na autenticação.');
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-full bg-gray-950 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/10 via-transparent to-transparent opacity-50 pointer-events-none"></div>
      
      <div className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-3xl p-8 shadow-2xl relative z-10">
        <div className="flex flex-col items-center mb-10">
          <div className="w-32 h-32 mb-6 flex items-center justify-center relative">
            <div className="absolute inset-0 bg-blue-500/10 blur-2xl rounded-full scale-150"></div>
            <ShieldIcon className="w-full h-full relative z-10" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tighter uppercase">SIOP 22º BPM</h1>
          <p className="text-blue-500 text-[10px] font-black uppercase tracking-[0.2em] mt-2">Sistema de Gestão Operacional</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-xs font-bold flex items-center space-x-2 animate-shake">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 mb-2 block">E-mail</label>
            <input 
              type="email" 
              value={email}
              autoComplete="email"
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-3.5 outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-gray-600"
              placeholder="seu@email.com"
              required
            />
          </div>

          <div>
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 mb-2 block">Senha</label>
            <div className="relative">
              <input 
                ref={passwordInputRef}
                type={showPassword ? "text" : "password"}
                value={password}
                autoComplete="current-password"
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 pr-12 py-3.5 outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-gray-600"
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
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-gray-800 text-white font-black py-4 rounded-xl transition-all shadow-lg shadow-blue-900/20 active:scale-95 flex items-center justify-center space-x-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"/></svg>
                <span>Entrar no Sistema</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-10 pt-6 border-t border-gray-800/50 text-center">
          <p className="text-[9px] text-gray-600 font-bold uppercase tracking-widest leading-loose">
            Uso exclusivo da Brigada Militar / 22º BPM<br/>
            Acesso monitorado e sigiloso
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
