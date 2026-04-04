import { useState } from 'react'
import { Trash2, Plus, Pencil, Trophy } from 'lucide-react'
import { useFitnessStore } from '../store'
import type { PersonalRecord } from '../types'

const STRENGTH_RECORDS = [
  { name: 'Bench Press', unit: 'kg' },
  { name: 'Squat', unit: 'kg' },
  { name: 'Deadlift', unit: 'kg' },
  { name: 'Overhead Press', unit: 'kg' },
  { name: 'Barbell Row', unit: 'kg' },
  { name: 'Pull-up', unit: 'reps' },
]

const CARDIO_RECORDS = [
  { name: '1K Run', unit: 'min' },
  { name: '5K Run', unit: 'min' },
  { name: '10K Run', unit: 'min' },
  { name: 'Half Marathon', unit: 'min' },
  { name: 'Marathon', unit: 'min' },
  { name: '40K Cycling', unit: 'min' },
]

const today = () => new Date().toISOString().split('T')[0]

const formatDate = (d: string) => {
  const [y, mo, day] = d.split('-')
  return `${parseInt(mo)}/${parseInt(day)}/${y}`
}

export function RecordsTab() {
  const { records, addRecord, updateRecord, deleteRecord } = useFitnessStore()
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState({
    category: 'strength' as PersonalRecord['category'],
    name: '', customName: false, value: '', unit: '', date: today(), notes: '',
  })
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const f = (k: string, v: string | boolean) => setForm(prev => ({ ...prev, [k]: v }))

  const presets = form.category === 'strength' ? STRENGTH_RECORDS : CARDIO_RECORDS

  const startEdit = (r: PersonalRecord) => {
    setEditId(r.id)
    setForm({ category: r.category, name: r.name, customName: false, value: String(r.value), unit: r.unit, date: r.date, notes: r.notes ?? '' })
    setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.value || !form.unit) return
    const data = { category: form.category, name: form.name, value: Number(form.value), unit: form.unit, date: form.date, notes: form.notes || undefined }
    if (editId) {
      await updateRecord(editId, data)
      setEditId(null)
    } else {
      await addRecord(data)
    }
    setForm({ category: 'strength', name: '', customName: false, value: '', unit: '', date: today(), notes: '' })
    setShowForm(false)
  }

  const strengthRecords = records.filter(r => r.category === 'strength')
  const cardioRecords = records.filter(r => r.category === 'cardio')

  const RecordCard = ({ r }: { r: PersonalRecord }) => (
    <div className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
      <Trophy className="w-4 h-4 text-yellow-500 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-medium text-gray-900">{r.name}</span>
          <span className="text-base font-semibold text-blue-600">{r.value} {r.unit}</span>
        </div>
        {r.notes && <p className="text-xs text-gray-400 mt-0.5">{r.notes}</p>}
      </div>
      <span className="text-xs text-gray-400 whitespace-nowrap">{formatDate(r.date)}</span>
      <button onClick={() => startEdit(r)} className="text-gray-300 hover:text-blue-400 flex-shrink-0">
        <Pencil className="w-3.5 h-3.5" />
      </button>
      {confirmDelete === r.id ? (
        <div className="flex gap-1">
          <button onClick={() => deleteRecord(r.id)} className="text-xs text-red-600 hover:underline">Delete</button>
          <button onClick={() => setConfirmDelete(null)} className="text-xs text-gray-500 hover:underline">Cancel</button>
        </div>
      ) : (
        <button onClick={() => setConfirmDelete(r.id)} className="text-gray-300 hover:text-red-400 flex-shrink-0">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  )

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-gray-500">{records.length} personal record{records.length !== 1 ? 's' : ''}</p>
        <button
          onClick={() => { setEditId(null); setShowForm(f => !f) }}
          className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" /> Add Record
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Category</label>
              <select value={form.category} onChange={e => { f('category', e.target.value); f('name', ''); f('unit', '') }}
                className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm">
                <option value="strength">Strength</option>
                <option value="cardio">Cardio</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Exercise / Event</label>
              {form.customName ? (
                <div className="flex gap-1">
                  <input type="text" placeholder="Name" value={form.name} onChange={e => f('name', e.target.value)}
                    className="flex-1 border border-gray-300 rounded px-2 py-1.5 text-sm" required />
                  <button type="button" onClick={() => { f('customName', false); f('name', '') }}
                    className="text-xs text-gray-500 px-1">×</button>
                </div>
              ) : (
                <select value={form.name} onChange={e => {
                  if (e.target.value === '__custom') { f('customName', true); f('name', ''); f('unit', '') }
                  else {
                    const preset = presets.find(p => p.name === e.target.value)
                    f('name', e.target.value)
                    if (preset) f('unit', preset.unit)
                  }
                }} className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm" required>
                  <option value="">Select…</option>
                  {presets.map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
                  <option value="__custom">+ Custom…</option>
                </select>
              )}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Value</label>
              <input type="number" step="0.01" placeholder="100" value={form.value} onChange={e => f('value', e.target.value)}
                className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm" required />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Unit</label>
              <input type="text" placeholder="kg / min / reps" value={form.unit} onChange={e => f('unit', e.target.value)}
                className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm" required />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Date Achieved</label>
              <input type="date" value={form.date} onChange={e => f('date', e.target.value)}
                className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm" required />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
            <input type="text" placeholder="Optional" value={form.notes} onChange={e => f('notes', e.target.value)}
              className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm" />
          </div>
          <div className="flex gap-2 pt-1">
            <button type="submit" className="px-4 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700">
              {editId ? 'Update' : 'Save'}
            </button>
            <button type="button" onClick={() => { setShowForm(false); setEditId(null) }}
              className="px-4 py-1.5 text-sm text-gray-600 hover:text-gray-800">Cancel</button>
          </div>
        </form>
      )}

      {records.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-8">No personal records yet. Add your first PR!</p>
      ) : (
        <div className="space-y-4">
          {strengthRecords.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Strength</h3>
              <div className="space-y-2">
                {strengthRecords.map(r => <RecordCard key={r.id} r={r} />)}
              </div>
            </div>
          )}
          {cardioRecords.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Cardio</h3>
              <div className="space-y-2">
                {cardioRecords.map(r => <RecordCard key={r.id} r={r} />)}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
