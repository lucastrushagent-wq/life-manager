import { z } from 'zod'
import type { McpTool } from '../../core/mcp'
import { crmService } from './service'
import { CreateContactSchema, CreateInteractionSchema, CreateKeyDateSchema } from './schema'

export const crmTools: McpTool[] = [
  {
    name: 'crm_list',
    description: 'List all contacts with last contacted date',
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
    inputSchema: CreateContactSchema.partial().extend({ id: z.string() }),
    handler: async (input) => {
      const { id, ...patch } = input as z.infer<typeof CreateContactSchema> & { id: string }
      return crmService.update(id, patch)
    },
  },
  {
    name: 'crm_delete',
    description: 'Delete a contact',
    inputSchema: z.object({ id: z.string() }),
    handler: async (input) => crmService.delete((input as { id: string }).id),
  },
  {
    name: 'crm_log_interaction',
    description: 'Log an interaction with a contact',
    inputSchema: z.object({ contactId: z.string() }).merge(CreateInteractionSchema),
    handler: async (input) => {
      const { contactId, ...rest } = input as { contactId: string } & z.infer<typeof CreateInteractionSchema>
      return crmService.addInteraction(contactId, rest)
    },
  },
  {
    name: 'crm_get_interactions',
    description: 'Get all interactions for a contact',
    inputSchema: z.object({ contactId: z.string() }),
    handler: async (input) => crmService.getInteractions((input as { contactId: string }).contactId),
  },
  {
    name: 'crm_add_key_date',
    description: 'Add a key date to a contact',
    inputSchema: z.object({ contactId: z.string() }).merge(CreateKeyDateSchema),
    handler: async (input) => {
      const { contactId, ...rest } = input as { contactId: string } & z.infer<typeof CreateKeyDateSchema>
      return crmService.addKeyDate(contactId, rest)
    },
  },
]
