export type Priority = 'high' | 'medium' | 'low'
export type SortField = 'title' | 'dueDate' | 'priority' | 'createdAt'
export type SortDir = 'asc' | 'desc'

export interface Todo {
  id: string
  title: string
  description?: string
  completed: boolean
  dueDate?: string
  priority: Priority
  tags: string[]
  createdAt: string
}
