"use client";

import { useState } from "react";
import { ArticleCard } from "@/components/articles/article-card";
import { Bookmark, Search, Inbox } from "lucide-react";
import type { ArticleWithSource } from "@/lib/types";

export function SavedClient({
  articles,
}: {
  articles: ArticleWithSource[];
}) {
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = searchQuery
    ? articles.filter(
        (a) =>
          a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          a.aiSummary?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          a.rawContent?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : articles;

  return (
    <div className="min-h-screen">
      <header className="h-16 flex items-center justify-between px-6 border-b border-card-border">
        <div className="flex items-center gap-2">
          <Bookmark size={18} className="text-amber-400" />
          <h1 className="text-lg font-semibold">Saved Articles</h1>
          <span className="text-sm text-muted-foreground ml-1">
            ({articles.length})
          </span>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Search */}
        {articles.length > 0 && (
          <div className="relative mb-6">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              type="text"
              placeholder="Search saved articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-input-bg border border-input-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/40 transition"
            />
          </div>
        )}

        {/* Articles */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <Inbox size={48} className="mb-4 opacity-40" />
            <p className="text-lg font-medium mb-1">
              {articles.length === 0
                ? "No saved articles yet"
                : "No matches found"}
            </p>
            <p className="text-sm">
              {articles.length === 0
                ? "Bookmark articles from the dashboard to read later"
                : "Try a different search term"}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((article, i) => (
              <ArticleCard key={article.id} article={article} index={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
