#!/usr/bin/env node
/**
 * stdio MCP server exposing the Life Manager tool registry.
 *
 * Runs on the same machine as the API and talks to it over HTTP, so the Express
 * process stays the only thing that opens the SQLite file. That matters: an agent
 * writing to the database directly bypasses route logic (`saveSnapshot()`), skips
 * Zod validation, and — across a bind mount where file locks are not coordinated
 * between host and guest — risks corruption rather than a clean SQLITE_BUSY.
 *
 * Talks to AGENT_PORT (3002) by default, which is loopback-only and exempt from
 * Basic Auth, so no credential is involved anywhere in this path.
 *
 * IMPORTANT: stdout is the MCP protocol channel. Everything logged here goes to
 * stderr — a stray console.log would corrupt the stream.
 */
import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js'
import { zodToJsonSchema } from 'zod-to-json-schema'

// Must be set before importing the tool registry: service.ts modules resolve
// API_BASE at module load, so a static import would bake in the browser default.
process.env.LIFE_MANAGER_API ??= 'http://127.0.0.1:3002'
const API = process.env.LIFE_MANAGER_API

const { mcpTools } = await import('../src/core/mcp.js')
type Tool = (typeof mcpTools)[number]

// ── Read/write classification ─────────────────────────────────────────────────

// Writes are opt-in. Rather than trying to spot mutating verbs — where anything
// missed silently becomes an exposed write — a tool is treated as a read only if
// its name matches a known read shape. Anything unrecognised is withheld.
const READ_PATTERNS = [/_list$/, /_list_/, /^list_/, /_get$/, /_get_/, /^get_/, /_find(_|$)/, /_summary$/]
const READ_EXTRA = new Set([
  'tweed_handover',
  'tech_expiring',
  'fitness_events_open',
  'events_on_sale',
  'finance_net_worth',
])

const isRead = (name: string) => READ_EXTRA.has(name) || READ_PATTERNS.some(re => re.test(name))

const ALLOW_WRITES = process.env.MCP_ALLOW_WRITES === 'true'
const exposed: Tool[] = ALLOW_WRITES ? mcpTools : mcpTools.filter(t => isRead(t.name))
const byName = new Map(exposed.map(t => [t.name, t]))

// ── Server ────────────────────────────────────────────────────────────────────

const server = new Server(
  { name: 'life-manager', version: '1.0.0' },
  { capabilities: { tools: {} } },
)

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: exposed.map(t => ({
    name: t.name,
    description: t.description,
    inputSchema: zodToJsonSchema(t.inputSchema, { $refStrategy: 'none' }) as Record<string, unknown>,
  })),
}))

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params
  const tool = byName.get(name)

  if (!tool) {
    // Distinguish "withheld" from "does not exist" — otherwise a read-only server
    // looks broken rather than deliberately restricted.
    const withheld = mcpTools.some(t => t.name === name)
    const detail = withheld
      ? `Tool "${name}" is a write and this server is read-only. Set MCP_ALLOW_WRITES=true to enable writes.`
      : `Unknown tool "${name}".`
    return { content: [{ type: 'text' as const, text: detail }], isError: true }
  }

  try {
    // Validate before dispatch so a malformed call fails here with a useful
    // message rather than as an opaque 400 from the API.
    const parsed = tool.inputSchema.safeParse(args ?? {})
    if (!parsed.success) {
      return {
        content: [{ type: 'text' as const, text: `Invalid arguments for ${name}: ${parsed.error.message}` }],
        isError: true,
      }
    }

    const result = await tool.handler(parsed.data)
    return {
      content: [{
        type: 'text' as const,
        text: result === undefined ? 'OK' : JSON.stringify(result, null, 2),
      }],
    }
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e)
    const hint = /fetch failed|ECONNREFUSED/i.test(message)
      ? ` — is the Life Manager server running, and reachable at ${API}?`
      : ''
    return { content: [{ type: 'text' as const, text: `${name} failed: ${message}${hint}` }], isError: true }
  }
})

const withheld = mcpTools.length - exposed.length
console.error(
  `[life-manager-mcp] ${exposed.length} tools exposed` +
  (withheld > 0 ? `, ${withheld} writes withheld (MCP_ALLOW_WRITES=true to enable)` : ' (writes enabled)') +
  ` — API ${API}`,
)

await server.connect(new StdioServerTransport())
