"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  AlignLeft,
  CalendarClock,
  CheckCircle2,
  MessageSquare,
} from "lucide-react";
import { Avatar } from "@/components/avatar";
import { PriorityIcon } from "@/components/priority";
import type { TaskDTO } from "@/lib/types";
import { cn, DUE_TONE_CLASSES, dueTone, formatDate } from "@/lib/utils";

export function TaskCardBody({
  task,
  projectKey,
  overlay = false,
}: {
  task: TaskDTO;
  projectKey: string;
  overlay?: boolean;
}) {
  const tone = dueTone(task.dueDate);
  const done = !!task.completedAt;

  return (
    <div
      className={cn(
        "group rounded-xl border border-white/[0.06] bg-ink-850 p-3 transition-all duration-150",
        done && "opacity-70",
        overlay &&
          "rotate-[1.5deg] border-brand-500/40 bg-ink-800 opacity-100 shadow-[0_24px_50px_-12px_rgba(0,0,0,0.7)]",
        !overlay &&
          "hover:-translate-y-px hover:border-white/[0.15] hover:bg-ink-800 hover:shadow-[0_10px_30px_-12px_rgba(0,0,0,0.6)]",
      )}
    >
      {task.labels.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1">
          {task.labels.slice(0, 3).map((l) => (
            <span
              key={l.id}
              className="inline-flex items-center gap-1 rounded-full border border-white/[0.07] px-1.5 py-px text-[10px] font-medium text-ink-300"
            >
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: l.color }}
              />
              {l.name}
            </span>
          ))}
          {task.labels.length > 3 && (
            <span className="px-1 text-[10px] text-ink-500">
              +{task.labels.length - 3}
            </span>
          )}
        </div>
      )}

      <p
        className={cn(
          "text-[13px] leading-snug font-medium text-ink-100",
          done && "text-ink-400 line-through decoration-ink-600",
        )}
      >
        {task.title}
      </p>

      {(task.description || task.comments.length > 0) && (
        <div className="mt-1.5 flex items-center gap-2.5 text-ink-500">
          {task.description && <AlignLeft className="h-3 w-3" />}
          {task.comments.length > 0 && (
            <span className="flex items-center gap-1 text-[10.5px]">
              <MessageSquare className="h-3 w-3" />
              {task.comments.length}
            </span>
          )}
          {done && (
            <span className="flex items-center gap-1 text-[10.5px] text-emerald-400">
              <CheckCircle2 className="h-3 w-3" /> Done
            </span>
          )}
        </div>
      )}

      <div className="mt-2.5 flex items-center gap-2">
        <PriorityIcon priority={task.priority} />
        <span className="font-mono text-[10px] text-ink-500">
          {task.number > 0 ? `${projectKey}-${task.number}` : "···"}
        </span>
        <span className="flex-1" />
        {task.dueDate && (
          <span
            className={cn(
              "flex items-center gap-1 rounded-md border border-white/[0.06] px-1.5 py-0.5 text-[10px] font-medium",
              DUE_TONE_CLASSES[tone ?? "later"],
            )}
          >
            <CalendarClock className="h-3 w-3" />
            {formatDate(task.dueDate)}
          </span>
        )}
        {task.assignee && (
          <Avatar user={task.assignee} size={20} className="ring-ink-900" />
        )}
      </div>
    </div>
  );
}

export function TaskCard({
  task,
  projectKey,
  dragDisabled,
  onOpen,
}: {
  task: TaskDTO;
  projectKey: string;
  dragDisabled: boolean;
  onOpen: (task: TaskDTO) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    data: { type: "task", columnId: task.columnId },
    disabled: dragDisabled,
  });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition: transition ?? undefined,
      }}
      className={cn("touch-none", isDragging && "opacity-0")}
      {...attributes}
      {...listeners}
      onClick={() => onOpen(task)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter") onOpen(task);
      }}
    >
      <div className="cursor-grab active:cursor-grabbing">
        <TaskCardBody task={task} projectKey={projectKey} />
      </div>
    </div>
  );
}
