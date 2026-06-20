import { z } from 'zod'
import type { Holding } from './types'

export const holdingSchema = z.object({
  id: z.string(),
  ticker: z.string().min(1),
  name: z.string().min(1),
  assetClass: z.enum(['us_stocks', 'intl_stocks', 'etf', 'bonds', 'crypto', 'real_estate', 'cash', 'other']),
  account: z.string(),
  shares: z.number().positive(),
  avgCost: z.number().min(0),
  currentPrice: z.number().min(0),
  lastUpdated: z.string(),
  notes: z.string().optional(),
  createdAt: z.string(),
}) satisfies z.ZodType<Holding>
