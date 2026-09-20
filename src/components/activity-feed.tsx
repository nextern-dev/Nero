"use client";

import {
  ArrowRightLeft,
  CheckCircle2,
  FolderPlus,
  MessageSquare,
  PlusCircle,
  RotateCcw,
  Trash2,
  UserPlus,
  Zap,
} from "lucide-react";
import type { ReactNode } from "react";
import { Avatar } from "@/components/avatar";
import type { ActivityDTO } from "@/lib/types";
import { timeAgo } from "@/lib/utils";
import { format, isToday, isYesterday } from "date-fns";

const ICONS: Record<string, { icon: typeof Zap; tone: string }> = {
  "task.created": { icon: PlusCircle, tone: "text-sky-300 bg-sky-400/10" },
  "task.completed": {
    icon: CheckCircle2,
    tone: "text-emerald-300 bg-emerald-400/10",
  },
  "task.reopened": { icon: RotateCcw, tone: "text-sky-300 bg-sky-400/10" },
  "task.moved": { icon: ArrowRightLeft, tone: "text-ink-300 bg-white/[0.06]" },
  "task.deleted": { icon: Trash2, tone: "text-rose-300 bg-rose-400/10" },
  "comment.added": {
    icon: MessageSquare,
    tone: "text-violet-300 bg-violet-400/10",
  },
  "project.created": {
    icon: FolderPlus,
    tone: "text-brand-300 bg-brand-400/10",
  },
  "member.joined": { icon: UserPlus, tone: "text-brand-300 bg-brand-400/10" },
};

function KeyChip({ children }: { children: ReactNode }) {
  return (
    <span className="mx-0.5 inline-flex rounded-md border border-brand-500/25 bg-brand-500/10 px-1.5 py-px font-mono text-[10.5px] font-medium text-brand-300">
      {children}
    </span>
  );
}

function describe(a: ActivityDTO): ReactNode {
  let meta: Record<string, string> = {};
  try {
    meta = a.meta ? JSON.parse(a.meta) : {};
  } catch {
    /* noop */
  }
  switch (a.action) {
    case "task.created":
      return (
        <>
          created <KeyChip>{meta.key}</KeyChip>
          <span className="text-ink-400"> · {meta.title}</span>
        </>
      );
    case "task.completed":
      return (
        <>
          completed <KeyChip>{meta.key}</KeyChip>
          <span className="text-ink-400"> · {meta.title}</span>
        </>
      );
    case "task.reopened":
      return (
        <>
          reopened <KeyChip>{meta.key}</KeyChip>
          <span className="text-ink-400"> · {meta.title}</span>
        </>
      );
    case "task.moved":
      return (
        <>
          moved <KeyChip>{meta.key}</KeyChip> to{" "}
          <span className="text-ink-100">{meta.to}</span>
        </>
      );
    case "task.deleted":
      return (
        <>
          deleted <KeyChip>{meta.key}</KeyChip>
          <span className="text-ink-400"> · {meta.title}</span>
        </>
      );
    case "comment.added":
      return (
        <>
          commented on <KeyChip>{meta.key}</KeyChip>
          {meta.excerpt && (
            <span className="text-ink-400"> — “{meta.excerpt}”</span>
          )}
        </>
      );
    case "project.created":
      return (
        <>
          created project{" "}
          <span className="font-medium text-ink-100">{meta.name}</span>
        </>
      );
    case "member.joined":
      return (
        <>
          added <span className="font-medium text-ink-100">{meta.name}</span> to
          the workspace
        </>
      );
    default:
      return <span className="text-ink-400">{a.action}</span>;
  }
}

function Row({ item }: { item: ActivityDTO }) {
  const conf = ICONS[item.action] ?? { icon: Zap, tone: "text-ink-300 bg-white/[0.06]" };
  const Icon = conf.icon;
  return (
    <div className="flex items-start gap-3 px-5 py-3.5">
      <span
        className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${conf.tone}`}
      >
        <Icon className="h-3.5 w-3.5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[13px] leading-snug text-ink-200">
          <span className="font-medium text-ink-50">
            {item.user?.name ?? "Someone"}
          </span>{" "}
          {describe(item)}
        </p>
        <p className="mt-0.5 text-[11px] text-ink-500">
          {timeAgo(item.createdAt)}
          {item.project && (
            <>
              {" "}
              ·{" "}
              <span
                className="inline-block h-1.5 w-1.5 rounded-full align-middle"
                style={{ backgroundColor: item.project.color }}
              />{" "}
              {item.project.name}
            </>
          )}
        </p>
      </div>
      {item.user && <Avatar user={item.user} size={22} className="mt-1" />}
    </div>
  );
}

export function ActivityFeed({ items }: { items: ActivityDTO[] }) {
  return (
    <div className="divide-y divide-white/[0.05]">
      {items.map((item) => (
        <Row key={item.id} item={item} />
      ))}
    </div>
  );
}

export function ActivityTimeline({ items }: { items: ActivityDTO[] }) {
  const groups = new Map<string, ActivityDTO[]>();
  for (const item of items) {
    const day = format(new Date(item.createdAt), "yyyy-MM-dd");
    groups.set(day, [...(groups.get(day) ?? []), item]);
  }

  return (
    <div className="space-y-8">
      {[...groups.entries()].map(([day, rows], gi) => {
        const d = new Date(day);
        const label = isToday(d)
          ? "Today"
          : isYesterday(d)
            ? "Yesterday"
            : format(d, "EEEE, MMM d");
        return (
          <section
            key={day}
            className="animate-mount"
            style={{ animationDelay: `${gi * 90}ms` }}
          >
            <div className="mb-2 flex items-center gap-3 px-1">
              <span className="text-xs font-semibold tracking-wide text-ink-300 uppercase">
                {label}
              </span>
              <span className="h-px flex-1 bg-white/[0.06]" />
              <span className="text-[11px] text-ink-500">
                {rows.length} event{rows.length === 1 ? "" : "s"}
              </span>
            </div>
            <div className="card divide-y divide-white/[0.05]">
              {rows.map((item) => (
                <Row key={item.id} item={item} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
