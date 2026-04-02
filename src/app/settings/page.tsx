"use client";

import { useState, useEffect, useTransition } from "react";
import { Save, Loader2, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    ai_provider: "openai",
    openai_model: "gpt-4o-mini",
    ollama_model: "llama3.1",
    ollama_base_url: "http://localhost:11434",
    score_threshold: "60",
    ingest_interval: "60",
  });
  const [loading, setLoading] = useState(true);
  const [isSaving, startSave] = useTransition();
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => {
        if (d.settings) {
          setSettings((prev) => ({ ...prev, ...d.settings }));
        }
        setLoading(false);
      });
  }, []);

  const handleSave = () => {
    startSave(async () => {
      await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 size={24} className="animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="h-16 flex items-center justify-between px-6 border-b border-card-border">
        <h1 className="text-lg font-semibold">Settings</h1>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 px-4 py-2 bg-accent hover:bg-accent-hover text-white text-sm font-medium rounded-lg transition disabled:opacity-50"
        >
          {saved ? (
            <CheckCircle size={14} />
          ) : isSaving ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Save size={14} />
          )}
          {saved ? "Saved!" : isSaving ? "Saving..." : "Save Changes"}
        </button>
      </header>

      <div className="max-w-2xl mx-auto px-6 py-8 space-y-8">
        {/* AI Provider — Ollama (Local) */}
        <section className="bg-card border border-card-border rounded-xl p-6">
          <h2 className="text-sm font-semibold mb-1">AI Provider</h2>
          <p className="text-xs text-muted-foreground mb-4">
            Uses Ollama for local AI inference. Install from{" "}
            <a href="https://ollama.com" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
              ollama.com
            </a>
            {" "}and run <code className="bg-input-bg px-1.5 py-0.5 rounded text-[11px]">ollama pull llama3.1</code> to get started.
            Scoring and summaries are skipped automatically when Ollama is not running.
          </p>

          <div className="space-y-4">
              <div>
                <label className="block text-xs text-muted-foreground mb-1.5">
                  Ollama URL
                </label>
                <input
                  type="text"
                  value={settings.ollama_base_url}
                  onChange={(e) =>
                    setSettings({ ...settings, ollama_base_url: e.target.value })
                  }
                  className="w-full bg-input-bg border border-input-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/40"
                />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1.5">
                  Model
                </label>
                <input
                  type="text"
                  value={settings.ollama_model}
                  onChange={(e) =>
                    setSettings({ ...settings, ollama_model: e.target.value })
                  }
                  placeholder="llama3.1"
                  className="w-full bg-input-bg border border-input-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/40"
                />
              </div>
          </div>
        </section>

        {/* Scoring */}
        <section className="bg-card border border-card-border rounded-xl p-6">
          <h2 className="text-sm font-semibold mb-4">Scoring</h2>
          <div>
            <label className="block text-xs text-muted-foreground mb-1.5">
              Enrichment Threshold: {settings.score_threshold}
            </label>
            <p className="text-xs text-muted-foreground mb-3">
              Articles scoring above this threshold get AI summaries, importance
              ratings, and tags.
            </p>
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={settings.score_threshold}
              onChange={(e) =>
                setSettings({ ...settings, score_threshold: e.target.value })
              }
              className="w-full accent-accent"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
              <span>0 (all articles)</span>
              <span>100 (none)</span>
            </div>
          </div>
        </section>

        {/* Ingestion */}
        <section className="bg-card border border-card-border rounded-xl p-6">
          <h2 className="text-sm font-semibold mb-4">Ingestion</h2>
          <div>
            <label className="block text-xs text-muted-foreground mb-1.5">
              Fetch interval (minutes)
            </label>
            <input
              type="number"
              min={5}
              max={1440}
              value={settings.ingest_interval}
              onChange={(e) =>
                setSettings({ ...settings, ingest_interval: e.target.value })
              }
              className="w-full bg-input-bg border border-input-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/40"
            />
          </div>
        </section>
      </div>
    </div>
  );
}
