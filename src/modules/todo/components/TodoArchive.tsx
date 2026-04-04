import { useEffect, useState } from 'react'
import { CheckCircle2, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { todoService } from '../service'
import type { Todo } from '../types'

function formatDate(iso: string) {
  const d = new Date(iso)
  return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`
}

function monthKey(iso: string) {
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function monthLabel(key: string) {
  const [y, m] = key.split('-')
  const d = new Date(parseInt(y), parseInt(m) - 1, 1)
  return d.toLocaleString('default', { month: 'long', year: 'numeric' })
}

export function TodoArchive() {
  const [todos, setTodos] = useState<Todo[]>([])
  const [loading, setLoading] = useState(true)
  const [openMonths, setOpenMonths] = useState<Set<string>>(new Set())

  useEffect(() => {
    todoService.getArchive().then(data => {
      setTodos(data)
      setLoading(false)
      // Open the most recent month by default
      if (data.length > 0) {
        const firstKey = monthKey(data[0].deletedAt ?? data[0].completedAt ?? data[0].createdAt)
        setOpenMonths(new Set([firstKey]))
      }
    })
  }, [])

  if (loading) return <p className="text-sm text-gray-400 py-8 text-center">Loading archive…</p>
  if (todos.length === 0) return (
    <div className="text-center py-12">
      <p className="text-sm text-gray-400">No archived todos yet.</p>
      <p className="text-xs text-gray-300 mt-1">Completed and deleted todos will appear here.</p>
    </div>
  )

  // Group by month
  const byMonth: Record<string, Todo[]> = {}
  for (const t of todos) {
    const key = monthKey(t.deletedAt ?? t.completedAt ?? t.createdAt)
    byMonth[key] = byMonth[key] ?? []
    byMonth[key].push(t)
  }

  // Tag summary across all
  const tagCounts: Record<string, number> = {}
  for (const t of todos) {
    for (const tag of t.tags) {
      tagCounts[tag] = (tagCounts[tag] ?? 0) + 1
    }
  }
  const topTags = Object.entries(tagCounts).sort((a, b) => b[1] - a[1])

  const toggleMonth = (key: string) => {
    setOpenMonths(prev => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }

  const completed = todos.filter(t => t.completed && !t.deletedAt).length
  const deleted = todos.filter(t => t.deletedAt).length

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 bg-gray-50 rounded-lg text-center">
          <p className="text-2xl font-bold text-gray-800">{todos.length}</p>
          <p className="text-xs text-gray-400 mt-0.5">Total archived</p>
        </div>
        <div className="p-4 bg-green-50 rounded-lg text-center">
          <p className="text-2xl font-bold text-green-700">{completed}</p>
          <p className="text-xs text-gray-400 mt-0.5">Completed</p>
        </div>
        <div className="p-4 bg-red-50 rounded-lg text-center">
          <p className="text-2xl font-bold text-red-500">{deleted}</p>
          <p className="text-xs text-gray-400 mt-0.5">Deleted</p>
        </div>
      </div>

      {/* Tag breakdown */}
      {topTags.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">By tag</h3>
          <div className="flex flex-wrap gap-2">
            {topTags.map(([tag, count]) => (
              <span key={tag} className="flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 rounded-full text-xs text-gray-600">
                <span className="font-medium">{tag}</span>
                <span className="text-gray-400">{count}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Monthly groups */}
      <div className="space-y-2">
        {Object.entries(byMonth).map(([key, monthTodos]) => {
          const isOpen = openMonths.has(key)
          const monthCompleted = monthTodos.filter(t => t.completed && !t.deletedAt).length
          const monthDeleted = monthTodos.filter(t => t.deletedAt).length
          return (
            <div key={key} className="border border-gray-200 rounded-lg overflow-hidden">
              <button
                onClick={() => toggleMonth(key)}
                className="w-full flex items-center justify-between px-4 py-3 bg-white hover:bg-gray-50 text-left"
              >
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-800">{monthLabel(key)}</span>
                  <span className="text-xs text-gray-400">{monthTodos.length} todo{monthTodos.length !== 1 ? 's' : ''}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-green-600">{monthCompleted} done</span>
                  {monthDeleted > 0 && <span className="text-xs text-red-400">{monthDeleted} deleted</span>}
                  {isOpen ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                </div>
              </button>
              {isOpen && (
                <div className="divide-y divide-gray-100 border-t border-gray-100">
                  {monthTodos.map(t => (
                    <div key={t.id} className="flex items-start gap-3 px-4 py-2.5 bg-gray-50">
                      {t.deletedAt ? (
                        <Trash2 className="w-3.5 h-3.5 text-red-300 mt-0.5 flex-shrink-0" />
                      ) : (
                        <CheckCircle2 className="w-3.5 h-3.5 text-green-500 mt-0.5 flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm ${t.deletedAt ? 'text-gray-400' : 'text-gray-700'}`}>{t.title}</p>
                        {t.tags.length > 0 && (
                          <div className="flex gap-1 mt-0.5 flex-wrap">
                            {t.tags.map(tag => (
                              <span key={tag} className="text-xs bg-gray-200 text-gray-500 px-1.5 py-0.5 rounded">{tag}</span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs text-gray-400">
                          {t.deletedAt ? `deleted ${formatDate(t.deletedAt)}` : t.completedAt ? `done ${formatDate(t.completedAt)}` : ''}
                        </p>
                        <p className="text-xs text-gray-300 capitalize">{t.priority}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
