import { create } from 'zustand'
import type { CalendarEvent } from './types'
import type { z } from 'zod'
import type { CreateEventSchema, UpdateEventSchema } from './schema'
import { eventsService } from './service'

interface EventsStore {
  events: CalendarEvent[]
  load: () => Promise<void>
  create: (input: z.infer<typeof CreateEventSchema>) => Promise<void>
  update: (id: string, patch: z.infer<typeof UpdateEventSchema>) => Promise<void>
  remove: (id: string) => Promise<void>
}

export const useEventsStore = create<EventsStore>((set) => ({
  events: [],

  load: async () => {
    const events = await eventsService.getAll()
    set({ events })
  },

  create: async (input) => {
    const e = await eventsService.create(input)
    set(s => ({ events: [...s.events, e] }))
  },

  update: async (id, patch) => {
    const e = await eventsService.update(id, patch)
    set(s => ({ events: s.events.map(x => x.id === id ? e : x) }))
  },

  remove: async (id) => {
    await eventsService.delete(id)
    set(s => ({ events: s.events.filter(x => x.id !== id) }))
  },
}))
