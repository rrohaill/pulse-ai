"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Bookmark,
  Rss,
  TrendingUp,
  Settings,
  Zap,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/saved", label: "Saved", icon: Bookmark },
  { href: "/sources", label: "Sources", icon: Rss },
  { href: "/trends", label: "Trends", icon: TrendingUp },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed top-4 left-4 z-50 md:hidden p-2 rounded-lg bg-card border border-card-border"
      >
        {open ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 bg-sidebar-bg border-r border-sidebar-border flex flex-col transition-transform duration-200",
          "md:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo */}
        <div className="h-16 flex items-center gap-2.5 px-5 border-b border-sidebar-border">
          <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center">
            <Zap size={18} className="text-accent" />
          </div>
          <span className="text-lg font-semibold tracking-tight">
            Pulse AI
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-accent/10 text-accent"
                    : "text-muted hover:text-foreground hover:bg-white/5"
                )}
              >
                <item.icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-4 py-4 border-t border-sidebar-border">
          <div className="text-xs text-muted-foreground">
            Pulse AI v1.0
          </div>
        </div>
      </aside>
    </>
  );
}
