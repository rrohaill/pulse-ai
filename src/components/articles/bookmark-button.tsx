"use client";

import { Bookmark } from "lucide-react";
import { useState, useTransition } from "react";
import { cn } from "@/lib/utils";

export function BookmarkButton({
  articleId,
  initialBookmarked,
}: {
  articleId: string;
  initialBookmarked: boolean;
}) {
  const [bookmarked, setBookmarked] = useState(initialBookmarked);
  const [isPending, startTransition] = useTransition();

  const handleToggle = () => {
    setBookmarked(!bookmarked);
    startTransition(async () => {
      try {
        const res = await fetch(`/api/articles/${articleId}/bookmark`, {
          method: "POST",
        });
        const data = await res.json();
        setBookmarked(!!data.bookmarked);
      } catch {
        setBookmarked(bookmarked); // revert
      }
    });
  };

  return (
    <button
      onClick={handleToggle}
      disabled={isPending}
      className={cn(
        "p-1.5 rounded-md transition-colors",
        bookmarked
          ? "bg-amber-500/20 text-amber-400"
          : "text-muted-foreground hover:text-amber-400 hover:bg-amber-500/10"
      )}
      title={bookmarked ? "Remove from saved" : "Save for later"}
    >
      <Bookmark
        size={14}
        className={bookmarked ? "fill-amber-400" : ""}
      />
    </button>
  );
}
