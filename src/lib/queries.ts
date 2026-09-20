import { and, asc, count, desc, eq, ilike, inArray, isNull, or, sql } from "drizzle-orm";
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

  const projectIds = projs.map((p) => p.id);
  const [statsRows, assigneeRows] = await Promise.all([
    db.select({ projectId: tasks.projectId, total: count(), done: sql<number>`count(*) filter (where ${tasks.completedAt} is not null)` })
      .from(tasks).where(inArray(tasks.projectId, projectIds)).groupBy(tasks.projectId),
    db.select({ projectId: tasks.projectId, assigneeId: tasks.assigneeId }).from(tasks)
      .where(and(inArray(tasks.projectId, projectIds), sql`${tasks.assigneeId} is not null`))
      .groupBy(tasks.projectId, tasks.assigneeId),
  ]);
  const userIds = assigneeRows.map((t) => t.assigneeId).filter(Boolean) as string[];
  const assignees = userIds.length ? await db.select().from(users).where(inArray(users.id, userIds)) : [];
  const userMap = new Map(assignees.map((u) => [u.id, toUserDTO(u)]));
  const statsMap = new Map(statsRows.map((r) => [r.projectId, { total: Number(r.total), done: Number(r.done) }]));

  return projs.map((p) => {
    const contributors = assigneeRows
      .filter((r) => r.projectId === p.id)
      .map((r) => userMap.get(r.assigneeId as string))
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
      total: statsMap.get(p.id)?.total ?? 0,
      done: statsMap.get(p.id)?.done ?? 0,
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
    .select({
      id: tasks.id,
      title: tasks.title,
      number: tasks.number,
      priority: tasks.priority,
      dueDate: tasks.dueDate,
      projectId: tasks.projectId,
    })
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

  const [summary, completedRows, statusRows] = await Promise.all([
    db.select({
      open: sql<number>`count(*) filter (where ${tasks.completedAt} is null)`,
      doneThisWeek: sql<number>`count(*) filter (where ${tasks.completedAt} >= ${weekAgo})`,
      overdue: sql<number>`count(*) filter (where ${tasks.completedAt} is null and ${tasks.dueDate} < ${today})`,
    }).from(tasks).where(inArray(tasks.projectId, ids)),
    db.select({ completedAt: tasks.completedAt }).from(tasks)
      .where(and(inArray(tasks.projectId, ids), sql`${tasks.completedAt} >= ${twoWeeksAgo}`)),
    db.select({ name: boardColumns.name, count: count() }).from(tasks)
      .innerJoin(boardColumns, eq(tasks.columnId, boardColumns.id))
      .where(and(inArray(tasks.projectId, ids), isNull(tasks.completedAt)))
      .groupBy(boardColumns.id, boardColumns.name),
  ]);
  const row = summary[0];
  return {
    open: Number(row?.open ?? 0),
    doneThisWeek: Number(row?.doneThisWeek ?? 0),
    overdue: Number(row?.overdue ?? 0),
    projectCount: projs.length,
    completedDates: completedRows.map((t) => t.completedAt?.toISOString()).filter(Boolean) as string[],
    statusBreakdown: statusRows.map((s) => ({ name: s.name, count: Number(s.count) })),
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

  const taskRows = await db
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
          and(eq(projects.workspaceId, workspaceId), ilike(tasks.title, pattern)),
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
