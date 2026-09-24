import React from 'react';
import { History, Settings, User, Smartphone, WifiOff, Home } from 'lucide-react';
import { ChildProfile } from '../../types/child';
import { FluenciaLogo } from './FluenciaLogo';

interface HeaderProps {
  activeChild: ChildProfile | null;
  currentView?: string;
  onGoHome?: () => void;
  onOpenChildModal: () => void;
  onOpenHistory: () => void;
  onOpenSettings: () => void;
  canInstallPWA: boolean;
  onInstallPWA: () => void;
  isOnline: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeChild,
  currentView = 'home',
  onGoHome,
  onOpenChildModal,
  onOpenHistory,
  onOpenSettings,
  canInstallPWA,
  onInstallPWA,
  isOnline
}) => {
  return (
    <header className="header-bar print:hidden">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-2 sm:gap-4">
        {/* Logo & Nome do App FluencIA */}
        <div 
          onClick={onGoHome}
          className="cursor-pointer group"
          title="FluencIA - Início"
        >
          <FluenciaLogo size="md" variant="full" />
        </div>

        {/* Ações Rápidas */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Botão de Home rápido se estiver navegando */}
          {currentView !== 'home' && onGoHome && (
            <button
              onClick={onGoHome}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-indigo-200 bg-indigo-50/70 hover:bg-indigo-100 text-xs font-bold text-indigo-700 transition-colors cursor-pointer"
              title="Voltar para a tela inicial"
            >
              <Home className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Início</span>
            </button>
          )}

          {/* Botão de Estudante Ativo */}
          <button
            onClick={onOpenChildModal}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 transition-colors text-xs font-bold text-slate-700 shadow-2xs cursor-pointer"
            title="Selecionar ou cadastrar estudante"
          >
            <User className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
            <span className="max-w-[85px] sm:max-w-[130px] truncate">
              {activeChild ? activeChild.name : 'Aluno'}
            </span>
          </button>

          {/* Botão de Instalar App no Celular */}
          {canInstallPWA && (
            <button
              onClick={onInstallPWA}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold border border-indigo-200/70 transition-colors cursor-pointer"
              title="Instalar aplicativo no celular"
            >
              <Smartphone className="w-3.5 h-3.5 text-indigo-600" />
              <span className="hidden sm:inline">Instalar App</span>
            </button>
          )}

          {/* Aviso se estiver offline */}
          {!isOnline && (
            <div
              className="p-2 rounded-xl text-amber-500 bg-amber-50 border border-amber-200/80"
              title="Modo offline ativado"
            >
              <WifiOff className="w-4 h-4" />
            </div>
          )}

          {/* Histórico */}
          <button
            onClick={onOpenHistory}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Histórico de Avaliações"
          >
            <History className="w-4.5 h-4.5" />
          </button>

          {/* Configurações */}
          <button
            onClick={onOpenSettings}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Configurações"
          >
            <Settings className="w-4.5 h-4.5" />
          </button>
        </div>
      </div>
    </header>
  );
};
