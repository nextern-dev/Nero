import {
  BarChart3,
  Command,
  KanbanSquare,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { Logo, LogoMark } from "@/components/logo";
import { getSessionUser } from "@/lib/session";

const HIGHLIGHTS = [
  {
    icon: KanbanSquare,
    no: "01",
    title: "Boards that feel instant",
    body: "Drag, drop, reorder — optimistic updates, zero spinners.",
  },
  {
    icon: Command,
    no: "02",
    title: "Command palette",
    body: "⌘K to fly between tasks, projects and actions.",
  },
  {
    icon: BarChart3,
    no: "03",
    title: "Built-in charts",
    body: "Tasks completed per day and open work by column, out of the box.",
  },
  {
    icon: ShieldCheck,
    no: "04",
    title: "Secure by default",
    body: "Auth.js sessions, hashed passwords, role-based access.",
  },
];

export default async function AuthLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await getSessionUser();
  if (user) redirect("/dashboard");

  return (
    <div className="noise relative flex min-h-screen bg-ink-950">
      {/* Brand panel */}
      <div className="relative hidden w-[46%] overflow-hidden border-r border-ink-50/8 lg:flex lg:flex-col">
        <div className="bg-ruled absolute inset-0 opacity-70" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_30%_10%,rgba(255,90,36,0.13),transparent_60%)]" />
        <div className="absolute right-[-140px] bottom-[-140px] h-[380px] w-[380px] rounded-full bg-brand-500/[0.08] blur-[100px]" />

        <div className="relative z-10 flex h-full flex-col p-10 xl:p-14">
          <Link href="/" className="w-fit">
            <Logo size={24} />
          </Link>

          <div className="mt-16 xl:mt-20">
            <p className="folio mb-6">Open source · Next.js 16 · PostgreSQL</p>
            <p className="max-w-md font-display text-[30px] leading-[1.15] font-medium tracking-tight text-ink-50 italic xl:text-[36px]">
              Project management,
              <br />
              <span className="text-gradient-brand">as a fine art.</span>
            </p>
          </div>

          <div className="mt-auto space-y-5">
            {HIGHLIGHTS.map(({ icon: Icon, no, title, body }) => (
              <div key={title} className="flex items-start gap-4">
                <span className="w-6 shrink-0 pt-0.5 font-mono text-[10px] text-ink-600">
                  {no}
                </span>
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-ink-50/10 bg-ink-50/[0.03] text-brand-400">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-[13.5px] font-medium text-ink-100">
                      {title}
                    </p>
                    <p className="text-xs leading-relaxed text-ink-400">
                      {body}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-14 flex items-center gap-3 border-t border-ink-50/[0.07] pt-6">
            <LogoMark size={16} />
            <p className="font-display text-[12.5px] text-ink-500 italic">
              Set in Fraunces & Geist. Printed on pixels.
            </p>
          </div>
        </div>
      </div>

      {/* Form side */}
      <div className="relative flex flex-1 items-center justify-center px-4 py-10 sm:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_0%,rgba(255,90,36,0.08),transparent_70%)] lg:hidden" />
        <div className="relative z-10 w-full max-w-[400px]">{children}</div>
      </div>
    </div>
  );
}
