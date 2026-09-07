import { z } from 'zod'
import type { Device, TechSubscription } from './types'

export const DEVICE_CATEGORIES = [
  'computer', 'phone', 'tablet', 'wearable', 'display', 'audio',
  'camera', 'gaming', 'network', 'smart_home', 'peripheral', 'storage', 'other',
] as const

export const DEVICE_STATUSES = ['active', 'backup', 'storage', 'sold', 'retired', 'broken'] as const

export const SUBSCRIPTION_CATEGORIES = [
  'cloud_storage', 'software', 'streaming', 'security',
  'domain_hosting', 'ai', 'connectivity', 'other',
] as const

export const BILLING_CYCLES = ['monthly', 'quarterly', 'annual'] as const
export const SUBSCRIPTION_STATUSES = ['active', 'trial', 'cancelled'] as const

export const DeviceSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  category: z.enum(DEVICE_CATEGORIES),
  brand: z.string().optional(),
  model: z.string().optional(),
  serialNumber: z.string().optional(),
  purchaseDate: z.string().optional(),
  purchasePrice: z.number().optional(),
  warrantyExpiry: z.string().optional(),
  status: z.enum(DEVICE_STATUSES),
  assignedTo: z.string().optional(),
  location: z.string().optional(),
  url: z.string().optional(),
  notes: z.string().optional(),
  createdAt: z.string(),
}) satisfies z.ZodType<Device>

export const CreateDeviceSchema = DeviceSchema.omit({ id: true, createdAt: true })
export const UpdateDeviceSchema = CreateDeviceSchema.partial()

export const TechSubscriptionSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  provider: z.string().optional(),
  category: z.enum(SUBSCRIPTION_CATEGORIES),
  cost: z.number().optional(),
  billingCycle: z.enum(BILLING_CYCLES),
  renewalDate: z.string().optional(),
  status: z.enum(SUBSCRIPTION_STATUSES),
  url: z.string().optional(),
  notes: z.string().optional(),
  createdAt: z.string(),
}) satisfies z.ZodType<TechSubscription>

export const CreateSubscriptionSchema = TechSubscriptionSchema.omit({ id: true, createdAt: true })
export const UpdateSubscriptionSchema = CreateSubscriptionSchema.partial()
