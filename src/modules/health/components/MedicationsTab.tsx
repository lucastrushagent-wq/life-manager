import { useState } from 'react'
import { Plus, Pencil, Trash2, X, AlertTriangle } from 'lucide-react'
import { useHealthStore } from '../store'
import type { Medication } from '../types'

function todayStr() {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function daysUntilRefill(refillDate?: string): number | null {
  if (!refillDate) return null
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const [y, m, d] = refillDate.split('-').map(Number)
  const refill = new Date(y, m - 1, d)
  return Math.ceil((refill.getTime() - today.getTime()) / 86_400_000)
}

const EMPTY: Omit<Medication, 'id' | 'active' | 'createdAt'> = {
  name: '', dose: '', frequency: '', purpose: '', startDate: '', refillDate: '', notes: '',
}

export function MedicationsTab() {
  const { medications, addMedication, updateMedication, deleteMedication } = useHealthStore()
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(EMPTY)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  function patchForm(p: Partial<typeof EMPTY>) { setForm(f => ({ ...f, ...p })) }

  function startAdd() { setForm(EMPTY); setEditingId(null); setShowForm(true) }
  function startEdit(med: Medication) {
    setForm({ name: med.name, dose: med.dose, frequency: med.frequency, purpose: med.purpose ?? '', startDate: med.startDate ?? '', refillDate: med.refillDate ?? '', notes: med.notes ?? '' })
    setEditingId(med.id); setShowForm(true)
  }
  function cancel() { setShowForm(false); setEditingId(null) }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim() || !form.dose.trim() || !form.frequency.trim()) return
    const data = { ...form, purpose: form.purpose || undefined, startDate: form.startDate || undefined, refillDate: form.refillDate || undefined, notes: form.notes || undefined }
    if (editingId) await updateMedication(editingId, data)
    else await addMedication(data)
    cancel()
  }

  const active = medications.filter(m => m.active)
  const inactive = medications.filter(m => !m.active)

  const inputCls = 'text-sm border border-gray-200 rounded px-2 py-1.5 outline-none focus:border-blue-400 w-full'

  return (
    <div>
      {!showForm && (
        <button onClick={startAdd} className="flex items-center gap-1.5 text-sm px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 mb-6">
          <Plus className="w-4 h-4" /> Add medication
        </button>
      )}

      {showForm && (
        <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-800">{editingId ? 'Edit medication' : 'Add medication'}</h3>
            <button onClick={cancel} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
          </div>
          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-3">
            <input className={inputCls} placeholder="Medication name *" value={form.name} onChange={e => patchForm({ name: e.target.value })} autoFocus />
            <input className={inputCls} placeholder="Dose (e.g. 10mg) *" value={form.dose} onChange={e => patchForm({ dose: e.target.value })} />
            <input className={inputCls} placeholder="Frequency (e.g. Once daily) *" value={form.frequency} onChange={e => patchForm({ frequency: e.target.value })} />
            <input className={inputCls} placeholder="Purpose" value={form.purpose} onChange={e => patchForm({ purpose: e.target.value })} />
            <div>
              <label className="text-xs text-gray-500 block mb-1">Start date</label>
              <input type="date" className={inputCls} value={form.startDate} onChange={e => patchForm({ startDate: e.target.value })} />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Refill date</label>
              <input type="date" className={inputCls} value={form.refillDate} onChange={e => patchForm({ refillDate: e.target.value })} />
            </div>
            <div className="col-span-2">
              <input className={inputCls} placeholder="Notes" value={form.notes} onChange={e => patchForm({ notes: e.target.value })} />
            </div>
            <div className="col-span-2 flex justify-end gap-2">
              <button type="button" onClick={cancel} className="text-xs px-3 py-1.5 text-gray-500 hover:text-gray-700">Cancel</button>
              <button type="submit" disabled={!form.name || !form.dose || !form.frequency} className="text-xs px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-40">
                {editingId ? 'Save' : 'Add'}
              </button>
            </div>
          </form>
        </div>
      )}

      {medications.length === 0 && !showForm && (
        <p className="text-sm text-gray-400 text-center py-12">No medications added yet.</p>
      )}

      {active.length > 0 && (
        <div className="mb-6">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-3">Active</h3>
          <div className="rounded-lg border border-gray-200 overflow-hidden">
            {active.map((med, i) => {
              const days = daysUntilRefill(med.refillDate)
              const refillSoon = days != null && days <= 7
              return (
                <div key={med.id} className={`flex items-start justify-between px-4 py-3 bg-white text-sm ${i < active.length - 1 ? 'border-b border-gray-100' : ''}`}>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-gray-800">{med.name}</span>
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{med.dose}</span>
                      <span className="text-xs text-gray-500">{med.frequency}</span>
                      {refillSoon && (
                        <span className="flex items-center gap-0.5 text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                          <AlertTriangle className="w-3 h-3" />
                          Refill {days === 0 ? 'today' : `in ${days}d`}
                        </span>
                      )}
                    </div>
                    {med.purpose && <div className="text-xs text-gray-400 mt-0.5">{med.purpose}</div>}
                    {med.notes && <div className="text-xs text-gray-400 italic mt-0.5">{med.notes}</div>}
                    {med.refillDate && !refillSoon && <div className="text-xs text-gray-400 mt-0.5">Refill: {med.refillDate}</div>}
                  </div>
                  <div className="flex items-center gap-2 ml-3 mt-0.5">
                    <button onClick={() => updateMedication(med.id, { active: false })} className="text-xs text-gray-400 hover:text-gray-600">Deactivate</button>
                    <button onClick={() => startEdit(med)} className="text-gray-300 hover:text-blue-400"><Pencil className="w-3.5 h-3.5" /></button>
                    {confirmDelete === med.id ? (
                      <span className="flex items-center gap-1 text-xs">
                        <button onClick={() => { deleteMedication(med.id); setConfirmDelete(null) }} className="text-red-500 font-medium">Yes</button>
                        <button onClick={() => setConfirmDelete(null)} className="text-gray-400">No</button>
                      </span>
                    ) : (
                      <button onClick={() => setConfirmDelete(med.id)} className="text-gray-300 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {inactive.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">Inactive / Past</h3>
          <div className="rounded-lg border border-gray-100 overflow-hidden">
            {inactive.map((med, i) => (
              <div key={med.id} className={`flex items-center justify-between px-4 py-3 bg-gray-50 text-sm ${i < inactive.length - 1 ? 'border-b border-gray-100' : ''}`}>
                <div>
                  <span className="text-gray-500">{med.name}</span>
                  <span className="ml-2 text-xs text-gray-400">{med.dose} — {med.frequency}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => updateMedication(med.id, { active: true })} className="text-xs text-blue-500 hover:text-blue-700">Reactivate</button>
                  <button onClick={() => deleteMedication(med.id)} className="text-gray-300 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
