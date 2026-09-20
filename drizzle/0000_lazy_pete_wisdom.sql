CREATE TYPE "public"."priority" AS ENUM('none', 'low', 'medium', 'high', 'urgent');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('owner', 'admin', 'member');--> statement-breakpoint
CREATE TABLE "activities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"project_id" uuid,
	"task_id" uuid,
	"user_id" uuid,
	"action" text NOT NULL,
	"meta" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "board_columns" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"name" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "comments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"task_id" uuid NOT NULL,
	"author_id" uuid NOT NULL,
	"body" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "labels" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"name" text NOT NULL,
	"color" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"name" text NOT NULL,
	"key" text NOT NULL,
	"description" text,
	"color" text DEFAULT '#FF5A24' NOT NULL,
	"task_counter" integer DEFAULT 0 NOT NULL,
	"created_by_id" uuid,
	"due_date" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "task_labels" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"task_id" uuid NOT NULL,
	"label_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"column_id" uuid NOT NULL,
	"number" integer NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"priority" "priority" DEFAULT 'none' NOT NULL,
	"position" double precision DEFAULT 0 NOT NULL,
	"due_date" timestamp with time zone,
	"assignee_id" uuid,
	"creator_id" uuid,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"color" text DEFAULT '#FF5A24' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "workspace_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" "role" DEFAULT 'member' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workspaces" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "workspaces_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "board_columns" ADD CONSTRAINT "board_columns_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "labels" ADD CONSTRAINT "labels_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_labels" ADD CONSTRAINT "task_labels_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_labels" ADD CONSTRAINT "task_labels_label_id_labels_id_fk" FOREIGN KEY ("label_id") REFERENCES "public"."labels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_column_id_board_columns_id_fk" FOREIGN KEY ("column_id") REFERENCES "public"."board_columns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_assignee_id_users_id_fk" FOREIGN KEY ("assignee_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_members" ADD CONSTRAINT "workspace_members_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_members" ADD CONSTRAINT "workspace_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "activities_workspace_idx" ON "activities" USING btree ("workspace_id","created_at");--> statement-breakpoint
CREATE INDEX "board_columns_project_idx" ON "board_columns" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "comments_task_idx" ON "comments" USING btree ("task_id");--> statement-breakpoint
CREATE INDEX "labels_project_idx" ON "labels" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "projects_workspace_idx" ON "projects" USING btree ("workspace_id");--> statement-breakpoint
CREATE UNIQUE INDEX "task_labels_unique" ON "task_labels" USING btree ("task_id","label_id");--> statement-breakpoint
CREATE INDEX "tasks_project_idx" ON "tasks" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "tasks_column_idx" ON "tasks" USING btree ("column_id");--> statement-breakpoint
CREATE INDEX "tasks_assignee_idx" ON "tasks" USING btree ("assignee_id");--> statement-breakpoint
CREATE UNIQUE INDEX "workspace_members_unique" ON "workspace_members" USING btree ("workspace_id","user_id");