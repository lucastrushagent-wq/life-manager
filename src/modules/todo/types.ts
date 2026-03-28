export type Priority = 'high' | 'medium' | 'low'

export interface Todo {
  id: string
  title: string
  completed: boolean
  dueDate?: string
  priority: Priority
  tags: string[]
  createdAt: string
}
