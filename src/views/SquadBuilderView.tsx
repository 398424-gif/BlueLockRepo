import React, { useState, useMemo } from 'react';
import Papa from 'papaparse';
import confetti from 'canvas-confetti';
import { Player, UserLineup, UserTierList } from '../types.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { api } from '../services/api.ts';
import { FORMATIONS, FormationKey, calculateSquadChemistry } from '../utils/squadEngine.ts';
import {
  Users,
  Layers,
  Save,
  Download,
  Trash2,
  Plus,
  X,
  Sparkles,
  Check,
  AlertCircle,
  HelpCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface SquadBuilderViewProps {
  players: Player[];
  onSelectPlayer: (player: Player) => void;
  onRefreshData?: () => void;
}

export const SquadBuilderView: React.FC<SquadBuilderViewProps> = ({
  players,
  onRefreshData,
}) => {
  const { user, openAuthModal } = useAuth();

  // Mode: 'lineup' | 'tierlist' | 'saved'
  const [activeTab, setActiveTab] = useState<'lineup' | 'tierlist' | 'saved'>('lineup');

  // LINEUP BUILDER STATE
  const [formationKey, setFormationKey] = useState<FormationKey>('4-3-3');
  const [squadSlots, setSquadSlots] = useState<(Player | null)[]>(Array(11).fill(null));
  const [lineupTitle, setLineupTitle] = useState<string>('My Neo Egoist XI');
  const [selectedSlotIndex, setSelectedSlotIndex] = useState<number | null>(null);

  // TIER LIST ENGINE STATE
  const [tierListTitle, setTierListTitle] = useState<string>('Neo Egoist Ultimate Tier');
  const [tierRows, setTierRows] = useState<Record<string, string[]>>({
    'S+': ['isagi-yoichi', 'michael-kaiser', 'rin-itoshi'],
    'S': ['shoei-barou', 'meguru-bachira', 'hyoma-chigiri'],
    'A': ['kunigami-rensuke', 'reo-mikage', 'seishiro-nagi'],
    'B': ['tabito-karasu', 'kenyu-yukimiya'],
    'C': ['eita-otoya'],
  });
  const [isPublicTierList, setIsPublicTierList] = useState<boolean>(true);

  // SAVED USER ITEMS STATE
  const [myLineups, setMyLineups] = useState<UserLineup[]>([]);
  const [myTierLists, setMyTierLists] = useState<UserTierList[]>([]);
  const [loadingSaved, setLoadingSaved] = useState<boolean>(false);

  // Feedback messages
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [showMathDetails, setShowMathDetails] = useState<boolean>(false);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Real-time Squad Mathematics Engine
  const currentFormation = FORMATIONS[formationKey];
  const squadChemistry = useMemo(() => calculateSquadChemistry(squadSlots), [squadSlots]);

  // Available players for selection (not already in squad)
  const availablePlayersForSquad = useMemo(() => {
    const selectedIds = new Set(squadSlots.filter(Boolean).map((p) => p!.id));
    return players.filter((p) => !selectedIds.has(p.id));
  }, [players, squadSlots]);

  // Slot player action
  const handleSlotPlayer = (player: Player) => {
    if (selectedSlotIndex === null) return;
    const newSlots = [...squadSlots];
    newSlots[selectedSlotIndex] = player;
    setSquadSlots(newSlots);
    setSelectedSlotIndex(null);
  };

  const handleClearSlot = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const newSlots = [...squadSlots];
    newSlots[index] = null;
    setSquadSlots(newSlots);
  };

  // Auto-fill squad with best overall players
  const handleAutoFill = () => {
    const sorted = [...players].sort((a, b) => b.overall_rating - a.overall_rating);
    const newSlots = sorted.slice(0, 11);
    setSquadSlots(newSlots);
    showToast('Auto-filled starting XI with top ranked egoists!');
  };

  // Save Lineup (inserts/updates user_lineups)
  const handleSaveLineup = async () => {
    if (!user) {
      openAuthModal('Sign in to persist custom tactical lineups to your account.');
      return;
    }

    const filledPlayers = squadSlots.filter((p): p is Player => p !== null);
    if (filledPlayers.length !== 11) {
      showToast('Lineup must have exactly 11 unique players before saving!', 'error');
      return;
    }

    try {
      await api.saveLineup({
        title: lineupTitle.trim() || 'My Tactical Squad',
        formation: formationKey,
        player_ids: filledPlayers.map((p) => p.id),
        user_id: user.id,
        username: user.username,
        total_overall: squadChemistry.totalOverall,
        chemistry_score: squadChemistry.totalChemistry,
      });

      confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
      showToast('Squad Lineup saved to Blue Lock Database!');
      onRefreshData?.();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save lineup';
      showToast(msg, 'error');
    }
  };

  // Export Lineup to CSV (papaparse)
  const handleExportLineupCSV = () => {
    const filledPlayers = squadSlots.filter((p): p is Player => p !== null);
    if (filledPlayers.length === 0) {
      showToast('Add at least one striker to export', 'error');
      return;
    }

    const csvData = filledPlayers.map((p, idx) => ({
      Slot: currentFormation.slots[idx]?.label || `Slot ${idx + 1}`,
      Name: p.name,
      Team: p.team,
      Position: p.position,
      Rank: p.rank_tier,
      Overall: p.overall_rating,
      PrimaryWeapon: p.primary_weapon,
      EyeType: p.primary_eye_type,
    }));

    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${lineupTitle.replace(/\s+/g, '_')}_Lineup.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Tactical Lineup exported as CSV!');
  };

  // TIER LIST ACTIONS
  const handleAddPlayerToTier = (tier: string, playerId: string) => {
    // Remove from other tiers first
    const updated = { ...tierRows };
    Object.keys(updated).forEach((k) => {
      updated[k] = updated[k].filter((id) => id !== playerId);
    });
    updated[tier] = [...(updated[tier] || []), playerId];
    setTierRows(updated);
  };

  const handleRemoveFromTier = (tier: string, playerId: string) => {
    setTierRows({
      ...tierRows,
      [tier]: tierRows[tier].filter((id) => id !== playerId),
    });
  };

  const handleSaveTierList = async () => {
    if (!user) {
      openAuthModal('Sign in to publish or save your custom tier list.');
      return;
    }

    try {
      await api.saveTierList({
        title: tierListTitle.trim() || 'My Custom Tier List',
        tiers: tierRows as Record<string, string[]>,
        user_id: user.id,
        username: user.username,
        is_public: isPublicTierList,
      });

      confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
      showToast('Tier List saved to Blue Lock Database!');
      onRefreshData?.();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save tier list';
      showToast(msg, 'error');
    }
  };

  const handleExportTierListCSV = () => {
    const csvData: any[] = [];
    Object.entries(tierRows).forEach(([tier, playerIds]) => {
      playerIds.forEach((pid) => {
        const player = players.find((p) => p.id === pid);
        if (player) {
          csvData.push({
            Tier: tier,
            Name: player.name,
            Team: player.team,
            Position: player.position,
            Overall: player.overall_rating,
            PrimaryWeapon: player.primary_weapon,
          });
        }
      });
    });

    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${tierListTitle.replace(/\s+/g, '_')}_TierList.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Tier List exported as CSV!');
  };

  // Load user saved lineups/tier lists
  const loadSavedData = async () => {
    if (!user) return;
    try {
      setLoadingSaved(true);
      const [l, t] = await Promise.all([
        api.getLineups(user.id),
        api.getTierLists(),
      ]);
      setMyLineups(l);
      setMyTierLists(t.filter((item) => item.user_id === user.id));
    } catch {
      // ignore
    } finally {
      setLoadingSaved(false);
    }
  };

  const handleTabChange = (tab: 'lineup' | 'tierlist' | 'saved') => {
    setActiveTab(tab);
    if (tab === 'saved' && user) {
      loadSavedData();
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 p-4 rounded-xl shadow-2xl border text-xs font-mono flex items-center gap-2 animate-bounce ${
            toastMessage.type === 'success'
              ? 'bg-emerald-950/90 border-emerald-500/50 text-emerald-300'
              : 'bg-rose-950/90 border-rose-500/50 text-rose-300'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <Sparkles className="w-4 h-4 text-emerald-400" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Header and Submode Selector */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-amber-400 font-mono text-xs uppercase font-bold mb-1">
            <Users className="w-4 h-4" /> TACTICAL WAR ROOM & CANVAS
          </div>
          <h2 className="text-2xl sm:text-3xl font-black font-heading text-slate-100">
            FORMATION BUILDER & TIER LIST ENGINE
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Design pitch formations with real-time chemistry calculations, or rank strikers on the tier canvas.
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-900 border border-slate-800">
          <button
            onClick={() => handleTabChange('lineup')}
            className={`px-3.5 py-2 rounded-lg text-xs font-heading font-bold uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'lineup'
                ? 'bg-cyan-500 text-slate-950 glow-cyan-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Lineup Builder
          </button>
          <button
            onClick={() => handleTabChange('tierlist')}
            className={`px-3.5 py-2 rounded-lg text-xs font-heading font-bold uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'tierlist'
                ? 'bg-amber-400 text-slate-950 glow-gold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Tier List Engine
          </button>
          <button
            onClick={() => handleTabChange('saved')}
            className={`px-3.5 py-2 rounded-lg text-xs font-heading font-bold uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'saved'
                ? 'bg-purple-600 text-slate-100'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            My Saved Sets
          </button>
        </div>
      </div>

      {/* TAB 1: LINEUP BUILDER */}
      {activeTab === 'lineup' && (
        <div className="space-y-6">
          {/* Top Control Bar: Formation, Title, Math summary */}
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
            <div className="md:col-span-4">
              <label className="text-[10px] font-mono text-slate-400 uppercase block mb-1">
                Lineup Title
              </label>
              <input
                type="text"
                value={lineupTitle}
                onChange={(e) => setLineupTitle(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-cyan-400 font-heading font-bold"
              />
            </div>

            <div className="md:col-span-3">
              <label className="text-[10px] font-mono text-slate-400 uppercase block mb-1">
                Tactical Formation
              </label>
              <select
                value={formationKey}
                onChange={(e) => setFormationKey(e.target.value as FormationKey)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-cyan-400 font-mono"
              >
                <option value="4-3-3">4-3-3 Attack Aggressive</option>
                <option value="4-4-2">4-4-2 Balanced Direct</option>
                <option value="3-5-2">3-5-2 Midfield Overload</option>
                <option value="4-2-3-1">4-2-3-1 Modern Metavision</option>
              </select>
            </div>

            {/* Squad Mathematics HUD */}
            <div className="md:col-span-5 flex items-center justify-between sm:justify-end gap-3">
              <div className="text-center px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] font-mono text-slate-400 block font-bold">TOTAL OVR</span>
                <span className="text-xl font-black font-heading text-cyan-400">
                  {squadChemistry.totalOverall}
                </span>
              </div>

              <div className="text-center px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] font-mono text-slate-400 block font-bold">CHEMISTRY</span>
                <span className="text-xl font-black font-heading text-amber-400">
                  {squadChemistry.totalChemistry} / 100
                </span>
              </div>

              <button
                onClick={() => setShowMathDetails(!showMathDetails)}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1 font-mono"
                title="View Chemistry Formula"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                {showMathDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            </div>
          </div>

          {/* Math details drawer */}
          {showMathDetails && (
            <div className="p-4 rounded-xl bg-slate-950 border border-cyan-500/30 text-xs text-slate-300 space-y-2 animate-fade-in font-mono">
              <div className="text-xs font-bold text-cyan-400 font-heading uppercase flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> SQUAD MATHEMATICS ENGINE (SPEC IMPLEMENTATION)
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">TOTAL OVERALL</span>
                  <div className="text-slate-100 font-bold">
                    ⌊ (∑ Overall / 11) + 0.5 ⌋ = {squadChemistry.totalOverall}
                  </div>
                </div>
                <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">CLUB SYNERGY (k(k-1)/2)</span>
                  <div className="text-slate-100 font-bold">
                    {squadChemistry.clubPairCount} Pairs = +{squadChemistry.clubSynergyPoints} Pts
                  </div>
                </div>
                <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">VISION / FINISHER BONUS</span>
                  <div className="text-slate-100 font-bold">
                    MV: +{squadChemistry.metavisionPoints} | Finisher: +{squadChemistry.finisherPoints}
                  </div>
                </div>
                <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">DOMINANT CLUB (4+ Club)</span>
                  <div className="text-slate-100 font-bold">
                    {squadChemistry.hasDominantClub ? `+${squadChemistry.dominantClubPoints} (${squadChemistry.dominantClubName})` : '0 (Need 4+)'}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Pitch Canvas & Bench Sidebar */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Soccer Pitch Canvas */}
            <div className="lg:col-span-8 flex flex-col">
              <div className="relative w-full aspect-[4/3] sm:aspect-[16/11] rounded-2xl overflow-hidden border-2 border-emerald-600/60 bg-gradient-to-b from-[#0e3b22] via-[#092918] to-[#071f12] shadow-2xl p-4">
                {/* Tactical Pitch Markings */}
                <div className="absolute inset-4 border-2 border-emerald-400/20 rounded-xl pointer-events-none" />
                {/* Halfway Line */}
                <div className="absolute left-4 right-4 top-1/2 -translate-y-1/2 border-t-2 border-emerald-400/20 pointer-events-none" />
                {/* Center Circle */}
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-28 h-28 sm:w-36 sm:h-36 rounded-full border-2 border-emerald-400/20 pointer-events-none" />
                {/* Center Spot */}
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-emerald-400/30 pointer-events-none" />
                {/* Top Penalty Box */}
                <div className="absolute left-1/2 top-4 -translate-x-1/2 w-48 h-20 sm:w-60 sm:h-24 border-b-2 border-x-2 border-emerald-400/20 rounded-b pointer-events-none" />
                {/* Bottom Penalty Box */}
                <div className="absolute left-1/2 bottom-4 -translate-x-1/2 w-48 h-20 sm:w-60 sm:h-24 border-t-2 border-x-2 border-emerald-400/20 rounded-t pointer-events-none" />

                {/* 11 Interactive Formation Slots on Field Coordinates */}
                {currentFormation.slots.map((slot) => {
                  const assigned = squadSlots[slot.index];
                  const isSelected = selectedSlotIndex === slot.index;

                  return (
                    <div
                      key={slot.index}
                      onClick={() => setSelectedSlotIndex(slot.index)}
                      style={{
                        left: `${slot.x}%`,
                        top: `${slot.y}%`,
                        transform: 'translate(-50%, -50%)',
                      }}
                      className={`absolute cursor-pointer transition-all duration-300 z-10 flex flex-col items-center ${
                        isSelected ? 'scale-110 z-20' : 'hover:scale-105'
                      }`}
                    >
                      {assigned ? (
                        <div className="relative group">
                          {/* Player Token on Pitch */}
                          <div
                            className={`w-11 h-11 sm:w-13 sm:h-13 rounded-full border-2 overflow-hidden shadow-xl bg-slate-950 ${
                              isSelected
                                ? 'border-amber-400 ring-4 ring-amber-400/40 glow-gold'
                                : 'border-cyan-400 glow-cyan-sm'
                            }`}
                          >
                            <img
                              src={assigned.portrait}
                              alt={assigned.name}
                              className="w-full h-full object-cover"
                            />
                          </div>

                          {/* Clear Slot button on hover */}
                          <button
                            onClick={(e) => handleClearSlot(slot.index, e)}
                            className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center text-[10px] shadow"
                            title="Remove from slot"
                          >
                            <X className="w-3 h-3" />
                          </button>

                          {/* Rating and Name Badge */}
                          <div className="mt-1 px-1.5 py-0.5 rounded bg-slate-950/90 border border-slate-700 text-center shadow">
                            <span className="text-[10px] font-black font-heading text-cyan-400 block leading-tight">
                              {assigned.overall_rating}
                            </span>
                            <span className="text-[9px] font-mono text-slate-200 block truncate max-w-[60px] sm:max-w-[70px] leading-tight">
                              {assigned.name.split(' ')[0]}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div
                          className={`w-11 h-11 sm:w-13 sm:h-13 rounded-full border-2 border-dashed flex flex-col items-center justify-center transition-all ${
                            isSelected
                              ? 'border-amber-400 bg-amber-400/20 glow-gold'
                              : 'border-emerald-400/50 bg-emerald-950/40 hover:border-cyan-400 hover:bg-slate-900/60'
                          }`}
                        >
                          <Plus className="w-4 h-4 text-emerald-300" />
                          <span className="text-[9px] font-bold font-mono text-emerald-200">
                            {slot.label}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Action Buttons below Pitch */}
              <div className="flex flex-wrap items-center justify-between gap-3 mt-4">
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleAutoFill}
                    className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-mono transition-colors"
                  >
                    Auto-Fill Top 11
                  </button>
                  <button
                    onClick={() => setSquadSlots(Array(11).fill(null))}
                    className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-rose-300 text-xs font-mono transition-colors"
                  >
                    Clear Pitch
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleExportLineupCSV}
                    className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-cyan-400" />
                    Export CSV
                  </button>
                  <button
                    onClick={handleSaveLineup}
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold font-heading text-xs uppercase tracking-wider flex items-center gap-1.5 glow-cyan-sm transition-all cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    Save Lineup
                  </button>
                </div>
              </div>
            </div>

            {/* Bench / Striker Picker Sidebar */}
            <div className="lg:col-span-4 rounded-2xl bg-slate-900/90 border border-slate-800 p-4 flex flex-col justify-between h-[520px]">
              <div>
                <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
                  <h3 className="text-xs font-bold font-heading uppercase text-cyan-400 flex items-center gap-1.5">
                    <Users className="w-4 h-4" />
                    {selectedSlotIndex !== null
                      ? `ASSIGN TO SLOT: ${currentFormation.slots[selectedSlotIndex]?.label}`
                      : 'TACTICAL BENCH (SELECT A SLOT FIRST)'}
                  </h3>
                  <span className="text-[10px] font-mono text-slate-400">
                    {availablePlayersForSquad.length} Available
                  </span>
                </div>

                {selectedSlotIndex === null && (
                  <div className="p-3 mb-3 rounded-xl bg-cyan-950/30 border border-cyan-500/30 text-xs text-cyan-300">
                    💡 Click any position token on the soccer pitch to slot in an egoist.
                  </div>
                )}

                {/* Bench striker list */}
                <div className="space-y-2 overflow-y-auto max-h-[380px] pr-1">
                  {availablePlayersForSquad.map((player) => (
                    <div
                      key={player.id}
                      onClick={() => {
                        if (selectedSlotIndex !== null) {
                          handleSlotPlayer(player);
                        } else {
                          // select first empty slot if any
                          const emptyIdx = squadSlots.findIndex((s) => s === null);
                          if (emptyIdx !== -1) {
                            const updated = [...squadSlots];
                            updated[emptyIdx] = player;
                            setSquadSlots(updated);
                          }
                        }
                      }}
                      className="p-2 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-cyan-400/60 transition-all flex items-center justify-between gap-3 cursor-pointer group"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img
                          src={player.portrait}
                          alt={player.name}
                          className="w-9 h-9 rounded-lg object-cover border border-slate-700 shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-slate-200 group-hover:text-cyan-300 truncate">
                            {player.name}
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono truncate">
                            {player.team} • {player.position}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-sm font-black font-heading text-cyan-400">
                          {player.overall_rating}
                        </span>
                        <span className="p-1 rounded bg-cyan-500/10 text-cyan-400 group-hover:bg-cyan-500 group-hover:text-slate-950 transition-colors">
                          <Plus className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: TIER LIST ENGINE */}
      {activeTab === 'tierlist' && (
        <div className="space-y-6">
          {/* Top Bar for Tier List */}
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex-1 w-full sm:w-auto">
              <label className="text-[10px] font-mono text-slate-400 uppercase block mb-1">
                Tier List Title
              </label>
              <input
                type="text"
                value={tierListTitle}
                onChange={(e) => setTierListTitle(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100 font-heading font-bold"
              />
            </div>

            <div className="flex items-center gap-3">
              <label className="text-xs font-mono text-slate-400 flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPublicTierList}
                  onChange={(e) => setIsPublicTierList(e.target.checked)}
                  className="rounded border-slate-700 text-cyan-500"
                />
                Public Showcase
              </label>

              <button
                onClick={handleExportTierListCSV}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5 text-cyan-400" /> Export CSV
              </button>

              <button
                onClick={handleSaveTierList}
                className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold font-heading text-xs uppercase tracking-wider glow-gold flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" /> Save Tier List
              </button>
            </div>
          </div>

          {/* Hardcoded Rows: S+, S, A, B, C */}
          <div className="space-y-3">
            {[
              { tier: 'S+', color: 'bg-amber-500 text-slate-950 border-amber-400' },
              { tier: 'S', color: 'bg-cyan-500 text-slate-950 border-cyan-400' },
              { tier: 'A', color: 'bg-emerald-500 text-slate-950 border-emerald-400' },
              { tier: 'B', color: 'bg-indigo-500 text-slate-100 border-indigo-400' },
              { tier: 'C', color: 'bg-slate-700 text-slate-200 border-slate-600' },
            ].map(({ tier, color }) => {
              const assignedIds = tierRows[tier] || [];

              return (
                <div
                  key={tier}
                  className="rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col sm:flex-row overflow-hidden shadow"
                >
                  {/* Tier label badge */}
                  <div
                    className={`w-full sm:w-24 shrink-0 py-3 sm:py-0 flex items-center justify-center font-heading font-black text-xl border-b sm:border-b-0 sm:border-r ${color}`}
                  >
                    {tier}
                  </div>

                  {/* Player tokens in this tier */}
                  <div className="flex-1 p-3 flex flex-wrap gap-2.5 items-center min-h-[72px] bg-slate-950/60">
                    {assignedIds.map((pid) => {
                      const p = players.find((pl) => pl.id === pid);
                      if (!p) return null;

                      return (
                        <div
                          key={pid}
                          className="relative group w-12 h-12 rounded-xl overflow-hidden border border-slate-700 hover:border-cyan-400 transition-colors"
                        >
                          <img src={p.portrait} alt={p.name} className="w-full h-full object-cover" />
                          <button
                            onClick={() => handleRemoveFromTier(tier, pid)}
                            className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 flex items-center justify-center text-rose-400 text-xs font-bold transition-opacity"
                            title="Remove from tier"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })}

                    {assignedIds.length === 0 && (
                      <span className="text-xs text-slate-600 font-mono italic">
                        Empty tier row. Assign strikers from the bench below.
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick Striker Bench for assigning to tiers */}
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
            <h3 className="text-xs font-bold font-heading uppercase text-cyan-400 mb-3">
              AVAILABLE EGOIST ROSTER (CLICK TIER BADGE TO ASSIGN)
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-2.5">
              {players.map((p) => (
                <div
                  key={p.id}
                  className="p-2 rounded-xl bg-slate-950 border border-slate-800 flex flex-col items-center text-center"
                >
                  <img
                    src={p.portrait}
                    alt={p.name}
                    className="w-10 h-10 rounded-lg object-cover mb-1.5"
                  />
                  <div className="text-[11px] font-bold text-slate-200 truncate w-full">
                    {p.name.split(' ')[0]}
                  </div>
                  <div className="text-[10px] text-cyan-400 font-heading font-black mb-1.5">
                    {p.overall_rating} OVR
                  </div>

                  <div className="flex gap-1">
                    {['S+', 'S', 'A', 'B', 'C'].map((tr) => (
                      <button
                        key={tr}
                        onClick={() => handleAddPlayerToTier(tr, p.id)}
                        className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-slate-800 hover:bg-cyan-500 hover:text-slate-950 text-slate-300 transition-colors"
                      >
                        {tr}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SAVED FORMATIONS & TIER LISTS */}
      {activeTab === 'saved' && (
        <div className="space-y-6">
          {!user ? (
            <div className="py-12 text-center rounded-2xl bg-slate-900/50 border border-slate-800 p-6">
              <Users className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <h3 className="text-lg font-bold font-heading text-slate-200">
                GUEST SANDBOX DETECTED
              </h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 mb-4">
                Sign in to view, edit, and delete your saved formations and custom tier rankings.
              </p>
              <button
                onClick={() => openAuthModal('Sign in to view saved tactical lineups and tier lists.')}
                className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs uppercase font-heading"
              >
                Sign In to View Sets
              </button>
            </div>
          ) : loadingSaved ? (
            <div className="py-12 text-center text-xs font-mono text-cyan-400 animate-pulse">
              Loading your tactical database entries...
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Saved Lineups */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold font-heading uppercase text-cyan-400 flex items-center gap-1.5">
                  <Users className="w-4 h-4" /> MY SAVED LINEUPS ({myLineups.length})
                </h3>

                {myLineups.length === 0 ? (
                  <div className="p-6 text-center rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-500">
                    No custom lineups saved yet.
                  </div>
                ) : (
                  myLineups.map((lineup) => (
                    <div
                      key={lineup.id}
                      className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between"
                    >
                      <div>
                        <h4 className="text-sm font-bold font-heading text-slate-100">
                          {lineup.title}
                        </h4>
                        <p className="text-xs text-slate-400 font-mono">
                          {lineup.formation} • {lineup.total_overall} OVR • {lineup.chemistry_score} Chem
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setLineupTitle(lineup.title);
                            setFormationKey(lineup.formation);
                            const mapped = lineup.player_ids.map((id) => players.find((p) => p.id === id) || null);
                            setSquadSlots(mapped);
                            setActiveTab('lineup');
                            showToast(`Loaded ${lineup.title} onto pitch!`);
                          }}
                          className="px-2.5 py-1 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-xs font-mono"
                        >
                          Load
                        </button>
                        <button
                          onClick={async () => {
                            await api.deleteLineup(lineup.id);
                            setMyLineups(myLineups.filter((l) => l.id !== lineup.id));
                            showToast('Lineup deleted');
                          }}
                          className="p-1 text-slate-500 hover:text-rose-400"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Saved Tier Lists */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold font-heading uppercase text-amber-400 flex items-center gap-1.5">
                  <Layers className="w-4 h-4" /> MY SAVED TIER LISTS ({myTierLists.length})
                </h3>

                {myTierLists.length === 0 ? (
                  <div className="p-6 text-center rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-500">
                    No tier lists saved yet.
                  </div>
                ) : (
                  myTierLists.map((tl) => (
                    <div
                      key={tl.id}
                      className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between"
                    >
                      <div>
                        <h4 className="text-sm font-bold font-heading text-slate-100">
                          {tl.title}
                        </h4>
                        <p className="text-xs text-slate-400 font-mono">
                          {tl.view_count} views • {tl.like_count} likes
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setTierListTitle(tl.title);
                            setTierRows(tl.tiers);
                            setActiveTab('tierlist');
                            showToast(`Loaded ${tl.title} into tier canvas!`);
                          }}
                          className="px-2.5 py-1 rounded bg-amber-400/20 text-amber-300 border border-amber-500/40 text-xs font-mono"
                        >
                          Load
                        </button>
                        <button
                          onClick={async () => {
                            await api.deleteTierList(tl.id);
                            setMyTierLists(myTierLists.filter((t) => t.id !== tl.id));
                            showToast('Tier list deleted');
                          }}
                          className="p-1 text-slate-500 hover:text-rose-400"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
