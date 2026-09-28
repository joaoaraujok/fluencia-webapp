import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import {
  RotateCcw,
  History,
  Printer,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Award,
  Sparkles,
  ArrowLeft,
  Smartphone,
  BookOpen,
  FileText,
  TrendingUp,
  ShieldCheck,
  Pencil,
  Save,
  MessageSquare
} from 'lucide-react';
import { EvaluationSession } from '../../types/evaluation';
import { DIAGNOSIS_DEFINITIONS } from '../../data/questionBank';
import { PracticeReport } from './PracticeReport';
import { DetailedItemList } from './DetailedItemList';
import { FluenciaLogo } from '../common/FluenciaLogo';
import { saveEvaluationSessionLocally } from '../../services/db';
import { api } from '../../services/api';

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
  const [supervisorNotes, setSupervisorNotes] = useState<string>(session.notes || '');
  const [isEditingNotes, setIsEditingNotes] = useState<boolean>(false);
  const [isSavingNotes, setIsSavingNotes] = useState<boolean>(false);
  const [notesSaveSuccess, setNotesSaveSuccess] = useState<boolean>(false);

  const handleSaveNotes = async () => {
    setIsSavingNotes(true);
    try {
      session.notes = supervisorNotes.trim();
      await saveEvaluationSessionLocally(session);
      if (session.id && !session.id.startsWith('eval_')) {
        await api.updateEvaluationNotes(session.id, supervisorNotes.trim()).catch(() => {});
      }
      setIsEditingNotes(false);
      setNotesSaveSuccess(true);
      setTimeout(() => setNotesSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Falha ao salvar observações do supervisor:', err);
    } finally {
      setIsSavingNotes(false);
    }
  };
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

  // Definição do diagnóstico entre os 6 níveis oficiais
  const diagnosisKey = (session.pedagogicalDiagnosis || 'PRE_LEITOR_1') as keyof typeof DIAGNOSIS_DEFINITIONS;
  const diagnosisInfo = DIAGNOSIS_DEFINITIONS[diagnosisKey] || {
    id: diagnosisKey,
    code: 'PL1',
    title: String(diagnosisKey).replace(/_/g, ' '),
    subtitle: 'Nível de Fluência',
    description: 'Avaliação da fluência oral leitora.',
    badgeColor: 'bg-slate-100 text-slate-800 border-slate-300'
  };

  // Cálculo SVG do gráfico de rosca
  const radius = 46;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (session.accuracyPercentage / 100) * circumference;

  // Formatação de duração global
  const formatSeconds = (sec?: number) => {
    if (!sec) return '00:00';
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const exec = session.executiveSummary;
  const letters = session.lettersReport;
  const words = session.wordsReport;
  const pseudowords = session.pseudowordsReport;
  const text = session.textReport;
  const comprehension = session.comprehensionReport;
  const phrases = session.phrasesReport;

  return (
    <div className="space-y-6 sm:space-y-8 max-w-4xl mx-auto animate-fadeIn pb-16">
      {/* Barra de Ações Superiores */}
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
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-bold transition-all shadow-xs cursor-pointer"
            title="Ver histórico de avaliações"
          >
            <History className="w-4 h-4 text-indigo-600" />
            <span className="hidden sm:inline">Ver Histórico</span>
          </button>

          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-bold transition-all shadow-xs cursor-pointer"
            title="Imprimir relatório da avaliação"
          >
            <Printer className="w-4 h-4 text-indigo-600" />
            <span className="hidden sm:inline">Imprimir Relatório</span>
          </button>
        </div>
      </div>

      {/* Cabeçalho de Impressão */}
      <div className="hidden print:flex items-center justify-between pb-4 border-b border-slate-200 mb-4">
        <FluenciaLogo size="md" variant="full" />
        <div className="text-right text-xs text-slate-500 font-medium">
          <p className="font-bold text-slate-700">Relatório Técnico-Pedagógico de Fluência Leitora</p>
          <p>{new Date(session.timestamp).toLocaleDateString('pt-BR')} — Protocolo: {session.id}</p>
        </div>
      </div>

      {/* Alerta de Limite Global de 4 minutos caso tenha estourado o tempo */}
      {session.isGlobalTimeLimitReached && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-3 text-amber-900">
          <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm">
            <p className="font-bold">Avaliação Encerrada pelo Limite Global de 4 Minutos (240s)</p>
            <p className="text-amber-800 mt-0.5">
              Conforme a Regra 3 do protocolo pedagógico, todos os dados coletados até o momento da interrupção foram processados integralmente para compor o nível alcançado com base nas evidências disponíveis.
            </p>
          </div>
        </div>
      )}

      {/* Card Principal: Diagnóstico Oficial e Métricas Globais */}
      <div className="card text-center bg-white border border-slate-200 p-6 sm:p-10 shadow-xs relative overflow-hidden">
        <div className="flex flex-wrap items-center justify-center gap-2 mb-4">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3.5 py-1.5 rounded-full bg-slate-100 text-slate-700 tracking-wide">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>{session.childName || 'Estudante'}</span>
          </span>

          <span className="text-xs text-slate-500 font-mono bg-slate-50 px-3 py-1 rounded-full border border-slate-200">
            Duração: {formatSeconds(session.globalElapsedSeconds)} / 04:00
          </span>
        </div>

        <h2 className="font-display font-black text-2xl sm:text-4xl text-slate-900 mb-2">
          Resultado da Avaliação Adaptativa
        </h2>

        {/* Gráfico Circular & Nível */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-8 my-6 sm:my-8">
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
                Precisão
              </span>
            </div>
          </div>

          <div className="text-center sm:text-left space-y-2 max-w-md">
            <div>
              <span className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-black border ${diagnosisInfo.badgeColor}`}>
                <Award className="w-4 h-4" />
                <span>NÍVEL OFICIAL: {diagnosisInfo.title.toUpperCase()}</span>
              </span>
            </div>

            <p className="text-xl sm:text-2xl font-black text-slate-900">
              {diagnosisInfo.subtitle}
            </p>
            <p className="text-xs sm:text-sm font-medium text-slate-600 leading-relaxed">
              {diagnosisInfo.description}
            </p>
          </div>
        </div>

        {/* 4 Cards de Métricas Principais */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-left max-w-3xl mx-auto pt-2">
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 mb-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Itens Corretos</span>
            </div>
            <div className="text-2xl font-black text-slate-900">
              {session.correctCount} <span className="text-xs font-normal text-slate-400">/ {session.totalItems}</span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
            <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 mb-1">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Velocidade (PCPM)</span>
            </div>
            <div className="text-2xl font-black text-indigo-600">
              {session.wordsPerMinute ?? 0}
            </div>
            <span className="text-[10px] text-slate-400 font-semibold">palavras/min</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600 mb-1">
              <Clock className="w-3.5 h-3.5" />
              <span>Tempo Médio</span>
            </div>
            <div className="text-2xl font-black text-slate-900">
              {(session.averageResponseTimeMs / 1000).toFixed(1)}s
            </div>
            <span className="text-[10px] text-slate-400 font-semibold">por resposta</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-600 mb-1">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>A Praticar</span>
            </div>
            <div className="text-2xl font-black text-slate-900">
              {session.incorrectCount + session.noResponseCount}
            </div>
            <span className="text-[10px] text-slate-400 font-semibold">desafios ou pausas</span>
          </div>
        </div>
      </div>

      {/* CAIXA DE INFORMAÇÕES DA AVALIAÇÃO: RELATÓRIO DA IA E OBSERVAÇÕES DO SUPERVISOR */}
      <div className="card p-6 sm:p-8 bg-gradient-to-br from-indigo-50/70 via-white to-purple-50/40 border border-indigo-200/90 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-indigo-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-xs">
              <Sparkles className="w-5 h-5 text-amber-200" />
            </div>
            <div>
              <h3 className="font-display font-black text-xl text-slate-900 leading-tight">
                Caixa de Informações da Avaliação
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Síntese diagnóstica gerada pela IA e anotações pedagógicas do supervisor
              </p>
            </div>
          </div>
          {session.adminReviewStatus && (
            <span
              className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider self-start sm:self-auto border ${
                session.adminReviewStatus === 'APROVADO'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : session.adminReviewStatus === 'REQUER_ATENCAO'
                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                  : session.adminReviewStatus === 'EM_OBSERVACAO'
                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                  : 'bg-slate-100 text-slate-600 border-slate-200'
              }`}
            >
              Homologação Gestão: {session.adminReviewStatus}
            </span>
          )}
        </div>

        {/* 1. RELATÓRIO GERADO PELA IA */}
        <div className="p-5 rounded-2xl bg-white border border-indigo-100/90 shadow-2xs space-y-3">
          <div className="flex items-center gap-2 text-indigo-700">
            <Sparkles className="w-4 h-4" />
            <h4 className="font-display font-bold text-sm sm:text-base text-slate-900">
              Relatório Diagnóstico Gerado pela IA
            </h4>
          </div>

          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
            {session.aiPedagogicalSynthesis?.executiveSummary ||
             exec?.readingQualitySummary ||
             (session.accuracyPercentage >= 80
               ? `A IA identificou alto índice de decodificação e fluência articulatória (${session.accuracyPercentage}% de precisão). O estudante demonstra segurança fonológica e cadência adequada aos itens apresentados.`
               : session.accuracyPercentage >= 50
               ? `A IA apurou desempenho intermediário (${session.accuracyPercentage}% de precisão). Observou-se prontidão em palavras canônicas e necessidade de apoio no reconhecimento de dígrafos e estruturas silábicas complexas.`
               : `A IA diagnosticou padrão compatível com a fase inicial de alfabetização (Pré-Leitor, ${session.accuracyPercentage}% de precisão). Recomenda-se estímulo continuado de consciência fonológica e nomeação oral.`)}
          </p>

          {/* Potencialidades e Habilidades Observadas pela IA */}
          {(session.aiPedagogicalSynthesis?.strengths || (exec && exec.whatChildCanDo)) && (
            <div className="pt-2 border-t border-slate-100 text-xs flex flex-wrap gap-2 items-center">
              <span className="font-bold text-slate-700">Evidências e Potencialidades:</span>
              {session.aiPedagogicalSynthesis?.strengths?.map((str, i) => (
                <span key={i} className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold">
                  ✓ {str}
                </span>
              )) || (
                <span className="text-slate-600 italic">{exec?.whatChildCanDo}</span>
              )}
            </div>
          )}
        </div>

        {/* 2. OBSERVAÇÕES ANOTADAS PELO SUPERVISOR */}
        <div className="p-5 rounded-2xl bg-amber-50/70 border border-amber-200/90 shadow-2xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-amber-200/50">
            <div className="flex items-center gap-2 text-amber-900">
              <FileText className="w-4 h-4 text-amber-700" />
              <h4 className="font-display font-bold text-sm sm:text-base text-amber-950">
                Observações Anotadas pelo Supervisor
              </h4>
            </div>
            {!isEditingNotes && (
              <button
                onClick={() => setIsEditingNotes(true)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 text-xs font-bold transition-colors cursor-pointer"
                title="Editar ou registrar observações"
              >
                <Pencil className="w-3 h-3" />
                <span>{supervisorNotes ? 'Editar Notas' : 'Adicionar Notas'}</span>
              </button>
            )}
          </div>

          {notesSaveSuccess && (
            <div className="p-2 rounded-lg bg-emerald-100 text-emerald-800 text-xs font-semibold flex items-center gap-1.5 animate-fadeIn">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Observações do supervisor salvas com sucesso!</span>
            </div>
          )}

          {isEditingNotes ? (
            <div className="space-y-2">
              <textarea
                rows={3}
                value={supervisorNotes}
                onChange={(e) => setSupervisorNotes(e.target.value)}
                placeholder="Insira aqui as observações sobre o comportamento da criança, hesitações, postura ou fatores ambientais observados durante a aplicação..."
                className="w-full p-3 rounded-xl border border-amber-300 bg-white text-xs sm:text-sm text-slate-800 resize-none focus:outline-hidden focus:border-amber-500"
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => {
                    setSupervisorNotes(session.notes || '');
                    setIsEditingNotes(false);
                  }}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveNotes}
                  disabled={isSavingNotes}
                  className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-colors cursor-pointer"
                >
                  <Save className="w-3 h-3" />
                  <span>{isSavingNotes ? 'Salvando...' : 'Salvar Observações'}</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white/80 p-3.5 rounded-xl border border-amber-200/80 text-xs sm:text-sm">
              {supervisorNotes ? (
                <p className="italic text-slate-800 font-medium leading-relaxed">
                  "{supervisorNotes}"
                </p>
              ) : (
                <p className="text-slate-400 italic">
                  Nenhuma observação anotada pelo supervisor até o momento. Clique em "Adicionar Notas" para registrar.
                </p>
              )}
            </div>
          )}
        </div>

        {/* 3. PARECER FORMAL DA GESTÃO (SE AVALIADO POR ADMIN/SUPERADMIN) */}
        {session.adminFeedback && (
          <div className="p-5 rounded-2xl bg-sky-50/70 border border-sky-200/90 shadow-2xs space-y-2">
            <div className="flex items-center gap-2 text-sky-900 pb-1 border-b border-sky-200/50">
              <MessageSquare className="w-4 h-4 text-sky-700" />
              <h4 className="font-display font-bold text-sm text-sky-950">
                Parecer de Homologação da Gestão Pedagógica
              </h4>
            </div>
            <p className="text-xs sm:text-sm text-slate-800 leading-relaxed font-medium bg-white/80 p-3.5 rounded-xl border border-sky-200/70">
              "{session.adminFeedback}"
            </p>
          </div>
        )}
      </div>

      {/* SEÇÃO 20: RESUMO EXECUTIVO PARA O SUPERVISOR (Responde às 7 Perguntas) */}
      {exec && (
        <div className="card p-6 sm:p-8 bg-gradient-to-br from-indigo-50/50 via-white to-sky-50/40 border-indigo-100">
          <div className="flex items-center gap-2.5 mb-5 pb-3 border-b border-indigo-100">
            <div className="p-2 rounded-xl bg-indigo-600 text-white shadow-2xs">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-black text-xl text-slate-900">
                Resumo Executivo para o Supervisor
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Síntese pedagógica direta para elaboração do relatório do professor (Regra 20)
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-2xs space-y-1">
              <span className="text-[11px] font-black uppercase tracking-wider text-indigo-700 flex items-center gap-1">
                <span>1.</span> Nível Atual
              </span>
              <p className="font-bold text-slate-900">{exec.currentLevelTitle}</p>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-2xs space-y-1">
              <span className="text-[11px] font-black uppercase tracking-wider text-emerald-700 flex items-center gap-1">
                <span>2.</span> O que a criança consegue fazer?
              </span>
              <p className="text-slate-700 leading-snug">{exec.whatChildCanDo}</p>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-2xs space-y-1">
              <span className="text-[11px] font-black uppercase tracking-wider text-rose-700 flex items-center gap-1">
                <span>3.</span> Principais Dificuldades
              </span>
              <p className="text-slate-700 leading-snug">{exec.mainDifficulties}</p>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-2xs space-y-1">
              <span className="text-[11px] font-black uppercase tracking-wider text-sky-700 flex items-center gap-1">
                <span>4.</span> Dados que Sustentam a Classificação
              </span>
              <p className="text-slate-700 leading-snug font-mono text-xs">{exec.supportingData}</p>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-2xs space-y-1">
              <span className="text-[11px] font-black uppercase tracking-wider text-amber-700 flex items-center gap-1">
                <span>5.</span> Qualidade da Leitura e Automaticidade
              </span>
              <p className="text-slate-700 leading-snug">{exec.readingQualitySummary}</p>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-2xs space-y-1">
              <span className="text-[11px] font-black uppercase tracking-wider text-violet-700 flex items-center gap-1">
                <span>6.</span> Habilidades que Precisam de Atenção
              </span>
              <ul className="list-disc list-inside text-xs text-slate-700 space-y-0.5">
                {exec.skillsNeedingAttention.map((skill, idx) => (
                  <li key={idx}>{skill}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-4 p-4 rounded-xl bg-indigo-100/60 border border-indigo-200/80 text-xs sm:text-sm">
            <span className="font-bold text-indigo-950 flex items-center gap-1.5 mb-1">
              <span>7.</span> Aspectos Recomendados para Trabalho em Sala:
            </span>
            <div className="flex flex-wrap gap-2 pt-1">
              {exec.aspectsToWorkOn.map((aspect, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 rounded-full bg-white text-indigo-900 font-semibold border border-indigo-200 shadow-2xs"
                >
                  ✓ {aspect}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SEÇÃO 19: EVIDÊNCIAS DA CLASSIFICAÇÃO */}
      {session.classificationEvidences && session.classificationEvidences.length > 0 && (
        <div className="card p-6 sm:p-8">
          <div className="flex items-center gap-2.5 mb-4 pb-2 border-b border-slate-100">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <div>
              <h3 className="font-display font-bold text-lg sm:text-xl text-slate-900">
                Evidências da Classificação
              </h3>
              <p className="text-xs text-slate-500">
                Fundamentação técnica e quantitativa dos critérios que determinaram o diagnóstico (Regra 19)
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {session.classificationEvidences.map((evidence, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl bg-slate-50 border-l-4 border-indigo-600 text-slate-800 text-sm leading-relaxed"
              >
                {evidence}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* DETALHAMENTO DAS 4 ETAPAS AVALIADAS (Regra 18) */}
      <div className="space-y-4">
        <h3 className="font-display font-bold text-xl text-slate-900 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-indigo-600" />
          <span>Detalhamento por Etapa Adaptativa</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Etapa 1: Letras */}
          {letters && letters.presented > 0 && (
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="font-bold text-slate-900 text-base">Etapa 1: Reconhecimento de Letras</span>
                <span className="text-xs font-black px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                  {letters.accuracy}% de precisão
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2 rounded-lg bg-slate-50">
                  <span className="text-slate-400 block">Apresentadas</span>
                  <span className="font-black text-slate-800 text-base">{letters.presented}</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-50">
                  <span className="text-slate-400 block">Corretas</span>
                  <span className="font-black text-emerald-600 text-base">{letters.correct}</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-50">
                  <span className="text-slate-400 block">Tempo Reação</span>
                  <span className="font-black text-slate-800 text-base">{(letters.averageReactionTimeMs / 1000).toFixed(1)}s</span>
                </div>
              </div>

              {session.letterSequence && session.letterSequence.length > 0 && (
                <div className="text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  <span className="font-bold text-slate-600 block mb-1">Sequência Sorteada das 10 Letras:</span>
                  <div className="flex flex-wrap gap-1">
                    {session.letterSequence.map((l, i) => (
                      <span key={i} className="px-2 py-0.5 rounded-md bg-white font-mono font-black text-indigo-700 border border-slate-200 shadow-2xs">
                        {l.toLocaleUpperCase('pt-BR')}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {letters.confusions && letters.confusions.length > 0 && (
                <div className="text-xs text-rose-700 bg-rose-50 p-2.5 rounded-xl border border-rose-200">
                  <span className="font-bold block mb-1">Confusões grafofonêmicas registradas:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {letters.confusions.map((c, i) => (
                      <span key={i} className="px-2 py-0.5 rounded bg-white font-mono font-bold border border-rose-200">
                        {c.expected} → {c.spoken} ({c.count}x)
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Etapa 2: Palavras Isoladas */}
          {words && words.presented > 0 && (
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="font-bold text-slate-900 text-base">Etapa 2: Palavras Isoladas</span>
                <span className="text-xs font-black px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
                  {words.wordsPerMinute} PCPM
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2 rounded-lg bg-slate-50">
                  <span className="text-slate-400 block">Corretas</span>
                  <span className="font-black text-emerald-600 text-base">{words.correct}</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-50">
                  <span className="text-slate-400 block">Precisão</span>
                  <span className="font-black text-slate-800 text-base">{words.accuracy}%</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-50">
                  <span className="text-slate-400 block">Silabações</span>
                  <span className="font-black text-slate-800 text-base">{words.silabationCount}</span>
                </div>
              </div>

              <p className="text-xs text-slate-500">
                Tempo médio por palavra: <strong>{(words.averageDurationMs / 1000).toFixed(1)}s</strong> • Pausas observadas: <strong>{words.pausesCount}</strong>
              </p>
            </div>
          )}

          {/* Etapa de Pseudopalavras (Decodificação Grafema-Fonema) */}
          {pseudowords && pseudowords.presented > 0 && (
            <div className="p-5 rounded-2xl bg-white border border-purple-200/90 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-purple-100">
                <span className="font-bold text-purple-950 text-base">Etapa: Pseudopalavras (Decodificação)</span>
                <span className="text-xs font-black px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
                  {pseudowords.accuracy}% de acurácia
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2 rounded-lg bg-purple-50/60">
                  <span className="text-purple-600 block">Decodificadas</span>
                  <span className="font-black text-emerald-600 text-base">{pseudowords.correct} de {pseudowords.presented}</span>
                </div>
                <div className="p-2 rounded-lg bg-purple-50/60">
                  <span className="text-purple-600 block">Silabações</span>
                  <span className="font-black text-slate-800 text-base">{pseudowords.silabationCount}</span>
                </div>
                <div className="p-2 rounded-lg bg-purple-50/60">
                  <span className="text-purple-600 block">Tempo Médio</span>
                  <span className="font-black text-slate-800 text-base">{(pseudowords.averageDurationMs / 1000).toFixed(1)}s</span>
                </div>
              </div>

              <p className="text-xs text-purple-900/80 leading-relaxed">
                Avaliação estrita da decodificação grafofonêmica sem apoio de significado léxico (Seção 6 do protocolo).
              </p>
            </div>
          )}

          {/* Etapa 3: Leitura de Texto em Contexto */}
          {text && text.evaluated && (
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="font-bold text-slate-900 text-base">Etapa: Leitura de Texto</span>
                <span className="text-xs font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  {text.wordsPerMinute} PCPM ({text.accuracy}%)
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2 rounded-lg bg-slate-50">
                  <span className="text-slate-400 block">Palavras Corretas</span>
                  <span className="font-black text-emerald-600 text-base">{text.wordsCorrect}</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-50">
                  <span className="text-slate-400 block">Automaticidade</span>
                  <span className="font-black text-indigo-700 text-base uppercase">{text.automaticityLevel}</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-50">
                  <span className="text-slate-400 block">Pontuação</span>
                  <span className="font-black text-slate-800 text-base">{text.punctuationRespected ? 'Adequada' : 'Pausada'}</span>
                </div>
              </div>

              <p className="text-xs text-slate-600">
                História avaliada: "{text.textTitle}". Índice de prosódia contextual: <strong>{text.prosodyScore}/100</strong>.
              </p>
            </div>
          )}

          {/* Etapa de Compreensão Textual (Seção 10) */}
          {comprehension && (
            <div className="p-5 rounded-2xl bg-white border border-teal-200 shadow-xs space-y-3 col-span-1 md:col-span-2">
              <div className="flex items-center justify-between pb-2 border-b border-teal-100">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-teal-950 text-base">Compreensão Textual (3 Perguntas Orais)</span>
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-teal-100 text-teal-900 uppercase">
                    Supervisor
                  </span>
                </div>
                {comprehension.evaluated ? (
                  <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-800">
                    {comprehension.correctCount} de {comprehension.totalQuestions} acertos ({comprehension.scorePercentage}%)
                  </span>
                ) : (
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
                    Não Aplicada (Critério de Progressão)
                  </span>
                )}
              </div>

              {comprehension.evaluated && comprehension.answers && comprehension.answers.length > 0 ? (
                <div className="space-y-2 pt-1">
                  {comprehension.answers.map((ans, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-teal-50/50 border border-teal-100 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-teal-950 flex items-center gap-1.5">
                          <span className="px-1.5 py-0.5 rounded bg-white text-[10px] uppercase font-black border border-teal-200">
                            {ans.questionType}
                          </span>
                          Pergunta {idx + 1}: {ans.question}
                        </span>
                        <span
                          className={`font-black px-2 py-0.5 rounded text-[11px] uppercase ${
                            ans.status === 'CORRETO'
                              ? 'bg-emerald-100 text-emerald-800'
                              : ans.status === 'INCORRETO'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {ans.status}
                        </span>
                      </div>
                      {ans.childResponseText && (
                        <p className="text-slate-600 italic pl-1">
                          Resposta da criança: "{ans.childResponseText}"
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic">
                  {comprehension.ineligibilityReason || 'A etapa de compreensão não foi realizada pois a criança não atingiu o critério de leitura mínima do texto.'}
                </p>
              )}
            </div>
          )}

          {/* Etapa 4: Frases Curtas (Prosódia Avançada) */}
          {phrases && phrases.evaluated && (
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="font-bold text-slate-900 text-base">Etapa: Prosódia em Frases</span>
                <span className="text-xs font-black px-2 py-0.5 rounded-full bg-violet-100 text-violet-800">
                  Confirmado Leitor Fluente
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-center text-xs">
                <div className="p-2 rounded-lg bg-slate-50">
                  <span className="text-slate-400 block">Frases Concluídas</span>
                  <span className="font-black text-emerald-600 text-base">{phrases.completed} de {phrases.presented}</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-50">
                  <span className="text-slate-400 block">Índice de Prosódia</span>
                  <span className="font-black text-violet-700 text-base">{phrases.prosodyScore}/100</span>
                </div>
              </div>

              <p className="text-xs text-slate-600">
                Cadência observada: <strong>{phrases.cadenceDescription}</strong>.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Seção Pedagógica: O Que Praticar */}
      <PracticeReport recommendations={session.practiceRecommendations} />

      {/* Detalhamento Item a Item com Dados Brutos e Rastreabilidade */}
      <DetailedItemList items={session.items} />

      {/* Botões de Ação no Rodapé com Hierarquia Estrita */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-6 print:hidden">
        <button
          onClick={onRestart}
          className="btn-primary w-full sm:w-auto py-3 px-6 cursor-pointer"
          aria-label="Iniciar nova avaliação"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Nova Avaliação</span>
        </button>

        <button
          onClick={onViewHistory}
          className="btn-secondary w-full sm:w-auto py-3 px-5 cursor-pointer"
          aria-label="Ver histórico de avaliações"
        >
          <History className="w-4 h-4 text-slate-500" />
          <span>Ver Histórico</span>
        </button>

        <button
          onClick={handlePrint}
          className="btn-secondary w-full sm:w-auto py-3 px-5 cursor-pointer"
          title="Imprimir relatório da avaliação"
          aria-label="Imprimir relatório da avaliação"
        >
          <Printer className="w-4 h-4 text-slate-500" />
          <span>Imprimir Relatório</span>
        </button>

        {onInstallApp && (
          <button
            onClick={onInstallApp}
            className="btn-ghost w-full sm:w-auto py-2.5 px-4 cursor-pointer text-slate-600 hover:text-slate-900"
            title="Instalar aplicativo no dispositivo"
            aria-label="Instalar aplicativo"
          >
            <Smartphone className="w-4 h-4 text-slate-500" />
            <span>Instalar App</span>
          </button>
        )}
      </div>
    </div>
  );
};
