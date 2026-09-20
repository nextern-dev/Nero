"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { createProject } from "@/actions/projects";
import { Modal } from "@/components/modal";
import { Button, Field } from "@/components/ui";
import { PROJECT_COLORS } from "@/lib/constants";
import { cn, suggestKey } from "@/lib/utils";
import { useUI } from "@/store/ui";

export function NewProjectModal() {
  const { newProjectOpen, setNewProjectOpen } = useUI();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  // The form unmounts whenever the modal closes, so initial state is the
  // reset state — no effect needed.
  const [name, setName] = useState("");
  const [key, setKey] = useState("");
  const [keyTouched, setKeyTouched] = useState(false);
  const [description, setDescription] = useState("");
  const [color, setColor] = useState(
    () => PROJECT_COLORS[Math.floor(Math.random() * 4)],
  );
  const [dueDate, setDueDate] = useState("");

  const submit = () => {
    startTransition(async () => {
      const res = await createProject({
        name,
        key,
        description,
        color,
        dueDate: dueDate || null,
      });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(`${name} created`);
      setNewProjectOpen(false);
      router.push(`/projects/${res.data!.id}`);
    });
  };

  return (
    <Modal
      open={newProjectOpen}
      onClose={() => setNewProjectOpen(false)}
      title="Create a project"
      subtitle="Projects hold boards, tasks, labels and their own timeline."
      width="max-w-md"
    >
      <form
        className="space-y-4 px-6 py-5"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <Field label="Project name">
          <input
            className="input"
            placeholder="e.g. Nero Web App"
            value={name}
            autoFocus
            onChange={(e) => {
              setName(e.target.value);
              if (!keyTouched) setKey(suggestKey(e.target.value));
            }}
            maxLength={80}
          />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Key" hint="2–5 chars">
            <input
              className="input font-mono uppercase"
              placeholder="NER"
              value={key}
              onChange={(e) => {
                setKeyTouched(true);
                setKey(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""));
              }}
              maxLength={5}
            />
          </Field>
          <Field label="Target date" hint="optional">
            <input
              type="date"
              className="input"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </Field>
        </div>

        <Field label="Description" hint="optional">
          <textarea
            className="input min-h-[72px] resize-none"
            placeholder="What is this project about?"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={280}
          />
        </Field>

        <Field label="Color">
          <div className="flex flex-wrap gap-2 pt-0.5">
            {PROJECT_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={cn(
                  "h-7 w-7 rounded-full transition-all",
                  color === c
                    ? "ring-2 ring-white/70 ring-offset-2 ring-offset-ink-900"
                    : "opacity-60 hover:opacity-100",
                )}
                style={{ backgroundColor: c }}
                aria-label={`Color ${c}`}
              />
            ))}
          </div>
        </Field>

        <div className="flex items-center justify-end gap-2 pt-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setNewProjectOpen(false)}
          >
            Cancel
          </Button>
          <Button type="submit" size="sm" loading={pending}>
            Create project
          </Button>
        </div>
      </form>
    </Modal>
  );
}
