import React from 'react';
import { Download, Sparkles, X } from 'lucide-react';

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
    <div className="w-full bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-600 text-white px-4 py-3 shadow-md">
      <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
            <Sparkles className="w-5 h-5 text-amber-300" />
          </div>
          <div>
            <p className="text-sm font-bold tracking-wide">
              Instale o Fluenc<span className="text-amber-300">IA</span> no seu dispositivo!
            </p>
            <p className="text-xs text-indigo-100 hidden sm:block">
              Acesso rápido em tela cheia com Inteligência Artificial e modo offline, ideal para tablets e celulares.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onInstall}
            className="flex items-center gap-1.5 bg-amber-400 text-indigo-950 px-3.5 py-1.5 rounded-xl font-bold text-xs hover:bg-amber-300 transition-colors shadow-sm"
          >
            <Download className="w-4 h-4" />
            <span>Instalar PWA</span>
          </button>
          <button
            onClick={onDismiss}
            className="p-1.5 text-white/80 hover:text-white rounded-lg hover:bg-white/10"
            title="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
