import { and, eq, inArray } from "drizzle-orm";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/db";
import { boardColumns, labels, projects, tasks, users, workspaceMembers } from "@/db/schema";

export const WS_COOKIE = "nero_ws";

export async function getSessionUser() {
  const session = await auth();
  const id = session?.user?.id;
  if (!id) return null;
  const [user] = await db.select({ id: users.id, name: users.name, email: users.email, color: users.color }).from(users).where(eq(users.id, id)).limit(1);
  return user ?? null;
}

export async function requireUser() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return user;
}

export async function getMemberships(userId: string) {
  return db.query.workspaceMembers.findMany({
    where: eq(workspaceMembers.userId, userId),
    with: { workspace: true },
    orderBy: (m, { asc }) => [asc(m.createdAt)],
  });
}

export async function getActiveWorkspace(userId: string) {
  const memberships = await getMemberships(userId);
  if (memberships.length === 0) return null;
  const cookieStore = await cookies();
  const wanted = cookieStore.get(WS_COOKIE)?.value;
  const active =
    memberships.find((m) => m.workspaceId === wanted) ?? memberships[0];
  return {
    workspace: active.workspace,
    role: active.role,
    memberships: memberships.map((m) => ({
      id: m.workspace.id,
      name: m.workspace.name,
      slug: m.workspace.slug,
      role: m.role,
    })),
  };
}

export async function requireWorkspace() {
  const user = await requireUser();
  const ctx = await getActiveWorkspace(user.id);
  if (!ctx) redirect("/login");
  return { user, ...ctx };
}

/** Throws unless the user is a member of the workspace owning the project. */
export async function requireProjectAccess(userId: string, projectId: string) {
  const [project] = await db
    .select()
    .from(projects)
    .where(eq(projects.id, projectId))
    .limit(1);
  if (!project) throw new Error("Project not found");

  const [membership] = await db
    .select()
    .from(workspaceMembers)
    .where(
      and(
        eq(workspaceMembers.workspaceId, project.workspaceId),
        eq(workspaceMembers.userId, userId),
      ),
    )
    .limit(1);
  if (!membership) throw new Error("You do not have access to this project");
  return { project, membership };
}

export async function requireColumnInProject(columnId: string, projectId: string) {
  const [column] = await db.select().from(boardColumns).where(and(eq(boardColumns.id, columnId), eq(boardColumns.projectId, projectId))).limit(1);
  if (!column) throw new Error("Column does not belong to this project");
  return column;
}

export async function requireLabelsInProject(labelIds: string[], projectId: string) {
  if (!labelIds.length) return;
  const rows = await db.select({ id: labels.id }).from(labels).where(and(eq(labels.projectId, projectId), inArray(labels.id, labelIds)));
  if (rows.length !== new Set(labelIds).size) throw new Error("One or more labels do not belong to this project");
}

export async function requireWorkspaceMember(userId: string, workspaceId: string) {
  const [membership] = await db.select().from(workspaceMembers).where(and(eq(workspaceMembers.workspaceId, workspaceId), eq(workspaceMembers.userId, userId))).limit(1);
  if (!membership) throw new Error("User is not a member of this workspace");
  return membership;
}

export async function requireTaskIdsInColumn(ids: string[], columnId: string, projectId: string) {
  if (!ids.length) return;
  const rows = await db.select({ id: tasks.id }).from(tasks).where(and(eq(tasks.projectId, projectId), eq(tasks.columnId, columnId), inArray(tasks.id, ids)));
  if (rows.length !== new Set(ids).size) throw new Error("Invalid task ordering payload");
}

export async function requireTaskAccess(userId: string, taskId: string) {
  const task = await db.query.tasks.findFirst({
    where: (t, { eq: eq2 }) => eq2(t.id, taskId),
  });
  if (!task) throw new Error("Task not found");
  const { membership } = await requireProjectAccess(userId, task.projectId);
  return { task, membership };
}
