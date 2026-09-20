"use server";

import { and, eq, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { db } from "@/db";
import { users, workspaceMembers, workspaces } from "@/db/schema";
import { logActivity } from "@/lib/activity";
import { sendInviteEmail } from "@/lib/email";
import { requireUser, requireWorkspace, WS_COOKIE } from "@/lib/session";
import {
  memberAddSchema,
  memberRoleSchema,
  profileUpdateSchema,
  workspaceUpdateSchema,
  zodError,
  type ActionResult,
} from "@/lib/validations";

function err(error: unknown) {
  return {
    ok: false as const,
    error: error instanceof Error ? error.message : "Something went wrong",
  };
}

export async function renameWorkspace(input: unknown): Promise<ActionResult> {
  try {
    const ctx = await requireWorkspace();
    if (ctx.role === "member")
      return { ok: false, error: "Only owners and admins can rename the workspace" };
    const parsed = workspaceUpdateSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: zodError(parsed.error) };

    await db
      .update(workspaces)
      .set({ name: parsed.data.name })
      .where(eq(workspaces.id, ctx.workspace.id));

    revalidatePath("/", "layout");
    return { ok: true };
  } catch (error) {
    return err(error);
  }
}

export async function updateProfile(input: unknown): Promise<ActionResult> {
  try {
    const user = await requireUser();
    const parsed = profileUpdateSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: zodError(parsed.error) };

    await db
      .update(users)
      .set({ name: parsed.data.name, color: parsed.data.color })
      .where(eq(users.id, user.id));

    revalidatePath("/", "layout");
    return { ok: true };
  } catch (error) {
    return err(error);
  }
}

export async function switchWorkspace(workspaceId: string): Promise<ActionResult> {
  try {
    const user = await requireUser();
    const [membership] = await db
      .select()
      .from(workspaceMembers)
      .where(
        and(
          eq(workspaceMembers.workspaceId, workspaceId),
          eq(workspaceMembers.userId, user.id),
        ),
      )
      .limit(1);
    if (!membership) return { ok: false, error: "Not a member of that workspace" };

    const store = await cookies();
    store.set(WS_COOKIE, workspaceId, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (error) {
    return err(error);
  }
}

export async function addMember(
  input: unknown,
): Promise<ActionResult<{ invited: boolean; name?: string }>> {
  try {
    const ctx = await requireWorkspace();
    if (ctx.role === "member")
      return { ok: false, error: "Only owners and admins can add members" };
    const parsed = memberAddSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: zodError(parsed.error) };
    const email = parsed.data.email;

    const [invitee] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!invitee) {
      await sendInviteEmail(email, {
        workspaceName: ctx.workspace.name,
        inviterName: ctx.user.name,
      });
      return {
        ok: true,
        data: { invited: true },
      };
    }

    const [existing] = await db
      .select()
      .from(workspaceMembers)
      .where(
        and(
          eq(workspaceMembers.workspaceId, ctx.workspace.id),
          eq(workspaceMembers.userId, invitee.id),
        ),
      )
      .limit(1);
    if (existing)
      return { ok: false, error: `${invitee.name} is already in this workspace` };

    await db.insert(workspaceMembers).values({
      workspaceId: ctx.workspace.id,
      userId: invitee.id,
      role: "member",
    });

    await logActivity({
      workspaceId: ctx.workspace.id,
      userId: ctx.user.id,
      action: "member.joined",
      meta: { name: invitee.name },
    });

    revalidatePath("/members");
    return { ok: true, data: { invited: false, name: invitee.name } };
  } catch (error) {
    return err(error);
  }
}

export async function removeMember(membershipId: string): Promise<ActionResult> {
  try {
    const ctx = await requireWorkspace();
    if (ctx.role === "member")
      return { ok: false, error: "Only owners and admins can remove members" };

    const [target] = await db
      .select()
      .from(workspaceMembers)
      .where(
        and(
          eq(workspaceMembers.id, membershipId),
          eq(workspaceMembers.workspaceId, ctx.workspace.id),
        ),
      )
      .limit(1);
    if (!target) return { ok: false, error: "Member not found" };
    if (target.userId === ctx.user.id && ctx.role === "owner")
      return { ok: false, error: "Owners can't remove themselves" };
    if (target.role === "owner")
      return { ok: false, error: "You can't remove the workspace owner" };

    await db
      .delete(workspaceMembers)
      .where(eq(workspaceMembers.id, membershipId));
    revalidatePath("/members");
    return { ok: true };
  } catch (error) {
    return err(error);
  }
}

export async function changeMemberRole(input: unknown): Promise<ActionResult> {
  try {
    const ctx = await requireWorkspace();
    if (ctx.role !== "owner")
      return { ok: false, error: "Only the owner can change roles" };
    const parsed = memberRoleSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: zodError(parsed.error) };

    await db
      .update(workspaceMembers)
      .set({ role: parsed.data.role })
      .where(
        and(
          eq(workspaceMembers.id, parsed.data.membershipId),
          eq(workspaceMembers.workspaceId, ctx.workspace.id),
          ne(workspaceMembers.role, "owner"),
        ),
      );
    revalidatePath("/members");
    return { ok: true };
  } catch (error) {
    return err(error);
  }
}
