import { complete } from "./provider";
import { SCORING_SYSTEM_PROMPT, buildScoringPrompt } from "./prompts";
import { db } from "@/lib/db";
import { userRatings, articles } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";

interface ArticleToScore {
  id: string;
  title: string;
  content: string;
}

interface ScoreResult {
  articleId: string;
  score: number;
}

async function getCalibrationContext(): Promise<string | undefined> {
  const recentRatings = await db
    .select({
      rating: userRatings.rating,
      title: articles.title,
      score: articles.relevanceScore,
    })
    .from(userRatings)
    .innerJoin(articles, eq(userRatings.articleId, articles.id))
    .orderBy(desc(userRatings.createdAt))
    .limit(20);

  if (recentRatings.length === 0) return undefined;

  const liked = recentRatings
    .filter((r) => r.rating > 0)
    .map((r) => `"${r.title}" (AI score: ${r.score}, user: liked)`)
    .join("\n");

  const disliked = recentRatings
    .filter((r) => r.rating < 0)
    .map((r) => `"${r.title}" (AI score: ${r.score}, user: disliked)`)
    .join("\n");

  return `Articles the user LIKED:\n${liked || "None yet"}\n\nArticles the user DISLIKED:\n${disliked || "None yet"}`;
}

export async function scoreArticles(
  articleBatch: ArticleToScore[]
): Promise<ScoreResult[]> {
  const BATCH_SIZE = 15;
  const results: ScoreResult[] = [];
  const calibration = await getCalibrationContext();

  for (let i = 0; i < articleBatch.length; i += BATCH_SIZE) {
    const batch = articleBatch.slice(i, i + BATCH_SIZE);
    const prompt = buildScoringPrompt(
      batch.map((a) => ({ title: a.title, content: a.content })),
      calibration
    );

    try {
      const response = await complete(prompt, SCORING_SYSTEM_PROMPT, {
        responseFormat: "json",
        temperature: 0.2,
      });

      const parsed = JSON.parse(response);
      const scores = parsed.scores || [];

      for (const s of scores) {
        if (
          typeof s.index === "number" &&
          typeof s.score === "number" &&
          batch[s.index]
        ) {
          results.push({
            articleId: batch[s.index].id,
            score: Math.min(100, Math.max(0, Math.round(s.score))),
          });
        }
      }
    } catch (error) {
      console.error("Scoring batch failed:", error);
      // Assign default scores for failed batch
      for (const article of batch) {
        results.push({ articleId: article.id, score: 50 });
      }
    }
  }

  return results;
}
