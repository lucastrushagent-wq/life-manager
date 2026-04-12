import { useEffect, useRef, useState } from 'react'
import { Plus, Trash2, Pencil, X, Download, Upload, Award, Briefcase, Star } from 'lucide-react'
import { PhilosophyBox } from '../../../core/PhilosophyBox'
import { useProfessionalStore } from '../store'
import type { PerformanceReview, WorkHistoryEntry, ProfessionalSkill, ProfessionalCert, SkillCategory, SkillLevel } from '../types'

type Tab = 'resume' | 'reviews' | 'work' | 'skills'

const TABS: { id: Tab; label: string }[] = [
  { id: 'resume', label: 'Resume' },
  { id: 'reviews', label: 'Performance Reviews' },
  { id: 'work', label: 'Work History' },
  { id: 'skills', label: 'Skills & Development' },
]

const SKILL_CATEGORIES: SkillCategory[] = ['technical', 'soft', 'language', 'other']
const SKILL_LEVELS: SkillLevel[] = ['beginner', 'intermediate', 'advanced', 'expert']
const LEVEL_COLORS: Record<SkillLevel, string> = {
  beginner: 'bg-gray-100 text-gray-600',
  intermediate: 'bg-blue-50 text-blue-700',
  advanced: 'bg-purple-50 text-purple-700',
  expert: 'bg-amber-50 text-amber-700',
}

const inputCls = 'text-sm border border-gray-200 rounded px-2 py-1.5 outline-none focus:border-blue-400 w-full'
const textareaCls = `${inputCls} resize-none`

function fmtDate(d?: string) {
  if (!d) return ''
  const [y, m] = d.split('-')
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  return `${months[parseInt(m) - 1]} ${y}`
}

// ── Resume Tab ───────────────────────────────────────────────────

