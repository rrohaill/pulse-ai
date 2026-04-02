"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Rss,
  MessageSquare,
  GitFork,
  AtSign,
  ToggleLeft,
  ToggleRight,
  Trash2,
  Loader2,
  Globe,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Source, SourceType } from "@/lib/types";

const SOURCE_ICONS: Record<string, React.ElementType> = {
  rss: Rss,
  reddit: MessageSquare,
  github: GitFork,
  twitter: AtSign,
};

export default function SourcesPage() {
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  useEffect(() => {
    fetch("/api/sources")
      .then((r) => r.json())
      .then((d) => {
        setSources(d.sources || []);
        setLoading(false);
      });
  }, []);

  const toggleSource = (id: string, enabled: number) => {
    startTransition(async () => {
      await fetch(`/api/sources/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: enabled ? 0 : 1 }),
      });
      setSources((prev) =>
        prev.map((s) => (s.id === id ? { ...s, enabled: enabled ? 0 : 1 } : s))
      );
    });
  };

  const deleteSource = (id: string) => {
    startTransition(async () => {
      await fetch(`/api/sources/${id}`, { method: "DELETE" });
      setSources((prev) => prev.filter((s) => s.id !== id));
    });
  };

  const addSource = async (data: {
    name: string;
    url: string;
    type: SourceType;
    category: string;
  }) => {
    const res = await fetch("/api/sources", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (result.source) {
      setSources((prev) => [...prev, result.source]);
      setShowAdd(false);
    }
  };

  return (
    <div className="min-h-screen">
      <header className="h-16 flex items-center justify-between px-6 border-b border-card-border">
        <h1 className="text-lg font-semibold">Sources</h1>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2 bg-accent hover:bg-accent-hover text-white text-sm font-medium rounded-lg transition"
        >
          <Plus size={14} />
          Add Source
        </button>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 size={24} className="animate-spin text-muted-foreground" />
          </div>
        ) : sources.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <Globe size={48} className="mb-4 opacity-40" />
            <p className="text-lg font-medium mb-1">No sources configured</p>
            <p className="text-sm mb-4">
              Add RSS feeds, Reddit subreddits, GitHub repos, or Twitter/X
              profiles to start ingesting articles
            </p>
            <button
              onClick={() => setShowAdd(true)}
              className="flex items-center gap-2 px-4 py-2 bg-accent hover:bg-accent-hover text-white text-sm font-medium rounded-lg transition"
            >
              <Plus size={14} />
              Add your first source
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {sources.map((source) => {
              const Icon = SOURCE_ICONS[source.type] || Rss;
              return (
                <div
                  key={source.id}
                  className={cn(
                    "flex items-center justify-between bg-card border border-card-border rounded-xl p-4 transition",
                    !source.enabled && "opacity-50"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-accent-muted flex items-center justify-center">
                      <Icon size={16} className="text-accent" />
                    </div>
                    <div>
                      <div className="font-medium text-sm">{source.name}</div>
                      <div className="text-xs text-muted-foreground truncate max-w-xs">
                        {source.url}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground bg-card-hover px-2 py-0.5 rounded">
                      {source.type}
                    </span>
                    <button
                      onClick={() =>
                        toggleSource(source.id, source.enabled)
                      }
                      className="p-1.5 rounded-lg hover:bg-white/5 transition text-muted-foreground hover:text-foreground"
                    >
                      {source.enabled ? (
                        <ToggleRight size={20} className="text-accent" />
                      ) : (
                        <ToggleLeft size={20} />
                      )}
                    </button>
                    <button
                      onClick={() => deleteSource(source.id)}
                      className="p-1.5 rounded-lg hover:bg-red-500/10 transition text-muted-foreground hover:text-red-400"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Source Modal */}
      {showAdd && (
        <AddSourceModal
          onClose={() => setShowAdd(false)}
          onAdd={addSource}
        />
      )}
    </div>
  );
}

function AddSourceModal({
  onClose,
  onAdd,
}: {
  onClose: () => void;
  onAdd: (data: { name: string; url: string; type: SourceType; category: string }) => void;
}) {
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [type, setType] = useState<SourceType>("rss");
  const [category, setCategory] = useState("ai");

  // Auto-populate name and URL when entering a Twitter handle
  const handleTwitterInput = (input: string) => {
    setUrl(input);
    // Auto-fill name from handle
    const handle = input.trim().replace(/^@/, "");
    const urlMatch = input.match(/(?:twitter\.com|x\.com)\/(@?\w{1,15})\/?/i);
    const extractedHandle = urlMatch
      ? urlMatch[1].replace(/^@/, "")
      : /^\w{1,15}$/i.test(handle)
        ? handle
        : null;
    if (extractedHandle && !name) {
      setName(`@${extractedHandle}`);
    }
  };

  const handleSubmit = () => {
    if (!name || !url) return;

    let finalUrl = url;
    // Normalise Twitter handle to a full URL for storage
    if (type === "twitter") {
      const clean = url.trim().replace(/^@/, "");
      if (/^\w{1,15}$/i.test(clean)) {
        finalUrl = `https://x.com/${clean}`;
      }
    }
    onAdd({ name, url: finalUrl, type, category });
  };

  const SOURCE_TYPES: { key: SourceType; label: string }[] = [
    { key: "rss", label: "RSS" },
    { key: "reddit", label: "Reddit" },
    { key: "github", label: "GitHub" },
    { key: "twitter", label: "Twitter/X" },
  ];

  const urlPlaceholders: Record<SourceType, string> = {
    rss: "https://example.com/feed.xml",
    reddit: "https://www.reddit.com/r/MachineLearning",
    github: "https://github.com/owner/repo",
    twitter: "@elonmusk or https://x.com/elonmusk",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-card border border-card-border rounded-2xl p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold">Add Source</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4">
          {/* Category */}
          <div>
            <label className="block text-xs text-muted-foreground mb-1.5">
              Category
            </label>
            <div className="flex gap-2">
              {[
                { key: "ai", label: "AI & Tech" },
                { key: "politics", label: "Politics" },
              ].map((c) => (
                <button
                  key={c.key}
                  onClick={() => setCategory(c.key)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-lg text-sm border transition flex-1 justify-center",
                    category === c.key
                      ? "bg-accent/10 border-accent/30 text-accent"
                      : "border-input-border text-muted-foreground hover:text-foreground"
                  )}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Type */}
          <div>
            <label className="block text-xs text-muted-foreground mb-1.5">
              Source Type
            </label>
            <div className="flex gap-2 flex-wrap">
              {SOURCE_TYPES.map(({ key, label }) => {
                const Icon = SOURCE_ICONS[key] || Rss;
                return (
                  <button
                    key={key}
                    onClick={() => { setType(key); setUrl(""); setName(""); }}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-lg text-sm border transition",
                      type === key
                        ? "bg-accent/10 border-accent/30 text-accent"
                        : "border-input-border text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Icon size={14} />
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Twitter hint */}
          {type === "twitter" && (
            <div className="bg-sky-500/10 border border-sky-500/20 rounded-lg p-3 text-xs text-sky-300">
              <strong>Tip:</strong> Enter a Twitter/X handle (e.g. <code className="bg-sky-500/20 px-1 rounded">@OpenAI</code>)
              {" "}or full profile URL. Tweets are fetched via RSS bridge services (RSSHub/Nitter).
            </div>
          )}

          <div>
            <label className="block text-xs text-muted-foreground mb-1.5">
              {type === "twitter" ? "Handle or URL" : "Name"}
            </label>
            {type === "twitter" ? (
              <input
                type="text"
                value={url}
                onChange={(e) => handleTwitterInput(e.target.value)}
                placeholder={urlPlaceholders.twitter}
                className="w-full bg-input-bg border border-input-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/40"
              />
            ) : (
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., OpenAI Blog"
                className="w-full bg-input-bg border border-input-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/40"
              />
            )}
          </div>

          {type === "twitter" ? (
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">
                Display Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., @OpenAI"
                className="w-full bg-input-bg border border-input-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/40"
              />
            </div>
          ) : (
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">
                URL
              </label>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder={urlPlaceholders[type]}
                className="w-full bg-input-bg border border-input-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/40"
              />
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!name || !url}
            className="px-4 py-2 bg-accent hover:bg-accent-hover text-white text-sm font-medium rounded-lg transition disabled:opacity-50"
          >
            Add Source
          </button>
        </div>
      </div>
    </div>
  );
}
