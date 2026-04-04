import { z } from 'zod'
import type { WorkoutSession, StrengthSet, PersonalRecord } from './types'

export const WorkoutSessionSchema: z.ZodType<WorkoutSession> = z.object({
  id: z.string(),
  date: z.string(),
  type: z.enum(['running', 'cycling', 'swimming', 'strength', 'hiit', 'yoga', 'walking', 'rowing', 'pilates', 'crossfit', 'other']),
  durationMins: z.number().positive(),
  distanceKm: z.number().optional(),
  calories: z.number().optional(),
  avgHr: z.number().optional(),
  maxHr: z.number().optional(),
  notes: z.string().optional(),
  createdAt: z.string(),
})

export const StrengthSetSchema: z.ZodType<StrengthSet> = z.object({
  id: z.string(),
  date: z.string(),
  exercise: z.string(),
  sets: z.number().int().positive(),
  reps: z.number().int().positive(),
  weightKg: z.number().optional(),
  notes: z.string().optional(),
  createdAt: z.string(),
})

export const PersonalRecordSchema: z.ZodType<PersonalRecord> = z.object({
  id: z.string(),
  category: z.enum(['strength', 'cardio']),
  name: z.string(),
  value: z.number(),
  unit: z.string(),
  date: z.string(),
  notes: z.string().optional(),
  createdAt: z.string(),
})
