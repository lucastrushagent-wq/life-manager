import { create } from 'zustand'
import { z } from 'zod'
import type { Todo } from './types'
import { todoService } from './service'
import { CreateTodoSchema } from './schema'

interface TodoStore {
  todos: Todo[]
  load: () => Promise<void>
  create: (input: z.infer<typeof CreateTodoSchema>) => Promise<void>
  update: (id: string, patch: Partial<Omit<Todo, 'id' | 'createdAt'>>) => Promise<void>
  toggle: (id: string) => Promise<void>
  remove: (id: string) => Promise<void>
}

export const useTodoStore = create<TodoStore>((set, get) => ({
  todos: [],
  load: async () => {
    set({ todos: await todoService.getAll() })
  },
  create: async (input) => {
    await todoService.create(input)
    set({ todos: await todoService.getAll() })
  },
  update: async (id, patch) => {
    await todoService.update(id, patch)
    set(state => ({ todos: state.todos.map(t => t.id === id ? { ...t, ...patch } : t) }))
  },
  toggle: async (id) => {
    const todo = get().todos.find(t => t.id === id)
    if (!todo) return
    await todoService.update(id, { completed: !todo.completed })
    set(state => ({
      todos: state.todos.map(t => t.id === id ? { ...t, completed: !t.completed } : t),
    }))
  },
  remove: async (id) => {
    await todoService.delete(id)
    set(state => ({ todos: state.todos.filter(t => t.id !== id) }))
  },
}))
