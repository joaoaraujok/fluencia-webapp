import React from 'react';
import { Sparkles } from 'lucide-react';

interface PreparationScreenProps {
  countdown: number;
  isMicReady?: boolean;
}

export const PreparationScreen: React.FC<PreparationScreenProps> = ({ countdown, isMicReady }) => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center select-none min-h-[75vh]">
      <div className="max-w-md w-full flex flex-col items-center animate-pulse">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-100 border border-indigo-200 text-indigo-700 text-sm font-bold mb-6">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span>Prepare-se!</span>
        </div>

        <h2 className="font-display font-extrabold text-4xl sm:text-5xl text-slate-800 mb-8 tracking-wide">
          Vamos começar!
        </h2>

        {/* Círculo com o número da contagem 3, 2, 1 */}
        <div className="relative flex items-center justify-center w-36 h-36 rounded-full bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white shadow-2xl shadow-indigo-300 transform transition-transform duration-300 scale-110">
          <span className="font-display font-black text-7xl text-amber-300 drop-shadow-md">
            {countdown}
          </span>
          {/* Anel de pulso em torno do número */}
          <div className="absolute inset-0 rounded-full border-4 border-indigo-300 animate-ping opacity-40"></div>
        </div>

        <p className="mt-8 text-base font-semibold text-slate-500">
          Olhe para a tela e fale a palavra ou frase que vai aparecer.
        </p>

        {isMicReady && (
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold mt-4 animate-fadeIn">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Microfone conectado e pronto 🎙️</span>
          </div>
        )}
      </div>
    </div>
  );
};
