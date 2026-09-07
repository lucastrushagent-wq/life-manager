# Life Manager — Project Context for AI Agents

A personal life management system with a tabbed UI. Each tab is a self-contained
module. Designed for extensibility and AI agent compatibility (MCP) from the ground up.

The longer-term goal is a **digital twin**: a queryable store of personal context
(preferences, providers, routines, finances) that an agent can read before acting
on the owner's behalf — e.g. "book me a massage" resolves to the right spot and the
usual treatment, "add toilet paper to the Costco cart" resolves to the right brand.
Data is modelled with that consumer in mind: freeform preference fields are
deliberate, because an LLM reads them better than rigid columns.

---

## Stack

| Concern      | Choice                                 |
|--------------|----------------------------------------|
| Framework    | React 18 + TypeScript                  |
| Build        | Vite 6                                 |
| Styling      | Tailwind CSS                           |
| State        | Zustand                                |
| Validation   | Zod                                    |
| Backend      | Express 5 + better-sqlite3             |
| Scheduling   | node-cron                              |
| Agent layer  | MCP (Model Context Protocol)           |

---

## Running it

```bash
npm run dev      # vite + tsx watch server, concurrently
npm run build    # tsc -b && vite build  — ALWAYS run before committing
npm start        # NODE_ENV=production tsx server/index.ts (serves dist/ too)
```

The API server listens on **3001**. In dev, Vite proxies `/api` to it
(`vite.config.ts`). In production the same Express process serves `dist/`, so
`/api` is same-origin.

Deployed on an always-on Mac Mini, exposed via a Cloudflare Tunnel at
`lucastrush.com`, gated by Basic Auth. Installed as a PWA on iOS.

---

## Architecture

### Two Registries

Adding a new tab requires one import in each.

```
src/core/tabs.ts     — UI registry (TabConfig[]) + TAB_GROUPS
src/core/mcp.ts      — Agent registry (McpTool[])
```

### Module Structure

Every module is a folder under `src/modules/`. Fully-built modules contain:

| File          | Purpose                                                  |
|---------------|----------------------------------------------------------|
| `index.tsx`   | Exports `TabConfig` — registers the module into the UI   |
| `types.ts`    | TypeScript types for this module's domain                |
| `schema.ts`   | Zod schemas — source of truth for data shapes            |
| `service.ts`  | All CRUD operations — called by both the store and agents|
| `store.ts`    | Zustand slice — UI state, calls service.ts               |
| `tools.ts`    | MCP tool definitions — registers the module into agents  |

Custom files, internal to the module:

```
components/    React components
hooks/         Custom hooks (no logic in components — hooks only)
```

**Placeholder modules** (Spirituality, Learning, Travel, Social, Mental Health,
Creativity, Home) intentionally ship only `index.tsx` + `tools.ts` + a stub
component. They are scaffolding, not broken modules — add the other four files
when the module gets real behaviour.

### Backend

```
server/index.ts        Express app, Basic Auth middleware, route registration
server/db.ts           ALL tables + migrations (single file, see below)
server/cron.ts         Scheduled jobs
server/routes/*.ts     One router per domain, mounted at /api/<name>
server/garmin.ts       Garmin Connect sync
server/ynab.ts         YNAB sync
server/email*.ts       Morning briefing email
```

### Data Flow

```
UI Component
  → custom hook
    → Zustand store (store.ts)
      → service.ts
        → fetch /api/...
          → Express route → SQLite

AI Agent
  → MCP tool (tools.ts)
    → service.ts
      → same path
```

`service.ts` is the single owner of all data operations. Neither the UI nor
agents bypass it.

---

## Conventions

- **No logic in components** — logic lives in hooks, which call the store or service
- **Schemas are the source of truth** — derive types from Zod where practical
  (`z.infer<>`); existing modules keep `types.ts` separate and assert with
  `satisfies z.ZodType<T>` — follow the pattern already in the module you're editing
- **service.ts is the data boundary** — all reads and writes go through it
- **API URLs must be relative** — `const BASE = '/api/thing'`, never
  `http://localhost:3001/...`. An absolute localhost URL works on the host machine
  but breaks for every remote client: the phone resolves `localhost` to itself.
  This has bitten this project before.
- **Migrations are additive** — `server/db.ts` runs `CREATE TABLE IF NOT EXISTS`
  for every table, then guarded `ALTER TABLE ... ADD COLUMN` blocks. Never drop
  or rewrite a column; the production DB is live and `data/` is gitignored, so a
  bad migration cannot be recovered from the repo.
- **`tsc -b` is stricter than the editor** — always `npm run build` before
  committing; unused imports and implicit `any` fail the build
- **Verify against a running server** for backend changes — start it, exercise the
  endpoint with curl, clean up test rows afterwards
- **One module at a time**; commit after each working module
- **No scope creep** — only change what was asked

---

## Tabs

23 tabs. Two standalone, the rest grouped via `TAB_GROUPS` in `src/core/tabs.ts`.

| Group          | Tabs                                                            |
|----------------|-----------------------------------------------------------------|
| *(standalone)* | Vision, To-Do                                                   |
| Money          | Finance, Investments                                            |
| Relationships  | CRM, Lucie, Tweed                                               |
| Health & Body  | Health, Fitness, Mental Health\*, Aesthetics, Fitness Events    |
| Career         | Professional, Learning\*                                        |
| Life           | Spirituality\*, Creativity\*, Social\*, Events, Travel\*         |
| Household      | Shopping, Home\*, Technology, Service Providers                 |

