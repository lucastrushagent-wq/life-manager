import { z } from 'zod'
import type { McpTool } from '../../core/mcp'
import { calendarService } from './service'
import { CreateInviteSchema, UpdateInviteSchema } from './schema'

export const calendarTools: McpTool[] = [
  {
    name: 'calendar_send_invite',
    description:
      'Send a calendar invitation by email after making a booking — a massage, vet visit, ' +
      'dinner reservation, anything with a time. It arrives as a normal calendar invite to ' +
      'accept or decline. Times are ISO 8601 and should include a timezone offset or Z ' +
      '(e.g. 2026-10-01T14:30:00+11:00). Pass dryRun to see the invitation without sending it.',
    inputSchema: CreateInviteSchema.extend({ dryRun: z.boolean().optional() }),
    handler: async (input) => {
      const { dryRun, ...rest } = input as z.infer<typeof CreateInviteSchema> & { dryRun?: boolean }
      return calendarService.send(rest, dryRun)
    },
  },
  {
    name: 'calendar_list_invites',
    description:
      'List calendar invitations already sent, newest first. Pass upcomingOnly to see only ' +
      'those not yet finished and not cancelled. Check here before sending to avoid duplicates.',
    inputSchema: z.object({ upcomingOnly: z.boolean().optional() }),
    handler: async (input) => calendarService.list((input as { upcomingOnly?: boolean }).upcomingOnly ?? false),
  },
  {
    name: 'calendar_update_invite',
    description:
      'Change an invitation already sent — a moved appointment, a new location. The recipient ' +
      'gets an amendment to the existing event rather than a second one. Needs the id from ' +
      'calendar_send_invite or calendar_list_invites.',
    inputSchema: z.object({ id: z.string(), patch: UpdateInviteSchema, dryRun: z.boolean().optional() }),
    handler: async (input) => {
      const { id, patch, dryRun } = input as { id: string; patch: z.infer<typeof UpdateInviteSchema>; dryRun?: boolean }
      return calendarService.update(id, patch, dryRun)
    },
  },
  {
    name: 'calendar_cancel_invite',
    description: 'Cancel an invitation already sent — the event is removed from the recipient\'s calendar',
    inputSchema: z.object({ id: z.string(), dryRun: z.boolean().optional() }),
    handler: async (input) => {
      const { id, dryRun } = input as { id: string; dryRun?: boolean }
      return calendarService.cancel(id, dryRun)
    },
  },
  {
    name: 'calendar_get_status',
    description: 'Whether calendar invitations are configured, and which addresses they come from and go to',
    inputSchema: z.object({}),
    handler: async () => calendarService.getStatus(),
  },
]
