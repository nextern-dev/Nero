import type { Metadata } from "next";
import { DashboardView } from "@/components/dashboard-view";
import {
  getActivityFeed,
  getDashboardStats,
  getMyTasks,
  getProjectsWithProgress,
} from "@/lib/queries";
import { requireWorkspace } from "@/lib/session";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const { user, workspace } = await requireWorkspace();
  const [stats, myTasks, projects, activities] = await Promise.all([
    getDashboardStats(workspace.id),
    getMyTasks(workspace.id, user.id),
    getProjectsWithProgress(workspace.id),
    getActivityFeed(workspace.id, 12),
  ]);

  return (
    <DashboardView
      firstName={user.name.split(" ")[0]}
      workspaceName={workspace.name}
      stats={stats}
      myTasks={myTasks}
      projects={projects}
      activities={activities}
    />
  );
}
