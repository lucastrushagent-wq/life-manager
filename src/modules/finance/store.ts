import { create } from 'zustand'
import { z } from 'zod'
import type { Transaction } from './types'
import { financeService } from './service'
import { CreateTransactionSchema } from './schema'

interface FinanceStore {
  transactions: Transaction[]
  load: () => void
  create: (input: z.infer<typeof CreateTransactionSchema>) => void
  remove: (id: string) => void
}

export const useFinanceStore = create<FinanceStore>((set) => ({
  transactions: [],
  load: () => set({ transactions: financeService.getAll() }),
  create: (input) => {
    financeService.create(input)
    set({ transactions: financeService.getAll() })
  },
  remove: (id) => {
    financeService.delete(id)
    set({ transactions: financeService.getAll() })
  },
}))
