const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'quietbreak.db'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ---------- 1. users ----------
db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  points INTEGER NOT NULL DEFAULT 0,
  current_streak INTEGER NOT NULL DEFAULT 0,
  best_streak INTEGER NOT NULL DEFAULT 0,
  last_completed_day TEXT,
  daily_goal INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
`);

// ---------- 2. sessions ----------
db.exec(`
CREATE TABLE IF NOT EXISTS sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  duration_min INTEGER NOT NULL,
  intention TEXT,
  status TEXT NOT NULL DEFAULT 'active', -- active | completed | abandoned
  started_at TEXT NOT NULL DEFAULT (datetime('now')),
  completed_at TEXT,
  points_earned INTEGER NOT NULL DEFAULT 0
);
`);

// ---------- 3. collectibles (seed/catalog data) ----------
db.exec(`
CREATE TABLE IF NOT EXISTS collectibles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  emoji TEXT NOT NULL,
  tier TEXT NOT NULL, -- common | rare | legendary
  unlock_after INTEGER NOT NULL
);
`);

// ---------- 4. user_collectibles (many-to-many) ----------
db.exec(`
CREATE TABLE IF NOT EXISTS user_collectibles (
  user_id INTEGER NOT NULL REFERENCES users(id),
  collectible_id INTEGER NOT NULL REFERENCES collectibles(id),
  unlocked_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, collectible_id)
);
`);

// ---------- 5. points_history ----------
db.exec(`
CREATE TABLE IF NOT EXISTS points_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  session_id INTEGER NOT NULL REFERENCES sessions(id),
  points INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
`);

// ---------- Seed collectibles (only if table empty) ----------
const count = db.prepare('SELECT COUNT(*) AS c FROM collectibles').get().c;
if (count === 0) {
    const seed = db.prepare(
        'INSERT INTO collectibles (name, emoji, tier, unlock_after) VALUES (?, ?, ?, ?)'
    );
    const insertMany = db.transaction((rows) => {
        for (const r of rows) seed.run(r.name, r.emoji, r.tier, r.unlockAfter);
    });

    insertMany([
        // common: 1-5 sessions
        { name: 'Calm Cloud', emoji: '☁️', tier: 'common', unlockAfter: 1 },
        { name: 'Quiet Leaf', emoji: '🍃', tier: 'common', unlockAfter: 2 },
        { name: 'Soft Candle', emoji: '🕯️', tier: 'common', unlockAfter: 3 },
        { name: 'Still Water', emoji: '💧', tier: 'common', unlockAfter: 5 },
        // rare: 10-30 sessions
        { name: 'Moonlit Owl', emoji: '🦉', tier: 'rare', unlockAfter: 10 },
        { name: 'Golden Hourglass', emoji: '⏳', tier: 'rare', unlockAfter: 20 },
        { name: 'Zen Garden', emoji: '🪴', tier: 'rare', unlockAfter: 30 },
        // legendary: 50+
        { name: 'Phoenix of Focus', emoji: '🔥', tier: 'legendary', unlockAfter: 50 },
        { name: 'Crown of Stillness', emoji: '👑', tier: 'legendary', unlockAfter: 100 },
    ]);
    console.log('✅ Collectibles seeded');
}

module.exports = db;