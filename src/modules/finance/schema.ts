import { z } from 'zod'
import type { FinanceAccount } from './types'

export const FinanceAccountSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Name is required'),
  category: z.enum(['401k', 'stocks', 'property', 'misc_asset', 'credit_card', 'personal_loan']),
  type: z.enum(['asset', 'liability']),
  value: z.number().min(0, 'Value must be non-negative'),
  lastUpdated: z.string(),
  notes: z.string().optional(),
  createdAt: z.string(),
}) satisfies z.ZodType<FinanceAccount>

export const CreateFinanceAccountSchema = FinanceAccountSchema.omit({ id: true, createdAt: true })
