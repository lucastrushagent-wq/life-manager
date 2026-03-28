import { Trash2, Calendar } from 'lucide-react'
import type { Todo, Priority } from '../types'

interface Props {
  todo: Todo
  onToggle: (id: string) => void
  onDelete: (id: string) => void
}

const priorityStyles: Record<Priority, string> = {
  high: 'bg-red-100 text-red-700',
  medium: 'bg-amber-100 text-amber-700',
  low: 'bg-green-100 text-green-700',
}

function getDaysRemaining(dueDate: string): { label: string; color: string } {
  const due = new Date(dueDate)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  due.setHours(0, 0, 0, 0)
  const days = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  if (days < 0) return { label: `${Math.abs(days)}d overdue`, color: 'text-red-500' }
  if (days === 0) return { label: 'Due today', color: 'text-orange-500' }
  if (days <= 3) return { label: `${days}d left`, color: 'text-amber-500' }
  return { label: `${days}d left`, color: 'text-gray-400' }
}

export function TodoItem({ todo, onToggle, onDelete }: Props) {
  const due = todo.dueDate ? getDaysRemaining(todo.dueDate) : null

  return (
    <div className={`flex items-start gap-3 p-3 rounded-lg border bg-white transition-opacity ${todo.completed ? 'opacity-50' : 'hover:shadow-sm'}`}>
      <input
        type="checkbox"
        checked={todo.completed}
        onChange={() => onToggle(todo.id)}
        className="mt-0.5 w-4 h-4 rounded border-gray-300 text-blue-600 cursor-pointer accent-blue-600"
      />

      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${todo.completed ? 'line-through text-gray-400' : 'text-gray-800'}`}>
          {todo.title}
        </p>

        <div className="flex flex-wrap items-center gap-2 mt-1.5">
          {due && (
            <span className={`flex items-center gap-1 text-xs ${due.color}`}>
              <Calendar className="w-3 h-3" />
              {new Date(todo.dueDate!).toLocaleDateString()} · {due.label}
            </span>
          )}

          <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium capitalize ${priorityStyles[todo.priority]}`}>
            {todo.priority}
          </span>

          {todo.tags.map(tag => (
            <span key={tag} className="text-xs bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded-full">
              {tag}
            </span>
          ))}
        </div>
      </div>

      <button
        onClick={() => onDelete(todo.id)}
        className="text-gray-300 hover:text-red-400 transition-colors flex-shrink-0 mt-0.5"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  )
}
