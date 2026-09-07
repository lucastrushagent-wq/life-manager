import { z } from 'zod'
import type { McpTool } from '../../core/mcp'
import { serviceProviderService } from './service'
import { ProviderCategorySchema } from './schema'

export const serviceProviderTools: McpTool[] = [
  {
    name: 'providers_find',
    description:
      'Find a go-to service provider — doctor, dentist, hairdresser, massage therapist, mechanic, etc. ' +
      'Search by free text (e.g. "massage", "dentist") or filter by category. Returns contact details, ' +
      'the booking URL, and standing preferences such as preferred practitioner, treatment and duration. ' +
      'Call this before booking any appointment so the right place and usual order are used.',
    inputSchema: z.object({
      query: z.string().optional(),
      category: ProviderCategorySchema.optional(),
    }),
    handler: async (input) => {
      const { query, category } = input as { query?: string; category?: string }
      return serviceProviderService.getAll({ q: query, category })
    },
  },
  {
    name: 'providers_list',
    description: 'List all active service providers with their details and preferences',
    inputSchema: z.object({}),
    handler: async () => serviceProviderService.getAll(),
  },
  {
    name: 'providers_get',
    description: 'Get one service provider by id, including full preferences and booking details',
    inputSchema: z.object({ id: z.string() }),
    handler: async (input) => serviceProviderService.getById((input as { id: string }).id),
  },
  {
    name: 'providers_create',
    description: 'Add a new service provider',
    inputSchema: z.object({
      name: z.string(),
      category: ProviderCategorySchema,
      specialty: z.string().optional(),
      phone: z.string().optional(),
      email: z.string().optional(),
      website: z.string().optional(),
      bookingUrl: z.string().optional(),
      address: z.string().optional(),
      preferences: z.string().optional(),
      frequencyDays: z.number().optional(),
      typicalCost: z.number().optional(),
      notes: z.string().optional(),
    }),
    handler: async (input) => serviceProviderService.create(input as never),
  },
  {
    name: 'providers_update',
    description: 'Update a service provider — use this to record new preferences learnt from a visit',
    inputSchema: z.object({
      id: z.string(),
      name: z.string().optional(),
      specialty: z.string().optional(),
      phone: z.string().optional(),
      bookingUrl: z.string().optional(),
      address: z.string().optional(),
      preferences: z.string().optional(),
      frequencyDays: z.number().optional(),
      typicalCost: z.number().optional(),
      rating: z.number().optional(),
      notes: z.string().optional(),
    }),
    handler: async (input) => {
      const { id, ...patch } = input as { id: string } & Record<string, unknown>
      return serviceProviderService.update(id, patch)
    },
  },
  {
    name: 'providers_log_visit',
    description: 'Record that a visit happened, resetting the "due" countdown. Defaults to today.',
    inputSchema: z.object({ id: z.string(), date: z.string().optional() }),
    handler: async (input) => {
      const { id, date } = input as { id: string; date?: string }
      return serviceProviderService.logVisit(id, date)
    },
  },
]
