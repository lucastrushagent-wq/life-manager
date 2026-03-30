import { z } from 'zod'
import type { Todo, RecurringTodo } from './types'

export const TodoSchema = z.object({
  id: z.string(),
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  completed: z.boolean(),
  dueDate: z.string().optional(),
  priority: z.enum(['high', 'medium', 'low']),
  tags: z.array(z.string()),
  createdAt: z.string(),
  recurringTodoId: z.string().optional(),
}) satisfies z.ZodType<Todo>

export const CreateTodoSchema = TodoSchema.omit({ id: true, createdAt: true, completed: true, recurringTodoId: true })

export const RecurringTodoSchema = z.object({
  id: z.string(),
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  priority: z.enum(['high', 'medium', 'low']),
  tags: z.array(z.string()),
  frequencyValue: z.number().int().min(1),
  frequencyUnit: z.enum(['weeks', 'months']),
  lastGeneratedAt: z.string().optional(),
  createdAt: z.string(),
}) satisfies z.ZodType<RecurringTodo>

export const CreateRecurringTodoSchema = RecurringTodoSchema.omit({ id: true, createdAt: true, lastGeneratedAt: true })
