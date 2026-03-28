import { z } from 'zod'
import type { Transaction } from './types'

export const TransactionSchema = z.object({
  id: z.string(),
  amount: z.number().positive('Amount must be positive'),
  description: z.string().min(1, 'Description is required'),
  category: z.string().min(1, 'Category is required'),
  type: z.enum(['income', 'expense']),
  date: z.string(),
  createdAt: z.string(),
}) satisfies z.ZodType<Transaction>

export const CreateTransactionSchema = TransactionSchema.omit({ id: true, createdAt: true })
