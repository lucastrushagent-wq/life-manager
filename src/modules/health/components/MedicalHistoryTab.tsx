import { useState } from 'react'
import { Plus, Pencil, Trash2, X } from 'lucide-react'
import { useHealthStore } from '../store'
import type { MedHistoryCategory, Severity, ConditionStatus, MedicalHistoryEntry } from '../types'

const CATEGORIES: { value: MedHistoryCategory; label: string; color: string }[] = [
  { value: 'condition', label: 'Condition', color: 'bg-red-50 text-red-700 border-red-200' },
  { value: 'surgery', label: 'Surgery', color: 'bg-orange-50 text-orange-700 border-orange-200' },
  { value: 'allergy', label: 'Allergy', color: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  { value: 'family_history', label: 'Family History', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  { value: 'immunization', label: 'Immunization', color: 'bg-green-50 text-green-700 border-green-200' },
  { value: 'other', label: 'Other', color: 'bg-gray-50 text-gray-600 border-gray-200' },
]

const SEVERITIES: Severity[] = ['mild', 'moderate', 'severe']
const STATUSES: ConditionStatus[] = ['active', 'managed', 'resolved']

const EMPTY = { category: 'condition' as MedHistoryCategory, title: '', date: '', notes: '', severity: '' as Severity | '', status: '' as ConditionStatus | '' }

export function MedicalHistoryTab() {
  const { history, addHistory, updateHistory, deleteHistory } = useHealthStore()
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(EMPTY)
  const [filterCat, setFilterCat] = useState<MedHistoryCategory | 'all'>('all')
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  function patchForm(p: Partial<typeof EMPTY>) { setForm(f => ({ ...f, ...p })) }
  function startAdd() { setForm(EMPTY); setEditingId(null); setShowForm(true) }
  function startEdit(e: MedicalHistoryEntry) {
    setForm({ category: e.category, title: e.title, date: e.date ?? '', notes: e.notes ?? '', severity: e.severity ?? '', status: e.status ?? '' })
    setEditingId(e.id); setShowForm(true)
  }
  function cancel() { setShowForm(false); setEditingId(null) }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault()
    if (!form.title.trim()) return
    const data = {
      category: form.category,
      title: form.title.trim(),
      date: form.date || undefined,
      notes: form.notes || undefined,
      severity: (form.severity || undefined) as Severity | undefined,
      status: (form.status || undefined) as ConditionStatus | undefined,
    }
    if (editingId) await updateHistory(editingId, data)
    else await addHistory(data)
    cancel()
  }

  const filtered = filterCat === 'all' ? history : history.filter(h => h.category === filterCat)

  const inputCls = 'text-sm border border-gray-200 rounded px-2 py-1.5 outline-none focus:border-blue-400 w-full'
  const catDef = (cat: MedHistoryCategory) => CATEGORIES.find(c => c.value === cat)!

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-1 flex-wrap">
          <button onClick={() => setFilterCat('all')} className={`px-3 py-1 rounded-full text-xs font-medium ${filterCat === 'all' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>All</button>
          {CATEGORIES.map(c => (
            <button key={c.value} onClick={() => setFilterCat(c.value)} className={`px-3 py-1 rounded-full text-xs font-medium ${filterCat === c.value ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{c.label}</button>
          ))}
        </div>
        {!showForm && (
          <button onClick={startAdd} className="flex items-center gap-1.5 text-sm px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 ml-2 flex-shrink-0">
            <Plus className="w-4 h-4" /> Add
          </button>
        )}
      </div>

      {showForm && (
        <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-800">{editingId ? 'Edit entry' : 'Add entry'}</h3>
            <button onClick={cancel} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
          </div>
          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-3">
            <select className={`${inputCls} bg-white`} value={form.category} onChange={e => patchForm({ category: e.target.value as MedHistoryCategory })}>
              {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
            <input className={inputCls} placeholder="Title *" value={form.title} onChange={e => patchForm({ title: e.target.value })} autoFocus />
            <div>
              <label className="text-xs text-gray-500 block mb-1">Date (when it occurred)</label>
              <input type="date" className={inputCls} value={form.date} onChange={e => patchForm({ date: e.target.value })} />
            </div>
            {(form.category === 'condition' || form.category === 'allergy') && (
              <select className={`${inputCls} bg-white`} value={form.severity} onChange={e => patchForm({ severity: e.target.value as Severity })}>
                <option value="">Severity (optional)</option>
                {SEVERITIES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
              </select>
            )}
            {form.category === 'condition' && (
              <select className={`${inputCls} bg-white`} value={form.status} onChange={e => patchForm({ status: e.target.value as ConditionStatus })}>
                <option value="">Status (optional)</option>
                {STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
              </select>
            )}
            <div className="col-span-2">
              <textarea className={`${inputCls} resize-none`} rows={2} placeholder="Notes" value={form.notes} onChange={e => patchForm({ notes: e.target.value })} />
            </div>
            <div className="col-span-2 flex justify-end gap-2">
              <button type="button" onClick={cancel} className="text-xs px-3 py-1.5 text-gray-500 hover:text-gray-700">Cancel</button>
              <button type="submit" disabled={!form.title.trim()} className="text-xs px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-40">
                {editingId ? 'Save' : 'Add'}
              </button>
            </div>
          </form>
        </div>
      )}

      {filtered.length === 0 && !showForm && (
        <p className="text-sm text-gray-400 text-center py-12">No medical history recorded yet.</p>
      )}

      <div className="space-y-2">
        {filtered.map(entry => {
          const cat = catDef(entry.category)
          return (
            <div key={entry.id} className="flex items-start gap-3 px-4 py-3 rounded-lg border border-gray-200 bg-white">
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full border flex-shrink-0 mt-0.5 ${cat.color}`}>{cat.label}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-gray-800">{entry.title}</span>
                  {entry.severity && <span className={`text-xs px-1.5 py-0.5 rounded ${entry.severity === 'severe' ? 'bg-red-100 text-red-700' : entry.severity === 'moderate' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'}`}>{entry.severity}</span>}
                  {entry.status && <span className={`text-xs px-1.5 py-0.5 rounded ${entry.status === 'active' ? 'bg-red-50 text-red-600' : entry.status === 'managed' ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-600'}`}>{entry.status}</span>}
                  {entry.date && <span className="text-xs text-gray-400">{entry.date}</span>}
                </div>
                {entry.notes && <p className="text-xs text-gray-500 mt-1">{entry.notes}</p>}
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <button onClick={() => startEdit(entry)} className="text-gray-300 hover:text-blue-400"><Pencil className="w-3.5 h-3.5" /></button>
                {confirmDelete === entry.id ? (
                  <span className="flex items-center gap-1 text-xs">
                    <button onClick={() => { deleteHistory(entry.id); setConfirmDelete(null) }} className="text-red-500 font-medium">Yes</button>
                    <button onClick={() => setConfirmDelete(null)} className="text-gray-400">No</button>
                  </span>
                ) : (
                  <button onClick={() => setConfirmDelete(entry.id)} className="text-gray-300 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
