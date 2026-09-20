"use client";

import { SortableContext, useSortable } from "@dnd-kit/sortable";
import { verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { AnimatePresence, motion } from "framer-motion";
import { MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { TaskCard } from "@/components/board/task-card";
import { columnAccent } from "@/lib/constants";
import type { ColumnDTO, TaskDTO } from "@/lib/types";
import { cn } from "@/lib/utils";

export function BoardColumn({
  column,
  index,
  projectKey,
  dragDisabled,
  onOpenTask,
  onQuickAdd,
  onRename,
  onDelete,
  overlay = false,
}: {
  column: ColumnDTO;
  index: number;
  projectKey: string;
  dragDisabled: boolean;
  onOpenTask: (task: TaskDTO) => void;
  onQuickAdd: (columnId: string, title: string) => void;
  onRename: (columnId: string, name: string) => void;
  onDelete: (columnId: string) => void;
  overlay?: boolean;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [name, setName] = useState(column.name);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({
      id: column.id,
      data: { type: "column" },
      disabled: dragDisabled,
    });

  useEffect(() => {
    if (adding) inputRef.current?.focus();
  }, [adding]);

  const accent = columnAccent(column.name, index);

  const submitQuickAdd = () => {
    const title = draft.trim();
    if (title) onQuickAdd(column.id, title);
    setDraft("");
    inputRef.current?.focus();
  };

  const body = (
    <div
      className={cn(
        "flex max-h-full w-[290px] shrink-0 flex-col rounded-2xl border border-white/[0.05] bg-ink-900/70",
        isDragging && !overlay && "opacity-30",
        overlay && "rotate-[1deg] border-brand-500/40 shadow-2xl",
      )}
    >
      {/* Header */}
      <div
        className="flex cursor-grab items-center gap-2 px-3.5 pt-3 pb-2 active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <span
          className="h-2 w-2 shrink-0 rounded-full"
          style={{ backgroundColor: accent }}
        />
        {renaming ? (
          <input
            className="input h-7 flex-1 px-2 py-0 text-[13px]"
            value={name}
            autoFocus
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && name.trim()) {
                onRename(column.id, name.trim());
                setRenaming(false);
              }
              if (e.key === "Escape") setRenaming(false);
            }}
            onBlur={() => {
              if (name.trim() && name.trim() !== column.name)
                onRename(column.id, name.trim());
              setRenaming(false);
            }}
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
          />
        ) : (
          <h3 className="truncate text-[13px] font-semibold text-ink-100">
            {column.name}
          </h3>
        )}
        <span className="rounded-full border border-white/[0.07] px-1.5 text-[10px] text-ink-400 tabular-nums">
          {column.tasks.length}
        </span>
        <span className="flex-1" />
        <button
          onClick={() => setAdding(true)}
          onPointerDown={(e) => e.stopPropagation()}
          className="rounded-md p-1 text-ink-500 transition-colors hover:bg-white/[0.06] hover:text-brand-400"
          aria-label="Add task"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
        <div className="relative">
          <button
            onClick={() => {
              setMenuOpen((v) => !v);
              setConfirming(false);
            }}
            onPointerDown={(e) => e.stopPropagation()}
            className="rounded-md p-1 text-ink-500 transition-colors hover:bg-white/[0.06] hover:text-ink-200"
            aria-label="Column menu"
          >
            <MoreHorizontal className="h-3.5 w-3.5" />
          </button>
          <AnimatePresence>
            {menuOpen && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setMenuOpen(false)}
                />
                <motion.div
                  initial={{ opacity: 0, y: -4, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -4, scale: 0.97 }}
                  transition={{ duration: 0.12 }}
                  className="absolute right-0 z-40 mt-1 w-52 overflow-hidden rounded-xl border border-white/[0.08] bg-ink-850 p-1 shadow-2xl"
                >
                  {confirming ? (
                    <div className="px-2 py-1.5">
                      <p className="px-1 text-[11.5px] leading-snug text-ink-300">
                        Delete this column
                        {column.tasks.length > 0 &&
                          ` and its ${column.tasks.length} task${column.tasks.length === 1 ? "" : "s"}`}
                        ?
                      </p>
                      <div className="mt-2 flex gap-1.5">
                        <button
                          onClick={() => {
                            onDelete(column.id);
                            setMenuOpen(false);
                          }}
                          className="flex-1 rounded-md bg-rose-500/15 px-2 py-1 text-[11.5px] font-medium text-rose-300 transition-colors hover:bg-rose-500/25"
                        >
                          Delete
                        </button>
                        <button
                          onClick={() => setConfirming(false)}
                          className="flex-1 rounded-md bg-white/[0.05] px-2 py-1 text-[11.5px] text-ink-300 transition-colors hover:bg-white/[0.08]"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <button
                        onClick={() => {
                          setRenaming(true);
                          setMenuOpen(false);
                        }}
                        className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-[12.5px] text-ink-200 transition-colors hover:bg-white/[0.05]"
                      >
                        <Pencil className="h-3 w-3 text-ink-500" /> Rename
                        column
                      </button>
                      <button
                        onClick={() => setConfirming(true)}
                        className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-[12.5px] text-rose-300 transition-colors hover:bg-rose-500/10"
                      >
                        <Trash2 className="h-3 w-3" /> Delete column
                      </button>
                    </>
                  )}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Tasks */}
      <div className="min-h-[60px] flex-1 space-y-2 overflow-y-auto px-2.5 pt-1 pb-2">
        <SortableContext
          items={column.tasks.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          {column.tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              projectKey={projectKey}
              dragDisabled={dragDisabled}
              onOpen={onOpenTask}
            />
          ))}
        </SortableContext>

        {column.tasks.length === 0 && !adding && (
          <div className="flex h-[68px] items-center justify-center rounded-xl border border-dashed border-white/[0.07] text-[11px] text-ink-600">
            Drop tasks here
          </div>
        )}

        {adding && (
          <div className="rounded-xl border border-brand-500/30 bg-ink-850 p-2">
            <input
              ref={inputRef}
              className="w-full bg-transparent px-1 text-[13px] text-ink-100 outline-none placeholder:text-ink-600"
              placeholder="Task title, Enter to save"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") submitQuickAdd();
                if (e.key === "Escape") {
                  setAdding(false);
                  setDraft("");
                }
              }}
            />
            <div className="mt-2 flex gap-1.5">
              <button
                onClick={submitQuickAdd}
                className="rounded-md bg-brand-500 px-2.5 py-1 text-[11.5px] font-semibold text-ink-950 transition-colors hover:bg-brand-400"
              >
                Add task
              </button>
              <button
                onClick={() => {
                  setAdding(false);
                  setDraft("");
                }}
                className="rounded-md px-2.5 py-1 text-[11.5px] text-ink-400 transition-colors hover:bg-white/[0.05]"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {!adding && (
        <button
          onClick={() => setAdding(true)}
          className="mx-2.5 mb-2.5 flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[12px] text-ink-500 transition-colors hover:bg-white/[0.04] hover:text-ink-200"
        >
          <Plus className="h-3.5 w-3.5" /> New task
        </button>
      )}
    </div>
  );

  if (overlay) return body;

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition: transition ?? undefined,
        animationDelay: `${index * 70}ms`,
      }}
      className="animate-mount max-h-full"
    >
      {body}
    </div>
  );
}
