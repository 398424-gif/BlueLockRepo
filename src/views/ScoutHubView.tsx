import React, { useState, useMemo, useEffect } from 'react';
import { Player } from '../types.ts';
import { PlayerCard } from '../components/PlayerCard.tsx';
import {
  Search,
  Filter,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Shield,
  Eye,
  Award,
} from 'lucide-react';

interface ScoutHubViewProps {
  players: Player[];
  onSelectPlayer: (player: Player) => void;
  onCompare: (player: Player) => void;
  onLikeToggle: (player: Player) => void;
  likedPlayerIds: Set<string>;
}

export const ScoutHubView: React.FC<ScoutHubViewProps> = ({
  players,
  onSelectPlayer,
  onCompare,
  onLikeToggle,
  likedPlayerIds,
}) => {
  // Search state
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Multi-select filters
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
  const [selectedRanks, setSelectedRanks] = useState<string[]>([]);
  const [selectedEyes, setSelectedEyes] = useState<string[]>([]);

  // Sorting
  const [sortOption, setSortOption] = useState<'overall_desc' | 'overall_asc' | 'speed_desc' | 'shoot_desc' | 'name_asc'>('overall_desc');

  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 12;

  // Extract unique available values
  const allTeams = useMemo(() => Array.from(new Set(players.map((p) => p.team))).filter(Boolean), [players]);
  const allRanks = ['S+', 'S', 'A', 'B', 'C'];
  const allEyes = ['Metavision', 'Predator Eye', 'Destroyer Eye', 'None'];

  // Reset page to 1 whenever search, filters, or sorting changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedTeams, selectedRanks, selectedEyes, sortOption]);

  // Toggle multi-select helper
  const toggleItem = (list: string[], item: string, setter: React.Dispatch<React.SetStateAction<string[]>>) => {
    if (list.includes(item)) {
      setter(list.filter((x) => x !== item));
    } else {
      setter([...list, item]);
    }
  };

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedTeams([]);
    setSelectedRanks([]);
    setSelectedEyes([]);
    setSortOption('overall_desc');
    setCurrentPage(1);
  };

  // Filter & Sort logic
  const filteredPlayers = useMemo(() => {
    return players
      .filter((player) => {
        // Text match against name, team, primary_weapon
        if (searchTerm.trim()) {
          const q = searchTerm.toLowerCase();
          const matchName = player.name.toLowerCase().includes(q) || player.japanese_name.toLowerCase().includes(q);
          const matchTeam = player.team.toLowerCase().includes(q);
          const matchWeapon = player.primary_weapon.toLowerCase().includes(q);
          if (!matchName && !matchTeam && !matchWeapon) return false;
        }

        // Multi-select Team
        if (selectedTeams.length > 0 && !selectedTeams.includes(player.team)) {
          return false;
        }

        // Multi-select Rank
        if (selectedRanks.length > 0 && !selectedRanks.includes(player.rank_tier)) {
          return false;
        }

        // Multi-select Eye
        if (selectedEyes.length > 0 && !selectedEyes.includes(player.primary_eye_type)) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortOption === 'overall_desc') return b.overall_rating - a.overall_rating;
        if (sortOption === 'overall_asc') return a.overall_rating - b.overall_rating;
        if (sortOption === 'speed_desc') return b.stats.speed - a.stats.speed;
        if (sortOption === 'shoot_desc') return b.stats.shoot - a.stats.shoot;
        if (sortOption === 'name_asc') return a.name.localeCompare(b.name);
        return 0;
      });
  }, [players, searchTerm, selectedTeams, selectedRanks, selectedEyes, sortOption]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredPlayers.length / itemsPerPage));
  const paginatedPlayers = filteredPlayers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs uppercase font-bold mb-1">
            <Shield className="w-4 h-4" /> EGOIST SCOUT DIRECTORY
          </div>
          <h2 className="text-2xl sm:text-3xl font-black font-heading text-slate-100">
            BLUE LOCK DATABASE HUB
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Filter, inspect, and evaluate all 25 world-class candidates, New Gen XI aces, and master coaches.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-slate-400 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
            Showing <strong className="text-cyan-400">{filteredPlayers.length}</strong> of {players.length} Strikers
          </span>
          {(searchTerm || selectedTeams.length > 0 || selectedRanks.length > 0 || selectedEyes.length > 0) && (
            <button
              onClick={resetFilters}
              className="px-3 py-1.5 rounded-lg bg-slate-850 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-mono flex items-center gap-1.5 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Control Bar: Search + Sorting */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
        {/* Search */}
        <div className="md:col-span-8 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by striker name, club team, or weapon (e.g. Kaiser, Direct Shot, Bastard München)..."
            className="w-full bg-slate-900 border border-slate-800 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none transition-all"
          />
        </div>

        {/* Sort dropdown */}
        <div className="md:col-span-4 relative flex items-center">
          <ArrowUpDown className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
          <select
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value as any)}
            className="w-full bg-slate-900 border border-slate-800 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 rounded-xl pl-9 pr-8 py-2.5 text-xs font-mono text-slate-200 focus:outline-none appearance-none cursor-pointer"
          >
            <option value="overall_desc">Sort: Overall Rating (Highest First)</option>
            <option value="overall_asc">Sort: Overall Rating (Lowest First)</option>
            <option value="speed_desc">Sort: Speed Rating (Fastest First)</option>
            <option value="shoot_desc">Sort: Shoot Rating (Lethal First)</option>
            <option value="name_asc">Sort: Name (Alphabetical A-Z)</option>
          </select>
        </div>
      </div>

      {/* Multi-Select Filters Bar */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 space-y-3.5">
        <div className="flex items-center gap-2 text-xs font-heading font-bold uppercase text-slate-400">
          <Filter className="w-3.5 h-3.5 text-cyan-400" /> CATEGORY MULTI-SELECT FILTERS
        </div>

        {/* Team filter pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-mono text-slate-500 mr-1">Club:</span>
          {allTeams.map((team) => {
            const isSelected = selectedTeams.includes(team);
            return (
              <button
                key={team}
                onClick={() => toggleItem(selectedTeams, team, setSelectedTeams)}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-cyan-500 text-slate-950 font-bold glow-cyan-sm'
                    : 'bg-slate-950/80 text-slate-400 border border-slate-800 hover:border-slate-700'
                }`}
              >
                {team}
              </button>
            );
          })}
        </div>

        {/* Rank Tier filter pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-mono text-slate-500 mr-1">Tier:</span>
          {allRanks.map((rank) => {
            const isSelected = selectedRanks.includes(rank);
            return (
              <button
                key={rank}
                onClick={() => toggleItem(selectedRanks, rank, setSelectedRanks)}
                className={`px-3 py-1 rounded-lg text-xs font-heading font-black tracking-wider transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-amber-400 text-slate-950 glow-gold'
                    : 'bg-slate-950/80 text-slate-400 border border-slate-800 hover:border-slate-700'
                }`}
              >
                {rank}
              </button>
            );
          })}
        </div>

        {/* Eye Type filter pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-mono text-slate-500 mr-1">Eye Vision:</span>
          {allEyes.map((eye) => {
            const isSelected = selectedEyes.includes(eye);
            return (
              <button
                key={eye}
                onClick={() => toggleItem(selectedEyes, eye, setSelectedEyes)}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all cursor-pointer flex items-center gap-1 ${
                  isSelected
                    ? 'bg-purple-500 text-slate-950 font-bold'
                    : 'bg-slate-950/80 text-slate-400 border border-slate-800 hover:border-slate-700'
                }`}
              >
                <Eye className="w-3 h-3" /> {eye}
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid of Players */}
      {paginatedPlayers.length === 0 ? (
        <div className="py-16 text-center rounded-2xl bg-slate-900/40 border border-dashed border-slate-800">
          <Shield className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-lg font-bold font-heading text-slate-300">
            NO STRIKERS FOUND MATCHING YOUR CRITERIA
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
            Try adjusting your search terms or clearing some multi-select category filters.
          </p>
          <button
            onClick={resetFilters}
            className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs uppercase font-heading tracking-wider"
          >
            Clear All Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {paginatedPlayers.map((player) => (
            <PlayerCard
              key={player.id}
              player={player}
              onSelect={onSelectPlayer}
              onCompare={onCompare}
              onLikeToggle={onLikeToggle}
              isLiked={likedPlayerIds.has(player.id)}
            />
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-6 border-t border-slate-800">
          <div className="text-xs text-slate-400 font-mono">
            Page <strong className="text-cyan-400">{currentPage}</strong> of {totalPages} ({filteredPlayers.length} total strikers)
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-cyan-500 text-slate-300 disabled:opacity-30 disabled:pointer-events-none transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNumber) => (
              <button
                key={pageNumber}
                onClick={() => setCurrentPage(pageNumber)}
                className={`w-8 h-8 rounded-lg text-xs font-mono font-bold transition-all ${
                  currentPage === pageNumber
                    ? 'bg-cyan-500 text-slate-950 glow-cyan-sm'
                    : 'bg-slate-900 text-slate-400 border border-slate-800 hover:border-slate-700'
                }`}
              >
                {pageNumber}
              </button>
            ))}

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-cyan-500 text-slate-300 disabled:opacity-30 disabled:pointer-events-none transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
