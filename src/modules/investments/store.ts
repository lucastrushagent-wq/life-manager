import { create } from 'zustand'
import { investmentsService } from './service'
import type { Holding } from './types'

interface InvestmentsStore {
  holdings: Holding[]
  loaded: boolean
  load: () => Promise<void>
  addHolding: (data: Omit<Holding, 'id' | 'createdAt'>) => Promise<void>
  updateHolding: (id: string, data: Partial<Omit<Holding, 'id' | 'createdAt'>>) => Promise<void>
  deleteHolding: (id: string) => Promise<void>
}

export const useInvestmentsStore = create<InvestmentsStore>((set) => ({
  holdings: [],
  loaded: false,

  load: async () => {
    const holdings = await investmentsService.getHoldings()
    set({ holdings, loaded: true })
  },

  addHolding: async (data) => {
    const holding = await investmentsService.addHolding(data)
    set(s => ({ holdings: [...s.holdings, holding] }))
  },

  updateHolding: async (id, data) => {
    const updated = await investmentsService.updateHolding(id, data)
    set(s => ({ holdings: s.holdings.map(h => h.id === id ? updated : h) }))
  },

  deleteHolding: async (id) => {
    await investmentsService.deleteHolding(id)
    set(s => ({ holdings: s.holdings.filter(h => h.id !== id) }))
  },
}))
