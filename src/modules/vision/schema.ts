import { z } from 'zod'
import type { CoreValue, Goal, VisionStatement, Manifesto } from './types'

export const GoalCategoryValues = [
  'health', 'fitness', 'career', 'financial', 'relationships', 'family',
  'personal_growth', 'learning', 'mental_wellbeing', 'creativity', 'hobbies',
  'travel', 'community', 'spirituality', 'home', 'adventure', 'other',
] as const

export const VisionStatementSchema: z.ZodType<VisionStatement> = z.object({
  content: z.string(),
  updatedAt: z.string(),
})

export const CoreValueSchema: z.ZodType<CoreValue> = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  sortOrder: z.number().int(),
  createdAt: z.string(),
})

export const GoalSchema: z.ZodType<Goal> = z.object({
  id: z.string(),
  category: z.enum(GoalCategoryValues),
  title: z.string(),
  description: z.string().optional(),
  timeframe: z.enum(['short', 'medium', 'long', 'lifetime']),
  targetDate: z.string().optional(),
  status: z.enum(['active', 'achieved', 'paused', 'abandoned']),
  createdAt: z.string(),
})

export const ManifestoSchema: z.ZodType<Manifesto> = z.object({
  content: z.string(),
  updatedAt: z.string(),
})
