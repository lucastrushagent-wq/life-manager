import { z } from 'zod'
import type { McpTool } from '../../core/mcp'
import { eventsService } from './service'
import { CreateEventSchema, UpdateEventSchema } from './schema'

export const eventsTools: McpTool[] = [
  {
    name: 'events_list',
    description: 'List all events (upcoming and goal list)',
    inputSchema: z.object({}),
    handler: async () => eventsService.getAll(),
  },
  {
    name: 'events_alerts_list',
    description: 'List goal events with ticket alerts enabled — use this to know which events to monitor for ticket availability',
    inputSchema: z.object({}),
    handler: async () => eventsService.getAlerts(),
  },
  {
    name: 'events_create',
    description: 'Add an event to upcoming or goal list',
    inputSchema: CreateEventSchema,
    handler: async (input) => eventsService.create(input as z.infer<typeof CreateEventSchema>),
  },
  {
    name: 'events_update',
    description: 'Update an event — use this to set status to alert_set when tickets are found, or update alertEnabled',
    inputSchema: z.object({ id: z.string(), patch: UpdateEventSchema }),
    handler: async (input) => {
      const { id, patch } = input as { id: string; patch: z.infer<typeof UpdateEventSchema> }
      return eventsService.update(id, patch)
    },
  },
  {
    name: 'events_delete',
    description: 'Delete an event',
    inputSchema: z.object({ id: z.string() }),
    handler: async (input) => eventsService.delete((input as { id: string }).id),
  },
]
