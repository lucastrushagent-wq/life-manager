import { useState } from 'react'
import { Plus } from 'lucide-react'
import { useTodos } from '../hooks/useTodos'
import { AddTodoForm } from './AddTodoForm'
import { TodoTable } from './TodoTable'
import type { Priority } from '../types'

export function TodoModule() {
  const {
    todos, create, toggle, remove,
    sortField, sortDir, toggleSort,
    filterPriority, setFilterPriority,
    filterTag, setFilterTag,
  } = useTodos()
  const [showForm, setShowForm] = useState(false)

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-gray-900">To-do</h1>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 text-sm px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            Add task
          </button>
        )}
      </div>

      {showForm && (
        <AddTodoForm
          onAdd={input => { create(input); setShowForm(false) }}
          onCancel={() => setShowForm(false)}
        />
      )}

      <div className="flex gap-3 mb-4">
        <select
          value={filterPriority}
          onChange={e => setFilterPriority(e.target.value as Priority | 'all')}
          className="text-sm border border-gray-200 rounded px-2 py-1.5 text-gray-600 outline-none focus:border-blue-400 bg-white"
        >
          <option value="all">All priorities</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <input
          type="text"
          placeholder="Filter by tag..."
          value={filterTag}
          onChange={e => setFilterTag(e.target.value)}
          className="text-sm border border-gray-200 rounded px-2 py-1.5 text-gray-600 outline-none focus:border-blue-400 w-40"
        />
      </div>

      <TodoTable
        todos={todos}
        sortField={sortField}
        sortDir={sortDir}
        onToggleSort={toggleSort}
        onToggle={toggle}
        onDelete={remove}
      />
    </div>
  )
}
