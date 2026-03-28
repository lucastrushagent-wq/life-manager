import { useState } from 'react'
import { Plus } from 'lucide-react'
import { useTodos } from '../hooks/useTodos'
import { AddTodoForm } from './AddTodoForm'
import { TodoItem } from './TodoItem'

export function TodoModule() {
  const { todos, create, toggle, remove } = useTodos()
  const [showForm, setShowForm] = useState(false)

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
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
          onAdd={input => {
            create(input)
            setShowForm(false)
          }}
          onCancel={() => setShowForm(false)}
        />
      )}

      {todos.length === 0 && !showForm ? (
        <p className="text-center text-gray-400 text-sm py-16">No tasks yet. Add one above.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {todos.map(todo => (
            <TodoItem key={todo.id} todo={todo} onToggle={toggle} onDelete={remove} />
          ))}
        </div>
      )}
    </div>
  )
}
