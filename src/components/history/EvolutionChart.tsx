import React from 'react';
import { EvaluationSession } from '../../types/evaluation';

interface EvolutionChartProps {
  sessions: EvaluationSession[];
}

export const EvolutionChart: React.FC<EvolutionChartProps> = ({ sessions }) => {
  if (sessions.length < 2) {
    return (
      <div className="p-6 text-center text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
        <p className="text-sm font-semibold">
          Realize mais de uma avaliação para visualizar a curva de evolução ao longo do tempo.
        </p>
      </div>
    );
  }

  // Ordena cronologicamente para a curva de evolução
  const chronological = [...sessions].sort((a, b) => a.timestamp - b.timestamp);
  const dataPoints = chronological.map((s, idx) => ({
    label: `Avaliação ${idx + 1}`,
    value: s.accuracyPercentage,
    date: new Date(s.timestamp).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
  }));

  const chartHeight = 190;
  const chartWidth = 560;
  const paddingX = 48;
  const paddingY = 38;

  const points = dataPoints.map((dp, idx) => {
    const x = paddingX + (idx / (dataPoints.length - 1)) * (chartWidth - paddingX * 2);
    const y = chartHeight - paddingY - (dp.value / 100) * (chartHeight - paddingY * 2);
    return { ...dp, x, y };
  });

  const svgPath = points.reduce((acc, p, idx) => {
    return idx === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
  }, '');

  const areaPath = points.length > 0
    ? `${svgPath} L ${points[points.length - 1].x} ${chartHeight - paddingY} L ${points[0].x} ${chartHeight - paddingY} Z`
    : '';

  return (
    <div className="w-full overflow-x-auto py-2">
      <div className="min-w-[460px]">
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          className="w-full h-auto overflow-visible"
        >
          <defs>
            <linearGradient id="chartGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#818CF8" />
              <stop offset="100%" stopColor="#4F46E5" />
            </linearGradient>
            <linearGradient id="areaGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#6366F1" stopOpacity="0.16" />
              <stop offset="100%" stopColor="#6366F1" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Linhas de grade horizontais (0%, 50%, 100%) */}
          <line
            x1={paddingX}
            y1={chartHeight - paddingY}
            x2={chartWidth - paddingX}
            y2={chartHeight - paddingY}
            stroke="#E2E8F0"
            strokeDasharray="4"
          />
          <line
            x1={paddingX}
            y1={(chartHeight - paddingY * 2) / 2 + paddingY}
            x2={chartWidth - paddingX}
            y2={(chartHeight - paddingY * 2) / 2 + paddingY}
            stroke="#E2E8F0"
            strokeDasharray="4"
          />
          <line
            x1={paddingX}
            y1={paddingY}
            x2={chartWidth - paddingX}
            y2={paddingY}
            stroke="#E2E8F0"
            strokeDasharray="4"
          />

          {/* Rótulos de porcentagem na esquerda */}
          <text x={paddingX - 10} y={chartHeight - paddingY + 3} textAnchor="end" fontSize="10" fill="#94A3B8" fontWeight="bold">0%</text>
          <text x={paddingX - 10} y={(chartHeight - paddingY * 2) / 2 + paddingY + 3} textAnchor="end" fontSize="10" fill="#94A3B8" fontWeight="bold">50%</text>
          <text x={paddingX - 10} y={paddingY + 3} textAnchor="end" fontSize="10" fill="#94A3B8" fontWeight="bold">100%</text>

          {/* Área sombreada suave sob a curva */}
          <path
            d={areaPath}
            fill="url(#areaGrad)"
          />

          {/* Linha da Curva de Evolução */}
          <path
            d={svgPath}
            fill="none"
            stroke="url(#chartGrad)"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Pontos de Destaque */}
          {points.map((p, idx) => (
            <g key={idx} className="group">
              <circle
                cx={p.x}
                cy={p.y}
                r="5.5"
                fill="#FFFFFF"
                stroke="#4F46E5"
                strokeWidth="3"
                className="transition-transform group-hover:scale-125"
              />
              {/* Badge sutil com porcentagem */}
              <text
                x={p.x}
                y={p.y - 12}
                textAnchor="middle"
                fontSize="11"
                fontWeight="800"
                fill="#312E81"
              >
                {p.value}%
              </text>
              <text
                x={p.x}
                y={chartHeight - 12}
                textAnchor="middle"
                fontSize="10"
                fontWeight="600"
                fill="#64748B"
              >
                {p.date}
              </text>
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
};
