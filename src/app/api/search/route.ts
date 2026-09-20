import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { searchWorkspace } from "@/lib/queries";
import { consumeRateLimit } from "@/lib/rate-limit";
import { getActiveWorkspace } from "@/lib/session";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ tasks: [], projects: [] }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim() ?? "";
  if (q.length > 80) return NextResponse.json({ tasks: [], projects: [] }, { status: 400 });
  if (!(await consumeRateLimit(`search:${session.user.id}`, 60, 60 * 1000))) return NextResponse.json({ tasks: [], projects: [] }, { status: 429 });
  const ctx = await getActiveWorkspace(session.user.id);
  if (!ctx || q.length === 0) {
    return NextResponse.json({ tasks: [], projects: [] });
  }
  return NextResponse.json(await searchWorkspace(ctx.workspace.id, q));
}
