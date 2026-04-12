import { z } from 'zod'
import type { FinanceAccount } from './types'

export const FinanceAccountSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Name is required'),
  category: z.enum([
    '401k', 'stocks', 'property', 'savings_account', 'debit_account',
    'cash', 'crypto', 'vehicle', 'bonds', 'business', 'misc_asset',
    'credit_card', 'personal_loan', 'mortgage', 'hecs_debt', 'student_loan', 'other_debt',
  ]),
  type: z.enum(['asset', 'liability']),
  value: z.number().min(0, 'Value must be non-negative'),
  lastUpdated: z.string(),
  notes: z.string().optional(),
  excluded: z.boolean(),
  createdAt: z.string(),
}) satisfies z.ZodType<FinanceAccount>

export const CreateFinanceAccountSchema = FinanceAccountSchema.omit({ id: true, createdAt: true })

import type { NetWorthTarget } from './types'

export const NetWorthTargetSchema = z.object({
  id: z.string(),
  label: z.string().min(1, 'Label is required'),
  targetAmount: z.number(),
  targetDate: z.string().optional(),
  notes: z.string().optional(),
  createdAt: z.string(),
}) satisfies z.ZodType<NetWorthTarget>

export const CreateNetWorthTargetSchema = NetWorthTargetSchema.omit({ id: true, createdAt: true })
