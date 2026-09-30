import React, { useEffect } from 'react';
import { Mic, X, SkipForward, Clock, Check, XCircle, Sparkles } from 'lucide-react';
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
  isAnalyzingAi?: boolean;
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
  isAnalyzingAi = false,
  onCancel,
  onSkip,
  onMarkResult
}) => {
  const isLetter = item.type === 'letter';
  const isWord = item.type === 'word' || (!item.type && item.level <= 3);
  const isPseudoword = item.type === 'pseudoword';
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
      if (isAnalyzingAi) return;

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
  }, [onCancel, onSkip, onMarkResult, isAnalyzingAi]);

  const getStageBadge = () => {
    if (isLetter || currentStage === 'letters') {
      return { label: 'Etapa 1: Letras', limit: '10 itens' };
    }
    if (isPseudoword || currentStage === 'pseudowords') {
      return { label: 'Etapa 3: Pseudopalavras', limit: 'Decodificação' };
    }
    if (isWord || currentStage === 'words') {
      return { label: 'Etapa 2: Palavras Reais', limit: '10s' };
    }
    if (isText || currentStage === 'text' || currentStage === 'comprehension') {
      return { label: 'Etapa 4: Leitura de Texto', limit: '60s' };
    }
    return { label: 'Etapa 4: Leitura de Texto', limit: '60s' };
  };

  const stage = getStageBadge();

  return (
    <div className="testing-screen min-h-[88vh] flex flex-col justify-between py-2 animate-fadeIn">
      {/* Topo Limpo: Progresso do Teste e Controles do Supervisor */}
      <div className="w-full max-w-2xl mx-auto space-y-2 px-2">
        {/* Barra Superior Discreta de Tempo Global */}
        <div className="flex items-center justify-between text-xs text-slate-500 bg-white px-3.5 py-1.5 rounded-full border border-slate-200/90 shadow-xs">
          <div className="flex items-center gap-1.5 font-medium">
            <Clock className={`w-3.5 h-3.5 ${isAnalyzingAi ? 'text-amber-500 animate-pulse' : 'text-slate-400'}`} />
            <span>Tempo da Avaliação:</span>
            <span className="font-mono font-semibold text-slate-800">
              {formatGlobalTime(globalElapsedSeconds)}
            </span>
            {isAnalyzingAi && (
              <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                Pausado
              </span>
            )}
            <span className="text-slate-400 font-normal">/ 04:00</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-medium text-slate-500">
              {stage.label} ({stage.limit})
            </span>
            <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  globalElapsedSeconds > 210 ? 'bg-rose-500' : 'bg-indigo-600'
                }`}
                style={{ width: `${globalProgressPercent}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Barra de Progresso da Etapa Atual */}
        <div className="flex items-center justify-between gap-3">
          <div className="testing-header-progress flex-1">
            <span className="text-xs font-semibold text-slate-500 min-w-[50px]">
              {currentIndex + 1} de {totalItems}
            </span>
            <div className="testing-progress-bar">
              <div
                className="testing-progress-fill"
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
          </div>

          {/* Controles Discretos para o Educador */}
          <div className="flex items-center gap-1.5 shrink-0" aria-label="Ações do Avaliador">
            {onMarkResult && (
              <>
                <button
                  type="button"
                  onClick={() => onMarkResult('CORRETO')}
                  className="px-2.5 py-1 rounded-md text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                  title="Marcar como Correto (Atalho: 1 ou Enter)"
                >
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="hidden sm:inline">Acertou</span>
                </button>

                <button
                  type="button"
                  onClick={() => onMarkResult('INCORRETO')}
                  className="px-2.5 py-1 rounded-md text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
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
                disabled={isAnalyzingAi}
                className="px-2.5 py-1 rounded-md text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
                title="Avançar item (Atalho: Espaço ou Seta Direita)"
              >
                <SkipForward className="w-3.5 h-3.5 text-slate-500" />
                <span className="hidden sm:inline">Avançar</span>
              </button>
            )}

            <button
              type="button"
              onClick={onCancel}
              className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
              title="Encerrar avaliação (ESC)"
              aria-label="Encerrar avaliação"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Centro: Elemento em Leitura (Foco Total e Limpo para a Criança) */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div
          className={`testing-word-container w-full max-w-2xl transition-all duration-200 ${
            isSuccessFeedback
              ? 'scale-105 ring-2 ring-emerald-500 bg-emerald-50/50 rounded-2xl'
              : ''
          }`}
        >
          {isLetter && (
            <div className="py-6 text-center select-text">
              <span className="font-display font-black text-8xl sm:text-9xl text-slate-900 tracking-wider">
                {item.text.toLocaleUpperCase('pt-BR')}
              </span>
            </div>
          )}

          {(isWord || isPseudoword) && (
            <div className="py-6 text-center select-text">
              <h1 className="testing-display-word text-5xl sm:text-7xl font-display font-black text-slate-900">
                {item.text.toLocaleUpperCase('pt-BR')}
              </h1>
            </div>
          )}

          {isText && (
            <div className="p-6 sm:p-8 bg-white rounded-2xl border border-slate-200 shadow-xs text-left max-w-xl mx-auto select-text">
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                {item.category ? `HISTÓRIA: ${item.category.toLocaleUpperCase('pt-BR')}` : 'LEITURA DE TEXTO'}
              </div>
              <p className="text-lg sm:text-xl leading-relaxed text-slate-800 font-medium font-child uppercase">
                {item.text.toLocaleUpperCase('pt-BR')}
              </p>
            </div>
          )}

          {isPhrase && (
            <div className="py-4 text-center max-w-xl mx-auto select-text">
              <h2 className="testing-display-phrase text-2xl sm:text-4xl font-display font-bold text-slate-900 leading-snug uppercase">
                {item.text.toLocaleUpperCase('pt-BR')}
              </h2>
            </div>
          )}
        </div>
      </div>

      {/* Rodapé: Microfone Acolhedor e Cronômetro Discreto */}
      <div className="testing-footer-status pb-2">
        <div className="mic-pulse-wrapper" aria-label="Status do microfone">
          {isMicListening && (
            <>
              <div className="mic-pulse-ring-outer"></div>
              <div className="mic-pulse-ring"></div>
            </>
          )}

          <div
            className={`mic-circle ${
              isAnalyzingAi
                ? 'bg-indigo-600 scale-105'
                : isSuccessFeedback
                ? 'bg-emerald-600 scale-105'
                : ''
            }`}
          >
            {isAnalyzingAi ? (
              <Sparkles className="w-6 h-6 text-white animate-spin" />
            ) : (
              <Mic
                className={`w-6 h-6 text-white transition-transform ${isMicListening ? 'scale-105' : 'scale-100'}`}
              />
            )}
          </div>
        </div>

        <div className="text-center space-y-1.5">
          <p className="text-xs sm:text-sm font-semibold text-slate-600">
            {isLetter
              ? 'Fale o som ou o nome da letra'
              : isPseudoword
              ? 'Leia a palavra inventada exatamente como se escreve'
              : isWord
              ? 'Leia a palavra com calma'
              : isText
              ? 'Leia a história no seu ritmo'
              : 'Leia a frase em voz alta'}
          </p>

          {/* Feedback Suave em Tempo Real */}
          {isAnalyzingAi ? (
            <div className="text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-3 py-1 rounded-full inline-flex items-center gap-1.5 animate-pulse">
              <Sparkles className="w-3 h-3 text-indigo-600 animate-spin" />
              <span>Analisando resposta...</span>
            </div>
          ) : isSuccessFeedback ? (
            <div className="text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full inline-flex items-center gap-1.5">
              <Check className="w-3 h-3 text-emerald-600" />
              <span>Reconhecido: "{liveTranscript || item.text}"</span>
            </div>
          ) : liveTranscript ? (
            <div className="text-xs font-medium text-slate-600 bg-slate-100 border border-slate-200 px-3 py-0.5 rounded-full inline-flex items-center gap-1.5 max-w-sm truncate">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span className="truncate">Voz captada: "{liveTranscript}"</span>
            </div>
          ) : null}

          {/* Badge do Cronômetro do Item (10s) */}
          <div className="pt-1">
            <div className="testing-timer-badge">
              <span>{formattedItemTime}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
