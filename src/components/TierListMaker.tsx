import React, { useState, useMemo } from 'react';
import Papa from 'papaparse';
import confetti from 'canvas-confetti';
import { Player, TierMetaItem } from '../types.ts';
import { CharacterPanel } from './CharacterPanel.tsx';
import {
  Settings,
  ChevronUp,
  ChevronDown,
  Plus,
  Trash2,
  RotateCcw,
  Download,
  Save,
  Search,
  Pin,
  PinOff,
  X,
  Check,
  Wand2,
  Image as ImageIcon,
  ExternalLink,
} from 'lucide-react';

export interface TierRowState {
  id: string;
  label: string;
  color: string;
  playerIds: string[];
}

export const TIERMAKER_SWATCHES = [
  '#FF7F7F', // Classic S - Coral Red
  '#FFBF7F', // Classic A - Peach Orange
  '#FFDF7F', // Classic B - Amber Gold
  '#FFFF7F', // Classic C - Yellow
  '#BFFF7F', // Classic D - Lime
  '#7FFF7F', // Mint
  '#7FFFFF', // Aqua
  '#7FBFFF', // Sky Blue
  '#7F7FFF', // Periwinkle
  '#BF7FFF', // Violet
  '#FF7FFF', // Magenta
  '#FF7FBF', // Pink
  '#E2E8F0', // Chalk
  '#94A3B8', // Steel
  '#334155', // Charcoal
];

export const DEFAULT_TIER_ROWS: TierRowState[] = [
  { id: 'tier-s', label: 'S', color: '#FF7F7F', playerIds: [] },
  { id: 'tier-a', label: 'A', color: '#FFBF7F', playerIds: [] },
  { id: 'tier-b', label: 'B', color: '#FFDF7F', playerIds: [] },
  { id: 'tier-c', label: 'C', color: '#FFFF7F', playerIds: [] },
  { id: 'tier-d', label: 'D', color: '#BFFF7F', playerIds: [] },
];

export function getLegacyColorForLabel(label: string, idx: number): string {
  const map: Record<string, string> = {
    'S+': '#FF7F7F',
    S: '#FFBF7F',
    A: '#FFDF7F',
    B: '#FFFF7F',
    C: '#BFFF7F',
    D: '#7FBFFF',
  };
  return map[label] || TIERMAKER_SWATCHES[idx % TIERMAKER_SWATCHES.length];
}

export function getContrastTextColor(hex: string): string {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16) || 200;
  const g = parseInt(clean.substring(2, 4), 16) || 200;
  const b = parseInt(clean.substring(4, 6), 16) || 200;
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.52 ? '#111827' : '#F8FAFC';
}

export function hydrateTierRows(
  tiers: Record<string, string[]>,
  tierMeta?: TierMetaItem[]
): TierRowState[] {
  if (tierMeta && tierMeta.length > 0) {
    return tierMeta.map((m, idx) => ({
      id: `tier-${idx}-${Date.now()}`,
      label: m.label,
      color: m.color || getLegacyColorForLabel(m.label, idx),
      playerIds: Array.isArray(tiers[m.label]) ? [...tiers[m.label]] : [],
    }));
  }

  const entries = Object.entries(tiers);
  if (entries.length === 0) return DEFAULT_TIER_ROWS.map((r) => ({ ...r, playerIds: [] }));

  return entries.map(([label, playerIds], idx) => ({
    id: `tier-${idx}-${label}`,
    label,
    color: getLegacyColorForLabel(label, idx),
    playerIds: Array.isArray(playerIds) ? [...playerIds] : [],
  }));
}

interface DragPayload {
  playerId: string;
  sourceTierId: string | 'pool';
}

interface TierListMakerProps {
  players: Player[];
  title: string;
  onTitleChange: (title: string) => void;
  rows: TierRowState[];
  onRowsChange: (rows: TierRowState[]) => void;
  isPublic: boolean;
  onIsPublicChange: (val: boolean) => void;
  onSave: () => Promise<void>;
  onSelectPlayer?: (player: Player) => void;
  onToast: (text: string, type?: 'success' | 'error') => void;
}

