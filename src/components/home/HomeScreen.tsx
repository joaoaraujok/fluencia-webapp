import React from 'react';
import {
  Play,
  Clock,
  UserCheck,
  ShieldCheck,
  CheckCircle2,
  BookOpen,
  ArrowRight,
  History,
  Sparkles
} from 'lucide-react';
import { DifficultyLevel } from '../../types/question';
import { Student } from '../../types/school';
import { ChildProfile } from '../../types/child';

interface HomeScreenProps {
  activeStudent: Student | ChildProfile | null;
  onStartCompleteEvaluation: () => void;
  onStartLevelEvaluation?: (level: DifficultyLevel) => void;
  onOpenHistory?: () => void;
  onOpenSettings?: () => void;
  onOpenStudentModal: () => void;
  onOpenManual?: () => void;
  onInstallApp?: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  activeStudent,
  onStartCompleteEvaluation,
  onOpenHistory,
  onOpenStudentModal,
  onOpenManual
}) => {
  const studentAsStudent = activeStudent as Student | undefined;

  return (
    <div className="space-y-12 max-w-5xl mx-auto py-4 sm:py-8">
      {/* Seção Hero: Acolhedora, Profissional e com Foco Claro */}
      <div className="text-center max-w-2xl mx-auto space-y-6">
        {/* Identificação do Estudante Ativo */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-slate-200 shadow-xs">
          <div className="w-5 h-5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 flex items-center justify-center font-bold text-[11px] shrink-0">
            {activeStudent ? activeStudent.name.charAt(0).toUpperCase() : <UserCheck className="w-3 h-3 text-indigo-600" />}
          </div>
          <span className="text-xs sm:text-sm font-semibold text-slate-800">
            {activeStudent ? activeStudent.name : 'Nenhum estudante selecionado'}
            {studentAsStudent?.class ? ` • ${studentAsStudent.class.name}` : ''}
          </span>
          <button
            onClick={onOpenStudentModal}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors ml-1 px-2 py-0.5 rounded hover:bg-indigo-50"
            aria-label="Trocar ou selecionar estudante"
          >
            {activeStudent ? 'Alterar' : 'Selecionar'}
          </button>
        </div>

        {/* Título Principal e Proposta de Valor */}
        <div className="space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-medium border border-slate-200">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>Avaliação Formativa e Diagnóstica da Leitura Oral</span>
          </div>

          <h1 className="font-display font-black text-3xl sm:text-5xl text-slate-900 tracking-tight leading-tight">
            Fluência da Leitura com Acolhimento e Precisão
          </h1>

          <p className="text-slate-600 text-sm sm:text-base leading-relaxed max-w-xl mx-auto font-normal">
            Acompanhe o desenvolvimento leitor com cronometragens regulamentares de 10 segundos, reconhecimento fonético respeitoso e classificação em 6 níveis pedagógicos.
          </p>
        </div>

        {/* Botão de Ação Primária Unificado */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={onStartCompleteEvaluation}
            className="btn-primary w-full sm:w-auto px-8 py-3.5 text-base font-semibold shadow-md shadow-indigo-500/15 hover:shadow-indigo-500/25 cursor-pointer"
            aria-label="Iniciar avaliação diagnóstica completa"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Iniciar Avaliação Diagnóstica</span>
          </button>

          {onOpenHistory && (
            <button
              onClick={onOpenHistory}
              className="btn-secondary w-full sm:w-auto px-5 py-3.5 text-sm font-semibold cursor-pointer"
              aria-label="Ver histórico de avaliações anteriores"
            >
              <History className="w-4 h-4 text-slate-500" />
              <span>Ver Histórico</span>
            </button>
          )}
        </div>

        {/* Indicadores Pedagógicos Essenciais */}
        <div className="flex flex-wrap items-center justify-center gap-y-2 gap-x-5 text-xs text-slate-600 pt-2 border-t border-slate-200/80 max-w-lg mx-auto">
          <span className="inline-flex items-center gap-1.5 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>10s por item (letras/palavras)</span>
          </span>
          <span className="hidden sm:inline text-slate-300">•</span>
          <span className="inline-flex items-center gap-1.5 font-medium">
            <Clock className="w-3.5 h-3.5 text-indigo-600" />
            <span>Limite global de 4 minutos</span>
          </span>
          <span className="hidden sm:inline text-slate-300">•</span>
          <span className="inline-flex items-center gap-1.5 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
            <span>6 Níveis Oficiais (MEC/Saeb)</span>
          </span>
        </div>
      </div>

      {/* Jornada Pedagógica Sequencial e Adaptativa */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display font-bold text-lg sm:text-xl text-slate-900">
              Jornada Pedagógica da Avaliação
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-normal">
              O teste adapta-se progressivamente ao ritmo da criança, transitando de letras a pequenos textos narrativos.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Etapa 1 */}
          <div className="card p-5 space-y-3 bg-white">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                Etapa 1
              </span>
              <span className="text-xs text-slate-500 flex items-center gap-1 font-medium">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>10s / item</span>
              </span>
            </div>
            <div>
              <h3 className="font-semibold text-sm text-slate-900">
                Reconhecimento de Letras
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed mt-1">
                Identificação e som de vogais e consoantes. Avalia o domínio do princípio alfabético.
              </p>
            </div>
            <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-400 font-medium">
              Vogais e consoantes canônicas
            </div>
          </div>

          {/* Etapa 2 */}
          <div className="card p-5 space-y-3 bg-white">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                Etapa 2
              </span>
              <span className="text-xs text-slate-500 flex items-center gap-1 font-medium">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>10s / item</span>
              </span>
            </div>
            <div>
              <h3 className="font-semibold text-sm text-slate-900">
                Palavras Isoladas
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed mt-1">
                Decodificação progressiva (sílabas simples e complexas) com cálculo de palavras corretas por minuto.
              </p>
            </div>
            <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-400 font-medium">
              Palavras simples, médias e complexas
            </div>
          </div>

          {/* Etapa 3 */}
          <div className="card p-5 space-y-3 bg-white">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                Etapa 3
              </span>
              <span className="text-xs text-slate-500 flex items-center gap-1 font-medium">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>Até 60s</span>
              </span>
            </div>
            <div>
              <h3 className="font-semibold text-sm text-slate-900">
                Leitura de Texto
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed mt-1">
                Apresentada para estudantes com leitura consolidada (≥ 21 PCPM), medindo velocidade e precisão textual.
              </p>
            </div>
            <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-400 font-medium">
              História narrativa contextualizada
            </div>
          </div>

          {/* Etapa 4 */}
          <div className="card p-5 space-y-3 bg-white">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                Etapa 4
              </span>
              <span className="text-xs text-slate-500 flex items-center gap-1 font-medium">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>15s / item</span>
              </span>
            </div>
            <div>
              <h3 className="font-semibold text-sm text-slate-900">
                Prosódia e Expressividade
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed mt-1">
                Avaliação de entonação, pausas adequadas à pontuação e melodia da leitura em frases completas.
              </p>
            </div>
            <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-400 font-medium">
              Frases afirmativas e interrogativas
            </div>
          </div>
        </div>

        {/* Card Informativo com Orientação do Protocolo */}
        <div className="card p-4 sm:p-5 bg-slate-50/80 border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-white border border-slate-200 text-indigo-600 flex items-center justify-center shrink-0 shadow-xs">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs sm:text-sm font-semibold text-slate-800">
                Protocolo Adaptativo Respeitoso
              </p>
              <p className="text-xs text-slate-500">
                A aplicação interrompe automaticamente etapas quando critérios de interrupção são atingidos, prevenindo desgaste da criança.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {onOpenManual && (
              <button
                onClick={onOpenManual}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors shadow-xs cursor-pointer"
                aria-label="Consultar manual de uso e guia do educador"
              >
                <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                <span>Consultar Guia</span>
              </button>
            )}

            <button
              onClick={onStartCompleteEvaluation}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer"
              aria-label="Iniciar agora"
            >
              <span>Iniciar agora</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
