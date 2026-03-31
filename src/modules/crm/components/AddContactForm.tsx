import { useState, KeyboardEvent } from 'react'
import { Plus, X } from 'lucide-react'
import { z } from 'zod'
import { CreateContactSchema } from '../schema'

const FOLLOW_UP_OPTIONS = [
  { label: 'No reminder', value: '' },
  { label: 'Weekly', value: '7' },
  { label: 'Bi-weekly', value: '14' },
  { label: 'Monthly', value: '30' },
  { label: 'Quarterly', value: '90' },
  { label: 'Half-yearly', value: '182' },
  { label: 'Yearly', value: '365' },
]

interface Props {
  onAdd: (input: z.infer<typeof CreateContactSchema>) => void
  onCancel: () => void
}

export function AddContactForm({ onAdd, onCancel }: Props) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [company, setCompany] = useState('')
  const [role, setRole] = useState('')
  const [followUpDays, setFollowUpDays] = useState('')
  const [notes, setNotes] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')

  function addTag() {
    const tag = tagInput.trim().replace(/,$/, '')
    if (tag && !tags.includes(tag)) setTags(prev => [...prev, tag])
    setTagInput('')
  }

  function handleTagKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag() }
  }

  function handleSubmit() {
    if (!name.trim()) return
    onAdd({
      name: name.trim(),
      email: email.trim() || undefined,
      phone: phone.trim() || undefined,
      company: company.trim() || undefined,
      role: role.trim() || undefined,
      relationship: tags,
      followUpDays: followUpDays ? parseInt(followUpDays) : undefined,
      notes: notes.trim() || undefined,
    })
  }

  return (
    <div className="bg-white border border-blue-200 rounded-lg p-4 mb-4 shadow-sm">
      <div className="grid grid-cols-2 gap-3 mb-3">
        <input autoFocus type="text" placeholder="Name *" value={name} onChange={e => setName(e.target.value)}
          className="text-sm border border-gray-200 rounded px-2 py-1.5 outline-none focus:border-blue-400 col-span-2" />
        <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)}
          className="text-sm border border-gray-200 rounded px-2 py-1.5 outline-none focus:border-blue-400" />
        <input type="tel" placeholder="Phone" value={phone} onChange={e => setPhone(e.target.value)}
          className="text-sm border border-gray-200 rounded px-2 py-1.5 outline-none focus:border-blue-400" />
        <input type="text" placeholder="Company" value={company} onChange={e => setCompany(e.target.value)}
          className="text-sm border border-gray-200 rounded px-2 py-1.5 outline-none focus:border-blue-400" />
        <input type="text" placeholder="Current Role" value={role} onChange={e => setRole(e.target.value)}
          className="text-sm border border-gray-200 rounded px-2 py-1.5 outline-none focus:border-blue-400" />
        <select value={followUpDays} onChange={e => setFollowUpDays(e.target.value)}
          className="text-sm border border-gray-200 rounded px-2 py-1.5 outline-none focus:border-blue-400 bg-white text-gray-600">
          {FOLLOW_UP_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      <div className="mb-3">
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-1.5">
            {tags.map(tag => (
              <span key={tag} className="flex items-center gap-1 bg-purple-50 text-purple-700 text-xs px-2 py-0.5 rounded-full">
                {tag}
                <button onClick={() => setTags(tags.filter(t => t !== tag))}><X className="w-3 h-3" /></button>
              </span>
            ))}
          </div>
        )}
        <input type="text" placeholder="Add relationship tag, press Enter (e.g. investor, mentor)"
          value={tagInput} onChange={e => setTagInput(e.target.value)}
          onKeyDown={handleTagKeyDown} onBlur={addTag}
          className="text-sm border border-gray-200 rounded px-2 py-1.5 w-full outline-none focus:border-blue-400 placeholder-gray-400" />
      </div>

      <textarea placeholder="Notes (optional)" value={notes} onChange={e => setNotes(e.target.value)} rows={2}
        className="w-full text-sm border border-gray-200 rounded px-2 py-1.5 outline-none focus:border-blue-400 resize-none placeholder-gray-400 mb-3" />

      <div className="flex justify-end gap-2">
        <button onClick={onCancel} className="text-sm px-3 py-1.5 text-gray-500 hover:text-gray-700">Cancel</button>
        <button onClick={handleSubmit} disabled={!name.trim()}
          className="flex items-center gap-1.5 text-sm px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed">
          <Plus className="w-3.5 h-3.5" /> Add contact
        </button>
      </div>
    </div>
  )
}
