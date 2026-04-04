import { useState } from 'react'
import { Plus, Trash2, AlertTriangle } from 'lucide-react'
import { useHealthStore } from '../store'

const COMMON_MARKERS = [
  { value: 'total_cholesterol', label: 'Total Cholesterol', unit: 'mg/dL', refMin: undefined, refMax: 200 },
  { value: 'ldl', label: 'LDL', unit: 'mg/dL', refMin: undefined, refMax: 100 },
  { value: 'hdl', label: 'HDL', unit: 'mg/dL', refMin: 40, refMax: undefined },
  { value: 'triglycerides', label: 'Triglycerides', unit: 'mg/dL', refMin: undefined, refMax: 150 },
  { value: 'glucose', label: 'Glucose', unit: 'mg/dL', refMin: 70, refMax: 99 },
  { value: 'hba1c', label: 'HbA1c', unit: '%', refMin: undefined, refMax: 5.7 },
  { value: 'tsh', label: 'TSH', unit: 'mIU/L', refMin: 0.4, refMax: 4.0 },
  { value: 'hemoglobin', label: 'Hemoglobin', unit: 'g/dL', refMin: 13.5, refMax: 17.5 },
  { value: 'wbc', label: 'WBC', unit: '10³/µL', refMin: 4.5, refMax: 11.0 },
  { value: 'creatinine', label: 'Creatinine', unit: 'mg/dL', refMin: 0.7, refMax: 1.3 },
  { value: 'vitamin_d', label: 'Vitamin D', unit: 'ng/mL', refMin: 20, refMax: 50 },
  { value: 'ferritin', label: 'Ferritin', unit: 'ng/mL', refMin: 12, refMax: 300 },
  { value: 'custom', label: 'Custom…', unit: '', refMin: undefined, refMax: undefined },
]

function todayStr() {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function isOutOfRange(value: number, min?: number | null, max?: number | null) {
  if (min != null && value < min) return true
  if (max != null && value > max) return true
  return false
}

export function BloodWorkTab() {
  const { bloodWork, addBloodWork, deleteBloodWork } = useHealthStore()
  const [selectedMarker, setSelectedMarker] = useState('total_cholesterol')
  const [customMarker, setCustomMarker] = useState('')
  const [value, setValue] = useState('')
  const [unit, setUnit] = useState('mg/dL')
  const [refMin, setRefMin] = useState('')
  const [refMax, setRefMax] = useState('')
  const [testDate, setTestDate] = useState(todayStr())
  const [notes, setNotes] = useState('')

  const markerDef = COMMON_MARKERS.find(m => m.value === selectedMarker)

  function handleMarkerChange(v: string) {
    setSelectedMarker(v)
    if (v !== 'custom') {
      const def = COMMON_MARKERS.find(m => m.value === v)!
      setUnit(def.unit)
      setRefMin(def.refMin != null ? String(def.refMin) : '')
      setRefMax(def.refMax != null ? String(def.refMax) : '')
    }
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    const markerName = selectedMarker === 'custom' ? customMarker.trim() : (markerDef?.label ?? selectedMarker)
    if (!markerName || !value || !testDate) return
    await addBloodWork({
      testDate,
      marker: markerName,
      value: parseFloat(value),
      unit,
      referenceMin: refMin ? parseFloat(refMin) : undefined,
      referenceMax: refMax ? parseFloat(refMax) : undefined,
      notes: notes.trim() || undefined,
    })
    setValue('')
    setNotes('')
  }

  // Group by test date
  const byDate = Array.from(new Set(bloodWork.map(b => b.testDate))).sort((a, b) => b.localeCompare(a))

  const inputCls = 'text-sm border border-gray-200 rounded px-2 py-1.5 outline-none focus:border-blue-400'

  return (
    <div>
      <form onSubmit={handleAdd} className="rounded-lg border border-gray-200 bg-gray-50 p-4 mb-6">
        <div className="flex flex-wrap gap-2 mb-2">
          <select className={`${inputCls} bg-white`} value={selectedMarker} onChange={e => handleMarkerChange(e.target.value)}>
            {COMMON_MARKERS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
          {selectedMarker === 'custom' && (
            <input className={inputCls} placeholder="Marker name" value={customMarker} onChange={e => setCustomMarker(e.target.value)} />
          )}
          <input type="number" step="any" className={`${inputCls} w-24`} placeholder="Value" value={value} onChange={e => setValue(e.target.value)} />
          <input className={`${inputCls} w-24`} placeholder="Unit" value={unit} onChange={e => setUnit(e.target.value)} />
          <input type="date" className={inputCls} value={testDate} onChange={e => setTestDate(e.target.value)} />
        </div>
        <div className="flex flex-wrap gap-2">
          <input type="number" step="any" className={`${inputCls} w-28`} placeholder="Ref min" value={refMin} onChange={e => setRefMin(e.target.value)} />
          <input type="number" step="any" className={`${inputCls} w-28`} placeholder="Ref max" value={refMax} onChange={e => setRefMax(e.target.value)} />
          <input className={`${inputCls} flex-1`} placeholder="Notes (optional)" value={notes} onChange={e => setNotes(e.target.value)} />
          <button type="submit" disabled={!value} className="flex items-center gap-1 text-sm px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-40">
            <Plus className="w-4 h-4" /> Add
          </button>
        </div>
      </form>

      {byDate.length === 0 && (
        <p className="text-sm text-gray-400 text-center py-12">No blood work logged yet.</p>
      )}

      {byDate.map(date => {
        const entries = bloodWork.filter(b => b.testDate === date)
        const flagged = entries.filter(b => isOutOfRange(b.value, b.referenceMin, b.referenceMax))
        return (
          <div key={date} className="mb-6 rounded-lg border border-gray-200 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 border-b border-gray-200">
              <span className="text-sm font-semibold text-gray-700">{date}</span>
              {flagged.length > 0 && (
                <span className="flex items-center gap-1 text-xs text-amber-600">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  {flagged.length} out of range
                </span>
              )}
            </div>
            {entries.map((b, i) => {
              const oor = isOutOfRange(b.value, b.referenceMin, b.referenceMax)
              return (
                <div key={b.id} className={`flex items-center gap-3 px-4 py-2.5 bg-white text-sm ${i < entries.length - 1 ? 'border-b border-gray-100' : ''}`}>
                  <div className="flex-1">
                    <span className="font-medium text-gray-800">{b.marker}</span>
                    {b.notes && <span className="ml-2 text-xs text-gray-400 italic">{b.notes}</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`font-semibold ${oor ? 'text-red-600' : 'text-gray-800'}`}>
                      {b.value} {b.unit}
                    </span>
                    {(b.referenceMin != null || b.referenceMax != null) && (
                      <span className="text-xs text-gray-400">
                        ({b.referenceMin != null ? `≥${b.referenceMin}` : ''}{b.referenceMin != null && b.referenceMax != null ? ' ' : ''}{b.referenceMax != null ? `≤${b.referenceMax}` : ''})
                      </span>
                    )}
                    {oor && <AlertTriangle className="w-3.5 h-3.5 text-red-500" />}
                  </div>
                  <button onClick={() => deleteBloodWork(b.id)} className="text-gray-300 hover:text-red-400">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )
            })}
          </div>
        )
      })}
    </div>
  )
}
