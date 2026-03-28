# Life Manager — Project Context for AI Agents

A personal life management system with a tabbed UI. Each tab is a self-contained
module. Designed for extensibility and AI agent compatibility (MCP) from the ground up.

---

## Stack

| Concern      | Choice                        |
|--------------|-------------------------------|
| Framework    | React + TypeScript            |
| Build        | Vite                          |
| Styling      | Tailwind CSS                  |
| State        | Zustand (with persist middleware) |
| Validation   | Zod                           |
| Backend      | Local server + SQLite (TBD)   |
| Agent layer  | MCP (Model Context Protocol)  |

---

## Tabs (Modules)

| Tab             | Module path          | Status      |
|-----------------|----------------------|-------------|
| To-Do List      | src/modules/todo     | planned     |
| Personal CRM    | src/modules/crm      | planned     |
| Finance Tracker | src/modules/finance  | planned     |

---

## Architecture

### Two Registries

The core system has two registries. Adding a new tab requires one import in each.

```
src/core/tabs.ts     — UI registry (TabConfig[])
src/core/mcp.ts      — Agent registry (McpTool[])
```

### Module Structure

Every module is a folder under `src/modules/`. Each contains:

**Template files** (required by every module — the contract):

| File          | Purpose                                                  |
|---------------|----------------------------------------------------------|
| `index.tsx`   | Exports `TabConfig` — registers the module into the UI   |
| `types.ts`    | TypeScript types for this module's domain                |
| `schema.ts`   | Zod schemas — source of truth for data shapes            |
| `service.ts`  | All CRUD operations — called by both the store and agents|
| `store.ts`    | Zustand slice — UI state, calls service.ts               |
| `tools.ts`    | MCP tool definitions — registers the module into agents  |

**Custom files** (internal to the module, invisible to core):

```
components/    React components
hooks/         Custom hooks (no logic in components — hooks only)
```

### Data Flow

```
UI Component
  → custom hook
    → Zustand store (store.ts)
      → service.ts
        → storage layer (localStorage now, SQLite later)

AI Agent
  → MCP tool (tools.ts)
    → service.ts
      → storage layer
```

`service.ts` is the single owner of all data operations. Neither the UI nor agents
bypass it.

### Tab Contract

Each module's `index.tsx` must export a `TabConfig`:

```ts
import { TabConfig } from '../../core/tabs'

export const myTab: TabConfig = {
  id: 'my-tab',        // unique, kebab-case
  label: 'My Tab',     // display name
  icon: SomeIcon,      // lucide-react icon component
  component: MyModule, // root React component for this tab
}
```

Each module's `tools.ts` must export a `McpTool[]`:

```ts
import { McpTool } from '../../core/mcp'

export const myTools: McpTool[] = [
  {
    name: 'mytab_list',
    description: 'List all items',
    inputSchema: z.object({}),
    handler: async () => myService.getAll(),
  },
]
```

---

## Conventions

- **No logic in components** — all logic lives in hooks, which call the store or service
- **Schemas are the source of truth** — derive TypeScript types from Zod schemas (`z.infer<>`)
- **service.ts is the data boundary** — all reads and writes go through it, no exceptions
- **One module at a time** — implement, test, and commit each module before starting the next
- **Commit after each working module** — never leave a session with a large uncommitted diff
- **No scope creep** — only change what was asked; no unsolicited improvements

---

## Out of Scope (for now)

- Authentication / multi-user
- Cloud sync
- Mobile / responsive design
- Notifications / reminders
- Inter-module relationships (e.g. linking a CRM contact to a todo)

These can be added later without restructuring — the module boundary makes them safe to defer.

---

## Adding a New Tab (Checklist)

1. Create `src/modules/<name>/` with all 6 template files
2. Add `import { <name>Tab } from '../modules/<name>'` to `src/core/tabs.ts`
3. Add `...<name>Tools` to the tools array in `src/core/mcp.ts`
4. Done — the tab appears in the UI and is agent-accessible
