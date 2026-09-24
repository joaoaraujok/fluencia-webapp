import React, { useEffect, useState } from 'react';
import {
  Calendar,
  TrendingUp,
  Trash2,
  ChevronRight,
  ArrowLeft,
  AlertCircle
} from 'lucide-react';
import { getEvaluations, deleteEvaluation, clearAllEvaluations } from '../../services/db';
import { EvaluationSession } from '../../types/evaluation';
import { EvolutionChart } from './EvolutionChart';

interface HistoryViewProps {
  onBack: () => void;
  onSelectSession: (session: EvaluationSession) => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({ onBack, onSelectSession }) => {
  const [sessions, setSessions] = useState<EvaluationSession[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const data = await getEvaluations();
      setSessions(data);
    } catch (err) {
      console.error('Erro ao carregar histórico:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Deseja realmente excluir esta avaliação do histórico?')) {
      await deleteEvaluation(id);
      loadHistory();
    }
  };

  const handleClearAll = async () => {
    if (confirm('Deseja apagar TODO o histórico de avaliações? Esta ação não pode ser desfeita.')) {
      await clearAllEvaluations();
      loadHistory();
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 max-w-4xl mx-auto pb-16 animate-fadeIn">
      {/* Topo com Botão Voltar */}
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={onBack}
          className="btn-back"
          title="Voltar à tela inicial"
        >
          <ArrowLeft className="w-4 h-4 text-indigo-600" />
          <span>Voltar ao início</span>
        </button>

        {sessions.length > 0 && (
          <button
            onClick={handleClearAll}
            className="text-xs font-bold text-rose-600 hover:text-rose-800 transition-colors flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-rose-50"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Limpar Histórico</span>
          </button>
        )}
      </div>

      <div className="card p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
          <div>
            <h2 className="font-display font-black text-2xl sm:text-3xl text-slate-900">
              Histórico de Avaliações
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              Acompanhe a curva de evolução ao longo do tempo e os testes realizados
            </p>
          </div>
          <span className="self-start sm:self-auto text-xs font-bold bg-indigo-50 text-indigo-700 px-3.5 py-1.5 rounded-full border border-indigo-100">
            {sessions.length} {sessions.length === 1 ? 'registro' : 'registros'}
          </span>
        </div>

        {/* Gráfico de Evolução */}
        <div className="mb-8 pt-4 border-t border-slate-100">
          <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-indigo-600" />
            <span>Curva de Evolução</span>
          </h3>
          <EvolutionChart sessions={sessions} />
        </div>

        {/* Lista de Avaliações */}
        {loading ? (
          <div className="p-12 text-center text-slate-400 font-medium">
            Carregando histórico...
          </div>
        ) : sessions.length === 0 ? (
          <div className="p-10 text-center text-slate-500 bg-slate-50 rounded-2xl border border-slate-200">
            <AlertCircle className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="font-bold text-base text-slate-800">Nenhuma avaliação realizada ainda</p>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-sm mx-auto">
              Ao concluir avaliações de palavras ou frases, os resultados e pontuações aparecerão aqui.
            </p>
          </div>
        ) : (
          <div className="space-y-3.5">
            {sessions.map((item) => {
              const dateStr = new Date(item.timestamp).toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
              });
              const timeStr = new Date(item.timestamp).toLocaleTimeString('pt-BR', {
                hour: '2-digit',
                minute: '2-digit'
              });

              return (
                <div
                  key={item.id}
                  onClick={() => onSelectSession(item)}
                  className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer flex items-center justify-between gap-4 group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-13 h-13 rounded-2xl bg-indigo-50 text-indigo-700 font-display font-black text-xl flex items-center justify-center border border-indigo-100 shrink-0 group-hover:scale-105 transition-transform">
                      {item.accuracyPercentage}%
                    </div>

                    <div>
                      <div className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                        <span>{item.childName || 'Criança'}</span>
                        <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-600">
                          {item.mode === 'complete' ? 'Completa' : `Nível ${item.mode}`}
                        </span>
                      </div>

                      <div className="text-xs text-slate-500 flex flex-wrap items-center gap-2 sm:gap-3 mt-1.5">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          {dateStr} às {timeStr}
                        </span>
                        <span>•</span>
                        <span className="font-semibold text-slate-600">
                          {item.correctCount}/{item.totalItems} acertos
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={(e) => handleDelete(item.id, e)}
                      className="p-2 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                      title="Excluir do histórico"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
