/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { AuthProvider } from './context/AuthContext.tsx';
import { SpoilerProvider } from './context/SpoilerContext.tsx';
import { Navbar } from './components/Navbar.tsx';
import { AuthModal } from './components/AuthModal.tsx';
import { HomeView } from './views/HomeView.tsx';
import { ScoutHubView } from './views/ScoutHubView.tsx';
import { PlayerDetailView } from './views/PlayerDetailView.tsx';
import { EgoDuelView } from './views/EgoDuelView.tsx';
import { SquadBuilderView } from './views/SquadBuilderView.tsx';
import { PublicTierListView } from './views/PublicTierListView.tsx';
import { Player, UserTierList, SiteConfig } from './types.ts';
import { api } from './services/api.ts';
import { PLAYERS_SEED, INITIAL_SITE_CONFIG, INITIAL_PUBLIC_TIER_LISTS } from './data/seedData.ts';
import { Shield, Sparkles, Heart } from 'lucide-react';

export default function App() {
  return (
    <AuthProvider>
      <SpoilerProvider>
        <AppContent />
      </SpoilerProvider>
    </AuthProvider>
  );
}

function AppContent() {
  // Navigation State
  const [currentView, setCurrentView] = useState<string>('home');
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [compareP1, setCompareP1] = useState<string>('isagi-yoichi');
  const [compareP2, setCompareP2] = useState<string>('michael-kaiser');
  const [activeTierListId, setActiveTierListId] = useState<string | null>(null);

  // Global Data State
  const [players, setPlayers] = useState<Player[]>(PLAYERS_SEED);
  const [tierLists, setTierLists] = useState<UserTierList[]>(INITIAL_PUBLIC_TIER_LISTS);
  const [siteConfig, setSiteConfig] = useState<SiteConfig>(INITIAL_SITE_CONFIG);
  const [likedPlayerIds, setLikedPlayerIds] = useState<Set<string>>(new Set(['isagi-yoichi']));
  const [loading, setLoading] = useState<boolean>(true);

  // Initial Load from API
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [fetchedPlayers, fetchedTierLists, fetchedConfig, userLikes] = await Promise.all([
        api.getPlayers(),
        api.getTierLists(),
        api.getSiteConfig(),
        api.getUserLikes(),
      ]);

      setPlayers(fetchedPlayers);
      setTierLists(fetchedTierLists);
      setSiteConfig(fetchedConfig);

      const likedSet = new Set(
        userLikes.filter((l) => l.target_type === 'player').map((l) => l.target_id)
      );
      setLikedPlayerIds(likedSet);
    } catch (e) {
      console.warn('Error loading initial app data:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Read URL parameters on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const viewParam = params.get('view');
    const p1Param = params.get('p1');
    const p2Param = params.get('p2');
    const playerParam = params.get('player');
    const tierListParam = params.get('tierlist');

    if (p1Param && p2Param) {
      setCompareP1(p1Param);
      setCompareP2(p2Param);
      setCurrentView('compare');
    } else if (playerParam) {
      const match = players.find((p) => p.id === playerParam);
      if (match) {
        setSelectedPlayer(match);
        setCurrentView('striker-detail');
      }
    } else if (tierListParam) {
      setActiveTierListId(tierListParam);
      setCurrentView('tier-list-view');
    } else if (viewParam) {
      setCurrentView(viewParam);
    }
  }, [players]);

  // Handle Navigation
  const handleNavigate = (view: string, params?: Record<string, string>) => {
    setCurrentView(view);
    const url = new URL(window.location.href);

    if (view === 'home') {
      url.search = '';
    } else if (view === 'compare') {
      const p1 = params?.p1 || compareP1;
      const p2 = params?.p2 || compareP2;
      setCompareP1(p1);
      setCompareP2(p2);
      url.searchParams.set('view', 'compare');
      url.searchParams.set('p1', p1);
      url.searchParams.set('p2', p2);
    } else if (view === 'tier-list-view' && params?.id) {
      setActiveTierListId(params.id);
      url.searchParams.set('tierlist', params.id);
    } else {
      url.searchParams.set('view', view);
    }

    window.history.pushState({}, '', url.toString());
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectPlayer = (player: Player) => {
    setSelectedPlayer(player);
    setCurrentView('striker-detail');
    const url = new URL(window.location.href);
    url.searchParams.set('player', player.id);
    window.history.pushState({}, '', url.toString());
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCompareWithPlayer = (player: Player) => {
    setCompareP1(player.id);
    handleNavigate('compare', { p1: player.id, p2: player.id === 'michael-kaiser' ? 'isagi-yoichi' : 'michael-kaiser' });
  };

  // Toggle Like on a player
  const handleLikeToggle = async (player: Player) => {
    try {
      const res = await api.togglePlayerLike(player.id);
      setLikedPlayerIds((prev) => {
        const next = new Set(prev);
        if (res.liked) next.add(player.id);
        else next.delete(player.id);
        return next;
      });

      // Update player in state
      setPlayers((prev) =>
        prev.map((p) => (p.id === player.id ? { ...p, like_count: res.like_count } : p))
      );

      if (selectedPlayer?.id === player.id) {
        setSelectedPlayer((prev) => (prev ? { ...prev, like_count: res.like_count } : null));
      }
    } catch {
      // ignore
    }
  };

  return (
    <div className="min-h-screen bg-[#060911] text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-slate-950 cyber-grid">
      <Navbar currentView={currentView} onNavigate={handleNavigate} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8">
        {loading ? (
          <div className="py-32 flex flex-col items-center justify-center space-y-4">
            <div className="w-12 h-12 rounded-xl border-2 border-cyan-400 border-t-transparent animate-spin glow-cyan" />
            <p className="text-xs font-mono tracking-widest text-cyan-400 uppercase">
              Initializing Egoist Tactical Data...
            </p>
          </div>
        ) : (
          <>
            {currentView === 'home' && (
              <HomeView
                players={players}
                tierLists={tierLists}
                siteConfig={siteConfig}
                onNavigate={handleNavigate}
                onSelectPlayer={handleSelectPlayer}
              />
            )}

            {currentView === 'strikers' && (
              <ScoutHubView
                players={players}
                onSelectPlayer={handleSelectPlayer}
                onCompare={handleCompareWithPlayer}
                onLikeToggle={handleLikeToggle}
                likedPlayerIds={likedPlayerIds}
              />
            )}

            {currentView === 'striker-detail' && selectedPlayer && (
              <PlayerDetailView
                player={selectedPlayer}
                onBack={() => handleNavigate('strikers')}
                onCompareWithPlayer={handleCompareWithPlayer}
                onLikeToggle={handleLikeToggle}
                isLiked={likedPlayerIds.has(selectedPlayer.id)}
              />
            )}

            {currentView === 'compare' && (
              <EgoDuelView
                players={players}
                initialP1={compareP1}
                initialP2={compareP2}
                onSelectPlayer={handleSelectPlayer}
              />
            )}

            {currentView === 'builder' && (
              <SquadBuilderView
                players={players}
                onSelectPlayer={handleSelectPlayer}
                onRefreshData={loadData}
              />
            )}

            {currentView === 'tier-list-view' && activeTierListId && (
              <PublicTierListView
                tierListId={activeTierListId}
                players={players}
                onBack={() => handleNavigate('home')}
                onSelectPlayer={handleSelectPlayer}
              />
            )}
          </>
        )}
      </main>

      {/* Global Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 mt-12 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 font-bold font-heading text-xs">
              BL
            </div>
            <div>
              <div className="text-xs font-bold font-heading text-slate-200">
                BLUE LOCK: EGOIST SCOUT & TACTICS HUB
              </div>
              <div className="text-[10px] text-slate-500 font-mono">
                Project Architect: Ayinde Holt • Guided by Panel of Experts
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono text-slate-400">
            <span className="flex items-center gap-1">
              <Shield className="w-3.5 h-3.5 text-cyan-400" /> 25 Strikers
            </span>
            <span className="flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Recharts 6-Axis Radar
            </span>
            <span className="flex items-center gap-1">
              <Heart className="w-3.5 h-3.5 text-rose-400" /> Persistent DB
            </span>
          </div>
        </div>
      </footer>

      {/* Auth Modal for guest actions */}
      <AuthModal />
    </div>
  );
}
