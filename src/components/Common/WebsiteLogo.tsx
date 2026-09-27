import React from 'react';
import { useBot } from '../../context/BotContext';

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
  const botCtx = useBot();
  const settings = botCtx?.settings;

  const logoImg = settings?.web_logo_url?.trim() || '/logo.svg';
  const siteTitle = settings?.web_site_title?.trim() || 'KALAM FF PANEL';
  const siteTagline = settings?.web_site_tagline?.trim() || 'VIP STORE & BOT ENGINE';

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
      {/* Emblem Icon / Custom Logo Image */}
      <div className={`relative shrink-0 ${sizeMap[size]} group flex items-center justify-center`}>
        {/* Ambient Glow Effect */}
        {animated && (
          <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/40 via-blue-500/40 to-indigo-500/40 rounded-2xl blur-sm group-hover:blur-md transition-all duration-300 opacity-80" />
        )}

        <img
          src={logoImg}
          alt={siteTitle}
          className="relative w-full h-full object-contain filter drop-shadow-[0_2px_8px_rgba(6,182,212,0.4)] rounded-xl"
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/logo.svg';
          }}
          referrerPolicy="no-referrer"
        />
      </div>

      {/* Brand Text */}
      {showText && (
        <div className="flex flex-col leading-tight min-w-0">
          <div className={`font-black tracking-tight flex items-center gap-1 sm:gap-1.5 whitespace-nowrap ${textSizeMap[size]}`}>
            <span className="bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-400 bg-clip-text text-transparent font-extrabold uppercase">
              {siteTitle}
            </span>
            <span className="text-[9px] sm:text-[10px] bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black px-1 sm:px-1.5 py-0.5 rounded shadow-sm">
              VIP
            </span>
          </div>

          {showSubtitle && (
            <div className="text-[9px] sm:text-[10px] font-mono font-medium text-cyan-300/80 tracking-wider hidden sm:flex items-center gap-1 uppercase truncate max-w-[200px]">
              <span>{siteTagline}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
