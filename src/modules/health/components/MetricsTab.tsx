import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { useHealthStore } from '../store'
import type { MetricCategory, HealthMetric } from '../types'

const BODY_METRICS: { value: BodyMetricDef; label: string; unit: string }[] = [
  { value: 'weight', label: 'Weight', unit: 'lbs' },
  { value: 'body_fat', label: 'Body Fat', unit: '%' },
  { value: 'bmi', label: 'BMI', unit: '' },
  { value: 'muscle_mass', label: 'Muscle Mass', unit: 'lbs' },
  { value: 'hydration', label: 'Hydration', unit: '%' },
]
type BodyMetricDef = 'weight' | 'body_fat' | 'bmi' | 'muscle_mass' | 'hydration'

const ACTIVITY_METRICS: { value: ActivityMetricDef; label: string; unit: string }[] = [
  { value: 'steps', label: 'Steps', unit: 'steps' },
  { value: 'resting_hr', label: 'Resting HR', unit: 'bpm' },
  { value: 'sleep_hours', label: 'Sleep', unit: 'hrs' },
  { value: 'active_minutes', label: 'Active Minutes', unit: 'min' },
  { value: 'vo2_max', label: 'VO2 Max', unit: 'ml/kg/min' },
  { value: 'stress', label: 'Stress Score', unit: '' },
]
type ActivityMetricDef = 'steps' | 'resting_hr' | 'sleep_hours' | 'active_minutes' | 'vo2_max' | 'stress'

function todayStr() {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function MiniChart({ entries }: { entries: { date: string; value: number }[] }) {
  if (entries.length < 2) return null
  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date)).slice(-20)
  const W = 200, H = 48
  const vals = sorted.map(e => e.value)
  const min = Math.min(...vals), max = Math.max(...vals)
  const range = max - min || 1
  const xPos = (i: number) => (i / (sorted.length - 1)) * W
  const yPos = (v: number) => H - ((v - min) / range) * H
  const points = sorted.map((e, i) => `${xPos(i)},${yPos(e.value)}`).join(' ')
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: H }}>
      <polyline points={points} fill="none" stroke="#3b82f6" strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={xPos(sorted.length - 1)} cy={yPos(sorted[sorted.length - 1].value)} r={3} fill="#3b82f6" />
    </svg>
  )
}

export function MetricsTab({ category }: { category: MetricCategory }) {
  const { metrics, addMetric, deleteMetric } = useHealthStore()
  const [metric, setMetric] = useState<HealthMetric>(category === 'body' ? 'weight' : 'steps')
  const [value, setValue] = useState('')
  const [date, setDate] = useState(todayStr())
  const [notes, setNotes] = useState('')

  const metricDefs = category === 'body' ? BODY_METRICS : ACTIVITY_METRICS
  const currentDef = metricDefs.find(m => m.value === metric)!
  const filtered = metrics.filter(m => m.category === category)

  // Group by metric for display
  const byMetric = metricDefs.map(def => ({
    def,
    entries: filtered.filter(m => m.metric === def.value).sort((a, b) => b.date.localeCompare(a.date)),
  })).filter(g => g.entries.length > 0)

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!value || !date) return
    await addMetric({
      date,
      category,
      metric: metric as HealthMetric,
      value: parseFloat(value),
      unit: currentDef.unit,
      notes: notes.trim() || undefined,
    })
    setValue('')
    setNotes('')
  }

  const inputCls = 'text-sm border border-gray-200 rounded px-2 py-1.5 outline-none focus:border-blue-400'

  return (
    <div>
      <form onSubmit={handleAdd} className="flex items-center gap-2 mb-6 flex-wrap">
        <select className={`${inputCls} bg-white`} value={metric} onChange={e => setMetric(e.target.value as HealthMetric)}>
          {metricDefs.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
        </select>
        <input type="number" step="any" className={`${inputCls} w-24`} placeholder={currentDef.unit || 'Value'} value={value} onChange={e => setValue(e.target.value)} />
        {currentDef.unit && <span className="text-sm text-gray-400">{currentDef.unit}</span>}
        <input type="date" className={inputCls} value={date} onChange={e => setDate(e.target.value)} />
        <input className={`${inputCls} w-36`} placeholder="Notes (optional)" value={notes} onChange={e => setNotes(e.target.value)} />
        <button type="submit" disabled={!value} className="flex items-center gap-1 text-sm px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-40">
          <Plus className="w-4 h-4" /> Log
        </button>
      </form>

      {byMetric.length === 0 && (
        <p className="text-sm text-gray-400 text-center py-12">No {category} data yet. Log a reading above.</p>
      )}

      <div className="grid grid-cols-2 gap-4">
        {byMetric.map(({ def, entries }) => {
          const latest = entries[0]
          return (
            <div key={def.value} className="rounded-lg border border-gray-200 p-4">
              <div className="flex items-baseline justify-between mb-1">
                <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">{def.label}</span>
                <span className="text-xl font-bold text-gray-900">{latest.value}<span className="text-sm font-normal text-gray-400 ml-1">{def.unit}</span></span>
              </div>
              <div className="text-xs text-gray-400 mb-3">{latest.date}</div>
              <MiniChart entries={entries.map(e => ({ date: e.date, value: e.value }))} />
              <div className="mt-3 space-y-1 max-h-32 overflow-y-auto">
                {entries.map(e => (
                  <div key={e.id} className="flex items-center justify-between text-xs text-gray-500">
                    <span>{e.date}</span>
                    <span className="font-medium text-gray-700">{e.value} {def.unit}</span>
                    {e.notes && <span className="italic text-gray-400 truncate max-w-20">{e.notes}</span>}
                    <button onClick={() => deleteMetric(e.id)} className="text-gray-300 hover:text-red-400 ml-1">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
