import React, { useState, useEffect, useMemo } from 'react';
import { Player } from '../types.ts';
import { EgoRadarChart } from '../components/EgoRadarChart.tsx';
import {
  Swords,
  Shuffle,
  Share2,
  AlertTriangle,
  Sparkles,
  Trophy,
  ArrowRight,
  Check,
  Flame,
  Zap,
} from 'lucide-react';

interface EgoDuelViewProps {
  players: Player[];
  initialP1?: string;
  initialP2?: string;
  onSelectPlayer: (player: Player) => void;
}

export const EgoDuelView: React.FC<EgoDuelViewProps> = ({
  players,
  initialP1 = 'isagi-yoichi',
  initialP2 = 'michael-kaiser',
  onSelectPlayer,
}) => {
  const [warningToast, setWarningToast] = useState<string>('');
  const [copyToast, setCopyToast] = useState<string>('');
  const [simulationResult, setSimulationResult] = useState<string | null>(null);

  // Validate player IDs with fallback logic
  const resolvePlayer = (id: string | undefined, defaultId: string, roleName: string): Player => {
    const found = players.find((p) => p.id === id);
    if (!found) {
      if (id) {
        setWarningToast(`Invalid striker ID "${id}" detected for ${roleName}. Falling back to ${defaultId}.`);
        setTimeout(() => setWarningToast(''), 4500);
      }
      return players.find((p) => p.id === defaultId) || players[0];
    }
    return found;
  };

  const [p1Id, setP1Id] = useState<string>(() => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('p1') || initialP1;
  });

  const [p2Id, setP2Id] = useState<string>(() => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('p2') || initialP2;
  });

  const player1 = useMemo(() => resolvePlayer(p1Id, 'isagi-yoichi', 'Striker 1'), [p1Id, players]);
  const player2 = useMemo(() => resolvePlayer(p2Id, 'michael-kaiser', 'Striker 2'), [p2Id, players]);

  // Sync state to URL search parameters
  useEffect(() => {
    const currentUrl = new URL(window.location.href);
    currentUrl.searchParams.set('p1', player1.id);
    currentUrl.searchParams.set('p2', player2.id);
    window.history.replaceState({}, '', currentUrl.toString());
  }, [player1.id, player2.id]);

  // Stat keys
  const statKeys: (keyof Player['stats'])[] = [
    'offense',
    'shoot',
    'dribble',
    'pass',
    'defense',
    'speed',
    'adaptability',
  ];

  // Random Matchup Tool
  const handleRandomMatchup = () => {
    if (players.length < 2) return;
    const shuffled = [...players].sort(() => 0.5 - Math.random());
    setP1Id(shuffled[0].id);
    setP2Id(shuffled[1].id);
    setSimulationResult(null);
  };

  // Share Comparison Tool
  const handleShareComparison = () => {
    const shareUrl = window.location.href;
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopyToast('Comparison link copied to clipboard!');
      setTimeout(() => setCopyToast(''), 3000);
    }).catch(() => {
      setCopyToast('Failed to copy automatically. URL is ready in address bar.');
      setTimeout(() => setCopyToast(''), 3000);
    });
  };

  // 1v1 Ego Clash Simulator
  const handleSimulateClash = () => {
    let p1Points = 0;
    let p2Points = 0;

    statKeys.forEach((key) => {
      if (player1.stats[key] > player2.stats[key]) p1Points++;
      else if (player2.stats[key] > player1.stats[key]) p2Points++;
    });

    if (player1.primary_eye_type === 'Metavision') p1Points += 0.5;
    if (player2.primary_eye_type === 'Metavision') p2Points += 0.5;

    let narrative = '';
    if (p1Points > p2Points) {
      narrative = `VICTORY FOR ${player1.name.toUpperCase()}! ${player1.name} devours ${player2.name}'s tactical blind spot with ${player1.primary_weapon}, seizing a ${p1Points.toFixed(1)} to ${p2Points.toFixed(1)} stat domain dominance!`;
    } else if (p2Points > p1Points) {
      narrative = `VICTORY FOR ${player2.name.toUpperCase()}! ${player2.name} overpowers ${player1.name} with ${player2.primary_weapon}, commanding a ${p2Points.toFixed(1)} to ${p1Points.toFixed(1)} victory!`;
    } else {
      narrative = `STALEMATE! Both egoists collide at peak chemical reaction, reading each other's moves step-for-step at ${p1Points.toFixed(1)} points each!`;
    }

    setSimulationResult(narrative);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Warning Toast if fallback triggered */}
      {warningToast && (
        <div className="p-3.5 rounded-xl bg-amber-950/80 border border-amber-500/50 text-amber-300 text-xs flex items-center gap-2 animate-bounce">
          <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
          <span>{warningToast}</span>
        </div>
      )}

      {/* Copy Toast */}
      {copyToast && (
        <div className="p-3 rounded-xl bg-cyan-950/80 border border-cyan-500/50 text-cyan-300 text-xs flex items-center gap-2 animate-fade-in">
          <Check className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>{copyToast}</span>
        </div>
      )}

      {/* Header and Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-rose-400 font-mono text-xs uppercase font-bold mb-1">
            <Swords className="w-4 h-4" /> HEAD-TO-HEAD TACTICAL ENGINE
          </div>
          <h2 className="text-2xl sm:text-3xl font-black font-heading text-slate-100">
            EGO DUEL COMPARISON
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Stateless query routing comparison (`/compare?p1=id1&p2=id2`) with dual radar overlay and differential table.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleRandomMatchup}
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Shuffle className="w-3.5 h-3.5 text-cyan-400" />
            Random Matchup
          </button>
          <button
            onClick={handleShareComparison}
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5 text-amber-400" />
            Share Comparison
          </button>
          <button
            onClick={handleSimulateClash}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-400 hover:to-amber-400 text-slate-950 font-bold font-heading text-xs uppercase tracking-wider transition-all glow-crimson cursor-pointer flex items-center gap-1.5"
          >
            <Flame className="w-4 h-4" />
            Simulate 1v1 Ego Clash
          </button>
        </div>
      </div>

      {/* Simulation Result banner if triggered */}
      {simulationResult && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-950/80 via-slate-950 to-rose-950/80 border border-purple-500/50 text-slate-100 text-sm flex items-start gap-3 animate-fade-in shadow-xl">
          <Trophy className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <div className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider mb-0.5">
              1V1 EGO CLASH SIMULATION RESULT
            </div>
            <p className="font-medium leading-relaxed">{simulationResult}</p>
          </div>
        </div>
      )}

      {/* Player Selectors & Head-to-Head Banner */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Striker 1 (Cyan) */}
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-cyan-500/50 relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-mono font-bold text-cyan-400 uppercase flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
              STRIKER 1 (CYAN VECTOR)
            </span>
            <select
              value={player1.id}
              onChange={(e) => setP1Id(e.target.value)}
              className="bg-slate-950 border border-cyan-500/40 rounded-lg px-2.5 py-1 text-xs font-mono text-cyan-300 focus:outline-none"
            >
              {players.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.overall_rating} OVR - {p.team})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl overflow-hidden border-2 border-cyan-400 shrink-0 bg-slate-950">
              <img src={player1.portrait} alt={player1.name} className="w-full h-full object-cover" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black font-heading text-slate-100">
                  {player1.overall_rating}
                </span>
                <span className="text-[10px] font-mono text-cyan-400 font-bold">OVR</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-400 text-slate-950 font-heading">
                  {player1.rank_tier}
                </span>
              </div>
              <h3 className="text-lg font-bold font-heading text-slate-100 truncate">
                {player1.name}
              </h3>
              <p className="text-xs text-slate-400 font-mono truncate">
                {player1.team} • {player1.position} • {player1.primary_eye_type}
              </p>
            </div>
          </div>
        </div>

        {/* Striker 2 (Crimson) */}
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-rose-500/50 relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-mono font-bold text-rose-400 uppercase flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-400 animate-pulse" />
              STRIKER 2 (CRIMSON VECTOR)
            </span>
            <select
              value={player2.id}
              onChange={(e) => setP2Id(e.target.value)}
              className="bg-slate-950 border border-rose-500/40 rounded-lg px-2.5 py-1 text-xs font-mono text-rose-300 focus:outline-none"
            >
              {players.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.overall_rating} OVR - {p.team})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl overflow-hidden border-2 border-rose-400 shrink-0 bg-slate-950">
              <img src={player2.portrait} alt={player2.name} className="w-full h-full object-cover" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black font-heading text-slate-100">
                  {player2.overall_rating}
                </span>
                <span className="text-[10px] font-mono text-rose-400 font-bold">OVR</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-400 text-slate-950 font-heading">
                  {player2.rank_tier}
                </span>
              </div>
              <h3 className="text-lg font-bold font-heading text-slate-100 truncate">
                {player2.name}
              </h3>
              <p className="text-xs text-slate-400 font-mono truncate">
                {player2.team} • {player2.position} • {player2.primary_eye_type}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Dual Radar Overlay & Differential Table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Dual Radar Overlay */}
        <div className="lg:col-span-7 rounded-2xl bg-slate-900/80 border border-slate-800 p-5 md:p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2 border-b border-slate-800 pb-2">
            <h3 className="text-base font-bold font-heading text-slate-100 flex items-center gap-2">
              <Swords className="w-4 h-4 text-cyan-400" />
              DUAL STAT OVERLAY RADAR
            </h3>
            <div className="flex items-center gap-3 text-xs font-mono">
              <span className="flex items-center gap-1 text-cyan-400">
                <span className="w-2.5 h-2.5 rounded-sm bg-cyan-400" /> {player1.name}
              </span>
              <span className="flex items-center gap-1 text-rose-400">
                <span className="w-2.5 h-2.5 rounded-sm bg-rose-400" /> {player2.name}
              </span>
            </div>
          </div>

          <div className="my-2">
            <EgoRadarChart
              stats1={player1.stats}
              name1={player1.name}
              color1="#00f0ff"
              stats2={player2.stats}
              name2={player2.name}
              color2="#f43f5e"
            />
          </div>

          <p className="text-center text-xs text-slate-400 font-mono pt-2 border-t border-slate-800">
            Outer boundary scaled to 110 EX domain. Points with &gt;99 trigger glowing neon filters.
          </p>
        </div>

        {/* Differential Delta Table */}
        <div className="lg:col-span-5 rounded-2xl bg-slate-900/80 border border-slate-800 p-5 md:p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-2">
              <h3 className="text-base font-bold font-heading text-slate-100">
                DIFFERENTIAL DELTA TABLE
              </h3>
              <span className="text-[11px] font-mono text-slate-400">
                ± Stat Gap
              </span>
            </div>

            <div className="space-y-2">
              {statKeys.map((key) => {
                const val1 = player1.stats[key];
                const val2 = player2.stats[key];
                const diff = val1 - val2;

                return (
                  <div
                    key={key}
                    className="flex items-center justify-between p-2 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs font-mono"
                  >
                    <span className="w-12 text-center font-bold text-cyan-400">
                      {val1}
                    </span>

                    <div className="flex-1 px-3 text-center">
                      <span className="uppercase text-slate-400 font-semibold text-[11px] block">
                        {key}
                      </span>
                      <span className={`text-[10px] font-bold ${
                        diff > 0 ? 'text-cyan-400' : diff < 0 ? 'text-rose-400' : 'text-slate-500'
                      }`}>
                        {diff > 0 ? `+${diff} (${player1.name.split(' ')[0]})` : diff < 0 ? `+${Math.abs(diff)} (${player2.name.split(' ')[0]})` : 'EQUAL'}
                      </span>
                    </div>

                    <span className="w-12 text-center font-bold text-rose-400">
                      {val2}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Weapon Duel Preview */}
          <div className="mt-4 pt-3 border-t border-slate-800 grid grid-cols-2 gap-2 text-[11px]">
            <div className="p-2 rounded-lg bg-cyan-950/20 border border-cyan-500/20">
              <span className="text-[10px] uppercase font-mono text-cyan-400 block font-bold">WEAPON 1</span>
              <span className="text-slate-200 line-clamp-1">{player1.primary_weapon}</span>
            </div>
            <div className="p-2 rounded-lg bg-rose-950/20 border border-rose-500/20">
              <span className="text-[10px] uppercase font-mono text-rose-400 block font-bold">WEAPON 2</span>
              <span className="text-slate-200 line-clamp-1">{player2.primary_weapon}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
