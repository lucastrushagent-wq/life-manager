import { z } from 'zod'
import type { Contact } from './types'

export const ContactSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Name is required'),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  company: z.string().optional(),
  notes: z.string().optional(),
  lastContactedAt: z.string().optional(),
  createdAt: z.string(),
}) satisfies z.ZodType<Contact>

export const CreateContactSchema = ContactSchema.omit({ id: true, createdAt: true })
