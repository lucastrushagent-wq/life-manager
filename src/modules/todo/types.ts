export type Priority = 'high' | 'medium' | 'low'
export type SortField = 'title' | 'dueDate' | 'priority' | 'createdAt'
export type SortDir = 'asc' | 'desc'
export type FrequencyUnit = 'weeks' | 'months'

export interface Todo {
  id: string
  title: string
  description?: string
  completed: boolean
  dueDate?: string
  priority: Priority
  tags: string[]
  createdAt: string
  recurringTodoId?: string
}

export interface RecurringTodo {
  id: string
  title: string
  description?: string
  priority: Priority
  tags: string[]
  frequencyValue: number
  frequencyUnit: FrequencyUnit
  lastGeneratedAt?: string
  createdAt: string
}
