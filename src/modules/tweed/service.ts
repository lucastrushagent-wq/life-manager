import type { z } from 'zod'
import type {
  TweedProfile, TweedScheduleItem, TweedMedicalRecord, TweedInsurance, ClaimSummary,
} from './types'
import type {
  CreateScheduleItemSchema, UpdateScheduleItemSchema,
  CreateMedicalRecordSchema, UpdateMedicalRecordSchema,
} from './schema'

const BASE = '/api/tweed'

async function req<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options)
  if (!res.ok) throw new Error(`API error ${res.status}: ${url}`)
  return res.status === 204 ? (undefined as T) : res.json()
}

const json = (body: unknown) => ({
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
})

export interface Handover {
  profile: TweedProfile
  schedule: TweedScheduleItem[]
}

export const tweedService = {
  // Profile
  getProfile(): Promise<TweedProfile> {
    return req<TweedProfile>(`${BASE}/profile`)
  },
  saveProfile(patch: Partial<TweedProfile>): Promise<TweedProfile> {
    return req<TweedProfile>(`${BASE}/profile`, { method: 'PUT', ...json(patch) })
  },

  // Schedule
  getSchedule(): Promise<TweedScheduleItem[]> {
    return req<TweedScheduleItem[]>(`${BASE}/schedule`)
  },
  createScheduleItem(input: z.infer<typeof CreateScheduleItemSchema>): Promise<TweedScheduleItem> {
    return req<TweedScheduleItem>(`${BASE}/schedule`, { method: 'POST', ...json(input) })
  },
  updateScheduleItem(id: string, patch: z.infer<typeof UpdateScheduleItemSchema>): Promise<TweedScheduleItem> {
    return req<TweedScheduleItem>(`${BASE}/schedule/${id}`, { method: 'PATCH', ...json(patch) })
  },
  deleteScheduleItem(id: string): Promise<void> {
    return req<void>(`${BASE}/schedule/${id}`, { method: 'DELETE' })
  },

  // Medical
  getMedical(): Promise<TweedMedicalRecord[]> {
    return req<TweedMedicalRecord[]>(`${BASE}/medical`)
  },
  createMedical(input: z.infer<typeof CreateMedicalRecordSchema>): Promise<TweedMedicalRecord> {
    return req<TweedMedicalRecord>(`${BASE}/medical`, { method: 'POST', ...json(input) })
  },
  updateMedical(id: string, patch: z.infer<typeof UpdateMedicalRecordSchema>): Promise<TweedMedicalRecord> {
    return req<TweedMedicalRecord>(`${BASE}/medical/${id}`, { method: 'PATCH', ...json(patch) })
  },
  deleteMedical(id: string): Promise<void> {
    return req<void>(`${BASE}/medical/${id}`, { method: 'DELETE' })
  },

  // Insurance
  getInsurance(): Promise<TweedInsurance> {
    return req<TweedInsurance>(`${BASE}/insurance`)
  },
  saveInsurance(patch: Partial<TweedInsurance>): Promise<TweedInsurance> {
    return req<TweedInsurance>(`${BASE}/insurance`, { method: 'PUT', ...json(patch) })
  },

  // Aggregates
  getClaimSummary(): Promise<ClaimSummary> {
    return req<ClaimSummary>(`${BASE}/claims/summary`)
  },
  /** Everything a sitter needs, in one call. */
  getHandover(): Promise<Handover> {
    return req<Handover>(`${BASE}/handover`)
  },
}
