/**
 * Prefix for every API URL built in `service.ts`.
 *
 * In the browser this is the empty string, so URLs stay relative — same-origin in
 * production, and proxied by Vite in dev. Relative URLs are required there: an
 * absolute `http://localhost:3001` breaks every remote client, because the phone
 * resolves `localhost` to itself.
 *
 * In Node it must be absolute — `fetch` rejects a relative URL outright with
 * "Failed to parse URL". The MCP server sets LIFE_MANAGER_API (normally
 * http://127.0.0.1:3002, the loopback port that skips Basic Auth) so the same
 * service layer works unmodified in both places.
 *
 * `process` does not exist in the browser, hence the typeof guard.
 */
function resolveApiBase(): string {
  if (typeof process === 'undefined') return ''
  const configured = process.env?.LIFE_MANAGER_API
  if (!configured) return ''
  return configured.replace(/\/+$/, '')
}

export const API_BASE = resolveApiBase()
