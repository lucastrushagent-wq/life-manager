import { create } from 'zustand'
import { z } from 'zod'
import type { FinanceAccount, NetWorthSnapshot, NetWorthTarget } from './types'
import { financeService } from './service'
import { CreateFinanceAccountSchema, CreateNetWorthTargetSchema } from './schema'

interface FinanceStore {
  accounts: FinanceAccount[]
  snapshots: NetWorthSnapshot[]
  targets: NetWorthTarget[]
  load: () => Promise<void>
  create: (input: z.infer<typeof CreateFinanceAccountSchema>) => Promise<void>
  update: (id: string, patch: Partial<Omit<FinanceAccount, 'id' | 'createdAt'>>) => Promise<void>
  remove: (id: string) => Promise<void>
  createTarget: (input: z.infer<typeof CreateNetWorthTargetSchema>) => Promise<void>
  updateTarget: (id: string, patch: Partial<Omit<NetWorthTarget, 'id' | 'createdAt'>>) => Promise<void>
  removeTarget: (id: string) => Promise<void>
}

const reloadAccounts = async () => Promise.all([financeService.getAll(), financeService.getSnapshots()])

export const useFinanceStore = create<FinanceStore>((set) => ({
  accounts: [],
  snapshots: [],
  targets: [],
  load: async () => {
    const [[accounts, snapshots], targets] = await Promise.all([reloadAccounts(), financeService.getTargets()])
    set({ accounts, snapshots, targets })
  },
  create: async (input) => {
    await financeService.create(input)
    const [accounts, snapshots] = await reloadAccounts()
    set({ accounts, snapshots })
  },
  update: async (id, patch) => {
    await financeService.update(id, patch)
    const [accounts, snapshots] = await reloadAccounts()
    set({ accounts, snapshots })
  },
  remove: async (id) => {
    await financeService.delete(id)
    const [accounts, snapshots] = await reloadAccounts()
    set({ accounts, snapshots })
  },
  createTarget: async (input) => {
    const target = await financeService.createTarget(input)
    set(s => ({ targets: [...s.targets, target] }))
  },
  updateTarget: async (id, patch) => {
    const updated = await financeService.updateTarget(id, patch)
    set(s => ({ targets: s.targets.map(t => t.id === id ? updated : t) }))
  },
  removeTarget: async (id) => {
    await financeService.deleteTarget(id)
    set(s => ({ targets: s.targets.filter(t => t.id !== id) }))
  },
}))
