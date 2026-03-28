import { z } from 'zod'
import type { Todo } from './types'
import { CreateTodoSchema } from './schema'

const KEY = 'life-manager:todos'

function load(): Todo[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]')
  } catch {
    return []
  }
}

function save(todos: Todo[]): void {
  localStorage.setItem(KEY, JSON.stringify(todos))
}

export const todoService = {
  getAll(): Todo[] {
    return load()
  },
  create(input: z.infer<typeof CreateTodoSchema>): Todo {
    const todo: Todo = {
      ...input,
      id: crypto.randomUUID(),
      completed: false,
      createdAt: new Date().toISOString(),
    }
    save([...load(), todo])
    return todo
  },
  update(id: string, patch: Partial<Omit<Todo, 'id' | 'createdAt'>>): Todo {
    const todos = load()
    const idx = todos.findIndex(t => t.id === id)
    if (idx === -1) throw new Error(`Todo ${id} not found`)
    todos[idx] = { ...todos[idx], ...patch }
    save(todos)
    return todos[idx]
  },
  delete(id: string): void {
    save(load().filter(t => t.id !== id))
  },
}
