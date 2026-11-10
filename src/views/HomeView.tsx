import React, { useState } from 'react';
import { Player, UserTierList, SiteConfig } from '../types.ts';
import { ChapterCountdown } from '../components/ChapterCountdown.tsx';
import { EgoRadarChart } from '../components/EgoRadarChart.tsx';
import { useSpoilers } from '../context/SpoilerContext.tsx';
import {
  Flame,
  Swords,
  Users,
  Award,
  BookOpen,
  ArrowRight,
  Eye,
  Sparkles,
  TrendingUp,
  BrainCircuit,
  Shuffle,
  Quote,
} from 'lucide-react';

interface HomeViewProps {
  players: Player[];
  tierLists: UserTierList[];
  siteConfig: SiteConfig;
  onNavigate: (view: string, params?: Record<string, string>) => void;
  onSelectPlayer: (player: Player) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  players,
  tierLists,
  siteConfig,
  onNavigate,
  onSelectPlayer,
}) => {
  const { spoilersEnabled } = useSpoilers();

  // Daily featured player: deterministic based on day of year, or customizable
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
  );
  const featuredIndex = dayOfYear % (players.length || 1);
  const spotlightPlayer: Player = players[featuredIndex] || players[0];

  // Random quote generator
  const [quoteIndex, setQuoteIndex] = useState<number>(0);
  const quotesList = players.filter((p) => p.quote && (!p.is_spoiler || spoilersEnabled));
  const currentQuotePlayer = quotesList[quoteIndex % quotesList.length] || players[0];

  // Active essay tab in Psychology hub
  const [activeEssay, setActiveEssay] = useState<'egoism' | 'flow' | 'zero'>('egoism');

  // Sorted public tier lists by (view_count + like_count) DESC
  const trendingTierLists = [...tierLists]
    .filter((t) => t.is_public)
    .sort((a, b) => (b.view_count + b.like_count) - (a.view_count + a.like_count))
    .slice(0, 4);

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Hero Banner */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-slate-950 via-[#070c18] to-slate-900 border border-cyan-500/30 p-6 md:p-10 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 left-1/3 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/50 text-cyan-300 text-xs font-mono font-bold tracking-wider uppercase mb-4 glow-cyan-sm">
            <Flame className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            BLUE LOCK STRATEGIC HEADQUARTERS
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black font-heading text-slate-100 tracking-tight leading-tight">
            AWAKEN YOUR INNER <span className="text-cyan-400 text-glow-cyan">EGOIST</span>
          </h1>

          <p className="text-slate-300 text-sm md:text-base mt-3 leading-relaxed">
            Scout 25 elite strikers across the Neo Egoist League. Conduct 6-axis ego radar duels, build high-chemistry tactical squads, and analyze the psychological architecture of Flow and Zero State.
          </p>

          <div className="flex flex-wrap items-center gap-3 mt-6">
            <button
              onClick={() => onNavigate('strikers')}
              className="px-5 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold font-heading text-xs uppercase tracking-wider transition-all glow-cyan cursor-pointer flex items-center gap-2"
            >
              Scout Database <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => onNavigate('compare', { p1: 'isagi-yoichi', p2: 'michael-kaiser' })}
              className="px-5 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-cyan-500/40 font-bold font-heading text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2"
            >
              <Swords className="w-4 h-4 text-cyan-400" />
              Ego Duel Simulator
            </button>
            <button
              onClick={() => onNavigate('builder')}
              className="px-5 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 font-bold font-heading text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2"
            >
              <Users className="w-4 h-4 text-amber-400" />
              Squad Lineup & Tier Canvas
            </button>
          </div>
        </div>
      </div>

      {/* Chapter Countdown Widget */}
      <ChapterCountdown initialConfig={siteConfig} />

      {/* Grid: Egoist Spotlight & Random Quote */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Egoist Spotlight Card (View 1 feature) */}
        {spotlightPlayer && (
          <div className="lg:col-span-8 rounded-2xl bg-slate-900/90 border border-cyan-500/40 p-5 md:p-6 relative overflow-hidden shadow-xl">
            <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/40">
                  <Flame className="w-4 h-4" />
                </span>
                <span className="text-xs font-bold font-heading tracking-wider uppercase text-cyan-300">
                  DAILY FEATURED EGOIST SPOTLIGHT
                </span>
              </div>
              <span className="text-[11px] font-mono text-slate-400">
                Rotates Every 24H
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
              <div className="md:col-span-5 flex flex-col items-center md:items-start text-center md:text-left">
                <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-2xl overflow-hidden border-2 border-cyan-400/60 mb-3 shadow-lg glow-cyan-sm">
                  <img
                    src={spotlightPlayer.portrait}
                    alt={spotlightPlayer.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 right-2 px-2 py-0.5 rounded bg-cyan-500 text-slate-950 font-black text-xs font-heading">
                    {spotlightPlayer.rank_tier}
                  </div>
                </div>

                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black font-heading text-slate-100">
                    {spotlightPlayer.overall_rating}
                  </span>
                  <span className="text-xs font-mono font-bold text-cyan-400">OVERALL RATING</span>
                </div>

                <h3 className="text-xl font-bold font-heading text-slate-100">
                  {spotlightPlayer.name}
                </h3>
                <p className="text-xs text-slate-400 font-mono">
                  {spotlightPlayer.team} • {spotlightPlayer.position}
                </p>

                <div className="mt-3 p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs w-full">
                  <span className="text-[10px] uppercase font-mono text-slate-500 block">EGO WEAPON</span>
                  <span className="font-semibold text-cyan-300">{spotlightPlayer.primary_weapon}</span>
                </div>

                <button
                  onClick={() => onSelectPlayer(spotlightPlayer)}
                  className="mt-4 w-full py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs uppercase font-heading tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  Inspect Full Scouting Dossier <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Radar visualization & Psychological breakdown */}
              <div className="md:col-span-7 flex flex-col justify-between">
                <div className="h-56">
                  <EgoRadarChart
                    stats1={spotlightPlayer.stats}
                    name1={spotlightPlayer.name}
                    color1="#00f0ff"
                  />
                </div>

                <div className="mt-2 p-3 rounded-xl bg-slate-950/70 border border-slate-800/80">
                  <div className="text-[10px] uppercase font-mono text-cyan-400 flex items-center gap-1 font-bold mb-1">
                    <BrainCircuit className="w-3 h-3" />
                    PSYCHOLOGICAL BLUEPRINT ({spotlightPlayer.psychology_profile.ego_type})
                  </div>
                  <p className="text-xs text-slate-300 italic leading-relaxed line-clamp-3">
                    "{spotlightPlayer.psychology_profile.analysis}"
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Memorable Quote & Quick Facts Card */}
        <div className="lg:col-span-4 flex flex-col justify-between space-y-4">
          {/* Quote Widget */}
          <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-5 relative overflow-hidden flex-1 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
                <span className="text-xs font-bold font-heading uppercase text-amber-400 flex items-center gap-1.5">
                  <Quote className="w-4 h-4" /> EGOIST DOCTRINE
                </span>
                <button
                  onClick={() => setQuoteIndex((prev) => prev + 1)}
                  className="text-xs p-1 text-slate-400 hover:text-cyan-400 transition-colors"
                  title="Next Quote"
                >
                  <Shuffle className="w-3.5 h-3.5" />
                </button>
              </div>

              <blockquote className="text-sm font-medium text-slate-200 italic leading-relaxed my-3">
                "{currentQuotePlayer.quote}"
              </blockquote>
            </div>

            <div className="flex items-center gap-2.5 pt-3 border-t border-slate-800/60">
              <img
                src={currentQuotePlayer.portrait}
                alt={currentQuotePlayer.name}
                className="w-8 h-8 rounded-full object-cover border border-cyan-500/40"
              />
              <div className="min-w-0">
                <div className="text-xs font-bold text-slate-200 truncate">
                  {currentQuotePlayer.name}
                </div>
                <div className="text-[10px] text-slate-500 font-mono">
                  {currentQuotePlayer.team}
                </div>
              </div>
            </div>
          </div>

          {/* Daily Fandom Fun Fact */}
          <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-5">
            <div className="text-xs font-bold font-heading uppercase text-emerald-400 flex items-center gap-1.5 mb-2">
              <Sparkles className="w-4 h-4" /> DAILY BLUELOCK TRIVIA
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Michael Kaiser's right-leg swing velocity is documented as faster than Noel Noa's, making the Kaiser Impact the fastest instantaneous ball-strike on planet Earth!
            </p>
          </div>
        </div>
      </div>

      {/* Public Tier List Carousel / Showcase */}
      <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-5 md:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-lg font-bold font-heading text-slate-100 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-cyan-400" />
              COMMUNITY TIER LIST SHOWCASE
            </h3>
            <p className="text-xs text-slate-400">
              Top curated tier rankings ordered by total engagement (views + likes).
            </p>
          </div>
          <button
            onClick={() => onNavigate('builder')}
            className="px-3 py-1.5 rounded-lg border border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/10 text-xs font-mono font-bold transition-all"
          >
            Create Your Own Tier List +
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {trendingTierLists.map((tl) => (
            <div
              key={tl.id}
              onClick={() => onNavigate('tier-list-view', { id: tl.id })}
              className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-cyan-500/60 transition-all cursor-pointer group hover:-translate-y-0.5"
            >
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 mb-2">
                <span>By @{tl.username}</span>
                <span className="flex items-center gap-1 text-rose-400">
                  ★ {tl.like_count}
                </span>
              </div>
              <h4 className="text-sm font-bold font-heading text-slate-200 group-hover:text-cyan-300 transition-colors line-clamp-1 mb-2">
                {tl.title}
              </h4>
              <div className="flex items-center gap-1 text-[10px] font-mono text-slate-400 mb-3">
                <Eye className="w-3 h-3 text-cyan-400" />
                <span>{tl.view_count} scout views</span>
              </div>
              <div className="flex gap-1">
                {(tl.tiers['S+'] || []).slice(0, 3).map((pid) => {
                  const p = players.find((pl) => pl.id === pid);
                  return (
                    <div
                      key={pid}
                      className="w-7 h-7 rounded border border-amber-400/40 bg-slate-900 overflow-hidden"
                      title={p?.name || pid}
                    >
                      {p && <img src={p.portrait} alt={p.name} className="w-full h-full object-cover" />}
                    </div>
                  );
                })}
                <span className="text-[10px] font-mono text-slate-500 self-center pl-1">
                  +{(tl.tiers['S+'] || []).length - 3 > 0 ? `${(tl.tiers['S+'] || []).length - 3} more` : ''}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Psychology Articles Hub (View 1 feature) */}
      <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-5 md:p-6">
        <div className="flex items-center gap-2 mb-4 border-b border-slate-800 pb-3">
          <BookOpen className="w-5 h-5 text-cyan-400" />
          <div>
            <h3 className="text-lg font-bold font-heading text-slate-100">
              BLUE LOCK PSYCHOLOGY ESSAYS & THEORIES
            </h3>
            <p className="text-xs text-slate-400">
              Deep dive into Jinpachi Ego’s psychological doctrine and mental states.
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-slate-800 pb-2 mb-4">
          <button
            onClick={() => setActiveEssay('egoism')}
            className={`px-3 py-1.5 rounded-lg text-xs font-heading font-bold uppercase tracking-wider transition-all ${
              activeEssay === 'egoism'
                ? 'bg-cyan-500 text-slate-950 glow-cyan-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            The Doctrine of Egoism
          </button>
          <button
            onClick={() => setActiveEssay('flow')}
            className={`px-3 py-1.5 rounded-lg text-xs font-heading font-bold uppercase tracking-wider transition-all ${
              activeEssay === 'flow'
                ? 'bg-cyan-500 text-slate-950 glow-cyan-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Flow State (Total Absorption)
          </button>
          <button
            onClick={() => setActiveEssay('zero')}
            className={`px-3 py-1.5 rounded-lg text-xs font-heading font-bold uppercase tracking-wider transition-all ${
              activeEssay === 'zero'
                ? 'bg-cyan-500 text-slate-950 glow-cyan-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Zero State (Awakening)
          </button>
        </div>

        {/* Tab content */}
        <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/80 leading-relaxed text-slate-300 text-sm">
          {activeEssay === 'egoism' && (
            <div className="space-y-3">
              <h4 className="text-base font-bold font-heading text-cyan-400">
                1. Egoism vs. False Collectivism
              </h4>
              <p>
                In conventional modern soccer, teamwork is preached as the ultimate virtue. Jinpachi Ego inverts this paradigm: 
                <strong> "A revolutionary striker does not exist to serve the team; the team naturally crystallizes around the striker’s absolute hunger to score."</strong>
              </p>
              <p>
                True egoism is not mere selfishness—it is the unrelenting pursuit of self-actualization through individual triumph. When two egoists clash on the pitch, they don’t cancel each other out; they ignite a chemical reaction that elevates football beyond predictable tactical systems.
              </p>
            </div>
          )}

          {activeEssay === 'flow' && (
            <div className="space-y-3">
              <h4 className="text-base font-bold font-heading text-cyan-400">
                2. Flow State: Balancing Anxiety and Boredom
              </h4>
              <p>
                Flow occurs when an egoist faces a challenge that sits exactly on the razor’s edge between impossible despair and effortless boredom. When cognitive load reaches its peak, conscious thought vanishes and subconscious instinct takes full control of motor reflex.
              </p>
              <p>
                Players like Isagi Yoichi enter Flow through cognitive immersion (Metavision pattern deconstruction), while players like Meguru Bachira enter Flow through pure visceral play (dancing with the inner monster).
              </p>
            </div>
          )}

          {activeEssay === 'zero' && (
            <div className="space-y-3">
              <h4 className="text-base font-bold font-heading text-cyan-400">
                3. Zero State: Stripping the Soul to its Core
              </h4>
              <p>
                The Zero State represents an egoist's complete shedding of superficial titles, social validation, and intellectual pretenses. When Michael Kaiser realized his aristocratic supremacy was a fragile shield, he entered Zero State by embracing absolute humiliation and stripping his soccer down to pure malice.
              </p>
              <p>
                In Zero State, stat limits are broken (EX ratings exceeding 99), and players discover their primal original formula.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
