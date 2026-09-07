import { create } from 'zustand'
import type { FitnessEvent } from './types'
import type { z } from 'zod'
import type { CreateFitnessEventSchema, UpdateFitnessEventSchema } from './schema'
import { fitnessEventsService } from './service'

interface FitnessEventsStore {
  events: FitnessEvent[]
  load: () => Promise<void>
  create: (input: z.infer<typeof CreateFitnessEventSchema>) => Promise<void>
  update: (id: string, patch: z.infer<typeof UpdateFitnessEventSchema>) => Promise<void>
  remove: (id: string) => Promise<void>
}

export const useFitnessEventsStore = create<FitnessEventsStore>((set) => ({
  events: [],

  load: async () => {
    const events = await fitnessEventsService.getAll()
    set({ events })
  },

  create: async (input) => {
    const e = await fitnessEventsService.create(input)
    set(s => ({ events: [...s.events, e] }))
  },

  update: async (id, patch) => {
    const e = await fitnessEventsService.update(id, patch)
    set(s => ({ events: s.events.map(x => x.id === id ? e : x) }))
  },

  remove: async (id) => {
    await fitnessEventsService.delete(id)
    set(s => ({ events: s.events.filter(x => x.id !== id) }))
  },
}))
