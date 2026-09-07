import type { CalendarEvent } from './types'
import type { z } from 'zod'
import type { CreateEventSchema, UpdateEventSchema } from './schema'

const BASE = '/api/events'

async function req<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options)
  if (!res.ok) throw new Error(`API error ${res.status}: ${url}`)
  return res.status === 204 ? (undefined as T) : res.json()
}

const json = (body: unknown) => ({
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
})

export const eventsService = {
  getAll(): Promise<CalendarEvent[]> {
    return req<CalendarEvent[]>(BASE)
  },
  getAlerts(): Promise<CalendarEvent[]> {
    return req<CalendarEvent[]>(`${BASE}/alerts`)
  },
  /** Events already on sale, or going on sale within `days`, that are not yet confirmed. */
  getOnSale(days = 30): Promise<(CalendarEvent & { onSaleStatus: 'on_sale_now' | 'upcoming' })[]> {
    return req(`${BASE}/on-sale?days=${days}`)
  },
  create(input: z.infer<typeof CreateEventSchema>): Promise<CalendarEvent> {
    return req<CalendarEvent>(BASE, { method: 'POST', ...json(input) })
  },
  update(id: string, patch: z.infer<typeof UpdateEventSchema>): Promise<CalendarEvent> {
    return req<CalendarEvent>(`${BASE}/${id}`, { method: 'PATCH', ...json(patch) })
  },
  delete(id: string): Promise<void> {
    return req<void>(`${BASE}/${id}`, { method: 'DELETE' })
  },
}
