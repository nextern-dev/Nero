"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { boardColumns, labels, projects } from "@/db/schema";
import { logActivity } from "@/lib/activity";
import { DEFAULT_COLUMNS, LABEL_PRESETS } from "@/lib/constants";
import { requireWorkspace } from "@/lib/session";
import {
  projectCreateSchema,
  zodError,
  type ActionResult,
} from "@/lib/validations";

export async function createProject(
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  const { user, workspace } = await requireWorkspace();
  const parsed = projectCreateSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: zodError(parsed.error) };
  const data = parsed.data;

  const [duplicate] = await db.select({ id: projects.id }).from(projects).where(and(eq(projects.workspaceId, workspace.id), eq(projects.key, data.key))).limit(1);
  if (duplicate) return { ok: false, error: "A project with this key already exists in the workspace" };

  const [project] = await db
    .insert(projects)
    .values({
      workspaceId: workspace.id,
      name: data.name,
      key: data.key,
      description: data.description || null,
      color: data.color,
      dueDate: data.dueDate,
      createdById: user.id,
    })
    .returning();

  await db.insert(boardColumns).values(
    DEFAULT_COLUMNS.map((name, i) => ({
      projectId: project.id,
      name,
      sortOrder: i,
    })),
  );

  await db
    .insert(labels)
    .values(LABEL_PRESETS.map((l) => ({ projectId: project.id, ...l })));

  await logActivity({
    workspaceId: workspace.id,
    projectId: project.id,
    userId: user.id,
    action: "project.created",
    meta: { name: project.name, key: project.key },
  });

  revalidatePath("/projects");
  revalidatePath("/dashboard");
  return { ok: true, data: { id: project.id } };
}
