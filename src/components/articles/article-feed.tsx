"use client";

import { useState, useEffect, useCallback } from "react";
import { ArticleCard } from "./article-card";
import { Loader2, Inbox } from "lucide-react";
import type { ArticleWithSource, ArticleFilters } from "@/lib/types";

export function ArticleFeed({
  initialArticles,
  filters,
}: {
  initialArticles: ArticleWithSource[];
  filters: ArticleFilters;
}) {
  const [articles, setArticles] = useState(initialArticles);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(initialArticles.length >= 20);

  useEffect(() => {
    setArticles(initialArticles);
    setPage(1);
    setHasMore(initialArticles.length >= 20);
  }, [initialArticles]);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    setLoading(true);
    const nextPage = page + 1;

    const params = new URLSearchParams({
      page: String(nextPage),
      limit: "20",
      ...Object.fromEntries(
        Object.entries(filters).filter(([, v]) => v !== undefined && v !== "")
      ),
    });

    try {
      const res = await fetch(`/api/articles?${params}`);
      const data = await res.json();
      if (data.articles?.length) {
        setArticles((prev) => [...prev, ...data.articles]);
        setPage(nextPage);
        setHasMore(data.articles.length >= 20);
      } else {
        setHasMore(false);
      }
    } catch (err) {
      console.error("Failed to load more:", err);
    } finally {
      setLoading(false);
    }
  }, [page, loading, hasMore, filters]);

  if (articles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <Inbox size={48} className="mb-4 opacity-40" />
        <p className="text-lg font-medium mb-1">No articles yet</p>
        <p className="text-sm">
          Click &quot;Fetch Articles&quot; to start ingesting from your sources
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="space-y-4">
        {articles.map((article, i) => (
          <ArticleCard key={article.id} article={article} index={i} />
        ))}
      </div>

      {hasMore && (
        <div className="flex justify-center py-8">
          <button
            onClick={loadMore}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2.5 bg-card border border-card-border rounded-lg text-sm text-muted hover:text-foreground hover:border-accent/30 transition"
          >
            {loading && <Loader2 size={14} className="animate-spin" />}
            {loading ? "Loading..." : "Load more"}
          </button>
        </div>
      )}
    </div>
  );
}
