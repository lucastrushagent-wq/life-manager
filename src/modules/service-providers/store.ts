import { create } from 'zustand'
import type { ServiceProvider } from './types'
import { serviceProviderService } from './service'
import type { CreateProviderData } from './service'

interface ServiceProviderState {
  providers: ServiceProvider[]
  loading: boolean
  showArchived: boolean
  load: () => Promise<void>
  setShowArchived: (v: boolean) => void
  create: (input: CreateProviderData) => Promise<void>
  update: (id: string, patch: Partial<Omit<ServiceProvider, 'id' | 'createdAt'>>) => Promise<void>
  remove: (id: string) => Promise<void>
  logVisit: (id: string, date?: string) => Promise<void>
}

export const useServiceProviderStore = create<ServiceProviderState>((set, get) => ({
  providers: [],
  loading: false,
  showArchived: false,

  load: async () => {
    set({ loading: true })
    try {
      const providers = await serviceProviderService.getAll({ archived: get().showArchived })
      set({ providers, loading: false })
    } catch {
      set({ loading: false })
    }
  },

  setShowArchived: (v) => {
    set({ showArchived: v })
    get().load()
  },

  create: async (input) => {
    await serviceProviderService.create(input)
    await get().load()
  },

  update: async (id, patch) => {
    const updated = await serviceProviderService.update(id, patch)
    // Archiving moves the row out of the current view — reload rather than patch in place
    if (patch.archived !== undefined) return get().load()
    set(s => ({ providers: s.providers.map(p => p.id === id ? updated : p) }))
  },

  remove: async (id) => {
    await serviceProviderService.delete(id)
    set(s => ({ providers: s.providers.filter(p => p.id !== id) }))
  },

  logVisit: async (id, date) => {
    const updated = await serviceProviderService.logVisit(id, date)
    set(s => ({ providers: s.providers.map(p => p.id === id ? updated : p) }))
  },
}))
