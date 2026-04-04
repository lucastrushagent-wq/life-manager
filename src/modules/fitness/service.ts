import type { WorkoutSession, StrengthSet, PersonalRecord } from './types'

const API = '/api/fitness'

export const fitnessService = {
  // Workout sessions
  async getSessions(): Promise<WorkoutSession[]> {
    const r = await fetch(`${API}/sessions`)
    if (!r.ok) throw new Error('Failed to fetch sessions')
    return r.json()
  },
  async addSession(data: Omit<WorkoutSession, 'id' | 'createdAt'>): Promise<WorkoutSession> {
    const r = await fetch(`${API}/sessions`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
    if (!r.ok) throw new Error('Failed to add session')
    return r.json()
  },
  async deleteSession(id: string): Promise<void> {
    const r = await fetch(`${API}/sessions/${id}`, { method: 'DELETE' })
    if (!r.ok) throw new Error('Failed to delete session')
  },

  // Strength sets
  async getSets(params?: { exercise?: string; limit?: number }): Promise<StrengthSet[]> {
    const q = new URLSearchParams()
    if (params?.exercise) q.set('exercise', params.exercise)
    if (params?.limit) q.set('limit', String(params.limit))
    const r = await fetch(`${API}/sets?${q}`)
    if (!r.ok) throw new Error('Failed to fetch sets')
    return r.json()
  },
  async addSet(data: Omit<StrengthSet, 'id' | 'createdAt'>): Promise<StrengthSet> {
    const r = await fetch(`${API}/sets`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
    if (!r.ok) throw new Error('Failed to add set')
    return r.json()
  },
  async deleteSet(id: string): Promise<void> {
    const r = await fetch(`${API}/sets/${id}`, { method: 'DELETE' })
    if (!r.ok) throw new Error('Failed to delete set')
  },

  // Personal records
  async getRecords(): Promise<PersonalRecord[]> {
    const r = await fetch(`${API}/records`)
    if (!r.ok) throw new Error('Failed to fetch records')
    return r.json()
  },
  async addRecord(data: Omit<PersonalRecord, 'id' | 'createdAt'>): Promise<PersonalRecord> {
    const r = await fetch(`${API}/records`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
    if (!r.ok) throw new Error('Failed to add record')
    return r.json()
  },
  async updateRecord(id: string, patch: Partial<Omit<PersonalRecord, 'id' | 'createdAt'>>): Promise<PersonalRecord> {
    const r = await fetch(`${API}/records/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(patch) })
    if (!r.ok) throw new Error('Failed to update record')
    return r.json()
  },
  async deleteRecord(id: string): Promise<void> {
    const r = await fetch(`${API}/records/${id}`, { method: 'DELETE' })
    if (!r.ok) throw new Error('Failed to delete record')
  },
}
