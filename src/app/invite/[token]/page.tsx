import Link from "next/link";
import { redirect } from "next/navigation";
import { acceptInvitation } from "@/actions/workspace";
import { getSessionUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function InvitationPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const user = await getSessionUser();

  if (!user) {
    const encoded = encodeURIComponent(token);
    return (
      <main className="mx-auto flex min-h-screen max-w-xl items-center justify-center p-6">
        <div className="card w-full p-8">
          <h1 className="font-display text-2xl italic text-ink-50">Workspace invitation</h1>
          <p className="mt-3 text-sm text-ink-400">Sign in or create an account with the invited email, then return to this invitation link.</p>
          <div className="mt-6 flex gap-3">
            <Link className="btn-primary" href={"/login?callbackUrl=/invite/" + encoded}>Sign in</Link>
            <Link className="btn-secondary" href={"/register?callbackUrl=/invite/" + encoded}>Create account</Link>
          </div>
        </div>
      </main>
    );
  }

  async function accept() {
    "use server";
    const result = await acceptInvitation(token);
    if (!result.ok) throw new Error(result.error);
    redirect("/members");
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-xl items-center justify-center p-6">
      <div className="card w-full p-8">
        <h1 className="font-display text-2xl italic text-ink-50">Join workspace</h1>
        <p className="mt-3 text-sm text-ink-400">Accept this invitation using {user.email}.</p>
        <form action={accept} className="mt-6">
          <button className="btn-primary" type="submit">Accept invitation</button>
        </form>
      </div>
    </main>
  );
}