export const TierListMaker: React.FC<TierListMakerProps> = ({
  players,
  title,
  onTitleChange,
  rows,
  onRowsChange,
  isPublic,
  onIsPublicChange,
  onSave,
  onSelectPlayer,
  onToast,
}) => {
  const [dragPayload, setDragPayload] = useState<DragPayload | null>(null);
  const [dragOverTarget, setDragOverTarget] = useState<string | null>(null);
  const [dragOverTileId, setDragOverTileId] = useState<string | null>(null);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [settingsRowId, setSettingsRowId] = useState<string | null>(null);
  const [poolSearch, setPoolSearch] = useState<string>('');
  const [poolClubFilter, setPoolClubFilter] = useState<string>('ALL');
  const [isPoolPinned, setIsPoolPinned] = useState<boolean>(false);
  const [isExportingImage, setIsExportingImage] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const playerMap = useMemo(() => {
    const map = new Map<string, Player>();
    players.forEach((p) => map.set(p.id, p));
    return map;
  }, [players]);

  const placedPlayerIds = useMemo(() => {
    const set = new Set<string>();
    rows.forEach((r) => r.playerIds.forEach((id) => set.add(id)));
    return set;
  }, [rows]);

  const unrankedPlayers = useMemo(() => {
    return players.filter((p) => {
      if (placedPlayerIds.has(p.id)) return false;
      if (poolSearch.trim()) {
        const q = poolSearch.toLowerCase();
        if (
          !p.name.toLowerCase().includes(q) &&
          !p.team.toLowerCase().includes(q) &&
          !p.position.toLowerCase().includes(q)
        ) {
          return false;
        }
      }
      if (poolClubFilter !== 'ALL') {
        if (poolClubFilter === 'MASTERS') {
          const masters = new Set([
            'noel-noa', 'marc-snuffy', 'chris-prince', 'lavinho', 'julian-loki',
            'leonardo-luna', 'adam-blake', 'dada-silva', 'pablo-cavasoz',
            'charles-chevalier', 'bunny-iglesias', 'vivian-hugo', 'jinpachi-ego',
          ]);
          if (!masters.has(p.id)) return false;
        } else if (poolClubFilter === 'SELECTION') {
          if (!['Team Z', 'Team Y', 'Team W', 'Blue Lock Entrance', 'Blue Lock Facility', 'Blue Lock Top 35', 'Blue Lock Side-B'].includes(p.team)) {
            return false;
          }
        } else if (poolClubFilter === 'INTL') {
          if (!['Nigeria U-20', 'France U-20', 'Germany U-20', 'Japan U-20', 'World Five'].includes(p.team)) {
            return false;
          }
        } else if (!p.team.toLowerCase().includes(poolClubFilter.toLowerCase())) {
          return false;
        }
      }
      return true;
    });
  }, [players, placedPlayerIds, poolSearch, poolClubFilter]);

  const totalUnrankedCount = useMemo(
    () => players.filter((p) => !placedPlayerIds.has(p.id)).length,
    [players, placedPlayerIds]
  );

  const selectedPlayer = selectedPlayerId ? playerMap.get(selectedPlayerId) || null : null;
  const activeSettingsRow = settingsRowId ? rows.find((r) => r.id === settingsRowId) || null : null;

  // Move player into target tier (optionally before a specific player tile)
  const movePlayerToTier = (
    playerId: string,
    targetTierId: string,
    insertBeforePlayerId?: string
  ) => {
    const nextRows = rows.map((row) => {
      const cleaned = row.playerIds.filter((id) => id !== playerId);
      if (row.id !== targetTierId) {
        return { ...row, playerIds: cleaned };
      }

      if (insertBeforePlayerId && insertBeforePlayerId !== playerId) {
        const idx = cleaned.indexOf(insertBeforePlayerId);
        if (idx >= 0) {
          const updated = [...cleaned];
          updated.splice(idx, 0, playerId);
          return { ...row, playerIds: updated };
        }
      }

      return { ...row, playerIds: [...cleaned, playerId] };
    });

    onRowsChange(nextRows);
    setSelectedPlayerId(null);
  };

  // Return a single player back to the unranked dock
  const unrankPlayer = (playerId: string) => {
    onRowsChange(
      rows.map((row) => ({
        ...row,
        playerIds: row.playerIds.filter((id) => id !== playerId),
      }))
    );
    if (selectedPlayerId === playerId) setSelectedPlayerId(null);
  };

  // Drag handlers
  const handleDragStart = (
    e: React.DragEvent,
    playerId: string,
    sourceTierId: string | 'pool'
  ) => {
    setDragPayload({ playerId, sourceTierId });
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', playerId);
  };

  const handleDragEnd = () => {
    setDragPayload(null);
    setDragOverTarget(null);
    setDragOverTileId(null);
  };

  const handleDropOnRow = (e: React.DragEvent, targetTierId: string) => {
    e.preventDefault();
    const pid = dragPayload?.playerId || e.dataTransfer.getData('text/plain');
    if (pid) {
      movePlayerToTier(pid, targetTierId);
    }
    handleDragEnd();
  };

  const handleDropOnTile = (
    e: React.DragEvent,
    targetTierId: string,
    targetPlayerId: string
  ) => {
    e.preventDefault();
    e.stopPropagation();
    const pid = dragPayload?.playerId || e.dataTransfer.getData('text/plain');
    if (pid && pid !== targetPlayerId) {
      movePlayerToTier(pid, targetTierId, targetPlayerId);
    }
    handleDragEnd();
  };

  const handleDropOnPool = (e: React.DragEvent) => {
    e.preventDefault();
    const pid = dragPayload?.playerId || e.dataTransfer.getData('text/plain');
    if (pid) {
      unrankPlayer(pid);
    }
    handleDragEnd();
  };

  // Row operations
  const moveRow = (rowId: string, direction: -1 | 1) => {
    const idx = rows.findIndex((r) => r.id === rowId);
    const nextIdx = idx + direction;
    if (idx < 0 || nextIdx < 0 || nextIdx >= rows.length) return;
    const copy = [...rows];
    const [item] = copy.splice(idx, 1);
    copy.splice(nextIdx, 0, item);
    onRowsChange(copy);
  };

  const updateRowMeta = (rowId: string, patch: Partial<Pick<TierRowState, 'label' | 'color'>>) => {
    onRowsChange(rows.map((r) => (r.id === rowId ? { ...r, ...patch } : r)));
  };

  const clearRowImages = (rowId: string) => {
    onRowsChange(rows.map((r) => (r.id === rowId ? { ...r, playerIds: [] } : r)));
    onToast('Row cleared back to unranked pool.');
  };

  const deleteRow = (rowId: string) => {
    if (rows.length <= 1) {
      onToast('Keep at least one tier row on the board.', 'error');
      return;
    }
    onRowsChange(rows.filter((r) => r.id !== rowId));
    setSettingsRowId(null);
    onToast('Tier row removed. Players moved to unranked pool.');
  };

  const insertRowRelative = (anchorRowId: string | null, position: 'above' | 'below') => {
    const nextColor = TIERMAKER_SWATCHES[rows.length % TIERMAKER_SWATCHES.length];
    const newRow: TierRowState = {
      id: `tier-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      label: `Tier ${rows.length + 1}`,
      color: nextColor,
      playerIds: [],
    };
    if (!anchorRowId) {
      onRowsChange([...rows, newRow]);
      return;
    }
    const idx = rows.findIndex((r) => r.id === anchorRowId);
    if (idx === -1) {
      onRowsChange([...rows, newRow]);
      return;
    }
    const copy = [...rows];
    copy.splice(position === 'above' ? idx : idx + 1, 0, newRow);
    onRowsChange(copy);
  };

  const handleResetAll = () => {
    onRowsChange(rows.map((r) => ({ ...r, playerIds: [] })));
    setSelectedPlayerId(null);
    onToast('All players moved back to the unranked pool.');
  };

  const handleAutoRank = () => {
    const sorted = [...players].sort((a, b) => b.overall_rating - a.overall_rating);
    const nextRows = rows.map((r) => ({ ...r, playerIds: [] as string[] }));
    sorted.forEach((p) => {
      let idx = 0;
      if (p.overall_rating >= 96) idx = 0;
      else if (p.overall_rating >= 91) idx = Math.min(1, nextRows.length - 1);
      else if (p.overall_rating >= 87) idx = Math.min(2, nextRows.length - 1);
      else if (p.overall_rating >= 83) idx = Math.min(3, nextRows.length - 1);
      else idx = Math.min(4, nextRows.length - 1);
      nextRows[idx].playerIds.push(p.id);
    });
    onRowsChange(nextRows);
    onToast('Populated tiers by Blue Lock Overall Rating!');
  };

  const handleSaveClick = async () => {
    setIsSaving(true);
    try {
      await onSave();
    } finally {
      setIsSaving(false);
    }
  };

  // CSV Export
  const handleExportCSV = () => {
    const csvData: Record<string, string | number>[] = [];
    rows.forEach((row) => {
      row.playerIds.forEach((pid, pos) => {
        const p = playerMap.get(pid);
        if (p) {
          csvData.push({
            Tier: row.label,
            OrderInTier: pos + 1,
            Name: p.name,
            Team: p.team,
            Position: p.position,
            Overall: p.overall_rating,
            PrimaryWeapon: p.primary_weapon,
          });
        }
      });
    });

    if (csvData.length === 0) {
      onToast('Place at least one player into a tier before exporting CSV.', 'error');
      return;
    }

    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${(title || 'Blue_Lock_Tier_List').replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    onToast('Tier list exported as CSV.');
  };

  // Clean Canvas PNG Download (TierMaker "Save or Download" style)
  const handleDownloadPNG = async () => {
    setIsExportingImage(true);
    try {
      const boardWidth = 1080;
      const labelWidth = 148;
      const tileSize = 84;
      const tileGap = 8;
      const rowPad = 10;
      const headerHeight = 68;
      const footerHeight = 36;
      const zoneWidth = boardWidth - labelWidth - rowPad * 2;
      const colsPerRow = Math.max(1, Math.floor((zoneWidth + tileGap) / (tileSize + tileGap)));

      const rowLayouts = rows.map((row) => {
        const count = Math.max(1, row.playerIds.length);
        const lines = Math.ceil(count / colsPerRow);
        const height = Math.max(104, lines * tileSize + (lines - 1) * tileGap + rowPad * 2);
        return { row, height };
      });

      const totalHeight =
        headerHeight + rowLayouts.reduce((acc, item) => acc + item.height + 2, 0) + footerHeight;

      const canvas = document.createElement('canvas');
      canvas.width = boardWidth;
      canvas.height = totalHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas not supported');

      // Background
      ctx.fillStyle = '#0B0E14';
      ctx.fillRect(0, 0, boardWidth, totalHeight);

      // Header Banner
      ctx.fillStyle = '#111622';
      ctx.fillRect(0, 0, boardWidth, headerHeight);
      ctx.fillStyle = '#38BDF8';
      ctx.font = 'bold 12px monospace';
      ctx.fillText('BLUE LOCK TIER MAKER', 24, 24);
      ctx.fillStyle = '#F8FAFC';
      ctx.font = 'bold 26px sans-serif';
      ctx.fillText(title || 'Blue Lock Player Tier List', 24, 52);

      // Preload images for placed players
      const uniqueIds = Array.from(new Set(rows.flatMap((r) => r.playerIds)));
      const loadedImgs = new Map<string, HTMLImageElement>();
      await Promise.all(
        uniqueIds.map(
          (pid) =>
            new Promise<void>((resolve) => {
              const p = playerMap.get(pid);
              const img = new Image();
              img.crossOrigin = 'anonymous';
              img.onload = () => {
                loadedImgs.set(pid, img);
                resolve();
              };
              img.onerror = () => resolve();
              img.src = p?.portrait?.startsWith('/portraits/') ? p.portrait : `/portraits/${pid}.png`;
            })
        )
      );

      // Draw each tier row
      let currentY = headerHeight + 2;
      for (const { row, height } of rowLayouts) {
        // Row body background
        ctx.fillStyle = '#181B24';
        ctx.fillRect(labelWidth, currentY, boardWidth - labelWidth, height);

        // Left colored label box
        ctx.fillStyle = row.color;
        ctx.fillRect(0, currentY, labelWidth, height);

        // Label text
        ctx.fillStyle = getContrastTextColor(row.color);
        ctx.font = 'bold 24px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const labelText = row.label.length > 12 ? `${row.label.slice(0, 11)}…` : row.label;
        ctx.fillText(labelText, labelWidth / 2, currentY + height / 2);

        // Tiles
        row.playerIds.forEach((pid, idx) => {
          const colIdx = idx % colsPerRow;
          const lineIdx = Math.floor(idx / colsPerRow);
          const x = labelWidth + rowPad + colIdx * (tileSize + tileGap);
          const y = currentY + rowPad + lineIdx * (tileSize + tileGap);

          const img = loadedImgs.get(pid);
          if (img) {
            const side = Math.min(img.width, img.height);
            const sx = (img.width - side) / 2;
            const sy = (img.height - side) / 2;
            ctx.drawImage(img, sx, sy, side, side, x, y, tileSize, tileSize);
          } else {
            ctx.fillStyle = '#1E293B';
            ctx.fillRect(x, y, tileSize, tileSize);
          }
          ctx.strokeStyle = 'rgba(255,255,255,0.14)';
          ctx.lineWidth = 1;
          ctx.strokeRect(x, y, tileSize, tileSize);
        });

        currentY += height + 2;
      }

      // Footer credit
      ctx.fillStyle = '#64748B';
      ctx.font = '12px monospace';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(
        `Ranked ${placedPlayerIds.size}/${players.length} Blue Lock Players`,
        24,
        totalHeight - footerHeight / 2
      );

      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `${(title || 'Blue_Lock_Tier_List').replace(/\s+/g, '_')}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      confetti({ particleCount: 45, spread: 55, origin: { y: 0.7 } });
      onToast('Tier list PNG downloaded!');
    } catch {
      onToast('Could not generate PNG image.', 'error');
    } finally {
      setIsExportingImage(false);
    }
  };

  const clubFilters = [
    { id: 'ALL', label: 'All' },
    { id: 'Bastard', label: 'Bastard München' },
    { id: 'PXG', label: 'P×G' },
    { id: 'Manshine', label: 'Manshine' },
    { id: 'Ubers', label: 'Ubers' },
    { id: 'Barcha', label: 'Barcha' },
    { id: 'SELECTION', label: 'Blue Lock' },
    { id: 'INTL', label: 'U-20 / World' },
    { id: 'MASTERS', label: 'Masters / XI' },
  ];

  return (
    <div className="space-y-5">
      {/* Compact Workspace Controls Header */}
      <div className="p-4 rounded-xl bg-slate-900/95 border border-slate-800 flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div className="flex-1 min-w-0">
          <label className="text-xs font-mono text-slate-400 block mb-1.5">
            Tier List Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder="All Blue Lock Players Tier List"
            className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-400 rounded-lg px-3.5 py-2 text-sm font-heading font-bold text-slate-100 focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <label className="text-xs font-mono text-slate-300 flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 cursor-pointer select-none whitespace-nowrap">
            <input
              type="checkbox"
              checked={isPublic}
              onChange={(e) => onIsPublicChange(e.target.checked)}
              className="rounded border-slate-600 text-cyan-500"
            />
            Public Showcase
          </label>

          <button
            type="button"
            onClick={() => insertRowRelative(null, 'below')}
            className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5 text-cyan-400" />
            Add Row
          </button>

          <button
            type="button"
            onClick={handleAutoRank}
            className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
            title="Fill rows using current Overall Ratings"
          >
            <Wand2 className="w-3.5 h-3.5 text-amber-400" />
            Auto-Rank
          </button>

          <button
            type="button"
            onClick={handleResetAll}
            className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-rose-300 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </button>

          <button
            type="button"
            onClick={handleDownloadPNG}
            disabled={isExportingImage}
            className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap disabled:opacity-50"
          >
            <ImageIcon className="w-3.5 h-3.5 text-emerald-400" />
            {isExportingImage ? 'Rendering...' : 'Download PNG'}
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            Export CSV
          </button>

          <button
            type="button"
            onClick={handleSaveClick}
            disabled={isSaving}
            className="px-4 py-2 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-heading font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            {isSaving ? 'Saving...' : 'Save Tier List'}
          </button>
        </div>
      </div>

      {/* Selected Player Helper Strip (for Click-to-Place without dragging) */}
      {selectedPlayer && (
        <div className="px-4 py-2.5 rounded-lg bg-cyan-950/60 border border-cyan-500/40 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 text-xs text-cyan-100">
            <div className="w-7 h-7 rounded overflow-hidden border border-cyan-400 shrink-0">
              <CharacterPanel player={selectedPlayer} size="sm" showBadge={false} />
            </div>
            <span>
              Selected <strong>{selectedPlayer.name}</strong> — click any tier row to place, or click another tile to swap.
            </span>
          </div>
          <div className="flex items-center gap-2">
            {onSelectPlayer && (
              <button
                type="button"
                onClick={() => onSelectPlayer(selectedPlayer)}
                className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs text-cyan-300 flex items-center gap-1 cursor-pointer"
              >
                <ExternalLink className="w-3 h-3" /> Scout Profile
              </button>
            )}
            {placedPlayerIds.has(selectedPlayer.id) && (
              <button
                type="button"
                onClick={() => unrankPlayer(selectedPlayer.id)}
                className="px-2.5 py-1 rounded bg-rose-950/70 hover:bg-rose-900 border border-rose-500/40 text-xs text-rose-200 cursor-pointer"
              >
                Unrank
              </button>
            )}
            <button
              type="button"
              onClick={() => setSelectedPlayerId(null)}
              className="p-1 text-slate-400 hover:text-white cursor-pointer"
              aria-label="Clear selection"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* TIERMAKER BOARD */}
      <div className="rounded-lg border-2 border-slate-800 bg-[#0b0d13] overflow-hidden shadow-2xl divide-y-2 divide-[#0b0d13]">
        {rows.map((row, rowIndex) => {
          const isDropTarget = dragOverTarget === row.id;
          const textColor = getContrastTextColor(row.color);

          return (
            <div
              key={row.id}
              onDragOver={(e) => {
                e.preventDefault();
                if (dragOverTarget !== row.id) setDragOverTarget(row.id);
              }}
              onDragLeave={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                  setDragOverTarget(null);
                }
              }}
              onDrop={(e) => handleDropOnRow(e, row.id)}
              onClick={() => {
                if (selectedPlayerId) {
                  movePlayerToTier(selectedPlayerId, row.id);
                }
              }}
              className={`flex items-stretch min-h-[84px] transition-colors ${
                selectedPlayerId ? 'cursor-pointer' : ''
              }`}
            >
              {/* Left TierMaker Label Box */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (selectedPlayerId) {
                    movePlayerToTier(selectedPlayerId, row.id);
                  } else {
                    setSettingsRowId(row.id);
                  }
                }}
                style={{ backgroundColor: row.color, color: textColor }}
                className="w-20 sm:w-28 shrink-0 px-2 py-2 flex items-center justify-center text-center font-heading font-black text-base sm:text-xl leading-tight break-words border-r-2 border-[#0b0d13] hover:brightness-95 transition-all cursor-pointer select-none"
                title={`Click to customize "${row.label}" tier`}
              >
                {row.label}
              </button>

              {/* Center Character Drop Zone */}
              <div
                className={`flex-1 p-1.5 flex flex-wrap gap-1.5 items-center content-start min-h-[84px] transition-colors ${
                  isDropTarget
                    ? 'bg-cyan-950/35 ring-2 ring-inset ring-cyan-400/70'
                    : 'bg-[#181a22]'
                }`}
              >
                {row.playerIds.map((pid) => {
                  const player = playerMap.get(pid);
                  if (!player) return null;
                  const isSelected = selectedPlayerId === pid;
                  const isTileOver = dragOverTileId === pid;

                  return (
                    <div
                      key={pid}
                      draggable
                      onDragStart={(e) => handleDragStart(e, pid, row.id)}
                      onDragEnd={handleDragEnd}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setDragOverTarget(row.id);
                        setDragOverTileId(pid);
                      }}
                      onDragLeave={() => setDragOverTileId(null)}
                      onDrop={(e) => handleDropOnTile(e, row.id, pid)}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedPlayerId(isSelected ? null : pid);
                      }}
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        unrankPlayer(pid);
                      }}
                      title={`${player.name} (${player.overall_rating} OVR) — Drag to move, double-click to unrank`}
                      className={`relative group w-[68px] h-[68px] sm:w-[76px] sm:h-[76px] shrink-0 overflow-hidden bg-slate-950 cursor-grab active:cursor-grabbing select-none transition-transform duration-150 ${
                        isTileOver ? 'border-l-4 border-cyan-400 scale-105' : 'border border-white/10'
                      } ${isSelected ? 'ring-2 ring-cyan-400 scale-105 z-10' : 'hover:scale-[1.03]'}`}
                    >
                      <CharacterPanel player={player} size="sm" showBadge={false} />

                      {/* Subtle bottom name on hover only, keeping TierMaker clean tile appearance */}
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent px-1 py-0.5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                        <span className="text-[10px] font-semibold text-white block truncate leading-tight text-center">
                          {player.name.split(' ')[0]}
                        </span>
                      </div>

                      {/* Quick remove corner button on hover */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          unrankPlayer(pid);
                        }}
                        className="absolute top-0.5 right-0.5 w-4 h-4 rounded-sm bg-black/80 text-slate-200 hover:bg-rose-600 hover:text-white opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer"
                        title="Return to unranked pool"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })}

                {row.playerIds.length === 0 && (
                  <span className="px-3 text-xs font-mono text-slate-600 select-none">
                    {selectedPlayerId
                      ? `Click to place ${selectedPlayer?.name.split(' ')[0]} here`
                      : 'Drag players here'}
                  </span>
                )}
              </div>

              {/* Right TierMaker Row Control Column (Settings Gear + Up/Down Arrows) */}
              <div
                onClick={(e) => e.stopPropagation()}
                className="w-14 sm:w-16 shrink-0 bg-[#05060a] border-l border-slate-800/80 flex items-center justify-center gap-0.5 px-1"
              >
                <button
                  type="button"
                  onClick={() => setSettingsRowId(row.id)}
                  className="p-1.5 text-slate-400 hover:text-white transition-colors cursor-pointer"
                  title="Edit row label, color, or position"
                  aria-label={`Row settings for ${row.label}`}
                >
                  <Settings className="w-4 h-4" />
                </button>
                <div className="flex flex-col">
                  <button
                    type="button"
                    disabled={rowIndex === 0}
                    onClick={() => moveRow(row.id, -1)}
                    className="p-0.5 text-slate-400 hover:text-white disabled:opacity-25 cursor-pointer disabled:cursor-default"
                    title="Move row up"
                    aria-label={`Move ${row.label} up`}
                  >
                    <ChevronUp className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    disabled={rowIndex === rows.length - 1}
                    onClick={() => moveRow(row.id, 1)}
                    className="p-0.5 text-slate-400 hover:text-white disabled:opacity-25 cursor-pointer disabled:cursor-default"
                    title="Move row down"
                    aria-label={`Move ${row.label} down`}
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* UNRANKED PLAYER DOCK (TierMaker Image Carousel / Pool) */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          if (dragOverTarget !== 'pool') setDragOverTarget('pool');
        }}
        onDragLeave={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node)) {
            setDragOverTarget(null);
          }
        }}
        onDrop={handleDropOnPool}
        className={`rounded-xl border transition-colors ${
          isPoolPinned
            ? 'sticky bottom-3 z-30 bg-[#0d1018]/95 backdrop-blur-md shadow-2xl border-cyan-500/40 max-h-[270px] flex flex-col'
            : 'bg-slate-900/90 border-slate-800'
        } ${dragOverTarget === 'pool' ? 'ring-2 ring-cyan-400/70 bg-cyan-950/20' : ''}`}
      >
        {/* Dock Header & Filters */}
        <div className="p-3 sm:px-4 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-heading font-bold text-slate-100 whitespace-nowrap">
              Player Pool
            </h3>
            <span className="text-xs font-mono tabular-nums text-slate-400">
              {totalUnrankedCount} of {players.length} unranked
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={poolSearch}
                onChange={(e) => setPoolSearch(e.target.value)}
                placeholder="Search player..."
                className="bg-slate-950 border border-slate-700 focus:border-cyan-400 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-100 w-36 sm:w-44 focus:outline-none"
              />
            </div>

            {/* Club filter buttons */}
            <div className="flex items-center gap-1 p-0.5 rounded-lg bg-slate-950 border border-slate-800 overflow-x-auto max-w-full">
              {clubFilters.map((club) => (
                <button
                  key={club.id}
                  type="button"
                  onClick={() => setPoolClubFilter(club.id)}
                  className={`px-2 py-1 rounded text-[11px] font-medium whitespace-nowrap transition-colors cursor-pointer ${
                    poolClubFilter === club.id
                      ? 'bg-slate-800 text-cyan-300'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {club.label}
                </button>
              ))}
            </div>

            {/* Pin / Unpin Pool button (TierMaker style) */}
            <button
              type="button"
              onClick={() => setIsPoolPinned(!isPoolPinned)}
              className={`px-2.5 py-1.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
                isPoolPinned
                  ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300'
                  : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
              }`}
              title={isPoolPinned ? 'Unpin player pool' : 'Pin player pool to bottom while scrolling'}
            >
              {isPoolPinned ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
              {isPoolPinned ? 'Unpin Pool' : 'Pin Pool'}
            </button>
          </div>
        </div>

        {/* Unranked Portrait Tiles Grid */}
        <div
          className={`p-3 sm:p-4 ${isPoolPinned ? 'overflow-y-auto' : ''}`}
          onClick={() => {
            if (selectedPlayerId && placedPlayerIds.has(selectedPlayerId)) {
              unrankPlayer(selectedPlayerId);
            }
          }}
        >
          {unrankedPlayers.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {unrankedPlayers.map((player) => {
                const isSelected = selectedPlayerId === player.id;
                return (
                  <div
                    key={player.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, player.id, 'pool')}
                    onDragEnd={handleDragEnd}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedPlayerId(isSelected ? null : player.id);
                    }}
                    title={`${player.name} · ${player.team} · ${player.overall_rating} OVR`}
                    className={`relative group w-[72px] h-[72px] sm:w-[78px] sm:h-[78px] overflow-hidden bg-slate-950 cursor-grab active:cursor-grabbing select-none transition-transform duration-150 ${
                      isSelected
                        ? 'ring-2 ring-cyan-400 scale-105 z-10'
                        : 'border border-slate-700/80 hover:border-cyan-400/70 hover:scale-[1.03]'
                    }`}
                  >
                    <CharacterPanel player={player} size="sm" showBadge={false} />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/45 to-transparent px-1 py-0.5 pointer-events-none">
                      <span className="text-[10px] font-semibold text-white block truncate text-center leading-tight">
                        {player.name.split(' ')[0]}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-6 text-center text-xs font-mono text-slate-500">
              {totalUnrankedCount === 0
                ? `All ${players.length} Blue Lock characters are ranked on the board. Drag any portrait here or click × on a tile to unrank.`
                : 'No unranked players match your current filter.'}
            </div>
          )}
        </div>
      </div>

      {/* ROW SETTINGS MODAL (TierMaker Gear Modal) */}
      {activeSettingsRow && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setSettingsRowId(null)}
        >
          <div
            className="w-full max-w-md rounded-xl bg-slate-900 border border-slate-700 shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between">
              <h4 className="text-sm font-heading font-bold text-slate-100">
                Row Settings — {activeSettingsRow.label}
              </h4>
              <button
                type="button"
                onClick={() => setSettingsRowId(null)}
                className="p-1 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-5">
              {/* Swatch Picker */}
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-2">
                  Label Background Color
                </label>
                <div className="flex flex-wrap gap-2">
                  {TIERMAKER_SWATCHES.map((swatch) => {
                    const isSelected = activeSettingsRow.color.toLowerCase() === swatch.toLowerCase();
                    return (
                      <button
                        key={swatch}
                        type="button"
                        onClick={() => updateRowMeta(activeSettingsRow.id, { color: swatch })}
                        style={{ backgroundColor: swatch }}
                        className={`w-8 h-8 rounded-full flex items-center justify-center transition-transform cursor-pointer ${
                          isSelected ? 'ring-2 ring-white scale-110' : 'hover:scale-105 opacity-90 hover:opacity-100'
                        }`}
                        title={swatch}
                      >
                        {isSelected && (
                          <Check
                            className="w-4 h-4"
                            style={{ color: getContrastTextColor(swatch) }}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Edit Label Text */}
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1.5">
                  Tier Label Text
                </label>
                <input
                  type="text"
                  value={activeSettingsRow.label}
                  onChange={(e) => updateRowMeta(activeSettingsRow.id, { label: e.target.value })}
                  maxLength={24}
                  className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-400 rounded-lg px-3 py-2 text-sm font-heading font-bold text-slate-100 focus:outline-none"
                />
              </div>

              {/* Row Actions 2x2 Grid */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => insertRowRelative(activeSettingsRow.id, 'above')}
                  className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 cursor-pointer"
                >
                  Add Row Above
                </button>
                <button
                  type="button"
                  onClick={() => insertRowRelative(activeSettingsRow.id, 'below')}
                  className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 cursor-pointer"
                >
                  Add Row Below
                </button>
                <button
                  type="button"
                  onClick={() => clearRowImages(activeSettingsRow.id)}
                  className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-amber-300 cursor-pointer"
                >
                  Clear Row Images
                </button>
                <button
                  type="button"
                  disabled={rows.length <= 1}
                  onClick={() => deleteRow(activeSettingsRow.id)}
                  className="px-3 py-2 rounded-lg bg-rose-950/70 hover:bg-rose-900 border border-rose-500/30 text-xs font-medium text-rose-200 disabled:opacity-40 cursor-pointer flex items-center justify-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete Row
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
