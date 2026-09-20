"use server";

import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  boardColumns,
  comments,
  projects,
  taskLabels,
  tasks,
} from "@/db/schema";
import { logActivity } from "@/lib/activity";
import { isDoneColumn } from "@/lib/constants";
import {
  requireProjectAccess,
  requireTaskAccess,
  requireUser,
} from "@/lib/session";
import type { CommentDTO } from "@/lib/types";
import {
  commentCreateSchema,
  moveTaskSchema,
  taskCreateSchema,
  taskUpdateSchema,
  zodError,
  type ActionResult,
} from "@/lib/validations";

async function nextPosition(columnId: string) {
  const [row] = await db
    .select({ max: sql<number | null>`max(${tasks.position})` })
    .from(tasks)
    .where(eq(tasks.columnId, columnId));
  return (row?.max ?? 0) + 100;
}

export async function createTask(
  input: unknown,
): Promise<ActionResult<{ id: string; number: number }>> {
  try {
    const user = await requireUser();
    const parsed = taskCreateSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: zodError(parsed.error) };
    const data = parsed.data;
    const { project } = await requireProjectAccess(user.id, data.projectId);

    const [counter] = await db
      .update(projects)
      .set({ taskCounter: sql`${projects.taskCounter} + 1` })
      .where(eq(projects.id, project.id))
      .returning({ n: projects.taskCounter });

    const [task] = await db
      .insert(tasks)
      .values({
        projectId: project.id,
        columnId: data.columnId,
        number: counter.n,
        title: data.title,
        description: data.description || null,
        priority: data.priority,
        assigneeId: data.assigneeId,
        dueDate: data.dueDate,
        position: await nextPosition(data.columnId),
        creatorId: user.id,
      })
      .returning();

    if (data.labelIds.length) {
      await db.insert(taskLabels).values(
        data.labelIds.map((labelId) => ({ taskId: task.id, labelId })),
      );
    }

    await logActivity({
      workspaceId: project.workspaceId,
      projectId: project.id,
      taskId: task.id,
      userId: user.id,
      action: "task.created",
      meta: { key: `${project.key}-${task.number}`, title: task.title },
    });

    return { ok: true, data: { id: task.id, number: task.number } };
  } catch (error) {
    return { ok: false, error: errorMessage(error) };
  }
}

export async function updateTask(input: unknown): Promise<ActionResult> {
  try {
    const user = await requireUser();
    const parsed = taskUpdateSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: zodError(parsed.error) };
    const data = parsed.data;
    const { task } = await requireTaskAccess(user.id, data.taskId);
    const [project] = await db
      .select()
      .from(projects)
      .where(eq(projects.id, task.projectId))
      .limit(1);

    const key = `${project.key}-${task.number}`;
    const set: Partial<typeof tasks.$inferInsert> = { updatedAt: new Date() };

    if (data.title !== undefined) set.title = data.title;
    if (data.description !== undefined) set.description = data.description || null;
    if (data.priority !== undefined) set.priority = data.priority;
    if (data.assigneeId !== undefined) set.assigneeId = data.assigneeId;
    if (data.dueDate !== undefined) set.dueDate = data.dueDate;

    let activity: { action: string; meta: Record<string, unknown> } | null =
      null;

    if (data.columnId !== undefined && data.columnId !== task.columnId) {
      set.columnId = data.columnId;
      set.position = await nextPosition(data.columnId);
      const [col] = await db
        .select()
        .from(boardColumns)
        .where(eq(boardColumns.id, data.columnId))
        .limit(1);
      if (col && isDoneColumn(col.name) && !task.completedAt) {
        set.completedAt = new Date();
        activity = { action: "task.completed", meta: { key, title: task.title } };
      } else if (col && !isDoneColumn(col.name) && task.completedAt) {
        set.completedAt = null;
        activity = { action: "task.reopened", meta: { key, title: task.title } };
      } else {
        activity = {
          action: "task.moved",
          meta: { key, title: task.title, to: col?.name ?? "another column" },
        };
      }
    }

    if (data.completed !== undefined) {
      const completing = data.completed && !task.completedAt;
      const reopening = !data.completed && !!task.completedAt;
      set.completedAt = data.completed ? new Date() : null;
      if (completing)
        activity = { action: "task.completed", meta: { key, title: task.title } };
      if (reopening)
        activity = { action: "task.reopened", meta: { key, title: task.title } };
    }

    await db.update(tasks).set(set).where(eq(tasks.id, task.id));

    if (data.labelIds !== undefined) {
      await db.delete(taskLabels).where(eq(taskLabels.taskId, task.id));
      if (data.labelIds.length) {
        await db.insert(taskLabels).values(
          data.labelIds.map((labelId) => ({ taskId: task.id, labelId })),
        );
      }
    }

    if (activity) {
      await logActivity({
        workspaceId: project.workspaceId,
        projectId: project.id,
        taskId: task.id,
        userId: user.id,
        action: activity.action,
        meta: activity.meta,
      });
    }

    return { ok: true };
  } catch (error) {
    return { ok: false, error: errorMessage(error) };
  }
}

