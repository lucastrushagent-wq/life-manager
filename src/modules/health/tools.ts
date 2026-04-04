import { z } from 'zod'
import type { McpTool } from '../../core/mcp'
import { healthService } from './service'

export const healthTools: McpTool[] = [
  {
    name: 'health_get_summary',
    description: 'Get a full health summary including recent metrics, blood work, medications, and medical history. Use this for diagnosis or health analysis.',
    inputSchema: z.object({}),
    handler: async () => {
      const [metrics, bloodWork, medications, history] = await Promise.all([
        healthService.getMetrics({ limit: 50 }),
        healthService.getBloodWork(),
        healthService.getMedications(),
        healthService.getHistory(),
      ])
      return { metrics, bloodWork, medications, history }
    },
  },
  {
    name: 'health_get_metrics',
    description: 'Get health metrics (body or activity). Filter by category (body/activity) or specific metric.',
    inputSchema: z.object({
      category: z.enum(['body', 'activity']).optional(),
      metric: z.string().optional(),
      limit: z.number().optional(),
    }),
    handler: async (input) => healthService.getMetrics(input as { category?: string; metric?: string; limit?: number }),
  },
  {
    name: 'health_log_metric',
    description: 'Log a health metric (weight, body fat, steps, sleep, resting HR, etc.)',
    inputSchema: z.object({
      date: z.string(),
      category: z.enum(['body', 'activity']),
      metric: z.string(),
      value: z.number(),
      unit: z.string(),
      notes: z.string().optional(),
    }),
    handler: async (input) => healthService.addMetric(input as Parameters<typeof healthService.addMetric>[0]),
  },
  {
    name: 'health_get_blood_work',
    description: 'Get all blood test results',
    inputSchema: z.object({}),
    handler: async () => healthService.getBloodWork(),
  },
  {
    name: 'health_log_blood_work',
    description: 'Log a blood test result for a specific marker',
    inputSchema: z.object({
      testDate: z.string(),
      marker: z.string(),
      value: z.number(),
      unit: z.string(),
      referenceMin: z.number().optional(),
      referenceMax: z.number().optional(),
      notes: z.string().optional(),
    }),
    handler: async (input) => healthService.addBloodWork(input as Parameters<typeof healthService.addBloodWork>[0]),
  },
  {
    name: 'health_get_medications',
    description: 'Get all medications and prescriptions',
    inputSchema: z.object({}),
    handler: async () => healthService.getMedications(),
  },
  {
    name: 'health_get_medical_history',
    description: 'Get full medical history including conditions, surgeries, allergies, family history, and immunizations',
    inputSchema: z.object({}),
    handler: async () => healthService.getHistory(),
  },
  {
    name: 'health_add_history',
    description: 'Add a medical history entry (condition, surgery, allergy, family_history, immunization, other)',
    inputSchema: z.object({
      category: z.enum(['condition', 'surgery', 'allergy', 'family_history', 'immunization', 'other']),
      title: z.string(),
      date: z.string().optional(),
      notes: z.string().optional(),
      severity: z.enum(['mild', 'moderate', 'severe']).optional(),
      status: z.enum(['active', 'resolved', 'managed']).optional(),
    }),
    handler: async (input) => healthService.addHistory(input as Parameters<typeof healthService.addHistory>[0]),
  },
]
