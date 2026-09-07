import { z } from 'zod'
import type { McpTool } from '../../core/mcp'
import { shoppingService } from './service'

export const shoppingTools: McpTool[] = [
  {
    name: 'shopping_list_stores',
    description: 'List all shopping stores',
    inputSchema: z.object({}),
    handler: async () => shoppingService.getStores(),
  },
  {
    name: 'shopping_list_items',
    description: 'List all items for a given store',
    inputSchema: z.object({ storeId: z.string() }),
    handler: async (input) => shoppingService.getItems((input as { storeId: string }).storeId),
  },
  {
    name: 'shopping_find_preference',
    description:
      'Look up the preferred brand/variant for a product by name, e.g. "toilet paper" returns ' +
      '"Kirkland Signature 30-roll" and the store it is bought from. Call this before adding a ' +
      'generic item to a cart so the right brand is chosen. Omit the query to list every preference.',
    inputSchema: z.object({ query: z.string().optional() }),
    handler: async (input) => shoppingService.getPreferences((input as { query?: string }).query),
  },
  {
    name: 'shopping_add_item',
    description: 'Add an item to a store\'s shopping list',
    inputSchema: z.object({
      storeId: z.string(),
      name: z.string(),
      quantity: z.string().optional(),
      notes: z.string().optional(),
      preferredBrand: z.string().optional(),
      isPreference: z.boolean().optional(),
    }),
    handler: async (input) => {
      const { storeId, isPreference, ...rest } = input as {
        storeId: string; name: string; quantity?: string; notes?: string
        preferredBrand?: string; isPreference?: boolean
      }
      return shoppingService.addItem(storeId, { ...rest, recurring: false, isPreference: isPreference ?? false })
    },
  },
  {
    name: 'shopping_check_item',
    description: 'Mark an item as checked (bought) or unchecked',
    inputSchema: z.object({ itemId: z.string(), checked: z.boolean() }),
    handler: async (input) => {
      const { itemId, checked } = input as { itemId: string; checked: boolean }
      return shoppingService.updateItem(itemId, { checked })
    },
  },
  {
    name: 'shopping_delete_item',
    description: 'Delete an item from a shopping list',
    inputSchema: z.object({ itemId: z.string() }),
    handler: async (input) => shoppingService.deleteItem((input as { itemId: string }).itemId),
  },
  {
    name: 'shopping_clear_checked',
    description: 'Remove all checked items from a store\'s list',
    inputSchema: z.object({ storeId: z.string() }),
    handler: async (input) => shoppingService.clearChecked((input as { storeId: string }).storeId),
  },
]
