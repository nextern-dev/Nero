"use client";

import { format } from "date-fns";
import { Crown, MailPlus, ShieldCheck, Trash2, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  addMember,
  changeMemberRole,
  removeMember,
} from "@/actions/workspace";
import { Avatar } from "@/components/avatar";
import { Button, Card } from "@/components/ui";
import type { Role } from "@/db/schema";
import type { MemberDTO } from "@/lib/types";
import { cn } from "@/lib/utils";

const ROLE_STYLE: Record<Role, { icon: typeof Crown; cls: string }> = {
  owner: {
    icon: Crown,
    cls: "border-brand-500/30 bg-brand-500/10 text-brand-300",
  },
  admin: {
    icon: ShieldCheck,
    cls: "border-violet-400/30 bg-violet-400/10 text-violet-300",
  },
  member: {
    icon: User,
    cls: "border-white/[0.1] bg-white/[0.04] text-ink-300",
  },
};

export function MembersView({
  members,
  currentUserId,
  currentRole,
}: {
  members: MemberDTO[];
  currentUserId: string;
  currentRole: Role;
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const canManage = currentRole !== "member";

  const invite = (e?: React.FormEvent) => {
    e?.preventDefault();
    startTransition(async () => {
      const res = await addMember({ email });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      setEmail("");
      if (res.data?.invited) {
        toast.success("Invite email sent", {
          description:
            "They'll join the workspace once they create an account.",
        });
      } else {
        toast.success(`${res.data?.name ?? "Member"} added to the workspace`);
        router.refresh();
      }
    });
  };

  return (
    <div className="pt-8">
      <header className="animate-mount mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-[32px] font-medium tracking-tight text-ink-50 italic">
            Members
          </h1>
          <p className="mt-1 text-sm text-ink-400">
            {members.length} {members.length === 1 ? "person" : "people"} in
            this workspace
          </p>
        </div>
      </header>

      {canManage && (
        <Card className="mb-6 p-4">
          <form
            onSubmit={invite}
            className="flex flex-col gap-3 sm:flex-row sm:items-center"
          >
            <div className="relative flex-1">
              <MailPlus className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-ink-500" />
              <input
                className="input pl-9"
                type="email"
                placeholder="Teammate's email — existing users join instantly, others get an invite"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <Button type="submit" size="md" loading={pending}>
              Add member
            </Button>
          </form>
          <p className="mt-2.5 text-[11.5px] text-ink-500">
            Invites are delivered with Resend when{" "}
            <span className="font-mono text-ink-400">RESEND_API_KEY</span> is
            configured.
          </p>
        </Card>
      )}

      <Card className="animate-mount overflow-hidden" >

        <div className="hidden grid-cols-[1.6fr_110px_120px_120px_44px] gap-3 border-b border-white/[0.06] bg-ink-850/50 px-5 py-2.5 text-[10.5px] font-medium tracking-wider text-ink-500 uppercase md:grid">
          <span>Member</span>
          <span>Role</span>
          <span>Open</span>
          <span>Done</span>
          <span />
        </div>
        <div className="divide-y divide-white/[0.05]">
          {members.map((m) => {
            const style = ROLE_STYLE[m.role];
            const Icon = style.icon;
            const isSelf = m.id === currentUserId;
            return (
              <div
                key={m.membershipId}
                className="grid grid-cols-[1fr_auto] items-center gap-3 px-5 py-3.5 transition-colors hover:bg-white/[0.015] md:grid-cols-[1.6fr_110px_120px_120px_44px]"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar user={m} size={34} />
                  <div className="min-w-0">
                    <p className="truncate text-[13.5px] font-medium text-ink-50">
                      {m.name}
                      {isSelf && (
                        <span className="ml-2 text-[10.5px] text-ink-500">
                          (you)
                        </span>
                      )}
                    </p>
                    <p className="truncate text-[11.5px] text-ink-500">
                      {m.email} · joined {format(new Date(m.joinedAt), "MMM yyyy")}
                    </p>
                  </div>
                </div>

                <div>
                  {currentRole === "owner" && m.role !== "owner" ? (
                    <select
                      className={cn(
                        "cursor-pointer rounded-full border px-2.5 py-1 text-[11px] font-medium outline-none",
                        style.cls,
                      )}
                      value={m.role}
                      onChange={(e) => {
                        const role = e.target.value as "admin" | "member";
                        startTransition(async () => {
                          const res = await changeMemberRole({
                            membershipId: m.membershipId,
                            role,
                          });
                          if (!res.ok) toast.error(res.error);
                          else {
                            toast.success("Role updated");
                            router.refresh();
                          }
                        });
                      }}
                    >
                      <option value="admin">admin</option>
                      <option value="member">member</option>
                    </select>
                  ) : (
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium",
                        style.cls,
                      )}
                    >
                      <Icon className="h-3 w-3" />
                      {m.role}
                    </span>
                  )}
                </div>

                <span className="hidden text-[12.5px] text-ink-300 tabular-nums md:block">
                  {m.openTasks}{" "}
                  <span className="text-ink-600">task{m.openTasks === 1 ? "" : "s"}</span>
                </span>
                <span className="hidden text-[12.5px] text-ink-300 tabular-nums md:block">
                  {m.doneTasks}{" "}
                  <span className="text-ink-600">done</span>
                </span>

                <div className="flex justify-end">
                  {canManage && !isSelf && m.role !== "owner" && (
                    <>
                      {confirmId === m.membershipId ? (
                        <span className="flex gap-1">
                          <button
                            onClick={() => {
                              setConfirmId(null);
                              startTransition(async () => {
                                const res = await removeMember(m.membershipId);
                                if (!res.ok) toast.error(res.error);
                                else {
                                  toast.success(`${m.name} removed`);
                                  router.refresh();
                                }
                              });
                            }}
                            className="rounded-md bg-rose-500/20 px-2 py-1 text-[10.5px] font-medium text-rose-200 hover:bg-rose-500/30"
                          >
                            Confirm
                          </button>
                          <button
                            onClick={() => setConfirmId(null)}
                            className="rounded-md px-2 py-1 text-[10.5px] text-ink-400 hover:bg-white/[0.05]"
                          >
                            No
                          </button>
                        </span>
                      ) : (
                        <button
                          onClick={() => setConfirmId(m.membershipId)}
                          className="rounded-lg p-1.5 text-ink-600 transition-colors hover:bg-rose-500/10 hover:text-rose-300"
                          aria-label={`Remove ${m.name}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
