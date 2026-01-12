
import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { logAction } from '../services/logService';
import { Loader2, Mail, Lock, AlertCircle, WifiOff } from 'lucide-react';
import { Logo } from './Logo';

interface LoginProps {
  serverOffline?: boolean;
}

export const Login: React.FC<LoginProps> = ({ serverOffline = false }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'error' | 'success' } | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    if (!supabase) {
      setMessage({ text: 'ERRO: Servidor Indisponível. O projeto pode estar pausado ou as chaves de acesso expiraram.', type: 'error' });
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.status === 429) {
          throw new Error("Muitas tentativas. Aguarde 30 segundos.");
        }
        if (error.message.includes("fetch")) {
          throw new Error("Erro de conexão com o banco de dados. Verifique sua internet ou status do servidor.");
        }
        throw error;
      }

      if (data.user) {
        await logAction('LOGIN', 'SYSTEM', 'N/A', `Usuário ${email} realizou login.`);
      }

    } catch (error: any) {
      setMessage({ text: error.message || 'Ocorreu um erro na autenticação.', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200">
        <div className="bg-slate-900 p-8 flex flex-col items-center text-center">
          <div className="mb-4">
            <Logo size={80} />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">TriDoc</h1>
          <p className="text-slate-400 text-sm mt-1">Gestão Municipal Inteligente</p>
        </div>

        <div className="p-8">
          <h2 className="text-xl font-bold text-slate-800 mb-6 text-center">
            Acesse sua Conta
          </h2>

          {serverOffline && (
            <div className="p-4 bg-red-600 text-white rounded-lg text-xs mb-6 flex items-center gap-3 animate-pulse">
              <WifiOff size={24} className="shrink-0" />
              <div>
                <p className="font-bold">SISTEMA OFFLINE</p>
                <p>Não foi possível conectar ao servidor de dados. Entre em contato com o suporte técnico.</p>
              </div>
            </div>
          )}

          {message && (
            <div className={`p-4 rounded-lg text-sm mb-6 flex items-start gap-2 ${message.type === 'error' ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-green-50 text-green-700'}`}>
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <span>{message.text}</span>
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email Corporativo</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="email"
                  required
                  disabled={isLoading || serverOffline}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all disabled:bg-slate-50 disabled:text-slate-400"
                  placeholder="seu@email.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Senha de Acesso</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="password"
                  required
                  disabled={isLoading || serverOffline}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all disabled:bg-slate-50 disabled:text-slate-400"
                  placeholder="••••••••"
                  minLength={6}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || serverOffline}
              className={`w-full font-bold py-3 rounded-lg transition-all flex items-center justify-center gap-2 shadow-md mt-2 ${serverOffline
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-100'
                }`}
            >
              {isLoading ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                'Entrar no Sistema'
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-100 text-center">
            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Uso Exclusivo Interno</p>
          </div>
        </div>
      </div>
    </div>
  );
};
