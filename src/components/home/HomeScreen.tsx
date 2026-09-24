import React from 'react';
import {
  Play,
  History,
  Settings,
  Sparkles,
  ChevronRight,
  Baby,
  Flame,
  BookOpen,
  Clock,
  UserCheck,
  Smartphone
} from 'lucide-react';
import { DifficultyLevel } from '../../types/question';
import { LEVEL_DEFINITIONS } from '../../data/questionBank';
import { ChildProfile } from '../../types/child';

interface HomeScreenProps {
  activeChild: ChildProfile | null;
  onStartCompleteEvaluation: () => void;
  onStartLevelEvaluation: (level: DifficultyLevel) => void;
  onOpenHistory: () => void;
  onOpenSettings: () => void;
  onOpenChildModal: () => void;
  onInstallApp?: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  activeChild,
  onStartCompleteEvaluation,
  onStartLevelEvaluation,
  onOpenHistory,
  onOpenSettings,
  onOpenChildModal,
  onInstallApp
}) => {
  const levelMetadata = {
    1: {
      name: 'Inicial',
      subtitle: 'Dissílabas simples',
      examples: 'BOLA • PATO • SAPO',
      icon: <Baby className="w-5 h-5 text-emerald-600" />,
      tagColor: 'bg-emerald-50 text-emerald-700 border-emerald-200'
    },
    2: {
      name: 'Intermediário 1',
      subtitle: 'Trissílabas',
      examples: 'PIPOCA • BONECA • MACACO',
      icon: <Sparkles className="w-5 h-5 text-sky-600" />,
      tagColor: 'bg-sky-50 text-sky-700 border-sky-200'
    },
    3: {
      name: 'Intermediário 2',
      subtitle: 'Dígrafos e encontros',
      examples: 'CHUVA • PRATO • FLOR',
      icon: <Flame className="w-5 h-5 text-amber-600" />,
      tagColor: 'bg-amber-50 text-amber-700 border-amber-200'
    },
    4: {
      name: 'Avançado',
      subtitle: 'Frases curtas',
      examples: 'O SAPO PULA • A BOLA CAIU',
      icon: <BookOpen className="w-5 h-5 text-purple-600" />,
      tagColor: 'bg-purple-50 text-purple-700 border-purple-200'
    }
  };

  return (
    <div className="space-y-10 sm:space-y-14 max-w-6xl mx-auto py-2 sm:py-6">
      {/* Seção Hero: Limpa, Minimalista e Acolhedora */}
      <div className="text-center max-w-2xl mx-auto space-y-6 pt-2">
        {/* Chip do Estudante Selecionado */}
        <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white border border-slate-200 shadow-2xs">
          <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center font-black text-xs">
            {activeChild ? activeChild.name.charAt(0).toUpperCase() : <UserCheck className="w-3.5 h-3.5" />}
          </div>
          <span className="text-xs sm:text-sm font-bold text-slate-700">
            {activeChild ? activeChild.name : 'Avaliação Avulsa'}
          </span>
          <button
            onClick={onOpenChildModal}
            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors ml-1 px-2 py-0.5 rounded-md hover:bg-indigo-50"
          >
            Trocar
          </button>
        </div>

        {/* Título Principal */}
        <div className="space-y-3">
          <h2 className="font-display font-black text-3xl sm:text-4xl lg:text-5xl text-slate-900 tracking-tight">
            Fluência Oral Infantil
          </h2>
          <p className="text-slate-500 text-base sm:text-lg leading-relaxed font-medium max-w-xl mx-auto">
            Avaliação de fala e leitura com escuta pelo microfone e análise pedagógica automática.
          </p>
        </div>

        {/* Botão de Ação Principal */}
        <div className="pt-3">
          <button
            onClick={onStartCompleteEvaluation}
            className="btn-primary text-base sm:text-lg py-4 px-8 sm:px-12 rounded-2xl shadow-sm hover:shadow-md transition-all inline-flex items-center gap-3"
          >
            <Play className="w-5 h-5 fill-current" />
            <span>Iniciar Avaliação Completa</span>
          </button>
        </div>
      </div>

      {/* Seção dos Níveis: 4 Cards Clean e Arejados */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <div>
            <h3 className="font-display font-bold text-lg sm:text-xl text-slate-800">
              Escolher Nível Individual
            </h3>
            <p className="text-xs text-slate-400 font-medium">
              Avalie uma etapa específica com seu tempo correspondente
            </p>
          </div>
          <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
            4 etapas
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
          {([1, 2, 3, 4] as DifficultyLevel[]).map((lvl) => {
            const info = LEVEL_DEFINITIONS[lvl];
            const meta = levelMetadata[lvl];

            return (
              <div
                key={lvl}
                onClick={() => onStartLevelEvaluation(lvl)}
                className="card p-6 cursor-pointer hover:border-indigo-300 hover:shadow-md transition-all flex flex-col justify-between h-full group border-slate-200"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border ${meta.tagColor}`}>
                      Nível {lvl}
                    </span>
                    <span className="text-xs font-semibold text-slate-400 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-300" />
                      {info.defaultDurationSec}s
                    </span>
                  </div>

                  <div className="flex items-center gap-3.5 pt-1">
                    <div className="w-11 h-11 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      {meta.icon}
                    </div>
                    <div>
                      <h4 className="font-display font-bold text-base text-slate-900 group-hover:text-indigo-600 transition-colors leading-tight">
                        {meta.name}
                      </h4>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">
                        {meta.subtitle}
                      </p>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50/80 border border-slate-100 text-center">
                    <p className="text-[11px] text-slate-500 font-bold tracking-wide">
                      {meta.examples}
                    </p>
                  </div>
                </div>

                <div className="pt-5 flex items-center justify-between border-t border-slate-100/80 mt-4">
                  <span className="text-xs font-bold text-slate-400 group-hover:text-indigo-600 transition-colors">
                    Iniciar teste
                  </span>
                  <div className="w-7 h-7 rounded-full bg-slate-50 group-hover:bg-indigo-50 text-slate-400 group-hover:text-indigo-600 flex items-center justify-center transition-colors">
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Seção Secundária: Histórico, Configurações e Instalar App no mesmo padrão */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
        <div
          onClick={onOpenHistory}
          className="card p-5 cursor-pointer hover:border-indigo-300 hover:shadow-md transition-all flex items-center gap-3.5 h-full group border-slate-200"
        >
          <div className="w-11 h-11 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100/60 group-hover:scale-105 transition-transform">
            <History className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0 text-left">
            <h4 className="font-display font-bold text-sm sm:text-base text-slate-900 group-hover:text-indigo-600 transition-colors truncate">
              Histórico
            </h4>
            <p className="text-xs text-slate-500 font-medium truncate">
              Evolução e testes
            </p>
          </div>
          <div className="w-7 h-7 rounded-full bg-slate-50 group-hover:bg-indigo-50 text-slate-400 group-hover:text-indigo-600 flex items-center justify-center transition-colors shrink-0">
            <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>

        <div
          onClick={onOpenSettings}
          className="card p-5 cursor-pointer hover:border-indigo-300 hover:shadow-md transition-all flex items-center gap-3.5 h-full group border-slate-200"
        >
          <div className="w-11 h-11 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0 border border-slate-200/60 group-hover:scale-105 transition-transform">
            <Settings className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0 text-left">
            <h4 className="font-display font-bold text-sm sm:text-base text-slate-900 group-hover:text-indigo-600 transition-colors truncate">
              Configurações
            </h4>
            <p className="text-xs text-slate-500 font-medium truncate">
              Tempos e microfone
            </p>
          </div>
          <div className="w-7 h-7 rounded-full bg-slate-50 group-hover:bg-indigo-50 text-slate-400 group-hover:text-indigo-600 flex items-center justify-center transition-colors shrink-0">
            <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>

        {onInstallApp && (
          <div
            onClick={onInstallApp}
            className="card p-5 cursor-pointer hover:border-indigo-300 hover:shadow-md transition-all flex items-center gap-3.5 h-full group border-slate-200"
          >
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100/60 group-hover:scale-105 transition-transform">
              <Smartphone className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0 text-left">
              <h4 className="font-display font-bold text-sm sm:text-base text-slate-900 group-hover:text-indigo-600 transition-colors truncate">
                Instalar no Celular
              </h4>
              <p className="text-xs text-slate-500 font-medium truncate">
                App PWA tela cheia
              </p>
            </div>
            <div className="w-7 h-7 rounded-full bg-slate-50 group-hover:bg-indigo-50 text-slate-400 group-hover:text-indigo-600 flex items-center justify-center transition-colors shrink-0">
              <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
