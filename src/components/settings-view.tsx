"use client";

import { Building2, Check, Command, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { renameWorkspace, updateProfile } from "@/actions/workspace";
import { Avatar } from "@/components/avatar";
import { Button, Card, Field } from "@/components/ui";
import type { Role } from "@/db/schema";
import { AVATAR_COLORS } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function SettingsView({
  workspaceName,
  role,
  user,
}: {
  workspaceName: string;
  role: Role;
  user: { id: string; name: string; email: string; color: string };
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [wsName, setWsName] = useState(workspaceName);
  const [name, setName] = useState(user.name);
  const [color, setColor] = useState(user.color);
  const canEditWorkspace = role !== "member";

  return (
    <div className="max-w-3xl pt-8 pb-10">
      <header className="mb-8">
        <h1 className="font-display text-[32px] font-medium tracking-tight text-ink-50 italic">
          Settings
        </h1>
        <p className="mt-1 text-sm text-ink-400">
          Tune your workspace and your personal profile.
        </p>
      </header>

      <div className="space-y-4">
        {/* Workspace */}
        <Card className="p-6">
          <div className="mb-5 flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.07] bg-white/[0.03] text-brand-400">
              <Building2 className="h-4 w-4" />
            </span>
            <div>
              <h2 className="text-[15px] font-semibold text-ink-50">
                Workspace
              </h2>
              <p className="text-xs text-ink-500">
                Visible to every member of the workspace.
              </p>
            </div>
            {!canEditWorkspace && (
              <span className="ml-auto rounded-full border border-white/[0.08] px-2.5 py-1 text-[10.5px] text-ink-500">
                Members can&apos;t edit
              </span>
            )}
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <Field label="Workspace name">
                <input
                  className="input"
                  value={wsName}
                  disabled={!canEditWorkspace}
                  onChange={(e) => setWsName(e.target.value)}
                  maxLength={60}
                />
              </Field>
            </div>
            <Button
              size="md"
              disabled={!canEditWorkspace}
              loading={pending}
              onClick={() =>
                startTransition(async () => {
                  const res = await renameWorkspace({ name: wsName });
                  if (!res.ok) {
                    toast.error(res.error);
                    return;
                  }
                  toast.success("Workspace renamed");
                  router.refresh();
                })
              }
            >
              Save workspace
            </Button>
          </div>
        </Card>

        {/* Profile */}
        <Card className="p-6">
          <div className="mb-5 flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.07] bg-white/[0.03] text-brand-400">
              <UserRound className="h-4 w-4" />
            </span>
            <div>
              <h2 className="text-[15px] font-semibold text-ink-50">Profile</h2>
              <p className="text-xs text-ink-500">
                How you appear across boards, comments and activity.
              </p>
            </div>
          </div>

          <div className="mb-4 flex items-center gap-4">
            <Avatar user={{ name, color }} size={52} />
            <div>
              <p className="text-[13px] font-medium text-ink-100">{name}</p>
              <p className="text-[11.5px] text-ink-500">{user.email}</p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Display name">
              <input
                className="input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={60}
              />
            </Field>
            <Field label="Avatar color">
              <div className="flex flex-wrap items-center gap-2 pt-1">
                {AVATAR_COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    className={cn(
                      "flex h-7 w-7 items-center justify-center rounded-full transition-all",
                      color === c
                        ? "ring-2 ring-white/70 ring-offset-2 ring-offset-ink-900"
                        : "opacity-60 hover:opacity-100",
                    )}
                    style={{ backgroundColor: c }}
                    aria-label={`Pick ${c}`}
                  >
                    {color === c && (
                      <Check className="h-3.5 w-3.5 text-ink-950" />
                    )}
                  </button>
                ))}
              </div>
            </Field>
          </div>

          <div className="mt-5 flex justify-end">
            <Button
              size="md"
              loading={pending}
              onClick={() =>
                startTransition(async () => {
                  const res = await updateProfile({ name, color });
                  if (!res.ok) {
                    toast.error(res.error);
                    return;
                  }
                  toast.success("Profile updated");
                  router.refresh();
                })
              }
            >
              Save profile
            </Button>
          </div>
        </Card>

        {/* Shortcuts */}
        <Card className="p-6">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.07] bg-white/[0.03] text-brand-400">
              <Command className="h-4 w-4" />
            </span>
            <div>
              <h2 className="text-[15px] font-semibold text-ink-50">
                Keyboard
              </h2>
              <p className="text-xs text-ink-500">
                One shortcut today, more on the way.
              </p>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">
            <span className="text-[13px] text-ink-200">
              Open the command palette
            </span>
            <span className="kbd">⌘K</span>
          </div>
        </Card>
      </div>
    </div>
  );
}
