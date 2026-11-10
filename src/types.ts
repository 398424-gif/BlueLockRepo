export type EyeType = 'Metavision' | 'Predator Eye' | 'Destroyer Eye' | 'None';
export type RankTier = 'S+' | 'S' | 'A' | 'B' | 'C';
export type PlayerPosition = 'ST' | 'RW' | 'LW' | 'CAM' | 'CM' | 'CDM' | 'CB' | 'RB' | 'LB' | 'GK';

export interface PlayerStats {
  offense: number;
  shoot: number;
  dribble: number;
  pass: number;
  defense: number;
  speed: number;
  adaptability: number;
}

export interface PlayerPsychology {
  ego_type: string;
  flow_trigger: string;
  core_philosophy: string;
  analysis: string;
}

export interface Player {
  id: string;
  name: string;
  japanese_name: string;
  team: string;
  position: PlayerPosition;
  rank_tier: RankTier;
  overall_rating: number;
  primary_eye_type: EyeType;
  primary_weapon: string;
  weapon_description: string;
  stats: PlayerStats;
  stats_awakened: PlayerStats | null;
  zero_state_description: string;
  portrait: string;
  portrait_color: string;
  quote: string;
  psychology_profile: PlayerPsychology;
  is_spoiler: boolean;
  like_count: number;
  jersey_number?: number;
  height_cm?: number;
  age?: number;
}

export interface User {
  id: string;
  username: string;
  email: string;
  phone?: string;
  password?: string;
  avatar: string;
  role: 'egoist' | 'coach' | 'scout';
  created_at: string;
}

export interface UserNote {
  id: string;
  user_id: string;
  username: string;
  player_id: string;
  note: string;
  created_at: string;
  updated_at: string;
}

export interface UserLineup {
  id: string;
  user_id: string;
  username: string;
  title: string;
  formation: '4-3-3' | '4-4-2' | '3-5-2' | '4-2-3-1';
  player_ids: string[];
  total_overall: number;
  chemistry_score: number;
  created_at: string;
}

export interface UserTierList {
  id: string;
  user_id: string;
  username: string;
  title: string;
  tiers: {
    'S+': string[];
    'S': string[];
    'A': string[];
    'B': string[];
    'C': string[];
  };
  is_public: boolean;
  view_count: number;
  like_count: number;
  created_at: string;
}

export interface SiteConfig {
  next_chapter_release: string;
  chapter_number: number;
  arc_name: string;
  announcement?: string;
}

export interface UserLike {
  user_id: string;
  target_id: string;
  target_type: 'player' | 'tier_list';
}
