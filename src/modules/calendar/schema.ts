import { z } from 'zod'

export const CreateInviteSchema = z.object({
  summary: z.string().min(1),
  startsAt: z.string().min(1),
  endsAt: z.string().min(1),
  description: z.string().optional(),
  location: z.string().optional(),
  allDay: z.boolean().optional(),
  attendee: z.string().optional(),
})

export const UpdateInviteSchema = CreateInviteSchema.partial()
