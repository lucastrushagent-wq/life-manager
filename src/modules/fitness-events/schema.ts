import { z } from 'zod'
import type { FitnessEvent } from './types'

export const FITNESS_EVENT_CATEGORIES = [
  'running', 'trail', 'cycling', 'swimming', 'triathlon',
  'obstacle', 'hyrox', 'strength', 'team_sport', 'other',
] as const

export const FITNESS_EVENT_STATUSES = [
  'registered', 'interested', 'sold_out', 'completed', 'alert_set',
] as const

export const FitnessEventSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  type: z.enum(['upcoming', 'goal']),
  date: z.string().optional(),
  endDate: z.string().optional(),
  venue: z.string().optional(),
  location: z.string().optional(),
  category: z.enum(FITNESS_EVENT_CATEGORIES),
  status: z.enum(FITNESS_EVENT_STATUSES),
  url: z.string().optional(),
  price: z.number().optional(),
  distance: z.string().optional(),
  goalTime: z.string().optional(),
  resultTime: z.string().optional(),
  alertEnabled: z.boolean(),
  annual: z.boolean(),
  registrationOpensDate: z.string().optional(),
  registrationClosesDate: z.string().optional(),
  notes: z.string().optional(),
  createdAt: z.string(),
}) satisfies z.ZodType<FitnessEvent>

export const CreateFitnessEventSchema = FitnessEventSchema.omit({ id: true, createdAt: true })
export const UpdateFitnessEventSchema = CreateFitnessEventSchema.partial()
