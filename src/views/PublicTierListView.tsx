import React, { useState, useEffect } from 'react';
import { UserTierList, Player } from '../types.ts';
import { CharacterPanel } from '../components/CharacterPanel.tsx';
import { hydrateTierRows, getContrastTextColor } from '../components/TierListMaker.tsx';
import { api } from '../services/api.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { ArrowLeft, Eye, Heart, Share2, Layers, Check } from 'lucide-react';

interface PublicTierListViewProps {
  tierListId: string;
  players: Player[];
  onBack: () => void;
  onSelectPlayer: (player: Player) => void;
}

export const PublicTierListView: React.FC<PublicTierListViewProps> = ({
  tierListId,
  players,
  onBack,
  onSelectPlayer,
}) => {
  const { user } = useAuth();
  const [tierList, setTierList] = useState<UserTierList | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isLiked, setIsLiked] = useState<boolean>(false);
  const [shareToast, setShareToast] = useState<string>('');

  useEffect(() => {
    let mounted = true;
    const fetchTierList = async () => {
      try {
        setLoading(true);
        const data = await api.getTierListById(tierListId);
        if (mounted && data) {
          setTierList(data);

          // Deduplicate view count per browser session via sessionStorage
          const sessionKey = `viewed_tierlist_${tierListId}`;
          if (!sessionStorage.getItem(sessionKey)) {
            sessionStorage.setItem(sessionKey, 'true');
            const newCount = await api.incrementTierListView(tierListId);
            setTierList((prev) => (prev ? { ...prev, view_count: newCount } : null));
          }
        }
      } catch (e) {
        console.error('Failed to load tier list:', e);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchTierList();
    return () => {
      mounted = false;
    };
  }, [tierListId]);

  const handleLike = async () => {
    if (!tierList) return;
    try {
      const res = await api.toggleTierListLike(tierList.id, user?.id);
      setIsLiked(res.liked);
      setTierList({ ...tierList, like_count: res.like_count });
    } catch {
      // ignore
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setShareToast('Share link copied to clipboard!');
    setTimeout(() => setShareToast(''), 3000);
  };

  if (loading) {
    return (
      <div className="py-24 text-center font-mono text-xs text-cyan-400 animate-pulse">
        Retrieving Public Tier List from Blue Lock Archive...
      </div>
    );
  }

  if (!tierList) {
    return (
      <div className="py-16 text-center space-y-4">
        <h3 className="text-xl font-bold font-heading text-slate-200">
          Tier list not found or deleted.
        </h3>
        <button
          onClick={onBack}
          className="px-4 py-2 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs uppercase font-heading"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-cyan-300 text-xs font-mono transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <div className="flex items-center gap-2">
          {shareToast && (
            <span className="text-xs text-cyan-400 font-mono flex items-center gap-1">
              <Check className="w-3.5 h-3.5" /> {shareToast}
            </span>
          )}
          <button
            onClick={handleShare}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-cyan-400 text-slate-300 text-xs font-mono flex items-center gap-1.5 transition-colors"
            title="Share Tier List"
          >
            <Share2 className="w-4 h-4 text-cyan-400" /> Share
          </button>
          <button
            onClick={handleLike}
            className={`px-3 py-1.5 rounded-xl border text-xs font-mono flex items-center gap-1.5 transition-all ${
              isLiked
                ? 'bg-rose-500/20 border-rose-500/50 text-rose-400'
                : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
            }`}
          >
            <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-rose-400 text-rose-400' : ''}`} />
            <span>{tierList.like_count} Likes</span>
          </button>
        </div>
      </div>

      {/* Title & Metadata Header */}
      <div className="p-6 rounded-3xl bg-slate-900/90 border border-cyan-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 mb-1">
            <Layers className="w-4 h-4" /> SHARED COMMUNITY RANKING
          </div>
          <h1 className="text-2xl sm:text-3xl font-black font-heading text-slate-100">
            {tierList.title}
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Engineered by <strong className="text-cyan-300">@{tierList.username}</strong> • Published on {new Date(tierList.created_at).toLocaleDateString()}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-center">
            <span className="text-[10px] font-mono text-slate-400 block font-bold">VIEWS</span>
            <span className="text-base font-black font-heading text-cyan-400 flex items-center justify-center gap-1">
              <Eye className="w-3.5 h-3.5" /> {tierList.view_count}
            </span>
          </div>
          <div className="px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-center">
            <span className="text-[10px] font-mono text-slate-400 block font-bold">LIKES</span>
            <span className="text-base font-black font-heading text-rose-400 flex items-center justify-center gap-1">
              <Heart className="w-3.5 h-3.5 fill-rose-400" /> {tierList.like_count}
            </span>
          </div>
        </div>
      </div>

      {/* TierMaker Board Render */}
      <div className="rounded-lg border-2 border-slate-800 bg-[#0b0d13] overflow-hidden shadow-2xl divide-y-2 divide-[#0b0d13]">
        {hydrateTierRows(tierList.tiers, tierList.tier_meta).map((row) => (
          <div key={row.id} className="flex items-stretch min-h-[84px]">
            <div
              style={{ backgroundColor: row.color, color: getContrastTextColor(row.color) }}
              className="w-20 sm:w-28 shrink-0 px-2 py-2 flex items-center justify-center text-center font-heading font-black text-base sm:text-xl leading-tight break-words border-r-2 border-[#0b0d13]"
            >
              {row.label}
            </div>

            <div className="flex-1 p-1.5 flex flex-wrap gap-1.5 items-center content-start min-h-[84px] bg-[#181a22]">
              {row.playerIds.map((pid) => {
                const p = players.find((pl) => pl.id === pid);
                if (!p) return null;

                return (
                  <button
                    key={pid}
                    type="button"
                    onClick={() => onSelectPlayer(p)}
                    className="relative group w-[68px] h-[68px] sm:w-[76px] sm:h-[76px] shrink-0 overflow-hidden bg-slate-950 border border-white/10 hover:border-cyan-400 hover:scale-[1.03] transition-transform cursor-pointer"
                    title={`Scout ${p.name} (${p.overall_rating} OVR)`}
                  >
                    <CharacterPanel player={p} size="sm" showBadge={false} />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent px-1 py-0.5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                      <span className="text-[10px] font-semibold text-white block truncate leading-tight text-center">
                        {p.name.split(' ')[0]}
                      </span>
                    </div>
                  </button>
                );
              })}

              {row.playerIds.length === 0 && (
                <span className="px-3 text-xs text-slate-600 font-mono">
                  No strikers ranked in this tier.
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
