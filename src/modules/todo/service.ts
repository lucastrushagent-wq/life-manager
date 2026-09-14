import { API_BASE } from '../../core/apiBase.js'
import { z } from 'zod'
import type { Todo, RecurringTodo } from './types'
import { CreateTodoSchema, CreateRecurringTodoSchema } from './schema'

const API = `${API_BASE}/api/todos`
const RECURRING_API = `${API_BASE}/api/recurring-todos`

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options)
  if (!res.ok) throw new Error(`API error ${res.status}: ${url}`)
  return res.status === 204 ? (undefined as T) : res.json()
}

export const todoService = {
  getAll(): Promise<Todo[]> {
    return request<Todo[]>(API)
  },

  /** Open todos with no calendar block yet — the work list for time-boxing. */
  getUnscheduled(): Promise<Todo[]> {
    return request<Todo[]>(`${API}?scheduled=false`)
  },

  getScheduled(): Promise<Todo[]> {
    return request<Todo[]>(`${API}?scheduled=true`)
  },

  /**
   * Record that a todo has been blocked out on the calendar. Pass null for
   * scheduledAt to clear it — the agent's calendar connector creates and removes
   * the actual event; this only remembers that it did.
   */
  setSchedule(
    id: string,
    schedule: { scheduledAt: string | null; scheduledEndAt?: string | null; calendarEventId?: string | null },
  ): Promise<Todo> {
    return request<Todo>(`${API}/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        scheduledAt: schedule.scheduledAt,
        scheduledEndAt: schedule.scheduledEndAt ?? null,
        calendarEventId: schedule.calendarEventId ?? null,
      }),
    })
  },
  getArchive(): Promise<Todo[]> {
    return request<Todo[]>(`${API}/archive`)
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
  /**
   * Materialise todos for anything now due in another module. Idempotent — a
   * source with an open todo is skipped, so this is safe to call on every load.
   */
  generateSourced(): Promise<{ created: number; items: { title: string; sourceType: string }[] }> {
    return request(`${API}/generate-sourced`, { method: 'POST' })
  },

  generateRecurring(): Promise<Todo[]> {
    return request<Todo[]>(`${RECURRING_API}/generate`, { method: 'POST' })
  },
}
