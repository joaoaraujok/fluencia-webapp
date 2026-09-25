import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  MicOff,
  Clock,
  ArrowRight,
  ShieldAlert
} from 'lucide-react';
import { EvaluationItemResult } from '../../types/evaluation';
import { RecognitionStatus } from '../../types/speech';

interface DetailedItemListProps {
  items: EvaluationItemResult[];
}

export const DetailedItemList: React.FC<DetailedItemListProps> = ({ items }) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  const renderStatusBadge = (status: RecognitionStatus, isTimeExceeded?: boolean) => {
    if (isTimeExceeded) {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
          <Clock className="w-3 h-3" />
          Tempo excedido
        </span>
      );
    }

    switch (status) {
      case 'CORRETO':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3" />
            Correto
          </span>
        );
      case 'POSSIVELMENTE_CORRETO':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
            <AlertTriangle className="w-3 h-3" />
            Possivelmente correto
          </span>
        );
      case 'SEM_RESPOSTA':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
            <MicOff className="w-3 h-3" />
            Sem resposta
          </span>
        );
      case 'INCORRETO':
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="w-3 h-3" />
            Incorreto
          </span>
        );
    }
  };

  return (
    <div className="card p-5 sm:p-7">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between text-left group cursor-pointer"
      >
        <div>
          <h3 className="font-display font-bold text-lg sm:text-xl text-slate-900 group-hover:text-indigo-600 transition-colors flex items-center gap-2">
            <span>Rastreabilidade & Registro de Respostas</span>
            <span className="text-xs font-black bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
              {items.length} itens
            </span>
          </h3>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Dados brutos com resposta esperada, emissão da criança, tempo de reação e análise fonética (Regras 15 e 22)
          </p>
        </div>
        <div className="p-2 rounded-xl bg-slate-100 group-hover:bg-indigo-50 text-slate-600 group-hover:text-indigo-600 transition-colors">
          {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </div>
      </button>

      {isExpanded && (
        <div className="mt-5 space-y-2.5 border-t border-slate-100 pt-4">
          {items.map((item, index) => {
            const reactionTimeSec = item.reactionTimeMs ? (item.reactionTimeMs / 1000).toFixed(1) : null;
            const durationSec = item.responseTimeMs ? (item.responseTimeMs / 1000).toFixed(1) : '0.0';

            return (
              <div
                key={index}
                className="p-3.5 sm:p-4 rounded-2xl bg-slate-50/90 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm hover:border-indigo-200 transition-colors"
              >
                <div className="flex items-start sm:items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-white border border-slate-300 text-slate-600 text-xs font-extrabold flex items-center justify-center shrink-0 mt-0.5 sm:mt-0 shadow-2xs">
                    {index + 1}
                  </span>

                  <div>
                    {/* Linha Principal de Comparação: Esperado -> Ouvido */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-display font-black text-slate-900 text-base">
                        {item.targetText}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className={`font-mono text-sm font-bold ${
                        item.status === 'CORRETO'
                          ? 'text-emerald-700'
                          : item.status === 'SEM_RESPOSTA'
                          ? 'text-slate-400 italic'
                          : 'text-rose-600'
                      }`}>
                        {item.transcript ? `"${item.transcript}"` : '(sem resposta sonoro)'}
                      </span>

                      {item.type && (
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-600">
                          {item.type === 'letter' ? 'Letra' : item.type === 'word' ? 'Palavra' : item.type === 'text' ? 'Texto' : 'Frase'}
                        </span>
                      )}
                    </div>

                    {/* Linha Pedagógica: Tipo de erro e métricas temporais */}
                    <div className="text-xs text-slate-500 flex flex-wrap items-center gap-2 mt-1">
                      {reactionTimeSec && (
                        <span>Reação: <strong>{reactionTimeSec}s</strong></span>
                      )}
                      <span>•</span>
                      <span>Duração total: <strong>{durationSec}s</strong></span>

                      {item.observedError && (
                        <>
                          <span>•</span>
                          <span className="text-rose-600 font-semibold bg-rose-50 px-2 py-0.5 rounded border border-rose-100">
                            {item.observedError}
                          </span>
                        </>
                      )}

                      {item.confidenceNote && (
                        <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 font-medium flex items-center gap-1">
                          <ShieldAlert className="w-3 h-3" />
                          <span>{item.confidenceNote}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="shrink-0 self-end sm:self-center">
                  {renderStatusBadge(item.status, item.isTimeLimitReached)}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
