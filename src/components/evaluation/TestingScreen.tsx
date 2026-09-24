import React, { useEffect } from 'react';
import { Mic, X, SkipForward } from 'lucide-react';
import { QuestionItem } from '../../types/question';

interface TestingScreenProps {
  item: QuestionItem;
  currentIndex: number;
  totalItems: number;
  timeRemainingSec: number;
  totalDurationSec: number;
  isMicListening: boolean;
  liveTranscript?: string;
  isSuccessFeedback?: boolean;
  onCancel: () => void;
  onSkip?: () => void;
}

export const TestingScreen: React.FC<TestingScreenProps> = ({
  item,
  currentIndex,
  totalItems,
  timeRemainingSec,
  totalDurationSec: _totalDurationSec,
  isMicListening,
  liveTranscript,
  isSuccessFeedback,
  onCancel,
  onSkip
}) => {
  const progressPercent = ((currentIndex + 1) / totalItems) * 100;
  const isPhrase = item.type === 'phrase';

  // Formatação de tempo (ex: "2,1 s")
  const formattedTime = `${timeRemainingSec.toFixed(1).replace('.', ',')} s`;

  // Suporte a atalhos de teclado para notebooks e computadores
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      } else if (e.key === 'ArrowRight' && onSkip) {
        onSkip();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onCancel, onSkip]);

  return (
    <div className="testing-screen">
      {/* Topo: Barra de Progresso Discreta & Controles Rápidos para o Educador */}
      <div className="w-full flex items-center justify-between gap-3 max-w-2xl mx-auto pt-1">
        <div className="testing-header-progress shadow-sm flex-1">
          <span className="text-xs font-bold text-slate-500 min-w-[55px]">
            {currentIndex + 1} de {totalItems}
          </span>
          <div className="testing-progress-bar">
            <div
              className="testing-progress-fill"
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
          <span className="text-xs font-black text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-100 shrink-0">
            Nível {item.level}
          </span>
        </div>

        {/* Botões de Ação do Educador */}
        <div className="flex items-center gap-1.5 shrink-0">
          {onSkip && (
            <button
              onClick={onSkip}
              className="px-2.5 py-1.5 rounded-full text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors flex items-center gap-1 text-xs font-bold"
              title="Avançar para o próximo item (ou seta direita)"
            >
              <SkipForward className="w-4 h-4" />
              <span className="hidden sm:inline">Pular</span>
            </button>
          )}

          <button
            onClick={onCancel}
            className="p-1.5 rounded-full text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
            title="Interromper avaliação (ESC)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Centro: Palavra ou Frase em Destaque Absoluto com Tipografia Amigável */}
      <div
        className={`testing-word-container transition-all duration-200 ${
          isSuccessFeedback
            ? 'scale-105 ring-4 ring-emerald-400 bg-emerald-50/80 rounded-3xl shadow-lg shadow-emerald-100'
            : ''
        }`}
      >
        {isPhrase ? (
          <h2 className="testing-display-phrase animate-fadeIn select-text">
            {item.text}
          </h2>
        ) : (
          <h1 className="testing-display-word animate-fadeIn select-text">
            {item.text}
          </h1>
        )}
      </div>

      {/* Rodapé: Microfone Acolhedor com Animação e Contador Visual */}
      <div className="testing-footer-status">
        <div className="mic-pulse-wrapper">
          {/* Ondas pulsantes e expressivas de som */}
          {isMicListening && (
            <>
              <div className="mic-pulse-ring-outer"></div>
              <div className="mic-pulse-ring"></div>
            </>
          )}

          <div
            className={`mic-circle transition-all duration-200 ${
              isSuccessFeedback
                ? 'bg-gradient-to-tr from-emerald-500 to-teal-400 scale-110 shadow-emerald-300'
                : ''
            }`}
          >
            <Mic
              className={`w-8 h-8 ${
                isSuccessFeedback ? 'text-white' : 'text-amber-300'
              } transition-transform ${isMicListening ? 'scale-110' : 'scale-100'}`}
            />
          </div>
        </div>

        <div className="text-center space-y-1">
          <p className="testing-prompt-text justify-center">
            <span>🎙️</span>
            <span>{isPhrase ? 'Fale a frase' : 'Fale a palavra'}</span>
          </p>

          {/* Feedback de voz capturada em tempo real */}
          {isSuccessFeedback ? (
            <div className="text-xs font-black text-emerald-800 bg-emerald-200 border-2 border-emerald-400 px-4 py-1 rounded-full animate-bounce max-w-sm mx-auto shadow-sm flex items-center justify-center gap-1.5">
              <span>✨</span>
              <span>Reconhecido: "{liveTranscript || item.text}"</span>
            </div>
          ) : liveTranscript ? (
            <div className="text-xs font-extrabold text-emerald-800 bg-emerald-100/90 border border-emerald-300 px-3.5 py-1 rounded-full animate-fadeIn max-w-sm mx-auto shadow-sm truncate">
              Ouvido: "{liveTranscript}"
            </div>
          ) : null}

          {/* Contador Visual de Tempo */}
          <div className="pt-1">
            <div className="inline-flex items-center gap-1.5 testing-timer-badge">
              <span>⏱️</span>
              <span>{formattedTime}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
