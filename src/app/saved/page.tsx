import { db } from "@/lib/db";
import { articles, sources } from "@/lib/db/schema";
import { desc, eq, and } from "drizzle-orm";
import { SavedClient } from "./saved-client";

export const dynamic = "force-dynamic";

async function getSavedArticles() {
  const rows = await db
    .select({
      id: articles.id,
      sourceId: articles.sourceId,
      externalUrl: articles.externalUrl,
      title: articles.title,
      author: articles.author,
      rawContent: articles.rawContent,
      publishedAt: articles.publishedAt,
      fetchedAt: articles.fetchedAt,
      relevanceScore: articles.relevanceScore,
      isEnriched: articles.isEnriched,
      aiSummary: articles.aiSummary,
      importanceRating: articles.importanceRating,
      whyItMatters: articles.whyItMatters,
      tags: articles.tags,
      enrichedAt: articles.enrichedAt,
      bookmarked: articles.bookmarked,
      sourceName: sources.name,
      sourceType: sources.type,
      sourceCategory: sources.category,
    })
    .from(articles)
    .innerJoin(sources, eq(articles.sourceId, sources.id))
    .where(eq(articles.bookmarked, 1))
    .orderBy(desc(articles.publishedAt));

  return rows as unknown as Array<{
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
    sourceName: string;
    sourceType: "rss" | "reddit" | "github";
    sourceCategory: "ai" | "politics" | "tech";
  }>;
}

export default async function SavedPage() {
  const savedArticles = await getSavedArticles();
  return <SavedClient articles={savedArticles} />;
}
