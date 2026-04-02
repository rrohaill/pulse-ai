"use client";

import {
  Layers,
  Bot,
  Globe,
  Bookmark,
  Rss,
  MessageSquare,
  GitFork,
  AtSign,
  Tag,
  Cpu,
  Landmark,
  Microscope,
  Briefcase,
  Heart,
  Gamepad2,
  Clapperboard,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useMemo } from "react";

// CategoryKey is now a plain string so it can hold any dynamic category
export type CategoryKey = string;

// Icon + label mappings for known topic categories
const TOPIC_META: Record<
  string,
  { label: string; icon: React.ElementType }
> = {
  ai: { label: "AI & Tech", icon: Bot },
  politics: { label: "Politics", icon: Globe },
  tech: { label: "Tech", icon: Cpu },
  science: { label: "Science", icon: Microscope },
  business: { label: "Business", icon: Briefcase },
  health: { label: "Health", icon: Heart },
  gaming: { label: "Gaming", icon: Gamepad2 },
  entertainment: { label: "Entertainment", icon: Clapperboard },
  world: { label: "World", icon: Globe },
};

// Icon + label mappings for known source types
const SOURCE_META: Record<
  string,
  { label: string; icon: React.ElementType }
> = {
  rss: { label: "RSS", icon: Rss },
  reddit: { label: "Reddit", icon: MessageSquare },
  github: { label: "GitHub", icon: GitFork },
  twitter: { label: "Twitter/X", icon: AtSign },
};

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function CategorySwitcher({
  active,
  onChange,
  counts,
}: {
  active: CategoryKey;
  onChange: (key: CategoryKey) => void;
  counts: Record<string, number>;
}) {
  // Build dynamic topic and source lists from whatever keys exist in counts
  const { topicCategories, sourceCategories } = useMemo(() => {
    const fixedKeys = new Set(["all", "saved"]);
    const sourceTypeKeys = new Set(Object.keys(SOURCE_META));

    const topics: { key: string; label: string; icon: React.ElementType }[] = [
      { key: "all", label: "All", icon: Layers },
    ];

    const sources: { key: string; label: string; icon: React.ElementType }[] = [];

    for (const key of Object.keys(counts)) {
      if (fixedKeys.has(key)) continue;

      if (sourceTypeKeys.has(key)) {
        // It's a source type (rss, reddit, github, twitter)
        if (counts[key] > 0) {
          const meta = SOURCE_META[key];
          sources.push({
            key,
            label: meta?.label ?? capitalize(key),
            icon: meta?.icon ?? Rss,
          });
        }
      } else if (key === "saved") {
        // handled separately
      } else {
        // It's a topic category (ai, politics, etc.)
        if (counts[key] > 0) {
          const meta = TOPIC_META[key];
          topics.push({
            key,
            label: meta?.label ?? capitalize(key),
            icon: meta?.icon ?? Tag,
          });
        }
      }
    }

    // Always add "Saved" at the end of topics
    topics.push({ key: "saved", label: "Saved", icon: Bookmark });

    return { topicCategories: topics, sourceCategories: sources };
  }, [counts]);

  return (
    <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1">
      {/* Topic categories */}
      {topicCategories.map((cat) => {
        const isActive = active === cat.key;
        const count = counts[cat.key] ?? 0;
        return (
          <button
            key={cat.key}
            onClick={() => onChange(cat.key)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border transition-all whitespace-nowrap",
              isActive
                ? "bg-accent text-white border-accent shadow-lg shadow-accent/20"
                : "bg-card border-card-border text-muted hover:text-foreground hover:border-muted-foreground/30"
            )}
          >
            <cat.icon size={14} />
            {cat.label}
            <span
              className={cn(
                "text-[11px] px-1.5 py-0.5 rounded-full min-w-[24px] text-center",
                isActive
                  ? "bg-white/20 text-white"
                  : "bg-card-hover text-muted-foreground"
              )}
            >
              {count}
            </span>
          </button>
        );
      })}

      {/* Divider */}
      {sourceCategories.length > 0 && (
        <div className="w-px h-6 bg-card-border mx-1" />
      )}

      {/* Source type categories */}
      {sourceCategories.map((cat) => {
        const isActive = active === cat.key;
        const count = counts[cat.key] ?? 0;
        return (
          <button
            key={cat.key}
            onClick={() => onChange(cat.key)}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-full text-xs font-medium border transition-all whitespace-nowrap",
              isActive
                ? "bg-accent/80 text-white border-accent/80"
                : "bg-card border-card-border text-muted-foreground hover:text-foreground hover:border-muted-foreground/30"
            )}
          >
            <cat.icon size={12} />
            {cat.label}
            <span
              className={cn(
                "text-[10px] px-1 py-0.5 rounded-full min-w-[20px] text-center",
                isActive
                  ? "bg-white/20 text-white"
                  : "bg-card-hover text-muted-foreground"
              )}
            >
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
