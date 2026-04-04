import { useState } from 'react'
import { Trash2, Plus, ChevronDown, ChevronUp } from 'lucide-react'
import { useFitnessStore } from '../store'

const COMMON_EXERCISES = [
  'Bench Press', 'Squat', 'Deadlift', 'Overhead Press', 'Barbell Row',
  'Pull-up', 'Chin-up', 'Dumbbell Curl', 'Tricep Dip', 'Lat Pulldown',
  'Leg Press', 'Romanian Deadlift', 'Hip Thrust', 'Incline Press',
  'Cable Row', 'Face Pull', 'Lateral Raise', 'Calf Raise',
]

const today = () => new Date().toISOString().split('T')[0]

const formatDate = (d: string) => {
  const [y, mo, day] = d.split('-')
  return `${parseInt(mo)}/${parseInt(day)}/${y}`
}

export function StrengthTab() {
  const { sets, addSet, deleteSet } = useFitnessStore()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    date: today(), exercise: '', sets: '', reps: '', weightKg: '', notes: '',
  })
  const [customExercise, setCustomExercise] = useState(false)
  const [expandedExercise, setExpandedExercise] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const f = (k: string, v: string) => setForm(prev => ({ ...prev, [k]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.exercise || !form.sets || !form.reps) return
    await addSet({
      date: form.date,
      exercise: form.exercise,
      sets: Number(form.sets),
      reps: Number(form.reps),
      weightKg: form.weightKg ? Number(form.weightKg) : undefined,
      notes: form.notes || undefined,
    })
    setForm({ date: today(), exercise: '', sets: '', reps: '', weightKg: '', notes: '' })
    setShowForm(false)
    setCustomExercise(false)
  }

  // Group by exercise name
  const byExercise = sets.reduce<Record<string, typeof sets>>((acc, s) => {
    acc[s.exercise] = acc[s.exercise] ?? []
    acc[s.exercise].push(s)
    return acc
  }, {})

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-gray-500">{sets.length} set{sets.length !== 1 ? 's' : ''} logged</p>
        <button
          onClick={() => setShowForm(f => !f)}
          className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" /> Log Sets
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Date</label>
              <input type="date" value={form.date} onChange={e => f('date', e.target.value)}
                className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm" required />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Exercise</label>
              {customExercise ? (
                <div className="flex gap-1">
                  <input type="text" placeholder="Exercise name" value={form.exercise} onChange={e => f('exercise', e.target.value)}
                    className="flex-1 border border-gray-300 rounded px-2 py-1.5 text-sm" required />
                  <button type="button" onClick={() => { setCustomExercise(false); f('exercise', '') }}
                    className="text-xs text-gray-500 hover:text-gray-700 px-1">×</button>
                </div>
              ) : (
                <select value={form.exercise} onChange={e => {
                  if (e.target.value === '__custom') { setCustomExercise(true); f('exercise', '') }
                  else f('exercise', e.target.value)
                }} className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm" required>
                  <option value="">Select…</option>
                  {COMMON_EXERCISES.map(ex => <option key={ex} value={ex}>{ex}</option>)}
                  <option value="__custom">+ Custom…</option>
                </select>
              )}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Sets</label>
              <input type="number" placeholder="3" value={form.sets} onChange={e => f('sets', e.target.value)}
                className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm" min="1" required />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Reps</label>
              <input type="number" placeholder="8" value={form.reps} onChange={e => f('reps', e.target.value)}
                className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm" min="1" required />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Weight (kg)</label>
              <input type="number" step="0.5" placeholder="80" value={form.weightKg} onChange={e => f('weightKg', e.target.value)}
                className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
            <input type="text" placeholder="Optional" value={form.notes} onChange={e => f('notes', e.target.value)}
              className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm" />
          </div>
          <div className="flex gap-2 pt-1">
            <button type="submit" className="px-4 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700">Save</button>
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-1.5 text-sm text-gray-600 hover:text-gray-800">Cancel</button>
          </div>
        </form>
      )}

      {Object.keys(byExercise).length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-8">No strength sets logged yet.</p>
      ) : (
        <div className="space-y-2">
          {Object.entries(byExercise).map(([exercise, exSets]) => {
            const latest = exSets[0]
            const isOpen = expandedExercise === exercise
            return (
              <div key={exercise} className="border border-gray-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => setExpandedExercise(isOpen ? null : exercise)}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 text-left"
                >
                  <div className="flex items-baseline gap-3">
                    <span className="text-sm font-medium text-gray-900">{exercise}</span>
                    <span className="text-xs text-gray-400">{exSets.length} log{exSets.length !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-500">
                      Last: {latest.sets}×{latest.reps}{latest.weightKg ? ` @ ${latest.weightKg}kg` : ''} — {formatDate(latest.date)}
                    </span>
                    {isOpen ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                  </div>
                </button>
                {isOpen && (
                  <div className="border-t border-gray-100 divide-y divide-gray-100">
                    {exSets.map(s => (
                      <div key={s.id} className="flex items-center px-4 py-2 bg-gray-50">
                        <span className="text-xs text-gray-400 w-20">{formatDate(s.date)}</span>
                        <span className="text-sm text-gray-700 flex-1">
                          {s.sets} sets × {s.reps} reps{s.weightKg ? ` @ ${s.weightKg} kg` : ''}
                        </span>
                        {s.notes && <span className="text-xs text-gray-400 mr-3">{s.notes}</span>}
                        {confirmDelete === s.id ? (
                          <div className="flex gap-1">
                            <button onClick={() => deleteSet(s.id)} className="text-xs text-red-600 hover:underline">Delete</button>
                            <button onClick={() => setConfirmDelete(null)} className="text-xs text-gray-500 hover:underline">Cancel</button>
                          </div>
                        ) : (
                          <button onClick={() => setConfirmDelete(s.id)} className="text-gray-300 hover:text-red-400">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
