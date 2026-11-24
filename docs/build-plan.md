# Build plan

Phase 1, in build order. Each step is a thin vertical slice that runs end to end. Don't start a step until the one before meets its done-when. Tick steps here as they land.

## 0. Walking skeleton

- [x] Scaffold with `create-payload-app` (Postgres, blank template), pnpm, TypeScript strict, ESLint and Prettier.
- [x] `docker-compose.yml` with Postgres 16 and a named volume; `.env.example`.
- [x] Import `design/tokens.css` and `design/components.css`; Roboto Slab and Roboto from Google Fonts.
- [x] `/display` renders a static "At a glance." frame (stripe, logo, title, pager, footer) at 1920×1080.
- [x] Vitest and Playwright wired up, with one test each.

**Done when:** `docker compose up -d db && pnpm dev` serves `/admin` (first admin user created) and `/display`, and `pnpm test`, `pnpm test:e2e`, `pnpm lint` and `pnpm typecheck` pass.

## 1. Grants, end to end

- [x] Collections: `funders`, `engagement-types`, `grants` (all fields in data-model.md), seeded pick lists.
- [x] `users` with `role` and access helpers (`isAdmin`, `isAdminOrEditor`).
- [x] `src/lib/fiscalYear.ts` and `src/lib/metrics.ts` with unit tests (fiscal-year edges, hidden grants, archived excluded).
- [x] `GET /api/display/feed` with display-key check; `glance` and `activeGrants` sections.
- [ ] TV slides 1 (At a glance) and 2 (Active grants, paged by 6) from the feed; loop controller with timings and progress bar.
- [ ] `pnpm seed` loads sample grants.

**Done when:** an admin adds an active grant in `/admin` and it appears on `/display` within 2 minutes, with the numbers updated. Hidden grants never appear (e2e test).

## 2. Media and photos

- [ ] `media` upload collection with alt, credit and image sizes; delete blocked when in use.
- [ ] Grant cover photo on TV cards; brand colour block when empty; alt-less photos filtered from the feed.

**Done when:** a photo uploaded to a grant shows on its TV card; a photo without alt text doesn't; deleting a used photo is refused.

## 3. Posts

- [ ] `post-categories`, `posts` with drafts, publish window, pinned and linked grant; `publishWindow.ts` with tests.
- [ ] Feed `posts` section; TV slide 3 (Featured post, one per post); skipped when there are none.

**Done when:** a scheduled post appears at its publish time and disappears after its removal time (e2e with a mocked clock); an Editor can publish posts but gets no access to grants (access test).

## 4. Completed grants and areas

- [ ] `completedAt` hook; daily auto-complete job; TV slides 4 (Recently completed) and 5 (Funding by area).

**Done when:** marking a grant Completed moves it from slide 2 to slide 4 and the counts update; area shares add up to 100%.

## 5. Excel import

- [ ] `GrantSourceAdapter`, Excel adapter (SheetJS), column mapping (remembered in `app-settings`), matching on `source` + `externalId`, review diff.
- [ ] Custom admin view: Upload → Match columns → Review → Done (per the designs). `import-runs` record.
- [ ] Downloadable import template.

**Done when:** importing the same file twice creates no duplicates; bad rows show plain-language errors and can be skipped; the run is in `import-runs`.

## 6. Activity log

- [ ] Shared hooks on every collection and global; sign-in and failed sign-in logging; read-only `activity-log` admin list with filters; CSV export; 2-year cleanup job.

**Done when:** every create, update, archive, import and sign-in from steps 1–5 appears with who, when and what changed; nobody can edit or delete an entry.

## 7. Display settings, schedule and resilience

- [ ] `display-settings` global and custom admin view: slide order, on or off, seconds, schedule, after-hours mode, key reset.
- [ ] After-hours clock screen (dark theme); B.C. statutory holidays list.
- [ ] Heartbeat route, `display-status`, offline cache and marker, hourly pixel shift; email alert after 3 missed check-ins.

**Done when:** turning a slide off takes effect on the next loop; the TV switches to the clock at sleep time and back at wake time (mocked clock); unplugging the network keeps the last content showing with the offline marker.

## 8. Overview, users and settings

- [ ] Custom Overview dashboard (TV status, counts, needs-attention list, recent activity).
- [ ] Users and roles (invite by email, last-admin protection); `app-settings` screen (fiscal year, baseline, defaults, export grants to .xlsx).
- [ ] Admin branding: ARC logo, nav grouping, tokens in Payload's CSS variables.

**Done when:** each needs-attention item links to its fix; the last admin can't be removed; the admin panel passes an axe WCAG 2.1 AA scan on every screen.

## 9. Local deployment and backups

- [ ] Production run on the office computer (start on boot), `scripts/backup.sh` (nightly `pg_dump` and media copy, kept 30 days), restore instructions in the README.
- [ ] TV set-up guide (Chrome kiosk flags, display link).

**Done when:** the Phase 1 acceptance checklist in [spec.md](spec.md#roadmap) passes, including a tested restore and 7 days unattended on the TV.
