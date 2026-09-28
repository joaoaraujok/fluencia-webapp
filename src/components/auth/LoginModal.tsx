import React, { useState } from 'react';
import { X, Lock, Mail, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await login(email, password);
      onClose();
      onSuccess?.();
    } catch (err: any) {
      setError(err.message || 'Falha na autenticação. Verifique os dados.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickFill = (role: 'superadmin' | 'admin' | 'supervisor') => {
    if (role === 'superadmin') {
      setEmail('superadmin@fluencia.edu.br');
      setPassword('Fluencia@2026!SuperAdmin');
    } else if (role === 'admin') {
      setEmail('admin@fluencia.edu.br');
      setPassword('Fluencia@2026Admin');
    } else {
      setEmail('supervisor@fluencia.edu.br');
      setPassword('Fluencia@2026Supervisor');
    }
  };

  return (
    <div className="modal-overlay animate-fadeIn">
      <div className="modal-content max-w-md p-6 sm:p-7">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-display font-bold text-lg text-slate-900 leading-tight">
                Acesso Institucional
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Autenticação de professores e gestores
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            title="Fechar"
            aria-label="Fechar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2" role="alert">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="form-label">E-mail Institucional</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu.email@escola.edu.br"
                className="form-input pl-9"
              />
            </div>
          </div>

          <div>
            <label className="form-label">Senha</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Sua senha de acesso"
                className="form-input pl-9"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary w-full py-2.5 mt-2 text-sm font-semibold"
            aria-label="Entrar no sistema"
          >
            <span>{isLoading ? 'Conectando...' : 'Acessar Sistema'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Atalhos Rápidos para Demonstração */}
        <div className="mt-5 pt-4 border-t border-slate-100">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
            <span>Preenchimento rápido de demonstração:</span>
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => handleQuickFill('superadmin')}
              className="text-xs font-medium px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors"
            >
              Superadmin
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill('admin')}
              className="text-xs font-medium px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors"
            >
              Admin / Secretaria
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill('supervisor')}
              className="text-xs font-medium px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors"
            >
              Supervisor / Avaliador
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
