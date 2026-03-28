import { useEffect } from 'react'
import { useTodoStore } from '../store'

export function useTodos() {
  const todos = useTodoStore(s => s.todos)
  const load = useTodoStore(s => s.load)
  const create = useTodoStore(s => s.create)
  const toggle = useTodoStore(s => s.toggle)
  const remove = useTodoStore(s => s.remove)

  useEffect(() => {
    load()
  }, [load])

  return { todos, create, toggle, remove }
}
