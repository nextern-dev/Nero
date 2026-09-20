import "dotenv/config";
import bcrypt from "bcryptjs";
import { addDays, subDays, subHours } from "date-fns";
import { eq } from "drizzle-orm";
import { db } from "../src/db";
import {
  activities,
  boardColumns,
  comments,
  labels,
  projects,
  taskLabels,
  tasks,
  users,
  workspaceMembers,
  workspaces,
  type Priority,
} from "../src/db/schema";
import { DEFAULT_COLUMNS, LABEL_PRESETS } from "../src/lib/constants";

/**
 * Seed a rich demo workspace for Nero.
 * Idempotent: exits early if the demo account already exists.
 *
 *   npx tsx scripts/seed.ts
 */
async function main() {
  console.log("🌱 Seeding Nero demo workspace…");

  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, "demo@nero.dev"))
    .limit(1);
  if (existing.length) {
    console.log("⚠️  demo@nero.dev already exists — skipping seed.");
    process.exit(0);
  }

  const passwordHash = await bcrypt.hash("demo1234", 10);

  /* ------------------------------ users ------------------------------ */
  const PEOPLE = [
    { name: "Demo User", email: "demo@nero.dev", color: "#FF5A24", role: "owner" as const },
    { name: "Ada Chen", email: "ada@nero.dev", color: "#5EA2FF", role: "admin" as const },
    { name: "Kaito Mori", email: "kaito@nero.dev", color: "#34D399", role: "member" as const },
    { name: "Mira Sol", email: "mira@nero.dev", color: "#F472B6", role: "member" as const },
    { name: "Felix Bram", email: "felix@nero.dev", color: "#A78BFA", role: "member" as const },
    { name: "June Okafor", email: "june@nero.dev", color: "#FF7A45", role: "member" as const },
  ];

  const insertedUsers = await db
    .insert(users)
    .values(PEOPLE.map((p) => ({ ...p, passwordHash })))
    .returning();
  const byEmail = Object.fromEntries(insertedUsers.map((u) => [u.email, u]));

  /* ---------------------------- workspace ---------------------------- */
  const [workspace] = await db
    .insert(workspaces)
    .values({ name: "Nero Labs", slug: "nero-labs" })
    .returning();

  await db.insert(workspaceMembers).values(
    insertedUsers.map((u) => ({
      workspaceId: workspace.id,
      userId: u.id,
      role: PEOPLE.find((p) => p.email === u.email)!.role,
    })),
  );

  const log = async (entry: {
    projectId?: string;
    taskId?: string;
    userId?: string;
    action: string;
    meta?: Record<string, unknown>;
    at: Date;
  }) => {
    await db.insert(activities).values({
      workspaceId: workspace.id,
      projectId: entry.projectId ?? null,
      taskId: entry.taskId ?? null,
      userId: entry.userId ?? null,
      action: entry.action,
      meta: entry.meta ? JSON.stringify(entry.meta) : null,
      createdAt: entry.at,
    });
  };

  for (const [i, u] of insertedUsers.entries()) {
    if (u.email === "demo@nero.dev") continue;
    await log({
      userId: byEmail["demo@nero.dev"].id,
      action: "member.joined",
      meta: { name: u.name },
      at: subDays(new Date(), 14 - i),
    });
  }

  /* ---------------------------- projects ----------------------------- */
  type TaskSeed = {
    title: string;
    column: string;
    priority: Priority;
    assignee?: string; // email
    dueIn?: number; // days from now (negative = overdue)
    doneAgo?: number; // days since completion
    labels?: string[];
    description?: string;
    comments?: { by: string; body: string; ago?: number }[];
    createdAgo?: number;
  };

  type ProjectSeed = {
    name: string;
    key: string;
    color: string;
    description: string;
    dueIn?: number;
    tasks: TaskSeed[];
  };

  const D = "demo@nero.dev";
  const A = "ada@nero.dev";
  const K = "kaito@nero.dev";
  const M = "mira@nero.dev";
  const F = "felix@nero.dev";
  const J = "june@nero.dev";

  const PROJECTS: ProjectSeed[] = [
    {
      name: "Nero Web App",
      key: "NER",
      color: "#FF5A24",
      description: "The flagship board experience — fast, dark, keyboard-first.",
      dueIn: 21,
      tasks: [
        {
          title: "Kanban drag physics — spring easing & drop shadows",
          column: "In Progress",
          priority: "urgent",
          assignee: D,
          dueIn: 1,
          labels: ["Improvement"],
          description:
            "Cards should lift with a 1.5° rotation, cast a deep shadow and settle with a spring. No jank at 60fps.",
          comments: [
            { by: A, body: "The rotation is a nice touch. Keep it subtle — 1.5° max.", ago: 1 },
            { by: D, body: "Agreed. Also lowered the overlay opacity to 0.95 so the column peeks through.", ago: 0 },
          ],
          createdAgo: 4,
        },
        {
          title: "Optimistic task mutations with rollback on error",
          column: "In Progress",
          priority: "high",
          assignee: K,
          labels: ["Feature"],
          description: "Every mutation applies instantly; server errors toast and resync from the database.",
          createdAgo: 6,
        },
        {
          title: "Command palette ranking v2",
          column: "In Progress",
          priority: "medium",
          assignee: D,
          labels: ["Feature"],
          comments: [{ by: M, body: "Can we weight recent projects higher?", ago: 2 }],
          createdAgo: 7,
        },
        {
          title: "Ship /api/search endpoint with fuzzy weights",
          column: "To Do",
          priority: "high",
          assignee: A,
          dueIn: 3,
          labels: ["Feature"],
          description: "Tasks by title, projects by name or key. Limit 6+4, debounced at 180ms on the client.",
          comments: [{ by: D, body: "Please keep it scoped to the active workspace.", ago: 3 }],
          createdAgo: 9,
        },
        {
          title: "Board virtualization for 1k+ task projects",
          column: "To Do",
          priority: "medium",
          assignee: K,
          dueIn: 6,
          createdAgo: 8,
        },
        {
          title: "Empty states & skeleton loaders",
          column: "To Do",
          priority: "low",
          assignee: M,
          labels: ["Design"],
          createdAgo: 8,
        },
        {
          title: "Activity feed grouping by day",
          column: "In Review",
          priority: "medium",
          assignee: M,
          dueIn: 4,
          createdAgo: 10,
        },
        {
          title: "Resend invite emails with dark template",
          column: "In Review",
          priority: "low",
          assignee: F,
          dueIn: -1,
          comments: [{ by: A, body: "Template looks great. Ship it after copy review.", ago: 1 }],
          createdAgo: 11,
        },
        {
          title: "Offline support with IndexedDB sync",
          column: "Backlog",
          priority: "low",
          assignee: J,
          labels: ["Improvement"],
          createdAgo: 12,
        },
        {
          title: "Public REST API with token scopes",
          column: "Backlog",
          priority: "medium",
          assignee: A,
          createdAgo: 12,
        },
        {
          title: "SSO with SAML for enterprise workspaces",
          column: "Backlog",
          priority: "none",
          createdAgo: 13,
        },
        {
          title: "Auth.js credentials + JWT sessions",
          column: "Done",
          priority: "high",
          assignee: A,
          doneAgo: 2,
          labels: ["Feature"],
          createdAgo: 13,
        },
        {
          title: "Drizzle schema: tables, relations, enums",
          column: "Done",
          priority: "medium",
          assignee: K,
          doneAgo: 5,
          createdAgo: 14,
        },
        {
          title: "Zod validation on every server action",
          column: "Done",
          priority: "medium",
          assignee: D,
          doneAgo: 9,
          createdAgo: 13,
        },
        {
          title: "Area & donut charts with framer-motion",
          column: "Done",
          priority: "low",
          assignee: M,
          doneAgo: 1,
          labels: ["Design"],
          createdAgo: 10,
        },
      ],
    },
    {
      name: "Design System",
      key: "DS",
      color: "#A78BFA",
      description: "Tokens, primitives and motion for every Nero surface.",
      dueIn: 35,
      tasks: [
        {
          title: "Motion tokens: easing & duration scale",
          column: "To Do",
          priority: "medium",
          assignee: M,
          labels: ["Design"],
          createdAgo: 5,
        },
        {
          title: "Avatar gradient system",
          column: "In Progress",
          priority: "low",
          assignee: F,
          createdAgo: 7,
        },
        {
          title: "Focus-visible rings on dark surfaces",
          column: "In Review",
          priority: "high",
          assignee: A,
          labels: ["Improvement"],
          createdAgo: 9,
        },
        {
          title: "Theming API (per-workspace accent)",
          column: "Backlog",
          priority: "none",
          assignee: D,
          createdAgo: 6,
        },
        {
          title: "Icon audit: replace legacy glyphs",
          column: "Backlog",
          priority: "low",
          assignee: K,
          createdAgo: 6,
        },
        {
          title: "Ink color ramp (11 steps)",
          column: "Done",
          priority: "medium",
          assignee: M,
          doneAgo: 3,
          createdAgo: 12,
        },
        {
          title: "Geist type scale mapping",
          column: "Done",
          priority: "low",
          assignee: F,
          doneAgo: 6,
          createdAgo: 12,
        },
        {
          title: "Card elevation strategy",
          column: "Done",
          priority: "low",
          assignee: J,
          doneAgo: 12,
          createdAgo: 13,
        },
      ],
    },
    {
      name: "Launch Campaign",
      key: "MKT",
      color: "#F472B6",
      description: "Everything for the public launch on the 30th.",
      dueIn: 12,
      tasks: [
        {
          title: "Landing page: hero board animation",
          column: "To Do",
          priority: "high",
          assignee: M,
          dueIn: 2,
          labels: ["Design"],
          description: "The mini board should animate one card mid-drag on a loop — sells the product instantly.",
          createdAgo: 4,
        },
        {
          title: "README with architecture diagram",
          column: "To Do",
          priority: "medium",
          assignee: F,
          dueIn: 5,
          labels: ["Docs"],
          createdAgo: 5,
        },
        {
          title: "Show HN post draft",
          column: "In Progress",
          priority: "urgent",
          assignee: D,
          dueIn: 1,
          labels: ["Docs"],
          comments: [
            { by: K, body: "Lead with the command palette GIF — it's the hook.", ago: 1 },
          ],
          createdAgo: 5,
        },
        {
          title: "Launch week social thread drafts",
          column: "Backlog",
          priority: "low",
          assignee: J,
          createdAgo: 3,
        },
        {
          title: "Define launch success metrics",
          column: "Done",
          priority: "medium",
          assignee: D,
          doneAgo: 4,
          createdAgo: 9,
        },
        {
          title: "Logo mark: amber N on black",
          column: "Done",
          priority: "high",
          assignee: M,
          doneAgo: 8,
          labels: ["Design"],
          createdAgo: 11,
        },
      ],
    },
  ];

  let taskCount = 0;

  for (const seed of PROJECTS) {
    const [project] = await db
      .insert(projects)
      .values({
        workspaceId: workspace.id,
        name: seed.name,
        key: seed.key,
        color: seed.color,
        description: seed.description,
        dueDate: seed.dueIn ? addDays(new Date(), seed.dueIn) : null,
        createdById: byEmail[D].id,
        taskCounter: seed.tasks.length,
        createdAt: subDays(new Date(), 14),
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
    const colByName = Object.fromEntries(cols.map((c) => [c.name, c.id]));

    const insertedLabels = await db
      .insert(labels)
      .values(LABEL_PRESETS.map((l) => ({ projectId: project.id, ...l })))
      .returning();
    const labelByName = Object.fromEntries(
      insertedLabels.map((l) => [l.name, l.id]),
    );

    await log({
      projectId: project.id,
      userId: byEmail[D].id,
      action: "project.created",
      meta: { name: seed.name, key: seed.key },
      at: subDays(new Date(), 14),
    });

    const colPositions: Record<string, number> = {};

    for (const [i, t] of seed.tasks.entries()) {
      const columnId = colByName[t.column];
      colPositions[t.column] = (colPositions[t.column] ?? 0) + 1;
      const completedAt = t.doneAgo != null ? subDays(new Date(), t.doneAgo) : null;
      const createdAt = subDays(new Date(), t.createdAgo ?? 10);

      const [task] = await db
        .insert(tasks)
        .values({
          projectId: project.id,
          columnId,
          number: i + 1,
          title: t.title,
          description: t.description ?? null,
          priority: t.priority,
          position: colPositions[t.column] * 100,
          dueDate: t.dueIn != null ? addDays(new Date(), t.dueIn) : null,
          assigneeId: t.assignee ? byEmail[t.assignee].id : null,
          creatorId: byEmail[D].id,
          completedAt,
          createdAt,
          updatedAt: createdAt,
        })
        .returning();
      taskCount++;

      if (t.labels?.length) {
        await db.insert(taskLabels).values(
          t.labels.map((name) => ({
            taskId: task.id,
            labelId: labelByName[name],
          })),
        );
      }

      for (const c of t.comments ?? []) {
        const at = subHours(new Date(), (c.ago ?? 0) * 24 + 4);
        await db.insert(comments).values({
          taskId: task.id,
          authorId: byEmail[c.by].id,
          body: c.body,
          createdAt: at,
        });
        await log({
          projectId: project.id,
          taskId: task.id,
          userId: byEmail[c.by].id,
          action: "comment.added",
          meta: {
            key: `${seed.key}-${task.number}`,
            title: task.title,
            excerpt: c.body.slice(0, 80),
          },
          at,
        });
      }

      await log({
        projectId: project.id,
        taskId: task.id,
        userId: byEmail[t.assignee ?? D].id,
        action: "task.created",
        meta: { key: `${seed.key}-${task.number}`, title: task.title },
        at: createdAt,
      });

      if (completedAt) {
        await log({
          projectId: project.id,
          taskId: task.id,
          userId: byEmail[t.assignee ?? D].id,
          action: "task.completed",
          meta: { key: `${seed.key}-${task.number}`, title: task.title },
          at: subHours(completedAt, -3),
        });
      }
    }
  }

  console.log(
    `✅ Seeded ${insertedUsers.length} users, 1 workspace, ${PROJECTS.length} projects and ${taskCount} tasks.`,
  );
  console.log("👉 Sign in with demo@nero.dev / demo1234");
  process.exit(0);
}

main().catch((error) => {
  console.error("❌ Seed failed:", error);
  process.exit(1);
});
