"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  ChevronsUpDown,
  FolderKanban,
  LayoutDashboard,
  LogOut,
  Plus,
  Search,
  Settings,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { logout } from "@/actions/auth";
import { switchWorkspace } from "@/actions/workspace";
import { Avatar } from "@/components/avatar";
import { Logo, LogoMark } from "@/components/logo";
import type { Role } from "@/db/schema";
import type { UserDTO } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useUI } from "@/store/ui";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/projects", label: "Projects", icon: FolderKanban },
  { href: "/members", label: "Members", icon: Users },
  { href: "/activity", label: "Activity", icon: Activity },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar({
  user,
  workspace,
  workspaces,
  projects,
  onNavigate,
}: {
  user: UserDTO;
  workspace: { id: string; name: string };
  workspaces: { id: string; name: string; role: Role }[];
  projects: { id: string; name: string; key: string; color: string }[];
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { setPaletteOpen, setNewProjectOpen } = useUI();
  const [wsOpen, setWsOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const go = (href: string) => {
    router.push(href);
    onNavigate?.();
  };

  return (
    <div className="flex h-full w-full flex-col bg-ink-900/60">
      {/* Workspace switcher */}
      <div className="relative px-3 pt-4 pb-2">
        <button
          onClick={() => setWsOpen((v) => !v)}
          className="flex w-full items-center gap-2.5 rounded-xl border border-white/[0.06] bg-white/[0.02] px-2.5 py-2 text-left transition-colors hover:border-white/[0.1] hover:bg-white/[0.04]"
        >
          <LogoMark size={26} />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[13.5px] font-semibold tracking-tight text-ink-50">
              {workspace.name}
            </span>
            <span className="block text-[10.5px] text-ink-500">
              Nero workspace
            </span>
          </span>
          <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 text-ink-500" />
        </button>

        <AnimatePresence>
          {wsOpen && (
            <>
              <div
                className="fixed inset-0 z-30"
                onClick={() => setWsOpen(false)}
              />
              <motion.div
                initial={{ opacity: 0, y: -4, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -4, scale: 0.98 }}
                transition={{ duration: 0.14 }}
                className="absolute top-full right-3 left-3 z-40 mt-1 overflow-hidden rounded-xl border border-white/[0.08] bg-ink-850 shadow-2xl"
              >
                <p className="px-3 pt-2.5 pb-1 text-[10.5px] font-medium tracking-wider text-ink-500 uppercase">
                  Workspaces
                </p>
                {workspaces.map((w) => (
                  <button
                    key={w.id}
                    disabled={pending}
                    onClick={() => {
                      setWsOpen(false);
                      if (w.id === workspace.id) return;
                      startTransition(async () => {
                        const res = await switchWorkspace(w.id);
                        if (res.ok) {
                          router.refresh();
                          onNavigate?.();
                        } else toast.error(res.error);
                      });
                    }}
                    className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-[13px] text-ink-200 transition-colors hover:bg-white/[0.05]"
                  >
                    <span
                      className={cn(
                        "h-1.5 w-1.5 rounded-full",
                        w.id === workspace.id ? "bg-brand-400" : "bg-ink-600",
                      )}
                    />
                    <span className="flex-1 truncate">{w.name}</span>
                    <span className="text-[10px] text-ink-500">{w.role}</span>
                  </button>
                ))}
                <div className="h-2" />
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      {/* Search */}
      <div className="px-3 pb-2">
        <button
          onClick={() => setPaletteOpen(true)}
          className="flex w-full items-center gap-2 rounded-lg border border-white/[0.06] bg-ink-850 px-2.5 py-[7px] text-[13px] text-ink-500 transition-colors hover:border-white/[0.1] hover:text-ink-300"
        >
          <Search className="h-3.5 w-3.5" />
          <span className="flex-1 text-left">Search…</span>
          <span className="kbd">⌘K</span>
        </button>
      </div>

      {/* Nav */}
      <nav className="space-y-0.5 px-3 pt-1">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active =
            pathname === href ||
            (href !== "/dashboard" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              onClick={onNavigate}
              className={cn(
                "group relative flex items-center gap-2.5 rounded-lg px-2.5 py-[7px] text-[13px] transition-all",
                active
                  ? "bg-white/[0.06] font-medium text-ink-50"
                  : "text-ink-400 hover:bg-white/[0.03] hover:text-ink-100",
              )}
            >
              {active && (
                <motion.span
                  layoutId="sidebar-nav-indicator"
                  className="absolute top-1/2 left-0 h-4 w-[2.5px] -translate-y-1/2 rounded-full bg-gradient-to-b from-brand-300 to-brand-600 shadow-[0_0_12px_rgba(255,90,36,0.6)]"
                  transition={{ type: "spring", stiffness: 480, damping: 36 }}
                />
              )}
              <Icon
                className={cn(
                  "h-4 w-4 transition-colors",
                  active
                    ? "text-brand-400"
                    : "text-ink-500 group-hover:text-ink-300",
                )}
              />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Projects */}
      <div className="mt-5 flex min-h-0 flex-1 flex-col px-3">
        <div className="mb-1 flex items-center justify-between px-2.5">
          <span className="text-[10.5px] font-medium tracking-wider text-ink-500 uppercase">
            Projects
          </span>
          <button
            onClick={() => setNewProjectOpen(true)}
            className="rounded-md p-1 text-ink-500 transition-colors hover:bg-white/[0.05] hover:text-brand-400"
            aria-label="New project"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="min-h-0 flex-1 space-y-0.5 overflow-y-auto pb-2">
          {projects.length === 0 && (
            <p className="px-2.5 py-2 text-xs text-ink-500">
              No projects yet — create your first one.
            </p>
          )}
          {projects.map((p) => {
            const active = pathname.startsWith(`/projects/${p.id}`);
            return (
              <Link
                key={p.id}
                href={`/projects/${p.id}`}
                onClick={onNavigate}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg px-2.5 py-[6px] text-[13px] transition-all",
                  active
                    ? "bg-white/[0.06] font-medium text-ink-50"
                    : "text-ink-400 hover:bg-white/[0.03] hover:text-ink-100",
                )}
              >
                <span
                  className="h-2 w-2 shrink-0 rounded-[3px]"
                  style={{ backgroundColor: p.color }}
                />
                <span className="truncate">{p.name}</span>
                <span className="ml-auto font-mono text-[10px] text-ink-600">
                  {p.key}
                </span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* User */}
      <div className="relative border-t border-white/[0.06] p-3">
        <AnimatePresence>
          {userOpen && (
            <>
              <div
                className="fixed inset-0 z-30"
                onClick={() => setUserOpen(false)}
              />
              <motion.div
                initial={{ opacity: 0, y: 4, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 4, scale: 0.98 }}
                transition={{ duration: 0.14 }}
                className="absolute right-3 bottom-full left-3 z-40 mb-1 overflow-hidden rounded-xl border border-white/[0.08] bg-ink-850 shadow-2xl"
              >
                <div className="border-b border-white/[0.06] px-3 py-2.5">
                  <p className="truncate text-[13px] font-medium text-ink-50">
                    {user.name}
                  </p>
                  <p className="truncate text-[11px] text-ink-500">
                    {user.email}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setUserOpen(false);
                    go("/settings");
                  }}
                  className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-[13px] text-ink-200 transition-colors hover:bg-white/[0.05]"
                >
                  <Settings className="h-3.5 w-3.5 text-ink-500" />
                  Settings
                </button>
                <button
                  onClick={() => startTransition(() => logout())}
                  className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-[13px] text-rose-300 transition-colors hover:bg-rose-500/10"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Sign out
                </button>
                <div className="h-1.5" />
              </motion.div>
            </>
          )}
        </AnimatePresence>

        <button
          onClick={() => setUserOpen((v) => !v)}
          className="flex w-full items-center gap-2.5 rounded-xl px-2 py-1.5 text-left transition-colors hover:bg-white/[0.04]"
        >
          <Avatar user={user} size={28} />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[13px] font-medium text-ink-100">
              {user.name}
            </span>
            <span className="block truncate text-[11px] text-ink-500">
              {user.email}
            </span>
          </span>
          <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 text-ink-500" />
        </button>
      </div>
    </div>
  );
}

export function SidebarLogo() {
  return <Logo size={22} />;
}
