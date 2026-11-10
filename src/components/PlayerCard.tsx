import React from 'react';
import { Player } from '../types.ts';
import { useSpoilers } from '../context/SpoilerContext.tsx';
import { Eye, Swords, Heart, Zap, Sparkles, ChevronRight, ShieldAlert } from 'lucide-react';

interface PlayerCardProps {
  player: Player;
  onSelect: (player: Player) => void;
  onCompare?: (player: Player) => void;
  onLikeToggle?: (player: Player) => void;
  isLiked?: boolean;
}

export const PlayerCard: React.FC<PlayerCardProps> = ({
  player,
  onSelect,
  onCompare,
  onLikeToggle,
  isLiked = false,
}) => {
  const { spoilersEnabled } = useSpoilers();

  const isSpoilerPlayer = !spoilersEnabled && player.is_spoiler;
  const displayName = isSpoilerPlayer ? '??? [CLASSIFIED]' : player.name;
  const displayJapanese = isSpoilerPlayer ? '非公開' : player.japanese_name;
  const displayWeapon = isSpoilerPlayer ? 'Restricted Weapon Data' : player.primary_weapon;

  // Check if any stat > 99
  const exStats = Object.entries(player.stats).filter(([, val]) => val > 99);
  const hasExStat = exStats.length > 0;

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'S+':
        return 'bg-gradient-to-r from-amber-500 to-yellow-300 text-slate-950 border-amber-300';
      case 'S':
        return 'bg-gradient-to-r from-cyan-500 to-blue-500 text-slate-950 border-cyan-300';
      case 'A':
        return 'bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 border-emerald-300';
      case 'B':
        return 'bg-gradient-to-r from-indigo-500 to-purple-500 text-slate-100 border-indigo-300';
      default:
        return 'bg-slate-700 text-slate-200 border-slate-600';
    }
  };

  const getEyeBadge = (eye: string) => {
    if (eye === 'Metavision') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-cyan-950 text-cyan-300 border border-cyan-500/50 shadow-sm">
          <Eye className="w-3 h-3 text-cyan-400" /> MV
        </span>
      );
    }
    if (eye === 'Predator Eye') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-orange-950 text-orange-300 border border-orange-500/50 shadow-sm">
          <Zap className="w-3 h-3 text-orange-400" /> PREDATOR
        </span>
      );
    }
    if (eye === 'Destroyer Eye') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-rose-950 text-rose-300 border border-rose-500/50 shadow-sm">
          <Sparkles className="w-3 h-3 text-rose-400" /> DESTROYER
        </span>
      );
    }
    return null;
  };

  return (
    <div className="group relative flex flex-col justify-between rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-cyan-500/60 p-4 transition-all duration-300 hover:shadow-xl hover:shadow-cyan-950/40 hover:-translate-y-1">
      {/* Top Bar: Team, Position, Eye, Rank */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] font-bold font-mono text-slate-300 border border-slate-700">
              {player.position}
            </span>
            <span className="text-xs font-mono font-medium text-slate-400 truncate max-w-[110px]">
              {player.team}
            </span>
            {getEyeBadge(player.primary_eye_type)}
          </div>

          <div className={`px-2.5 py-0.5 rounded text-xs font-black font-heading tracking-wider border shadow-sm ${getTierColor(player.rank_tier)}`}>
            {player.rank_tier}
          </div>
        </div>

        {/* Portrait & Rating Section */}
        <div className="relative flex items-center gap-3.5 mb-3">
          {/* Hexagon/Cyber styled avatar */}
          <div className="relative shrink-0 w-16 h-16 sm:w-18 sm:h-18 rounded-xl overflow-hidden border-2 border-slate-700 group-hover:border-cyan-400 transition-colors bg-slate-950">
            <img
              src={player.portrait}
              alt={player.name}
              className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 ${isSpoilerPlayer ? 'filter blur-md brightness-50' : ''}`}
            />
            {isSpoilerPlayer && (
              <div className="absolute inset-0 flex items-center justify-center text-rose-400 bg-black/60">
                <ShieldAlert className="w-6 h-6" />
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-black font-heading text-slate-100 group-hover:text-cyan-400 transition-colors">
                {player.overall_rating}
              </span>
              <span className="text-[10px] uppercase font-mono text-slate-500 font-bold">OVR</span>
            </div>
            <h4 className="text-base font-bold font-heading text-slate-100 truncate group-hover:text-cyan-300 transition-colors">
              {displayName}
            </h4>
            <p className="text-[11px] text-slate-400 font-mono truncate">
              {displayJapanese}
            </p>
          </div>
        </div>

        {/* Primary Weapon */}
        <div className="mb-3 p-2 rounded-lg bg-slate-950/70 border border-slate-800/80">
          <div className="text-[10px] uppercase font-mono text-slate-400 flex items-center gap-1 mb-0.5">
            <Swords className="w-3 h-3 text-cyan-400" />
            PRIMARY WEAPON
          </div>
          <div className="text-xs font-semibold text-slate-200 truncate">
            {displayWeapon}
          </div>
        </div>

        {/* EX Stat Highlight badge if any stat > 99 */}
        {hasExStat && (
          <div className="mb-3 px-2 py-1 rounded bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] font-mono flex items-center justify-between">
            <span className="flex items-center gap-1 font-bold">
              <Sparkles className="w-3 h-3 text-amber-400 animate-spin" />
              EX STAT OVERDRIVE:
            </span>
            <span className="font-heading font-black text-amber-400 text-glow-gold">
              {exStats.map(([k, v]) => `${k.toUpperCase()} ${v}`).join(' | ')}
            </span>
          </div>
        )}

        {/* Mini stats grid */}
        <div className="grid grid-cols-3 gap-1 text-center text-[10px] font-mono mb-3 bg-slate-950/40 p-1.5 rounded-lg border border-slate-800/40">
          <div>
            <span className="text-slate-500 block">SHT</span>
            <span className={`font-bold ${player.stats.shoot > 99 ? 'text-amber-400 font-black' : 'text-slate-200'}`}>
              {player.stats.shoot}
            </span>
          </div>
          <div>
            <span className="text-slate-500 block">SPD</span>
            <span className={`font-bold ${player.stats.speed > 99 ? 'text-amber-400 font-black' : 'text-slate-200'}`}>
              {player.stats.speed}
            </span>
          </div>
          <div>
            <span className="text-slate-500 block">DRI</span>
            <span className={`font-bold ${player.stats.dribble > 99 ? 'text-amber-400 font-black' : 'text-slate-200'}`}>
              {player.stats.dribble}
            </span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-1.5">
        <button
          onClick={() => onLikeToggle?.(player)}
          className={`p-2 rounded-lg border transition-colors flex items-center gap-1 text-xs font-mono ${
            isLiked
              ? 'bg-rose-500/20 border-rose-500/50 text-rose-400'
              : 'border-slate-800 hover:border-slate-700 text-slate-400 hover:text-rose-400'
          }`}
          title="Egoist Endorsement (Like)"
        >
          <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-rose-400 text-rose-400' : ''}`} />
          <span>{player.like_count}</span>
        </button>

        {onCompare && (
          <button
            onClick={() => onCompare(player)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-800 hover:border-cyan-500/40 text-slate-400 hover:text-cyan-300 text-xs font-mono transition-colors"
            title="Duel Compare"
          >
            vs Duel
          </button>
        )}

        <button
          onClick={() => onSelect(player)}
          className="flex-1 px-3 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500 text-cyan-300 hover:text-slate-950 border border-cyan-500/30 hover:border-cyan-400 font-bold text-xs uppercase font-heading tracking-wider transition-all flex items-center justify-center gap-1"
        >
          Scout <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
