import React, { useState } from 'react';
import { HelpCircle, CheckCircle2, XCircle, AlertCircle, ArrowRight, X } from 'lucide-react';
import { ComprehensionQuestionItem, ComprehensionAnswerResult } from '../../types/evaluation';

interface ComprehensionScreenProps {
  questions: ComprehensionQuestionItem[];
  textTitle?: string;
  onFinishComprehension?: (answers: ComprehensionAnswerResult[]) => void;
  onSubmitAnswers?: (answers: ComprehensionAnswerResult[]) => void;
  onCancel: () => void;
}

export const ComprehensionScreen: React.FC<ComprehensionScreenProps> = ({
  questions,
  textTitle,
  onFinishComprehension,
  onSubmitAnswers,
  onCancel
}) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [answers, setAnswers] = useState<Record<string, {
    response: string;
    status: 'CORRETO' | 'INCORRETO' | 'INCONCLUSIVO';
  }>>({});

  const currentQ = questions[currentQuestionIndex];
  const totalQuestions = questions.length;

  const currentAnswer = currentQ ? answers[currentQ.id] : undefined;

  const handleSetResponse = (text: string) => {
    if (!currentQ) return;
    setAnswers(prev => ({
      ...prev,
      [currentQ.id]: {
        response: text,
        status: prev[currentQ.id]?.status || 'CORRETO'
      }
    }));
  };

  const handleSetStatus = (status: 'CORRETO' | 'INCORRETO' | 'INCONCLUSIVO') => {
    if (!currentQ) return;
    setAnswers(prev => ({
      ...prev,
      [currentQ.id]: {
        response: prev[currentQ.id]?.response || '',
        status
      }
    }));
  };

  const handleNext = () => {
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      // Conclui e compila resultados
      const compiled: ComprehensionAnswerResult[] = questions.map(q => {
        const recorded = answers[q.id] || { response: '', status: 'INCONCLUSIVO' };
        return {
          questionId: q.id,
          question: q.question,
          expectedAnswer: q.expectedAnswer,
          questionType: q.questionType,
          childResponseText: recorded.response.trim(),
          score: recorded.status === 'CORRETO' ? 1 : 0,
          status: recorded.status
        };
      });
      const callback = onSubmitAnswers || onFinishComprehension;
      callback?.(compiled);
    }
  };

  const isCurrentRated = !!currentAnswer?.status;

  return (
    <div className="comprehension-screen max-w-3xl mx-auto py-4 px-4 min-h-[85vh] flex flex-col justify-between animate-fadeIn">
      {/* Topo: Identificação e Progresso */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-black bg-indigo-100 text-indigo-800 uppercase tracking-wide">
              Etapa: Compreensão Textual
            </span>
            {textTitle && (
              <span className="text-xs text-slate-500 font-medium hidden sm:inline">
                Texto: "{textTitle}"
              </span>
            )}
            <span className="text-xs text-slate-500 font-semibold">
              Pergunta {currentQuestionIndex + 1} de {totalQuestions}
            </span>
          </div>

          <button
            type="button"
            onClick={onCancel}
            className="p-1 rounded-md text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
            title="Cancelar avaliação"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Barra de progresso das perguntas */}
        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
          <div
            className="bg-indigo-600 h-full transition-all duration-300"
            style={{ width: `${((currentQuestionIndex + 1) / totalQuestions) * 100}%` }}
          />
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900 flex items-start gap-2">
          <HelpCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Orientações ao Supervisor:</p>
            <p>Leia cada pergunta oralmente para a criança. Não revele a resposta esperada. Registre abaixo a resposta fornecida e classifique.</p>
          </div>
        </div>
      </div>

      {/* Conteúdo Central da Pergunta */}
      {currentQ && (
        <div className="my-6 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <span className={`text-[11px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                currentQ.questionType === 'literal'
                  ? 'bg-sky-100 text-sky-800'
                  : 'bg-violet-100 text-violet-800'
              }`}>
                Compreensão {currentQ.questionType === 'literal' ? 'Literal' : 'Inferencial'}
              </span>
            </div>

            <h3 className="text-xl sm:text-2xl font-display font-bold text-slate-900 leading-snug">
              {currentQ.question}
            </h3>

            {/* Gabarito oculto para o supervisor */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 space-y-1">
              <span className="font-bold text-slate-600 block">Resposta esperada (não revelar à criança):</span>
              <p className="font-medium italic">{currentQ.expectedAnswer}</p>
            </div>

            {/* Campo para registro da resposta da criança */}
            <div className="space-y-1.5 pt-2">
              <label htmlFor="child-response-input" className="text-xs font-bold text-slate-700 block">
                Resposta emitida pela criança (anotação/transcrição):
              </label>
              <textarea
                id="child-response-input"
                rows={2}
                value={currentAnswer?.response || ''}
                onChange={(e) => handleSetResponse(e.target.value)}
                placeholder="Digite aqui o que a criança respondeu oralmente..."
                className="w-full p-3 rounded-xl border border-slate-300 bg-white text-sm text-slate-800 focus:outline-hidden focus:border-indigo-500"
              />
            </div>

            {/* Classificação do Supervisor */}
            <div className="space-y-2 pt-2">
              <span className="text-xs font-bold text-slate-700 block">
                Classificação da resposta:
              </span>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleSetStatus('CORRETO')}
                  className={`p-3 rounded-xl border text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    currentAnswer?.status === 'CORRETO'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                      : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Correta (1 pt)</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSetStatus('INCORRETO')}
                  className={`p-3 rounded-xl border text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    currentAnswer?.status === 'INCORRETO'
                      ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                      : 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100'
                  }`}
                >
                  <XCircle className="w-4 h-4" />
                  <span>Incorreta (0 pt)</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSetStatus('INCONCLUSIVO')}
                  className={`p-3 rounded-xl border text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    currentAnswer?.status === 'INCONCLUSIVO'
                      ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                      : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                  }`}
                >
                  <AlertCircle className="w-4 h-4" />
                  <span>Inconclusiva (0 pt)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rodapé: Ação de Avançar */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-100">
        <button
          type="button"
          disabled={currentQuestionIndex === 0}
          onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
          className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 disabled:opacity-30 cursor-pointer"
        >
          Pergunta Anterior
        </button>

        <button
          type="button"
          disabled={!isCurrentRated}
          onClick={handleNext}
          className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer disabled:opacity-40"
        >
          <span>{currentQuestionIndex < totalQuestions - 1 ? 'Próxima Pergunta' : 'Concluir Avaliação'}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
