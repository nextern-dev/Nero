import { db } from "@/db";
import { activities } from "@/db/schema";

export async function logActivity(input: {
  workspaceId: string;
  projectId?: string | null;
  taskId?: string | null;
  userId?: string | null;
  action: string;
  meta?: Record<string, unknown> | null;
}) {
  await db.insert(activities).values({
    workspaceId: input.workspaceId,
    projectId: input.projectId ?? null,
    taskId: input.taskId ?? null,
    userId: input.userId ?? null,
    action: input.action,
    meta: input.meta ? JSON.stringify(input.meta) : null,
  });
}
