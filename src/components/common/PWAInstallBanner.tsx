import React from 'react';
import { Download, Smartphone, X } from 'lucide-react';

interface PWAInstallBannerProps {
  canInstall: boolean;
  onInstall: () => void;
  onDismiss: () => void;
}

export const PWAInstallBanner: React.FC<PWAInstallBannerProps> = ({
  canInstall,
  onInstall,
  onDismiss
}) => {
  if (!canInstall) return null;

  return (
    <div className="w-full bg-indigo-50/90 border-b border-indigo-100 text-slate-800 px-4 py-2.5 transition-colors" role="region" aria-label="Aviso de instalação">
      <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-white border border-indigo-200 text-indigo-600 flex items-center justify-center shrink-0 shadow-xs">
            <Smartphone className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs sm:text-sm font-semibold text-slate-900">
              Instale o FluencIA no seu celular ou tablet
            </p>
            <p className="text-xs text-slate-500 hidden sm:block">
              Uso em tela cheia com gravação de áudio contínua e funcionamento sem internet.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onInstall}
            className="btn-primary text-xs py-1.5 px-3 font-semibold"
            aria-label="Instalar aplicativo"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Instalar</span>
          </button>
          <button
            onClick={onDismiss}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md hover:bg-indigo-100/50 transition-colors"
            title="Dispensar aviso"
            aria-label="Dispensar aviso"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
