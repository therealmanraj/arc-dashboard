# CLAUDE.md

Guidance for Claude Code (and humans) working in this repository.

## What this is

The **ARC Dashboard & CMS** for the Applied Research Centre (ARC) at Langara College:

1. **TV display**: a full-screen, auto-rotating loop of slides on an office TV, showing grant metrics, active and completed grants, and news posts. No mouse, keyboard or login.
2. **Admin CMS**: where ARC staff manage grants, posts and photos, import grants from Excel, and control the TV.

Phase 1 runs **locally** on one office computer. Staff reach the admin panel and the TV reaches the display page over the office network. Nothing is deployed to the cloud yet.

## Read these first

| File | What it holds |
| --- | --- |
| `docs/spec.md` | Product spec: goals, roles, data model, every TV slide and admin screen, NFRs, roadmap, Phase 1 acceptance criteria, open questions |
| `docs/architecture.md` | Tech stack, folder layout, key decisions, how the local setup runs |
| `docs/data-model.md` | Payload collections and globals, field by field, access rules, hooks, and the exact metric formulas |
| `docs/build-plan.md` | The order to build features in, each with its done-when |
| `design/README.md` | How to use the ARC design system (tokens, components, logos) in code |

Visual references (open in a browser):

- Screen designs (6 TV slides, 14 admin screens): https://claude.ai/artifact/VYvfbYRXrCikR8EFNApyFB
- ARC Design System: https://claude.ai/artifact/V9iBXwRrpKDrb37ay1ijEb

## Stack

- **Payload CMS 3** (stable; do not use the v4 beta) running inside **Next.js** (App Router), **TypeScript** strict.
- Keep Next.js inside the version range Payload 3 supports; check `payload` peer dependencies before any Next.js upgrade.
- **Node.js** 26 LTS (`.nvmrc`; Payload 3.94 needs 22.23.5+, 24.22.3+ or 26.13.1+). **pnpm** as the package manager.
- **PostgreSQL** via Docker Compose (`@payloadcms/db-postgres`).
- Media stored on local disk (Payload's default upload storage).
- Excel parsing: SheetJS. Charts: hand-built SVG/CSS, no chart library.
- Tests: **Vitest** (unit and integration), **Playwright** (TV and admin flows).

## Commands

Keep this section accurate. Scaffolding is in progress (build plan step 0), so `pnpm seed` isn't added yet.

```bash
docker compose up -d db      # start Postgres
pnpm install
pnpm dev                     # app on http://localhost:3000 (admin: /admin, TV: /display?key=...)
pnpm test                    # Vitest
pnpm test:e2e                # Playwright
pnpm lint && pnpm typecheck
pnpm payload migrate         # run database migrations
pnpm display:key             # new TV display key; prints the /display link once (old link stops working)
pnpm seed                    # load sample data (sample data only; never real grants)
```

## Rules that matter

### Domain
- **Grants are the source of truth.** Every number on the TV is calculated from grant records in `src/lib/metrics.ts`. Never store a total that could be calculated. The one exception is the "Raised since 2016" baseline in app settings.
- **Fiscal year runs April 1 to March 31** (Langara). All "this year" metrics use the fiscal year, and dates use the `America/Vancouver` time zone.
- **Data sources go through adapters.** Excel now, Dynamics 365 in Phase 2. Every source implements the same `GrantSourceAdapter` interface (`src/import/types.ts`) and writes grants matched on `source` + `externalId`. Never let the TV or admin code know which source a grant came from, beyond showing it.
- **The TV only reads.** The display route reads through the feed endpoint; it never writes except its heartbeat. A failed import must never break the TV loop.
- **Respect "show on display".** Hidden grants, grants with `hidePartnerOnDisplay`, posts outside their publish window, and photos without alt text must never reach the display feed. Filter in the feed query, not in the UI.
- **Archive, don't delete** grants. Photos in use can't be deleted.
- **Every change is logged.** Collection hooks write to `activity-log` (who, action, item, what changed). The activity log is append-only.

### Design and UI
- Use the ARC design system in `design/`: `tokens.css` for every colour, font, spacing and radius, and `components.css` for the `arc-` classes. **No hard-coded hex values** outside `design/`.
- **TV**: light theme, white ground, brand colour blocks (`--brand-orange`, `--brand-amber`, `--brand-gold`, `--brand-sand`). Text on those blocks is always `--brand-black`. Dark theme only for the after-hours screen. 1920×1080, 96px side margins, nothing under 22px.
- **Admin**: light theme. Primary buttons are orange with black text. Never white text on orange.
- Headings and slide titles are sentence case and end with a period ("Active grants."). Buttons are verb-first sentence case with no period ("Add grant").
- Fonts: Roboto Slab (headings, body copy) and Roboto (UI, data), the brand's approved alternates for Adelle and TheSans.
- Accessibility: WCAG 2.1 AA. Real `<button>`, `<a>` and `<label>` elements, a 44px minimum target size, the visible orange focus ring, and alt text required on photos.
- Copy: Canadian English, plain and direct, no exclamation marks on the TV. Currency in CAD, rounded for the TV ("$4.2M").

### Code
- TypeScript strict; no `any`. Prefer server components; client components only where needed (the slide loop, interactive admin views).
- Use Payload's **Local API** on the server. Don't call the REST API from server code.
- Business logic (metrics, fiscal year, import matching, publish windows) lives in plain functions under `src/lib` or `src/import`, with unit tests. Not in React components or Payload hooks.
- Customize the Payload admin with its supported extension points (custom views, components, CSS variables). Don't fork or patch Payload.
- Database changes go through Payload migrations, committed with the change. Push is off in every environment, dev included: after changing a collection, run `pnpm payload migrate:create <name>` then `pnpm payload migrate`. Reference data (pick-list values) is seeded by a migration; sample data by `pnpm seed`.
- Never commit `.env`, uploaded media or database dumps. Add new variables to `.env.example`.

### Tests and done
- A feature is done when its done-when in `docs/build-plan.md` passes, its tests pass, and `pnpm lint && pnpm typecheck` are clean.
- Never weaken, skip or delete a test to make it pass.
- Metric calculations need unit tests with fixed dates (fiscal-year boundaries, end dates, hidden grants).

### Data
- Seed and test data are **sample data**. Never put real grant amounts, partner names or people's names into the repo.

### Git
- Small commits with an imperative subject ("Add grants collection"). Branch per feature: `feat/<short-name>`.
- Update `docs/` in the same commit when behaviour changes from the spec.

## Open questions that affect the build

Listed in full in `docs/spec.md`. The ones most likely to change code:

- Excel sheet columns (we have no sample yet): keep the column mapping configurable.
- Which fields are OK on the TV (amounts, partner names, faculty names): keep the per-grant display flags.
- Hosting: keep storage and database settings in env vars, so moving to a server changes config only.
