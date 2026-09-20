"use client";

import { addDays, format, startOfDay, subDays } from "date-fns";
import {
  ArrowUpRight,
  CalendarClock,
  CheckCircle2,
  CircleCheckBig,
  FolderKanban,
  Flame,
  Inbox,
  Layers,
  Plus,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { updateTask } from "@/actions/tasks";
import { ActivityFeed } from "@/components/activity-feed";
import { AreaChart, CountUp, Donut } from "@/components/charts";
import { PriorityIcon } from "@/components/priority";
import { Button, Card, EmptyState, Progress } from "@/components/ui";
import { columnAccent } from "@/lib/constants";
import type { MyTask, ProjectWithProgress } from "@/lib/queries";
import type { ActivityDTO } from "@/lib/types";
import { cn, DUE_TONE_CLASSES, dueTone, formatDate } from "@/lib/utils";
import { useUI } from "@/store/ui";

function daypart() {
  const h = new Date().getHours();
  if (h < 5) return "night";
  if (h < 12) return "morning";
  if (h < 18) return "afternoon";
  return "evening";
}

export function DashboardView({
  firstName,
  workspaceName,
  stats,
  myTasks,
  projects,
  activities,
}: {
  firstName: string;
  workspaceName: string;
  stats: {
    open: number;
    doneThisWeek: number;
    overdue: number;
    projectCount: number;
    completedDates: string[];
    statusBreakdown: { name: string; count: number }[];
  };
  myTasks: MyTask[];
  projects: ProjectWithProgress[];
  activities: ActivityDTO[];
}) {
  const { setNewProjectOpen } = useUI();

  const chartPoints = useMemo(() => {
    const counts = new Map<string, number>();
    for (const iso of stats.completedDates) {
      const key = format(startOfDay(new Date(iso)), "yyyy-MM-dd");
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    const today = startOfDay(new Date());
    return Array.from({ length: 14 }, (_, i) => {
      const d = addDays(subDays(today, 13), i);
      const key = format(d, "yyyy-MM-dd");
      return { label: format(d, "MMM d"), value: counts.get(key) ?? 0 };
    });
  }, [stats.completedDates]);

  const totalDone = chartPoints.reduce((s, p) => s + p.value, 0);

  const statCards = [
    {
      label: "Open tasks",
      value: stats.open,
      icon: Layers,
      tone: "text-sky-300 bg-sky-400/10",
      sub: "across all projects",
    },
    {
      label: "Completed",
      value: stats.doneThisWeek,
      icon: CircleCheckBig,
      tone: "text-emerald-300 bg-emerald-400/10",
      sub: "in the last 7 days",
    },
    {
      label: "Overdue",
      value: stats.overdue,
      icon: Flame,
      tone: "text-rose-300 bg-rose-400/10",
      sub: "need attention",
    },
    {
      label: "Projects",
      value: stats.projectCount,
      icon: FolderKanban,
      tone: "text-brand-300 bg-brand-400/10",
      sub: "in this workspace",
    },
  ];

  return (
    <div className="pt-8">
      {/* Header */}
      <header className="animate-mount mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[13px] text-ink-400">
            {format(new Date(), "EEEE, MMMM d")}
          </p>
          <h1 className="mt-1 font-display text-[34px] font-medium tracking-tight text-ink-50 italic">
            Good {daypart()},{" "}
            <span className="text-gradient-brand">{firstName}</span>.
          </h1>
          <p className="mt-1 text-sm text-ink-400">
            Here&apos;s what&apos;s moving in{" "}
            <span className="text-ink-200">{workspaceName}</span> today.
          </p>
        </div>
        <Button variant="secondary" onClick={() => setNewProjectOpen(true)}>
          <Plus className="h-4 w-4" /> New project
        </Button>
      </header>

      {/* Stats */}
      <div className="mb-4 grid grid-cols-2 gap-3 xl:grid-cols-4">
        {statCards.map(({ label, value, icon: Icon, tone, sub }, i) => (
          <div
            key={label}
            className="animate-mount"
            style={{ animationDelay: `${120 + i * 70}ms` }}
          >
            <Card className="h-full p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[12px] font-medium text-ink-400">{label}</p>
                <p className="mt-2 text-[32px] leading-none font-semibold tracking-tight text-ink-50">
                  <CountUp to={value} />
                </p>
              </div>
              <span
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-xl",
                  tone,
                )}
              >
                <Icon className="h-4.5 w-4.5" />
              </span>
            </div>
            <p className="mt-3 text-[11.5px] text-ink-500">{sub}</p>
            </Card>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div
        className="animate-mount mb-4 grid gap-4 lg:grid-cols-3"
        style={{ animationDelay: "380ms" }}
      >
        <Card className="p-6 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-[15px] font-semibold tracking-tight text-ink-50">
                Throughput
              </h2>
              <p className="text-xs text-ink-500">Tasks completed per day</p>
            </div>
            <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-[11px] font-medium text-emerald-300">
              {totalDone} in 14 days
            </span>
          </div>
          <AreaChart points={chartPoints} />
        </Card>

        <Card className="flex flex-col items-center justify-center gap-5 p-6">
          <div className="w-full">
            <h2 className="text-[15px] font-semibold tracking-tight text-ink-50">
              Status breakdown
            </h2>
            <p className="text-xs text-ink-500">Open tasks by column</p>
          </div>
          {stats.statusBreakdown.length ? (
            <>
              <Donut
                centerLabel="open tasks"
                segments={stats.statusBreakdown.map((s, i) => ({
                  label: s.name,
                  value: s.count,
                  color: columnAccent(s.name, i),
                }))}
              />
              <div className="w-full space-y-1.5">
                {stats.statusBreakdown.map((s, i) => (
                  <div
                    key={s.name}
                    className="flex items-center gap-2 text-[12.5px]"
                  >
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: columnAccent(s.name, i) }}
                    />
                    <span className="flex-1 text-ink-300">{s.name}</span>
                    <span className="font-medium text-ink-100 tabular-nums">
                      {s.count}
                    </span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="py-10 text-center text-[13px] text-ink-500">
              No open tasks — everything is done.
            </p>
          )}
        </Card>
      </div>

      {/* My tasks + activity */}
      <div
        className="animate-mount mb-4 grid gap-4 lg:grid-cols-3"
        style={{ animationDelay: "460ms" }}
      >
        <Card className="overflow-hidden lg:col-span-2">
          <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
            <div>
              <h2 className="text-[15px] font-semibold tracking-tight text-ink-50">
                My open tasks
              </h2>
              <p className="text-xs text-ink-500">
                Assigned to you, sorted by due date
              </p>
            </div>
            <span className="rounded-full border border-white/[0.08] px-2.5 py-1 text-[11px] text-ink-400 tabular-nums">
              {myTasks.length}
            </span>
          </div>
          <MyTasksList tasks={myTasks} />
        </Card>

        <Card className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
            <h2 className="text-[15px] font-semibold tracking-tight text-ink-50">
              Recent activity
            </h2>
            <Link
              href="/activity"
              className="flex items-center gap-1 text-[11.5px] font-medium text-brand-400 hover:text-brand-300"
            >
              View all <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
          {activities.length ? (
            <ActivityFeed items={activities.slice(0, 8)} />
          ) : (
            <p className="px-5 py-10 text-center text-[13px] text-ink-500">
              Nothing here yet — activity appears as your team works.
            </p>
          )}
        </Card>
      </div>

      {/* Projects */}
      <div className="animate-mount" style={{ animationDelay: "540ms" }}>
        <div className="mb-3 flex items-center justify-between px-1">
          <h2 className="text-[15px] font-semibold tracking-tight text-ink-50">
            Projects
          </h2>
          <Link
            href="/projects"
            className="flex items-center gap-1 text-[11.5px] font-medium text-brand-400 hover:text-brand-300"
          >
            All projects <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>
        {projects.length === 0 ? (
          <EmptyState
            icon={FolderKanban}
            title="No projects yet"
            body="Create a project to get a kanban board, labels and analytics for your team."
            action={
              <Button size="sm" onClick={() => setNewProjectOpen(true)}>
                <Plus className="h-3.5 w-3.5" /> New project
              </Button>
            }
          />
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {projects.map(({ project, total, done }) => (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className="card group p-5 transition-all hover:border-white/[0.14]"
              >
                <div className="mb-3 flex items-center gap-2.5">
                  <span
                    className="h-2.5 w-2.5 rounded-[4px]"
                    style={{ backgroundColor: project.color }}
                  />
                  <span className="truncate text-[14px] font-medium text-ink-50 group-hover:text-brand-200">
                    {project.name}
                  </span>
                  <span className="ml-auto font-mono text-[10.5px] text-ink-500">
                    {project.key}
                  </span>
                </div>
                <Progress
                  value={total ? (done / total) * 100 : 0}
                  color={project.color}
                />
                <div className="mt-3 flex items-center justify-between text-[11.5px] text-ink-500">
                  <span>
                    {done}/{total} done
                  </span>
                  {project.dueDate && (
                    <span
                      className={cn(
                        "flex items-center gap-1",
                        DUE_TONE_CLASSES[dueTone(project.dueDate) ?? "later"],
                      )}
                    >
                      <CalendarClock className="h-3 w-3" />
                      {formatDate(project.dueDate)}
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function MyTasksList({ tasks }: { tasks: MyTask[] }) {
  const router = useRouter();
  const [doneIds, setDoneIds] = useState<Set<string>>(new Set());
  const [, startTransition] = useTransition();

  const complete = (id: string) => {
    setDoneIds((prev) => new Set(prev).add(id));
    startTransition(async () => {
      const res = await updateTask({ taskId: id, completed: true });
      if (!res.ok) {
        toast.error(res.error);
        setDoneIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      } else {
        toast.success("Task completed");
        router.refresh();
      }
    });
  };

  const visible = tasks.filter((t) => !doneIds.has(t.id));

  if (!visible.length) {
    return (
      <div className="flex flex-col items-center gap-3 px-5 py-14 text-center">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/[0.06] bg-ink-800 text-emerald-300">
          <Inbox className="h-5 w-5" />
        </span>
        <p className="text-sm font-medium text-ink-100">Inbox zero</p>
        <p className="max-w-[240px] text-[12.5px] text-ink-500">
          Nothing assigned to you right now. Grab something from the backlog.
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-white/[0.05]">
      {visible.map((t) => {
        const tone = dueTone(t.dueDate);
        return (
          <div
            key={t.id}
            className="group flex items-center gap-3 px-5 py-3 transition-colors hover:bg-white/[0.02]"
          >
            <button
              onClick={() => complete(t.id)}
              className="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border border-ink-500 text-transparent transition-all hover:border-emerald-400 hover:bg-emerald-400/15 hover:text-emerald-300"
              aria-label="Complete task"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
            </button>
            <Link
              href={`/projects/${t.projectId}?task=${t.id}`}
              className="min-w-0 flex-1"
            >
              <p className="truncate text-[13.5px] text-ink-100 group-hover:text-white">
                {t.title}
              </p>
            </Link>
            <PriorityIcon priority={t.priority} />
            <span
              className="rounded-md border border-white/[0.07] px-1.5 py-0.5 font-mono text-[10px]"
              style={{ color: t.projectColor }}
            >
              {t.projectKey}-{t.number}
            </span>
            {t.dueDate && (
              <span
                className={cn(
                  "hidden items-center gap-1 text-[11px] sm:flex",
                  DUE_TONE_CLASSES[tone ?? "later"],
                )}
              >
                <CalendarClock className="h-3 w-3" />
                {formatDate(t.dueDate)}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
