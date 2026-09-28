import React from 'react';
import { Sparkles, Mic } from 'lucide-react';

interface PreparationScreenProps {
  countdown: number;
  isMicReady?: boolean;
}

export const PreparationScreen: React.FC<PreparationScreenProps> = ({ countdown, isMicReady }) => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center select-none min-h-[70vh] animate-fadeIn">
      <div className="max-w-sm w-full flex flex-col items-center space-y-6">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
          <span>Prepare-se para a leitura</span>
        </div>

        <h1 className="font-display font-black text-3xl sm:text-4xl text-slate-900 tracking-tight">
          Vamos começar!
        </h1>

        {/* Círculo do contador numérico acolhedor */}
        <div className="relative flex items-center justify-center w-32 h-32 rounded-full bg-indigo-600 text-white shadow-lg shadow-indigo-500/20 transition-transform duration-200">
          <span className="font-display font-black text-6xl text-white">
            {countdown}
          </span>
          {/* Anel suave em torno do contador */}
          <div className="absolute inset-0 rounded-full border-2 border-indigo-400/40 animate-ping opacity-25"></div>
        </div>

        <p className="text-sm font-medium text-slate-600 max-w-xs leading-relaxed">
          Olhe para o centro da tela e fale com clareza o que aparecer.
        </p>

        {isMicReady && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium">
            <Mic className="w-3 h-3 text-emerald-600" />
            <span>Microfone ativo e captando</span>
          </div>
        )}
      </div>
    </div>
  );
};
