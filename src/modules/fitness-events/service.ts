import type { FitnessEvent } from './types'
import type { z } from 'zod'
import type { CreateFitnessEventSchema, UpdateFitnessEventSchema } from './schema'

const BASE = '/api/fitness-events'

async function req<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options)
  if (!res.ok) throw new Error(`API error ${res.status}: ${url}`)
  return res.status === 204 ? (undefined as T) : res.json()
}

const json = (body: unknown) => ({
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
})

export type RegistrationStatus = 'open_now' | 'upcoming' | 'closed'

export const fitnessEventsService = {
  getAll(): Promise<FitnessEvent[]> {
    return req<FitnessEvent[]>(BASE)
  },
  getAlerts(): Promise<FitnessEvent[]> {
    return req<FitnessEvent[]>(`${BASE}/alerts`)
  },
  /** Races with registration open now, or opening within `days`, not yet entered. */
  getOpen(days = 30): Promise<(FitnessEvent & { registrationStatus: RegistrationStatus })[]> {
    return req(`${BASE}/open?days=${days}`)
  },
  create(input: z.infer<typeof CreateFitnessEventSchema>): Promise<FitnessEvent> {
    return req<FitnessEvent>(BASE, { method: 'POST', ...json(input) })
  },
  update(id: string, patch: z.infer<typeof UpdateFitnessEventSchema>): Promise<FitnessEvent> {
    return req<FitnessEvent>(`${BASE}/${id}`, { method: 'PATCH', ...json(patch) })
  },
  delete(id: string): Promise<void> {
    return req<void>(`${BASE}/${id}`, { method: 'DELETE' })
  },
}
