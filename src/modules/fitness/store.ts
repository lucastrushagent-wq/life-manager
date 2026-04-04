import { create } from 'zustand'
import type { WorkoutSession, StrengthSet, PersonalRecord } from './types'
import { fitnessService } from './service'

interface FitnessStore {
  sessions: WorkoutSession[]
  sets: StrengthSet[]
  records: PersonalRecord[]
  loaded: boolean
  load: () => Promise<void>
  addSession: (data: Omit<WorkoutSession, 'id' | 'createdAt'>) => Promise<void>
  deleteSession: (id: string) => Promise<void>
  addSet: (data: Omit<StrengthSet, 'id' | 'createdAt'>) => Promise<void>
  deleteSet: (id: string) => Promise<void>
  addRecord: (data: Omit<PersonalRecord, 'id' | 'createdAt'>) => Promise<void>
  updateRecord: (id: string, patch: Partial<Omit<PersonalRecord, 'id' | 'createdAt'>>) => Promise<void>
  deleteRecord: (id: string) => Promise<void>
}

export const useFitnessStore = create<FitnessStore>((set) => ({
  sessions: [],
  sets: [],
  records: [],
  loaded: false,

  load: async () => {
    const [sessions, sets, records] = await Promise.all([
      fitnessService.getSessions(),
      fitnessService.getSets(),
      fitnessService.getRecords(),
    ])
    set({ sessions, sets, records, loaded: true })
  },

  addSession: async (data) => {
    const s = await fitnessService.addSession(data)
    set(st => ({ sessions: [s, ...st.sessions] }))
  },
  deleteSession: async (id) => {
    await fitnessService.deleteSession(id)
    set(st => ({ sessions: st.sessions.filter(s => s.id !== id) }))
  },

  addSet: async (data) => {
    const s = await fitnessService.addSet(data)
    set(st => ({ sets: [s, ...st.sets] }))
  },
  deleteSet: async (id) => {
    await fitnessService.deleteSet(id)
    set(st => ({ sets: st.sets.filter(s => s.id !== id) }))
  },

  addRecord: async (data) => {
    const r = await fitnessService.addRecord(data)
    set(st => ({ records: [r, ...st.records] }))
  },
  updateRecord: async (id, patch) => {
    const r = await fitnessService.updateRecord(id, patch)
    set(st => ({ records: st.records.map(rec => rec.id === id ? r : rec) }))
  },
  deleteRecord: async (id) => {
    await fitnessService.deleteRecord(id)
    set(st => ({ records: st.records.filter(r => r.id !== id) }))
  },
}))
