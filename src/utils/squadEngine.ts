import { Player } from '../types.ts';

export interface ChemistryBreakdown {
  baseScore: number;
  clubPairCount: number;
  clubSynergyPoints: number;
  metavisionCount: number;
  metavisionPoints: number;
  finisherCount: number;
  finisherPoints: number;
  hasDominantClub: boolean;
  dominantClubName: string | null;
  dominantClubPoints: number;
  totalChemistry: number;
  totalOverall: number;
}

export function calculateSquadChemistry(players: (Player | null)[]): ChemistryBreakdown {
  const activePlayers = players.filter((p): p is Player => p !== null);
  const count = activePlayers.length;

  if (count === 0) {
    return {
      baseScore: 50,
      clubPairCount: 0,
      clubSynergyPoints: 0,
      metavisionCount: 0,
      metavisionPoints: 0,
      finisherCount: 0,
      finisherPoints: 0,
      hasDominantClub: false,
      dominantClubName: null,
      dominantClubPoints: 0,
      totalChemistry: 50,
      totalOverall: 0,
    };
  }

  // 1. Total Overall: floor((sum(Overall) / 11) + 0.5)
  const sumOverall = activePlayers.reduce((acc, p) => acc + p.overall_rating, 0);
  const totalOverall = count === 11 ? Math.floor(sumOverall / 11 + 0.5) : Math.round(sumOverall / count);

  // 2. Club Synergy: k * (k - 1) / 2
  const clubCounts: Record<string, number> = {};
  for (const p of activePlayers) {
    if (p.team) {
      clubCounts[p.team] = (clubCounts[p.team] || 0) + 1;
    }
  }

  let clubPairs = 0;
  let dominantClubName: string | null = null;
  let hasDominantClub = false;

  for (const [team, k] of Object.entries(clubCounts)) {
    if (k >= 2) {
      clubPairs += (k * (k - 1)) / 2;
    }
    if (k >= 4) {
      hasDominantClub = true;
      dominantClubName = team;
    }
  }

  // Each pair awards +3 points
  const clubSynergyPoints = Math.min(25, clubPairs * 3);

  // 3. Metavision Bonus: +3 per player with Metavision
  const metavisionCount = activePlayers.filter((p) => p.primary_eye_type === 'Metavision').length;
  const metavisionPoints = Math.min(15, metavisionCount * 3);

  // 4. Finisher Bonus: position IN ('ST','RW','LW') AND rank_tier IN ('S','S+') -> +4 pts each
  const finisherCount = activePlayers.filter(
    (p) => ['ST', 'RW', 'LW'].includes(p.position) && ['S', 'S+'].includes(p.rank_tier)
  ).length;
  const finisherPoints = Math.min(12, finisherCount * 4);

  // 5. Dominant Club Bonus
  const dominantClubPoints = hasDominantClub ? 8 : 0;

  // Base 50 + synergy
  const rawScore = 50 + clubSynergyPoints + metavisionPoints + finisherPoints + dominantClubPoints;
  const totalChemistry = Math.min(100, Math.max(0, rawScore));

  return {
    baseScore: 50,
    clubPairCount: clubPairs,
    clubSynergyPoints,
    metavisionCount,
    metavisionPoints,
    finisherCount,
    finisherPoints,
    hasDominantClub,
    dominantClubName,
    dominantClubPoints,
    totalChemistry,
    totalOverall,
  };
}

export type FormationKey = '4-3-3' | '4-4-2' | '3-5-2' | '4-2-3-1';

export interface FormationSlot {
  index: number;
  label: string;
  defaultRole: string;
  x: number; // percentage from left 0 to 100
  y: number; // percentage from top 0 to 100 (top is opponent goal, bottom is home goal)
}

