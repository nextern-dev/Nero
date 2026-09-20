import { and, desc, eq, ilike, inArray, isNull, or, asc } from "drizzle-orm";
import { subDays, startOfToday } from "date-fns";
import { db } from "@/db";
import {
  activities,
  boardColumns,
  projects,
  tasks,
  users,
  workspaceMembers,
  type Priority,
} from "@/db/schema";
import type {
  ActivityDTO,
  BoardData,
  MemberDTO,
  ProjectDTO,
  SearchResults,
  UserDTO,
} from "@/lib/types";

export function toUserDTO(u: typeof users.$inferSelect): UserDTO {
  return { id: u.id, name: u.name, email: u.email, color: u.color };
}

/* ------------------------------------------------------------------ */
/*  Board                                                              */
/* ------------------------------------------------------------------ */

export async function getBoard(projectId: string): Promise<BoardData | null> {
  const project = await db.query.projects.findFirst({
    where: eq(projects.id, projectId),
    with: {
      labels: true,
      columns: {
        orderBy: (c, { asc: a }) => [a(c.sortOrder)],
        with: {
          tasks: {
            orderBy: (t, { asc: a }) => [a(t.position)],
            with: {
              assignee: true,
              creator: true,
              taskLabels: { with: { label: true } },
              comments: {
                with: { author: true },
                orderBy: (c, { asc: a }) => [a(c.createdAt)],
              },
            },
          },
        },
      },
    },
  });
  if (!project) return null;

  const members = await db.query.workspaceMembers.findMany({
    where: eq(workspaceMembers.workspaceId, project.workspaceId),
    with: { user: true },
    orderBy: (m, { asc: a }) => [a(m.createdAt)],
  });

  return {
    project: {
      id: project.id,
      name: project.name,
      key: project.key,
      description: project.description,
      color: project.color,
      dueDate: project.dueDate?.toISOString() ?? null,
      createdAt: project.createdAt.toISOString(),
    },
    labels: project.labels.map((l) => ({
      id: l.id,
      name: l.name,
      color: l.color,
    })),
    members: members.map((m) => toUserDTO(m.user)),
    columns: project.columns.map((c) => ({
      id: c.id,
      name: c.name,
      tasks: c.tasks.map((t) => ({
        id: t.id,
        number: t.number,
        title: t.title,
        description: t.description,
        priority: t.priority,
        dueDate: t.dueDate?.toISOString() ?? null,
        position: t.position,
        columnId: t.columnId,
        assignee: t.assignee ? toUserDTO(t.assignee) : null,
        creator: t.creator ? toUserDTO(t.creator) : null,
        labels: t.taskLabels.map((tl) => ({
          id: tl.label.id,
          name: tl.label.name,
          color: tl.label.color,
        })),
        comments: t.comments.map((cm) => ({
          id: cm.id,
          body: cm.body,
          createdAt: cm.createdAt.toISOString(),
          author: toUserDTO(cm.author),
        })),
        completedAt: t.completedAt?.toISOString() ?? null,
        createdAt: t.createdAt.toISOString(),
      })),
    })),
  };
}

/* ------------------------------------------------------------------ */
/*  Projects with progress                                             */
/* ------------------------------------------------------------------ */

export type ProjectWithProgress = {
  project: ProjectDTO;
  total: number;
  done: number;
  contributors: UserDTO[];
};

