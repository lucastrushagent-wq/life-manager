import { create } from 'zustand'
import { z } from 'zod'
import type { Contact } from './types'
import { crmService } from './service'
import { CreateContactSchema } from './schema'

interface CrmStore {
  contacts: Contact[]
  load: () => Promise<void>
  create: (input: z.infer<typeof CreateContactSchema>) => Promise<void>
  update: (id: string, patch: Partial<Omit<Contact, 'id' | 'createdAt' | 'lastContactedAt'>>) => Promise<void>
  archive: (id: string, archived: boolean) => Promise<void>
  remove: (id: string) => Promise<void>
}

export const useCrmStore = create<CrmStore>((set) => ({
  contacts: [],
  load: async () => {
    set({ contacts: await crmService.getAll() })
  },
  create: async (input) => {
    await crmService.create(input)
    set({ contacts: await crmService.getAll() })
  },
  update: async (id, patch) => {
    await crmService.update(id, patch)
    set({ contacts: await crmService.getAll() })
  },
  archive: async (id, archived) => {
    await crmService.update(id, { archived })
    set(state => ({ contacts: state.contacts.map(c => c.id === id ? { ...c, archived } : c) }))
  },
  remove: async (id) => {
    await crmService.delete(id)
    set(state => ({ contacts: state.contacts.filter(c => c.id !== id) }))
  },
}))
