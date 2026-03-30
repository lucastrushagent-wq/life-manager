import { Trash2 } from 'lucide-react'
import type { RecurringTodo } from '../types'

const PRIORITY_COLORS = {
  high: 'text-red-600 bg-red-50',
  medium: 'text-yellow-600 bg-yellow-50',
  low: 'text-green-600 bg-green-50',
}

interface Props {
  recurringTodos: RecurringTodo[]
  onDelete: (id: string) => void
}

export function RecurringTodoTable({ recurringTodos, onDelete }: Props) {
  if (recurringTodos.length === 0) {
    return <p className="text-center text-gray-400 text-sm py-16">No recurring tasks yet. Add one above.</p>
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200 text-left">
            <th className="px-4 py-3 font-medium text-gray-600">Task</th>
            <th className="px-4 py-3 font-medium text-gray-600">Frequency</th>
            <th className="px-4 py-3 font-medium text-gray-600">Priority</th>
            <th className="px-4 py-3 font-medium text-gray-600">Tags</th>
            <th className="px-4 py-3 font-medium text-gray-600">Last generated</th>
            <th className="px-4 py-3 w-12" />
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {recurringTodos.map(r => (
            <tr key={r.id} className="bg-white hover:bg-gray-50">
              <td className="px-4 py-3">
                <div className="font-medium text-gray-800">{r.title}</div>
                {r.description && <div className="text-xs text-gray-400 mt-0.5">{r.description}</div>}
              </td>
              <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                Every {r.frequencyValue} {r.frequencyUnit}
              </td>
              <td className="px-4 py-3">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PRIORITY_COLORS[r.priority]}`}>
                  {r.priority.charAt(0).toUpperCase() + r.priority.slice(1)}
                </span>
              </td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap gap-1">
                  {r.tags.map(tag => (
                    <span key={tag} className="text-xs bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded-full">{tag}</span>
                  ))}
                </div>
              </td>
              <td className="px-4 py-3 text-gray-400 whitespace-nowrap">
                {r.lastGeneratedAt ? new Date(r.lastGeneratedAt).toLocaleDateString() : <span className="italic">Never</span>}
              </td>
              <td className="px-4 py-3 text-right">
                <button onClick={() => onDelete(r.id)} className="text-gray-300 hover:text-red-400 transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