export async function deleteTask(taskId: string): Promise<ActionResult> {
  try {
    const user = await requireUser();
    const { task } = await requireTaskAccess(user.id, taskId);
    const [project] = await db
      .select()
      .from(projects)
      .where(eq(projects.id, task.projectId))
      .limit(1);

    await db.delete(tasks).where(eq(tasks.id, task.id));

    await logActivity({
      workspaceId: project.workspaceId,
      projectId: project.id,
      userId: user.id,
      action: "task.deleted",
      meta: { key: `${project.key}-${task.number}`, title: task.title },
    });
    return { ok: true };
  } catch (error) {
    return { ok: false, error: errorMessage(error) };
  }
}

export async function moveTask(input: unknown): Promise<ActionResult> {
  try {
    const user = await requireUser();
    const parsed = moveTaskSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: zodError(parsed.error) };
    const { taskId, projectId, from, to } = parsed.data;
    const { project } = await requireProjectAccess(user.id, projectId);

    const [task] = await db
      .select()
      .from(tasks)
      .where(eq(tasks.id, taskId))
      .limit(1);
    if (!task || task.projectId !== project.id)
      return { ok: false, error: "Task not found" };

    const sameColumn = from.columnId === to.columnId;
    const cols = await db
      .select()
      .from(boardColumns)
      .where(eq(boardColumns.projectId, project.id));
    const fromCol = cols.find((c) => c.id === from.columnId);
    const toCol = cols.find((c) => c.id === to.columnId);

    let completedAt = task.completedAt;
    let activity: { action: string; meta: Record<string, unknown> } | null =
      null;
    const key = `${project.key}-${task.number}`;

    if (!sameColumn && fromCol && toCol) {
      if (isDoneColumn(toCol.name) && !completedAt) {
        completedAt = new Date();
        activity = { action: "task.completed", meta: { key, title: task.title } };
      } else if (!isDoneColumn(toCol.name) && completedAt) {
        completedAt = null;
        activity = { action: "task.reopened", meta: { key, title: task.title } };
      } else {
        activity = {
          action: "task.moved",
          meta: { key, title: task.title, from: fromCol.name, to: toCol.name },
        };
      }
    }

    await db.transaction(async (tx) => {
      if (from.ids.length) {
        await Promise.all(
          from.ids.map((id, i) =>
            tx
              .update(tasks)
              .set({ position: (i + 1) * 100 })
              .where(and(eq(tasks.id, id), eq(tasks.projectId, project.id))),
          ),
        );
      }
      if (to.ids.length) {
        await Promise.all(
          to.ids.map((id, i) =>
            tx
              .update(tasks)
              .set({
                position: (i + 1) * 100,
                columnId: to.columnId,
                ...(id === taskId ? { completedAt, updatedAt: new Date() } : {}),
              })
              .where(and(eq(tasks.id, id), eq(tasks.projectId, project.id))),
          ),
        );
      }
    });

    if (activity) {
      await logActivity({
        workspaceId: project.workspaceId,
        projectId: project.id,
        taskId,
        userId: user.id,
        action: activity.action,
        meta: activity.meta,
      });
    }
    return { ok: true };
  } catch (error) {
    return { ok: false, error: errorMessage(error) };
  }
}

export async function addComment(
  input: unknown,
): Promise<ActionResult<CommentDTO>> {
  try {
    const user = await requireUser();
    const parsed = commentCreateSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: zodError(parsed.error) };
    const { task } = await requireTaskAccess(user.id, parsed.data.taskId);
    const [project] = await db
      .select()
      .from(projects)
      .where(eq(projects.id, task.projectId))
      .limit(1);

    const [comment] = await db
      .insert(comments)
      .values({ taskId: task.id, authorId: user.id, body: parsed.data.body })
      .returning();

    await logActivity({
      workspaceId: project.workspaceId,
      projectId: project.id,
      taskId: task.id,
      userId: user.id,
      action: "comment.added",
      meta: {
        key: `${project.key}-${task.number}`,
        title: task.title,
        excerpt: parsed.data.body.slice(0, 80),
      },
    });

    return {
      ok: true,
      data: {
        id: comment.id,
        body: comment.body,
        createdAt: comment.createdAt.toISOString(),
        author: {
          id: user.id,
          name: user.name,
          email: user.email,
          color: user.color,
        },
      },
    };
  } catch (error) {
    return { ok: false, error: errorMessage(error) };
  }
}

export async function deleteComment(commentId: string): Promise<ActionResult> {
  try {
    const user = await requireUser();
    const [comment] = await db
      .select()
      .from(comments)
      .where(eq(comments.id, commentId))
      .limit(1);
    if (!comment) return { ok: false, error: "Comment not found" };
    const { membership } = await requireTaskAccess(user.id, comment.taskId);

    const canDelete =
      comment.authorId === user.id ||
      membership.role === "owner" ||
      membership.role === "admin";
    if (!canDelete)
      return {
        ok: false,
        error: "Only the author or an admin can delete this comment",
      };

    await db.delete(comments).where(eq(comments.id, commentId));
    return { ok: true };
  } catch (error) {
    return { ok: false, error: errorMessage(error) };
  }
}

function errorMessage(error: unknown) {
  if (error instanceof Error) {
    if (error.message === "NEXT_REDIRECT") throw error;
    return error.message;
  }
  return "Something went wrong";
}
