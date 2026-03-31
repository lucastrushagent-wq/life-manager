import { z } from 'zod'
import type { McpTool } from '../../core/mcp'
import { financeService } from './service'
import { CreateFinanceAccountSchema } from './schema'

export const financeTools: McpTool[] = [
  {
    name: 'finance_list_accounts',
    description: 'List all finance accounts (assets and liabilities)',
    inputSchema: z.object({}),
    handler: async () => financeService.getAll(),
  },
  {
    name: 'finance_create_account',
    description: 'Create a new finance account (e.g. 401k, stocks, credit card)',
    inputSchema: CreateFinanceAccountSchema,
    handler: async (input) => financeService.create(input as z.infer<typeof CreateFinanceAccountSchema>),
  },
  {
    name: 'finance_update_account',
    description: 'Update the value or details of a finance account',
    inputSchema: z.object({ id: z.string(), value: z.number().optional(), notes: z.string().optional(), lastUpdated: z.string().optional() }),
    handler: async (input) => {
      const { id, ...patch } = input as { id: string; value?: number; notes?: string; lastUpdated?: string }
      return financeService.update(id, patch)
    },
  },
  {
    name: 'finance_delete_account',
    description: 'Delete a finance account',
    inputSchema: z.object({ id: z.string() }),
    handler: async (input) => financeService.delete((input as { id: string }).id),
  },
  {
    name: 'finance_net_worth',
    description: 'Get a summary of total assets, liabilities, and net worth',
    inputSchema: z.object({}),
    handler: async () => {
      const accounts = await financeService.getAll()
      const totalAssets = accounts.filter(a => a.type === 'asset').reduce((s, a) => s + a.value, 0)
      const totalLiabilities = accounts.filter(a => a.type === 'liability').reduce((s, a) => s + a.value, 0)
      return { totalAssets, totalLiabilities, netWorth: totalAssets - totalLiabilities }
    },
  },
]
