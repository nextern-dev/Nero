import { and, eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/db";
import { projects, users, workspaceMembers } from "@/db/schema";

export const WS_COOKIE = "nero_ws";

export async function getSessionUser() {
  const session = await auth();
  const id = session?.user?.id;
  if (!id) return null;
  const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
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

export async function requireTaskAccess(userId: string, taskId: string) {
  const task = await db.query.tasks.findFirst({
    where: (t, { eq: eq2 }) => eq2(t.id, taskId),
  });
  if (!task) throw new Error("Task not found");
  const { membership } = await requireProjectAccess(userId, task.projectId);
  return { task, membership };
}
