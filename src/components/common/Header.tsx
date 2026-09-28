import React, { useEffect, useState } from 'react';
import {
  History,
  Settings,
  User,
  Smartphone,
  WifiOff,
  Home,
  LogIn,
  LogOut,
  RefreshCw,
  LayoutDashboard,
  BookOpen
} from 'lucide-react';
import { Student } from '../../types/school';
import { ChildProfile } from '../../types/child';
import { FluenciaLogo } from './FluenciaLogo';
import { useAuth } from '../../contexts/AuthContext';
import { repository } from '../../services/repository';

interface HeaderProps {
  activeStudent: Student | ChildProfile | null;
  currentView?: string;
  onGoHome?: () => void;
  onOpenStudentModal: () => void;
  onOpenHistory: () => void;
  onOpenSettings: () => void;
  onOpenAdmin: () => void;
  onOpenLogin: () => void;
  onOpenManual?: () => void;
  canInstallPWA: boolean;
  onInstallPWA: () => void;
  isOnline: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeStudent,
  currentView = 'home',
  onGoHome,
  onOpenStudentModal,
  onOpenHistory,
  onOpenSettings,
  onOpenAdmin,
  onOpenLogin,
  onOpenManual,
  canInstallPWA,
  onInstallPWA,
  isOnline
}) => {
  const { user, isAuthenticated, logout } = useAuth();
  const [pendingSync, setPendingSync] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  useEffect(() => {
    const checkSync = () => {
      repository.getPendingCount().then((count) => setPendingSync(count));
    };
    checkSync();
    const interval = setInterval(checkSync, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleSyncNow = async () => {
    if (isSyncing || !isOnline) return;
    setIsSyncing(true);
    try {
      const res = await repository.syncPendingEvaluations();
      const nextPending = await repository.getPendingCount();
      setPendingSync(nextPending);
      if (res.syncedCount > 0) {
        alert(`${res.syncedCount} avaliação(ões) sincronizada(s) com sucesso com o servidor central!`);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <header className="header-bar print:hidden">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-3 sm:gap-4">
        {/* Logo & Marca FluencIA */}
        <div
          onClick={onGoHome}
          className="cursor-pointer group focus:outline-hidden"
          title="FluencIA - Início"
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onGoHome?.(); }}
        >
          <FluenciaLogo size="md" variant="full" />
        </div>

        {/* Ações Rápidas & Sessão Institucional */}
        <nav className="flex items-center gap-1.5 sm:gap-2" aria-label="Navegação Principal">
          {/* Botão de Retorno ao Início */}
          {currentView !== 'home' && onGoHome && (
            <button
              onClick={onGoHome}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-xs transition-colors"
              title="Voltar para o início"
              aria-label="Voltar para a tela inicial"
            >
              <Home className="w-3.5 h-3.5 text-indigo-600" />
              <span className="hidden sm:inline">Início</span>
            </button>
          )}

          {/* Botão de Estudante Ativo */}
          <button
            onClick={onOpenStudentModal}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 transition-colors text-xs font-semibold text-slate-800 shadow-xs"
            title="Selecionar ou cadastrar estudante"
            aria-label="Selecionar ou cadastrar estudante"
          >
            <span className="w-5 h-5 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-[10px] shrink-0 border border-indigo-100">
              {activeStudent ? activeStudent.name.charAt(0).toUpperCase() : <User className="w-3 h-3" />}
            </span>
            <span className="max-w-[90px] sm:max-w-[140px] truncate">
              {activeStudent ? activeStudent.name : 'Selecionar Estudante'}
            </span>
          </button>

          {/* Indicador de Sincronização Offline Pendente */}
          {pendingSync > 0 && (
            <button
              onClick={handleSyncNow}
              disabled={isSyncing || !isOnline}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold transition-colors shadow-xs"
              title="Avaliações pendentes de sincronização com o servidor"
              aria-label="Sincronizar avaliações pendentes"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-amber-600 ${isSyncing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{pendingSync} pendente{pendingSync > 1 ? 's' : ''}</span>
            </button>
          )}

          {/* Gestão Institucional / Autenticação */}
          {isAuthenticated ? (
            <div className="flex items-center gap-1">
              <button
                onClick={onOpenAdmin}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-all shadow-xs"
                title="Acessar Painel de Gestão Pedagógica"
                aria-label="Acessar Painel de Gestão"
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Gestão</span>
                <span className="text-[10px] bg-indigo-700/90 text-indigo-100 px-1.5 py-0.5 rounded ml-0.5 font-bold uppercase tracking-wider">
                  {user?.role === 'SUPERADMIN' ? 'SUPER' : user?.role}
                </span>
              </button>

              <button
                onClick={logout}
                className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                title="Encerrar sessão"
                aria-label="Sair da conta"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenLogin}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors shadow-xs"
              title="Entrar com conta institucional"
              aria-label="Entrar na conta institucional"
            >
              <LogIn className="w-3.5 h-3.5 text-indigo-600" />
              <span className="hidden sm:inline">Entrar</span>
            </button>
          )}

          {/* Botão de Instalar PWA */}
          {canInstallPWA && (
            <button
              onClick={onInstallPWA}
              className="hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-medium border border-slate-200 transition-colors"
              title="Instalar aplicativo no dispositivo"
              aria-label="Instalar aplicativo"
            >
              <Smartphone className="w-3.5 h-3.5 text-slate-500" />
              <span>Instalar</span>
            </button>
          )}

          {/* Indicador de Status Offline */}
          {!isOnline && (
            <div
              className="p-1.5 rounded-lg text-amber-700 bg-amber-50 border border-amber-200"
              title="Modo offline: os dados serão gravados localmente"
              aria-label="Modo offline"
            >
              <WifiOff className="w-4 h-4" />
            </div>
          )}

          {/* Manual de Uso / Guia do Educador */}
          {onOpenManual && (
            <button
              onClick={onOpenManual}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors shadow-xs cursor-pointer"
              title="Manual de Uso e Protocolo Pedagógico"
              aria-label="Abrir manual de uso do sistema"
            >
              <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
              <span className="hidden sm:inline">Manual</span>
            </button>
          )}

          {/* Histórico */}
          <button
            onClick={onOpenHistory}
            className="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            title="Histórico de avaliações"
            aria-label="Histórico de avaliações"
          >
            <History className="w-4 h-4" />
          </button>

          {/* Configurações */}
          <button
            onClick={onOpenSettings}
            className="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            title="Configurações do sistema"
            aria-label="Configurações do sistema"
          >
            <Settings className="w-4 h-4" />
          </button>
        </nav>
      </div>
    </header>
  );
};
