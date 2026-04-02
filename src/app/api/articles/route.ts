import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { articles, sources } from "@/lib/db/schema";
import { desc, eq, sql, and, gte, lte } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const page = parseInt(params.get("page") || "1");
  const limit = parseInt(params.get("limit") || "20");
  const source = params.get("source");
  const scoreMin = params.get("scoreMin");
  const scoreMax = params.get("scoreMax");
  const dateFrom = params.get("dateFrom");
  const dateTo = params.get("dateTo");
  const search = params.get("search");
  const sort = params.get("sort") || "published_at";

  const conditions = [];

  if (source) conditions.push(eq(articles.sourceId, source));
  if (scoreMin) conditions.push(gte(articles.relevanceScore, parseInt(scoreMin)));
  if (scoreMax) conditions.push(lte(articles.relevanceScore, parseInt(scoreMax)));
  if (dateFrom) conditions.push(gte(articles.publishedAt, dateFrom));
  if (dateTo) conditions.push(lte(articles.publishedAt, dateTo));
  if (search) {
    conditions.push(
      sql`(${articles.title} LIKE ${"%" + search + "%"} OR ${articles.aiSummary} LIKE ${"%" + search + "%"})`
    );
  }

  const orderBy =
    sort === "relevance_score"
      ? desc(articles.relevanceScore)
      : sort === "importance_rating"
        ? desc(articles.importanceRating)
        : desc(articles.publishedAt);

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
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(orderBy)
    .limit(limit)
    .offset((page - 1) * limit);

  return NextResponse.json({ articles: rows });
}
