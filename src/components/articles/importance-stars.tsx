import { Star } from "lucide-react";

export function ImportanceStars({ rating }: { rating: number | null }) {
  if (!rating) return null;

  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          size={12}
          className={
            i < rating
              ? "text-amber-400 fill-amber-400"
              : "text-slate-600"
          }
        />
      ))}
    </div>
  );
}
