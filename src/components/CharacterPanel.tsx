import React, { useState } from 'react';
import { Player } from '../types.ts';

interface CharacterPanelProps {
  player: Player;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  isAwakened?: boolean;
  className?: string;
  showBadge?: boolean;
}

const CHARACTER_ACCENTS: Record<string, { accentColor: string; number: number }> = {
  'isagi-yoichi': { accentColor: '#00f0ff', number: 11 },
  'michael-kaiser': { accentColor: '#3b82f6', number: 10 },
  'rin-itoshi': { accentColor: '#10b981', number: 9 },
  'meguru-bachira': { accentColor: '#eab308', number: 8 },
  'hyoma-chigiri': { accentColor: '#ec4899', number: 44 },
  'seishiro-nagi': { accentColor: '#cbd5e1', number: 7 },
  'reo-mikage': { accentColor: '#a855f7', number: 14 },
  'shoei-barou': { accentColor: '#f97316', number: 13 },
  'kunigami-rensuke': { accentColor: '#ea580c', number: 50 },
  'oliver-aiku': { accentColor: '#059669', number: 2 },
  'sae-itoshi': { accentColor: '#06b6d4', number: 10 },
  'shidou-ryusei': { accentColor: '#f43f5e', number: 11 },
  'tabito-karasu': { accentColor: '#0284c7', number: 6 },
  'eita-otoya': { accentColor: '#14b8a6', number: 17 },
  'kenyu-yukimiya': { accentColor: '#f59e0b', number: 23 },
  'alexis-ness': { accentColor: '#ec4899', number: 8 },
  'don-lorenzo': { accentColor: '#eab308', number: 4 },
  'marc-snuffy': { accentColor: '#6366f1', number: 10 },
  'noel-noa': { accentColor: '#dc2626', number: 9 },
  'julian-loki': { accentColor: '#38bdf8', number: 7 },
  'chris-prince': { accentColor: '#06b6d4', number: 7 },
  lavinho: { accentColor: '#eab308', number: 11 },
  'kurona-ranze': { accentColor: '#f43f5e', number: 16 },
  'hiori-yo': { accentColor: '#38bdf8', number: 27 },
  'jinpachi-ego': { accentColor: '#00f0ff', number: 0 },
};

export const CharacterPanel: React.FC<CharacterPanelProps> = ({
  player,
  size = 'md',
  isAwakened = false,
  className = '',
  showBadge = true,
}) => {
  const [imgError, setImgError] = useState(false);

  const meta = CHARACTER_ACCENTS[player.id] || {
    accentColor: player.portrait_color || '#00f0ff',
    number: player.jersey_number || 11,
  };

  const currentAccent = isAwakened ? '#c084fc' : meta.accentColor;
  const portraitSrc =
    player.portrait && player.portrait.startsWith('/portraits/')
      ? player.portrait
      : `/portraits/${player.id}.png`;

  if (size === 'sm') {
    return (
      <div
        className={`relative w-full h-full overflow-hidden select-none bg-slate-950 ${className}`}
        title={player.name}
      >
        {!imgError ? (
          <img
            src={portraitSrc}
            alt={player.name}
            loading="lazy"
            onError={() => setImgError(true)}
            className="w-full h-full object-cover object-center"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center font-heading font-black text-xs text-white"
            style={{ backgroundColor: `${currentAccent}33` }}
          >
            {player.name.slice(0, 2).toUpperCase()}
          </div>
        )}
      </div>
    );
  }

  const sizeClasses = {
    md: 'w-20 h-20 rounded-2xl border-2',
    lg: 'w-28 h-28 sm:w-32 sm:h-32 rounded-2xl border-2',
    xl: 'w-36 h-36 sm:w-44 sm:h-44 rounded-3xl border-2',
  };

  return (
    <div
      className={`relative overflow-hidden select-none bg-slate-950 shadow-xl transition-all duration-300 ${sizeClasses[size]} ${className}`}
      style={{
        borderColor: currentAccent,
        boxShadow: isAwakened
          ? '0 0 24px rgba(192, 132, 252, 0.55), inset 0 0 14px rgba(192, 132, 252, 0.3)'
          : `0 0 16px ${currentAccent}40, inset 0 0 8px ${currentAccent}25`,
      }}
    >
      {!imgError ? (
        <img
          src={portraitSrc}
          alt={player.name}
          loading="lazy"
          onError={() => setImgError(true)}
          className="w-full h-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
        />
      ) : (
        <div
          className="w-full h-full flex items-center justify-center font-heading font-black text-xl text-white"
          style={{ backgroundColor: `${currentAccent}33` }}
        >
          {player.name.slice(0, 2).toUpperCase()}
        </div>
      )}

      {/* Subtle Flow / Zero State Awakening aura overlay */}
      {isAwakened && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(circle at center, transparent 52%, rgba(168, 85, 247, 0.42) 100%)',
          }}
        />
      )}

      {/* Compact Jersey # tag tucked cleanly in bottom-left corner for lg/xl */}
      {showBadge && (size === 'lg' || size === 'xl') && meta.number > 0 && (
        <span
          className="absolute bottom-1.5 left-1.5 z-10 text-[10px] font-mono font-bold text-white bg-slate-950/80 px-1.5 py-0.5 rounded border border-slate-700/80 leading-none pointer-events-none"
          style={{ borderColor: `${currentAccent}80` }}
        >
          #{meta.number}
        </span>
      )}
    </div>
  );
};
