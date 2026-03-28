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

function formatTodosForEmail(todos: Todo[]): string {
  const incomplete = todos.filter(t => !t.completed)
  const complete = todos.filter(t => t.completed)

  function formatTodo(todo: Todo): string {
    const check = todo.completed ? '[x]' : '[ ]'
    let line = `${check} ${todo.title}`
    if (todo.dueDate) {
      const due = new Date(todo.dueDate)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      due.setHours(0, 0, 0, 0)
      const days = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      const daysLabel = days < 0 ? `${Math.abs(days)}d overdue` : days === 0 ? 'due today' : `${days}d left`
      line += ` — Due: ${new Date(todo.dueDate).toLocaleDateString()} (${daysLabel})`
    }
    line += ` — Priority: ${todo.priority.charAt(0).toUpperCase() + todo.priority.slice(1)}`
    if (todo.tags.length > 0) line += ` — Tags: ${todo.tags.join(', ')}`
    if (todo.description) line += `\n    ${todo.description}`
    return line
  }

  const lines: string[] = [
    'My To-do List',
    '=============',
    '',
  ]

  if (incomplete.length > 0) {
    lines.push('Tasks:', '', ...incomplete.map(formatTodo), '')
  }

  if (complete.length > 0) {
    lines.push('Completed:', '', ...complete.map(formatTodo), '')
  }

  if (todos.length === 0) lines.push('No tasks.')

  return lines.join('\n')
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

  function shareByEmail() {
    const subject = 'My To-do List'
    const body = formatTodosForEmail(sortedTodos)
    window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`)
  }

  return {
    todos: sortedTodos,
    create, toggle, remove,
    sortField, sortDir, toggleSort,
    filterPriority, setFilterPriority,
    filterTag, setFilterTag,
    shareByEmail,
  }
}
