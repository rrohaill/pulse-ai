"use client";

import { useState, useMemo } from "react";
import { Header } from "@/components/layout/header";
import { FilterBar } from "@/components/filters/filter-bar";
import { CategorySwitcher, type CategoryKey } from "@/components/filters/category-switcher";
import { ArticleFeed } from "@/components/articles/article-feed";
import { Newspaper, TrendingUp, Clock } from "lucide-react";
import { useRelativeTime } from "@/hooks/use-relative-time";
import type { ArticleWithSource, ArticleFilters } from "@/lib/types";

export function DashboardClient({
  initialArticles,
  sources,
  stats,
}: {
  initialArticles: ArticleWithSource[];
  sources: { id: string; name: string }[];
  stats: {
    total: number;
    today: number;
    lastRun: { startedAt: string; status: string } | null;
  };
}) {
  const [filters, setFilters] = useState<ArticleFilters>({
    sort: "published_at",
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<CategoryKey>("all");
  const lastFetchTime = useRelativeTime(stats.lastRun?.startedAt);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: 0, saved: 0 };
    for (const a of initialArticles) {
      counts.all++;
      if (a.bookmarked) counts.saved++;
      // Topic category — dynamically discovered
      const cat = a.sourceCategory || "ai";
      counts[cat] = (counts[cat] || 0) + 1;
      // Source type — dynamically discovered
      const type = a.sourceType;
      counts[type] = (counts[type] || 0) + 1;
    }
    return counts;
  }, [initialArticles]);

  const filteredArticles = useMemo(() => {
    let result = [...initialArticles];

    // Category filter — dynamically matches topic categories or source types
    if (activeCategory !== "all") {
      if (activeCategory === "saved") {
        result = result.filter((a) => a.bookmarked);
      } else {
        result = result.filter(
          (a) =>
            (a.sourceCategory || "ai") === activeCategory ||
            a.sourceType === activeCategory
        );
      }
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          a.aiSummary?.toLowerCase().includes(q) ||
          a.sourceName.toLowerCase().includes(q)
      );
    }

    if (filters.source) {
      result = result.filter((a) => a.sourceId === filters.source);
    }

    if (filters.scoreMin) {
      result = result.filter(
        (a) => (a.relevanceScore ?? 0) >= filters.scoreMin!
      );
    }

    if (filters.dateFrom) {
      result = result.filter((a) => a.publishedAt >= filters.dateFrom!);
    }

    if (filters.sort === "relevance_score") {
      result.sort(
        (a, b) => (b.relevanceScore ?? 0) - (a.relevanceScore ?? 0)
      );
    } else if (filters.sort === "importance_rating") {
      result.sort(
        (a, b) => (b.importanceRating ?? 0) - (a.importanceRating ?? 0)
      );
    }

    return result;
  }, [initialArticles, filters, searchQuery, activeCategory]);

  return (
    <div className="min-h-screen">
      <Header onSearch={setSearchQuery} />

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-card border border-card-border rounded-xl p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <Newspaper size={14} />
              Total Articles
            </div>
            <div className="text-2xl font-bold">{stats.total}</div>
          </div>
          <div className="bg-card border border-card-border rounded-xl p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <TrendingUp size={14} />
              Today
            </div>
            <div className="text-2xl font-bold">{stats.today}</div>
          </div>
          <div className="bg-card border border-card-border rounded-xl p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <Clock size={14} />
              Last Fetch
            </div>
            <div className="text-sm font-medium mt-1">
              {lastFetchTime || "Never"}
            </div>
          </div>
        </div>

        <CategorySwitcher
          active={activeCategory}
          onChange={setActiveCategory}
          counts={categoryCounts}
        />

        <FilterBar
          filters={filters}
          onFiltersChange={setFilters}
          sources={sources}
        />

        <ArticleFeed
          initialArticles={filteredArticles}
          filters={filters}
        />
      </div>
    </div>
  );
}
