import { useState, KeyboardEvent } from 'react'
import { ArrowUpDown, ArrowUp, ArrowDown, Trash2, Calendar, Pencil, X } from 'lucide-react'
import type { Priority, SortDir, SortField, Todo } from '../types'

interface Props {
  todos: Todo[]
  sortField: SortField
  sortDir: SortDir
  onToggleSort: (field: SortField) => void
  onToggle: (id: string) => void
  onUpdate: (id: string, patch: Partial<Omit<Todo, 'id' | 'createdAt'>>) => void
  onDelete: (id: string) => void
}

const priorityStyles: Record<Priority, string> = {
  high: 'bg-red-100 text-red-700',
  medium: 'bg-amber-100 text-amber-700',
  low: 'bg-green-100 text-green-700',
}

// Parse YYYY-MM-DD as local date (avoids UTC timezone shift)
function parseLocalDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function getDaysRemaining(dueDate: string): { label: string; color: string } {
  const due = parseLocalDate(dueDate)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  due.setHours(0, 0, 0, 0)
  const days = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  if (days < 0) return { label: `${Math.abs(days)}d overdue`, color: 'text-red-500' }
  if (days === 0) return { label: 'Due today', color: 'text-orange-500' }
  if (days <= 3) return { label: `${days}d left`, color: 'text-amber-500' }
  return { label: `${days}d left`, color: 'text-gray-400' }
}

function SortIcon({ field, sortField, sortDir }: { field: SortField; sortField: SortField; sortDir: SortDir }) {
  if (sortField !== field) return <ArrowUpDown className="w-3 h-3 opacity-40" />
  return sortDir === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
}

function SortHeader({ label, field, sortField, sortDir, onToggleSort }: {
  label: string; field: SortField; sortField: SortField; sortDir: SortDir; onToggleSort: (f: SortField) => void
}) {
  return (
    <button onClick={() => onToggleSort(field)} className="flex items-center gap-1 font-medium text-gray-600 hover:text-gray-900">
      {label} <SortIcon field={field} sortField={sortField} sortDir={sortDir} />
    </button>
  )
}

interface EditState {
  title: string
  description: string
  dueDate: string
  priority: Priority
  tagInput: string
  tags: string[]
}

