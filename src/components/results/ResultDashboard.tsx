import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  RotateCcw,
  History,
  Printer,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Award,
  Sparkles,
  ArrowLeft,
  Home,
  Smartphone
} from 'lucide-react';
import { EvaluationSession } from '../../types/evaluation';
import { DifficultyLevel } from '../../types/question';
import { LEVEL_DEFINITIONS } from '../../data/questionBank';
import { PracticeReport } from './PracticeReport';
import { DetailedItemList } from './DetailedItemList';

interface ResultDashboardProps {
  session: EvaluationSession;
  onRestart: () => void;
  onViewHistory: () => void;
  onInstallApp?: () => void;
}

export const ResultDashboard: React.FC<ResultDashboardProps> = ({
  session,
  onRestart,
  onViewHistory,
  onInstallApp
}) => {
  useEffect(() => {
    try {
      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch {}
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const levelList: DifficultyLevel[] = [1, 2, 3, 4];

  // Cálculo para o gráfico circular SVG
  const radius = 46;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (session.accuracyPercentage / 100) * circumference;

  return (
    <div className="space-y-6 sm:space-y-8 max-w-4xl mx-auto animate-fadeIn pb-16">
      {/* Barra de Ações Superiores: Botão Voltar ao Início e Ações Rápidas */}
      <div className="flex items-center justify-between gap-3 print:hidden">
        <button
          onClick={onRestart}
          className="btn-back"
          title="Voltar à tela inicial"
        >
          <ArrowLeft className="w-4 h-4 text-indigo-600" />
          <span>Voltar ao início</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={onViewHistory}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-bold transition-all shadow-xs"
            title="Ver histórico de avaliações"
          >
            <History className="w-4 h-4 text-indigo-600" />
            <span className="hidden sm:inline">Ver Histórico</span>
          </button>

          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-bold transition-all shadow-xs"
            title="Imprimir relatório da avaliação"
          >
            <Printer className="w-4 h-4 text-indigo-600" />
            <span className="hidden sm:inline">Imprimir Relatório</span>
          </button>
        </div>
      </div>

      {/* Cabeçalho de Sucesso & Desempenho em Card Clean */}
      <div className="card text-center bg-white border border-slate-200 p-6 sm:p-10 shadow-xs relative overflow-hidden">
        <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3.5 py-1.5 rounded-full bg-slate-100 text-slate-700 tracking-wide mb-4">
          <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
          <span>{session.childName || 'Estudante'}</span>
        </span>

        <h2 className="font-display font-black text-2xl sm:text-4xl text-slate-900 mb-2">
          Resultado da Avaliação
        </h2>

        {/* Gráfico Circular & Resumo */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-8 my-6 sm:my-8">
          {/* Anel SVG de Desempenho */}
          <div className="relative w-32 h-32 flex items-center justify-center shrink-0">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 110 110">
              <circle
                cx="55"
                cy="55"
                r={radius}
                className="text-slate-100"
                strokeWidth="9"
                stroke="currentColor"
                fill="transparent"
              />
              <circle
                cx="55"
                cy="55"
                r={radius}
                className="text-indigo-600 transition-all duration-1000 ease-out"
                strokeWidth="9"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                stroke="currentColor"
                fill="transparent"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
              <span className="font-display font-black text-3xl text-slate-900 leading-none">
                {session.accuracyPercentage}%
              </span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">
                Acertos
              </span>
            </div>
          </div>

          <div className="text-center sm:text-left space-y-1.5">
            <p className="text-xl sm:text-2xl font-black text-slate-800">
              {session.correctCount} de {session.totalItems} palavras reconhecidas
            </p>
            <p className="text-sm sm:text-base font-medium text-slate-500 max-w-md leading-relaxed">
              {session.accuracyPercentage >= 80
                ? 'Excelente desenvolvimento de fluência oral! Continue com a prática regular.'
                : session.accuracyPercentage >= 60
                ? 'Bom desempenho! Algumas palavras e dígrafos podem ser praticados.'
                : 'Ótima oportunidade de aprendizado! Pratique as sugestões no ritmo da criança.'}
            </p>
          </div>
        </div>

        {/* 4 Cards de Métricas com Design Minimalista e Arejado */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 sm:gap-4 text-left max-w-3xl mx-auto pt-3">
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-50/90 border border-slate-100/90 flex flex-col justify-between">
            <div className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-emerald-600 mb-1.5">
              <CheckCircle2 className="w-4 h-4" />
              <span>Acertos</span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900">
              {session.correctCount}
            </div>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-slate-50/90 border border-slate-100/90 flex flex-col justify-between">
            <div className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-amber-600 mb-1.5">
              <AlertTriangle className="w-4 h-4" />
              <span>Possíveis</span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900">
              {session.possibleCount}
            </div>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-slate-50/90 border border-slate-100/90 flex flex-col justify-between">
            <div className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-rose-500 mb-1.5">
              <XCircle className="w-4 h-4" />
              <span>A praticar</span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900">
              {session.incorrectCount + session.noResponseCount}
            </div>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-slate-50/90 border border-slate-100/90 flex flex-col justify-between">
            <div className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-indigo-600 mb-1.5">
              <Clock className="w-4 h-4" />
              <span>Tempo médio</span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900">
              {(session.averageResponseTimeMs / 1000).toFixed(1)}s
            </div>
          </div>
        </div>
      </div>

      {/* Desempenho por Nível de Dificuldade com Visual Temático */}
      <div className="card p-6 sm:p-8">
        <h3 className="font-display font-bold text-xl text-slate-900 mb-5 flex items-center gap-2">
          <Award className="w-5 h-5 text-indigo-600" />
          <span>Desempenho por Nível</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {levelList.map((lvl) => {
            const score = session.levelScores[lvl];
            if (!score || score.total === 0) return null;
            const info = LEVEL_DEFINITIONS[lvl];

            return (
              <div key={lvl} className="p-5 rounded-2xl bg-slate-50/80 border border-slate-200/80 flex flex-col justify-between gap-3">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-slate-800 text-sm sm:text-base">
                      {info.title}
                    </span>
                    <span className="font-black text-base sm:text-lg text-indigo-700">
                      {score.accuracy}%
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-500 mb-3">
                    {score.correct} de {score.total} palavras corretas
                  </p>
                </div>

                <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 rounded-full transition-all duration-500"
                    style={{ width: `${score.accuracy}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Seção Pedagógica: O Que Praticar */}
      <PracticeReport recommendations={session.practiceRecommendations} />

      {/* Detalhamento Item a Item para Professores */}
      <DetailedItemList items={session.items} />

      {/* Botões de Ação no Rodapé */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-6 print:hidden">
        <button
          onClick={onRestart}
          className="btn-primary w-full sm:w-auto py-3.5 px-8"
        >
          <RotateCcw className="w-5 h-5" />
          <span>Nova Avaliação</span>
        </button>

        <button
          onClick={onRestart}
          className="btn-secondary w-full sm:w-auto py-3.5 px-6"
        >
          <Home className="w-5 h-5 text-indigo-600" />
          <span>Tela Inicial</span>
        </button>

        <button
          onClick={onViewHistory}
          className="btn-secondary w-full sm:w-auto py-3.5 px-6"
        >
          <History className="w-5 h-5" />
          <span>Ver Histórico</span>
        </button>

        {onInstallApp && (
          <button
            onClick={onInstallApp}
            className="btn-secondary w-full sm:w-auto py-3.5 px-6"
            title="Instalar aplicativo no celular"
          >
            <Smartphone className="w-5 h-5 text-indigo-600" />
            <span>Instalar App no Celular</span>
          </button>
        )}

        <button
          onClick={handlePrint}
          className="btn-secondary w-full sm:w-auto py-3.5 px-6"
          title="Imprimir relatório da avaliação"
        >
          <Printer className="w-5 h-5" />
          <span>Imprimir</span>
        </button>
      </div>
    </div>
  );
};
