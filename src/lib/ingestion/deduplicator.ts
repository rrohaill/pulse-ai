import { db } from "@/lib/db";
import { articles } from "@/lib/db/schema";
import { inArray } from "drizzle-orm";
import type { FetchedArticle } from "./rss";

export async function deduplicateArticles(
  fetched: FetchedArticle[]
): Promise<FetchedArticle[]> {
  if (fetched.length === 0) return [];

  const urls = fetched.map((a) => a.url);

  // Query in batches to avoid SQLite variable limit
  const BATCH = 500;
  const existingUrls = new Set<string>();

  for (let i = 0; i < urls.length; i += BATCH) {
    const batch = urls.slice(i, i + BATCH);
    const existing = await db
      .select({ url: articles.externalUrl })
      .from(articles)
      .where(inArray(articles.externalUrl, batch));

    for (const row of existing) {
      existingUrls.add(row.url);
    }
  }

  return fetched.filter((a) => !existingUrls.has(a.url));
}
