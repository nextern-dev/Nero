<div align="center">

![Nero](public/cover.png)

# Nero

**Open-source project management: kanban boards, priorities, labels, due
dates, comments, team roles, activity history and a ⌘K palette.**

Next.js 16 · React 19 · Tailwind CSS 4 · Drizzle ORM · PostgreSQL ·
Auth.js v5 · Zod · Zustand · Resend · dnd kit

</div>

---

## Contents

- [Features](#features)
- [Architecture](#architecture)
- [Data model](#data-model)
- [Implementation highlights](#implementation-highlights)
- [Project structure](#project-structure)
- [Getting started](#getting-started)
- [Scripts](#scripts)
- [Roadmap](#roadmap)

## Features

| Area            | What you get                                                                                     |
| --------------- | ------------------------------------------------------------------------------------------------ |
| Boards          | Drag tasks between/within columns, reorder columns, optimistic UI, drop-into-Done auto-completes |
| Tasks           | Descriptions, 5 priority levels, labels, due dates, assignees, `NER-21` numbering, comments     |
| Command palette | ⌘K searches task titles and projects, quick actions, full keyboard navigation                    |
| Dashboard       | Tasks-completed-per-day chart, open-work-by-column donut, your open tasks, project progress     |
| Workspaces      | Owner / admin / member roles, workspace membership checks, email onboarding invites via Resend, workspace switcher |
| Activity        | Every create / move / complete / comment, grouped by day                                         |
| Auth            | Email + password and Google OAuth (Auth.js v5, JWT sessions, bcrypt)                             |

## Architecture

```text
┌────────────┐   server components (RSC)    ┌──────────────┐
│   React    │ ────────────────────────────▶ │  PostgreSQL  │
│  (client)  │                               │   (Drizzle)  │
└─────┬──────┘                               └──────▲───────┘
      │ server actions (zod-validated,               │
      │ membership-checked)                          │
      └─────────────────────────────────────────────┘

app router
├── (auth)/login · register        → credentials + Google OAuth → JWT session
├── (app)/dashboard · projects/[id] · members · activity · settings
│        ↑ guarded in layout via requireWorkspace()
├── api/auth/[...nextauth]         → Auth.js handlers
├── api/search                     → ⌘K palette backend
└── api/health                     → uptime probe
```

- **Reads** go through typed query functions in `src/lib/queries.ts` and are
  serialized into plain DTOs (`src/lib/types.ts`) before crossing to client
  components.
- **Writes** go through server actions in `src/actions/*`: every payload is
  parsed with Zod, and every mutation verifies workspace membership
  (`src/lib/session.ts`) before touching the database.

## Data model

12 tables, all in `src/db/schema.ts` with Drizzle relations and cascade
rules:

`users` · `workspaces` · `workspace_members` (role enum) · `projects` ·
`board_columns` · `tasks` (priority enum, position, `completedAt`) ·
`labels` · `task_labels` · `comments` · `activities` · `workspace_invitations` · `rate_limits`

## Implementation highlights

- **Drag & drop with transactional persistence** — the board keeps local
  optimistic state; on drop, `moveTask` rewrites ordered `position` values
  for the affected columns inside a single transaction.
- **Done semantics** — moving a card into a column named "Done" sets
  `completedAt` (and clears it when it leaves); the same flag drives the
  charts, stats and activity log.
- **OAuth that maps to your own schema** — Google sign-in provisions a
  user, workspace and starter project on first login, then the JWT callback
  resolves the session to the real `users.id` row.
- **CSS-variable design system** — every color and font is a token in
  `globals.css` (`@theme`); the whole app re-skins from one file.
- **Hand-rolled animated charts** — SVG area chart (catmull-rom smoothing,
  path draw-in, hover crosshair) and donut, no chart dependency.
- **Deep-linked task modal** — `?task=<id>` opens the editor from anywhere
  (palette results, dashboard rows), and clears on close.
- **Security boundaries** — project/column/label/assignee relationships are checked server-side, project keys are unique per workspace, and authentication endpoints use a PostgreSQL-backed rate limiter.
- **Invitation workflow** — workspace invites use short-lived hashed tokens, email-bound acceptance, and transactional membership creation.
- **Email that degrades gracefully** — without `RESEND_API_KEY` messages
  are logged, never thrown.

## Project structure

```text
src/
├── actions/        # server actions (auth, tasks, columns, projects, workspace)
├── app/
│   ├── (auth)/     # login + register, split-screen layout
│   ├── (app)/      # guarded product: dashboard, board, members, activity, settings
│   ├── api/        # auth handlers, search, health
│   └── page.tsx    # landing
├── components/     # ui kit, board, dashboard, landing, charts, shell
├── db/             # schema + client (Drizzle)
├── lib/            # session, queries, validations (zod), email, constants
├── store/          # zustand (palette, mobile nav, modals)
└── types/          # next-auth module augmentation

scripts/seed.ts     # idempotent demo seed (demo@nero.dev / demo1234)
.github/workflows/  # CI: Postgres service + lint + build + typecheck
```

## Getting started

```bash
npm install
cp .env.example .env          # DATABASE_URL + AUTH_SECRET are required
npm run db:migrate             # apply committed Drizzle migrations
npx tsx scripts/seed.ts        # optional: rich demo workspace
npm run dev
```

Email and Google sign-in are optional and activate when their keys are
present — see `.env.example` for the full list (including the Google OAuth
redirect URI to register).

## Scripts

| Script              | Purpose                          |
| ------------------- | -------------------------------- |
| `npm run dev`       | Start the dev server             |
| `npm run build`     | Production build                 |
| `npm run lint`      | ESLint                           |
| `npm run typecheck` | `tsc --noEmit`                   |
| `npm test`          | Run validation tests              |
| `npm run db:migrate` | Apply committed Drizzle migrations |
| `npx drizzle-kit push` | Apply schema to the database  |
| `npx tsx scripts/seed.ts` | Seed demo data              |

## Roadmap

- [ ] Subtasks & checklists inside tasks
- [ ] File attachments
- [ ] Notifications inbox
- [ ] Public roadmap / changelog page
- [ ] Tokenized invitation acceptance flow
- [ ] E2E tests (Playwright) alongside CI

## License

MIT — see [LICENSE](LICENSE).