export async function getProjectsWithProgress(
  workspaceId: string,
): Promise<ProjectWithProgress[]> {
  const projs = await db
    .select()
    .from(projects)
    .where(eq(projects.workspaceId, workspaceId))
    .orderBy(asc(projects.createdAt));

  if (!projs.length) return [];

  const allTasks = await db
    .select({
      id: tasks.id,
      projectId: tasks.projectId,
      completedAt: tasks.completedAt,
      assigneeId: tasks.assigneeId,
    })
    .from(tasks)
    .where(
      inArray(
        tasks.projectId,
        projs.map((p) => p.id),
      ),
    );

  const userIds = [
    ...new Set(allTasks.map((t) => t.assigneeId).filter(Boolean)),
  ] as string[];
  const assignees = userIds.length
    ? await db.select().from(users).where(inArray(users.id, userIds))
    : [];
  const userMap = new Map(assignees.map((u) => [u.id, toUserDTO(u)]));

  return projs.map((p) => {
    const related = allTasks.filter((t) => t.projectId === p.id);
    const contributors = [
      ...new Set(related.map((t) => t.assigneeId).filter(Boolean)),
    ]
      .map((id) => userMap.get(id as string))
      .filter(Boolean)
      .slice(0, 4) as UserDTO[];
    return {
      project: {
        id: p.id,
        name: p.name,
        key: p.key,
        description: p.description,
        color: p.color,
        dueDate: p.dueDate?.toISOString() ?? null,
        createdAt: p.createdAt.toISOString(),
      },
      total: related.length,
      done: related.filter((t) => t.completedAt).length,
      contributors,
    };
  });
}

/* ------------------------------------------------------------------ */
/*  Dashboard                                                          */
/* ------------------------------------------------------------------ */

export type MyTask = {
  id: string;
  title: string;
  number: number;
  priority: Priority;
  dueDate: string | null;
  projectId: string;
  projectKey: string;
  projectColor: string;
};

export async function getMyTasks(
  workspaceId: string,
  userId: string,
  limit = 8,
): Promise<MyTask[]> {
  const projs = await db
    .select({ id: projects.id, key: projects.key, color: projects.color })
    .from(projects)
    .where(eq(projects.workspaceId, workspaceId));
  if (!projs.length) return [];
  const projectMap = new Map(projs.map((p) => [p.id, p]));

  const rows = await db
    .select()
    .from(tasks)
    .where(
      and(
        inArray(
          tasks.projectId,
          projs.map((p) => p.id),
        ),
        eq(tasks.assigneeId, userId),
        isNull(tasks.completedAt),
      ),
    )
    .orderBy(asc(tasks.dueDate), desc(tasks.priority))
    .limit(limit);

  return rows.map((t) => ({
    id: t.id,
    title: t.title,
    number: t.number,
    priority: t.priority,
    dueDate: t.dueDate?.toISOString() ?? null,
    projectId: t.projectId,
    projectKey: projectMap.get(t.projectId)?.key ?? "",
    projectColor: projectMap.get(t.projectId)?.color ?? "#FF5A24",
  }));
}

export async function getDashboardStats(workspaceId: string) {
  const projs = await db
    .select({ id: projects.id, key: projects.key, color: projects.color })
    .from(projects)
    .where(eq(projects.workspaceId, workspaceId));
  const ids = projs.map((p) => p.id);
  if (!ids.length) {
    return {
      open: 0,
      doneThisWeek: 0,
      overdue: 0,
      projectCount: projs.length,
      completedDates: [] as string[],
      statusBreakdown: [] as { name: string; count: number }[],
    };
  }

  const all = await db
    .select({
      id: tasks.id,
      columnId: tasks.columnId,
      completedAt: tasks.completedAt,
      dueDate: tasks.dueDate,
    })
    .from(tasks)
    .where(inArray(tasks.projectId, ids));

  const today = startOfToday();
  const weekAgo = subDays(new Date(), 7);
  const twoWeeksAgo = subDays(new Date(), 14);

  const open = all.filter((t) => !t.completedAt);
  const statusCounts = new Map<string, number>();
  const cols = await db
    .select({ id: boardColumns.id, name: boardColumns.name })
    .from(boardColumns)
    .where(inArray(boardColumns.projectId, ids));
  const colMap = new Map(cols.map((c) => [c.id, c.name]));
  for (const t of open) {
    const name = colMap.get(t.columnId) ?? "Other";
    statusCounts.set(name, (statusCounts.get(name) ?? 0) + 1);
  }

  return {
    open: open.length,
    doneThisWeek: all.filter((t) => t.completedAt && t.completedAt >= weekAgo)
      .length,
    overdue: open.filter((t) => t.dueDate && t.dueDate < today).length,
    projectCount: projs.length,
    completedDates: all
      .filter((t) => t.completedAt && t.completedAt >= twoWeeksAgo)
      .map((t) => t.completedAt!.toISOString()),
    statusBreakdown: [...statusCounts.entries()].map(([name, count]) => ({
      name,
      count,
    })),
  };
}

