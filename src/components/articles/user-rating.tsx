"use client";

import { ThumbsUp, ThumbsDown } from "lucide-react";
import { useState, useTransition } from "react";
import { cn } from "@/lib/utils";

export function UserRating({
  articleId,
  initialRating,
}: {
  articleId: string;
  initialRating?: number | null;
}) {
  const [rating, setRating] = useState<number | null>(initialRating ?? null);
  const [isPending, startTransition] = useTransition();

  const handleRate = (value: number) => {
    const newRating = rating === value ? null : value;
    setRating(newRating);

    startTransition(async () => {
      try {
        await fetch(`/api/articles/${articleId}/rate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rating: newRating ?? 0 }),
        });
      } catch (err) {
        console.error("Rating failed:", err);
        setRating(rating); // revert
      }
    });
  };

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => handleRate(1)}
        disabled={isPending}
        className={cn(
          "p-1.5 rounded-md transition-colors",
          rating === 1
            ? "bg-emerald-500/20 text-emerald-400"
            : "text-muted-foreground hover:text-emerald-400 hover:bg-emerald-500/10"
        )}
      >
        <ThumbsUp size={14} />
      </button>
      <button
        onClick={() => handleRate(-1)}
        disabled={isPending}
        className={cn(
          "p-1.5 rounded-md transition-colors",
          rating === -1
            ? "bg-red-500/20 text-red-400"
            : "text-muted-foreground hover:text-red-400 hover:bg-red-500/10"
        )}
      >
        <ThumbsDown size={14} />
      </button>
    </div>
  );
}
