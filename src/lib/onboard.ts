import { eq } from "drizzle-orm";
import { db } from "@/db";
import { boardColumns, labels, projects, tasks } from "@/db/schema";
import { logActivity } from "@/lib/activity";
import { DEFAULT_COLUMNS, LABEL_PRESETS } from "@/lib/constants";

/**
 * Gives every brand-new account a friendly, fully-working sample project
 * so the app never feels empty on first sign-in.
 */
export async function createStarterProject(workspaceId: string, userId: string) {
  const [project] = await db
    .insert(projects)
    .values({
      workspaceId,
      name: "Getting Started",
      key: "GS",
      color: "#FF5A24",
      description: "A short guided tour of the basics.",
      createdById: userId,
    })
    .returning();

  const cols = await db
    .insert(boardColumns)
    .values(
      DEFAULT_COLUMNS.map((name, i) => ({
        projectId: project.id,
        name,
        sortOrder: i,
      })),
    )
    .returning();

  await db
    .insert(labels)
    .values(
      LABEL_PRESETS.map((l) => ({ projectId: project.id, ...l })),
    );

  const byName = Object.fromEntries(cols.map((c) => [c.name, c.id]));
  const welcome: {
    title: string;
    column: string;
    priority: "none" | "low" | "medium" | "high" | "urgent";
    description?: string;
    done?: boolean;
  }[] = [
    {
      title: "Press ⌘K to open the command palette",
      column: "To Do",
      priority: "high",
      description:
        "Jump to any task or project from anywhere — just start typing to search.",
    },
    {
      title: "Drag this card into another column",
      column: "To Do",
      priority: "medium",
    },
    {
      title: "Open a task and leave a comment",
      column: "In Progress",
      priority: "low",
      description:
        "Click any card to open the full task view — description, labels, assignee, due date and a comment thread.",
    },
    {
      title: "Invite your team from the Members page",
      column: "Backlog",
      priority: "none",
    },
    {
      title: "Create your first real project",
      column: "Backlog",
      priority: "none",
    },
    {
      title: "Explore the dashboard analytics",
      column: "Done",
      priority: "none",
      done: true,
    },
  ];

  const byColumnCount: Record<string, number> = {};
  await db.insert(tasks).values(
    welcome.map((w, i) => {
      const columnId = byName[w.column];
      byColumnCount[w.column] = (byColumnCount[w.column] ?? 0) + 1;
      return {
        projectId: project.id,
        columnId,
        number: i + 1,
        title: w.title,
        description: w.description ?? null,
        priority: w.priority,
        position: byColumnCount[w.column] * 100,
        creatorId: userId,
        assigneeId: userId,
        completedAt: w.done ? new Date() : null,
      };
    }),
  );

  await db
    .update(projects)
    .set({ taskCounter: welcome.length })
    .where(eq(projects.id, project.id));

  await logActivity({
    workspaceId,
    projectId: project.id,
    userId,
    action: "project.created",
    meta: { name: project.name },
  });

  return project;
}
