import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const sources = sqliteTable("sources", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(), // 'rss' | 'reddit' | 'github' | 'twitter'
  category: text("category").notNull().default("ai"), // 'ai' | 'politics' | 'tech' | etc.
  url: text("url").notNull(),
  enabled: integer("enabled").notNull().default(1),
  fetchIntervalMinutes: integer("fetch_interval_minutes").notNull().default(60),
  lastFetchedAt: text("last_fetched_at"),
  createdAt: text("created_at").notNull(),
});

export const articles = sqliteTable("articles", {
  id: text("id").primaryKey(),
  sourceId: text("source_id").notNull().references(() => sources.id),
  externalUrl: text("external_url").notNull().unique(),
  title: text("title").notNull(),
  author: text("author"),
  rawContent: text("raw_content"),
  publishedAt: text("published_at").notNull(),
  fetchedAt: text("fetched_at").notNull(),
  relevanceScore: integer("relevance_score"),
  isEnriched: integer("is_enriched").notNull().default(0),
  aiSummary: text("ai_summary"),
  importanceRating: integer("importance_rating"),
  whyItMatters: text("why_it_matters"),
  tags: text("tags"), // JSON array string
  enrichedAt: text("enriched_at"),
  bookmarked: integer("bookmarked").notNull().default(0),
});

export const userRatings = sqliteTable("user_ratings", {
  id: text("id").primaryKey(),
  articleId: text("article_id").notNull().references(() => articles.id),
  rating: integer("rating").notNull(), // 1 = thumbs up, -1 = thumbs down
  createdAt: text("created_at").notNull(),
});

export const settings = sqliteTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const trendReports = sqliteTable("trend_reports", {
  id: text("id").primaryKey(),
  weekStart: text("week_start").notNull(),
  weekEnd: text("week_end").notNull(),
  summary: text("summary").notNull(),
  topThemes: text("top_themes").notNull(), // JSON array
  createdAt: text("created_at").notNull(),
});

export const ingestionRuns = sqliteTable("ingestion_runs", {
  id: text("id").primaryKey(),
  startedAt: text("started_at").notNull(),
  completedAt: text("completed_at"),
  articlesFetched: integer("articles_fetched").notNull().default(0),
  articlesScored: integer("articles_scored").notNull().default(0),
  articlesEnriched: integer("articles_enriched").notNull().default(0),
  status: text("status").notNull().default("running"), // 'running' | 'completed' | 'failed'
  error: text("error"),
});
