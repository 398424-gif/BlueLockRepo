import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { PLAYERS_SEED, INITIAL_SITE_CONFIG, INITIAL_PUBLIC_TIER_LISTS, INITIAL_USER_LINEUPS } from './src/data/seedData.ts';
import { Player, UserNote, UserLineup, UserTierList, SiteConfig, User, UserLike } from './src/types.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = parseInt(process.env.PORT || '3000', 10);
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

app.use(express.json());

// In-Memory Database State
interface DBState {
  players: Player[];
  notes: UserNote[];
  lineups: UserLineup[];
  tierLists: UserTierList[];
  config: SiteConfig;
  users: User[];
  likes: UserLike[];
}

function initDB(): DBState {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (fs.existsSync(DB_FILE)) {
    try {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(content) as Partial<DBState>;
      return {
        players: parsed.players?.length ? parsed.players : PLAYERS_SEED,
        notes: parsed.notes || [],
        lineups: parsed.lineups || INITIAL_USER_LINEUPS,
        tierLists: parsed.tierLists || INITIAL_PUBLIC_TIER_LISTS,
        config: parsed.config || INITIAL_SITE_CONFIG,
        users: parsed.users?.length
          ? parsed.users
          : [
              {
                id: 'user-demo-egoist',
                username: 'Isagi_Egoist',
                email: 'egoist@bluelock.jp',
                avatar: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=100&auto=format&fit=crop&q=80',
                role: 'egoist',
                created_at: new Date().toISOString(),
              },
            ],
        likes: parsed.likes || [],
      };
    } catch (e) {
      console.error('Error loading db.json, falling back to seed data:', e);
    }
  }

  const initial: DBState = {
    players: PLAYERS_SEED,
    notes: [
      {
        id: 'note-sample-1',
        user_id: 'user-demo-egoist',
        username: 'Isagi_Egoist',
        player_id: 'michael-kaiser',
        note: 'Watch Kaiser’s off-ball positioning. When he tilts his hip, the Kaiser Impact fires in under 0.4s. Do not contest directly; cut off Ness’s passing lane first.',
        created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
        updated_at: new Date(Date.now() - 86400000 * 2).toISOString(),
      },
      {
        id: 'note-sample-2',
        user_id: 'user-demo-egoist',
        username: 'Isagi_Egoist',
        player_id: 'shoei-barou',
        note: 'Barou will always fake the chop dribble twice before cutting. Give him 1 meter of space to tempt the shot, then let the center-back slide in from the blind spot.',
        created_at: new Date(Date.now() - 86400000).toISOString(),
        updated_at: new Date(Date.now() - 86400000).toISOString(),
      },
    ],
    lineups: INITIAL_USER_LINEUPS,
    tierLists: INITIAL_PUBLIC_TIER_LISTS,
    config: INITIAL_SITE_CONFIG,
    users: [
      {
        id: 'user-demo-egoist',
        username: 'Isagi_Egoist',
        email: 'egoist@bluelock.jp',
        avatar: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=100&auto=format&fit=crop&q=80',
        role: 'egoist',
        created_at: new Date().toISOString(),
      },
    ],
    likes: [
      { user_id: 'user-demo-egoist', target_id: 'isagi-yoichi', target_type: 'player' },
    ],
  };

  saveDB(initial);
  return initial;
}

let db = initDB();

function saveDB(state: DBState = db) {
  try {
    const tempPath = `${DB_FILE}.tmp`;
    fs.writeFileSync(tempPath, JSON.stringify(state, null, 2), 'utf-8');
    fs.renameSync(tempPath, DB_FILE);
  } catch (err) {
    console.error('Failed to save db.json:', err);
  }
}

// REST API ROUTES

// 1. Players
app.get('/api/players', (_req, res) => {
  res.json({ success: true, data: db.players });
});

app.get('/api/players/:id', (req, res) => {
  const player = db.players.find((p) => p.id === req.params.id);
  if (!player) {
    return res.status(404).json({ success: false, message: 'Player not found' });
  }
  res.json({ success: true, data: player });
});

// Like player
app.post('/api/players/:id/like', (req, res) => {
  const { id } = req.params;
  const { userId } = req.body;
  const uid = userId || 'anonymous';

  const player = db.players.find((p) => p.id === id);
  if (!player) {
    return res.status(404).json({ success: false, message: 'Player not found' });
  }

  const existingIndex = db.likes.findIndex(
    (l) => l.target_id === id && l.target_type === 'player' && l.user_id === uid
  );

  let liked = false;
  if (existingIndex >= 0) {
    // unlike
    db.likes.splice(existingIndex, 1);
    player.like_count = Math.max(0, (player.like_count || 1) - 1);
    liked = false;
  } else {
    // like
    db.likes.push({ user_id: uid, target_id: id, target_type: 'player' });
    player.like_count = (player.like_count || 0) + 1;
    liked = true;
  }

  saveDB();
  res.json({ success: true, liked, like_count: player.like_count });
});

