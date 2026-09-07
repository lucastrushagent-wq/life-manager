import { create } from 'zustand'
import type { z } from 'zod'
import type {
  TweedProfile, TweedScheduleItem, TweedMedicalRecord, TweedInsurance, ClaimSummary,
} from './types'
import type {
  CreateScheduleItemSchema, UpdateScheduleItemSchema,
  CreateMedicalRecordSchema, UpdateMedicalRecordSchema,
} from './schema'
import { tweedService } from './service'

interface TweedState {
  profile: TweedProfile
  schedule: TweedScheduleItem[]
  medical: TweedMedicalRecord[]
  insurance: TweedInsurance
  summary: ClaimSummary | null
  loading: boolean

  load: () => Promise<void>
  saveProfile: (patch: Partial<TweedProfile>) => Promise<void>

  createScheduleItem: (input: z.infer<typeof CreateScheduleItemSchema>) => Promise<void>
  updateScheduleItem: (id: string, patch: z.infer<typeof UpdateScheduleItemSchema>) => Promise<void>
  removeScheduleItem: (id: string) => Promise<void>

  createMedical: (input: z.infer<typeof CreateMedicalRecordSchema>) => Promise<void>
  updateMedical: (id: string, patch: z.infer<typeof UpdateMedicalRecordSchema>) => Promise<void>
  removeMedical: (id: string) => Promise<void>

  saveInsurance: (patch: Partial<TweedInsurance>) => Promise<void>
}

const EMPTY_PROFILE: TweedProfile = { desexed: false }

export const useTweedStore = create<TweedState>((set) => ({
  profile: EMPTY_PROFILE,
  schedule: [],
  medical: [],
  insurance: {},
  summary: null,
  loading: false,

  load: async () => {
    set({ loading: true })
    try {
      const [profile, schedule, medical, insurance, summary] = await Promise.all([
        tweedService.getProfile(),
        tweedService.getSchedule(),
        tweedService.getMedical(),
        tweedService.getInsurance(),
        tweedService.getClaimSummary(),
      ])
      set({ profile, schedule, medical, insurance, summary, loading: false })
    } catch {
      set({ loading: false })
    }
  },

  saveProfile: async (patch) => {
    const profile = await tweedService.saveProfile(patch)
    set({ profile })
  },

  createScheduleItem: async (input) => {
    const item = await tweedService.createScheduleItem(input)
    set(s => ({ schedule: [...s.schedule, item].sort((a, b) => a.time.localeCompare(b.time)) }))
  },
  updateScheduleItem: async (id, patch) => {
    const item = await tweedService.updateScheduleItem(id, patch)
    set(s => ({
      schedule: s.schedule.map(x => x.id === id ? item : x).sort((a, b) => a.time.localeCompare(b.time)),
    }))
  },
  removeScheduleItem: async (id) => {
    await tweedService.deleteScheduleItem(id)
    set(s => ({ schedule: s.schedule.filter(x => x.id !== id) }))
  },

  // Medical writes move the claim totals, so refresh the summary after each one
  createMedical: async (input) => {
    await tweedService.createMedical(input)
    const [medical, summary] = await Promise.all([
      tweedService.getMedical(), tweedService.getClaimSummary(),
    ])
    set({ medical, summary })
  },
  updateMedical: async (id, patch) => {
    await tweedService.updateMedical(id, patch)
    const [medical, summary] = await Promise.all([
      tweedService.getMedical(), tweedService.getClaimSummary(),
    ])
    set({ medical, summary })
  },
  removeMedical: async (id) => {
    await tweedService.deleteMedical(id)
    const [medical, summary] = await Promise.all([
      tweedService.getMedical(), tweedService.getClaimSummary(),
    ])
    set({ medical, summary })
  },

  saveInsurance: async (patch) => {
    const insurance = await tweedService.saveInsurance(patch)
    set({ insurance })
  },
}))
