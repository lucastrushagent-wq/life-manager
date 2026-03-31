import { useState, KeyboardEvent } from 'react'
import { ArrowLeft, Plus, Trash2, Calendar, Linkedin, Pencil, X } from 'lucide-react'
import { useCrmStore } from '../store'
import { useContactDetail } from '../hooks/useContactDetail'
import { AddInteractionForm } from './AddInteractionForm'
import { AddKeyDateForm } from './AddKeyDateForm'

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

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
  contactId: string
  onBack: () => void
}

export function ContactDetail({ contactId, onBack }: Props) {
  const contacts = useCrmStore(s => s.contacts)
  const update = useCrmStore(s => s.update)
  const contact = contacts.find(c => c.id === contactId)
  const { interactions, keyDates, addInteraction, deleteInteraction, addKeyDate, deleteKeyDate } = useContactDetail(contactId)

  const [showInteractionForm, setShowInteractionForm] = useState(false)
  const [showKeyDateForm, setShowKeyDateForm] = useState(false)
  const [editingNotes, setEditingNotes] = useState(false)
  const [notesValue, setNotesValue] = useState(contact?.notes ?? '')

  // Edit mode state
  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState('')
  const [editRole, setEditRole] = useState('')
  const [editCompany, setEditCompany] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [editPhone, setEditPhone] = useState('')
  const [editLinkedin, setEditLinkedin] = useState('')
  const [editFollowUpDays, setEditFollowUpDays] = useState('')
  const [editTags, setEditTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')

  if (!contact) return null

  function startEditing() {
    setEditName(contact!.name)
    setEditRole(contact!.role ?? '')
    setEditCompany(contact!.company ?? '')
    setEditEmail(contact!.email ?? '')
    setEditPhone(contact!.phone ?? '')
    setEditLinkedin(contact!.linkedinUrl ?? '')
    setEditFollowUpDays(contact!.followUpDays?.toString() ?? '')
    setEditTags([...contact!.relationship])
    setTagInput('')
    setEditing(true)
  }

  function cancelEditing() {
    setEditing(false)
  }

  async function saveEditing() {
    if (!editName.trim()) return
    await update(contactId, {
      name: editName.trim(),
      role: editRole.trim() || undefined,
      company: editCompany.trim() || undefined,
      email: editEmail.trim() || undefined,
      phone: editPhone.trim() || undefined,
      linkedinUrl: editLinkedin.trim() || undefined,
      followUpDays: editFollowUpDays ? parseInt(editFollowUpDays) : undefined,
      relationship: editTags,
    })
    setEditing(false)
  }

  async function saveNotes() {
    await update(contactId, { notes: notesValue || undefined })
    setEditingNotes(false)
  }

  function addTag() {
    const tag = tagInput.trim().replace(/,$/, '')
    if (tag && !editTags.includes(tag)) setEditTags(prev => [...prev, tag])
    setTagInput('')
  }

  function handleTagKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag() }
  }

  const inputCls = "text-sm border border-gray-200 rounded px-2 py-1.5 outline-none focus:border-blue-400 w-full"

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to contacts
      </button>

      {/* Header card */}
      <div className="bg-white border border-gray-200 rounded-lg p-5 mb-5">
        {editing ? (
          <>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <input autoFocus className={`${inputCls} col-span-2 font-medium`} placeholder="Name *"
                value={editName} onChange={e => setEditName(e.target.value)} />
              <input className={inputCls} placeholder="Current role"
                value={editRole} onChange={e => setEditRole(e.target.value)} />
              <input className={inputCls} placeholder="Company"
                value={editCompany} onChange={e => setEditCompany(e.target.value)} />
              <input className={inputCls} placeholder="Email" type="email"
                value={editEmail} onChange={e => setEditEmail(e.target.value)} />
              <input className={inputCls} placeholder="Phone" type="tel"
                value={editPhone} onChange={e => setEditPhone(e.target.value)} />
              <input className={inputCls} placeholder="LinkedIn URL"
                value={editLinkedin} onChange={e => setEditLinkedin(e.target.value)} />
              <select value={editFollowUpDays} onChange={e => setEditFollowUpDays(e.target.value)}
                className="text-sm border border-gray-200 rounded px-2 py-1.5 outline-none focus:border-blue-400 bg-white text-gray-600">
                {FOLLOW_UP_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>

            {/* Relationship tags */}
            <div className="mb-3">
              {editTags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-1.5">
                  {editTags.map(tag => (
                    <span key={tag} className="flex items-center gap-1 bg-purple-50 text-purple-700 text-xs px-2 py-0.5 rounded-full">
                      {tag}
                      <button onClick={() => setEditTags(editTags.filter(t => t !== tag))}><X className="w-3 h-3" /></button>
                    </span>
                  ))}
                </div>
              )}
              <input type="text" placeholder="Add relationship tag, press Enter"
                value={tagInput} onChange={e => setTagInput(e.target.value)}
                onKeyDown={handleTagKeyDown} onBlur={addTag}
                className="text-sm border border-gray-200 rounded px-2 py-1.5 w-full outline-none focus:border-blue-400 placeholder-gray-400" />
            </div>

            <div className="flex justify-end gap-2">
              <button onClick={cancelEditing} className="text-sm px-3 py-1.5 text-gray-500 hover:text-gray-700">Cancel</button>
              <button onClick={saveEditing} disabled={!editName.trim()}
                className="text-sm px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-40">
                Save
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-start justify-between mb-0.5">
              <h2 className="text-xl font-semibold text-gray-900">{contact.name}</h2>
              <button onClick={startEditing}
                className="flex items-center gap-1 text-xs text-gray-400 hover:text-blue-600 transition-colors mt-1">
                <Pencil className="w-3 h-3" /> Edit
              </button>
            </div>
            {contact.role && <p className="text-sm text-gray-500">{contact.role}</p>}
            {contact.company && <p className="text-sm text-gray-400 mb-3">{contact.company}</p>}

            <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm mb-4">
              {contact.email && <div><span className="text-gray-400">Email </span><span className="text-gray-700">{contact.email}</span></div>}
              {contact.phone && <div><span className="text-gray-400">Phone </span><span className="text-gray-700">{contact.phone}</span></div>}
              {contact.followUpDays && (
                <div><span className="text-gray-400">Follow-up </span>
                  <span className="text-gray-700">Every {contact.followUpDays} days</span>
                </div>
              )}
              {contact.linkedinUrl && (
                <div>
                  <a href={contact.linkedinUrl} target="_blank" rel="noreferrer"
                    className="flex items-center gap-1 text-blue-600 hover:text-blue-800">
                    <Linkedin className="w-3.5 h-3.5" /> LinkedIn
                  </a>
                </div>
              )}
            </div>

            {contact.relationship.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-4">
                {contact.relationship.map(r => (
                  <span key={r} className="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full">{r}</span>
                ))}
              </div>
            )}

            {/* Notes */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">Notes</span>
                {!editingNotes && (
                  <button onClick={() => { setNotesValue(contact.notes ?? ''); setEditingNotes(true) }}
                    className="text-xs text-blue-600 hover:text-blue-800">Edit</button>
                )}
              </div>
              {editingNotes ? (
                <div>
                  <textarea value={notesValue} onChange={e => setNotesValue(e.target.value)} rows={3} autoFocus
                    className="w-full text-sm border border-gray-200 rounded px-2 py-1.5 outline-none focus:border-blue-400 resize-none" />
                  <div className="flex justify-end gap-2 mt-1">
                    <button onClick={() => setEditingNotes(false)} className="text-xs text-gray-500 hover:text-gray-700">Cancel</button>
                    <button onClick={saveNotes} className="text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700">Save</button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-600">{contact.notes || <span className="text-gray-300 italic">No notes yet</span>}</p>
              )}
            </div>
          </>
        )}
      </div>

      {/* Interaction Log */}
      <div className="bg-white border border-gray-200 rounded-lg p-5 mb-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium text-gray-900">Interaction Log</h3>
          {!showInteractionForm && (
            <button onClick={() => setShowInteractionForm(true)}
              className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800">
              <Plus className="w-3.5 h-3.5" /> Log interaction
            </button>
          )}
        </div>

        {showInteractionForm && (
          <AddInteractionForm
            onAdd={async input => { await addInteraction(input); setShowInteractionForm(false) }}
            onCancel={() => setShowInteractionForm(false)}
          />
        )}

        {interactions.length === 0 && !showInteractionForm ? (
          <p className="text-sm text-gray-400 italic">No interactions logged yet.</p>
        ) : (
          <div className="space-y-3">
            {interactions.map(interaction => (
              <div key={interaction.id} className="flex gap-3 group">
                <div className="w-24 flex-shrink-0 text-xs text-gray-400 pt-0.5">
                  {new Date(interaction.date).toLocaleDateString()}
                </div>
                <div className="flex-1 text-sm text-gray-700">{interaction.notes}</div>
                <button onClick={() => deleteInteraction(interaction.id)}
                  className="text-gray-200 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Key Dates */}
      <div className="bg-white border border-gray-200 rounded-lg p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium text-gray-900">Key Dates</h3>
          {!showKeyDateForm && (
            <button onClick={() => setShowKeyDateForm(true)}
              className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800">
              <Plus className="w-3.5 h-3.5" /> Add date
            </button>
          )}
        </div>

        {showKeyDateForm && (
          <AddKeyDateForm
            onAdd={async input => { await addKeyDate(input); setShowKeyDateForm(false) }}
            onCancel={() => setShowKeyDateForm(false)}
          />
        )}

        {keyDates.length === 0 && !showKeyDateForm ? (
          <p className="text-sm text-gray-400 italic">No key dates added yet.</p>
        ) : (
          <div className="space-y-2">
            {keyDates.map(kd => (
              <div key={kd.id} className="flex items-center gap-3 group">
                <Calendar className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                <span className="text-sm text-gray-700 flex-1">{kd.label}</span>
                <span className="text-sm text-gray-500">{MONTHS[kd.month - 1]} {kd.day}</span>
                <button onClick={() => deleteKeyDate(kd.id)}
                  className="text-gray-200 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
