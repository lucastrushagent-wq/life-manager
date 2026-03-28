import { useEffect, useMemo, useState } from 'react'
import { useTodoStore } from '../store'
import type { Priority, SortDir, SortField, Todo } from '../types'

const PRIORITY_ORDER: Record<Priority, number> = { high: 0, medium: 1, low: 2 }

function sortTodos(todos: Todo[], field: SortField, dir: SortDir): Todo[] {
  return [...todos].sort((a, b) => {
    let result = 0
    if (field === 'title') {
      result = a.title.localeCompare(b.title)
    } else if (field === 'dueDate') {
      const aDate = a.dueDate ? new Date(a.dueDate).getTime() : Infinity
      const bDate = b.dueDate ? new Date(b.dueDate).getTime() : Infinity
      result = aDate - bDate
    } else if (field === 'priority') {
      result = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]
    } else {
      result = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    }
    return dir === 'asc' ? result : -result
  })
}

export function useTodos() {
  const todos = useTodoStore(s => s.todos)
  const load = useTodoStore(s => s.load)
  const create = useTodoStore(s => s.create)
  const toggle = useTodoStore(s => s.toggle)
  const remove = useTodoStore(s => s.remove)

  const [sortField, setSortField] = useState<SortField>('createdAt')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [filterPriority, setFilterPriority] = useState<Priority | 'all'>('all')
  const [filterTag, setFilterTag] = useState('')

  useEffect(() => { load() }, [load])

  function toggleSort(field: SortField) {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDir('asc')
    }
  }

  const sortedTodos = useMemo(() => {
    let filtered = todos
    if (filterPriority !== 'all') filtered = filtered.filter(t => t.priority === filterPriority)
    if (filterTag.trim()) {
      const q = filterTag.toLowerCase()
      filtered = filtered.filter(t => t.tags.some(tag => tag.toLowerCase().includes(q)))
    }
    const incomplete = sortTodos(filtered.filter(t => !t.completed), sortField, sortDir)
    const complete = sortTodos(filtered.filter(t => t.completed), sortField, sortDir)
    return [...incomplete, ...complete]
  }, [todos, sortField, sortDir, filterPriority, filterTag])

  return {
    todos: sortedTodos,
    create, toggle, remove,
    sortField, sortDir, toggleSort,
    filterPriority, setFilterPriority,
    filterTag, setFilterTag,
  }
}
