import { create } from 'zustand'
import { z } from 'zod'
import type { FinanceAccount } from './types'
import { financeService } from './service'
import { CreateFinanceAccountSchema } from './schema'

interface FinanceStore {
  accounts: FinanceAccount[]
  load: () => Promise<void>
  create: (input: z.infer<typeof CreateFinanceAccountSchema>) => Promise<void>
  update: (id: string, patch: Partial<Omit<FinanceAccount, 'id' | 'createdAt'>>) => Promise<void>
  remove: (id: string) => Promise<void>
}

export const useFinanceStore = create<FinanceStore>((set) => ({
  accounts: [],
  load: async () => {
    set({ accounts: await financeService.getAll() })
  },
  create: async (input) => {
    await financeService.create(input)
    set({ accounts: await financeService.getAll() })
  },
  update: async (id, patch) => {
    await financeService.update(id, patch)
    set(state => ({
      accounts: state.accounts.map(a => a.id === id ? { ...a, ...patch } : a),
    }))
  },
  remove: async (id) => {
    await financeService.delete(id)
    set(state => ({ accounts: state.accounts.filter(a => a.id !== id) }))
  },
}))
