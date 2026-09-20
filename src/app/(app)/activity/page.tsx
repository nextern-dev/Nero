import { Activity } from "lucide-react";
import type { Metadata } from "next";
import { ActivityTimeline } from "@/components/activity-feed";
import { EmptyState } from "@/components/ui";
import { getActivityFeed } from "@/lib/queries";
import { requireWorkspace } from "@/lib/session";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Activity" };

export default async function ActivityPage() {
  const { workspace } = await requireWorkspace();
  const items = await getActivityFeed(workspace.id, 60);

  return (
    <div className="pt-8 pb-10">
      <header className="mb-8">
          <h1 className="font-display text-[32px] font-medium tracking-tight text-ink-50 italic">
            Activity
          </h1>
        <p className="mt-1 text-sm text-ink-400">
          Everything happening in {workspace.name}, newest first.
        </p>
      </header>

      {items.length === 0 ? (
        <EmptyState
          icon={Activity}
          title="No activity yet"
          body="As your team creates, moves and completes tasks, a full timeline appears here."
        />
      ) : (
        <ActivityTimeline items={items} />
      )}
    </div>
  );
}
