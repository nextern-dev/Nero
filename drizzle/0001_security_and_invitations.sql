CREATE TABLE "rate_limits" ("key" text PRIMARY KEY NOT NULL, "window_start" timestamp with time zone NOT NULL, "count" integer DEFAULT 0 NOT NULL, "updated_at" timestamp with time zone DEFAULT now() NOT NULL);
--> statement-breakpoint
CREATE TABLE "workspace_invitations" ("id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL, "workspace_id" uuid NOT NULL, "email" text NOT NULL, "role" "role" DEFAULT 'member' NOT NULL, "token_hash" text NOT NULL, "expires_at" timestamp with time zone NOT NULL, "invited_by_id" uuid, "accepted_at" timestamp with time zone, "created_at" timestamp with time zone DEFAULT now() NOT NULL, CONSTRAINT "workspace_invitations_token_hash_unique" UNIQUE("token_hash"));
--> statement-breakpoint
ALTER TABLE "workspace_invitations" ADD CONSTRAINT "workspace_invitations_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "workspace_invitations" ADD CONSTRAINT "workspace_invitations_invited_by_id_users_id_fk" FOREIGN KEY ("invited_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
CREATE UNIQUE INDEX "projects_workspace_key_unique" ON "projects" USING btree ("workspace_id","key");
--> statement-breakpoint
CREATE INDEX "workspace_invitations_workspace_idx" ON "workspace_invitations" USING btree ("workspace_id");
--> statement-breakpoint
CREATE INDEX "workspace_invitations_expires_idx" ON "workspace_invitations" USING btree ("expires_at");
