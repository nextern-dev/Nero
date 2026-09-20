import type { Metadata } from "next";
import { SettingsView } from "@/components/settings-view";
import { requireWorkspace } from "@/lib/session";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const { user, workspace, role } = await requireWorkspace();
  return (
    <SettingsView
      workspaceName={workspace.name}
      role={role}
      user={{
        id: user.id,
        name: user.name,
        email: user.email,
        color: user.color,
      }}
    />
  );
}
