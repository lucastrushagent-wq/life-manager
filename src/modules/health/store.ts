import { create } from 'zustand'
import type { HealthMetricEntry, BloodWorkEntry, Medication, MedicalHistoryEntry } from './types'
import { healthService } from './service'

interface HealthStore {
  metrics: HealthMetricEntry[]
  bloodWork: BloodWorkEntry[]
  medications: Medication[]
  history: MedicalHistoryEntry[]
  loaded: boolean
  load: () => Promise<void>
  addMetric: (data: Omit<HealthMetricEntry, 'id' | 'createdAt'>) => Promise<void>
  deleteMetric: (id: string) => Promise<void>
  addBloodWork: (data: Omit<BloodWorkEntry, 'id' | 'createdAt'>) => Promise<void>
  updateBloodWork: (id: string, patch: Partial<Omit<BloodWorkEntry, 'id' | 'createdAt'>>) => Promise<void>
  deleteBloodWork: (id: string) => Promise<void>
  addMedication: (data: Omit<Medication, 'id' | 'active' | 'createdAt'>) => Promise<void>
  updateMedication: (id: string, patch: Partial<Omit<Medication, 'id' | 'createdAt'>>) => Promise<void>
  deleteMedication: (id: string) => Promise<void>
  addHistory: (data: Omit<MedicalHistoryEntry, 'id' | 'createdAt'>) => Promise<void>
  updateHistory: (id: string, patch: Partial<Omit<MedicalHistoryEntry, 'id' | 'createdAt'>>) => Promise<void>
  deleteHistory: (id: string) => Promise<void>
}

export const useHealthStore = create<HealthStore>((set) => ({
  metrics: [],
  bloodWork: [],
  medications: [],
  history: [],
  loaded: false,

  load: async () => {
    const [metrics, bloodWork, medications, history] = await Promise.all([
      healthService.getMetrics(),
      healthService.getBloodWork(),
      healthService.getMedications(),
      healthService.getHistory(),
    ])
    set({ metrics, bloodWork, medications, history, loaded: true })
  },

  addMetric: async (data) => {
    const entry = await healthService.addMetric(data)
    set(s => ({ metrics: [entry, ...s.metrics] }))
  },
  deleteMetric: async (id) => {
    await healthService.deleteMetric(id)
    set(s => ({ metrics: s.metrics.filter(m => m.id !== id) }))
  },

  addBloodWork: async (data) => {
    const entry = await healthService.addBloodWork(data)
    set(s => ({ bloodWork: [entry, ...s.bloodWork] }))
  },
  updateBloodWork: async (id, patch) => {
    const entry = await healthService.updateBloodWork(id, patch)
    set(s => ({ bloodWork: s.bloodWork.map(b => b.id === id ? entry : b) }))
  },
  deleteBloodWork: async (id) => {
    await healthService.deleteBloodWork(id)
    set(s => ({ bloodWork: s.bloodWork.filter(b => b.id !== id) }))
  },

  addMedication: async (data) => {
    const med = await healthService.addMedication(data)
    set(s => ({ medications: [...s.medications, med] }))
  },
  updateMedication: async (id, patch) => {
    const med = await healthService.updateMedication(id, patch)
    set(s => ({ medications: s.medications.map(m => m.id === id ? med : m) }))
  },
  deleteMedication: async (id) => {
    await healthService.deleteMedication(id)
    set(s => ({ medications: s.medications.filter(m => m.id !== id) }))
  },

  addHistory: async (data) => {
    const entry = await healthService.addHistory(data)
    set(s => ({ history: [entry, ...s.history] }))
  },
  updateHistory: async (id, patch) => {
    const entry = await healthService.updateHistory(id, patch)
    set(s => ({ history: s.history.map(h => h.id === id ? entry : h) }))
  },
  deleteHistory: async (id) => {
    await healthService.deleteHistory(id)
    set(s => ({ history: s.history.filter(h => h.id !== id) }))
  },
}))
