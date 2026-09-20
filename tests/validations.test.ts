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
  const parsed = taskCreateSchema.parse({ projectId: "00000000-0000-0000-0000-000000000001", columnId: "00000000-0000-0000-0000-000000000002", title: "Ship release", assigneeId: "", labelIds: [] });
  assert.equal(parsed.assigneeId, null);
  assert.deepEqual(parsed.labelIds, []);
});
