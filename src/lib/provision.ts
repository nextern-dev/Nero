import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { db } from "@/db";
import { users, workspaceMembers, workspaces } from "@/db/schema";
import { AVATAR_COLORS } from "@/lib/constants";
import { sendWelcomeEmail } from "@/lib/email";
import { createStarterProject } from "@/lib/onboard";
import { slugify } from "@/lib/utils";

/**
 * Creates a user with their own workspace and the guided starter project.
 * Shared by email registration and OAuth first-sign-in.
 */
export async function provisionUser({
  name,
  email,
  passwordHash,
}: {
  name: string;
  email: string;
  passwordHash: string;
}) {
  const color = AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];

  const [user] = await db
    .insert(users)
    .values({ name, email, passwordHash, color })
    .returning();

  const slug = `${slugify(name) || "workspace"}-${Math.random()
    .toString(36)
    .slice(2, 7)}`;
  const [workspace] = await db
    .insert(workspaces)
    .values({ name: `${name.split(" ")[0]}'s Workspace`, slug })
    .returning();
  await db
    .insert(workspaceMembers)
    .values({ workspaceId: workspace.id, userId: user.id, role: "owner" });

  await createStarterProject(workspace.id, user.id);
  void sendWelcomeEmail(email, name);

  return { user, workspace };
}

/** Password placeholder for OAuth accounts (they never sign in with it). */
export function randomPasswordHash() {
  return bcrypt.hash(randomBytes(24).toString("hex"), 10);
}
