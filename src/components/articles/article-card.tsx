"use client";

import { ExternalLink, Rss, MessageSquare, GitFork, AtSign, Clock } from "lucide-react";
import { ScoreBadge } from "./score-badge";
import { ImportanceStars } from "./importance-stars";
import { TagPill } from "./tag-pill";
import { UserRating } from "./user-rating";
import { BookmarkButton } from "./bookmark-button";
import { relativeTime, parseTags } from "@/lib/utils";
import { motion } from "framer-motion";
import type { ArticleWithSource } from "@/lib/types";

const SOURCE_ICONS = {
  rss: Rss,
  reddit: MessageSquare,
  github: GitFork,
  twitter: AtSign,
};

export function ArticleCard({
  article,
  index = 0,
}: {
  article: ArticleWithSource;
  index?: number;
}) {
  const tags = parseTags(article.tags);
  const SourceIcon = SOURCE_ICONS[article.sourceType] || Rss;

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="group bg-card border border-card-border rounded-xl p-5 hover:border-accent/30 hover:bg-card-hover transition-all duration-200"
    >
      {/* Top row: source + score + time */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <SourceIcon size={13} />
          <span>{article.sourceName}</span>
          <span className="text-card-border">|</span>
          <Clock size={12} />
          <span suppressHydrationWarning>{relativeTime(article.publishedAt)}</span>
        </div>
        <div className="flex items-center gap-2">
          <ImportanceStars rating={article.importanceRating} />
          <ScoreBadge score={article.relevanceScore} />
        </div>
      </div>

      {/* Title */}
      <a
        href={article.externalUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="group/link flex items-start gap-2 mb-3"
      >
        <h3 className="text-[15px] font-semibold leading-snug text-foreground group-hover/link:text-accent transition-colors">
          {article.title}
        </h3>
        <ExternalLink
          size={14}
          className="mt-1 flex-shrink-0 opacity-0 group-hover/link:opacity-100 text-muted-foreground transition-opacity"
        />
      </a>

      {/* Description: AI summary or raw content */}
      {(article.aiSummary || article.rawContent) && (
        <p className="text-sm text-muted leading-relaxed mb-3 line-clamp-3">
          {article.aiSummary || article.rawContent}
        </p>
      )}

      {/* Why it matters */}
      {article.whyItMatters && (
        <div className="bg-accent-muted border border-accent/10 rounded-lg px-3.5 py-2.5 mb-3">
          <p className="text-xs font-medium text-accent mb-0.5">
            Why it matters
          </p>
          <p className="text-sm text-muted leading-relaxed">
            {article.whyItMatters}
          </p>
        </div>
      )}

      {/* Bottom row: tags + rating */}
      <div className="flex items-center justify-between">
        <div className="flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <TagPill key={tag} tag={tag} />
          ))}
        </div>
        <div className="flex items-center gap-1">
          <BookmarkButton
            articleId={article.id}
            initialBookmarked={!!article.bookmarked}
          />
          <UserRating articleId={article.id} />
        </div>
      </div>
    </motion.article>
  );
}
