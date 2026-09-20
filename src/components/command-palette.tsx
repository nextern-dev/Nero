"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  CornerDownLeft,
  FolderKanban,
  LayoutDashboard,
  Plus,
  Search,
  SquareCheckBig,
  Users,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useEffectEvent, useMemo, useRef, useState } from "react";
import type { SearchResults } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useUI } from "@/store/ui";

type Item =
  | { kind: "project"; id: string; title: string; sub: string; color: string }
  | { kind: "task"; id: string; title: string; sub: string; color: string; href: string }
  | { kind: "action"; id: string; title: string; sub: string; run: () => void };

export function CommandPalette() {
  const { paletteOpen, setPaletteOpen, setNewProjectOpen } = useUI();
  const router = useRouter();
  const [q, setQ] = useState("");
  const [results, setResults] = useState<SearchResults>({
    tasks: [],
    projects: [],
  });
  const [loading, setLoading] = useState(false);
  const [index, setIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const resetPalette = useEffectEvent(() => {
    setQ("");
    setResults({ tasks: [], projects: [] });
    setIndex(0);
  });
  const resetIndex = useEffectEvent(() => setIndex(0));

  useEffect(() => {
    if (!paletteOpen) return;
    const timeout = window.setTimeout(resetPalette, 0);
    inputRef.current?.focus();
    return () => window.clearTimeout(timeout);
  }, [paletteOpen]);

  useEffect(() => {
    if (!paletteOpen || q.trim().length === 0) return;
    const controller = new AbortController();
    const t = setTimeout(async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`, {
          signal: controller.signal,
        });
        if (res.ok) setResults(await res.json());
      } catch {
        /* aborted */
      } finally {
        setLoading(false);
      }
    }, 180);
    return () => {
      clearTimeout(t);
      controller.abort();
    };
  }, [q, paletteOpen]);

  const items = useMemo<Item[]>(() => {
    if (q.trim().length === 0) {
      return [
        {
          kind: "action",
          id: "go-dashboard",
          title: "Go to Dashboard",
          sub: "Page",
          run: () => router.push("/dashboard"),
        },
        {
          kind: "action",
          id: "go-projects",
          title: "Go to Projects",
          sub: "Page",
          run: () => router.push("/projects"),
        },
        {
          kind: "action",
          id: "go-members",
          title: "Go to Members",
          sub: "Page",
          run: () => router.push("/members"),
        },
        {
          kind: "action",
          id: "new-project",
          title: "Create new project",
          sub: "Action",
          run: () => setNewProjectOpen(true),
        },
      ];
    }
    return [
      ...results.projects.map<Item>((p) => ({
        kind: "project",
        id: p.id,
        title: p.name,
        sub: p.key,
        color: p.color,
      })),
      ...results.tasks.map<Item>((t) => ({
        kind: "task",
        id: t.id,
        title: t.title,
        sub: `${t.projectKey}-${t.number}`,
        color: t.projectColor,
        href: `/projects/${t.projectId}?task=${t.id}`,
      })),
    ];
  }, [q, results, router, setNewProjectOpen]);

  const select = useCallback((item?: Item) => {
    if (!item) return;
    setPaletteOpen(false);
    if (item.kind === "project") router.push(`/projects/${item.id}`);
    else if (item.kind === "task") router.push(item.href);
    else item.run();
  }, [router, setPaletteOpen]);

  useEffect(() => {
    const timeout = window.setTimeout(resetIndex, 0);
    return () => window.clearTimeout(timeout);
  }, [items.length]);

  useEffect(() => {
    if (!paletteOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPaletteOpen(false);
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setIndex((i) => Math.min(items.length - 1, i + 1));
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setIndex((i) => Math.max(0, i - 1));
      }
      if (e.key === "Enter") {
        e.preventDefault();
        select(items[index]);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [index, items, paletteOpen, select, setPaletteOpen]);

  useEffect(() => {
    listRef.current
      ?.querySelector(`[data-index="${index}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [index]);

  return (
    <AnimatePresence>
      {paletteOpen && (
        <div className="fixed inset-0 z-[60] flex items-start justify-center p-4 pt-[14vh]">
          <motion.div
            className="fixed inset-0 bg-black/70 backdrop-blur-[6px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setPaletteOpen(false)}
          />
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 480, damping: 36 }}
            className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-white/[0.09] bg-ink-900 shadow-[0_40px_90px_-20px_rgba(0,0,0,0.9)]"
          >
            <div className="flex items-center gap-3 border-b border-white/[0.07] px-4">
              <Search className="h-4 w-4 shrink-0 text-ink-500" />
              <input
                ref={inputRef}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search tasks and projects…"
                className="h-12 w-full bg-transparent text-[15px] text-ink-50 outline-none placeholder:text-ink-500"
              />
              {loading && (
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-ink-600 border-t-brand-400" />
              )}
            </div>

            <div ref={listRef} className="max-h-[46vh] overflow-y-auto p-2">
              {items.length === 0 && (
                <p className="px-3 py-8 text-center text-[13px] text-ink-500">
                  No results for “{q}”
                </p>
              )}
              {q.trim().length === 0 && (
                <p className="px-3 pt-1.5 pb-1 text-[10.5px] font-medium tracking-wider text-ink-500 uppercase">
                  Quick actions
                </p>
              )}
              {items.map((item, i) => (
                <button
                  key={item.id}
                  data-index={i}
                  onMouseEnter={() => setIndex(i)}
                  onClick={() => select(item)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors",
                    i === index ? "bg-white/[0.06]" : "",
                  )}
                >
                  {item.kind === "task" ? (
                    <SquareCheckBig
                      className="h-4 w-4 shrink-0"
                      style={{ color: item.color }}
                    />
                  ) : item.kind === "project" ? (
                    <FolderKanban
                      className="h-4 w-4 shrink-0"
                      style={{ color: item.color }}
                    />
                  ) : item.id === "new-project" ? (
                    <Plus className="h-4 w-4 shrink-0 text-brand-400" />
                  ) : item.id === "go-members" ? (
                    <Users className="h-4 w-4 shrink-0 text-ink-400" />
                  ) : (
                    <LayoutDashboard className="h-4 w-4 shrink-0 text-ink-400" />
                  )}
                  <span className="min-w-0 flex-1 truncate text-[13.5px] text-ink-100">
                    {item.title}
                  </span>
                  <span className="shrink-0 font-mono text-[10.5px] text-ink-500">
                    {item.sub}
                  </span>
                  {i === index && (
                    <CornerDownLeft className="h-3 w-3 shrink-0 text-ink-500" />
                  )}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-4 border-t border-white/[0.07] px-4 py-2.5 text-[10.5px] text-ink-500">
              <span className="flex items-center gap-1.5">
                <span className="kbd">↑↓</span> navigate
              </span>
              <span className="flex items-center gap-1.5">
                <span className="kbd">↵</span> open
              </span>
              <span className="flex items-center gap-1.5">
                <span className="kbd">esc</span> close
              </span>
              <span className="ml-auto hidden sm:block">
                Nero command palette
              </span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
