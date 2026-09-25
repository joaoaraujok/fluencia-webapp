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
  LayoutDashboard
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
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-2 sm:gap-4">
        {/* Logo & Marca FluencIA */}
        <div onClick={onGoHome} className="cursor-pointer group" title="FluencIA - Início">
          <FluenciaLogo size="md" variant="full" />
        </div>

        {/* Ações Rápidas & Sessão Institucional */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Botão de Home rápido se estiver navegando */}
          {currentView !== 'home' && onGoHome && (
            <button
              onClick={onGoHome}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-indigo-200 bg-indigo-50/70 hover:bg-indigo-100 text-xs font-bold text-indigo-700 transition-colors"
              title="Voltar para a tela inicial"
            >
              <Home className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Início</span>
            </button>
          )}

          {/* Botão de Estudante Ativo */}
          <button
            onClick={onOpenStudentModal}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 transition-colors text-xs font-bold text-slate-700 shadow-2xs"
            title="Selecionar ou cadastrar estudante da turma"
          >
            <User className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
            <span className="max-w-[85px] sm:max-w-[130px] truncate">
              {activeStudent ? activeStudent.name : 'Estudante'}
            </span>
          </button>

          {/* Sincronização Offline Pendente */}
          {pendingSync > 0 && (
            <button
              onClick={handleSyncNow}
              disabled={isSyncing || !isOnline}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold transition-colors shadow-2xs"
              title="Avaliações pendentes de envio para o servidor"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-amber-600 ${isSyncing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{pendingSync} pendente{pendingSync > 1 ? 's' : ''}</span>
            </button>
          )}

          {/* Painel Institucional para Usuários Logados */}
          {isAuthenticated ? (
            <div className="flex items-center gap-1 sm:gap-1.5">
              <button
                onClick={onOpenAdmin}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-2xs"
                title="Acessar Painel de Gestão"
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Gestão</span>
                <span className="text-[10px] bg-indigo-800/80 px-1.5 py-0.2 rounded-md ml-0.5">
                  {user?.role === 'SUPERADMIN' ? 'SUPER' : user?.role}
                </span>
              </button>

              <button
                onClick={logout}
                className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                title="Sair da conta institucional"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenLogin}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-indigo-200 bg-white hover:bg-indigo-50 text-indigo-700 text-xs font-bold transition-colors shadow-2xs"
              title="Entrar com conta institucional"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Entrar</span>
            </button>
          )}

          {/* Botão de Instalar App no Celular */}
          {canInstallPWA && (
            <button
              onClick={onInstallPWA}
              className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold border border-indigo-200/70 transition-colors"
              title="Instalar aplicativo no celular"
            >
              <Smartphone className="w-3.5 h-3.5 text-indigo-600" />
              <span>Instalar</span>
            </button>
          )}

          {/* Aviso se estiver offline */}
          {!isOnline && (
            <div className="p-2 rounded-xl text-amber-500 bg-amber-50 border border-amber-200/80" title="Modo offline ativado">
              <WifiOff className="w-4 h-4" />
            </div>
          )}

          {/* Histórico */}
          <button
            onClick={onOpenHistory}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
            title="Histórico de Avaliações"
          >
            <History className="w-4.5 h-4.5" />
          </button>

          {/* Configurações */}
          <button
            onClick={onOpenSettings}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
            title="Configurações"
          >
            <Settings className="w-4.5 h-4.5" />
          </button>
        </div>
      </div>
    </header>
  );
};
