import { complete } from "./provider";
import { TRENDS_SYSTEM_PROMPT, buildTrendsPrompt } from "./prompts";
import { db } from "@/lib/db";
import { trendReports, articles } from "@/lib/db/schema";
import { desc, gte, lte, and, isNotNull } from "drizzle-orm";
import { generateId, now } from "@/lib/utils";
import { startOfWeek, endOfWeek, subWeeks, format } from "date-fns";

export async function generateWeeklyTrends(): Promise<string> {
  const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });

  const topArticles = await db
    .select({
      title: articles.title,
      aiSummary: articles.aiSummary,
      relevanceScore: articles.relevanceScore,
    })
    .from(articles)
    .where(
      and(
        gte(articles.publishedAt, weekStart.toISOString()),
        lte(articles.publishedAt, weekEnd.toISOString()),
        isNotNull(articles.aiSummary)
      )
    )
    .orderBy(desc(articles.relevanceScore))
    .limit(30);

  if (topArticles.length === 0) {
    return "Not enough articles this week to generate trends.";
  }

  const prompt = buildTrendsPrompt(
    topArticles.map((a) => ({
      title: a.title,
      summary: a.aiSummary || "",
    }))
  );

  const response = await complete(prompt, TRENDS_SYSTEM_PROMPT, {
    responseFormat: "json",
    temperature: 0.4,
    maxTokens: 3000,
  });

  const parsed = JSON.parse(response);

  await db.insert(trendReports).values({
    id: generateId(),
    weekStart: format(weekStart, "yyyy-MM-dd"),
    weekEnd: format(weekEnd, "yyyy-MM-dd"),
    summary: parsed.summary || "",
    topThemes: JSON.stringify(parsed.themes || []),
    createdAt: now(),
  });

  return parsed.summary;
}
