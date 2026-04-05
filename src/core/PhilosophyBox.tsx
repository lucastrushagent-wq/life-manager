import { useEffect, useRef, useState } from 'react'
import { Pencil, Check, X } from 'lucide-react'

interface Props {
  moduleId: string
}

export function PhilosophyBox({ moduleId }: Props) {
  const [content, setContent] = useState('')
  const [draft, setDraft] = useState('')
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    fetch(`/api/philosophy/${moduleId}`)
      .then(r => r.json())
      .then(data => setContent(data.content ?? ''))
      .catch(() => {})
  }, [moduleId])

  function startEdit() {
    setDraft(content)
    setEditing(true)
    setTimeout(() => textareaRef.current?.focus(), 0)
  }

  function cancel() {
    setEditing(false)
  }

  async function save() {
    setSaving(true)
    try {
      const res = await fetch(`/api/philosophy/${moduleId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: draft }),
      })
      const data = await res.json()
      setContent(data.content)
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') cancel()
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) save()
  }

  if (editing) {
    return (
      <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50/50 p-4">
        <p className="text-xs font-medium text-blue-600 uppercase tracking-wide mb-2">My Philosophy</p>
        <textarea
          ref={textareaRef}
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={4}
          placeholder="Write your personal philosophy for this module — your values, guiding principles, and how you want to approach this area of life…"
          className="w-full text-sm text-gray-700 bg-transparent border-none outline-none resize-none placeholder:text-gray-400"
        />
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-blue-200">
          <p className="text-xs text-blue-400">⌘↵ to save · Esc to cancel</p>
          <div className="flex gap-2">
            <button
              onClick={cancel}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded hover:bg-white/60 transition-colors"
            >
              <X className="w-3.5 h-3.5" /> Cancel
            </button>
            <button
              onClick={save}
              disabled={saving}
              className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium px-2 py-1 rounded hover:bg-white/60 transition-colors disabled:opacity-50"
            >
              <Check className="w-3.5 h-3.5" /> Save
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!content) {
    return (
      <button
        onClick={startEdit}
        className="mb-6 w-full text-left rounded-lg border border-dashed border-gray-200 px-4 py-3 group hover:border-gray-300 hover:bg-gray-50 transition-colors"
      >
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-0.5 group-hover:text-gray-500">My Philosophy</p>
        <p className="text-sm text-gray-300 italic group-hover:text-gray-400">Add your personal philosophy for this module…</p>
      </button>
    )
  }

  return (
    <div className="mb-6 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 group relative">
      <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">My Philosophy</p>
      <p className="text-sm text-gray-600 whitespace-pre-wrap">{content}</p>
      <button
        onClick={startEdit}
        className="absolute top-3 right-3 text-gray-300 hover:text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity"
        title="Edit philosophy"
      >
        <Pencil className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}
