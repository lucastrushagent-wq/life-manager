import { z } from 'zod'
import type { McpTool } from '../../core/mcp'
import { fitnessService } from './service'

export const fitnessTools: McpTool[] = [
  {
    name: 'fitness_get_summary',
    description: 'Get all fitness data: workout sessions, strength sets, and personal records',
    inputSchema: z.object({}),
    handler: async () => {
      const [sessions, sets, records] = await Promise.all([
        fitnessService.getSessions(),
        fitnessService.getSets(),
        fitnessService.getRecords(),
      ])
      return { sessions, sets, records }
    },
  },
  {
    name: 'fitness_log_session',
    description: 'Log a workout session (cardio or general)',
    inputSchema: z.object({
      date: z.string(),
      type: z.enum(['running', 'cycling', 'swimming', 'strength', 'hiit', 'yoga', 'walking', 'rowing', 'pilates', 'crossfit', 'other']),
      durationMins: z.number(),
      distanceKm: z.number().optional(),
      calories: z.number().optional(),
      avgHr: z.number().optional(),
      maxHr: z.number().optional(),
      notes: z.string().optional(),
    }),
    handler: async (input) => fitnessService.addSession(input as Parameters<typeof fitnessService.addSession>[0]),
  },
  {
    name: 'fitness_log_strength',
    description: 'Log a strength exercise (sets/reps/weight)',
    inputSchema: z.object({
      date: z.string(),
      exercise: z.string(),
      sets: z.number().int(),
      reps: z.number().int(),
      weightKg: z.number().optional(),
      notes: z.string().optional(),
    }),
    handler: async (input) => fitnessService.addSet(input as Parameters<typeof fitnessService.addSet>[0]),
  },
  {
    name: 'fitness_get_exercise_history',
    description: 'Get history for a specific exercise to track progress',
    inputSchema: z.object({
      exercise: z.string(),
      limit: z.number().optional(),
    }),
    handler: async (input) => {
      const { exercise, limit } = input as { exercise: string; limit?: number }
      return fitnessService.getSets({ exercise, limit })
    },
  },
  {
    name: 'fitness_set_record',
    description: 'Set or update a personal record',
    inputSchema: z.object({
      category: z.enum(['strength', 'cardio']),
      name: z.string(),
      value: z.number(),
      unit: z.string(),
      date: z.string(),
      notes: z.string().optional(),
    }),
    handler: async (input) => fitnessService.addRecord(input as Parameters<typeof fitnessService.addRecord>[0]),
  },
]
