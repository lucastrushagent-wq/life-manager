import { z } from 'zod'
import type { Contact, Interaction, KeyDate } from './types'

export const ContactSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Name is required'),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  company: z.string().optional(),
  role: z.string().optional(),
  relationship: z.array(z.string()),
  followUpDays: z.number().int().positive().optional(),
  notes: z.string().optional(),
  createdAt: z.string(),
  lastContactedAt: z.string().optional(),
}) satisfies z.ZodType<Contact>

export const CreateContactSchema = ContactSchema.omit({ id: true, createdAt: true, lastContactedAt: true })

export const InteractionSchema = z.object({
  id: z.string(),
  contactId: z.string(),
  date: z.string(),
  notes: z.string().min(1, 'Notes are required'),
  createdAt: z.string(),
}) satisfies z.ZodType<Interaction>

export const CreateInteractionSchema = InteractionSchema.omit({ id: true, contactId: true, createdAt: true })

export const KeyDateSchema = z.object({
  id: z.string(),
  contactId: z.string(),
  label: z.string().min(1, 'Label is required'),
  month: z.number().int().min(1).max(12),
  day: z.number().int().min(1).max(31),
}) satisfies z.ZodType<KeyDate>

export const CreateKeyDateSchema = KeyDateSchema.omit({ id: true, contactId: true })
