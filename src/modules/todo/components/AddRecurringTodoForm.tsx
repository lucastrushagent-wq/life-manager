import { useState } from 'react'
import type { Priority, FrequencyUnit } from '../types'

interface Input {
  title: string
  description?: string
  priority: Priority
  tags: string[]
  frequencyValue: number
  frequencyUnit: FrequencyUnit
}

interface Props {
  onAdd: (input: Input) => void
  onCancel: () => void
}

export function AddRecurringTodoForm({ onAdd, onCancel }: Props) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<Priority>('medium')
  const [tagsInput, setTagsInput] = useState('')
  const [frequencyValue, setFrequencyValue] = useState(1)
  const [frequencyUnit, setFrequencyUnit] = useState<FrequencyUnit>('weeks')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    const tags = tagsInput.split(',').map(t => t.trim()).filter(Boolean)
    onAdd({ title: title.trim(), description: description.trim() || undefined, priority, tags, frequencyValue, frequencyUnit })
  }

  return (
    <form onSubmit={handleSubmit} className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
      <div className="grid grid-cols-2 gap-3 mb-3">
        <input
          className="col-span-2 text-sm border border-gray-200 rounded px-3 py-2 outline-none focus:border-blue-400"
          placeholder="Task title *"
          value={title}
          onChange={e => setTitle(e.target.value)}
          autoFocus
        />
        <input
          className="col-span-2 text-sm border border-gray-200 rounded px-3 py-2 outline-none focus:border-blue-400"
          placeholder="Description (optional)"
          value={description}
          onChange={e => setDescription(e.target.value)}
        />
        <select
          className="text-sm border border-gray-200 rounded px-3 py-2 outline-none focus:border-blue-400 bg-white text-gray-600"
          value={priority}
          onChange={e => setPriority(e.target.value as Priority)}
        >
          <option value="high">High priority</option>
          <option value="medium">Medium priority</option>
          <option value="low">Low priority</option>
        </select>
        <input
          className="text-sm border border-gray-200 rounded px-3 py-2 outline-none focus:border-blue-400"
          placeholder="Tags (comma-separated)"
          value={tagsInput}
          onChange={e => setTagsInput(e.target.value)}
        />
        <div className="col-span-2 flex items-center gap-2">
          <span className="text-sm text-gray-500">Every</span>
          <input
            type="number"
            min={1}
            className="text-sm border border-gray-200 rounded px-3 py-2 outline-none focus:border-blue-400 w-20"
            value={frequencyValue}
            onChange={e => setFrequencyValue(Math.max(1, parseInt(e.target.value) || 1))}
          />
          <select
            className="text-sm border border-gray-200 rounded px-3 py-2 outline-none focus:border-blue-400 bg-white text-gray-600"
            value={frequencyUnit}
            onChange={e => setFrequencyUnit(e.target.value as FrequencyUnit)}
          >
            <option value="weeks">weeks</option>
            <option value="months">months</option>
          </select>
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="text-sm px-3 py-1.5 text-gray-500 hover:text-gray-700">Cancel</button>
        <button type="submit" className="text-sm px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700">Add recurring task</button>
      </div>
    </form>
  )
}
