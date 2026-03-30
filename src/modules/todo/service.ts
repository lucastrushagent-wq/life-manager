import { z } from 'zod'
import type { Todo, RecurringTodo } from './types'
import { CreateTodoSchema, CreateRecurringTodoSchema } from './schema'

const API = '/api/todos'
const RECURRING_API = '/api/recurring-todos'

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options)
  if (!res.ok) throw new Error(`API error ${res.status}: ${url}`)
  return res.status === 204 ? (undefined as T) : res.json()
}

export const todoService = {
  getAll(): Promise<Todo[]> {
    return request<Todo[]>(API)
  },
  create(input: z.infer<typeof CreateTodoSchema>): Promise<Todo> {
    const todo = {
      ...input,
      id: crypto.randomUUID(),
      completed: false,
      createdAt: new Date().toISOString(),
    }
    return request<Todo>(API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(todo),
    })
  },
  update(id: string, patch: Partial<Omit<Todo, 'id' | 'createdAt'>>): Promise<Todo> {
    return request<Todo>(`${API}/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    })
  },
  delete(id: string): Promise<void> {
    return request<void>(`${API}/${id}`, { method: 'DELETE' })
  },

  // Recurring todos
  getAllRecurring(): Promise<RecurringTodo[]> {
    return request<RecurringTodo[]>(RECURRING_API)
  },
  createRecurring(input: z.infer<typeof CreateRecurringTodoSchema>): Promise<RecurringTodo> {
    const recurring = {
      ...input,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    }
    return request<RecurringTodo>(RECURRING_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(recurring),
    })
  },
  deleteRecurring(id: string): Promise<void> {
    return request<void>(`${RECURRING_API}/${id}`, { method: 'DELETE' })
  },
  generateRecurring(): Promise<Todo[]> {
    return request<Todo[]>(`${RECURRING_API}/generate`, { method: 'POST' })
  },
}
