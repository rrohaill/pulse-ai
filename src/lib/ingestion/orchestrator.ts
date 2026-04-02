import { db } from "@/lib/db";
import { sources, articles, ingestionRuns } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { fetchRSS } from "./rss";
import { fetchReddit } from "./reddit";
import { fetchGitHub } from "./github";
import { fetchTwitter } from "./twitter";
import { deduplicateArticles } from "./deduplicator";
import { scoreArticles } from "@/lib/ai/scoring";
import { enrichArticle } from "@/lib/ai/enrichment";
import { getAISettings } from "@/lib/ai/provider";
import { generateId, now } from "@/lib/utils";
import type { FetchedArticle } from "./rss";

export async function runIngestionPipeline(): Promise<{
  fetched: number;
  scored: number;
  enriched: number;
}> {
  const runId = generateId();
  const startedAt = now();

  await db.insert(ingestionRuns).values({
    id: runId,
    startedAt,
    status: "running",
  });

  try {
    // 1. Fetch from all enabled sources
    const enabledSources = await db
      .select()
      .from(sources)
      .where(eq(sources.enabled, 1));

    let allFetched: (FetchedArticle & { sourceId: string })[] = [];

    for (const source of enabledSources) {
      let fetched: FetchedArticle[] = [];

      switch (source.type) {
        case "rss":
          fetched = await fetchRSS(source.url);
          break;
        case "reddit":
          fetched = await fetchReddit(source.url);
          break;
        case "github":
          fetched = await fetchGitHub(source.url);
          break;
        case "twitter":
          fetched = await fetchTwitter(source.url);
          break;
      }

      allFetched.push(
        ...fetched.map((a) => ({ ...a, sourceId: source.id }))
      );

      // Update last fetched time
      await db
        .update(sources)
        .set({ lastFetchedAt: now() })
        .where(eq(sources.id, source.id));
    }

    // 2. Deduplicate
    const unique = await deduplicateArticles(allFetched);
    const uniqueWithSource = unique.map((u) => {
      const original = allFetched.find((a) => a.url === u.url);
      return { ...u, sourceId: original!.sourceId };
    });

    // 3. Insert new articles and track them
    const insertedArticles: { id: string; title: string; content: string }[] = [];
    for (const article of uniqueWithSource) {
      const id = generateId();
      try {
        await db.insert(articles).values({
          id,
          sourceId: article.sourceId,
          externalUrl: article.url,
          title: article.title || "Untitled",
          author: article.author || null,
          rawContent: article.content || "",
          publishedAt: article.publishedAt || now(),
          fetchedAt: now(),
        });
        insertedArticles.push({
          id,
          title: article.title || "Untitled",
          content: article.content || "",
        });
      } catch (err) {
        // Skip duplicates or invalid entries
        console.warn(`Skipping article: ${article.url}`);
      }
    }

    const totalFetched = insertedArticles.length;
    let totalScored = 0;
    let totalEnriched = 0;

    // 4. Score new articles (only if AI is reachable)
    if (insertedArticles.length > 0) {
      try {
        const aiSettings = await getAISettings();

        // Check if Ollama is actually running before attempting scoring
        if (aiSettings.provider === "ollama") {
          const check = await fetch(
            `${process.env.OLLAMA_BASE_URL || "http://localhost:11434"}/api/tags`
          ).catch(() => null);
          if (!check?.ok) {
            console.log("Ollama not running — skipping AI scoring");
            throw new Error("skip");
          }
        }

        const scores = await scoreArticles(insertedArticles);
        totalScored = scores.length;

        for (const { articleId, score } of scores) {
          await db
            .update(articles)
            .set({ relevanceScore: score })
            .where(eq(articles.id, articleId));
        }

        // 5. Enrich high-scoring articles
        const toEnrich = scores.filter(
          (s) => s.score >= aiSettings.scoreThreshold
        );

        for (const { articleId } of toEnrich) {
          const matched = insertedArticles.find((a) => a.id === articleId);
          if (!matched) continue;

          const enrichment = await enrichArticle(matched.title, matched.content);

          await db
            .update(articles)
            .set({
              isEnriched: 1,
              aiSummary: enrichment.summary,
              importanceRating: enrichment.importanceRating,
              whyItMatters: enrichment.whyItMatters,
              tags: JSON.stringify(enrichment.tags),
              enrichedAt: now(),
            })
            .where(eq(articles.id, articleId));

          totalEnriched++;
        }
      } catch (aiError) {
        // AI not available — articles are still saved, just without scores/summaries
        console.log("AI scoring skipped:", aiError instanceof Error ? aiError.message : "unavailable");
      }
    }

    // 6. Complete the run
    await db
      .update(ingestionRuns)
      .set({
        completedAt: now(),
        articlesFetched: totalFetched,
        articlesScored: totalScored,
        articlesEnriched: totalEnriched,
        status: "completed",
      })
      .where(eq(ingestionRuns.id, runId));

    return {
      fetched: totalFetched,
      scored: totalScored,
      enriched: totalEnriched,
    };
  } catch (error) {
    await db
      .update(ingestionRuns)
      .set({
        completedAt: now(),
        status: "failed",
        error: error instanceof Error ? error.message : String(error),
      })
      .where(eq(ingestionRuns.id, runId));

    throw error;
  }
}