export function TodoTable({ todos, sortField, sortDir, onToggleSort, onToggle, onUpdate, onDelete }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [edit, setEdit] = useState<EditState>({ title: '', description: '', dueDate: '', priority: 'medium', tagInput: '', tags: [] })

  if (todos.length === 0) {
    return <p className="text-center text-gray-400 text-sm py-16">No tasks yet. Add one above.</p>
  }

  function startEdit(todo: Todo) {
    setEditingId(todo.id)
    setEdit({
      title: todo.title,
      description: todo.description ?? '',
      dueDate: todo.dueDate ?? '',
      priority: todo.priority,
      tagInput: '',
      tags: [...todo.tags],
    })
  }

  function addTag() {
    const tag = edit.tagInput.trim().replace(/,$/, '')
    if (tag && !edit.tags.includes(tag)) setEdit(e => ({ ...e, tags: [...e.tags, tag] }))
    setEdit(e => ({ ...e, tagInput: '' }))
  }

  function handleTagKeyDown(ev: KeyboardEvent<HTMLInputElement>) {
    if (ev.key === 'Enter' || ev.key === ',') { ev.preventDefault(); addTag() }
  }

  function saveEdit(id: string) {
    if (!edit.title.trim()) return
    onUpdate(id, {
      title: edit.title.trim(),
      description: edit.description.trim() || undefined,
      dueDate: edit.dueDate || undefined,
      priority: edit.priority,
      tags: edit.tags,
    })
    setEditingId(null)
  }

  const inputCls = 'text-sm border border-gray-200 rounded px-2 py-1 outline-none focus:border-blue-400'

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            <th className="w-8 px-3 py-3" />
            <th className="px-4 py-3 text-left">
              <SortHeader label="Task" field="title" sortField={sortField} sortDir={sortDir} onToggleSort={onToggleSort} />
            </th>
            <th className="px-4 py-3 text-left">
              <SortHeader label="Due Date" field="dueDate" sortField={sortField} sortDir={sortDir} onToggleSort={onToggleSort} />
            </th>
            <th className="px-4 py-3 text-left">
              <SortHeader label="Priority" field="priority" sortField={sortField} sortDir={sortDir} onToggleSort={onToggleSort} />
            </th>
            <th className="px-4 py-3 text-left font-medium text-gray-600">Tags</th>
            <th className="px-3 py-3 w-16" />
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {todos.map(todo => {
            if (editingId === todo.id) {
              return (
                <tr key={todo.id} className="bg-blue-50">
                  <td className="px-3 py-3">
                    <input type="checkbox" checked={todo.completed} onChange={() => onToggle(todo.id)}
                      className="w-4 h-4 rounded border-gray-300 accent-blue-600 cursor-pointer" />
                  </td>
                  <td className="px-4 py-2" colSpan={4}>
                    <div className="flex flex-col gap-2">
                      <input autoFocus className={`${inputCls} w-full font-medium`} value={edit.title}
                        onChange={e => setEdit(s => ({ ...s, title: e.target.value }))} placeholder="Task title" />
                      <input className={`${inputCls} w-full text-gray-500`} value={edit.description}
                        onChange={e => setEdit(s => ({ ...s, description: e.target.value }))} placeholder="Description (optional)" />
                      <div className="flex gap-2">
                        <input type="date" className={inputCls} value={edit.dueDate}
                          onChange={e => setEdit(s => ({ ...s, dueDate: e.target.value }))} />
                        <select className={`${inputCls} bg-white text-gray-600`} value={edit.priority}
                          onChange={e => setEdit(s => ({ ...s, priority: e.target.value as Priority }))}>
                          <option value="high">High</option>
                          <option value="medium">Medium</option>
                          <option value="low">Low</option>
                        </select>
                      </div>
                      <div>
                        {edit.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-1">
                            {edit.tags.map(tag => (
                              <span key={tag} className="flex items-center gap-1 bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full">
                                {tag}
                                <button onClick={() => setEdit(s => ({ ...s, tags: s.tags.filter(t => t !== tag) }))}><X className="w-3 h-3" /></button>
                              </span>
                            ))}
                          </div>
                        )}
                        <input className={`${inputCls} w-full`} placeholder="Add tag, press Enter"
                          value={edit.tagInput} onChange={e => setEdit(s => ({ ...s, tagInput: e.target.value }))}
                          onKeyDown={handleTagKeyDown} onBlur={addTag} />
                      </div>
                      <div className="flex gap-2 justify-end">
                        <button onClick={() => setEditingId(null)} className="text-xs px-3 py-1.5 text-gray-500 hover:text-gray-700">Cancel</button>
                        <button onClick={() => saveEdit(todo.id)} disabled={!edit.title.trim()}
                          className="text-xs px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-40">Save</button>
                      </div>
                    </div>
                  </td>
                  <td />
                </tr>
              )
            }

            const due = todo.dueDate ? getDaysRemaining(todo.dueDate) : null
            const faded = todo.completed ? 'opacity-50' : ''
            return (
              <tr key={todo.id} className={`bg-white hover:bg-gray-50 transition-colors ${faded}`}>
                <td className="px-3 py-3">
                  <input type="checkbox" checked={todo.completed} onChange={() => onToggle(todo.id)}
                    className="w-4 h-4 rounded border-gray-300 accent-blue-600 cursor-pointer" />
                </td>
                <td className="px-4 py-3 max-w-xs">
                  <p className={`font-medium text-gray-800 ${todo.completed ? 'line-through text-gray-400' : ''}`}>{todo.title}</p>
                  {todo.description && <p className="text-xs text-gray-400 mt-0.5 truncate">{todo.description}</p>}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  {due ? (
                    <div>
                      <div className="flex items-center gap-1 text-gray-500">
                        <Calendar className="w-3 h-3" />
                        {parseLocalDate(todo.dueDate!).toLocaleDateString()}
                      </div>
                      <div className={`text-xs mt-0.5 ${due.color}`}>{due.label}</div>
                    </div>
                  ) : <span className="text-gray-300">—</span>}
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium capitalize ${priorityStyles[todo.priority]}`}>
                    {todo.priority}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {todo.tags.map(tag => (
                      <span key={tag} className="text-xs bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded-full">{tag}</span>
                    ))}
                  </div>
                </td>
                <td className="px-3 py-3">
                  <div className="flex items-center gap-2 justify-end">
                    <button onClick={() => startEdit(todo)} className="text-gray-300 hover:text-blue-400 transition-colors">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => onDelete(todo.id)} className="text-gray-300 hover:text-red-400 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
