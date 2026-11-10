import React, { useState, useEffect } from 'react';
import { SiteConfig } from '../types.ts';
import { api } from '../services/api.ts';
import { Clock, Calendar, AlertCircle, Edit2, Check, X, Sparkles } from 'lucide-react';

interface ChapterCountdownProps {
  initialConfig?: SiteConfig;
}

export const ChapterCountdown: React.FC<ChapterCountdownProps> = ({ initialConfig }) => {
  const [config, setConfig] = useState<SiteConfig | null>(initialConfig || null);
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number; isPast: boolean }>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isPast: false,
  });
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editDate, setEditDate] = useState<string>('');
  const [editChapter, setEditChapter] = useState<number>(312);
  const [editArc, setEditArc] = useState<string>('');

  useEffect(() => {
    let mounted = true;
    const fetchConfig = async () => {
      try {
        const c = await api.getSiteConfig();
        if (mounted) {
          setConfig(c);
          setEditDate(c.next_chapter_release.slice(0, 16));
          setEditChapter(c.chapter_number);
          setEditArc(c.arc_name);
        }
      } catch {
        // use fallback
      }
    };
    fetchConfig();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!config?.next_chapter_release) return;

    const calculateTime = () => {
      const target = new Date(config.next_chapter_release).getTime();
      const now = new Date().getTime();
      const difference = target - now;

      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true });
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds, isPast: false });
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [config?.next_chapter_release]);

  const handleSaveConfig = async () => {
    if (!editDate) return;
    try {
      const updated = await api.updateSiteConfig({
        next_chapter_release: new Date(editDate).toISOString(),
        chapter_number: editChapter,
        arc_name: editArc,
      });
      setConfig(updated);
      setIsEditing(false);
    } catch {
      alert('Failed to update countdown date');
    }
  };

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-cyan-500/30 p-5 md:p-6 shadow-xl">
      <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-950 border border-cyan-500/40 text-cyan-300 text-xs font-mono font-bold tracking-wider uppercase">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              LIVE MANGA RADAR
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Weekly Shonen Magazine
            </span>
          </div>

          <h3 className="text-xl md:text-2xl font-bold font-heading text-slate-100 flex items-center gap-2">
            CHAPTER {config?.chapter_number || 312} AIR DROP COUNTDOWN
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="p-1 text-slate-500 hover:text-cyan-400 transition-colors"
              title="Adjust release target date"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
          </h3>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            {config?.arc_name || 'Neo Egoist League: Bastard München vs PXG'} — {config?.announcement || 'Target synchronized from site_config database.'}
          </p>
        </div>

        {/* Live Counter Display */}
        {timeLeft.isPast ? (
          <div className="flex items-center gap-3 px-5 py-3 rounded-xl bg-emerald-950/60 border border-emerald-500/50 text-emerald-300">
            <Sparkles className="w-6 h-6 text-emerald-400 animate-pulse" />
            <div>
              <div className="text-sm font-bold font-heading uppercase">CHAPTER IS LIVE!</div>
              <div className="text-xs text-emerald-400/80">Available now in official weekly publications.</div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-2 sm:gap-3 text-center">
            <div className="px-3 py-2 sm:px-4 sm:py-3 rounded-xl bg-slate-950/80 border border-cyan-500/30 min-w-[62px] sm:min-w-[72px]">
              <div className="text-xl sm:text-2xl font-bold font-heading text-cyan-400 text-glow-cyan">
                {String(timeLeft.days).padStart(2, '0')}
              </div>
              <div className="text-[10px] uppercase font-mono text-slate-400 font-semibold tracking-wider">
                DAYS
              </div>
            </div>
            <div className="px-3 py-2 sm:px-4 sm:py-3 rounded-xl bg-slate-950/80 border border-cyan-500/30 min-w-[62px] sm:min-w-[72px]">
              <div className="text-xl sm:text-2xl font-bold font-heading text-cyan-400 text-glow-cyan">
                {String(timeLeft.hours).padStart(2, '0')}
              </div>
              <div className="text-[10px] uppercase font-mono text-slate-400 font-semibold tracking-wider">
                HOURS
              </div>
            </div>
            <div className="px-3 py-2 sm:px-4 sm:py-3 rounded-xl bg-slate-950/80 border border-cyan-500/30 min-w-[62px] sm:min-w-[72px]">
              <div className="text-xl sm:text-2xl font-bold font-heading text-cyan-400 text-glow-cyan">
                {String(timeLeft.minutes).padStart(2, '0')}
              </div>
              <div className="text-[10px] uppercase font-mono text-slate-400 font-semibold tracking-wider">
                MINS
              </div>
            </div>
            <div className="px-3 py-2 sm:px-4 sm:py-3 rounded-xl bg-slate-950/80 border border-cyan-500/30 min-w-[62px] sm:min-w-[72px]">
              <div className="text-xl sm:text-2xl font-bold font-heading text-rose-400 text-glow-crimson animate-pulse">
                {String(timeLeft.seconds).padStart(2, '0')}
              </div>
              <div className="text-[10px] uppercase font-mono text-slate-400 font-semibold tracking-wider">
                SECS
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Inline Date Config Editor */}
      {isEditing && (
        <div className="mt-4 pt-4 border-t border-slate-800 bg-slate-950/90 rounded-xl p-4 animate-fade-in">
          <div className="text-xs font-bold text-cyan-400 font-mono uppercase mb-2 flex items-center gap-1.5">
            <Calendar className="w-4 h-4" /> Adjust Target Release in site_config
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Target Timestamp</label>
              <input
                type="datetime-local"
                value={editDate}
                onChange={(e) => setEditDate(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-100"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Chapter #</label>
              <input
                type="number"
                value={editChapter}
                onChange={(e) => setEditChapter(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-100"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Arc Name</label>
              <input
                type="text"
                value={editArc}
                onChange={(e) => setEditArc(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-100"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-3">
            <button
              onClick={() => setIsEditing(false)}
              className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs flex items-center gap-1 font-mono"
            >
              <X className="w-3.5 h-3.5" /> Cancel
            </button>
            <button
              onClick={handleSaveConfig}
              className="px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1 font-mono"
            >
              <Check className="w-3.5 h-3.5" /> Save Target
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
