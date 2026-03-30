import { useEffect, useState, useCallback } from 'react'
import { todoService } from '../service'
import type { RecurringTodo } from '../types'
import type { CreateRecurringTodoSchema } from '../schema'
import type { z } from 'zod'

export function useRecurringTodos() {
  const [recurringTodos, setRecurringTodos] = useState<RecurringTodo[]>([])

  const load = useCallback(async () => {
    const data = await todoService.getAllRecurring()
    setRecurringTodos(data)
  }, [])

  useEffect(() => { load() }, [load])

  async function create(input: z.infer<typeof CreateRecurringTodoSchema>) {
    const created = await todoService.createRecurring(input)
    setRecurringTodos(prev => [...prev, created])
  }

  async function remove(id: string) {
    await todoService.deleteRecurring(id)
    setRecurringTodos(prev => prev.filter(r => r.id !== id))
  }

  return { recurringTodos, create, remove }
}
