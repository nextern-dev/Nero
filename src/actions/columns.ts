"use server";

import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { boardColumns, tasks } from "@/db/schema";
import { requireProjectAccess, requireUser } from "@/lib/session";
import {
  columnCreateSchema,
  columnRenameSchema,
  columnReorderSchema,
  zodError,
  type ActionResult,
} from "@/lib/validations";

export async function createColumn(
  input: unknown,
): Promise<ActionResult<{ id: string; name: string }>> {
  try {
    const user = await requireUser();
    const parsed = columnCreateSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: zodError(parsed.error) };
    await requireProjectAccess(user.id, parsed.data.projectId);

    const [row] = await db
      .select({ max: sql<number | null>`max(${boardColumns.sortOrder})` })
      .from(boardColumns)
      .where(eq(boardColumns.projectId, parsed.data.projectId));

    const [column] = await db
      .insert(boardColumns)
      .values({
        projectId: parsed.data.projectId,
        name: parsed.data.name,
        sortOrder: (row?.max ?? -1) + 1,
      })
      .returning();
    return { ok: true, data: { id: column.id, name: column.name } };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Something went wrong",
    };
  }
}

export async function renameColumn(input: unknown): Promise<ActionResult> {
  try {
    const user = await requireUser();
    const parsed = columnRenameSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: zodError(parsed.error) };

    const [column] = await db
      .select()
      .from(boardColumns)
      .where(eq(boardColumns.id, parsed.data.columnId))
      .limit(1);
    if (!column) return { ok: false, error: "Column not found" };
    await requireProjectAccess(user.id, column.projectId);

    await db
      .update(boardColumns)
      .set({ name: parsed.data.name })
      .where(eq(boardColumns.id, column.id));
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Something went wrong",
    };
  }
}

export async function deleteColumn(columnId: string): Promise<ActionResult> {
  try {
    const user = await requireUser();
    const [column] = await db
      .select()
      .from(boardColumns)
      .where(eq(boardColumns.id, columnId))
      .limit(1);
    if (!column) return { ok: false, error: "Column not found" };
    await requireProjectAccess(user.id, column.projectId);

    const count = await db
      .select({ n: sql<number>`count(*)::int` })
      .from(boardColumns)
      .where(eq(boardColumns.projectId, column.projectId));
    if ((count[0]?.n ?? 0) <= 1)
      return { ok: false, error: "A board needs at least one column" };
    const [taskCount] = await db.select({ n: sql<number>`count(*)::int` }).from(tasks).where(eq(tasks.columnId, column.id));
    if ((taskCount?.n ?? 0) > 0) return { ok: false, error: "Move or delete the column tasks before deleting this column" };

    await db.delete(boardColumns).where(eq(boardColumns.id, columnId));
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Something went wrong",
    };
  }
}

export async function reorderColumns(input: unknown): Promise<ActionResult> {
  try {
    const user = await requireUser();
    const parsed = columnReorderSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: zodError(parsed.error) };
    await requireProjectAccess(user.id, parsed.data.projectId);

    await db.transaction(async (tx) => {
      await Promise.all(
        parsed.data.ids.map((id, i) =>
          tx
            .update(boardColumns)
            .set({ sortOrder: i })
            .where(and(eq(boardColumns.id, id), eq(boardColumns.projectId, parsed.data.projectId))),
        ),
      );
    });
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Something went wrong",
    };
  }
}
