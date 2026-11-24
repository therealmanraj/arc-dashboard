# Data model

Payload collections and globals for Phase 1. Field names are camelCase in code; slugs are kebab-case. Product-level descriptions are in [spec.md](spec.md#data-model).

Access shorthand: **A** = Admin, **E** = Editor, **D** = display feed (server-side, via the display key), **—** = nobody.

## Collections

### `grants`

| Field | Type | Rules |
| --- | --- | --- |
| `title` | text | required, max 200 |
| `shortDescription` | textarea | max 200; shown on the TV |
| `funder` | relationship → `funders` | required |
| `program` | text | |
| `amountCents` | number (integer) | ≥ 0; CAD cents |
| `area` | select | `natural-products` \| `data-analytics` \| `social-innovation`; required |
| `engagementType` | relationship → `engagement-types` | |
| `facultyLead` | text | Phase 2: relationship to people |
| `partner` | text | |
| `hidePartnerOnDisplay` | checkbox | default false |
| `startDate` | date | |
| `endDate` | date | must be after `startDate` (validate) |
| `status` | select | `pending` \| `active` \| `completed` \| `archived`; required; default `pending` |
| `completedAt` | date | set when status becomes `completed` (hook); used for "recently completed" |
| `autoComplete` | checkbox | default from AppSettings `autoCompleteDefault` |
| `studentsInvolved` | number (integer) | ≥ 0 |
| `outcomeHighlight` | text | max 120; shown on Recently completed |
| `coverPhoto` | upload → `media` | |
| `showOnDisplay` | checkbox | default true |
| `source` | select | `manual` \| `excel` \| `dynamics365`; read-only in admin |
| `externalId` | text | read-only; unique together with `source` (index) |
| `lockedFields` | json | Phase 2: fields owned by Dynamics 365 (read-only in admin) |

Access: read A; create, update A; delete — (archive instead). Admin list columns: title, funder, area, amountCents, endDate, status, showOnDisplay.

Hooks:
- `beforeChange`: set `completedAt` when status changes to `completed`; clear it if status moves back.
- `afterChange`: activity log with a field diff.
- Scheduled job (daily, 1:00 AM): grants with `autoComplete` and `endDate < today` and `status = active` → `completed` (logged as System).

### `posts`

| Field | Type | Rules |
| --- | --- | --- |
| `title` | text | required, max 120 |
| `category` | relationship → `post-categories` | required |
| `body` | richText (Lexical) | bold, italic, heading, list, link only |
| `photos` | upload → `media`, hasMany | first is the cover |
| `linkedGrant` | relationship → `grants` | optional |
| `publishAt` | date (with time) | |
| `expireAt` | date (with time) | must be after `publishAt` |
| `pinned` | checkbox | pinned posts show in every loop |
| `_status` | Payload drafts | `draft` \| `published` |

Derived status (not stored; `src/lib/publishWindow.ts`): Draft if `_status = draft`; Scheduled if published and `publishAt > now`; Expired if `expireAt <= now`; otherwise Published.

Access: read, create, update, delete A and E. D reads published posts inside their window.

### `media` (upload)

| Field | Type | Rules |
| --- | --- | --- |
| `alt` | text | required before use on the TV (feed filters out alt-less images) |
| `credit` | text | |
| image sizes | | `tv` 1920 wide, `tv4k` 3840 wide, `card` 800 wide, `thumb` 320 wide (webp) |

Access: read, create, update A and E; delete A and E only when not referenced (a `beforeDelete` hook checks grants and posts).

### `users` (auth)

| Field | Type | Rules |
| --- | --- | --- |
| `name` | text | required |
| `email` | email | Payload auth |
| `role` | select | `admin` \| `editor`; required |
| `lastLoginAt` | date | set on login |

Auth: `maxLoginAttempts: 5`, `lockTime: 15 min`, forgot-password by email. Access: A only; a user can read and update their own name and password. A hook stops the last admin from being removed or demoted.

### `funders`, `engagement-types`, `post-categories`

Pick lists: `name` (text, required, unique), `sortOrder` (number). Access: read A and E; write A; delete A only when not referenced.

Seed values:
- Funders: NSERC, SSHRC, Mitacs, CFI, BCKDF, DFO, ESDC, Private, Other.
- Engagement types: Federally funded partnership, Contract research, Limited engagement, Capstone.
- Post categories: News, Event, Milestone, Spotlight.

### `activity-log`

`at` (date), `actor` (relationship → users, or null for System), `actorLabel` (text), `action` (select: created, updated, archived, deleted, imported, uploaded, signed-in, failed-sign-in, invited, settings-changed, synced), `collection` (text), `itemId` (text), `itemLabel` (text), `changes` (json: `[{ field, from, to }]`), `summary` (text).

Access: read A; create — (hooks only, via the Local API with `overrideAccess`); update, delete —. A job removes entries older than 2 years.

### `import-runs`

`startedAt`, `finishedAt`, `startedBy`, `source` (`excel` | `dynamics365`), `fileName`, `sheet`, `mapping` (json), `counts` (json: added, updated, skipped, failed), `rows` (json: per-row result and errors, kept for review), `status` (`previewed` | `committed` | `cancelled` | `failed`).

Access: A only.

## Globals

### `display-settings`

`slides` (array of `{ id, enabled, seconds }`, ordered), `days` (`weekdays` | `everyday`), `wakeAt` (time, default 08:00), `sleepAt` (time, default 18:00), `afterHoursMode` (`clock` | `dim` | `blank`), `useStatHolidays` (checkbox, default true), `displayKeyHash` (text, hidden), `pixelShift` (checkbox, default true), `showOfflineMarker` (checkbox, default true). Access: A.

### `display-status`

`lastCheckInAt`, `screenWidth`, `screenHeight`, `userAgent`, `lastFeedAt`, `missedCheckInAlertSentAt`. Written only by the heartbeat route. Access: read A and E.

### `app-settings`

`fiscalYearStartMonth` (number, default 4), `raisedSince2016BaselineCents` (number, default 1250000000), `baselineAsOf` (date: when the baseline figure was reported), `useBaseline` (checkbox, default true), `autoCompleteDefault` (checkbox, default true), `importMappings` (json: remembered column matches per header signature). Access: A.

## Metric formulas (`src/lib/metrics.ts`)

Inputs: all grants (excluding `archived`), `now`, `AppSettings`. Fiscal year (FY) = the April 1 to March 31 year containing `now`.

| Metric | Formula |
| --- | --- |
| `activeCount` | grants where `status = active` |
| `activeFundingCents` | sum of `amountCents` over active grants |
| `completedThisFY` | grants where `status = completed` and `completedAt` in current FY |
| `studentsActive` | sum of `studentsInvolved` over active grants |
| `fundingByFunder` | active grants grouped by funder, sum of `amountCents`, sorted descending |
| `endingIn90Days` | active grants with `endDate` between today and today + 90 days |
| `raisedSince2016Cents` | if `useBaseline`: baseline + sum of `amountCents` for grants with `startDate` after `baselineAsOf`; otherwise sum of `amountCents` for active and completed grants with `startDate` on or after 2016-01-01 |
| `areas[]` | per area: active `amountCents` sum, share of `activeFundingCents`, active count, funder with the largest sum |
| `completed.recent` | 3 completed grants with the latest `completedAt`, display-visible only |
| `completed.studentsThisFY`, `partnersThisFY` | sums or distinct counts over `completedThisFY` grants |

All display metrics count only grants with `showOnDisplay = true`. `baselineAsOf` (when the $12.5M figure was reported) is an open question; until it's known, grants entered in the system are not added to the baseline.

## Excel import contract (`src/import`)

```ts
interface GrantSourceAdapter {
  source: 'excel' | 'dynamics365';
  readRows(input: unknown): Promise<SourceRow[]>;               // raw rows with a stable externalId
  toGrantInput(row: SourceRow, mapping: ColumnMapping): { input?: GrantInput; errors: RowError[] };
}
```

Required mapped fields: `externalId` (Grant ID), `title`, `funder`, `status`. Funder and status values match case-insensitively. Unknown values become row errors with a suggested match (closest name). The review step diffs each row against the existing grant with the same `source` and `externalId`: **new**, **update** (with field changes), **unchanged**, or **error**. Commit runs in one transaction and writes an `import-runs` record and one activity entry.
