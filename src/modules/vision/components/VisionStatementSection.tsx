import { useState } from 'react'
import { Pencil, Check, X } from 'lucide-react'
import { useVisionStore } from '../store'

export function VisionStatementSection() {
  const { vision, saveVision } = useVisionStore()
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const [saving, setSaving] = useState(false)

  const startEdit = () => { setDraft(vision?.content ?? ''); setEditing(true) }
  const handleSave = async () => {
    if (saving) return
    setSaving(true)
    await saveVision(draft)
    setSaving(false)
    setEditing(false)
  }

  const formatDate = (iso: string) => {
    const d = new Date(iso)
    return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`
  }

  return (
    <div>
      {editing ? (
        <div className="space-y-3">
          <textarea
            value={draft}
            onChange={e => setDraft(e.target.value)}
            rows={5}
            placeholder="E.g. 'To build a life of meaningful work, deep relationships, and continuous growth — while maintaining the freedom to pursue what matters most.'"
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-800 leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            autoFocus
          />
          <div className="flex gap-2">
            <button onClick={handleSave} disabled={saving}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:opacity-50">
              <Check className="w-3.5 h-3.5" /> Save
            </button>
            <button onClick={() => setEditing(false)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800">
              <X className="w-3.5 h-3.5" /> Cancel
            </button>
          </div>
        </div>
      ) : vision?.content ? (
        <div className="relative group p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-xl">
          <p className="text-gray-800 text-base leading-relaxed italic">"{vision.content}"</p>
          <p className="text-xs text-gray-400 mt-4">Last updated {formatDate(vision.updatedAt)}</p>
          <button onClick={startEdit}
            className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 flex items-center gap-1 px-2 py-1 text-xs text-gray-500 bg-white border border-gray-200 rounded hover:bg-gray-50 transition-opacity">
            <Pencil className="w-3 h-3" /> Edit
          </button>
        </div>
      ) : (
        <div className="p-8 border-2 border-dashed border-gray-200 rounded-xl text-center">
          <p className="text-sm text-gray-400 mb-3">You haven't written your vision statement yet.</p>
          <button onClick={startEdit} className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700">
            Write your vision
          </button>
        </div>
      )}
    </div>
  )
}
