import { API_BASE } from '../../core/apiBase.js'
import type { z } from 'zod'
import type { CalendarInvite, CalendarStatus } from './types'
import type { CreateInviteSchema, UpdateInviteSchema } from './schema'

const BASE = `${API_BASE}/api/calendar`

async function req<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options)
  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as { error?: string }
    throw new Error(body.error ?? `API error ${res.status}: ${url}`)
  }
  return res.status === 204 ? (undefined as T) : res.json()
}

const json = (body: unknown) => ({
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
})

const qs = (dryRun?: boolean) => (dryRun ? '?dryRun=true' : '')

export const calendarService = {
  getStatus(): Promise<CalendarStatus> {
    return req<CalendarStatus>(`${BASE}/status`)
  },
  list(upcomingOnly = false): Promise<CalendarInvite[]> {
    return req<CalendarInvite[]>(`${BASE}/invites${upcomingOnly ? '?upcoming=true' : ''}`)
  },
  send(input: z.infer<typeof CreateInviteSchema>, dryRun?: boolean): Promise<CalendarInvite & { ics?: string }> {
    return req(`${BASE}/invites${qs(dryRun)}`, { method: 'POST', ...json(input) })
  },
  update(id: string, patch: z.infer<typeof UpdateInviteSchema>, dryRun?: boolean): Promise<CalendarInvite & { ics?: string }> {
    return req(`${BASE}/invites/${id}${qs(dryRun)}`, { method: 'PATCH', ...json(patch) })
  },
  cancel(id: string, dryRun?: boolean): Promise<CalendarInvite & { ics?: string }> {
    return req(`${BASE}/invites/${id}/cancel${qs(dryRun)}`, { method: 'POST' })
  },
}
