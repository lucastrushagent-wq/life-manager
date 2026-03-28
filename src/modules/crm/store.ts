import { create } from 'zustand'
import { z } from 'zod'
import type { Contact } from './types'
import { crmService } from './service'
import { CreateContactSchema } from './schema'

interface CrmStore {
  contacts: Contact[]
  load: () => void
  create: (input: z.infer<typeof CreateContactSchema>) => void
  update: (id: string, patch: Partial<Omit<Contact, 'id' | 'createdAt'>>) => void
  remove: (id: string) => void
}

export const useCrmStore = create<CrmStore>((set) => ({
  contacts: [],
  load: () => set({ contacts: crmService.getAll() }),
  create: (input) => {
    crmService.create(input)
    set({ contacts: crmService.getAll() })
  },
  update: (id, patch) => {
    crmService.update(id, patch)
    set({ contacts: crmService.getAll() })
  },
  remove: (id) => {
    crmService.delete(id)
    set({ contacts: crmService.getAll() })
  },
}))