// 2. User Notes (Full CRUD)
app.get('/api/notes', (req, res) => {
  const { player_id, user_id } = req.query;
  let filtered = db.notes;
  if (player_id) {
    filtered = filtered.filter((n) => n.player_id === player_id);
  }
  if (user_id) {
    filtered = filtered.filter((n) => n.user_id === user_id);
  }
  res.json({ success: true, data: filtered });
});

app.post('/api/notes', (req, res) => {
  const { player_id, note, user_id, username } = req.body;
  if (!player_id || !note?.trim()) {
    return res.status(400).json({ success: false, message: 'Player ID and note text are required' });
  }

  const newNote: UserNote = {
    id: `note-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    player_id,
    user_id: user_id || 'user-demo-egoist',
    username: username || 'Egoist',
    note: note.trim(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  db.notes.unshift(newNote);
  saveDB();
  res.status(201).json({ success: true, data: newNote });
});

app.put('/api/notes/:id', (req, res) => {
  const { id } = req.params;
  const { note } = req.body;

  const targetNote = db.notes.find((n) => n.id === id);
  if (!targetNote) {
    return res.status(404).json({ success: false, message: 'Note not found' });
  }

  if (!note?.trim()) {
    return res.status(400).json({ success: false, message: 'Note text cannot be empty' });
  }

  targetNote.note = note.trim();
  targetNote.updated_at = new Date().toISOString();
  saveDB();

  res.json({ success: true, data: targetNote });
});

app.delete('/api/notes/:id', (req, res) => {
  const { id } = req.params;
  const index = db.notes.findIndex((n) => n.id === id);
  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Note not found' });
  }

  db.notes.splice(index, 1);
  saveDB();
  res.json({ success: true, message: 'Note deleted successfully' });
});

// 3. User Lineups (CRUD)
app.get('/api/lineups', (req, res) => {
  const { user_id } = req.query;
  let result = db.lineups;
  if (user_id) {
    result = result.filter((l) => l.user_id === user_id);
  }
  res.json({ success: true, data: result });
});

app.post('/api/lineups', (req, res) => {
  const { title, formation, player_ids, user_id, username, total_overall, chemistry_score } = req.body;
  if (!title || !formation || !Array.isArray(player_ids) || player_ids.length !== 11) {
    return res.status(400).json({
      success: false,
      message: 'Lineup must contain a title, formation, and exactly 11 unique players.',
    });
  }

  // Check unique players
  const uniqueCount = new Set(player_ids).size;
  if (uniqueCount !== 11) {
    return res.status(400).json({
      success: false,
      message: 'All 11 positions must be filled by unique players (no duplicates allowed).',
    });
  }

  const newLineup: UserLineup = {
    id: `lineup-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    user_id: user_id || 'user-demo-egoist',
    username: username || 'Egoist',
    title: title.trim(),
    formation,
    player_ids,
    total_overall: Number(total_overall) || 90,
    chemistry_score: Number(chemistry_score) || 80,
    created_at: new Date().toISOString(),
  };

  db.lineups.unshift(newLineup);
  saveDB();
  res.status(201).json({ success: true, data: newLineup });
});

app.delete('/api/lineups/:id', (req, res) => {
  const { id } = req.params;
  const index = db.lineups.findIndex((l) => l.id === id);
  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Lineup not found' });
  }
  db.lineups.splice(index, 1);
  saveDB();
  res.json({ success: true, message: 'Lineup deleted' });
});

// 4. Tier Lists (CRUD & Public views)
app.get('/api/tier-lists', (_req, res) => {
  res.json({ success: true, data: db.tierLists });
});

app.get('/api/tier-lists/:id', (req, res) => {
  const item = db.tierLists.find((t) => t.id === req.params.id);
  if (!item) {
    return res.status(404).json({ success: false, message: 'Tier list not found' });
  }
  res.json({ success: true, data: item });
});