/* ------------------------------------------------------------------ */
/*  Activity                                                           */
/* ------------------------------------------------------------------ */

export async function getActivityFeed(
  workspaceId: string,
  limit = 40,
): Promise<ActivityDTO[]> {
  const rows = await db.query.activities.findMany({
    where: eq(activities.workspaceId, workspaceId),
    orderBy: (a, { desc: d }) => [d(a.createdAt)],
    limit,
    with: { user: true, project: true },
  });

  return rows.map((a) => ({
    id: a.id,
    action: a.action,
    meta: a.meta,
    createdAt: a.createdAt.toISOString(),
    user: a.user ? toUserDTO(a.user) : null,
    project: a.project
      ? {
          id: a.project.id,
          name: a.project.name,
          key: a.project.key,
          color: a.project.color,
        }
      : null,
  }));
}

/* ------------------------------------------------------------------ */
/*  Members                                                            */
/* ------------------------------------------------------------------ */

export async function getMembersWithStats(
  workspaceId: string,
): Promise<MemberDTO[]> {
  const members = await db.query.workspaceMembers.findMany({
    where: eq(workspaceMembers.workspaceId, workspaceId),
    with: { user: true },
    orderBy: (m, { asc: a }) => [a(m.createdAt)],
  });

  const projs = await db
    .select({ id: projects.id })
    .from(projects)
    .where(eq(projects.workspaceId, workspaceId));
  const ids = projs.map((p) => p.id);

  const all = ids.length
    ? await db
        .select({
          assigneeId: tasks.assigneeId,
          completedAt: tasks.completedAt,
        })
        .from(tasks)
        .where(inArray(tasks.projectId, ids))
    : [];

  return members.map((m) => ({
    ...toUserDTO(m.user),
    membershipId: m.id,
    role: m.role,
    joinedAt: m.createdAt.toISOString(),
    openTasks: all.filter((t) => t.assigneeId === m.userId && !t.completedAt)
      .length,
    doneTasks: all.filter((t) => t.assigneeId === m.userId && t.completedAt)
      .length,
  }));
}

/* ------------------------------------------------------------------ */
/*  Search                                                             */
/* ------------------------------------------------------------------ */

export async function searchWorkspace(
  workspaceId: string,
  q: string,
): Promise<SearchResults> {
  const pattern = `%${q}%`;
  const projs = await db
    .select({
      id: projects.id,
      name: projects.name,
      key: projects.key,
      color: projects.color,
    })
    .from(projects)
    .where(
      and(
        eq(projects.workspaceId, workspaceId),
        or(ilike(projects.name, pattern), ilike(projects.key, pattern)),
      ),
    )
    .limit(4);

  const allProjIds = (
    await db
      .select({ id: projects.id })
      .from(projects)
      .where(eq(projects.workspaceId, workspaceId))
  ).map((p) => p.id);

  const taskRows = allProjIds.length
    ? await db
        .select({
          id: tasks.id,
          title: tasks.title,
          number: tasks.number,
          projectId: tasks.projectId,
          projectKey: projects.key,
          projectColor: projects.color,
        })
        .from(tasks)
        .innerJoin(projects, eq(tasks.projectId, projects.id))
        .where(
          and(inArray(tasks.projectId, allProjIds), ilike(tasks.title, pattern)),
        )
        .limit(6)
    : [];

  return {
    projects: projs.map((p) => ({
      id: p.id,
      name: p.name,
      key: p.key,
      color: p.color,
    })),
    tasks: taskRows.map((t) => ({
      id: t.id,
      title: t.title,
      number: t.number,
      projectId: t.projectId,
      projectKey: t.projectKey,
      projectColor: t.projectColor,
    })),
  };
}