\* placeholder

### Notable module behaviour

- **To-Do** — sub-tabs (Tasks / Future / Recurring / Archive). "Future" is
  auto-derived: due more than 7 days out. New todos default to today + high
  priority. Surfaces overdue CRM follow-ups.
- **CRM** — `followUpDays` cadence drives overdue follow-ups, which appear in the
  To-Do tab. Sortable by reminder frequency as a priority proxy.
- **Finance** — accounts, net worth snapshots, targets, and an Expenses sub-tab
  (CSV import + YNAB). Snapshots recompute on every account write.
- **Shopping** — a **preference catalogue**, not just a list. `preferredBrand`
  holds the specific brand/size; `isPreference` marks a standing preference, which
  "clear checked" unchecks rather than deletes. `GET /api/shopping/preferences?q=`
  is the agent lookup.
- **Technology** — device inventory (warranty expiry, serial numbers for claims,
  who uses what and where) plus recurring tech subscriptions. Costs normalise to an
  annual figure so mixed billing cycles are comparable.
  `GET /api/technology/expiring?days=N` returns `{ warranties, renewals }`,
  excluding sold/retired devices and already-lapsed warranties.
- **Service Providers** — doctor, dentist, hairdresser, trades etc. The
  `preferences` field is freeform "my usual" text an agent reads before booking.
  Optional `frequencyDays` drives a due/overdue indicator.
- **Tweed** — sub-tabs Day-to-day and Vet & Insurance. Day-to-day is a sitter
  handover sheet: a single-row care profile (allergies, food, treats, toys,
  walk/toilet/sleep routines, behaviour, house rules, vet and after-hours
  contacts) plus a time-ordered daily schedule. Allergies render as a red banner
  because getting that wrong hurts the dog. `PUT /api/tweed/profile` is a partial
  save — fields absent from the body keep their stored value.
  Vet & Insurance embeds claim tracking on each medical record rather than using a
  separate claims table, so one vet visit is one row.
  `GET /api/tweed/handover` returns profile + schedule in one call;
  `GET /api/tweed/claims/summary` gives spend vs. rebates.
- **Events** — Upcoming + Goal list. `annual` flags yearly recurrence;
  `ticketsOnSaleDate` drives an on-sale countdown and
  `GET /api/events/on-sale?days=N`, which excludes already-confirmed events.
- **Fitness Events** — the Events pattern applied to races: same Upcoming + Goal
  split and `annual` flag, but registration windows instead of ticket sales
  (`registrationOpensDate` / `registrationClosesDate`), plus `distance`,
  `goalTime` and `resultTime`. `GET /api/fitness-events/open?days=N` returns races
  to enter, tagged `open_now` / `upcoming` / `closed`, excluding anything already
  `registered` or `completed`.

---

## Integrations

| Integration | Env vars | Schedule |
|---|---|---|
| Morning briefing email | `EMAIL_USER`, `EMAIL_PASS`, `EMAIL_TO`, `EMAIL_SEND_TIME` | 6am daily (configurable) |
| Garmin Connect | `GARMIN_EMAIL`, `GARMIN_PASSWORD` | 8pm daily |
| YNAB | `YNAB_API_KEY`, `YNAB_BUDGET_ID` (optional) | 2am daily |
| Basic Auth | `BASIC_AUTH_USER`, `BASIC_AUTH_PASS` | — (active when both set) |

All are **opt-in**: each cron job returns early if its env vars are absent, so the
app runs fine without any of them. `.env` is gitignored.

Timezone for all cron jobs comes from `TZ`, defaulting to `America/New_York`.

**Sync jobs must be idempotent.** They re-pull overlapping windows every night, so
dedupe on a stable external id — YNAB uses a unique partial index on
`ynabTransactionId`; Garmin matches on `garminId`. A sync must never duplicate rows
or clobber user edits: the YNAB account sync updates only `value` and
`lastUpdated`, so a renamed or recategorised account keeps the user's changes.

**`garmin-connect` is CommonJS with no `exports` map.** Import the default and
destructure (`import garminConnect from 'garmin-connect'`) — a named import throws
at module load and takes the whole server down, which silently breaks every tab.
Its available methods vary by version; probe with `typeof client.x === 'function'`
before calling rather than assuming.

---

## Mobile

Responsive throughout — the sidebar collapses to a hamburger drawer below `lg`,
and dense tables use the `sm:hidden` / `hidden sm:block` split to render as cards
on small screens. Follow that pattern for any new table.

iOS safe areas matter: the PWA runs with a translucent status bar, so top chrome
needs `paddingTop: max(Npx, env(safe-area-inset-top))` or it sits under the clock.

---

## Adding a New Tab (Checklist)

1. Create `src/modules/<name>/` with the template files
2. Add the table to `server/db.ts` and a router in `server/routes/<name>.ts`
3. Mount the router in `server/index.ts`
4. Add `import { <name>Tab } from '../modules/<name>'` to `src/core/tabs.ts`,
   and place it in a group
5. Add `...<name>Tools` to `src/core/mcp.ts`
6. `npm run build`, then verify the endpoints against a running server
