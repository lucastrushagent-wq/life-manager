import { z } from 'zod'
import type { Todo } from './types'

export const TodoSchema = z.object({
  id: z.string(),
  title: z.string().min(1, 'Title is required'),
  completed: z.boolean(),
  dueDate: z.string().optional(),
  priority: z.enum(['high', 'medium', 'low']),
  tags: z.array(z.string()),
  createdAt: z.string(),
}) satisfies z.ZodType<Todo>

export const CreateTodoSchema = TodoSchema.omit({ id: true, createdAt: true, completed: true })
