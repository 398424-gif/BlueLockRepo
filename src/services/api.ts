import { Player, UserNote, UserLineup, UserTierList, SiteConfig, UserLike } from '../types.ts';
import { PLAYERS_SEED, INITIAL_SITE_CONFIG, INITIAL_PUBLIC_TIER_LISTS, INITIAL_USER_LINEUPS } from '../data/seedData.ts';

const API_BASE = '/api';

export const api = {
  // Players
  async getPlayers(): Promise<Player[]> {
    try {
      const res = await fetch(`${API_BASE}/players`);
      if (!res.ok) throw new Error('Failed to fetch players');
      const data = await res.json();
      return data.data;
    } catch (e) {
      console.warn('API error fetching players, using seed fallback:', e);
      return PLAYERS_SEED;
    }
  },

  async getPlayerById(id: string): Promise<Player | null> {
    try {
      const res = await fetch(`${API_BASE}/players/${id}`);
      if (!res.ok) throw new Error('Player not found');
      const data = await res.json();
      return data.data;
    } catch {
      return PLAYERS_SEED.find((p) => p.id === id) || null;
    }
  },

  async togglePlayerLike(id: string, userId?: string): Promise<{ liked: boolean; like_count: number }> {
    try {
      const res = await fetch(`${API_BASE}/players/${id}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      return { liked: data.liked, like_count: data.like_count };
    } catch {
      return { liked: true, like_count: 999 };
    }
  },

  // Notes
  async getNotes(playerId?: string, userId?: string): Promise<UserNote[]> {
    try {
      const params = new URLSearchParams();
      if (playerId) params.append('player_id', playerId);
      if (userId) params.append('user_id', userId);
      const res = await fetch(`${API_BASE}/notes?${params.toString()}`);
      const data = await res.json();
      return data.data || [];
    } catch {
      return [];
    }
  },

  async createNote(data: { player_id: string; note: string; user_id: string; username: string }): Promise<UserNote> {
    const res = await fetch(`${API_BASE}/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!result.success) throw new Error(result.message || 'Failed to create note');
    return result.data;
  },

  async updateNote(id: string, noteText: string): Promise<UserNote> {
    const res = await fetch(`${API_BASE}/notes/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ note: noteText }),
    });
    const result = await res.json();
    if (!result.success) throw new Error(result.message || 'Failed to update note');
    return result.data;
  },

  async deleteNote(id: string): Promise<boolean> {
    const res = await fetch(`${API_BASE}/notes/${id}`, {
      method: 'DELETE',
    });
    const result = await res.json();
    return result.success;
  },

  // Lineups
  async getLineups(userId?: string): Promise<UserLineup[]> {
    try {
      const params = new URLSearchParams();
      if (userId) params.append('user_id', userId);
      const res = await fetch(`${API_BASE}/lineups?${params.toString()}`);
      const data = await res.json();
      return data.data || [];
    } catch {
      return INITIAL_USER_LINEUPS;
    }
  },

  async saveLineup(lineupData: {
    title: string;
    formation: string;
    player_ids: string[];
    user_id: string;
    username: string;
    total_overall: number;
    chemistry_score: number;
  }): Promise<UserLineup> {
    const res = await fetch(`${API_BASE}/lineups`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(lineupData),
    });
    const result = await res.json();
    if (!result.success) throw new Error(result.message || 'Failed to save lineup');
    return result.data;
  },

  async deleteLineup(id: string): Promise<boolean> {
    const res = await fetch(`${API_BASE}/lineups/${id}`, { method: 'DELETE' });
    const result = await res.json();
    return result.success;
  },

  // Tier Lists
  async getTierLists(): Promise<UserTierList[]> {
    try {
      const res = await fetch(`${API_BASE}/tier-lists`);
      const data = await res.json();
      return data.data || [];
    } catch {
      return INITIAL_PUBLIC_TIER_LISTS;
    }
  },

  async getTierListById(id: string): Promise<UserTierList | null> {
    try {
      const res = await fetch(`${API_BASE}/tier-lists/${id}`);
      const data = await res.json();
      return data.data || null;
    } catch {
      return INITIAL_PUBLIC_TIER_LISTS.find((t) => t.id === id) || null;
    }
  },

  async saveTierList(tierListData: {
    title: string;
    tiers: Record<string, string[]>;
    user_id: string;
    username: string;
    is_public: boolean;
  }): Promise<UserTierList> {
    const res = await fetch(`${API_BASE}/tier-lists`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tierListData),
    });
    const result = await res.json();
    if (!result.success) throw new Error(result.message || 'Failed to save tier list');
    return result.data;
  },

  async incrementTierListView(id: string): Promise<number> {
    try {
      const res = await fetch(`${API_BASE}/tier-lists/${id}/view`, { method: 'POST' });
      const data = await res.json();
      return data.view_count;
    } catch {
      return 0;
    }
  },

  async toggleTierListLike(id: string, userId?: string): Promise<{ liked: boolean; like_count: number }> {
    try {
      const res = await fetch(`${API_BASE}/tier-lists/${id}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      return { liked: data.liked, like_count: data.like_count };
    } catch {
      return { liked: true, like_count: 1 };
    }
  },

  async deleteTierList(id: string): Promise<boolean> {
    const res = await fetch(`${API_BASE}/tier-lists/${id}`, { method: 'DELETE' });
    const result = await res.json();
    return result.success;
  },

  // Site Config
  async getSiteConfig(): Promise<SiteConfig> {
    try {
      const res = await fetch(`${API_BASE}/config`);
      const data = await res.json();
      return data.data || INITIAL_SITE_CONFIG;
    } catch {
      return INITIAL_SITE_CONFIG;
    }
  },

  async updateSiteConfig(data: Partial<SiteConfig>): Promise<SiteConfig> {
    const res = await fetch(`${API_BASE}/config`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    return result.data;
  },

  // Likes
  async getUserLikes(userId?: string): Promise<UserLike[]> {
    try {
      const params = userId ? `?user_id=${userId}` : '';
      const res = await fetch(`${API_BASE}/likes${params}`);
      const data = await res.json();
      return data.data || [];
    } catch {
      return [];
    }
  },
};
