import React from 'react';
import { Sparkles, BookOpen, Lightbulb } from 'lucide-react';
import { PracticeRecommendation } from '../../types/evaluation';

interface PracticeReportProps {
  recommendations: PracticeRecommendation[];
}

export const PracticeReport: React.FC<PracticeReportProps> = ({ recommendations }) => {
  if (recommendations.length === 0) return null;

  return (
    <div className="card p-6 sm:p-8 border-indigo-100/80 bg-gradient-to-br from-white via-indigo-50/20 to-slate-50">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 shadow-2xs">
          <Lightbulb className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-display font-bold text-xl text-slate-900 leading-tight">
            O que praticar
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Orientações pedagógicas baseadas nas respostas e fonemas observados
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {recommendations.map((rec) => (
          <div
            key={rec.id}
            className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs hover:border-indigo-200 hover:shadow-xs transition-all space-y-3"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h4 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>{rec.title}</span>
              </h4>
              <span className="self-start sm:self-auto text-[11px] font-extrabold uppercase px-3 py-1 rounded-full bg-slate-100 text-slate-600 tracking-wider">
                {rec.category}
              </span>
            </div>

            <p className="text-sm text-slate-600 font-medium leading-relaxed">
              {rec.description}
            </p>

            {rec.recommendedExamples && rec.recommendedExamples.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-slate-100">
                <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5 mr-1">
                  <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
                  Sugestões de palavras:
                </span>
                {rec.recommendedExamples.map((example, idx) => (
                  <span
                    key={idx}
                    className="inline-block text-xs font-bold bg-indigo-50 text-indigo-700 px-3 py-1 rounded-xl border border-indigo-100/80 shadow-2xs"
                  >
                    {example}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
