import { z } from 'zod'
import type { Transaction } from './types'
import { CreateTransactionSchema } from './schema'

const KEY = 'life-manager:transactions'

function load(): Transaction[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]')
  } catch {
    return []
  }
}

function save(transactions: Transaction[]): void {
  localStorage.setItem(KEY, JSON.stringify(transactions))
}

export const financeService = {
  getAll(): Transaction[] {
    return load()
  },
  create(input: z.infer<typeof CreateTransactionSchema>): Transaction {
    const transaction: Transaction = {
      ...input,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    }
    save([...load(), transaction])
    return transaction
  },
  update(id: string, patch: Partial<Omit<Transaction, 'id' | 'createdAt'>>): Transaction {
    const transactions = load()
    const idx = transactions.findIndex(t => t.id === id)
    if (idx === -1) throw new Error(`Transaction ${id} not found`)
    transactions[idx] = { ...transactions[idx], ...patch }
    save(transactions)
    return transactions[idx]
  },
  delete(id: string): void {
    save(load().filter(t => t.id !== id))
  },
}
