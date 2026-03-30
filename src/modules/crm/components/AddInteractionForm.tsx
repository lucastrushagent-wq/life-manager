import { useState } from 'react'
import { Plus } from 'lucide-react'
import { z } from 'zod'
import { CreateInteractionSchema } from '../schema'

interface Props {
  onAdd: (input: z.infer<typeof CreateInteractionSchema>) => void
  onCancel: () => void
}

export function AddInteractionForm({ onAdd, onCancel }: Props) {
  const today = new Date().toISOString().split('T')[0]
  const [date, setDate] = useState(today)
  const [notes, setNotes] = useState('')

  function handleSubmit() {
    if (!notes.trim()) return
    onAdd({ date, notes: notes.trim() })
  }

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-3">
      <div className="flex gap-2 mb-2">
        <input type="date" value={date} onChange={e => setDate(e.target.value)}
          className="text-sm border border-gray-200 rounded px-2 py-1 outline-none focus:border-blue-400 bg-white" />
      </div>
      <textarea autoFocus placeholder="What did you discuss?" value={notes} onChange={e => setNotes(e.target.value)}
        rows={3} className="w-full text-sm border border-gray-200 rounded px-2 py-1.5 outline-none focus:border-blue-400 resize-none placeholder-gray-400 mb-2" />
      <div className="flex justify-end gap-2">
        <button onClick={onCancel} className="text-sm px-3 py-1 text-gray-500 hover:text-gray-700">Cancel</button>
        <button onClick={handleSubmit} disabled={!notes.trim()}
          className="flex items-center gap-1.5 text-sm px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed">
          <Plus className="w-3 h-3" /> Log
        </button>
      </div>
    </div>
  )
}
