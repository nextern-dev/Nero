# Contributing to Nero

Thanks for taking the time. Nero is a learning-grade open-source project —
readable code beats clever code here.

## Setup

```bash
npm install
cp .env.example .env
npx drizzle-kit push        # create the schema
npx tsx scripts/seed.ts     # optional demo data
npm run dev
```

## Ground rules

- **Validate every public input with Zod.** Server actions live in
  `src/actions/*` and parse through schemas in `src/lib/validations.ts`.
- **Check access server-side.** Any action touching project data must go
  through `requireProjectAccess` / `requireTaskAccess`
  (`src/lib/session.ts`) — never trust ids from the client.
- **Serialize before the client.** Server components hand plain DTOs
  (`src/lib/types.ts`) to client components — dates as ISO strings, no
  Drizzle row objects.
- **Icons come from Lucide.** No emojis in the UI.
- **Design tokens only.** Colors and fonts live in `src/app/globals.css`
  (`@theme`) and `src/lib/constants.ts` — no one-off hex values in
  components.
- Keep UI copy honest: if a feature doesn't exist, the copy doesn't claim
  it does.

## Before opening a PR

```bash
npm run lint
npx tsc --noEmit
npm run build
```

CI runs the same checks (plus a real Postgres service) on every push.
Small, focused pull requests are much easier to review than sweeping ones —
thank you!
