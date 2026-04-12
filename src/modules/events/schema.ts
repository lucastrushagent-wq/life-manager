import { z } from 'zod'
import type { CalendarEvent } from './types'

export const EVENT_CATEGORIES = ['music', 'sports', 'conference', 'festival', 'theatre', 'comedy', 'art', 'food', 'film', 'other'] as const
export const EVENT_STATUSES = ['confirmed', 'interested', 'sold_out', 'alert_set'] as const

export const CalendarEventSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  type: z.enum(['upcoming', 'goal']),
  date: z.string().optional(),
  endDate: z.string().optional(),
  venue: z.string().optional(),
  location: z.string().optional(),
  category: z.enum(EVENT_CATEGORIES),
  status: z.enum(EVENT_STATUSES),
  url: z.string().optional(),
  price: z.number().optional(),
  alertEnabled: z.boolean(),
  notes: z.string().optional(),
  createdAt: z.string(),
}) satisfies z.ZodType<CalendarEvent>

export const CreateEventSchema = CalendarEventSchema.omit({ id: true, createdAt: true })
export const UpdateEventSchema = CreateEventSchema.partial()
