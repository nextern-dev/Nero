import { z } from "zod";

const hexColor = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/, "Pick a valid color");

const optionalDate = z
  .union([z.string(), z.date(), z.null(), z.undefined()])
  .transform((v) => {
    if (!v) return null;
    const d = typeof v === "string" ? new Date(v) : v;
    return Number.isNaN(d.getTime()) ? null : d;
  });

const optionalUuid = z
  .union([z.string().uuid(), z.literal(""), z.null(), z.undefined()])
  .transform((v) => (v ? v : null));

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Name is too short").max(60),
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  password: z
    .string()
    .min(8, "Password needs at least 8 characters")
    .max(72),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  password: z.string().min(1, "Enter your password"),
});

export const projectCreateSchema = z.object({
  name: z.string().trim().min(2, "Name is too short").max(80),
  key: z
    .string()
    .trim()
    .toUpperCase()
    .min(2, "Key needs 2–5 characters")
    .max(5, "Key needs 2–5 characters")
    .regex(/^[A-Z0-9]+$/, "Letters and numbers only"),
  description: z.string().trim().max(280).optional().or(z.literal("")),
  color: hexColor,
  dueDate: optionalDate,
});

export const projectUpdateSchema = z.object({
  projectId: z.string().uuid(),
  name: z.string().trim().min(2).max(80).optional(),
  description: z.string().trim().max(280).optional(),
});

export const prioritySchema = z.enum([
  "none",
  "low",
  "medium",
  "high",
  "urgent",
]);

export const taskCreateSchema = z.object({
  projectId: z.string().uuid(),
  columnId: z.string().uuid(),
  title: z.string().trim().min(1, "Give the task a title").max(160),
  description: z.string().trim().max(5000).optional().or(z.literal("")),
  priority: prioritySchema.default("none"),
  assigneeId: optionalUuid,
  dueDate: optionalDate.default(null),
  labelIds: z.array(z.string().uuid()).default([]),
});

export const taskUpdateSchema = z.object({
  taskId: z.string().uuid(),
  title: z.string().trim().min(1).max(160).optional(),
  description: z.string().max(5000).nullable().optional(),
  priority: prioritySchema.optional(),
  assigneeId: optionalUuid.optional(),
  dueDate: optionalDate.optional(),
  columnId: z.string().uuid().optional(),
  labelIds: z.array(z.string().uuid()).optional(),
  completed: z.boolean().optional(),
});

export const moveTaskSchema = z.object({
  taskId: z.string().uuid(),
  projectId: z.string().uuid(),
  from: z.object({
    columnId: z.string().uuid(),
    ids: z.array(z.string().uuid()),
  }),
  to: z.object({
    columnId: z.string().uuid(),
    ids: z.array(z.string().uuid()),
  }),
});

export const commentCreateSchema = z.object({
  taskId: z.string().uuid(),
  body: z.string().trim().min(1, "Comment can't be empty").max(2000),
});

export const columnCreateSchema = z.object({
  projectId: z.string().uuid(),
  name: z.string().trim().min(1, "Name the column").max(40),
});

export const columnRenameSchema = z.object({
  columnId: z.string().uuid(),
  name: z.string().trim().min(1).max(40),
});

export const columnReorderSchema = z.object({
  projectId: z.string().uuid(),
  ids: z.array(z.string().uuid()).min(1),
});

export const workspaceUpdateSchema = z.object({
  name: z.string().trim().min(2, "Name is too short").max(60),
});

export const profileUpdateSchema = z.object({
  name: z.string().trim().min(2, "Name is too short").max(60),
  color: hexColor,
});

export const memberAddSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
});

export const memberRoleSchema = z.object({
  membershipId: z.string().uuid(),
  role: z.enum(["admin", "member"]),
});

export type ActionResult<T = undefined> =
  | { ok: true; data?: T }
  | { ok: false; error: string };

export function zodError(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Invalid input";
}
