import { useState } from 'react'
import { Plus, Trash2, Pencil, Check, X, GripVertical } from 'lucide-react'
import { useVisionStore } from '../store'
import type { CoreValue } from '../types'

export function CoreValuesTab() {
  const { values, addValue, updateValue, deleteValue } = useVisionStore()
  const [showForm, setShowForm] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [editId, setEditId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editDesc, setEditDesc] = useState('')
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newName.trim()) return
    await addValue({ name: newName.trim(), description: newDesc.trim() || undefined })
    setNewName('')
    setNewDesc('')
    setShowForm(false)
  }

  const startEdit = (v: CoreValue) => {
    setEditId(v.id)
    setEditName(v.name)
    setEditDesc(v.description ?? '')
  }

  const handleUpdate = async (id: string) => {
    await updateValue(id, { name: editName.trim(), description: editDesc.trim() || undefined })
    setEditId(null)
  }

  const moveUp = async (idx: number) => {
    if (idx === 0) return
    const a = values[idx], b = values[idx - 1]
    await Promise.all([
      updateValue(a.id, { sortOrder: b.sortOrder }),
      updateValue(b.id, { sortOrder: a.sortOrder }),
    ])
  }

  const moveDown = async (idx: number) => {
    if (idx === values.length - 1) return
    const a = values[idx], b = values[idx + 1]
    await Promise.all([
      updateValue(a.id, { sortOrder: b.sortOrder }),
      updateValue(b.id, { sortOrder: a.sortOrder }),
    ])
  }

  return (
    <div className="max-w-3xl">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-base font-semibold text-gray-800">Core Values</h2>
          <p className="text-xs text-gray-400 mt-0.5">The principles that guide every decision you make.</p>
        </div>
        <button onClick={() => setShowForm(f => !f)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700">
          <Plus className="w-4 h-4" /> Add Value
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleAdd} className="mb-5 p-4 border border-gray-200 rounded-lg bg-gray-50 space-y-2">
          <input
            type="text" placeholder="Value name (e.g. Integrity, Growth, Family)"
            value={newName} onChange={e => setNewName(e.target.value)}
            className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus required
          />
          <textarea
            placeholder="What this value means to you (optional)"
            value={newDesc} onChange={e => setNewDesc(e.target.value)}
            rows={2}
            className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="flex gap-2">
            <button type="submit" className="px-4 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700">Add</button>
            <button type="button" onClick={() => setShowForm(false)} className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800">Cancel</button>
          </div>
        </form>
      )}

      {values.length === 0 ? (
        <div className="p-8 border-2 border-dashed border-gray-200 rounded-xl text-center">
          <p className="text-sm text-gray-400">No core values defined yet. Add the principles that guide your life.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {values.map((v, idx) => (
            <div key={v.id} className="border border-gray-200 rounded-lg bg-white">
              {editId === v.id ? (
                <div className="p-3 space-y-2">
                  <input value={editName} onChange={e => setEditName(e.target.value)}
                    className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                    autoFocus />
                  <textarea value={editDesc} onChange={e => setEditDesc(e.target.value)} rows={2}
                    className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Description (optional)" />
                  <div className="flex gap-2">
                    <button onClick={() => handleUpdate(v.id)}
                      className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700">
                      <Check className="w-3 h-3" /> Save
                    </button>
                    <button onClick={() => setEditId(null)}
                      className="flex items-center gap-1 px-2 py-1 text-xs text-gray-500 hover:text-gray-700">
                      <X className="w-3 h-3" /> Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-3 p-3.5">
                  <div className="flex flex-col gap-0.5 mt-0.5">
                    <button onClick={() => moveUp(idx)} disabled={idx === 0}
                      className="text-gray-300 hover:text-gray-500 disabled:opacity-20 leading-none text-xs">▲</button>
                    <button onClick={() => moveDown(idx)} disabled={idx === values.length - 1}
                      className="text-gray-300 hover:text-gray-500 disabled:opacity-20 leading-none text-xs">▼</button>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900">{v.name}</p>
                    {v.description && <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{v.description}</p>}
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button onClick={() => startEdit(v)} className="text-gray-300 hover:text-blue-400">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    {confirmDelete === v.id ? (
                      <div className="flex gap-1">
                        <button onClick={() => deleteValue(v.id)} className="text-xs text-red-600 hover:underline">Delete</button>
                        <button onClick={() => setConfirmDelete(null)} className="text-xs text-gray-500 hover:underline">Cancel</button>
                      </div>
                    ) : (
                      <button onClick={() => setConfirmDelete(v.id)} className="text-gray-300 hover:text-red-400">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
