import { z } from 'zod'
import type { ShoppingStore, ShoppingItem } from './types'

export const ShoppingStoreSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  sortOrder: z.number(),
  createdAt: z.string(),
}) satisfies z.ZodType<ShoppingStore>

export const ShoppingItemSchema = z.object({
  id: z.string(),
  storeId: z.string(),
  name: z.string().min(1),
  quantity: z.string().optional(),
  notes: z.string().optional(),
  checked: z.boolean(),
  recurring: z.boolean(),
  frequency: z.enum(['weekly', 'fortnightly', 'monthly', 'quarterly']).optional(),
  storeCode: z.string().optional(),
  url: z.string().optional(),
  preferredBrand: z.string().optional(),
  isPreference: z.boolean(),
  createdAt: z.string(),
}) satisfies z.ZodType<ShoppingItem>

export const CreateItemSchema = ShoppingItemSchema.omit({ id: true, storeId: true, checked: true, createdAt: true })