function ResumeTab() {
  const { resumes, uploading, uploadResume, deleteResume } = useProfessionalStore()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [confirm, setConfirm] = useState<string | null>(null)

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    const reader = new FileReader()
    reader.onload = () => {
      uploadResume(reader.result as string, file.name)
    }
    reader.readAsDataURL(file)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">All uploaded versions — most recent first.</p>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-1.5 text-sm px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          <Upload className="w-4 h-4" />
          {uploading ? 'Uploading…' : 'Upload resume'}
        </button>
        <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={handleFile} />
      </div>

      {resumes.length === 0 ? (
        <p className="text-center text-gray-400 text-sm py-12 rounded-lg border border-dashed border-gray-200">
          No resumes yet. Upload a PDF or Word document.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {resumes.map((r, i) => (
            <div key={r.id} className="flex items-center justify-between px-4 py-3 rounded-lg border border-gray-200 bg-white">
              <div className="flex items-center gap-3 min-w-0">
                <div className={`text-xs font-bold uppercase px-2 py-1 rounded ${r.mimeType === 'application/pdf' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
                  {r.originalName.split('.').pop()?.toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{r.originalName}</p>
                  <p className="text-xs text-gray-400">
                    {i === 0 && <span className="text-green-600 font-medium mr-2">Current</span>}
                    Uploaded {new Date(r.uploadedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 ml-4 shrink-0">
                <a
                  href={`/uploads/${r.storedName}`}
                  download={r.originalName}
                  className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 px-2 py-1 rounded hover:bg-blue-50"
                >
                  <Download className="w-3.5 h-3.5" /> Download
                </a>
                {confirm === r.id ? (
                  <span className="flex items-center gap-1 text-xs">
                    <button onClick={() => { deleteResume(r.id); setConfirm(null) }} className="text-red-500 hover:text-red-700 font-medium">Yes</button>
                    <button onClick={() => setConfirm(null)} className="text-gray-400 hover:text-gray-600">No</button>
                  </span>
                ) : (
                  <button onClick={() => setConfirm(r.id)} className="text-gray-300 hover:text-red-400 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Reviews Tab ──────────────────────────────────────────────────

type ReviewForm = { date: string; period: string; company: string; role: string; rating: string; summary: string; strengths: string; improvements: string; notes: string }
const BLANK_REVIEW: ReviewForm = { date: '', period: '', company: '', role: '', rating: '', summary: '', strengths: '', improvements: '', notes: '' }

function ReviewsTab() {
  const { reviews, createReview, updateReview, deleteReview } = useProfessionalStore()
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<ReviewForm>(BLANK_REVIEW)
  const [confirm, setConfirm] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)

  function startAdd() { setForm(BLANK_REVIEW); setEditingId(null); setShowForm(true) }
  function startEdit(r: PerformanceReview) {
    setForm({ date: r.date, period: r.period ?? '', company: r.company ?? '', role: r.role ?? '', rating: r.rating ?? '', summary: r.summary ?? '', strengths: r.strengths ?? '', improvements: r.improvements ?? '', notes: r.notes ?? '' })
    setEditingId(r.id); setShowForm(true)
  }

  async function submit() {
    if (!form.date) return
    const payload = { date: form.date, period: form.period || undefined, company: form.company || undefined, role: form.role || undefined, rating: form.rating || undefined, summary: form.summary || undefined, strengths: form.strengths || undefined, improvements: form.improvements || undefined, notes: form.notes || undefined }
    if (editingId) await updateReview(editingId, payload)
    else await createReview(payload)
    setShowForm(false); setEditingId(null)
  }

  const p = (k: keyof ReviewForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm(f => ({ ...f, [k]: e.target.value }))

  return (
    <div>
      <div className="flex justify-end mb-4">
        {!showForm && <button onClick={startAdd} className="flex items-center gap-1.5 text-sm px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700"><Plus className="w-4 h-4" /> Add review</button>}
      </div>

      {showForm && (
        <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-800">{editingId ? 'Edit review' : 'Add review'}</h3>
            <button onClick={() => { setShowForm(false); setEditingId(null) }}><X className="w-4 h-4 text-gray-400 hover:text-gray-600" /></button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs text-gray-500 block mb-1">Date *</label><input type="date" className={inputCls} value={form.date} onChange={p('date')} autoFocus /></div>
            <div><label className="text-xs text-gray-500 block mb-1">Period (e.g. H1 2024)</label><input className={inputCls} placeholder="H1 2024" value={form.period} onChange={p('period')} /></div>
            <div><label className="text-xs text-gray-500 block mb-1">Company</label><input className={inputCls} value={form.company} onChange={p('company')} /></div>
            <div><label className="text-xs text-gray-500 block mb-1">Role</label><input className={inputCls} value={form.role} onChange={p('role')} /></div>
            <div className="col-span-2"><label className="text-xs text-gray-500 block mb-1">Rating</label><input className={inputCls} placeholder='e.g. "Exceeds Expectations", "4/5"' value={form.rating} onChange={p('rating')} /></div>
            <div className="col-span-2"><label className="text-xs text-gray-500 block mb-1">Summary</label><textarea className={textareaCls} rows={3} value={form.summary} onChange={p('summary')} /></div>
            <div><label className="text-xs text-gray-500 block mb-1">Strengths</label><textarea className={textareaCls} rows={3} value={form.strengths} onChange={p('strengths')} /></div>
            <div><label className="text-xs text-gray-500 block mb-1">Areas for improvement</label><textarea className={textareaCls} rows={3} value={form.improvements} onChange={p('improvements')} /></div>
            <div className="col-span-2"><label className="text-xs text-gray-500 block mb-1">Notes</label><textarea className={textareaCls} rows={2} value={form.notes} onChange={p('notes')} /></div>
          </div>
          <div className="flex justify-end gap-2 mt-3">
            <button onClick={() => { setShowForm(false); setEditingId(null) }} className="text-xs px-3 py-1.5 text-gray-500 hover:text-gray-700">Cancel</button>
            <button onClick={submit} disabled={!form.date} className="text-xs px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-40">{editingId ? 'Save' : 'Add review'}</button>
          </div>
        </div>
      )}

      {reviews.length === 0 && !showForm ? (
        <p className="text-center text-gray-400 text-sm py-12 rounded-lg border border-dashed border-gray-200">No performance reviews yet.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {reviews.map(r => (
            <div key={r.id} className="rounded-xl border border-gray-200 bg-white overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 cursor-pointer" onClick={() => setExpanded(expanded === r.id ? null : r.id)}>
                <div className="flex items-center gap-4 min-w-0">
                  <div className="text-center shrink-0">
                    <p className="text-xs text-gray-400">{fmtDate(r.date)}</p>
                    {r.period && <p className="text-xs font-medium text-gray-600">{r.period}</p>}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-800">{r.company ?? 'Review'}{r.role ? ` — ${r.role}` : ''}</p>
                    {r.rating && <span className="inline-block text-xs font-medium text-purple-700 bg-purple-50 border border-purple-200 rounded-full px-2 py-0.5 mt-0.5">{r.rating}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4 shrink-0">
                  <button onClick={e => { e.stopPropagation(); startEdit(r) }} className="text-gray-300 hover:text-blue-400"><Pencil className="w-3.5 h-3.5" /></button>
                  {confirm === r.id ? (
                    <span className="flex items-center gap-1 text-xs" onClick={e => e.stopPropagation()}>
                      <button onClick={() => { deleteReview(r.id); setConfirm(null) }} className="text-red-500 font-medium">Yes</button>
                      <button onClick={() => setConfirm(null)} className="text-gray-400">No</button>
                    </span>
                  ) : (
                    <button onClick={e => { e.stopPropagation(); setConfirm(r.id) }} className="text-gray-300 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                  )}
                </div>
              </div>
              {expanded === r.id && (
                <div className="border-t border-gray-100 px-5 py-4 grid grid-cols-1 gap-4 text-sm">
                  {r.summary && <div><p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Summary</p><p className="text-gray-700 whitespace-pre-wrap">{r.summary}</p></div>}
                  <div className="grid grid-cols-2 gap-4">
                    {r.strengths && <div><p className="text-xs font-semibold text-green-600 uppercase tracking-wide mb-1">Strengths</p><p className="text-gray-700 whitespace-pre-wrap">{r.strengths}</p></div>}
                    {r.improvements && <div><p className="text-xs font-semibold text-orange-500 uppercase tracking-wide mb-1">Areas for improvement</p><p className="text-gray-700 whitespace-pre-wrap">{r.improvements}</p></div>}
                  </div>
                  {r.notes && <div><p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Notes</p><p className="text-gray-700 whitespace-pre-wrap">{r.notes}</p></div>}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Work History Tab ─────────────────────────────────────────────

type WorkForm = { company: string; title: string; startDate: string; endDate: string; location: string; description: string }
const BLANK_WORK: WorkForm = { company: '', title: '', startDate: '', endDate: '', location: '', description: '' }

function WorkTab() {
  const { work, createWork, updateWork, deleteWork } = useProfessionalStore()
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<WorkForm>(BLANK_WORK)
  const [confirm, setConfirm] = useState<string | null>(null)

  function startAdd() { setForm(BLANK_WORK); setEditingId(null); setShowForm(true) }
  function startEdit(w: WorkHistoryEntry) {
    setForm({ company: w.company, title: w.title, startDate: w.startDate, endDate: w.endDate ?? '', location: w.location ?? '', description: w.description ?? '' })
    setEditingId(w.id); setShowForm(true)
  }

  async function submit() {
    if (!form.company || !form.title || !form.startDate) return
    const payload = { company: form.company, title: form.title, startDate: form.startDate, endDate: form.endDate || undefined, location: form.location || undefined, description: form.description || undefined }
    if (editingId) await updateWork(editingId, payload)
    else await createWork(payload)
    setShowForm(false); setEditingId(null)
  }

  const p = (k: keyof WorkForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm(f => ({ ...f, [k]: e.target.value }))

  return (
    <div>
      <div className="flex justify-end mb-4">
        {!showForm && <button onClick={startAdd} className="flex items-center gap-1.5 text-sm px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700"><Plus className="w-4 h-4" /> Add role</button>}
      </div>

      {showForm && (
        <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-800">{editingId ? 'Edit role' : 'Add role'}</h3>
            <button onClick={() => { setShowForm(false); setEditingId(null) }}><X className="w-4 h-4 text-gray-400 hover:text-gray-600" /></button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs text-gray-500 block mb-1">Company *</label><input className={inputCls} value={form.company} onChange={p('company')} autoFocus /></div>
            <div><label className="text-xs text-gray-500 block mb-1">Title *</label><input className={inputCls} value={form.title} onChange={p('title')} /></div>
            <div><label className="text-xs text-gray-500 block mb-1">Start date *</label><input type="month" className={inputCls} value={form.startDate} onChange={p('startDate')} /></div>
            <div><label className="text-xs text-gray-500 block mb-1">End date (blank = present)</label><input type="month" className={inputCls} value={form.endDate} onChange={p('endDate')} /></div>
            <div className="col-span-2"><label className="text-xs text-gray-500 block mb-1">Location</label><input className={inputCls} placeholder="City, Country" value={form.location} onChange={p('location')} /></div>
            <div className="col-span-2"><label className="text-xs text-gray-500 block mb-1">Description & achievements</label><textarea className={textareaCls} rows={4} value={form.description} onChange={p('description')} /></div>
          </div>
          <div className="flex justify-end gap-2 mt-3">
            <button onClick={() => { setShowForm(false); setEditingId(null) }} className="text-xs px-3 py-1.5 text-gray-500 hover:text-gray-700">Cancel</button>
            <button onClick={submit} disabled={!form.company || !form.title || !form.startDate} className="text-xs px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-40">{editingId ? 'Save' : 'Add role'}</button>
          </div>
        </div>
      )}

      {work.length === 0 && !showForm ? (
        <p className="text-center text-gray-400 text-sm py-12 rounded-lg border border-dashed border-gray-200">No work history yet.</p>
      ) : (
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-4 top-3 bottom-3 w-px bg-gray-200" />
          <div className="flex flex-col gap-4">
            {work.map(w => (
              <div key={w.id} className="relative pl-10">
                <div className="absolute left-3 top-3.5 w-2.5 h-2.5 rounded-full border-2 border-blue-400 bg-white" />
                <div className="rounded-xl border border-gray-200 bg-white px-5 py-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-bold text-gray-900">{w.title}</p>
                      <p className="text-sm text-gray-600 font-medium">{w.company}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {fmtDate(w.startDate)} – {w.endDate ? fmtDate(w.endDate) : <span className="text-green-600 font-medium">Present</span>}
                        {w.location && ` · ${w.location}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 ml-4 shrink-0">
                      <button onClick={() => startEdit(w)} className="text-gray-300 hover:text-blue-400"><Pencil className="w-3.5 h-3.5" /></button>
                      {confirm === w.id ? (
                        <span className="flex items-center gap-1 text-xs">
                          <button onClick={() => { deleteWork(w.id); setConfirm(null) }} className="text-red-500 font-medium">Yes</button>
                          <button onClick={() => setConfirm(null)} className="text-gray-400">No</button>
                        </span>
                      ) : (
                        <button onClick={() => setConfirm(w.id)} className="text-gray-300 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                      )}
                    </div>
                  </div>
                  {w.description && <p className="mt-2 text-sm text-gray-600 whitespace-pre-wrap">{w.description}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Skills & Development Tab ─────────────────────────────────────

type SkillForm = { name: string; category: SkillCategory; level: string; notes: string }
type CertForm = { name: string; issuer: string; dateEarned: string; expiryDate: string; notes: string }
const BLANK_SKILL: SkillForm = { name: '', category: 'technical', level: '', notes: '' }
const BLANK_CERT: CertForm = { name: '', issuer: '', dateEarned: '', expiryDate: '', notes: '' }

function SkillsTab() {
  const { skills, certs, createSkill, updateSkill, deleteSkill, createCert, updateCert, deleteCert } = useProfessionalStore()
  const [showSkillForm, setShowSkillForm] = useState(false)
  const [showCertForm, setShowCertForm] = useState(false)
  const [editingSkillId, setEditingSkillId] = useState<string | null>(null)
  const [editingCertId, setEditingCertId] = useState<string | null>(null)
  const [skillForm, setSkillForm] = useState<SkillForm>(BLANK_SKILL)
  const [certForm, setCertForm] = useState<CertForm>(BLANK_CERT)
  const [confirmSkill, setConfirmSkill] = useState<string | null>(null)
  const [confirmCert, setConfirmCert] = useState<string | null>(null)

  function startAddSkill() { setSkillForm(BLANK_SKILL); setEditingSkillId(null); setShowSkillForm(true) }
  function startEditSkill(s: ProfessionalSkill) {
    setSkillForm({ name: s.name, category: s.category, level: s.level ?? '', notes: s.notes ?? '' })
    setEditingSkillId(s.id); setShowSkillForm(true)
  }
  async function submitSkill() {
    if (!skillForm.name) return
    const payload = { name: skillForm.name, category: skillForm.category, level: (skillForm.level as SkillLevel) || undefined, notes: skillForm.notes || undefined }
    if (editingSkillId) await updateSkill(editingSkillId, payload)
    else await createSkill(payload)
    setShowSkillForm(false); setEditingSkillId(null)
  }

  function startAddCert() { setCertForm(BLANK_CERT); setEditingCertId(null); setShowCertForm(true) }
  function startEditCert(c: ProfessionalCert) {
    setCertForm({ name: c.name, issuer: c.issuer ?? '', dateEarned: c.dateEarned ?? '', expiryDate: c.expiryDate ?? '', notes: c.notes ?? '' })
    setEditingCertId(c.id); setShowCertForm(true)
  }
  async function submitCert() {
    if (!certForm.name) return
    const payload = { name: certForm.name, issuer: certForm.issuer || undefined, dateEarned: certForm.dateEarned || undefined, expiryDate: certForm.expiryDate || undefined, notes: certForm.notes || undefined }
    if (editingCertId) await updateCert(editingCertId, payload)
    else await createCert(payload)
    setShowCertForm(false); setEditingCertId(null)
  }

  const grouped = SKILL_CATEGORIES.map(cat => ({ cat, items: skills.filter(s => s.category === cat) })).filter(g => g.items.length > 0)

  return (
    <div className="flex flex-col gap-8">
      {/* Skills */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 flex items-center gap-1.5"><Star className="w-3.5 h-3.5" /> Skills</h3>
          {!showSkillForm && <button onClick={startAddSkill} className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium"><Plus className="w-3.5 h-3.5" /> Add skill</button>}
        </div>

        {showSkillForm && (
          <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-gray-800">{editingSkillId ? 'Edit skill' : 'Add skill'}</h4>
              <button onClick={() => { setShowSkillForm(false); setEditingSkillId(null) }}><X className="w-4 h-4 text-gray-400" /></button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2"><input className={inputCls} placeholder="Skill name" value={skillForm.name} onChange={e => setSkillForm(f => ({ ...f, name: e.target.value }))} autoFocus /></div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Category</label>
                <select className={`${inputCls} bg-white`} value={skillForm.category} onChange={e => setSkillForm(f => ({ ...f, category: e.target.value as SkillCategory }))}>
                  {SKILL_CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Level</label>
                <select className={`${inputCls} bg-white`} value={skillForm.level} onChange={e => setSkillForm(f => ({ ...f, level: e.target.value }))}>
                  <option value="">— none —</option>
                  {SKILL_LEVELS.map(l => <option key={l} value={l}>{l.charAt(0).toUpperCase() + l.slice(1)}</option>)}
                </select>
              </div>
              <div className="col-span-2"><input className={inputCls} placeholder="Notes (optional)" value={skillForm.notes} onChange={e => setSkillForm(f => ({ ...f, notes: e.target.value }))} /></div>
            </div>
            <div className="flex justify-end gap-2 mt-3">
              <button onClick={() => { setShowSkillForm(false); setEditingSkillId(null) }} className="text-xs px-3 py-1.5 text-gray-500">Cancel</button>
              <button onClick={submitSkill} disabled={!skillForm.name} className="text-xs px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-40">{editingSkillId ? 'Save' : 'Add'}</button>
            </div>
          </div>
        )}

        {skills.length === 0 && !showSkillForm ? (
          <p className="text-sm text-gray-400 text-center py-8 rounded-lg border border-dashed border-gray-200">No skills yet.</p>
        ) : (
          <div className="flex flex-col gap-4">
            {grouped.map(({ cat, items }) => (
              <div key={cat}>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">{cat}</p>
                <div className="flex flex-wrap gap-2">
                  {items.map(s => (
                    <div key={s.id} className="flex items-center gap-1.5 pl-3 pr-2 py-1.5 rounded-full border border-gray-200 bg-white group">
                      <span className="text-sm text-gray-700 font-medium">{s.name}</span>
                      {s.level && <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${LEVEL_COLORS[s.level as SkillLevel]}`}>{s.level}</span>}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => startEditSkill(s)} className="text-gray-300 hover:text-blue-400"><Pencil className="w-3 h-3" /></button>
                        {confirmSkill === s.id ? (
                          <span className="flex items-center gap-1 text-xs">
                            <button onClick={() => { deleteSkill(s.id); setConfirmSkill(null) }} className="text-red-500 font-medium">×</button>
                          </span>
                        ) : (
                          <button onClick={() => setConfirmSkill(s.id)} className="text-gray-300 hover:text-red-400"><Trash2 className="w-3 h-3" /></button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Certifications */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 flex items-center gap-1.5"><Award className="w-3.5 h-3.5" /> Certifications</h3>
          {!showCertForm && <button onClick={startAddCert} className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium"><Plus className="w-3.5 h-3.5" /> Add cert</button>}
        </div>

        {showCertForm && (
          <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-gray-800">{editingCertId ? 'Edit certification' : 'Add certification'}</h4>
              <button onClick={() => { setShowCertForm(false); setEditingCertId(null) }}><X className="w-4 h-4 text-gray-400" /></button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2"><input className={inputCls} placeholder="Certification name *" value={certForm.name} onChange={e => setCertForm(f => ({ ...f, name: e.target.value }))} autoFocus /></div>
              <div><label className="text-xs text-gray-500 block mb-1">Issuing organisation</label><input className={inputCls} value={certForm.issuer} onChange={e => setCertForm(f => ({ ...f, issuer: e.target.value }))} /></div>
              <div><label className="text-xs text-gray-500 block mb-1">Date earned</label><input type="date" className={inputCls} value={certForm.dateEarned} onChange={e => setCertForm(f => ({ ...f, dateEarned: e.target.value }))} /></div>
              <div><label className="text-xs text-gray-500 block mb-1">Expiry date</label><input type="date" className={inputCls} value={certForm.expiryDate} onChange={e => setCertForm(f => ({ ...f, expiryDate: e.target.value }))} /></div>
              <div><label className="text-xs text-gray-500 block mb-1">Notes</label><input className={inputCls} value={certForm.notes} onChange={e => setCertForm(f => ({ ...f, notes: e.target.value }))} /></div>
            </div>
            <div className="flex justify-end gap-2 mt-3">
              <button onClick={() => { setShowCertForm(false); setEditingCertId(null) }} className="text-xs px-3 py-1.5 text-gray-500">Cancel</button>
              <button onClick={submitCert} disabled={!certForm.name} className="text-xs px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-40">{editingCertId ? 'Save' : 'Add'}</button>
            </div>
          </div>
        )}

        {certs.length === 0 && !showCertForm ? (
          <p className="text-sm text-gray-400 text-center py-8 rounded-lg border border-dashed border-gray-200">No certifications yet.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {certs.map(c => {
              const expired = c.expiryDate && c.expiryDate < new Date().toISOString().split('T')[0]
              return (
                <div key={c.id} className="flex items-center justify-between px-4 py-3 rounded-lg border border-gray-200 bg-white">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-gray-800">{c.name}</p>
                      {expired && <span className="text-xs text-red-500 font-medium bg-red-50 border border-red-200 rounded-full px-2 py-0.5">Expired</span>}
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {c.issuer && <span>{c.issuer}</span>}
                      {c.dateEarned && <span>{c.issuer ? ' · ' : ''}{new Date(c.dateEarned).toLocaleDateString()}</span>}
                      {c.expiryDate && <span> — expires {new Date(c.expiryDate).toLocaleDateString()}</span>}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 ml-4 shrink-0">
                    <button onClick={() => startEditCert(c)} className="text-gray-300 hover:text-blue-400"><Pencil className="w-3.5 h-3.5" /></button>
                    {confirmCert === c.id ? (
                      <span className="flex items-center gap-1 text-xs">
                        <button onClick={() => { deleteCert(c.id); setConfirmCert(null) }} className="text-red-500 font-medium">Yes</button>
                        <button onClick={() => setConfirmCert(null)} className="text-gray-400">No</button>
                      </span>
                    ) : (
                      <button onClick={() => setConfirmCert(c.id)} className="text-gray-300 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Root ─────────────────────────────────────────────────────────

export function ProfessionalModule() {
  const { load } = useProfessionalStore()
  const [activeTab, setActiveTab] = useState<Tab>('resume')

  useEffect(() => { load() }, [load])

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Professional</h1>
      </div>

      <PhilosophyBox moduleId="professional" />

      <div className="flex gap-1 mb-6 border-b border-gray-200">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              activeTab === t.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'resume' && <ResumeTab />}
      {activeTab === 'reviews' && <ReviewsTab />}
      {activeTab === 'work' && <WorkTab />}
      {activeTab === 'skills' && <SkillsTab />}
    </div>
  )
}
