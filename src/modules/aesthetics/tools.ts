import { z } from 'zod'
import type { McpTool } from '../../core/mcp'
import { aestheticsService } from './service'
import {
  CreateProductSchema, CreateRoutineSchema, CreateScheduleSchema,
  CreateWardrobeItemSchema, CreateOutfitIdeaSchema, CreateInspirationItemSchema,
} from './schema'

export const aestheticsTools: McpTool[] = [
  // Products
  {
    name: 'aesthetics_products_list',
    description: 'List all skincare, grooming, and fragrance products',
    inputSchema: z.object({}),
    handler: async () => aestheticsService.getProducts(),
  },
  {
    name: 'aesthetics_product_create',
    description: 'Add a new product (skincare, haircare, grooming, fragrance, etc.)',
    inputSchema: CreateProductSchema,
    handler: async (input) => aestheticsService.createProduct(input as z.infer<typeof CreateProductSchema>),
  },
  {
    name: 'aesthetics_product_update',
    description: 'Update a product by id',
    inputSchema: z.object({ id: z.string(), patch: CreateProductSchema.partial() }),
    handler: async (input) => {
      const { id, patch } = input as { id: string; patch: z.infer<typeof CreateProductSchema> }
      return aestheticsService.updateProduct(id, patch)
    },
  },
  {
    name: 'aesthetics_product_delete',
    description: 'Delete a product by id',
    inputSchema: z.object({ id: z.string() }),
    handler: async (input) => aestheticsService.deleteProduct((input as { id: string }).id),
  },

  // Routines
  {
    name: 'aesthetics_routines_list',
    description: 'List all grooming routines (morning, evening, weekly)',
    inputSchema: z.object({}),
    handler: async () => aestheticsService.getRoutines(),
  },
  {
    name: 'aesthetics_routine_create',
    description: 'Create a new grooming routine with steps',
    inputSchema: CreateRoutineSchema,
    handler: async (input) => aestheticsService.createRoutine(input as z.infer<typeof CreateRoutineSchema>),
  },
  {
    name: 'aesthetics_routine_update',
    description: 'Update a routine by id',
    inputSchema: z.object({ id: z.string(), patch: CreateRoutineSchema.partial() }),
    handler: async (input) => {
      const { id, patch } = input as { id: string; patch: z.infer<typeof CreateRoutineSchema> }
      return aestheticsService.updateRoutine(id, patch)
    },
  },
  {
    name: 'aesthetics_routine_delete',
    description: 'Delete a routine by id',
    inputSchema: z.object({ id: z.string() }),
    handler: async (input) => aestheticsService.deleteRoutine((input as { id: string }).id),
  },

  // Schedules
  {
    name: 'aesthetics_schedules_list',
    description: 'List all grooming schedules (haircut, beard trim, nail care, etc.)',
    inputSchema: z.object({}),
    handler: async () => aestheticsService.getSchedules(),
  },
  {
    name: 'aesthetics_schedule_create',
    description: 'Create a recurring grooming schedule with a frequency in days',
    inputSchema: CreateScheduleSchema,
    handler: async (input) => aestheticsService.createSchedule(input as z.infer<typeof CreateScheduleSchema>),
  },
  {
    name: 'aesthetics_schedule_mark_done',
    description: 'Mark a grooming schedule as done today',
    inputSchema: z.object({ id: z.string() }),
    handler: async (input) => {
      const { id } = input as { id: string }
      return aestheticsService.updateSchedule(id, { lastDoneAt: new Date().toISOString() })
    },
  },
  {
    name: 'aesthetics_schedule_delete',
    description: 'Delete a grooming schedule by id',
    inputSchema: z.object({ id: z.string() }),
    handler: async (input) => aestheticsService.deleteSchedule((input as { id: string }).id),
  },

  // Wardrobe
  {
    name: 'aesthetics_wardrobe_list',
    description: 'List all wardrobe items (owned clothes and wishlist)',
    inputSchema: z.object({}),
    handler: async () => aestheticsService.getWardrobe(),
  },
  {
    name: 'aesthetics_wardrobe_add',
    description: 'Add a clothing item to the wardrobe',
    inputSchema: CreateWardrobeItemSchema,
    handler: async (input) => aestheticsService.createWardrobeItem(input as z.infer<typeof CreateWardrobeItemSchema>),
  },
  {
    name: 'aesthetics_wardrobe_update',
    description: 'Update a wardrobe item by id',
    inputSchema: z.object({ id: z.string(), patch: CreateWardrobeItemSchema.partial() }),
    handler: async (input) => {
      const { id, patch } = input as { id: string; patch: z.infer<typeof CreateWardrobeItemSchema> }
      return aestheticsService.updateWardrobeItem(id, patch)
    },
  },
  {
    name: 'aesthetics_wardrobe_delete',
    description: 'Delete a wardrobe item by id',
    inputSchema: z.object({ id: z.string() }),
    handler: async (input) => aestheticsService.deleteWardrobeItem((input as { id: string }).id),
  },

  // Outfits
  {
    name: 'aesthetics_outfits_list',
    description: 'List all outfit ideas',
    inputSchema: z.object({}),
    handler: async () => aestheticsService.getOutfits(),
  },
  {
    name: 'aesthetics_outfit_create',
    description: 'Create a new outfit idea',
    inputSchema: CreateOutfitIdeaSchema,
    handler: async (input) => aestheticsService.createOutfit(input as z.infer<typeof CreateOutfitIdeaSchema>),
  },
  {
    name: 'aesthetics_outfit_update',
    description: 'Update an outfit idea by id',
    inputSchema: z.object({ id: z.string(), patch: CreateOutfitIdeaSchema.partial() }),
    handler: async (input) => {
      const { id, patch } = input as { id: string; patch: z.infer<typeof CreateOutfitIdeaSchema> }
      return aestheticsService.updateOutfit(id, patch)
    },
  },
  {
    name: 'aesthetics_outfit_delete',
    description: 'Delete an outfit idea by id',
    inputSchema: z.object({ id: z.string() }),
    handler: async (input) => aestheticsService.deleteOutfit((input as { id: string }).id),
  },

  // Inspiration
  {
    name: 'aesthetics_inspiration_list',
    description: 'List all style inspiration items',
    inputSchema: z.object({}),
    handler: async () => aestheticsService.getInspiration(),
  },
  {
    name: 'aesthetics_inspiration_add',
    description: 'Add a style inspiration item (image URL, source, category)',
    inputSchema: CreateInspirationItemSchema,
    handler: async (input) => aestheticsService.createInspirationItem(input as z.infer<typeof CreateInspirationItemSchema>),
  },
  {
    name: 'aesthetics_inspiration_update',
    description: 'Update an inspiration item by id',
    inputSchema: z.object({ id: z.string(), patch: CreateInspirationItemSchema.partial() }),
    handler: async (input) => {
      const { id, patch } = input as { id: string; patch: z.infer<typeof CreateInspirationItemSchema> }
      return aestheticsService.updateInspirationItem(id, patch)
    },
  },
  {
    name: 'aesthetics_inspiration_delete',
    description: 'Delete an inspiration item by id',
    inputSchema: z.object({ id: z.string() }),
    handler: async (input) => aestheticsService.deleteInspirationItem((input as { id: string }).id),
  },
]
