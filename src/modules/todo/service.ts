import { z } from 'zod'
import type { Todo } from './types'
import { CreateTodoSchema } from './schema'

const API = '/api/todos'

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
}
