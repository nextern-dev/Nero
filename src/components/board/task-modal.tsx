"use client";

import { format } from "date-fns";
import {
  CalendarClock,
  CheckCircle2,
  CircleDashed,
  Send,
  Tag,
  Trash2,
  User as UserIcon,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useEffectEvent, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  addComment,
  createTask,
  deleteComment,
  deleteTask,
  updateTask,
} from "@/actions/tasks";
import { Avatar } from "@/components/avatar";
import { Modal } from "@/components/modal";
import { PriorityIcon } from "@/components/priority";
import { Button } from "@/components/ui";
import type { Priority } from "@/db/schema";
import { PRIORITIES } from "@/lib/constants";
import type {
  ColumnDTO,
  CommentDTO,
  LabelDTO,
  ProjectDTO,
  TaskDTO,
  UserDTO,
} from "@/lib/types";
import { cn, timeAgo } from "@/lib/utils";

export function TaskModal({
  open,
  onClose,
  task,
  createColumnId,
  project,
  columns,
  labels,
  members,
  currentUserId,
  onLocalChange,
  onLocalDelete,
}: {
  open: boolean;
  onClose: () => void;
  task: TaskDTO | null; // null → create mode
  createColumnId: string | null;
  project: ProjectDTO;
  columns: { id: string; name: string }[];
  labels: LabelDTO[];
  members: UserDTO[];
  currentUserId: string;
  onLocalChange: (taskId: string, patch: Partial<TaskDTO>) => void;
  onLocalDelete: (taskId: string) => void;
}) {
  const router = useRouter();
  const isCreate = !task;
  const [pending, startTransition] = useTransition();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [columnId, setColumnId] = useState(columns[0]?.id ?? "");
  const [priority, setPriority] = useState<Priority>("none");
  const [assigneeId, setAssigneeId] = useState("");
  const [due, setDue] = useState("");
  const [labelIds, setLabelIds] = useState<string[]>([]);
  const [comments, setComments] = useState<CommentDTO[]>([]);
  const [commentDraft, setCommentDraft] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  const resetForm = useEffectEvent(() => {
    if (!open) return;
    setTitle(task?.title ?? "");
    setDescription(task?.description ?? "");
    setColumnId(task?.columnId ?? createColumnId ?? columns[0]?.id ?? "");
    setPriority(task?.priority ?? "none");
    setAssigneeId(task?.assignee?.id ?? "");
    setDue(task?.dueDate ? format(new Date(task.dueDate), "yyyy-MM-dd") : "");
    setLabelIds(task?.labels.map((l) => l.id) ?? []);
    setComments(task?.comments ?? []);
    setCommentDraft("");
    setConfirmDelete(false);
  });

  const syncComments = useEffectEvent((nextComments: CommentDTO[]) => {
    setComments(nextComments);
  });

  useEffect(() => {
    if (!open) return;
    const timeout = window.setTimeout(resetForm, 0);
    return () => window.clearTimeout(timeout);
  }, [open, task?.id]);

  const taskComments = task?.comments;
  const taskId = task?.id;

  useEffect(() => {
    if (!taskComments) return;
    const timeout = window.setTimeout(() => syncComments(taskComments), 0);
    return () => window.clearTimeout(timeout);
  }, [taskComments, taskId]);

  const save = (api: Record<string, unknown>, display: Partial<TaskDTO>) => {
    if (!task) return;
    onLocalChange(task.id, display);
    startTransition(async () => {
      const res = await updateTask({ taskId: task.id, ...api });
      if (!res.ok) {
        toast.error(res.error);
        router.refresh();
      }
    });
  };

  const toggleLabel = (id: string) => {
    const next = labelIds.includes(id)
      ? labelIds.filter((l) => l !== id)
      : [...labelIds, id];
    setLabelIds(next);
    if (task) {
      save(
        { labelIds: next },
        { labels: next.map((l) => labels.find((x) => x.id === l)!) },
      );
    }
  };

  const submitCreate = () => {
    if (!title.trim()) {
      toast.error("Give the task a title");
      return;
    }
    startTransition(async () => {
      const res = await createTask({
        projectId: project.id,
        columnId,
        title: title.trim(),
        description: description.trim(),
        priority,
        assigneeId: assigneeId || null,
        dueDate: due || null,
        labelIds,
      });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("Task created");
      onClose();
    });
  };

  const postComment = () => {
    const body = commentDraft.trim();
    if (!body || !task) return;
    setCommentDraft("");
    startTransition(async () => {
      const res = await addComment({ taskId: task.id, body });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      setComments((prev) => [...prev, res.data!]);
    });
  };

  const done = !!task?.completedAt;

  return (
    <Modal open={open} onClose={onClose} width="max-w-3xl">
      {/* Top bar */}
      <div className="flex items-center gap-2 border-b border-white/[0.06] px-6 py-3">
        <span
          className="rounded-md border px-2 py-0.5 font-mono text-[11px] font-medium"
          style={{
            color: project.color,
            borderColor: `${project.color}44`,
            backgroundColor: `${project.color}14`,
          }}
        >
          {project.key}-{task?.number ?? "new"}
        </span>
        {task?.creator && (
          <span className="hidden text-[11.5px] text-ink-500 sm:block">
            opened by {task.creator.name} · {timeAgo(task.createdAt)}
          </span>
        )}
        <span className="flex-1" />
        {!isCreate && (
          <button
            onClick={() =>
              save(
                { completed: !done },
                { completedAt: done ? null : new Date().toISOString() },
              )
            }
            className={cn(
              "flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[12px] font-medium transition-colors",
              done
                ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300 hover:bg-emerald-400/20"
                : "border-white/[0.1] text-ink-300 hover:border-emerald-400/40 hover:text-emerald-300",
            )}
          >
            {done ? (
              <CheckCircle2 className="h-3.5 w-3.5" />
            ) : (
              <CircleDashed className="h-3.5 w-3.5" />
            )}
            {done ? "Completed" : "Mark complete"}
          </button>
        )}
        <button
          onClick={onClose}
          className="rounded-lg p-1.5 text-ink-400 transition-colors hover:bg-white/[0.06] hover:text-ink-100"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="grid md:grid-cols-[1fr_235px]">
        {/* Main */}
        <div className="px-6 py-5 md:border-r md:border-white/[0.06]">
          <input
            className="w-full border-b border-transparent bg-transparent pb-2 text-[19px] font-semibold tracking-tight text-ink-50 outline-none transition-colors placeholder:text-ink-600 focus:border-brand-500/50"
            placeholder="Task title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={() => {
              if (task && title.trim() && title !== task.title)
                save({ title: title.trim() }, { title: title.trim() });
            }}
            maxLength={160}
          />

          <p className="mt-5 mb-1.5 text-[11px] font-medium tracking-wider text-ink-500 uppercase">
            Description
          </p>
          <textarea
            className="input min-h-[150px] resize-y text-[13.5px] leading-relaxed"
            placeholder="Add context, links, acceptance criteria…"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onBlur={() => {
              if (task && description !== (task.description ?? ""))
                save({ description }, { description: description || null });
            }}
          />

          {!isCreate && (
            <>
              <p className="mt-6 mb-3 text-[11px] font-medium tracking-wider text-ink-500 uppercase">
                Comments{" "}
                <span className="text-ink-600 normal-case">
                  ({comments.length})
                </span>
              </p>
              <div className="space-y-4">
                {comments.map((c) => (
                  <div key={c.id} className="group flex gap-2.5">
                    <Avatar user={c.author} size={26} className="mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline gap-2">
                        <span className="text-[12.5px] font-medium text-ink-100">
                          {c.author.name}
                        </span>
                        <span className="text-[10.5px] text-ink-500">
                          {timeAgo(c.createdAt)}
                        </span>
                        {c.author.id === currentUserId && (
                          <button
                            onClick={() => {
                              setComments((prev) =>
                                prev.filter((x) => x.id !== c.id),
                              );
                              startTransition(async () => {
                                const res = await deleteComment(c.id);
                                if (!res.ok) toast.error(res.error);
                              });
                            }}
                            className="rounded p-0.5 text-ink-600 opacity-0 transition-all group-hover:opacity-100 hover:text-rose-300"
                            aria-label="Delete comment"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                      <p className="mt-0.5 text-[13px] leading-relaxed whitespace-pre-wrap text-ink-300">
                        {c.body}
                      </p>
                    </div>
                  </div>
                ))}
                {comments.length === 0 && (
                  <p className="text-[12.5px] text-ink-500">
                    No comments yet — start the conversation.
                  </p>
                )}
              </div>

              <div className="mt-4 flex items-start gap-2.5">
                <div className="relative flex-1">
                  <input
                    className="input pr-10"
                    placeholder="Write a comment…"
                    value={commentDraft}
                    onChange={(e) => setCommentDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") postComment();
                    }}
                  />
                  <button
                    onClick={postComment}
                    disabled={!commentDraft.trim() || pending}
                    className="absolute top-1/2 right-1.5 -translate-y-1/2 rounded-md p-1.5 text-brand-400 transition-colors hover:bg-brand-500/10 disabled:text-ink-600"
                    aria-label="Send comment"
                  >
                    <Send className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Sidebar fields */}
        <aside className="space-y-4 bg-ink-900/40 px-5 py-5">
          <SidebarField label="Status">
            <select
              className="input h-8.5 text-[12.5px]"
              value={columnId}
              onChange={(e) => {
                setColumnId(e.target.value);
                if (task)
                  save({ columnId: e.target.value }, { columnId: e.target.value });
              }}
            >
              {columns.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </SidebarField>

          <SidebarField label="Priority">
            <select
              className="input h-8.5 text-[12.5px]"
              value={priority}
              onChange={(e) => {
                const p = e.target.value as Priority;
                setPriority(p);
                if (task) save({ priority: p }, { priority: p });
              }}
            >
              {PRIORITIES.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </SidebarField>

          <SidebarField label="Assignee">
            <select
              className="input h-8.5 text-[12.5px]"
              value={assigneeId}
              onChange={(e) => {
                setAssigneeId(e.target.value);
                if (task)
                  save(
                    { assigneeId: e.target.value || null },
                    {
                      assignee:
                        members.find((m) => m.id === e.target.value) ?? null,
                    },
                  );
              }}
            >
              <option value="">Unassigned</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </SidebarField>

          <SidebarField label="Due date">
            <input
              type="date"
              className="input h-8.5 text-[12.5px]"
              value={due}
              onChange={(e) => {
                setDue(e.target.value);
                if (task)
                  save(
                    { dueDate: e.target.value || null },
                    {
                      dueDate: e.target.value
                        ? new Date(e.target.value).toISOString()
                        : null,
                    },
                  );
              }}
            />
          </SidebarField>

          <SidebarField label="Labels">
            <div className="flex flex-wrap gap-1.5">
              {labels.map((l) => {
                const active = labelIds.includes(l.id);
                return (
                  <button
                    key={l.id}
                    onClick={() => toggleLabel(l.id)}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full border px-2 py-1 text-[11px] font-medium transition-all",
                      active
                        ? "border-white/[0.18] bg-white/[0.08] text-ink-50"
                        : "border-white/[0.07] text-ink-400 opacity-60 hover:opacity-100",
                    )}
                  >
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ backgroundColor: l.color }}
                    />
                    {l.name}
                  </button>
                );
              })}
              {labels.length === 0 && (
                <span className="flex items-center gap-1 text-[11.5px] text-ink-500">
                  <Tag className="h-3 w-3" /> No labels in this project
                </span>
              )}
            </div>
          </SidebarField>

          {isCreate ? (
            <Button
              className="w-full"
              size="sm"
              onClick={submitCreate}
              loading={pending}
            >
              Create task
            </Button>
          ) : (
            <div className="border-t border-white/[0.06] pt-4">
              {confirmDelete ? (
                <div className="rounded-xl border border-rose-500/25 bg-rose-500/[0.07] p-3">
                  <p className="text-[11.5px] text-rose-200">
                    Delete this task permanently?
                  </p>
                  <div className="mt-2 flex gap-1.5">
                    <button
                      onClick={() => {
                        startTransition(async () => {
                          const res = await deleteTask(task!.id);
                          if (!res.ok) {
                            toast.error(res.error);
                            return;
                          }
                          onLocalDelete(task!.id);
                          toast.success("Task deleted");
                          onClose();
                        });
                      }}
                      className="flex-1 rounded-md bg-rose-500/20 px-2 py-1 text-[11.5px] font-medium text-rose-200 transition-colors hover:bg-rose-500/30"
                    >
                      Delete
                    </button>
                    <button
                      onClick={() => setConfirmDelete(false)}
                      className="flex-1 rounded-md bg-white/[0.06] px-2 py-1 text-[11.5px] text-ink-300 transition-colors hover:bg-white/[0.09]"
                    >
                      Keep
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-[12px] text-ink-500 transition-colors hover:bg-rose-500/10 hover:text-rose-300"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Delete task
                </button>
              )}
            </div>
          )}
        </aside>
      </div>
    </Modal>
  );
}

function SidebarField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="mb-1.5 flex items-center gap-1.5 text-[10.5px] font-medium tracking-wider text-ink-500 uppercase">
        {label === "Assignee" && <UserIcon className="h-3 w-3" />}
        {label === "Due date" && <CalendarClock className="h-3 w-3" />}
        {label === "Priority" && (
          <PriorityIcon priority="medium" size={12} className="text-ink-500" />
        )}
        {label}
      </p>
      {children}
    </div>
  );
}
