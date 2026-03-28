import { create } from 'zustand'
import { z } from 'zod'
import type { Todo } from './types'
import { todoService } from './service'
import { CreateTodoSchema } from './schema'

interface TodoStore {
  todos: Todo[]
  load: () => void
  create: (input: z.infer<typeof CreateTodoSchema>) => void
  toggle: (id: string) => void
  remove: (id: string) => void
}

export const useTodoStore = create<TodoStore>((set) => ({
  todos: [],
  load: () => set({ todos: todoService.getAll() }),
  create: (input) => {
    todoService.create(input)
    set({ todos: todoService.getAll() })
  },
  toggle: (id) => {
    const todo = todoService.getAll().find(t => t.id === id)
    if (!todo) return
    todoService.update(id, { completed: !todo.completed })
    set({ todos: todoService.getAll() })
  },
  remove: (id) => {
    todoService.delete(id)
    set({ todos: todoService.getAll() })
  },
}))
