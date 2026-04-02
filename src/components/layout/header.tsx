"use client";

import { Search, RefreshCw } from "lucide-react";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export function Header({
  onSearch,
  onIngest,
}: {
  onSearch?: (query: string) => void;
  onIngest?: () => Promise<void>;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isIngesting, startIngest] = useTransition();
  const router = useRouter();

  const handleIngest = () => {
    startIngest(async () => {
      try {
        const res = await fetch("/api/ingest", { method: "POST" });
        if (res.ok) {
          router.refresh();
        }
      } catch (err) {
        console.error("Ingestion failed:", err);
      }
    });
  };

  return (
    <header className="h-16 flex items-center justify-between gap-4 px-6 border-b border-card-border bg-background/80 backdrop-blur-sm sticky top-0 z-20">
      {/* Search */}
      <div className="flex-1 max-w-xl relative">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
        />
        <input
          type="text"
          placeholder="Search articles..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            onSearch?.(e.target.value);
          }}
          className="w-full pl-10 pr-4 py-2 bg-input-bg border border-input-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent/40 transition"
        />
        <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:inline text-[10px] text-muted-foreground bg-card border border-card-border px-1.5 py-0.5 rounded">
          /
        </kbd>
      </div>

      {/* Actions */}
      <button
        onClick={handleIngest}
        disabled={isIngesting}
        className="flex items-center gap-2 px-4 py-2 bg-accent hover:bg-accent-hover text-white text-sm font-medium rounded-lg transition disabled:opacity-50"
      >
        <RefreshCw size={14} className={isIngesting ? "animate-spin" : ""} />
        {isIngesting ? "Fetching..." : "Fetch Articles"}
      </button>
    </header>
  );
}
