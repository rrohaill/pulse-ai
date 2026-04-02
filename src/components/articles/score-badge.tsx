import { getScoreColor } from "@/lib/utils";

export function ScoreBadge({ score }: { score: number | null }) {
  if (score === null) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-slate-500/15 text-slate-400 border border-slate-500/30">
        --
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold border ${getScoreColor(score)}`}
    >
      {score}
    </span>
  );
}
