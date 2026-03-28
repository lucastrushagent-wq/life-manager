import { z } from 'zod'
import type { McpTool } from '../../core/mcp'
import { financeService } from './service'
import { CreateTransactionSchema } from './schema'

export const financeTools: McpTool[] = [
  {
    name: 'finance_list',
    description: 'List all transactions',
    inputSchema: z.object({}),
    handler: async () => financeService.getAll(),
  },
  {
    name: 'finance_create',
    description: 'Create a new transaction (income or expense)',
    inputSchema: CreateTransactionSchema,
    handler: async (input) => financeService.create(input as z.infer<typeof CreateTransactionSchema>),
  },
  {
    name: 'finance_delete',
    description: 'Delete a transaction',
    inputSchema: z.object({ id: z.string() }),
    handler: async (input) => financeService.delete((input as { id: string }).id),
  },
  {
    name: 'finance_summary',
    description: 'Get a summary of income, expenses, and net balance',
    inputSchema: z.object({}),
    handler: async () => {
      const transactions = financeService.getAll()
      const income = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0)
      const expenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0)
      return { income, expenses, net: income - expenses }
    },
  },
]