app.post('/api/tier-lists', (req, res) => {
  const { title, tiers, user_id, username, is_public } = req.body;
  if (!title || !tiers) {
    return res.status(400).json({ success: false, message: 'Title and tiers mapping required' });
  }

  const newTierList: UserTierList = {
    id: `tierlist-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    user_id: user_id || 'user-demo-egoist',
    username: username || 'Anonymous Egoist',
    title: title.trim(),
    tiers,
    is_public: is_public !== false,
    view_count: 1,
    like_count: 0,
    created_at: new Date().toISOString(),
  };

  db.tierLists.unshift(newTierList);
  saveDB();
  res.status(201).json({ success: true, data: newTierList });
});

app.post('/api/tier-lists/:id/view', (req, res) => {
  const item = db.tierLists.find((t) => t.id === req.params.id);
  if (!item) {
    return res.status(404).json({ success: false, message: 'Tier list not found' });
  }
  item.view_count = (item.view_count || 0) + 1;
  saveDB();
  res.json({ success: true, view_count: item.view_count });
});

app.post('/api/tier-lists/:id/like', (req, res) => {
  const { id } = req.params;
  const { userId } = req.body;
  const uid = userId || 'anonymous';

  const item = db.tierLists.find((t) => t.id === id);
  if (!item) {
    return res.status(404).json({ success: false, message: 'Tier list not found' });
  }

  const existingIndex = db.likes.findIndex(
    (l) => l.target_id === id && l.target_type === 'tier_list' && l.user_id === uid
  );

  let liked = false;
  if (existingIndex >= 0) {
    db.likes.splice(existingIndex, 1);
    item.like_count = Math.max(0, (item.like_count || 1) - 1);
    liked = false;
  } else {
    db.likes.push({ user_id: uid, target_id: id, target_type: 'tier_list' });
    item.like_count = (item.like_count || 0) + 1;
    liked = true;
  }

  saveDB();
  res.json({ success: true, liked, like_count: item.like_count });
});

app.delete('/api/tier-lists/:id', (req, res) => {
  const index = db.tierLists.findIndex((t) => t.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Tier list not found' });
  }
  db.tierLists.splice(index, 1);
  saveDB();
  res.json({ success: true, message: 'Tier list deleted' });
});

// 5. Site Config
app.get('/api/config', (_req, res) => {
  res.json({ success: true, data: db.config });
});

app.put('/api/config', (req, res) => {
  const { next_chapter_release, chapter_number, arc_name, announcement } = req.body;
  if (next_chapter_release) db.config.next_chapter_release = next_chapter_release;
  if (chapter_number) db.config.chapter_number = Number(chapter_number);
  if (arc_name) db.config.arc_name = arc_name;
  if (announcement !== undefined) db.config.announcement = announcement;

  saveDB();
  res.json({ success: true, data: db.config });
});

// 6. User Auth & Session
app.get('/api/auth/me', (req, res) => {
  const userId = req.headers['x-user-id'] as string;
  if (!userId) {
    return res.json({ success: true, user: null });
  }
  const user = db.users.find((u) => u.id === userId);
  res.json({ success: true, user: user || null });
});

app.post('/api/auth/register', (req, res) => {
  const { username, email } = req.body;
  if (!username?.trim() || !email?.trim()) {
    return res.status(400).json({ success: false, message: 'Username and email are required' });
  }

  const existing = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    return res.status(409).json({ success: false, message: 'An account with this email already exists' });
  }

  const newUser: User = {
    id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    username: username.trim(),
    email: email.trim().toLowerCase(),
    avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(username)}`,
    role: 'egoist',
    created_at: new Date().toISOString(),
  };

  db.users.push(newUser);
  saveDB();
  res.status(201).json({ success: true, user: newUser });
});

app.post('/api/auth/login', (req, res) => {
  const { email, username } = req.body;
  let user: User | undefined;
  if (email) {
    user = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  } else if (username) {
    user = db.users.find((u) => u.username.toLowerCase() === username.toLowerCase());
  }

  if (!user) {
    // Convenience auto-provision for test accounts or demo
    if (email && email.includes('@')) {
      const newUser: User = {
        id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        username: (username || email.split('@')[0]).trim(),
        email: email.trim().toLowerCase(),
        avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(email)}`,
        role: 'egoist',
        created_at: new Date().toISOString(),
      };
      db.users.push(newUser);
      saveDB();
      return res.json({ success: true, user: newUser });
    }
    return res.status(401).json({ success: false, message: 'Invalid credentials or user not found' });
  }

  res.json({ success: true, user });
});

// User likes status
app.get('/api/likes', (req, res) => {
  const userId = (req.query.user_id as string) || (req.headers['x-user-id'] as string) || 'anonymous';
  const userLikes = db.likes.filter((l) => l.user_id === userId);
  res.json({ success: true, data: userLikes });
});

// Start dev or production server
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`🚀 Blue Lock Egoist Server running on port ${port}`);
  });
}

startServer();
