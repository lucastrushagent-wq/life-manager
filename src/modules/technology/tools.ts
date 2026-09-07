import { z } from 'zod'
import type { McpTool } from '../../core/mcp'
import { technologyService } from './service'
import {
  CreateDeviceSchema, UpdateDeviceSchema,
  CreateSubscriptionSchema, UpdateSubscriptionSchema,
  DEVICE_CATEGORIES,
} from './schema'

export const technologyTools: McpTool[] = [
  {
    name: 'tech_devices_list',
    description:
      'List owned devices — computers, phones, network gear, smart home, etc. Includes brand, ' +
      'model, serial number, warranty expiry and where each one lives. Use this to answer ' +
      'questions about what hardware is owned or to find a serial number for a warranty claim.',
    inputSchema: z.object({
      category: z.enum(DEVICE_CATEGORIES).optional(),
      status: z.string().optional(),
      query: z.string().optional(),
    }),
    handler: async (input) => {
      const { category, status, query } = input as { category?: string; status?: string; query?: string }
      return technologyService.getDevices({ category, status, q: query })
    },
  },
  {
    name: 'tech_expiring',
    description:
      'List device warranties lapsing and subscriptions renewing within the given number of days ' +
      '(default 60). Returns { warranties, renewals }. Check this before buying a replacement or ' +
      'when asked what is about to run out or auto-charge.',
    inputSchema: z.object({ days: z.number().optional() }),
    handler: async (input) => technologyService.getExpiring((input as { days?: number }).days ?? 60),
  },
  {
    name: 'tech_device_create',
    description: 'Add a device to the inventory',
    inputSchema: CreateDeviceSchema,
    handler: async (input) => technologyService.createDevice(input as z.infer<typeof CreateDeviceSchema>),
  },
  {
    name: 'tech_device_update',
    description: 'Update a device — e.g. mark it broken, sold, or record a warranty extension',
    inputSchema: z.object({ id: z.string(), patch: UpdateDeviceSchema }),
    handler: async (input) => {
      const { id, patch } = input as { id: string; patch: z.infer<typeof UpdateDeviceSchema> }
      return technologyService.updateDevice(id, patch)
    },
  },
  {
    name: 'tech_device_delete',
    description: 'Delete a device from the inventory',
    inputSchema: z.object({ id: z.string() }),
    handler: async (input) => technologyService.deleteDevice((input as { id: string }).id),
  },
  {
    name: 'tech_subscriptions_list',
    description:
      'List recurring technology subscriptions with cost, billing cycle and next renewal date. ' +
      'Use this to answer what is being paid for monthly or annually.',
    inputSchema: z.object({ status: z.string().optional() }),
    handler: async (input) => technologyService.getSubscriptions((input as { status?: string }).status),
  },
  {
    name: 'tech_subscription_create',
    description: 'Add a technology subscription',
    inputSchema: CreateSubscriptionSchema,
    handler: async (input) => technologyService.createSubscription(input as z.infer<typeof CreateSubscriptionSchema>),
  },
  {
    name: 'tech_subscription_update',
    description: 'Update a subscription — e.g. cancel it, or roll the renewal date forward after a charge',
    inputSchema: z.object({ id: z.string(), patch: UpdateSubscriptionSchema }),
    handler: async (input) => {
      const { id, patch } = input as { id: string; patch: z.infer<typeof UpdateSubscriptionSchema> }
      return technologyService.updateSubscription(id, patch)
    },
  },
  {
    name: 'tech_subscription_delete',
    description: 'Delete a subscription',
    inputSchema: z.object({ id: z.string() }),
    handler: async (input) => technologyService.deleteSubscription((input as { id: string }).id),
  },
]
