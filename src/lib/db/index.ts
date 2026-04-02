import Database from "better-sqlite3";
import { drizzle, BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";
import path from "path";

const DB_PATH = process.env.DATABASE_PATH || "./pulse.db";

let _db: BetterSQLite3Database<typeof schema> | null = null;
let _initialized = false;

function getDb(): BetterSQLite3Database<typeof schema> {
  if (_db) return _db;

  const sqlite = new Database(path.resolve(DB_PATH));
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");
  sqlite.pragma("busy_timeout = 10000");

  _db = drizzle(sqlite, { schema });

  if (!_initialized) {
    _initialized = true;
    try {
      sqlite.exec(`
        CREATE TABLE IF NOT EXISTS sources (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          type TEXT NOT NULL,
          category TEXT NOT NULL DEFAULT 'ai',
          url TEXT NOT NULL,
          enabled INTEGER NOT NULL DEFAULT 1,
          fetch_interval_minutes INTEGER NOT NULL DEFAULT 60,
          last_fetched_at TEXT,
          created_at TEXT NOT NULL
        );




        CREATE TABLE IF NOT EXISTS articles (
          id TEXT PRIMARY KEY,
          source_id TEXT NOT NULL REFERENCES sources(id),
          external_url TEXT NOT NULL UNIQUE,
          title TEXT NOT NULL,
          author TEXT,
          raw_content TEXT,
          published_at TEXT NOT NULL,
          fetched_at TEXT NOT NULL,
          relevance_score INTEGER,
          is_enriched INTEGER NOT NULL DEFAULT 0,
          ai_summary TEXT,
          importance_rating INTEGER,
          why_it_matters TEXT,
          tags TEXT,
          enriched_at TEXT
        );

        CREATE TABLE IF NOT EXISTS user_ratings (
          id TEXT PRIMARY KEY,
          article_id TEXT NOT NULL REFERENCES articles(id),
          rating INTEGER NOT NULL,
          created_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS settings (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS trend_reports (
          id TEXT PRIMARY KEY,
          week_start TEXT NOT NULL,
          week_end TEXT NOT NULL,
          summary TEXT NOT NULL,
          top_themes TEXT NOT NULL,
          created_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS ingestion_runs (
          id TEXT PRIMARY KEY,
          started_at TEXT NOT NULL,
          completed_at TEXT,
          articles_fetched INTEGER NOT NULL DEFAULT 0,
          articles_scored INTEGER NOT NULL DEFAULT 0,
          articles_enriched INTEGER NOT NULL DEFAULT 0,
          status TEXT NOT NULL DEFAULT 'running',
          error TEXT
        );

        CREATE INDEX IF NOT EXISTS idx_articles_score ON articles(relevance_score);
        CREATE INDEX IF NOT EXISTS idx_articles_published ON articles(published_at);
        CREATE INDEX IF NOT EXISTS idx_articles_source ON articles(source_id);
        CREATE INDEX IF NOT EXISTS idx_ratings_article ON user_ratings(article_id);
        CREATE INDEX IF NOT EXISTS idx_trends_week ON trend_reports(week_start);
      `);

      // Migrations: add columns to existing tables
      try {
        sqlite.exec(`ALTER TABLE sources ADD COLUMN category TEXT NOT NULL DEFAULT 'ai'`);
      } catch { /* already exists */ }
      try {
        sqlite.exec(`ALTER TABLE articles ADD COLUMN bookmarked INTEGER NOT NULL DEFAULT 0`);
      } catch { /* already exists */ }
    } catch (err) {
      // Ignore if tables already exist or DB is busy during build
      console.warn("DB init warning:", err);
    }
  }

  return _db;
}

// Use a Proxy so `db` can be used like a normal object but lazily initializes
export const db: BetterSQLite3Database<typeof schema> = new Proxy(
  {} as BetterSQLite3Database<typeof schema>,
  {
    get(_target, prop) {
      const realDb = getDb();
      const value = (realDb as unknown as Record<string | symbol, unknown>)[prop];
      if (typeof value === "function") {
        return value.bind(realDb);
      }
      return value;
    },
  }
);
