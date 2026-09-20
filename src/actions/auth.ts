"use server";

import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { AuthError } from "next-auth";
import { signIn, signOut } from "@/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { provisionUser } from "@/lib/provision";
import { consumeRateLimit } from "@/lib/rate-limit";
import {
  loginSchema,
  registerSchema,
  zodError,
  type ActionResult,
} from "@/lib/validations";

export async function register(input: unknown): Promise<ActionResult> {
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: zodError(parsed.error) };
  const { name, email, password } = parsed.data;
  if (!(await consumeRateLimit(`register:${email}`, 5, 60 * 60 * 1000))) return { ok: false, error: "Too many registration attempts. Try again later." };

  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  if (existing)
    return { ok: false, error: "An account with this email already exists" };

  const passwordHash = await bcrypt.hash(password, 10);
  await provisionUser({ name, email, passwordHash });

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: "/dashboard",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { ok: false, error: "Account created — please sign in" };
    }
    throw error; // NEXT_REDIRECT on success
  }
  return { ok: true };
}

export async function login(input: unknown): Promise<ActionResult> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: zodError(parsed.error) };
  if (!(await consumeRateLimit(`login-action:${parsed.data.email}`, 10, 15 * 60 * 1000))) return { ok: false, error: "Too many login attempts. Try again later." };

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: "/dashboard",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { ok: false, error: "Invalid email or password" };
    }
    throw error;
  }
  return { ok: true };
}

export async function loginWithGoogle(): Promise<ActionResult> {
  if (!process.env.AUTH_GOOGLE_ID || !process.env.AUTH_GOOGLE_SECRET) {
    return {
      ok: false,
      error:
        "Google sign-in isn't configured on this deployment. Set AUTH_GOOGLE_ID and AUTH_GOOGLE_SECRET to enable it.",
    };
  }
  await signIn("google", { redirectTo: "/dashboard" });
  return { ok: true };
}

export async function logout() {
  await signOut({ redirectTo: "/login" });
}
