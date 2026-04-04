import { useState } from 'react'
import { Pencil, Check, X } from 'lucide-react'
import { useVisionStore } from '../store'

export function ManifestoSection() {
  const { manifesto, saveManifesto } = useVisionStore()
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const [saving, setSaving] = useState(false)

  const startEdit = () => {
    setDraft(manifesto?.content ?? '')
    setEditing(true)
  }

  const handleSave = async () => {
    if (saving) return
    setSaving(true)
    await saveManifesto(draft)
    setSaving(false)
    setEditing(false)
  }

  const formatDate = (iso: string) => {
    const d = new Date(iso)
    return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`
  }

  // Render paragraphs from plain text
  const paragraphs = manifesto?.content.split(/\n\n+/).filter(Boolean) ?? []

  return (
    <div>
      {!editing && manifesto?.content && (
        <div className="flex justify-end mb-3">
          <button onClick={startEdit} className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 border border-gray-200 rounded-md hover:bg-gray-50">
            <Pencil className="w-3.5 h-3.5" /> Edit
          </button>
        </div>
      )}

      {editing ? (
        <div className="space-y-3">
          <textarea
            value={draft}
            onChange={e => setDraft(e.target.value)}
            rows={18}
            placeholder={`Write your personal manifesto here.\n\nSeparate sections with a blank line.\n\nExample:\nI believe that the quality of my life is determined by the quality of my choices. Every day is an opportunity to move closer to the person I want to become.\n\nI refuse to sleepwalk through life. I show up fully — in my work, my relationships, and my commitments to myself.\n\nI embrace discomfort as a signal of growth. The things that challenge me most are the things that shape me most.`}
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-800 leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none font-mono"
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
      ) : manifesto?.content ? (
        <div className="p-6 bg-white border border-gray-200 rounded-xl shadow-sm space-y-4">
          {paragraphs.map((para, i) => (
            <p key={i} className="text-gray-700 text-sm leading-7">
              {para}
            </p>
          ))}
          <p className="text-xs text-gray-400 pt-2 border-t border-gray-100">Last updated {formatDate(manifesto.updatedAt)}</p>
        </div>
      ) : (
        <div className="p-8 border-2 border-dashed border-gray-200 rounded-xl text-center">
          <p className="text-sm text-gray-400 mb-3">You haven't written your manifesto yet.</p>
          <p className="text-xs text-gray-300 mb-4 max-w-sm mx-auto">A manifesto is a declaration of your beliefs, principles, and the kind of life you're committed to living.</p>
          <button onClick={startEdit} className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700">
            Write your manifesto
          </button>
        </div>
      )}
    </div>
  )
}
