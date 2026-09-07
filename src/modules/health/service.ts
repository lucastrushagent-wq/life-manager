import type { HealthMetricEntry, BloodWorkEntry, Medication, MedicalHistoryEntry } from './types'

const BASE = '/api/health'

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`)
  if (!res.ok) throw new Error(`Health API error: ${path}`)
  return res.json()
}
async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
  if (!res.ok) throw new Error(`Health API error: ${path}`)
  return res.json()
}
async function put<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
  if (!res.ok) throw new Error(`Health API error: ${path}`)
  return res.json()
}
async function del(path: string): Promise<void> {
  await fetch(`${BASE}${path}`, { method: 'DELETE' })
}

export const healthService = {
  getMetrics: (params?: { category?: string; metric?: string; limit?: number }) => {
    const q = new URLSearchParams()
    if (params?.category) q.set('category', params.category)
    if (params?.metric) q.set('metric', params.metric)
    if (params?.limit) q.set('limit', String(params.limit))
    return get<HealthMetricEntry[]>(`/metrics?${q}`)
  },
  addMetric: (data: Omit<HealthMetricEntry, 'id' | 'createdAt'>) => post<HealthMetricEntry>('/metrics', data),
  deleteMetric: (id: string) => del(`/metrics/${id}`),

  getBloodWork: () => get<BloodWorkEntry[]>('/blood-work'),
  addBloodWork: (data: Omit<BloodWorkEntry, 'id' | 'createdAt'>) => post<BloodWorkEntry>('/blood-work', data),
  updateBloodWork: (id: string, patch: Partial<Omit<BloodWorkEntry, 'id' | 'createdAt'>>) => put<BloodWorkEntry>(`/blood-work/${id}`, patch),
  deleteBloodWork: (id: string) => del(`/blood-work/${id}`),

  getMedications: () => get<Medication[]>('/medications'),
  addMedication: (data: Omit<Medication, 'id' | 'active' | 'createdAt'>) => post<Medication>('/medications', data),
  updateMedication: (id: string, patch: Partial<Omit<Medication, 'id' | 'createdAt'>>) => put<Medication>(`/medications/${id}`, patch),
  deleteMedication: (id: string) => del(`/medications/${id}`),

  getHistory: () => get<MedicalHistoryEntry[]>('/history'),
  addHistory: (data: Omit<MedicalHistoryEntry, 'id' | 'createdAt'>) => post<MedicalHistoryEntry>('/history', data),
  updateHistory: (id: string, patch: Partial<Omit<MedicalHistoryEntry, 'id' | 'createdAt'>>) => put<MedicalHistoryEntry>(`/history/${id}`, patch),
  deleteHistory: (id: string) => del(`/history/${id}`),
}
