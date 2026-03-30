import { useState } from 'react'
import { Plus } from 'lucide-react'
import { z } from 'zod'
import { CreateKeyDateSchema } from '../schema'

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']

interface Props {
  onAdd: (input: z.infer<typeof CreateKeyDateSchema>) => void
  onCancel: () => void
}

export function AddKeyDateForm({ onAdd, onCancel }: Props) {
  const [label, setLabel] = useState('')
  const [month, setMonth] = useState('1')
  const [day, setDay] = useState('1')

  function handleSubmit() {
    if (!label.trim()) return
    onAdd({ label: label.trim(), month: parseInt(month), day: parseInt(day) })
  }

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-3">
      <input autoFocus type="text" placeholder="Label (e.g. Birthday, Wedding Anniversary)" value={label}
        onChange={e => setLabel(e.target.value)}
        className="w-full text-sm border border-gray-200 rounded px-2 py-1.5 outline-none focus:border-blue-400 mb-2" />
      <div className="flex gap-2 mb-2">
        <select value={month} onChange={e => setMonth(e.target.value)}
          className="text-sm border border-gray-200 rounded px-2 py-1 outline-none focus:border-blue-400 bg-white flex-1">
          {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
        </select>
        <input type="number" min={1} max={31} value={day} onChange={e => setDay(e.target.value)}
          className="text-sm border border-gray-200 rounded px-2 py-1 outline-none focus:border-blue-400 w-20 text-center" />
      </div>
      <div className="flex justify-end gap-2">
        <button onClick={onCancel} className="text-sm px-3 py-1 text-gray-500 hover:text-gray-700">Cancel</button>
        <button onClick={handleSubmit} disabled={!label.trim()}
          className="flex items-center gap-1.5 text-sm px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed">
          <Plus className="w-3 h-3" /> Add
        </button>
      </div>
    </div>
  )
}
