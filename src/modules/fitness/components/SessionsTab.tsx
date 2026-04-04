import { useState } from 'react'
import { Trash2, Plus } from 'lucide-react'
import { useFitnessStore } from '../store'
import type { WorkoutType } from '../types'

const WORKOUT_TYPES: WorkoutType[] = [
  'running', 'cycling', 'swimming', 'walking', 'rowing',
  'strength', 'hiit', 'crossfit', 'yoga', 'pilates', 'other',
]

const TYPE_LABELS: Record<WorkoutType, string> = {
  running: 'Running', cycling: 'Cycling', swimming: 'Swimming',
  walking: 'Walking', rowing: 'Rowing', strength: 'Strength',
  hiit: 'HIIT', crossfit: 'CrossFit', yoga: 'Yoga',
  pilates: 'Pilates', other: 'Other',
}

const TYPE_COLORS: Record<WorkoutType, string> = {
  running: 'bg-orange-100 text-orange-700',
  cycling: 'bg-yellow-100 text-yellow-700',
  swimming: 'bg-blue-100 text-blue-700',
  walking: 'bg-green-100 text-green-700',
  rowing: 'bg-teal-100 text-teal-700',
  strength: 'bg-red-100 text-red-700',
  hiit: 'bg-pink-100 text-pink-700',
  crossfit: 'bg-purple-100 text-purple-700',
  yoga: 'bg-indigo-100 text-indigo-700',
  pilates: 'bg-cyan-100 text-cyan-700',
  other: 'bg-gray-100 text-gray-700',
}

const today = () => new Date().toISOString().split('T')[0]

export function SessionsTab() {
  const { sessions, addSession, deleteSession } = useFitnessStore()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    date: today(), type: 'running' as WorkoutType,
    durationMins: '', distanceKm: '', calories: '', avgHr: '', maxHr: '', notes: '',
  })
  const [showMore, setShowMore] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.durationMins) return
    await addSession({
      date: form.date,
      type: form.type,
      durationMins: Number(form.durationMins),
      distanceKm: form.distanceKm ? Number(form.distanceKm) : undefined,
      calories: form.calories ? Number(form.calories) : undefined,
      avgHr: form.avgHr ? Number(form.avgHr) : undefined,
      maxHr: form.maxHr ? Number(form.maxHr) : undefined,
      notes: form.notes || undefined,
    })
    setForm({ date: today(), type: 'running', durationMins: '', distanceKm: '', calories: '', avgHr: '', maxHr: '', notes: '' })
    setShowForm(false)
    setShowMore(false)
  }

  const formatDuration = (mins: number) => {
    const h = Math.floor(mins / 60)
    const m = mins % 60
    return h > 0 ? `${h}h ${m}m` : `${m}m`
  }

  const formatDate = (d: string) => {
    const [y, mo, day] = d.split('-')
    return `${parseInt(mo)}/${parseInt(day)}/${y}`
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-gray-500">{sessions.length} session{sessions.length !== 1 ? 's' : ''} logged</p>
        <button
          onClick={() => setShowForm(f => !f)}
          className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" /> Log Session
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50 space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Date</label>
              <input type="date" value={form.date} onChange={e => set('date', e.target.value)}
                className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm" required />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Type</label>
              <select value={form.type} onChange={e => set('type', e.target.value)}
                className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm">
                {WORKOUT_TYPES.map(t => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Duration (mins)</label>
              <input type="number" placeholder="45" value={form.durationMins} onChange={e => set('durationMins', e.target.value)}
                className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm" min="1" required />
            </div>
          </div>

          <button type="button" onClick={() => setShowMore(m => !m)}
            className="text-xs text-blue-600 hover:underline">
            {showMore ? '− Less fields' : '+ Distance, HR, calories, notes'}
          </button>

          {showMore && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Distance (km)</label>
                <input type="number" step="0.01" placeholder="5.0" value={form.distanceKm} onChange={e => set('distanceKm', e.target.value)}
                  className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Calories</label>
                <input type="number" placeholder="400" value={form.calories} onChange={e => set('calories', e.target.value)}
                  className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Avg HR (bpm)</label>
                <input type="number" placeholder="145" value={form.avgHr} onChange={e => set('avgHr', e.target.value)}
                  className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Max HR (bpm)</label>
                <input type="number" placeholder="175" value={form.maxHr} onChange={e => set('maxHr', e.target.value)}
                  className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm" />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
                <input type="text" placeholder="How did it feel?" value={form.notes} onChange={e => set('notes', e.target.value)}
                  className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm" />
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <button type="submit" className="px-4 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700">Save</button>
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-1.5 text-sm text-gray-600 hover:text-gray-800">Cancel</button>
          </div>
        </form>
      )}

      {sessions.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-8">No sessions logged yet.</p>
      ) : (
        <div className="space-y-2">
          {sessions.map(s => (
            <div key={s.id} className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
              <span className={`mt-0.5 px-2 py-0.5 rounded text-xs font-medium ${TYPE_COLORS[s.type]}`}>
                {TYPE_LABELS[s.type]}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-3">
                  <span className="text-sm font-medium text-gray-900">{formatDuration(s.durationMins)}</span>
                  {s.distanceKm && <span className="text-xs text-gray-500">{s.distanceKm} km</span>}
                  {s.calories && <span className="text-xs text-gray-500">{s.calories} kcal</span>}
                  {s.avgHr && <span className="text-xs text-gray-500">avg {s.avgHr} bpm</span>}
                </div>
                {s.notes && <p className="text-xs text-gray-400 mt-0.5">{s.notes}</p>}
              </div>
              <span className="text-xs text-gray-400 whitespace-nowrap">{formatDate(s.date)}</span>
              {confirmDelete === s.id ? (
                <div className="flex gap-1">
                  <button onClick={() => deleteSession(s.id)} className="text-xs text-red-600 hover:underline">Delete</button>
                  <button onClick={() => setConfirmDelete(null)} className="text-xs text-gray-500 hover:underline">Cancel</button>
                </div>
              ) : (
                <button onClick={() => setConfirmDelete(s.id)} className="text-gray-300 hover:text-red-400 flex-shrink-0">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
