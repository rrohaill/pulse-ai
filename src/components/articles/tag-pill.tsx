export function TagPill({ tag }: { tag: string }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-accent-muted text-accent border border-accent/20">
      {tag}
    </span>
  );
}
