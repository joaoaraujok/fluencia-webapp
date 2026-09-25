import React, { useEffect } from 'react';
import { Mic, X, SkipForward, Clock, Check, XCircle } from 'lucide-react';
import { QuestionItem } from '../../types/question';
import { AdaptiveEvaluationStage } from '../../types/evaluation';

interface TestingScreenProps {
  item: QuestionItem;
  currentIndex: number;
  totalItems: number;
  currentStage?: AdaptiveEvaluationStage;
  globalElapsedSeconds?: number;
  globalTimeLimitSec?: number;
  timeRemainingSec: number;
  totalDurationSec: number;
  isMicListening: boolean;
  liveTranscript?: string;
  isSuccessFeedback?: boolean;
  onCancel: () => void;
  onSkip?: () => void;
  onMarkResult?: (status: 'CORRETO' | 'INCORRETO') => void;
}

export const TestingScreen: React.FC<TestingScreenProps> = ({
  item,
  currentIndex,
  totalItems,
  currentStage,
  globalElapsedSeconds = 0,
  globalTimeLimitSec = 240,
  timeRemainingSec,
  totalDurationSec: _totalDurationSec,
  isMicListening,
  liveTranscript,
  isSuccessFeedback,
  onCancel,
  onSkip,
  onMarkResult
}) => {
  const isLetter = item.type === 'letter';
  const isWord = item.type === 'word' || (!item.type && item.level <= 3);
  const isText = item.type === 'text';
  const isPhrase = item.type === 'phrase' || item.level === 4;

  const progressPercent = totalItems > 0 ? ((currentIndex + 1) / totalItems) * 100 : 0;
  const globalProgressPercent = Math.min(100, (globalElapsedSeconds / globalTimeLimitSec) * 100);

  // Formatação do tempo global (ex: "01:45 / 04:00")
  const formatGlobalTime = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const remaining = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${remaining.toString().padStart(2, '0')}`;
  };

  // Formatação do tempo do item (ex: "4,5 s")
  const formattedItemTime = `${timeRemainingSec.toFixed(1).replace('.', ',')} s`;

  // Suporte a atalhos de teclado (1/Enter/C para acerto, 2/X para erro, Espaço/Seta para pular, ESC para cancelar)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      } else if ((e.key === '1' || e.key === 'Enter' || e.key === 'c' || e.key === 'C') && onMarkResult) {
        e.preventDefault();
        onMarkResult('CORRETO');
      } else if ((e.key === '2' || e.key === 'x' || e.key === 'X') && onMarkResult) {
        e.preventDefault();
        onMarkResult('INCORRETO');
      } else if ((e.key === 'ArrowRight' || e.code === 'Space') && onSkip) {
        e.preventDefault();
        onSkip();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onCancel, onSkip, onMarkResult]);

  const getStageBadge = () => {
    if (isLetter || currentStage === 'letters') {
      return {
        label: 'Etapa 1: Reconhecimento de Letras',
        limit: 'Máx. 10s',
        color: 'text-amber-800 bg-amber-50 border-amber-200'
      };
    }
    if (isWord || currentStage === 'words') {
      return {
        label: 'Etapa 2: Palavras Isoladas',
        limit: 'Máx. 10s',
        color: 'text-indigo-800 bg-indigo-50 border-indigo-200'
      };
    }
    if (isText || currentStage === 'text') {
      return {
        label: 'Etapa 3: Leitura de Texto em Contexto',
        limit: 'Até 60s',
        color: 'text-emerald-800 bg-emerald-50 border-emerald-200'
      };
    }
    return {
      label: 'Etapa 4: Prosódia em Frases (Leitor Fluente)',
      limit: 'Máx. 15s',
      color: 'text-violet-800 bg-violet-50 border-violet-200'
    };
  };

  const stage = getStageBadge();

  return (
    <div className="testing-screen min-h-[90vh] flex flex-col justify-between py-2">
      {/* Topo: Barra do Limite Global de 4 minutos & Progresso da Etapa */}
      <div className="w-full max-w-2xl mx-auto space-y-2 pt-1 px-3">
        {/* Barra Superior de Tempo Global (4 minutos = 240s) */}
        <div className="flex items-center justify-between gap-3 text-xs bg-slate-900/5 px-3 py-1.5 rounded-full border border-slate-200/80">
          <div className="flex items-center gap-1.5 font-bold text-slate-700">
            <Clock className="w-3.5 h-3.5 text-indigo-600 animate-spin-slow" />
            <span>Tempo Global:</span>
            <span className="font-mono text-indigo-700 font-black">
              {formatGlobalTime(globalElapsedSeconds)}
            </span>
            <span className="text-slate-400 font-normal">/ 04:00</span>
          </div>

          <div className="flex-1 max-w-[120px] h-2 bg-slate-200 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                globalElapsedSeconds > 210 ? 'bg-rose-500' : 'bg-indigo-600'
              }`}
              style={{ width: `${globalProgressPercent}%` }}
            ></div>
          </div>

          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            {stage.limit}
          </span>
        </div>

        {/* Barra de Progresso do Item da Etapa */}
        <div className="flex items-center justify-between gap-3">
          <div className="testing-header-progress shadow-xs flex-1">
            <span className="text-xs font-bold text-slate-500 min-w-[50px]">
              {currentIndex + 1} de {totalItems}
            </span>
            <div className="testing-progress-bar">
              <div
                className="testing-progress-fill"
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
            <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border shrink-0 ${stage.color}`}>
              {stage.label}
            </span>
          </div>

          {/* Ações do Supervisor / Educador */}
          <div className="flex items-center gap-1.5 shrink-0">
            {onMarkResult && (
              <>
                <button
                  type="button"
                  onClick={() => onMarkResult('CORRETO')}
                  className="px-2.5 py-1.5 rounded-full text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-all flex items-center gap-1 text-xs font-bold shadow-2xs cursor-pointer"
                  title="Marcar como Acerto (Atalho: 1 ou Enter)"
                >
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="hidden sm:inline">Acertou</span>
                </button>

                <button
                  type="button"
                  onClick={() => onMarkResult('INCORRETO')}
                  className="px-2.5 py-1.5 rounded-full text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-all flex items-center gap-1 text-xs font-bold shadow-2xs cursor-pointer"
                  title="Marcar como Incorreto (Atalho: 2 ou X)"
                >
                  <XCircle className="w-3.5 h-3.5 text-rose-600" />
                  <span className="hidden sm:inline">Errou</span>
                </button>
              </>
            )}

            {onSkip && (
              <button
                type="button"
                onClick={onSkip}
                className="px-2.5 py-1.5 rounded-full text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 border border-slate-200 bg-white transition-all flex items-center gap-1 text-xs font-bold shadow-2xs cursor-pointer"
                title="Avançar para o próximo item (Espaço ou Seta Direita)"
              >
                <SkipForward className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Pular</span>
              </button>
            )}

            <button
              type="button"
              onClick={onCancel}
              className="p-1.5 rounded-full text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
              title="Interromper avaliação (ESC)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Centro: Letra, Palavra, Texto Corrido ou Frase com Tipografia Otimizada */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div
          className={`testing-word-container w-full max-w-2xl transition-all duration-200 ${
            isSuccessFeedback
              ? 'scale-105 ring-4 ring-emerald-400 bg-emerald-50/90 rounded-3xl shadow-lg shadow-emerald-100'
              : ''
          }`}
        >
          {isLetter && (
            <div className="py-4 text-center">
              <span className="font-display font-black text-8xl sm:text-9xl text-slate-900 tracking-wider animate-fadeIn select-text drop-shadow-xs">
                {item.text}
              </span>
            </div>
          )}

          {isWord && (
            <div className="py-4 text-center">
              <h1 className="testing-display-word animate-fadeIn select-text text-5xl sm:text-7xl font-display font-black text-slate-900">
                {item.text}
              </h1>
            </div>
          )}

          {isText && (
            <div className="p-6 sm:p-8 bg-white/95 rounded-3xl border border-slate-200 shadow-sm text-left max-w-xl mx-auto">
              <div className="text-xs font-bold uppercase tracking-wider text-emerald-700 mb-3 flex items-center gap-1.5">
                <span>📖</span>
                <span>{item.category ? `História: ${item.category}` : 'Leitura de Texto'}</span>
              </div>
              <p className="font-display text-xl sm:text-2xl leading-relaxed text-slate-800 font-medium select-text">
                {item.text}
              </p>
            </div>
          )}

          {isPhrase && (
            <div className="py-4 text-center max-w-xl mx-auto">
              <h2 className="testing-display-phrase animate-fadeIn select-text text-2xl sm:text-4xl font-display font-bold text-slate-900 leading-snug">
                {item.text}
              </h2>
            </div>
          )}
        </div>
      </div>

      {/* Rodapé: Microfone Acolhedor com Ondas Sonoras e Cronômetro do Item */}
      <div className="testing-footer-status pb-4">
        <div className="mic-pulse-wrapper">
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

        <div className="text-center space-y-1.5">
          <p className="testing-prompt-text justify-center font-bold text-slate-700">
            <span>🎙️</span>
            <span>
              {isLetter
                ? 'Fale o nome ou som da letra'
                : isWord
                ? 'Fale a palavra com calma'
                : isText
                ? 'Leia a historinha no seu ritmo'
                : 'Fale a frase com entonação'}
            </span>
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

          {/* Contador Visual do Item (10s ou 15s) */}
          <div className="pt-1">
            <div className="inline-flex items-center gap-1.5 testing-timer-badge">
              <span>⏱️</span>
              <span className="font-mono">{formattedItemTime}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
