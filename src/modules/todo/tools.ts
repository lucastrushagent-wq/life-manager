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
    name: 'todo_generate_sourced',
    description:
      'Create todos for anything now due elsewhere — a service provider past its visit ' +
      'cadence, a Tweed vet follow-up. Safe to call repeatedly: a source that already has ' +
      'an open todo is skipped. Completing one of these writes back to its source, so the ' +
      'item stops being due rather than regenerating.',
    inputSchema: z.object({}),
    handler: async () => todoService.generateSourced(),
  },
  {
    name: 'todo_list_unscheduled',
    description:
      'Open todos that have no calendar block yet — the work list for time-boxing. ' +
      'Walk these, decide when each should happen, create the event with your own ' +
      'calendar tools, then call todo_mark_scheduled so it stops appearing here.',
    inputSchema: z.object({}),
    handler: async () => todoService.getUnscheduled(),
  },
  {
    name: 'todo_list_scheduled',
    description: 'Todos already blocked out on the calendar, with their times and calendar event ids',
    inputSchema: z.object({}),
    handler: async () => todoService.getScheduled(),
  },
  {
    name: 'todo_mark_scheduled',
    description:
      'Record that a todo has been time-boxed on the calendar. This does NOT create the ' +
      'event — create it with your calendar tools first, then call this to remember it. ' +
      'Pass calendarEventId so the event can be moved or cancelled later. Times are ISO 8601. ' +
      'Pass scheduledAt: null to clear the block if the event was removed.',
    inputSchema: z.object({
      id: z.string(),
      scheduledAt: z.string().nullable(),
      scheduledEndAt: z.string().nullable().optional(),
      calendarEventId: z.string().nullable().optional(),
    }),
    handler: async (input) => {
      const { id, ...schedule } = input as {
        id: string
        scheduledAt: string | null
        scheduledEndAt?: string | null
        calendarEventId?: string | null
      }
      return todoService.setSchedule(id, schedule)
    },
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
      const todos = await todoService.getAll()
      const todo = todos.find(t => t.id === id)
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
