import React, { useState } from 'react';
import { ChevronDown, ChevronUp, CheckCircle2, AlertTriangle, XCircle, MicOff } from 'lucide-react';
import { EvaluationItemResult } from '../../types/evaluation';
import { RecognitionStatus } from '../../types/speech';

interface DetailedItemListProps {
  items: EvaluationItemResult[];
}

export const DetailedItemList: React.FC<DetailedItemListProps> = ({ items }) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  const renderStatusBadge = (status: RecognitionStatus) => {
    switch (status) {
      case 'CORRETO':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Correto
          </span>
        );
      case 'POSSIVELMENTE_CORRETO':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
            <AlertTriangle className="w-3.5 h-3.5" />
            Possivelmente correto
          </span>
        );
      case 'SEM_RESPOSTA':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
            <MicOff className="w-3.5 h-3.5" />
            Sem resposta
          </span>
        );
      case 'INCORRETO':
      default:
        return (
          <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="w-3.5 h-3.5" />
            Não reconhecido
          </span>
        );
    }
  };

  return (
    <div className="card">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between text-left group"
      >
        <div>
          <h3 className="font-display font-bold text-lg text-slate-800 group-hover:text-indigo-600 transition-colors">
            Detalhamento Item a Item ({items.length} itens)
          </h3>
          <p className="text-xs text-slate-500 font-medium">
            Visualize o que foi esperado e o que foi capturado pelo microfone
          </p>
        </div>
        <div className="p-2 rounded-xl bg-slate-100 group-hover:bg-indigo-50 text-slate-600 group-hover:text-indigo-600 transition-colors">
          {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </div>
      </button>

      {isExpanded && (
        <div className="mt-5 space-y-2.5 border-t border-slate-100 pt-4">
          {items.map((item, index) => (
            <div
              key={index}
              className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm"
            >
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-white border border-slate-300 text-slate-600 text-xs font-extrabold flex items-center justify-center shrink-0">
                  {index + 1}
                </span>
                <div>
                  <div className="font-black text-slate-800 text-base">
                    {item.targetText}
                  </div>
                  <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                    <span>Ouvido: <strong>{item.transcript ? `"${item.transcript}"` : '(silêncio)'}</strong></span>
                    <span>•</span>
                    <span>{(item.responseTimeMs / 1000).toFixed(1)}s</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                {renderStatusBadge(item.status)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
