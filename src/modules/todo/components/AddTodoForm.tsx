import { useState, KeyboardEvent } from 'react'
import { Plus, X } from 'lucide-react'
import { z } from 'zod'
import { CreateTodoSchema } from '../schema'
import type { Priority } from '../types'

interface Props {
  onAdd: (input: z.infer<typeof CreateTodoSchema>) => void
  onCancel: () => void
}

export function AddTodoForm({ onAdd, onCancel }: Props) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [dueDate, setDueDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [priority, setPriority] = useState<Priority>('high')
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')

  function addTag() {
    const tag = tagInput.trim().replace(/,$/, '')
    if (tag && !tags.includes(tag)) setTags(prev => [...prev, tag])
    setTagInput('')
  }

  function handleTagKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addTag()
    }
  }

  function handleSubmit() {
    if (!title.trim()) return
    onAdd({ title: title.trim(), description: description.trim() || undefined, priority, tags, dueDate: dueDate || undefined })
  }

  return (
    <div className="bg-white border border-blue-200 rounded-lg p-4 mb-4 shadow-sm">
      <input
        autoFocus
        type="text"
        placeholder="Task title"
        value={title}
        onChange={e => setTitle(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && handleSubmit()}
        className="w-full text-sm outline-none placeholder-gray-400 mb-3 font-medium text-gray-800"
      />

      <textarea
        placeholder="Description (optional)"
        value={description}
        onChange={e => setDescription(e.target.value)}
        rows={2}
        className="w-full text-sm outline-none placeholder-gray-400 mb-3 text-gray-600 resize-none border border-gray-200 rounded px-2 py-1.5 focus:border-blue-400"
      />

      <div className="flex flex-col sm:flex-row gap-2 mb-3">
        <input
          type="date"
          value={dueDate}
          onChange={e => setDueDate(e.target.value)}
          className="w-full sm:w-auto text-sm border border-gray-200 rounded px-3 py-2.5 sm:py-1.5 text-gray-600 outline-none focus:border-blue-400"
        />
        <select
          value={priority}
          onChange={e => setPriority(e.target.value as Priority)}
          className="w-full sm:w-auto text-sm border border-gray-200 rounded px-3 py-2.5 sm:py-1.5 text-gray-600 outline-none focus:border-blue-400 bg-white"
        >
          <option value="high">High priority</option>
          <option value="medium">Medium priority</option>
          <option value="low">Low priority</option>
        </select>
      </div>

      <div className="mb-4">
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-1.5">
            {tags.map(tag => (
              <span key={tag} className="flex items-center gap-1 bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded-full">
                {tag}
                <button onClick={() => setTags(tags.filter(t => t !== tag))} className="hover:text-blue-900">
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}
        <input
          type="text"
          placeholder="Add tag, press Enter"
          value={tagInput}
          onChange={e => setTagInput(e.target.value)}
          onKeyDown={handleTagKeyDown}
          onBlur={addTag}
          className="text-sm border border-gray-200 rounded px-3 py-2.5 sm:py-1.5 w-full outline-none focus:border-blue-400 placeholder-gray-400"
        />
      </div>

      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
        <button onClick={onCancel} className="text-sm px-3 py-2.5 sm:py-1.5 text-gray-500 hover:text-gray-700 text-center">
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={!title.trim()}
          className="flex items-center justify-center gap-1.5 text-sm px-3 py-2.5 sm:py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Plus className="w-3.5 h-3.5" />
          Add task
        </button>
      </div>
    </div>
  )
}
