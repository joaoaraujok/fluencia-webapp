import React from 'react';

interface FluenciaLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'full' | 'icon' | 'mark';
  showSubtitle?: boolean;
  className?: string;
  isDark?: boolean;
}

export const FluenciaLogo: React.FC<FluenciaLogoProps> = ({
  size = 'md',
  variant = 'full',
  showSubtitle = true,
  className = '',
  isDark = false
}) => {
  // Configuração de tamanhos do ícone
  const iconDimensions = {
    sm: 'w-8 h-8 rounded-xl',
    md: 'w-10 h-10 rounded-2xl',
    lg: 'w-14 h-14 rounded-2xl sm:rounded-3xl',
    xl: 'w-20 h-20 rounded-3xl'
  }[size];

  // Configuração de tipografia do nome
  const textStyles = {
    sm: {
      title: 'text-base font-extrabold tracking-tight leading-none',
      tag: 'text-[9px] tracking-wider'
    },
    md: {
      title: 'text-lg sm:text-xl font-black tracking-tight leading-none',
      tag: 'text-[10px] tracking-widest'
    },
    lg: {
      title: 'text-2xl sm:text-3xl font-black tracking-tight leading-tight',
      tag: 'text-xs tracking-wider'
    },
    xl: {
      title: 'text-4xl sm:text-5xl font-black tracking-tight leading-tight',
      tag: 'text-sm tracking-widest'
    }
  }[size];

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Ícone Vetorial Exclusivo FluencIA */}
      <div
        className={`${iconDimensions} relative bg-gradient-to-br from-indigo-600 via-indigo-500 to-purple-600 p-1.5 shadow-md shadow-indigo-500/20 flex items-center justify-center shrink-0 overflow-hidden group-hover:scale-105 transition-transform duration-300`}
      >
        {/* Brilho de fundo sutil */}
        <div className="absolute inset-0 bg-radial from-sky-400/30 via-transparent to-transparent opacity-80" />

        <svg
          viewBox="0 0 100 100"
          className="w-full h-full relative z-10 drop-shadow-xs"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Balão estilizado de voz */}
          <path
            d="M20 22C20 15.3726 25.3726 10 32 10H68C74.6274 10 80 15.3726 80 22V56C80 62.6274 74.6274 68 68 68H44L28 82C25.5 84.2 20 82.2 20 78V22Z"
            fill="white"
          />

          {/* Barras de frequência da fala (Fluência) */}
          <rect x="29" y="32" width="5" height="16" rx="2.5" fill="#0284C7" />
          <rect x="38" y="24" width="5" height="30" rx="2.5" fill="#10B981" />
          <rect x="47" y="18" width="5" height="42" rx="2.5" fill="#F59E0B" />
          <rect x="56" y="24" width="5" height="30" rx="2.5" fill="#EC4899" />
          <rect x="65" y="32" width="5" height="16" rx="2.5" fill="#8B5CF6" />

          {/* Sorriso empático */}
          <path
            d="M37 57C43 62 57 62 63 57"
            stroke="#6366F1"
            strokeWidth="2.5"
            strokeLinecap="round"
          />

          {/* Estrela de Inteligência Artificial (✦) */}
          <path
            d="M75 8Q75 16 83 16Q75 16 75 24Q75 16 67 16Q75 16 75 8Z"
            fill="url(#starGrad)"
          />
          <circle cx="75" cy="16" r="2" fill="#FFFFFF" />

          <defs>
            <linearGradient id="starGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#FDE047" />
              <stop offset="100%" stop-color="#F59E0B" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Tipografia da Marca FluencIA */}
      {variant !== 'icon' && (
        <div className="flex flex-col">
          <div className="flex items-baseline">
            <span
              className={`font-display font-black tracking-tight ${
                isDark ? 'text-white' : 'text-slate-900'
              } ${textStyles.title}`}
            >
              Fluenc
            </span>
            <span
              className={`font-display font-black bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 bg-clip-text text-transparent drop-shadow-xs ml-0.5 ${textStyles.title}`}
            >
              IA
            </span>
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-indigo-500 ml-0.5 mb-1 animate-pulse" />
          </div>

          {showSubtitle && (
            <span
              className={`font-bold uppercase text-indigo-600 ${textStyles.tag} mt-0.5`}
            >
              Fluência Oral Infantil
            </span>
          )}
        </div>
      )}
    </div>
  );
};
