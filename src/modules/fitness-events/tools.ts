import { z } from 'zod'
import type { McpTool } from '../../core/mcp'
import { fitnessEventsService } from './service'
import { CreateFitnessEventSchema, UpdateFitnessEventSchema } from './schema'

export const fitnessEventsTools: McpTool[] = [
  {
    name: 'fitness_events_list',
    description: 'List all fitness events — races entered, upcoming, and the goal race list',
    inputSchema: z.object({}),
    handler: async () => fitnessEventsService.getAll(),
  },
  {
    name: 'fitness_events_alerts_list',
    description:
      'List goal races with registration alerts enabled — the races to monitor for entries opening',
    inputSchema: z.object({}),
    handler: async () => fitnessEventsService.getAlerts(),
  },
  {
    name: 'fitness_events_open',
    description:
      'List races whose registration is open now, or opens within the given number of days ' +
      '(default 30), and which have not been entered yet. Each result carries registrationStatus: ' +
      '"open_now" means enter immediately. This is the list to check when asked what races to sign up for.',
    inputSchema: z.object({ days: z.number().optional() }),
    handler: async (input) => fitnessEventsService.getOpen((input as { days?: number }).days ?? 30),
  },
  {
    name: 'fitness_events_create',
    description: 'Add a race to the upcoming or goal list',
    inputSchema: CreateFitnessEventSchema,
    handler: async (input) => fitnessEventsService.create(input as z.infer<typeof CreateFitnessEventSchema>),
  },
  {
    name: 'fitness_events_update',
    description:
      'Update a race — set status to "registered" once entered, or record resultTime once completed',
    inputSchema: z.object({ id: z.string(), patch: UpdateFitnessEventSchema }),
    handler: async (input) => {
      const { id, patch } = input as { id: string; patch: z.infer<typeof UpdateFitnessEventSchema> }
      return fitnessEventsService.update(id, patch)
    },
  },
  {
    name: 'fitness_events_delete',
    description: 'Delete a fitness event',
    inputSchema: z.object({ id: z.string() }),
    handler: async (input) => fitnessEventsService.delete((input as { id: string }).id),
  },
]
