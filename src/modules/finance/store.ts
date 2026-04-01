import { create } from 'zustand'
import { z } from 'zod'
import type { FinanceAccount, NetWorthSnapshot } from './types'
import { financeService } from './service'
import { CreateFinanceAccountSchema } from './schema'

interface FinanceStore {
  accounts: FinanceAccount[]
  snapshots: NetWorthSnapshot[]
  load: () => Promise<void>
  create: (input: z.infer<typeof CreateFinanceAccountSchema>) => Promise<void>
  update: (id: string, patch: Partial<Omit<FinanceAccount, 'id' | 'createdAt'>>) => Promise<void>
  remove: (id: string) => Promise<void>
}

export const useFinanceStore = create<FinanceStore>((set) => ({
  accounts: [],
  snapshots: [],
  load: async () => {
    const [accounts, snapshots] = await Promise.all([
      financeService.getAll(),
      financeService.getSnapshots(),
    ])
    set({ accounts, snapshots })
  },
  create: async (input) => {
    await financeService.create(input)
    const [accounts, snapshots] = await Promise.all([
      financeService.getAll(),
      financeService.getSnapshots(),
    ])
    set({ accounts, snapshots })
  },
  update: async (id, patch) => {
    await financeService.update(id, patch)
    const [accounts, snapshots] = await Promise.all([
      financeService.getAll(),
      financeService.getSnapshots(),
    ])
    set({ accounts, snapshots })
  },
  remove: async (id) => {
    await financeService.delete(id)
    const [accounts, snapshots] = await Promise.all([
      financeService.getAll(),
      financeService.getSnapshots(),
    ])
    set({ accounts, snapshots })
  },
}))
