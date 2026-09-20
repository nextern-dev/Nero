import type { Metadata } from "next";
import { MembersView } from "@/components/members-view";
import { getMembersWithStats } from "@/lib/queries";
import { requireWorkspace } from "@/lib/session";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Members" };

export default async function MembersPage() {
  const { user, workspace, role } = await requireWorkspace();
  const members = await getMembersWithStats(workspace.id);
  return (
    <MembersView members={members} currentUserId={user.id} currentRole={role} />
  );
}
