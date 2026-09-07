import { z } from 'zod'
import type { FinanceAccount, NetWorthSnapshot, NetWorthTarget } from './types'
import { CreateFinanceAccountSchema, CreateNetWorthTargetSchema } from './schema'

const BASE = '/api/finance/accounts'

export const financeService = {
  async getAll(): Promise<FinanceAccount[]> {
    const res = await fetch(BASE)
    if (!res.ok) throw new Error('Failed to fetch accounts')
    return res.json()
  },

  async create(input: z.infer<typeof CreateFinanceAccountSchema>): Promise<FinanceAccount> {
    const res = await fetch(BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    })
    if (!res.ok) throw new Error('Failed to create account')
    return res.json()
  },

  async update(id: string, patch: Partial<Omit<FinanceAccount, 'id' | 'createdAt'>>): Promise<FinanceAccount> {
    const res = await fetch(`${BASE}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    })
    if (!res.ok) throw new Error('Failed to update account')
    return res.json()
  },

  async delete(id: string): Promise<void> {
    const res = await fetch(`${BASE}/${id}`, { method: 'DELETE' })
    if (!res.ok) throw new Error('Failed to delete account')
  },

  async getSnapshots(): Promise<NetWorthSnapshot[]> {
    const res = await fetch(`${BASE}/snapshots`)
    if (!res.ok) throw new Error('Failed to fetch snapshots')
    return res.json()
  },

  async getTargets(): Promise<NetWorthTarget[]> {
    const res = await fetch(`${BASE}/targets`)
    if (!res.ok) throw new Error('Failed to fetch targets')
    return res.json()
  },

  async createTarget(input: z.infer<typeof CreateNetWorthTargetSchema>): Promise<NetWorthTarget> {
    const res = await fetch(`${BASE}/targets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    })
    if (!res.ok) throw new Error('Failed to create target')
    return res.json()
  },

  async updateTarget(id: string, patch: Partial<Omit<NetWorthTarget, 'id' | 'createdAt'>>): Promise<NetWorthTarget> {
    const res = await fetch(`${BASE}/targets/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    })
    if (!res.ok) throw new Error('Failed to update target')
    return res.json()
  },

  async deleteTarget(id: string): Promise<void> {
    const res = await fetch(`${BASE}/targets/${id}`, { method: 'DELETE' })
    if (!res.ok) throw new Error('Failed to delete target')
  },
}
