import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Board } from "@/components/board/board";
import { getBoard } from "@/lib/queries";
import { requireProjectAccess, requireUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Board" };

export default async function ProjectBoardPage({
  params,
  searchParams,
}: {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{ task?: string }>;
}) {
  const [{ projectId }, { task: openTaskId }] = await Promise.all([
    params,
    searchParams,
  ]);

  const user = await requireUser();
  try {
    await requireProjectAccess(user.id, projectId);
  } catch {
    notFound();
  }

  const data = await getBoard(projectId);
  if (!data) notFound();

  return (
    <Board
      data={data}
      currentUserId={user.id}
      initialOpenTaskId={openTaskId ?? null}
    />
  );
}
