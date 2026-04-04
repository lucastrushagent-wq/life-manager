import { z } from 'zod'
import type { McpTool } from '../../core/mcp'
import { visionService } from './service'
import { GoalCategoryValues } from './schema'

export const visionTools: McpTool[] = [
  {
    name: 'vision_get_all',
    description: 'Get the full vision: statement, core values, all goals, and personal manifesto',
    inputSchema: z.object({}),
    handler: async () => {
      const [vision, values, goals, manifesto] = await Promise.all([
        visionService.getVision(),
        visionService.getValues(),
        visionService.getGoals(),
        visionService.getManifesto(),
      ])
      return { vision, values, goals, manifesto }
    },
  },
  {
    name: 'vision_save_statement',
    description: 'Save or update the vision statement',
    inputSchema: z.object({ content: z.string() }),
    handler: async (input) => {
      const { content } = input as { content: string }
      return visionService.saveVision(content)
    },
  },
  {
    name: 'vision_add_goal',
    description: 'Add a new life goal',
    inputSchema: z.object({
      category: z.enum(GoalCategoryValues),
      title: z.string(),
      description: z.string().optional(),
      timeframe: z.enum(['short', 'medium', 'long', 'lifetime']),
      targetDate: z.string().optional(),
      status: z.enum(['active', 'achieved', 'paused', 'abandoned']).default('active'),
    }),
    handler: async (input) => visionService.addGoal(input as Parameters<typeof visionService.addGoal>[0]),
  },
  {
    name: 'vision_update_goal',
    description: 'Update a goal (e.g. mark as achieved)',
    inputSchema: z.object({
      id: z.string(),
      status: z.enum(['active', 'achieved', 'paused', 'abandoned']).optional(),
      title: z.string().optional(),
      description: z.string().optional(),
      targetDate: z.string().optional(),
    }),
    handler: async (input) => {
      const { id, ...patch } = input as { id: string } & Record<string, unknown>
      return visionService.updateGoal(id, patch as Parameters<typeof visionService.updateGoal>[1])
    },
  },
  {
    name: 'vision_save_manifesto',
    description: 'Save or update the personal manifesto',
    inputSchema: z.object({ content: z.string() }),
    handler: async (input) => {
      const { content } = input as { content: string }
      return visionService.saveManifesto(content)
    },
  },
]
