import React, { useState } from 'react';
import { Player } from '../types.ts';
import { EgoRadarChart } from '../components/EgoRadarChart.tsx';
import { AdaptabilityGauge } from '../components/AdaptabilityGauge.tsx';
import { UserNotesModule } from '../components/UserNotesModule.tsx';
import { useSpoilers } from '../context/SpoilerContext.tsx';
import {
  ArrowLeft,
  Heart,
  Swords,
  Zap,
  Sparkles,
  Eye,
  Brain,
  Shield,
  Activity,
  Award,
  ChevronRight,
  Flame,
} from 'lucide-react';

interface PlayerDetailViewProps {
  player: Player;
  onBack: () => void;
  onCompareWithPlayer: (player: Player) => void;
  onLikeToggle: (player: Player) => void;
  isLiked?: boolean;
}

export const PlayerDetailView: React.FC<PlayerDetailViewProps> = ({
  player,
  onBack,
  onCompareWithPlayer,
  onLikeToggle,
  isLiked = false,
}) => {
  const { spoilersEnabled } = useSpoilers();

  // Zero State Awakening state toggle
  const [isAwakened, setIsAwakened] = useState<boolean>(false);

  // Can show toggle ONLY when stats_awakened != null AND spoilers_enabled == true
  const canShowZeroStateToggle = player.stats_awakened !== null && spoilersEnabled;

  // Active stats depends on awakening toggle
  const currentStats = isAwakened && player.stats_awakened ? player.stats_awakened : player.stats;

  const statItems = [
    { label: 'OFFENSE', value: currentStats.offense, color: 'text-rose-400' },
    { label: 'SHOOT', value: currentStats.shoot, color: 'text-amber-400' },
    { label: 'DRIBBLE', value: currentStats.dribble, color: 'text-cyan-400' },
    { label: 'PASS', value: currentStats.pass, color: 'text-blue-400' },
    { label: 'DEFENSE', value: currentStats.defense, color: 'text-emerald-400' },
    { label: 'SPEED', value: currentStats.speed, color: 'text-purple-400' },
  ];

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Top Breadcrumb & Actions Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-cyan-300 text-xs font-mono transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Scout Hub
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onLikeToggle(player)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-mono flex items-center gap-1.5 transition-all ${
              isLiked
                ? 'bg-rose-500/20 border-rose-500/50 text-rose-400'
                : 'bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-300'
            }`}
          >
            <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-rose-400 text-rose-400' : ''}`} />
            <span>{player.like_count} Likes</span>
          </button>

          <button
            onClick={() => onCompareWithPlayer(player)}
            className="px-4 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold font-heading text-xs uppercase tracking-wider flex items-center gap-1.5 glow-cyan-sm transition-all"
          >
            <Swords className="w-3.5 h-3.5" />
            Duel in Ego Simulator
          </button>
        </div>
      </div>

      {/* Main Profile Header Card */}
      <div className={`relative rounded-3xl overflow-hidden p-6 md:p-8 border transition-all duration-500 ${
        isAwakened
          ? 'bg-gradient-to-br from-purple-950/60 via-slate-950 to-slate-900 border-purple-500/60 shadow-2xl shadow-purple-950/50'
          : 'bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 border-cyan-500/40 shadow-2xl'
      }`}>
        <div className="flex flex-col md:flex-row gap-6 md:items-center justify-between">
          <div className="flex items-center gap-5">
            {/* Hexagon/Cyber styled avatar with animated aura when awakened */}
            <div className={`relative shrink-0 w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden border-2 bg-slate-950 ${
              isAwakened ? 'border-purple-400 glow-cyan ring-4 ring-purple-500/30' : 'border-cyan-400 glow-cyan-sm'
            }`}>
              <img
                src={player.portrait}
                alt={player.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-slate-950/90 text-slate-100 text-[10px] font-mono font-bold border border-slate-700">
                #{player.jersey_number || 11}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded text-xs font-black font-heading bg-amber-400 text-slate-950">
                  {player.rank_tier} TIER
                </span>
                <span className="px-2.5 py-0.5 rounded bg-slate-800 text-xs font-mono font-bold text-slate-300">
                  {player.position}
                </span>
                {player.primary_eye_type !== 'None' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded bg-cyan-950 border border-cyan-500/40 text-cyan-300 text-xs font-mono font-bold">
                    <Eye className="w-3.5 h-3.5 text-cyan-400" /> {player.primary_eye_type}
                  </span>
                )}
              </div>

              <h1 className="text-2xl sm:text-4xl font-black font-heading text-slate-100 tracking-tight">
                {player.name}
              </h1>
              <p className="text-sm font-mono text-cyan-400 font-bold">
                {player.japanese_name} • {player.team}
              </p>
            </div>
          </div>

          {/* Right: Overall Rating & Zero State Awakening Toggle */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="px-5 py-3 rounded-2xl bg-slate-950/80 border border-slate-800 text-center">
              <div className="text-[11px] font-mono text-slate-400 uppercase font-semibold">
                {isAwakened ? 'AWAKENED OVR' : 'OVERALL RATING'}
              </div>
              <div className={`text-4xl font-black font-heading ${
                isAwakened ? 'text-purple-400 text-glow-cyan' : 'text-cyan-400 text-glow-cyan'
              }`}>
                {isAwakened ? player.overall_rating + 4 : player.overall_rating}
              </div>
            </div>

            {/* Zero State Awakening Toggle Button */}
            {canShowZeroStateToggle && (
              <div className="flex flex-col items-start sm:items-center">
                <button
                  onClick={() => setIsAwakened(!isAwakened)}
                  className={`px-4 py-3 rounded-2xl border text-xs font-heading font-black tracking-wider uppercase transition-all flex items-center gap-2 cursor-pointer ${
                    isAwakened
                      ? 'bg-purple-600 hover:bg-purple-500 border-purple-300 text-slate-950 shadow-lg shadow-purple-600/40'
                      : 'bg-slate-900 hover:bg-slate-800 border-purple-500/50 text-purple-300 hover:border-purple-400'
                  }`}
                >
                  <Sparkles className={`w-4 h-4 ${isAwakened ? 'text-amber-300 animate-spin' : 'text-purple-400'}`} />
                  {isAwakened ? 'ZERO STATE ACTIVE' : 'ACTIVATE ZERO STATE'}
                </button>
                <span className="text-[10px] text-slate-400 font-mono mt-1">
                  {isAwakened ? 'Stats overclocked beyond 99' : 'Unlock Flow State Awakening'}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Awakened Zero State Description banner if active */}
        {isAwakened && player.zero_state_description && (
          <div className="mt-5 p-3 rounded-xl bg-purple-950/60 border border-purple-500/40 text-purple-200 text-xs flex items-center gap-2 animate-fade-in">
            <Flame className="w-4 h-4 text-purple-400 shrink-0 animate-pulse" />
            <div>
              <strong>FLOW / ZERO STATE EVOLUTION: </strong>
              <span>{player.zero_state_description}</span>
            </div>
          </div>
        )}
      </div>

      {/* Grid: 6-Axis Radar + Adaptability Gauge + 6 Stats Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Radar Chart (6 axes domain [0, 110]) */}
        <div className="lg:col-span-8 rounded-2xl bg-slate-900/80 border border-slate-800 p-5 md:p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2 border-b border-slate-800 pb-2">
            <h3 className="text-base font-bold font-heading text-slate-100 flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              6-AXIS EGO METRIC RADAR
            </h3>
            <span className="text-[11px] font-mono text-slate-400">
              Domain: [0, 110] EX Scaled
            </span>
          </div>

          <div className="my-2">
            <EgoRadarChart
              stats1={currentStats}
              name1={player.name}
              color1={isAwakened ? '#a855f7' : '#00f0ff'}
              isAwakened={isAwakened}
            />
          </div>

          {/* Point-by-point stats display */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 pt-3 border-t border-slate-800">
            {statItems.map((st) => (
              <div key={st.label} className="p-2 rounded-xl bg-slate-950/70 border border-slate-800/80 text-center">
                <span className="text-[10px] font-mono text-slate-400 block">{st.label}</span>
                <span className={`text-lg font-black font-heading ${st.value > 99 ? 'text-amber-400 text-glow-gold' : st.color}`}>
                  {st.value}
                </span>
                {st.value > 99 && (
                  <span className="block text-[9px] font-mono font-bold text-amber-400">EX</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 7th Stat: Mental Adaptability Progress Gauge + Bio */}
        <div className="lg:col-span-4 flex flex-col justify-between space-y-4">
          <AdaptabilityGauge score={currentStats.adaptability} />

          {/* Physical & Tactical Bio */}
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2.5 text-xs">
            <div className="text-xs font-bold font-heading uppercase text-cyan-400 flex items-center gap-1.5 border-b border-slate-800 pb-1.5">
              <Shield className="w-3.5 h-3.5" /> PHYSICAL SPECIFICATIONS
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/50">
              <span className="text-slate-400">Club Team</span>
              <span className="font-semibold text-slate-200">{player.team}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/50">
              <span className="text-slate-400">Field Position</span>
              <span className="font-semibold text-slate-200">{player.position}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/50">
              <span className="text-slate-400">Height</span>
              <span className="font-semibold text-slate-200">{player.height_cm || 180} cm</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/50">
              <span className="text-slate-400">Age</span>
              <span className="font-semibold text-slate-200">{player.age || 17} years</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-400">Eye Type</span>
              <span className="font-semibold text-cyan-300">{player.primary_eye_type}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tactical Weapon & Psychological Blueprint Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Weapon Dossier */}
        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
          <div className="text-xs font-bold font-heading uppercase text-cyan-400 flex items-center gap-2 border-b border-slate-800 pb-2">
            <Swords className="w-4 h-4" />
            PRIMARY WEAPON MECHANICS
          </div>
          <h4 className="text-lg font-bold font-heading text-slate-100">
            {player.primary_weapon}
          </h4>
          <p className="text-sm text-slate-300 leading-relaxed">
            {player.weapon_description}
          </p>
          <div className="mt-3 p-3 rounded-xl bg-slate-950/80 border border-slate-800 italic text-xs text-amber-300/90">
            "{player.quote}"
          </div>
        </div>

        {/* Psychological Profile */}
        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
          <div className="text-xs font-bold font-heading uppercase text-cyan-400 flex items-center gap-2 border-b border-slate-800 pb-2">
            <Brain className="w-4 h-4" />
            EGOIST PSYCHOLOGICAL PROFILE
          </div>
          <div>
            <span className="text-[11px] font-mono text-slate-400 uppercase">EGO CATEGORY</span>
            <div className="text-sm font-bold font-heading text-slate-200">
              {player.psychology_profile.ego_type}
            </div>
          </div>
          <div>
            <span className="text-[11px] font-mono text-slate-400 uppercase">FLOW STATE CATALYST</span>
            <p className="text-xs text-slate-300 mt-0.5">
              {player.psychology_profile.flow_trigger}
            </p>
          </div>
          <div>
            <span className="text-[11px] font-mono text-slate-400 uppercase">TACTICAL ANALYSIS</span>
            <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
              {player.psychology_profile.analysis}
            </p>
          </div>
        </div>
      </div>

      {/* User Notes Module (Full CRUD) */}
      <UserNotesModule playerId={player.id} playerName={player.name} />
    </div>
  );
};
