import { useState } from 'react'
import { Plus, Trash2, Pencil, Check, X, CheckCircle2 } from 'lucide-react'
import { useVisionStore } from '../store'
import type { Goal, GoalCategory, GoalStatus, GoalTimeframe } from '../types'
import { GoalCategoryValues } from '../schema'

const CATEGORY_LABELS: Record<GoalCategory, string> = {
  health: 'Health',
  fitness: 'Fitness',
  career: 'Career & Professional',
  financial: 'Financial',
  relationships: 'Relationships',
  family: 'Family',
  personal_growth: 'Personal Growth',
  learning: 'Learning & Education',
  mental_wellbeing: 'Mental & Emotional Wellbeing',
  creativity: 'Creativity',
  hobbies: 'Hobbies',
  travel: 'Travel & Experiences',
  community: 'Community & Giving Back',
  spirituality: 'Spirituality & Purpose',
  home: 'Home & Environment',
  adventure: 'Adventure & Fun',
  other: 'Other',
}

const CATEGORY_COLORS: Record<GoalCategory, string> = {
  health: 'bg-green-100 text-green-700',
  fitness: 'bg-orange-100 text-orange-700',
  career: 'bg-blue-100 text-blue-700',
  financial: 'bg-emerald-100 text-emerald-700',
  relationships: 'bg-pink-100 text-pink-700',
  family: 'bg-rose-100 text-rose-700',
  personal_growth: 'bg-violet-100 text-violet-700',
  learning: 'bg-indigo-100 text-indigo-700',
  mental_wellbeing: 'bg-teal-100 text-teal-700',
  creativity: 'bg-yellow-100 text-yellow-700',
  hobbies: 'bg-amber-100 text-amber-700',
  travel: 'bg-cyan-100 text-cyan-700',
  community: 'bg-lime-100 text-lime-700',
  spirituality: 'bg-purple-100 text-purple-700',
  home: 'bg-stone-100 text-stone-700',
  adventure: 'bg-red-100 text-red-700',
  other: 'bg-gray-100 text-gray-600',
}

const TIMEFRAME_LABELS: Record<GoalTimeframe, string> = {
  short: 'Short-term (≤1 yr)',
  medium: 'Medium-term (1–3 yr)',
  long: 'Long-term (3–10 yr)',
  lifetime: 'Lifetime',
}

const STATUS_LABELS: Record<GoalStatus, string> = {
  active: 'Active',
  achieved: 'Achieved',
  paused: 'Paused',
  abandoned: 'Abandoned',
}

const emptyForm = {
  category: 'career' as GoalCategory,
  title: '',
  description: '',
  timeframe: 'long' as GoalTimeframe,
  targetDate: '',
  status: 'active' as GoalStatus,
}

const today = () => new Date().toISOString().split('T')[0]

