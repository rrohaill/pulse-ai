"use client";

import { useState, useEffect, useTransition } from "react";
import { TrendingUp, Loader2, Sparkles, CalendarDays } from "lucide-react";
import { motion } from "framer-motion";

interface TrendReport {
  id: string;
  weekStart: string;
  weekEnd: string;
  summary: string;
  topThemes: string;
  createdAt: string;
}

interface Theme {
  title: string;
  description: string;
  relatedArticles?: string[];
}

export default function TrendsPage() {
  const [trends, setTrends] = useState<TrendReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [isGenerating, startGenerate] = useTransition();

  useEffect(() => {
    fetch("/api/trends")
      .then((r) => r.json())
      .then((d) => {
        setTrends(d.trends || []);
        setLoading(false);
      });
  }, []);

  const generateTrends = () => {
    startGenerate(async () => {
      try {
        await fetch("/api/trends", { method: "POST" });
        const res = await fetch("/api/trends");
        const data = await res.json();
        setTrends(data.trends || []);
      } catch (err) {
        console.error("Failed to generate trends:", err);
      }
    });
  };

  return (
    <div className="min-h-screen">
      <header className="h-16 flex items-center justify-between px-6 border-b border-card-border">
        <h1 className="text-lg font-semibold">Weekly Trends</h1>
        <button
          onClick={generateTrends}
          disabled={isGenerating}
          className="flex items-center gap-2 px-4 py-2 bg-accent hover:bg-accent-hover text-white text-sm font-medium rounded-lg transition disabled:opacity-50"
        >
          {isGenerating ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Sparkles size={14} />
          )}
          {isGenerating ? "Analyzing..." : "Generate Report"}
        </button>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 size={24} className="animate-spin text-muted-foreground" />
          </div>
        ) : trends.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <TrendingUp size={48} className="mb-4 opacity-40" />
            <p className="text-lg font-medium mb-1">No trend reports yet</p>
            <p className="text-sm">
              Generate a weekly report to see emerging AI/tech themes
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {trends.map((report, i) => {
              let themes: Theme[] = [];
              try {
                themes = JSON.parse(report.topThemes);
              } catch {}

              return (
                <motion.div
                  key={report.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-card border border-card-border rounded-xl p-6"
                >
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
                    <CalendarDays size={14} />
                    <span>
                      {report.weekStart} to {report.weekEnd}
                    </span>
                  </div>

                  <p className="text-sm text-muted leading-relaxed mb-5">
                    {report.summary}
                  </p>

                  {themes.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Key Themes
                      </h3>
                      {themes.map((theme, j) => (
                        <div
                          key={j}
                          className="bg-accent-muted border border-accent/10 rounded-lg p-4"
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <TrendingUp size={14} className="text-accent" />
                            <h4 className="text-sm font-semibold text-accent">
                              {theme.title}
                            </h4>
                          </div>
                          <p className="text-sm text-muted leading-relaxed">
                            {theme.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
