export type SourceType = "rss" | "reddit" | "github" | "twitter";
export type SourceCategory = "ai" | "politics" | "tech";

export interface Source {
  id: string;
  name: string;
  type: SourceType;
  category: SourceCategory;
  url: string;
  enabled: number;
  fetchIntervalMinutes: number;
  lastFetchedAt: string | null;
  createdAt: string;
}

export interface Article {
  id: string;
  sourceId: string;
  externalUrl: string;
  title: string;
  author: string | null;
  rawContent: string | null;
  publishedAt: string;
  fetchedAt: string;
  relevanceScore: number | null;
  isEnriched: number;
  aiSummary: string | null;
  importanceRating: number | null;
  whyItMatters: string | null;
  tags: string | null;
  enrichedAt: string | null;
  bookmarked: number;
}

export interface ArticleWithSource extends Article {
  sourceName: string;
  sourceType: SourceType;
  sourceCategory: SourceCategory;
}

export interface UserRating {
  id: string;
  articleId: string;
  rating: number;
  createdAt: string;
}

export interface Setting {
  key: string;
  value: string;
  updatedAt: string;
}

export interface TrendReport {
  id: string;
  weekStart: string;
  weekEnd: string;
  summary: string;
  topThemes: string;
  createdAt: string;
}

export interface IngestionRun {
  id: string;
  startedAt: string;
  completedAt: string | null;
  articlesFetched: number;
  articlesScored: number;
  articlesEnriched: number;
  status: "running" | "completed" | "failed";
  error: string | null;
}

export interface ScoringResult {
  title: string;
  score: number;
}

export interface EnrichmentResult {
  summary: string;
  importanceRating: number;
  whyItMatters: string;
  tags: string[];
}

export interface ArticleFilters {
  source?: string;
  scoreMin?: number;
  scoreMax?: number;
  tags?: string[];
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  sort?: "relevance_score" | "published_at" | "importance_rating";
  page?: number;
  limit?: number;
}
