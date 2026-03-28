import { z } from 'zod'
import type { McpTool } from '../../core/mcp'
import { crmService } from './service'
import { CreateContactSchema, ContactSchema } from './schema'

export const crmTools: McpTool[] = [
  {
    name: 'crm_list',
    description: 'List all contacts',
    inputSchema: z.object({}),
    handler: async () => crmService.getAll(),
  },
  {
    name: 'crm_create',
    description: 'Create a new contact',
    inputSchema: CreateContactSchema,
    handler: async (input) => crmService.create(input as z.infer<typeof CreateContactSchema>),
  },
  {
    name: 'crm_update',
    description: 'Update a contact',
    inputSchema: ContactSchema.partial().required({ id: true }),
    handler: async (input) => {
      const { id, ...patch } = input as z.infer<typeof ContactSchema>
      return crmService.update(id, patch)
    },
  },
  {
    name: 'crm_delete',
    description: 'Delete a contact',
    inputSchema: z.object({ id: z.string() }),
    handler: async (input) => crmService.delete((input as { id: string }).id),
  },
]
