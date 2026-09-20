import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { z } from "zod";
import { db } from "@/db";
import { users } from "@/db/schema";
import { provisionUser, randomPasswordHash } from "@/lib/provision";
import { consumeRateLimit } from "@/lib/rate-limit";

const authSecret = process.env.AUTH_SECRET;
if (!authSecret) throw new Error("AUTH_SECRET is required");

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const googleConfigured = Boolean(
  process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET,
);

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  trustHost: true,
  secret: authSecret,
  providers: [
    ...(googleConfigured
      ? [
          Google({
            clientId: process.env.AUTH_GOOGLE_ID!,
            clientSecret: process.env.AUTH_GOOGLE_SECRET!,
          }),
        ]
      : []),
    Credentials({
      name: "Email",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (raw) => {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) return null;

        const email = parsed.data.email.toLowerCase().trim();
        if (!(await consumeRateLimit(`login:${email}`, 10, 15 * 60 * 1000))) return null;
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.email, email))
          .limit(1);

        if (!user) return null;
        const valid = await bcrypt.compare(
          parsed.data.password,
          user.passwordHash,
        );
        if (!valid) return null;

        return { id: user.id, name: user.name, email: user.email };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      // OAuth first sign-in: provision a Nero account + workspace so the
      // session maps to a real row in our own users table.
      if (
        account &&
        account.provider !== "credentials" &&
        user.email
      ) {
        const email = user.email.toLowerCase();
        const [existing] = await db
          .select({ id: users.id })
          .from(users)
          .where(eq(users.email, email))
          .limit(1);
        if (!existing) {
          const name = user.name?.trim() || email.split("@")[0];
          await provisionUser({
            name,
            email,
            passwordHash: await randomPasswordHash(),
          });
        }
      }
      return true;
    },
    async jwt({ token, user, account }) {
      if (user?.id) token.uid = user.id as string;
      // For OAuth, Auth.js' user id is not our DB id — resolve it by email.
      if (account && account.provider !== "credentials" && token.email) {
        const [dbUser] = await db
          .select({ id: users.id })
          .from(users)
          .where(eq(users.email, token.email.toLowerCase()))
          .limit(1);
        if (dbUser) token.uid = dbUser.id;
      }
      return token;
    },
    session({ session, token }) {
      if (token.uid && session.user) session.user.id = token.uid as string;
      return session;
    },
  },
});
