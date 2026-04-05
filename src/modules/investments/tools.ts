import { z } from 'zod'
import type { McpTool } from '../../core/mcp'
import { investmentsService } from './service'

export const investmentsTools: McpTool[] = [
  {
    name: 'investments_list',
    description: 'List all investment holdings',
    inputSchema: z.object({}),
    handler: async () => investmentsService.getHoldings(),
  },
]
