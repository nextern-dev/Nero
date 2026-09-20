import { asc, eq } from "drizzle-orm";
import type { ReactNode } from "react";
import { AppShell } from "@/components/app-shell";
import { db } from "@/db";
import { projects } from "@/db/schema";
import { requireWorkspace } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const { user, workspace, memberships } = await requireWorkspace();

  const projectList = await db
    .select({
      id: projects.id,
      name: projects.name,
      key: projects.key,
      color: projects.color,
    })
    .from(projects)
    .where(eq(projects.workspaceId, workspace.id))
    .orderBy(asc(projects.createdAt));

  return (
    <AppShell
      user={{
        id: user.id,
        name: user.name,
        email: user.email,
        color: user.color,
      }}
      workspace={{ id: workspace.id, name: workspace.name }}
      workspaces={memberships}
      projects={projectList}
    >
      {children}
    </AppShell>
  );
}
