import { createClient } from '@libsql/client';

const url = process.env.TURSO_DATABASE_URL || 'file:local.db';
const authToken = process.env.TURSO_AUTH_TOKEN;

export const db = createClient({
  url,
  authToken,
});

let dbInitialized = false;

export async function initializeDatabase() {
  if (dbInitialized) return;
  
  try {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
        last_login INTEGER
      );

      CREATE TABLE IF NOT EXISTS verse_progress (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        book TEXT NOT NULL,
        chapter INTEGER NOT NULL,
        verse INTEGER NOT NULL,
        attempts INTEGER NOT NULL DEFAULT 0,
        correct_guesses INTEGER NOT NULL DEFAULT 0,
        last_practiced INTEGER NOT NULL,
        completed INTEGER NOT NULL DEFAULT 0,
        started INTEGER NOT NULL DEFAULT 0,
        mastery_level INTEGER NOT NULL DEFAULT 0,
        memorized INTEGER NOT NULL DEFAULT 0,
        created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
        updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE(user_id, book, chapter, verse)
      );

      CREATE TABLE IF NOT EXISTS friendships (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        friend_id INTEGER NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (friend_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE(user_id, friend_id),
        CHECK(user_id != friend_id)
      );

      CREATE TABLE IF NOT EXISTS daily_reviews (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        date TEXT NOT NULL,
        verses_reviewed INTEGER NOT NULL DEFAULT 0,
        streak INTEGER NOT NULL DEFAULT 0,
        created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE(user_id, date)
      );

      CREATE INDEX IF NOT EXISTS idx_verse_progress_user ON verse_progress(user_id);
      CREATE INDEX IF NOT EXISTS idx_friendships_user ON friendships(user_id);
      CREATE INDEX IF NOT EXISTS idx_friendships_friend ON friendships(friend_id);
      CREATE INDEX IF NOT EXISTS idx_daily_reviews_user ON daily_reviews(user_id);
      CREATE INDEX IF NOT EXISTS idx_daily_reviews_date ON daily_reviews(user_id, date);
    `);
    
    dbInitialized = true;
    console.log('Database initialized with Turso');
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
}

export interface User {
  id: number;
  email: string;
  username: string;
  password_hash: string;
  created_at: number;
  last_login?: number;
}

export interface VerseProgressDB {
  id: number;
  user_id: number;
  book: string;
  chapter: number;
  verse: number;
  attempts: number;
  correct_guesses: number;
  last_practiced: number;
  completed: number;
  started: number;
  mastery_level: number;
  memorized: number;
  created_at: number;
  updated_at: number;
}

export interface Friendship {
  id: number;
  user_id: number;
  friend_id: number;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: number;
}

export interface DailyReview {
  id: number;
  user_id: number;
  date: string;
  verses_reviewed: number;
  streak: number;
  created_at: number;
}