export function GoalsTab() {
  const { goals, addGoal, updateGoal, deleteGoal } = useVisionStore()
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState({ ...emptyForm })
  const [filterCategory, setFilterCategory] = useState<GoalCategory | 'all'>('all')
  const [filterStatus, setFilterStatus] = useState<GoalStatus | 'all'>('active')
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const f = (k: string, v: string) => setForm(prev => ({ ...prev, [k]: v }))

  const startEdit = (g: Goal) => {
    setEditId(g.id)
    setForm({ category: g.category, title: g.title, description: g.description ?? '', timeframe: g.timeframe, targetDate: g.targetDate ?? '', status: g.status })
    setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const data = { category: form.category, title: form.title, description: form.description || undefined, timeframe: form.timeframe, targetDate: form.targetDate || undefined, status: form.status }
    if (editId) {
      await updateGoal(editId, data)
      setEditId(null)
    } else {
      await addGoal(data)
    }
    setForm({ ...emptyForm })
    setShowForm(false)
  }

  const markAchieved = async (g: Goal) => {
    await updateGoal(g.id, { status: 'achieved' })
  }

  // Filter
  const filtered = goals.filter(g =>
    (filterCategory === 'all' || g.category === filterCategory) &&
    (filterStatus === 'all' || g.status === filterStatus)
  )

  // Group by category
  const byCategory = filtered.reduce<Record<string, Goal[]>>((acc, g) => {
    acc[g.category] = acc[g.category] ?? []
    acc[g.category].push(g)
    return acc
  }, {})

  const formatDate = (d: string) => {
    const [y, mo, day] = d.split('-')
    return `${parseInt(mo)}/${parseInt(day)}/${y}`
  }

  const counts = {
    active: goals.filter(g => g.status === 'active').length,
    achieved: goals.filter(g => g.status === 'achieved').length,
  }

  return (
    <div>
      {/* Summary */}
      <div className="flex items-center gap-4 mb-5">
        <div className="text-center">
          <p className="text-2xl font-bold text-blue-600">{counts.active}</p>
          <p className="text-xs text-gray-400">Active</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-green-600">{counts.achieved}</p>
          <p className="text-xs text-gray-400">Achieved</p>
        </div>
        <div className="ml-auto">
          <button onClick={() => { setEditId(null); setForm({ ...emptyForm }); setShowForm(f => !f) }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700">
            <Plus className="w-4 h-4" /> Add Goal
          </button>
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-5 p-4 border border-gray-200 rounded-lg bg-gray-50 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Category</label>
              <select value={form.category} onChange={e => f('category', e.target.value)}
                className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm">
                {GoalCategoryValues.map(c => <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Timeframe</label>
              <select value={form.timeframe} onChange={e => f('timeframe', e.target.value)}
                className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm">
                {(['short', 'medium', 'long', 'lifetime'] as GoalTimeframe[]).map(t =>
                  <option key={t} value={t}>{TIMEFRAME_LABELS[t]}</option>
                )}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Goal</label>
            <input type="text" placeholder="e.g. Reach a $1M net worth" value={form.title} onChange={e => f('title', e.target.value)}
              className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" required autoFocus />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Details (optional)</label>
            <textarea placeholder="Why this goal matters, how you'll achieve it…" value={form.description} onChange={e => f('description', e.target.value)}
              rows={2} className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Target Date (optional)</label>
              <input type="date" value={form.targetDate} onChange={e => f('targetDate', e.target.value)}
                className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
              <select value={form.status} onChange={e => f('status', e.target.value)}
                className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm">
                {(['active', 'achieved', 'paused', 'abandoned'] as GoalStatus[]).map(s =>
                  <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                )}
              </select>
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <button type="submit" className="px-4 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700">
              {editId ? 'Update' : 'Add Goal'}
            </button>
            <button type="button" onClick={() => { setShowForm(false); setEditId(null) }}
              className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800">Cancel</button>
          </div>
        </form>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-5">
        <div className="flex gap-1">
          {(['all', 'active', 'achieved', 'paused', 'abandoned'] as const).map(s => (
            <button key={s} onClick={() => setFilterStatus(s)}
              className={`px-2.5 py-1 rounded text-xs font-medium border transition-colors ${filterStatus === s ? 'bg-gray-800 text-white border-gray-800' : 'text-gray-500 border-gray-200 hover:border-gray-400'}`}>
              {s === 'all' ? 'All status' : STATUS_LABELS[s]}
            </button>
          ))}
        </div>
        <div className="flex gap-1 flex-wrap">
          <button onClick={() => setFilterCategory('all')}
            className={`px-2.5 py-1 rounded text-xs font-medium border transition-colors ${filterCategory === 'all' ? 'bg-gray-800 text-white border-gray-800' : 'text-gray-500 border-gray-200 hover:border-gray-400'}`}>
            All categories
          </button>
          {GoalCategoryValues.filter(c => goals.some(g => g.category === c)).map(c => (
            <button key={c} onClick={() => setFilterCategory(c)}
              className={`px-2.5 py-1 rounded text-xs font-medium border transition-colors ${filterCategory === c ? 'bg-gray-800 text-white border-gray-800' : 'text-gray-500 border-gray-200 hover:border-gray-400'}`}>
              {CATEGORY_LABELS[c]}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="p-8 border-2 border-dashed border-gray-200 rounded-xl text-center">
          <p className="text-sm text-gray-400">No goals match this filter. Add your first goal above.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(byCategory).map(([cat, catGoals]) => (
            <div key={cat}>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                {CATEGORY_LABELS[cat as GoalCategory]}
              </h3>
              <div className="space-y-2">
                {catGoals.map(g => (
                  <div key={g.id} className={`border rounded-lg p-3.5 ${g.status === 'achieved' ? 'bg-green-50 border-green-200' : g.status === 'paused' ? 'bg-gray-50 border-gray-200' : g.status === 'abandoned' ? 'bg-red-50 border-red-100 opacity-60' : 'bg-white border-gray-200'}`}>
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${CATEGORY_COLORS[g.category]}`}>
                            {CATEGORY_LABELS[g.category]}
                          </span>
                          <span className="text-xs text-gray-400">{TIMEFRAME_LABELS[g.timeframe]}</span>
                          {g.targetDate && <span className="text-xs text-gray-400">by {formatDate(g.targetDate)}</span>}
                          {g.status !== 'active' && (
                            <span className={`text-xs font-medium ${g.status === 'achieved' ? 'text-green-600' : g.status === 'paused' ? 'text-yellow-600' : 'text-red-400'}`}>
                              {STATUS_LABELS[g.status]}
                            </span>
                          )}
                        </div>
                        <p className={`text-sm font-medium mt-1 ${g.status === 'achieved' ? 'text-green-800 line-through' : 'text-gray-900'}`}>{g.title}</p>
                        {g.description && <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{g.description}</p>}
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {g.status === 'active' && (
                          <button onClick={() => markAchieved(g)} title="Mark achieved"
                            className="text-gray-300 hover:text-green-500">
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                        )}
                        <button onClick={() => startEdit(g)} className="text-gray-300 hover:text-blue-400">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        {confirmDelete === g.id ? (
                          <div className="flex gap-1">
                            <button onClick={() => deleteGoal(g.id)} className="text-xs text-red-600 hover:underline">Delete</button>
                            <button onClick={() => setConfirmDelete(null)} className="text-xs text-gray-500 hover:underline">Cancel</button>
                          </div>
                        ) : (
                          <button onClick={() => setConfirmDelete(g.id)} className="text-gray-300 hover:text-red-400">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
