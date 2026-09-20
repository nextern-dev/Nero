import { ArrowUpRight, CalendarClock, FolderKanban, Plus } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";
import { AvatarStack } from "@/components/avatar";
import { NewProjectButton } from "@/components/new-project-button";
import { EmptyState, Progress } from "@/components/ui";
import { getProjectsWithProgress } from "@/lib/queries";
import { requireWorkspace } from "@/lib/session";
import { cn, DUE_TONE_CLASSES, dueTone, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Projects" };

export default async function ProjectsPage() {
  const { workspace } = await requireWorkspace();
  const projects = await getProjectsWithProgress(workspace.id);

  return (
    <div className="pt-8">
      <header className="animate-mount mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-[32px] font-medium tracking-tight text-ink-50 italic">
            Projects
          </h1>
          <p className="mt-1 text-sm text-ink-400">
            {projects.length} project{projects.length === 1 ? "" : "s"} in{" "}
            {workspace.name}
          </p>
        </div>
        <NewProjectButton />
      </header>

      {projects.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title="No projects yet"
          body="Projects group tasks into kanban boards with their own labels, members and analytics."
          action={<NewProjectButton label="Create your first project" />}
        />
      ) : (
        <div className="grid gap-4 pb-10 sm:grid-cols-2 xl:grid-cols-3">
          {projects.map(({ project, total, done, contributors }, i) => {
            const tone = dueTone(project.dueDate);
            return (
              <div
                key={project.id}
                className="animate-mount"
                style={{ animationDelay: `${140 + i * 70}ms` }}
              >
              <Link
                href={`/projects/${project.id}`}
                className="card group relative block h-full overflow-hidden p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-white/[0.14]"
              >
                <div
                  className="pointer-events-none absolute inset-x-0 top-0 h-[3px]"
                  style={{
                    background: `linear-gradient(90deg, ${project.color}, transparent 70%)`,
                  }}
                />
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-mono text-xs font-bold"
                      style={{
                        backgroundColor: `${project.color}1f`,
                        color: project.color,
                      }}
                    >
                      {project.key.slice(0, 2)}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-[15px] font-semibold text-ink-50 group-hover:text-brand-100">
                        {project.name}
                      </p>
                      <p className="font-mono text-[10.5px] text-ink-500">
                        {project.key}
                      </p>
                    </div>
                  </div>
                  <ArrowUpRight className="h-4 w-4 shrink-0 text-ink-600 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-brand-400" />
                </div>

                <p className="mt-3 line-clamp-2 min-h-[34px] text-[12.5px] leading-relaxed text-ink-400">
                  {project.description || "No description yet."}
                </p>

                <div className="mt-4">
                  <div className="mb-1.5 flex items-center justify-between text-[11px] text-ink-500">
                    <span>Progress</span>
                    <span className="tabular-nums">
                      {total ? Math.round((done / total) * 100) : 0}%
                    </span>
                  </div>
                  <Progress
                    value={total ? (done / total) * 100 : 0}
                    color={project.color}
                  />
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-white/[0.05] pt-3.5">
                  {contributors.length ? (
                    <AvatarStack users={contributors} size={22} />
                  ) : (
                    <span className="text-[11px] text-ink-600">Unassigned</span>
                  )}
                  <div className="flex items-center gap-3 text-[11px] text-ink-500">
                    <span className="tabular-nums">{done}/{total} done</span>
                    {project.dueDate && (
                      <span
                        className={cn(
                          "flex items-center gap-1",
                          DUE_TONE_CLASSES[tone ?? "later"],
                        )}
                      >
                        <CalendarClock className="h-3 w-3" />
                        {formatDate(project.dueDate)}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
              </div>
            );
          })}

          <NewProjectCard />
        </div>
      )}
    </div>
  );
}

function NewProjectCard() {
  return (
    <div className="flex min-h-[210px] items-center justify-center rounded-2xl border border-dashed border-white/[0.08] transition-colors hover:border-brand-500/40">
      <NewProjectButton
        variant="ghost"
        label={
          <span className="flex flex-col items-center gap-3 text-ink-400">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.08] bg-ink-800">
              <Plus className="h-4 w-4 text-brand-400" />
            </span>
            <span className="text-[13px]">New project</span>
          </span>
        }
      />
    </div>
  );
}
