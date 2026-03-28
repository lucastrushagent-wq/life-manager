import { z } from 'zod'
import { todoTools } from '../modules/todo/tools'
import { crmTools } from '../modules/crm/tools'
import { financeTools } from '../modules/finance/tools'

export interface McpTool {
  name: string
  description: string
  inputSchema: z.ZodSchema
  handler: (input: unknown) => Promise<unknown>
}

export const mcpTools: McpTool[] = [
  ...todoTools,
  ...crmTools,
  ...financeTools,
]
