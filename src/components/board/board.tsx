"use client";

import {
  closestCorners,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  horizontalListSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import {
  LayoutGrid,
  List as ListIcon,
  Plus,
  Search,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useEffectEvent, useMemo, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  createColumn,
  deleteColumn,
  renameColumn,
  reorderColumns,
} from "@/actions/columns";
import { createTask, moveTask } from "@/actions/tasks";
import { Avatar } from "@/components/avatar";
import { BoardColumn } from "@/components/board/board-column";
import { TaskCardBody } from "@/components/board/task-card";
import { TaskModal } from "@/components/board/task-modal";
import { PriorityIcon } from "@/components/priority";
import { Button } from "@/components/ui";
import type { Priority } from "@/db/schema";
import {
  columnAccent,
  isDoneColumn,
  PRIORITIES,
} from "@/lib/constants";
import type { BoardData, ColumnDTO, TaskDTO } from "@/lib/types";
import { cn, DUE_TONE_CLASSES, dueTone, formatDate } from "@/lib/utils";

export function Board({
  data,
  currentUserId,
  initialOpenTaskId,
}: {
  data: BoardData;
  currentUserId: string;
  initialOpenTaskId: string | null;
}) {
  const router = useRouter();
  const { project, labels, members } = data;
  const [columns, setColumns] = useState<ColumnDTO[]>(data.columns);
  const [view, setView] = useState<"board" | "list">("board");
  const [query, setQuery] = useState("");
  const [assigneeFilter, setAssigneeFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [activeDrag, setActiveDrag] = useState<{
    type: "task" | "column";
    id: string;
  } | null>(null);
  const dragOriginColumn = useRef<string | null>(null);
  const [modal, setModal] = useState<{
    taskId: string | null;
    createColumnId?: string | null;
  } | null>(null);
  const [addingColumn, setAddingColumn] = useState(false);
  const [newColumnName, setNewColumnName] = useState("");
  const [, startTransition] = useTransition();

  const syncColumns = useEffectEvent((nextColumns: ColumnDTO[]) => {
    setColumns(nextColumns);
  });
  const openInitialTask = useEffectEvent((taskId: string) => {
    setModal({ taskId });
  });

  useEffect(() => {
    const timeout = window.setTimeout(() => syncColumns(data.columns), 0);
    return () => window.clearTimeout(timeout);
  }, [data.columns]);

  useEffect(() => {
    if (!initialOpenTaskId) return;
    const timeout = window.setTimeout(
      () => openInitialTask(initialOpenTaskId),
      0,
    );
    return () => window.clearTimeout(timeout);
  }, [initialOpenTaskId]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const filtersActive = Boolean(query || assigneeFilter || priorityFilter);

  const matches = (t: TaskDTO) => {
    if (query && !t.title.toLowerCase().includes(query.toLowerCase()))
      return false;
    if (assigneeFilter === "unassigned" && t.assignee) return false;
    if (
      assigneeFilter &&
      assigneeFilter !== "unassigned" &&
      t.assignee?.id !== assigneeFilter
    )
      return false;
    if (priorityFilter && t.priority !== priorityFilter) return false;
    return true;
  };

  const visibleColumns = useMemo(
    () =>
      columns.map((c) => ({
        ...c,
        tasks: filtersActive ? c.tasks.filter(matches) : c.tasks,
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [columns, query, assigneeFilter, priorityFilter],
  );

  const totalTasks = columns.reduce((s, c) => s + c.tasks.length, 0);
  const visibleCount = visibleColumns.reduce((s, c) => s + c.tasks.length, 0);

  const findColumnId = (id: string): string | null => {
    if (columns.some((c) => c.id === id)) return id;
    return columns.find((c) => c.tasks.some((t) => t.id === id))?.id ?? null;
  };

  const findTask = (id: string): TaskDTO | null => {
    for (const c of columns) {
      const t = c.tasks.find((x) => x.id === id);
      if (t) return t;
    }
    return null;
  };

  /* ---------------------------- DnD ---------------------------- */

  const onDragStart = (e: DragStartEvent) => {
    const type = e.active.data.current?.type as "task" | "column";
    setActiveDrag({ type, id: String(e.active.id) });
    if (type === "task")
      dragOriginColumn.current = findColumnId(String(e.active.id));
  };

  const onDragOver = (e: DragOverEvent) => {
    const { active, over } = e;
    if (!over) return;
    if (active.data.current?.type !== "task") return;

    const activeId = String(active.id);
    const overId = String(over.id);
    const fromId = findColumnId(activeId);
    const toId = findColumnId(overId);
    if (!fromId || !toId || fromId === toId) return;

    setColumns((prev) => {
      const fromCol = prev.find((c) => c.id === fromId)!;
      const toCol = prev.find((c) => c.id === toId)!;
      const task = fromCol.tasks.find((t) => t.id === activeId)!;
      const overIndex = toCol.tasks.findIndex((t) => t.id === overId);
      const insertAt = overIndex >= 0 ? overIndex : toCol.tasks.length;
      const nextTo = [...toCol.tasks];
      nextTo.splice(insertAt, 0, { ...task, columnId: toId });
      return prev.map((c) =>
        c.id === fromId
          ? { ...c, tasks: c.tasks.filter((t) => t.id !== activeId) }
          : c.id === toId
            ? { ...c, tasks: nextTo }
            : c,
      );
    });
  };

  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    setActiveDrag(null);
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);
    const type = active.data.current?.type;

    if (type === "column") {
      const oldIndex = columns.findIndex((c) => c.id === activeId);
      const newIndex = columns.findIndex((c) => c.id === overId);
      if (oldIndex < 0 || newIndex < 0 || oldIndex === newIndex) return;
      const next = arrayMove(columns, oldIndex, newIndex);
      setColumns(next);
      startTransition(async () => {
        const res = await reorderColumns({
          projectId: project.id,
          ids: next.map((c) => c.id),
        });
        if (!res.ok) {
          toast.error(res.error);
          router.refresh();
        }
      });
      return;
    }

    if (type !== "task") return;
    const originId = dragOriginColumn.current;
    const destId = findColumnId(activeId);
    if (!originId || !destId) return;

    let next = columns;
    const dest = columns.find((c) => c.id === destId)!;
    const overIsTask = dest.tasks.some((t) => t.id === overId);
    if (activeId !== overId && overIsTask) {
      const oldIndex = dest.tasks.findIndex((t) => t.id === activeId);
      const newIndex = dest.tasks.findIndex((t) => t.id === overId);
      next = columns.map((c) =>
        c.id === destId
          ? { ...c, tasks: arrayMove(c.tasks, oldIndex, newIndex) }
          : c,
      );
    }

    // Mirror the server's done-column semantics optimistically
    const originCol = next.find((c) => c.id === originId)!;
    const destCol = next.find((c) => c.id === destId)!;
    const task = destCol.tasks.find((t) => t.id === activeId);
    if (task) {
      let completedAt = task.completedAt;
      if (isDoneColumn(destCol.name) && !completedAt)
        completedAt = new Date().toISOString();
      else if (!isDoneColumn(destCol.name) && completedAt) completedAt = null;
      next = next.map((c) =>
        c.id === destId
          ? {
              ...c,
              tasks: c.tasks.map((t) =>
                t.id === activeId
                  ? { ...t, columnId: destId, completedAt }
                  : t,
              ),
            }
          : c,
      );
    }
    setColumns(next);

    const fromCol = next.find((c) => c.id === originId)!;
    const toCol = next.find((c) => c.id === destId)!;
    startTransition(async () => {
      const res = await moveTask({
        taskId: activeId,
        projectId: project.id,
        from: {
          columnId: originId,
          ids: fromCol.tasks.filter((t) => t.id !== activeId).map((t) => t.id),
        },
        to: { columnId: destId, ids: toCol.tasks.map((t) => t.id) },
      });
      if (!res.ok) {
        toast.error(res.error);
        router.refresh();
      }
    });
  };

  /* ------------------------- Mutations ------------------------- */

  const quickAdd = (columnId: string, title: string) => {
    const temp: TaskDTO = {
      id: `temp-${Date.now()}`,
      number: 0,
      title,
      description: null,
      priority: "none",
      dueDate: null,
      position: 99999,
      columnId,
      assignee: null,
      creator: null,
      labels: [],
      comments: [],
      completedAt: null,
      createdAt: new Date().toISOString(),
    };
    setColumns((prev) =>
      prev.map((c) =>
        c.id === columnId ? { ...c, tasks: [...c.tasks, temp] } : c,
      ),
    );
    startTransition(async () => {
      const res = await createTask({ projectId: project.id, columnId, title });
      if (!res.ok) {
        toast.error(res.error);
        setColumns((prev) =>
          prev.map((c) => ({
            ...c,
            tasks: c.tasks.filter((t) => t.id !== temp.id),
          })),
        );
        return;
      }
      router.refresh();
    });
  };

  const handleRenameColumn = (columnId: string, name: string) => {
    const previous = columns;
    setColumns((prev) =>
      prev.map((c) => (c.id === columnId ? { ...c, name } : c)),
    );
    startTransition(async () => {
      const res = await renameColumn({ columnId, name });
      if (!res.ok) {
        toast.error(res.error);
        setColumns(previous);
      }
    });
  };

  const handleDeleteColumn = (columnId: string) => {
    const previous = columns;
    setColumns((prev) => prev.filter((c) => c.id !== columnId));
    startTransition(async () => {
      const res = await deleteColumn(columnId);
      if (!res.ok) {
        toast.error(res.error);
        setColumns(previous);
        return;
      }
      toast.success("Column deleted");
      router.refresh();
    });
  };

  const handleAddColumn = () => {
    const name = newColumnName.trim();
    if (!name) return;
    setNewColumnName("");
    setAddingColumn(false);
    startTransition(async () => {
      const res = await createColumn({ projectId: project.id, name });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      router.refresh();
    });
  };

  const patchTask = (taskId: string, patch: Partial<TaskDTO>) => {
    setColumns((prev) =>
      prev.map((c) => ({
        ...c,
        tasks: c.tasks.map((t) => (t.id === taskId ? { ...t, ...patch } : t)),
      })),
    );
  };

  const removeTask = (taskId: string) => {
    setColumns((prev) =>
      prev.map((c) => ({
        ...c,
        tasks: c.tasks.filter((t) => t.id !== taskId),
      })),
    );
  };

  const closeModal = () => {
    setModal(null);
    if (initialOpenTaskId)
      router.replace(`/projects/${project.id}`, { scroll: false });
    router.refresh();
  };

  const modalTask = modal?.taskId ? findTask(modal.taskId) : null;

  /* --------------------------- Render -------------------------- */

  return (
    <div className="pt-6">
      {/* Header */}
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="mb-1 text-[11.5px] text-ink-500">
            <Link
              href="/projects"
              className="transition-colors hover:text-ink-300"
            >
              Projects
            </Link>
            <span className="mx-1.5">/</span>
            <span className="text-ink-400">{project.name}</span>
          </p>
          <div className="flex items-center gap-2.5">
            <span
              className="flex h-8 w-8 items-center justify-center rounded-lg font-mono text-[11px] font-bold"
              style={{
                backgroundColor: `${project.color}1f`,
                color: project.color,
              }}
            >
              {project.key.slice(0, 2)}
            </span>
            <h1 className="truncate font-display text-[24px] font-medium tracking-tight text-ink-50 italic">
              {project.name}
            </h1>
            <span className="hidden rounded-full border border-white/[0.08] px-2 py-0.5 font-mono text-[10px] text-ink-400 sm:block">
              {project.key}
            </span>
            {project.dueDate && (
              <span
                className={cn(
                  "text-[11px]",
                  DUE_TONE_CLASSES[dueTone(project.dueDate) ?? "later"],
                )}
              >
                due {formatDate(project.dueDate)}
              </span>
            )}
          </div>
          {project.description && (
            <p className="mt-1 max-w-xl truncate text-[12.5px] text-ink-500">
              {project.description}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-white/[0.08] bg-ink-850 p-0.5">
            {(
              [
                { v: "board", icon: LayoutGrid, label: "Board" },
                { v: "list", icon: ListIcon, label: "List" },
              ] as const
            ).map(({ v, icon: Icon, label }) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11.5px] font-medium transition-all",
                  view === v
                    ? "bg-white/[0.08] text-ink-50"
                    : "text-ink-500 hover:text-ink-200",
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </button>
            ))}
          </div>
          <Button
            size="sm"
            onClick={() =>
              setModal({ taskId: null, createColumnId: columns[0]?.id ?? null })
            }
          >
            <Plus className="h-3.5 w-3.5" /> New task
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search className="absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-ink-500" />
          <input
            className="input h-8 w-48 pl-8 text-[12.5px]"
            placeholder="Filter tasks…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <select
          className="input h-8 w-auto pr-8 text-[12.5px]"
          value={assigneeFilter}
          onChange={(e) => setAssigneeFilter(e.target.value)}
        >
          <option value="">All assignees</option>
          <option value="unassigned">Unassigned</option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
        <select
          className="input h-8 w-auto pr-8 text-[12.5px]"
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
        >
          <option value="">All priorities</option>
          {PRIORITIES.filter((p) => p.value !== "none").map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>
        {filtersActive && (
          <>
            <span className="text-[11.5px] text-ink-500">
              {visibleCount} of {totalTasks} tasks · drag disabled
            </span>
            <button
              onClick={() => {
                setQuery("");
                setAssigneeFilter("");
                setPriorityFilter("");
              }}
              className="flex items-center gap-1 rounded-md px-2 py-1 text-[11.5px] text-ink-400 transition-colors hover:bg-white/[0.05] hover:text-ink-100"
            >
              <X className="h-3 w-3" /> Clear
            </button>
          </>
        )}
      </div>

      {/* Content */}
      {view === "board" ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={onDragStart}
          onDragOver={onDragOver}
          onDragEnd={onDragEnd}
          onDragCancel={() => setActiveDrag(null)}
        >
          <div className="-mx-4 overflow-x-auto px-4 pb-8 sm:-mx-8 sm:px-8">
            <div className="flex min-h-[58vh] items-start gap-3">
              <SortableContext
                items={visibleColumns.map((c) => c.id)}
                strategy={horizontalListSortingStrategy}
              >
                {visibleColumns.map((column, i) => (
                  <BoardColumn
                    key={column.id}
                    column={column}
                    index={i}
                    projectKey={project.key}
                    dragDisabled={filtersActive}
                    onOpenTask={(task) => setModal({ taskId: task.id })}
                    onQuickAdd={quickAdd}
                    onRename={handleRenameColumn}
                    onDelete={handleDeleteColumn}
                  />
                ))}
              </SortableContext>

              {/* Add column */}
              <div className="w-[290px] shrink-0">
                {addingColumn ? (
                  <div className="rounded-2xl border border-brand-500/30 bg-ink-900/80 p-3">
                    <input
                      autoFocus
                      className="w-full bg-transparent text-[13px] text-ink-100 outline-none placeholder:text-ink-600"
                      placeholder="Column name"
                      value={newColumnName}
                      onChange={(e) => setNewColumnName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleAddColumn();
                        if (e.key === "Escape") setAddingColumn(false);
                      }}
                    />
                    <div className="mt-2.5 flex gap-1.5">
                      <button
                        onClick={handleAddColumn}
                        className="rounded-md bg-brand-500 px-2.5 py-1 text-[11.5px] font-semibold text-ink-950 transition-colors hover:bg-brand-400"
                      >
                        Add column
                      </button>
                      <button
                        onClick={() => setAddingColumn(false)}
                        className="rounded-md px-2.5 py-1 text-[11.5px] text-ink-400 transition-colors hover:bg-white/[0.05]"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setAddingColumn(true)}
                    className="flex h-[88px] w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-white/[0.08] text-[12.5px] text-ink-500 transition-colors hover:border-brand-500/40 hover:text-brand-300"
                  >
                    <Plus className="h-4 w-4" /> Add column
                  </button>
                )}
              </div>
            </div>
          </div>

          <DragOverlay>
            {activeDrag?.type === "task" && findTask(activeDrag.id) ? (
              <div className="w-[270px]">
                <TaskCardBody
                  task={findTask(activeDrag.id)!}
                  projectKey={project.key}
                  overlay
                />
              </div>
            ) : null}
            {activeDrag?.type === "column" &&
            columns.find((c) => c.id === activeDrag.id) ? (
              <div className="w-[290px] rounded-2xl border border-brand-500/40 bg-ink-850/95 p-4 shadow-2xl">
                <p className="text-[13px] font-semibold text-ink-100">
                  {columns.find((c) => c.id === activeDrag.id)!.name}
                </p>
                <p className="mt-1 text-[11px] text-ink-500">
                  {
                    columns.find((c) => c.id === activeDrag.id)!.tasks.length
                  }{" "}
                  tasks
                </p>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      ) : (
        <ListView
          columns={visibleColumns}
          onOpenTask={(task) => setModal({ taskId: task.id })}
        />
      )}

      <TaskModal
        open={!!modal}
        onClose={closeModal}
        task={modalTask}
        createColumnId={modal?.createColumnId ?? null}
        project={project}
        columns={columns.map((c) => ({ id: c.id, name: c.name }))}
        labels={labels}
        members={members}
        currentUserId={currentUserId}
        onLocalChange={patchTask}
        onLocalDelete={removeTask}
      />
    </div>
  );
}

function ListView({
  columns,
  onOpenTask,
}: {
  columns: ColumnDTO[];
  onOpenTask: (task: TaskDTO) => void;
}) {
  return (
    <div className="space-y-4 pb-10">
      {columns.map((column, i) => (
        <div key={column.id} className="card overflow-hidden">
          <div className="flex items-center gap-2 border-b border-white/[0.06] bg-ink-850/50 px-4 py-2.5">
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: columnAccent(column.name, i) }}
            />
            <span className="text-[12.5px] font-semibold text-ink-100">
              {column.name}
            </span>
            <span className="rounded-full border border-white/[0.07] px-1.5 text-[10px] text-ink-400 tabular-nums">
              {column.tasks.length}
            </span>
          </div>
          {column.tasks.length === 0 && (
            <p className="px-4 py-4 text-[12px] text-ink-600">
              No tasks in this column.
            </p>
          )}
          <div className="divide-y divide-white/[0.04]">
            {column.tasks.map((t) => {
              const tone = dueTone(t.dueDate);
              return (
                <button
                  key={t.id}
                  onClick={() => onOpenTask(t)}
                  className="grid w-full grid-cols-[14px_70px_1fr_auto] items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-white/[0.02]"
                >
                  <PriorityIcon priority={t.priority} />
                  <span
                    className={cn(
                      "font-mono text-[10.5px] text-ink-500",
                      t.completedAt && "line-through",
                    )}
                  >
                    {t.number > 0 ? `— ${t.number}` : ""}
                  </span>
                  <span className="flex min-w-0 items-center gap-2">
                    <span
                      className={cn(
                        "truncate text-[13px] text-ink-100",
                        t.completedAt && "text-ink-500 line-through",
                      )}
                    >
                      {t.title}
                    </span>
                    <span className="hidden gap-1 md:flex">
                      {t.labels.slice(0, 2).map((l) => (
                        <span
                          key={l.id}
                          className="h-1.5 w-1.5 rounded-full"
                          style={{ backgroundColor: l.color }}
                        />
                      ))}
                    </span>
                  </span>
                  <span className="flex items-center gap-2">
                    {t.dueDate && (
                      <span
                        className={cn(
                          "text-[10.5px]",
                          DUE_TONE_CLASSES[tone ?? "later"],
                        )}
                      >
                        {formatDate(t.dueDate)}
                      </span>
                    )}
                    {t.assignee ? (
                      <Avatar user={t.assignee} size={20} />
                    ) : (
                      <span className="h-5 w-5 rounded-full border border-dashed border-ink-600" />
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
