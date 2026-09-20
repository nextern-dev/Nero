"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Menu } from "lucide-react";
import { useEffect, type ReactNode } from "react";
import { CommandPalette } from "@/components/command-palette";
import { Logo } from "@/components/logo";
import { NewProjectModal } from "@/components/new-project-modal";
import { Sidebar } from "@/components/sidebar";
import type { Role } from "@/db/schema";
import type { UserDTO } from "@/lib/types";
import { useUI } from "@/store/ui";

export function AppShell({
  user,
  workspace,
  workspaces,
  projects,
  children,
}: {
  user: UserDTO;
  workspace: { id: string; name: string };
  workspaces: { id: string; name: string; role: Role }[];
  projects: { id: string; name: string; key: string; color: string }[];
  children: ReactNode;
}) {
  const { paletteOpen, setPaletteOpen, mobileNavOpen, setMobileNavOpen } =
    useUI();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen(!useUI.getState().paletteOpen);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [setPaletteOpen]);

  return (
    <div className="min-h-screen bg-ink-950">
      {/* Ambient warmth at the top of every page */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-x-0 top-0 z-0 h-[420px] bg-[radial-gradient(ellipse_55%_60%_at_50%_-10%,rgba(255,90,36,0.07),transparent_70%)]"
      />
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[250px] border-r border-white/[0.06] lg:block">
        <Sidebar
          user={user}
          workspace={workspace}
          workspaces={workspaces}
          projects={projects}
        />
      </aside>

      {/* Mobile slide-over */}
      <AnimatePresence>
        {mobileNavOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <motion.div
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileNavOpen(false)}
            />
            <motion.div
              className="absolute inset-y-0 left-0 w-[270px] border-r border-white/[0.08] bg-ink-900"
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", stiffness: 420, damping: 40 }}
            >
              <Sidebar
                user={user}
                workspace={workspace}
                workspaces={workspaces}
                projects={projects}
                onNavigate={() => setMobileNavOpen(false)}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-white/[0.06] bg-ink-950/85 px-4 py-3 backdrop-blur-md lg:hidden">
        <button
          onClick={() => setMobileNavOpen(true)}
          className="rounded-lg border border-white/[0.08] p-2 text-ink-300"
          aria-label="Open menu"
        >
          <Menu className="h-4 w-4" />
        </button>
        <Logo size={22} />
        <button
          onClick={() => setPaletteOpen(true)}
          className="ml-auto flex items-center gap-2 rounded-lg border border-white/[0.08] px-2.5 py-1.5 text-xs text-ink-400"
        >
          Search <span className="kbd">⌘K</span>
        </button>
      </header>

      {/* Content */}
      <main className="lg:pl-[250px]">
        <div className="mx-auto w-full max-w-[1180px] px-4 pb-20 sm:px-8">
          {children}
        </div>
      </main>

      <CommandPalette />
      <NewProjectModal />
    </div>
  );
}
