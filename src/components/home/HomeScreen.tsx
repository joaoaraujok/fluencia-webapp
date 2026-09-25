import React from 'react';
import {
  Play,
  Sparkles,
  Clock,
  UserCheck,
  ShieldCheck,
  CheckCircle2
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
  onInstallApp?: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  activeStudent,
  onStartCompleteEvaluation,
  onOpenStudentModal
}) => {
  const studentAsStudent = activeStudent as Student | undefined;

  return (
    <div className="space-y-10 sm:space-y-14 max-w-6xl mx-auto py-2 sm:py-6">
      {/* Seção Hero: Acolhedora e Focada */}
      <div className="text-center max-w-2xl mx-auto space-y-6 pt-2">
        {/* Chip do Estudante Selecionado */}
        <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white border border-slate-200 shadow-2xs">
          <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center font-black text-xs">
            {activeStudent ? activeStudent.name.charAt(0).toUpperCase() : <UserCheck className="w-3.5 h-3.5" />}
          </div>
          <span className="text-xs sm:text-sm font-bold text-slate-700">
            {activeStudent ? activeStudent.name : 'Estudante em Avaliação'}
            {studentAsStudent?.class ? ` (${studentAsStudent.class.name})` : ''}
          </span>
          <button
            onClick={onOpenStudentModal}
            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors ml-1 px-2 py-0.5 rounded-md hover:bg-indigo-50"
          >
            Trocar
          </button>
        </div>

        {/* Título Principal */}
        <div className="space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200/80 text-indigo-700 text-xs font-extrabold tracking-wide mb-1 shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Fluência da Leitura Oral com Inteligência Artificial</span>
          </div>
          <h2 className="font-display font-black text-3xl sm:text-4xl lg:text-5xl text-slate-900 tracking-tight">
            Fluenc<span className="bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 bg-clip-text text-transparent">IA</span>
          </h2>
          <p className="text-slate-500 text-base sm:text-lg leading-relaxed font-medium max-w-xl mx-auto">
            Avaliação diagnóstica e formativa da oralidade e leitura infantil com cronômetro de 10s e análise fonética respeitosa.
          </p>
        </div>

        {/* Botão de Destaque: Iniciar Avaliação Completa */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={onStartCompleteEvaluation}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-display font-bold text-lg shadow-xl shadow-indigo-200 hover:shadow-indigo-300 transform active:scale-[0.98] transition-all cursor-pointer"
          >
            <Play className="w-5 h-5 fill-current" />
            <span>Iniciar Avaliação Diagnóstica</span>
          </button>
        </div>

        {/* Informações da Janela e Silêncio */}
        <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-semibold text-slate-400 pt-1">
          <span className="flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-indigo-500" />
            <span>Limite global de 4 minutos (240s)</span>
          </span>
          <span>•</span>
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>10s p/ letras e palavras • 60s texto</span>
          </span>
          <span>•</span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-sky-500" />
            <span>6 Níveis Pedagógicos Oficiais</span>
          </span>
        </div>
      </div>

      {/* Jornada Sequencial da Avaliação */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-display font-extrabold text-xl text-slate-900 leading-tight">
              Jornada Pedagógica Sequencial
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              A criança realiza o teste completo e progressivo (máximo de 30 itens), do mais simples até frases
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Etapa 1 */}
          <div className="card p-5 border-slate-200 bg-white hover:border-amber-300 hover:shadow-sm transition-all space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                Etapa 1
              </span>
              <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                <span>10s / item</span>
              </span>
            </div>
            <div>
              <h4 className="font-display font-bold text-base text-slate-900">
                Reconhecimento de Letras
              </h4>
              <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed">
                15 letras (vogais e consoantes). Avalia o domínio do alfabeto. Mínimo de 10 acertos para avançar.
              </p>
            </div>
            <div className="pt-2 border-t border-slate-100 text-[11px] font-mono text-slate-400">
              A • E • B • P • M • D • T
            </div>
          </div>

          {/* Etapa 2 */}
          <div className="card p-5 border-slate-200 bg-white hover:border-indigo-300 hover:shadow-sm transition-all space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                Etapa 2
              </span>
              <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-indigo-600" />
                <span>10s / item</span>
              </span>
            </div>
            <div>
              <h4 className="font-display font-bold text-base text-slate-900">
                Palavras Isoladas
              </h4>
              <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed">
                Palavras progressivas (simples, médias e complexas). Avalia decodificação, silabações e PCPM.
              </p>
            </div>
            <div className="pt-2 border-t border-slate-100 text-[11px] font-mono text-slate-400">
              BOLA • SAPO • CHUVA • PRATO
            </div>
          </div>

          {/* Etapa 3 */}
          <div className="card p-5 border-slate-200 bg-white hover:border-emerald-300 hover:shadow-sm transition-all space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                Etapa 3
              </span>
              <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-emerald-600" />
                <span>Até 60s</span>
              </span>
            </div>
            <div>
              <h4 className="font-display font-bold text-base text-slate-900">
                Leitura de Texto
              </h4>
              <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed">
                Apresentada para candidatas a leitoras (21+ PCPM). Critério de fluência: ≥ 65 PCPM e &gt; 90% precisão.
              </p>
            </div>
            <div className="pt-2 border-t border-slate-100 text-[11px] font-mono text-slate-400">
              Histórias narrativas em contexto
            </div>
          </div>

          {/* Etapa 4 */}
          <div className="card p-5 border-slate-200 bg-white hover:border-violet-300 hover:shadow-sm transition-all space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase px-2.5 py-0.5 rounded-full bg-violet-50 text-violet-700 border border-violet-200">
                Etapa 4
              </span>
              <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-violet-600" />
                <span>15s / item</span>
              </span>
            </div>
            <div>
              <h4 className="font-display font-bold text-base text-slate-900">
                Prosódia em Frases
              </h4>
              <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed">
                Exclusiva para Leitor Fluente confirmado. Avalia entonação, pausas, agrupamento e melodia.
              </p>
            </div>
            <div className="pt-2 border-t border-slate-100 text-[11px] font-mono text-slate-400">
              "O PATO NADA NO LAGO."
            </div>
          </div>
        </div>

        {/* Botão de Rodapé para Iniciar com 1 Clique */}
        <div className="p-6 rounded-2xl bg-indigo-50 border border-indigo-100 flex flex-col sm:flex-row items-center justify-between gap-4 mt-2">
          <div className="space-y-1 text-center sm:text-left">
            <p className="font-bold text-sm text-indigo-950">
              Pronto para iniciar a avaliação sequencial?
            </p>
            <p className="text-xs text-indigo-700">
              A avaliação avança de forma adaptativa e inteligente, garantindo acolhimento e precisão pedagógica.
            </p>
          </div>
          <button
            onClick={onStartCompleteEvaluation}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md shadow-indigo-200 hover:shadow-indigo-300 transition-all cursor-pointer"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Começar Avaliação (30 Itens)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
