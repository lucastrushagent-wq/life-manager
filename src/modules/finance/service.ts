import { z } from 'zod'
import type { FinanceAccount } from './types'
import { CreateFinanceAccountSchema } from './schema'

const BASE = 'http://localhost:3001/api/finance/accounts'

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
}