export const FORMATIONS: Record<FormationKey, { name: string; slots: FormationSlot[] }> = {
  '4-3-3': {
    name: '4-3-3 Attack Aggressive',
    slots: [
      { index: 0, label: 'GK', defaultRole: 'GK', x: 50, y: 88 },
      { index: 1, label: 'LB', defaultRole: 'LB', x: 18, y: 72 },
      { index: 2, label: 'CB-L', defaultRole: 'CB', x: 38, y: 74 },
      { index: 3, label: 'CB-R', defaultRole: 'CB', x: 62, y: 74 },
      { index: 4, label: 'RB', defaultRole: 'RB', x: 82, y: 72 },
      { index: 5, label: 'CDM', defaultRole: 'CDM', x: 50, y: 55 },
      { index: 6, label: 'CM-L', defaultRole: 'CM', x: 30, y: 45 },
      { index: 7, label: 'CM-R', defaultRole: 'CAM', x: 70, y: 45 },
      { index: 8, label: 'LW', defaultRole: 'LW', x: 20, y: 22 },
      { index: 9, label: 'ST', defaultRole: 'ST', x: 50, y: 15 },
      { index: 10, label: 'RW', defaultRole: 'RW', x: 80, y: 22 },
    ],
  },
  '4-4-2': {
    name: '4-4-2 Balanced Direct',
    slots: [
      { index: 0, label: 'GK', defaultRole: 'GK', x: 50, y: 88 },
      { index: 1, label: 'LB', defaultRole: 'LB', x: 18, y: 72 },
      { index: 2, label: 'CB-L', defaultRole: 'CB', x: 38, y: 74 },
      { index: 3, label: 'CB-R', defaultRole: 'CB', x: 62, y: 74 },
      { index: 4, label: 'RB', defaultRole: 'RB', x: 82, y: 72 },
      { index: 5, label: 'LM', defaultRole: 'LW', x: 18, y: 48 },
      { index: 6, label: 'CM-L', defaultRole: 'CM', x: 38, y: 50 },
      { index: 7, label: 'CM-R', defaultRole: 'CM', x: 62, y: 50 },
      { index: 8, label: 'RM', defaultRole: 'RW', x: 82, y: 48 },
      { index: 9, label: 'ST-L', defaultRole: 'ST', x: 36, y: 18 },
      { index: 10, label: 'ST-R', defaultRole: 'ST', x: 64, y: 18 },
    ],
  },
  '3-5-2': {
    name: '3-5-2 Midfield Overload',
    slots: [
      { index: 0, label: 'GK', defaultRole: 'GK', x: 50, y: 88 },
      { index: 1, label: 'CB-L', defaultRole: 'CB', x: 26, y: 74 },
      { index: 2, label: 'CB-C', defaultRole: 'CB', x: 50, y: 76 },
      { index: 3, label: 'CB-R', defaultRole: 'CB', x: 74, y: 74 },
      { index: 4, label: 'LWB', defaultRole: 'LB', x: 14, y: 50 },
      { index: 5, label: 'CDM', defaultRole: 'CDM', x: 50, y: 58 },
      { index: 6, label: 'CAM-L', defaultRole: 'CAM', x: 34, y: 40 },
      { index: 7, label: 'CAM-R', defaultRole: 'CAM', x: 66, y: 40 },
      { index: 8, label: 'RWB', defaultRole: 'RB', x: 86, y: 50 },
      { index: 9, label: 'ST-L', defaultRole: 'ST', x: 38, y: 18 },
      { index: 10, label: 'ST-R', defaultRole: 'ST', x: 62, y: 18 },
    ],
  },
  '4-2-3-1': {
    name: '4-2-3-1 Modern Metavision',
    slots: [
      { index: 0, label: 'GK', defaultRole: 'GK', x: 50, y: 88 },
      { index: 1, label: 'LB', defaultRole: 'LB', x: 18, y: 74 },
      { index: 2, label: 'CB-L', defaultRole: 'CB', x: 38, y: 76 },
      { index: 3, label: 'CB-R', defaultRole: 'CB', x: 62, y: 76 },
      { index: 4, label: 'RB', defaultRole: 'RB', x: 82, y: 74 },
      { index: 5, label: 'CDM-L', defaultRole: 'CDM', x: 38, y: 58 },
      { index: 6, label: 'CDM-R', defaultRole: 'CM', x: 62, y: 58 },
      { index: 7, label: 'LAM', defaultRole: 'LW', x: 22, y: 36 },
      { index: 8, label: 'CAM', defaultRole: 'CAM', x: 50, y: 34 },
      { index: 9, label: 'RAM', defaultRole: 'RW', x: 78, y: 36 },
      { index: 10, label: 'ST', defaultRole: 'ST', x: 50, y: 16 },
    ],
  },
};
