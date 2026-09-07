import { z } from 'zod'
import type { ServiceProvider } from './types'

export const ProviderCategorySchema = z.enum([
  'medical', 'dental', 'vision', 'mental_health', 'hair', 'massage', 'fitness',
  'beauty', 'home', 'auto', 'financial', 'legal', 'pet', 'other',
])

export const ServiceProviderSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  category: ProviderCategorySchema,
  specialty: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
  website: z.string().optional(),
  bookingUrl: z.string().optional(),
  address: z.string().optional(),
  preferences: z.string().optional(),
  lastVisit: z.string().optional(),
  frequencyDays: z.number().optional(),
  typicalCost: z.number().optional(),
  rating: z.number().optional(),
  notes: z.string().optional(),
  archived: z.boolean(),
  createdAt: z.string(),
}) satisfies z.ZodType<ServiceProvider>

export const CreateServiceProviderSchema = ServiceProviderSchema.omit({
  id: true,
  archived: true,
  createdAt: true,
})
