import { nanoid } from "nanoid";
import { formatDistanceToNow, parseISO } from "date-fns";

export function generateId(): string {
  return nanoid();
}

export function now(): string {
  return new Date().toISOString();
}

export function relativeTime(dateStr: string): string {
  try {
    return formatDistanceToNow(parseISO(dateStr), { addSuffix: true });
  } catch {
    return dateStr;
  }
}

export function getScoreColor(score: number | null): string {
  if (score === null) return "bg-slate-500/15 text-slate-400 border-slate-500/30";
  if (score >= 80) return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
  if (score >= 60) return "bg-amber-500/15 text-amber-400 border-amber-500/30";
  return "bg-slate-500/15 text-slate-400 border-slate-500/30";
}

export function parseTags(tagsStr: string | null): string[] {
  if (!tagsStr) return [];
  try {
    return JSON.parse(tagsStr);
  } catch {
    return [];
  }
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + "...";
}

export function cn(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(" ");
}
