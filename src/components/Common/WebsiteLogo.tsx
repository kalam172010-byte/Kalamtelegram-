import React from 'react';

interface WebsiteLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  showSubtitle?: boolean;
  className?: string;
  onClick?: () => void;
  animated?: boolean;
}

export const WebsiteLogo: React.FC<WebsiteLogoProps> = ({
  size = 'md',
  showText = true,
  showSubtitle = true,
  className = '',
  onClick,
  animated = true
}) => {
  const sizeMap = {
    xs: 'w-6 h-6',
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  const textSizeMap = {
    xs: 'text-xs',
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-2xl'
  };

  return (
    <div
      onClick={onClick}
      className={`inline-flex items-center gap-2.5 select-none ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      {/* Emblem SVG Icon */}
      <div className={`relative shrink-0 ${sizeMap[size]} group`}>
        {/* Ambient Glow Effect */}
        {animated && (
          <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/40 via-blue-500/40 to-indigo-500/40 rounded-2xl blur-sm group-hover:blur-md transition-all duration-300 opacity-80" />
        )}

        <img
          src="/logo.svg"
          alt="Kalam FF Panel Logo"
          className="relative w-full h-full object-contain filter drop-shadow-[0_2px_8px_rgba(6,182,212,0.4)]"
          referrerPolicy="no-referrer"
        />
      </div>

      {/* Brand Text */}
      {showText && (
        <div className="flex flex-col leading-tight min-w-0">
          <div className={`font-black tracking-tight flex items-center gap-1 sm:gap-1.5 whitespace-nowrap ${textSizeMap[size]}`}>
            <span className="bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-400 bg-clip-text text-transparent font-extrabold uppercase">
              KALAM
            </span>
            <span className="text-white font-extrabold hidden min-[400px]:inline">
              PANEL
            </span>
            <span className="text-[9px] sm:text-[10px] bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black px-1 sm:px-1.5 py-0.5 rounded shadow-sm">
              VIP
            </span>
          </div>

          {showSubtitle && (
            <div className="text-[9px] sm:text-[10px] font-mono font-medium text-cyan-300/80 tracking-wider hidden sm:flex items-center gap-1">
              <span>STORE & BOT ENGINE</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
