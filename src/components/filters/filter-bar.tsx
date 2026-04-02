"use client";

import { useState, useEffect } from "react";
import { Filter, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ArticleFilters } from "@/lib/types";

const SORT_OPTIONS = [
  { value: "published_at", label: "Newest" },
  { value: "relevance_score", label: "Relevance" },
  { value: "importance_rating", label: "Importance" },
];

export function FilterBar({
  filters,
  onFiltersChange,
  sources,
}: {
  filters: ArticleFilters;
  onFiltersChange: (filters: ArticleFilters) => void;
  sources: { id: string; name: string }[];
}) {
  const [expanded, setExpanded] = useState(false);
  const hasFilters =
    filters.source ||
    filters.scoreMin ||
    filters.tags?.length ||
    filters.sort !== "published_at";

  return (
    <div className="bg-card border border-card-border rounded-xl p-4 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setExpanded(!expanded)}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition",
              expanded || hasFilters
                ? "bg-accent/10 text-accent"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Filter size={14} />
            Filters
            {hasFilters && (
              <span className="w-1.5 h-1.5 rounded-full bg-accent" />
            )}
          </button>

          {/* Sort */}
          <select
            value={filters.sort || "published_at"}
            onChange={(e) =>
              onFiltersChange({
                ...filters,
                sort: e.target.value as ArticleFilters["sort"],
              })
            }
            className="bg-input-bg border border-input-border rounded-lg px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/40"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {hasFilters && (
          <button
            onClick={() =>
              onFiltersChange({ sort: "published_at" })
            }
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition"
          >
            <X size={12} />
            Clear
          </button>
        )}
      </div>

      {expanded && (
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Source filter */}
          <div>
            <label className="block text-xs text-muted-foreground mb-1.5">
              Source
            </label>
            <select
              value={filters.source || ""}
              onChange={(e) =>
                onFiltersChange({ ...filters, source: e.target.value || undefined })
              }
              className="w-full bg-input-bg border border-input-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/40"
            >
              <option value="">All sources</option>
              {sources.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Score min */}
          <div>
            <label className="block text-xs text-muted-foreground mb-1.5">
              Min Score: {filters.scoreMin || 0}
            </label>
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={filters.scoreMin || 0}
              onChange={(e) =>
                onFiltersChange({
                  ...filters,
                  scoreMin: Number(e.target.value) || undefined,
                })
              }
              className="w-full accent-accent"
            />
          </div>

          {/* Date filter */}
          <div>
            <label className="block text-xs text-muted-foreground mb-1.5">
              Since
            </label>
            <input
              type="date"
              value={filters.dateFrom || ""}
              onChange={(e) =>
                onFiltersChange({
                  ...filters,
                  dateFrom: e.target.value || undefined,
                })
              }
              className="w-full bg-input-bg border border-input-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/40"
            />
          </div>
        </div>
      )}
    </div>
  );
}
