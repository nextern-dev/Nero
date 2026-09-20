import test from "node:test";
import assert from "node:assert/strict";
import { loginSchema, projectCreateSchema, registerSchema, taskCreateSchema } from "../src/lib/validations";

test("registration rejects short passwords", () => {
  assert.equal(registerSchema.safeParse({ name: "Ada Lovelace", email: "ada@example.com", password: "short" }).success, false);
});

test("login normalizes email", () => {
  assert.equal(loginSchema.parse({ email: " USER@Example.COM ", password: "secret" }).email, "user@example.com");
});

test("project keys normalize to uppercase", () => {
  assert.equal(projectCreateSchema.parse({ name: "Nero", key: "nero", color: "#123456", dueDate: null }).key, "NERO");
});

test("task payload accepts empty optional assignment and labels", () => {
  const parsed = taskCreateSchema.parse({ projectId: "550e8400-e29b-41d4-a716-446655440000", columnId: "6ba7b810-9dad-41d1-80b4-00c04fd430c8", title: "Ship release", assigneeId: "", labelIds: [] });
  assert.equal(parsed.assigneeId, null);
  assert.deepEqual(parsed.labelIds, []);
});
