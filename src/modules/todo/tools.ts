import { z } from 'zod'
import type { McpTool } from '../../core/mcp'
import { todoService } from './service'
import { CreateTodoSchema } from './schema'

export const todoTools: McpTool[] = [
  {
    name: 'todo_list',
    description: 'List all todo items',
    inputSchema: z.object({}),
    handler: async () => todoService.getAll(),
  },
  {
    name: 'todo_create',
    description: 'Create a new todo item',
    inputSchema: CreateTodoSchema,
    handler: async (input) => todoService.create(input as z.infer<typeof CreateTodoSchema>),
  },
  {
    name: 'todo_toggle',
    description: 'Toggle the completed state of a todo',
    inputSchema: z.object({ id: z.string() }),
    handler: async (input) => {
      const { id } = input as { id: string }
      const todo = todoService.getAll().find(t => t.id === id)
      if (!todo) throw new Error(`Todo ${id} not found`)
      return todoService.update(id, { completed: !todo.completed })
    },
  },
  {
    name: 'todo_delete',
    description: 'Delete a todo item',
    inputSchema: z.object({ id: z.string() }),
    handler: async (input) => todoService.delete((input as { id: string }).id),
  },
]
