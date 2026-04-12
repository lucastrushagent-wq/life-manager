import { useEffect, useState } from 'react'
import { Trash2, Plus, Check, Star, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react'
import { PhilosophyBox } from '../../../core/PhilosophyBox'
import { useAesthetics, daysUntilDue } from '../hooks/useAesthetics'
import type {
  AestheticProduct, GroomingRoutine, GroomingSchedule,
  WardrobeItem, OutfitIdea, InspirationItem,
  ProductCategory, ProductStatus, RoutineTimeOfDay,
  WardrobeCategory, WardrobeStatus, Season, InspirationCategory,
} from '../types'

type Tab = 'grooming' | 'wardrobe' | 'inspiration'

// ── Shared helpers ───────────────────────────────────────────────

function Badge({ label, color }: { label: string; color: string }) {
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${color}`}>{label}</span>
  )
}

function SectionHeader({ title, onAdd }: { title: string; onAdd: () => void }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">{title}</h3>
      <button
        onClick={onAdd}
        className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium"
      >
        <Plus className="w-3.5 h-3.5" /> Add
      </button>
    </div>
  )
}

function DeleteBtn({ onDelete }: { onDelete: () => void }) {
  return (
    <button
      onClick={onDelete}
      className="text-gray-300 hover:text-red-500 transition-colors"
      title="Delete"
    >
      <Trash2 className="w-4 h-4" />
    </button>
  )
}

// ── Products ─────────────────────────────────────────────────────

const PRODUCT_CATEGORY_COLORS: Record<ProductCategory, string> = {
  skincare: 'bg-pink-100 text-pink-700',
  haircare: 'bg-purple-100 text-purple-700',
  grooming: 'bg-blue-100 text-blue-700',
  fragrance: 'bg-amber-100 text-amber-700',
  other: 'bg-gray-100 text-gray-600',
}

const PRODUCT_STATUS_COLORS: Record<ProductStatus, string> = {
  active: 'bg-green-100 text-green-700',
  finished: 'bg-gray-100 text-gray-500',
  wishlist: 'bg-indigo-100 text-indigo-700',
}

function ProductForm({ onSave, onCancel }: {
  onSave: (data: Omit<AestheticProduct, 'id' | 'createdAt'>) => void
  onCancel: () => void
}) {
  const [name, setName] = useState('')
  const [brand, setBrand] = useState('')
  const [category, setCategory] = useState<ProductCategory>('skincare')
  const [status, setStatus] = useState<ProductStatus>('active')
  const [rating, setRating] = useState('')
  const [notes, setNotes] = useState('')
  const [url, setUrl] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    onSave({
      name: name.trim(),
      brand: brand.trim() || undefined,
      category,
      status,
      rating: rating ? parseInt(rating) : undefined,
      notes: notes.trim() || undefined,
      url: url.trim() || undefined,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="bg-gray-50 rounded-lg p-4 space-y-3 mb-4 border border-gray-200">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Name *</label>
          <input className="text-sm border border-gray-200 rounded px-2 py-1.5 outline-none focus:border-blue-400 w-full" value={name} onChange={e => setName(e.target.value)} placeholder="Product name" autoFocus />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Brand</label>
          <input className="text-sm border border-gray-200 rounded px-2 py-1.5 outline-none focus:border-blue-400 w-full" value={brand} onChange={e => setBrand(e.target.value)} placeholder="Brand" />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Category</label>
          <select className="text-sm border border-gray-200 rounded px-2 py-1.5 outline-none focus:border-blue-400 w-full" value={category} onChange={e => setCategory(e.target.value as ProductCategory)}>
            <option value="skincare">Skincare</option>
            <option value="haircare">Haircare</option>
            <option value="grooming">Grooming</option>
            <option value="fragrance">Fragrance</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Status</label>
          <select className="text-sm border border-gray-200 rounded px-2 py-1.5 outline-none focus:border-blue-400 w-full" value={status} onChange={e => setStatus(e.target.value as ProductStatus)}>
            <option value="active">Active</option>
            <option value="wishlist">Wishlist</option>
            <option value="finished">Finished</option>
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Rating (1-5)</label>
          <input className="text-sm border border-gray-200 rounded px-2 py-1.5 outline-none focus:border-blue-400 w-full" type="number" min={1} max={5} value={rating} onChange={e => setRating(e.target.value)} placeholder="—" />
        </div>
      </div>
      <div>
        <label className="text-xs text-gray-500 mb-1 block">URL</label>
        <input className="text-sm border border-gray-200 rounded px-2 py-1.5 outline-none focus:border-blue-400 w-full" value={url} onChange={e => setUrl(e.target.value)} placeholder="Product link" />
      </div>
      <div>
        <label className="text-xs text-gray-500 mb-1 block">Notes</label>
        <textarea className="text-sm border border-gray-200 rounded px-2 py-1.5 outline-none focus:border-blue-400 w-full resize-none" rows={2} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notes…" />
      </div>
      <div className="flex gap-2 justify-end">
        <button type="button" onClick={onCancel} className="px-4 py-1.5 text-sm text-gray-600 hover:text-gray-900 transition-colors">Cancel</button>
        <button type="submit" className="px-4 py-1.5 bg-gray-900 text-white text-sm rounded hover:bg-gray-700 transition-colors">Save</button>
      </div>
    </form>
  )
}

function ProductsSection() {
  const { products, createProduct, updateProduct, deleteProduct } = useAesthetics()
  const [showForm, setShowForm] = useState(false)
  const [filter, setFilter] = useState<ProductStatus | 'all'>('all')

  const filtered = filter === 'all' ? products : products.filter(p => p.status === filter)
  const sorted = [...filtered].sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name))

  async function handleSave(data: Omit<AestheticProduct, 'id' | 'createdAt'>) {
    await createProduct(data)
    setShowForm(false)
  }

  return (
    <section className="mb-8">
      <SectionHeader title="Products" onAdd={() => setShowForm(true)} />
      <div className="flex gap-2 mb-3">
        {(['all', 'active', 'wishlist', 'finished'] as const).map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${filter === s ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>
      {showForm && <ProductForm onSave={handleSave} onCancel={() => setShowForm(false)} />}
      {sorted.length === 0 ? (
        <p className="text-sm text-gray-400 italic">No products yet.</p>
      ) : (
        <div className="space-y-2">
          {sorted.map(p => (
            <div key={p.id} className="flex items-center gap-3 bg-white border border-gray-100 rounded-lg px-4 py-2.5 hover:border-gray-200 transition-colors">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-sm text-gray-900">{p.name}</span>
                  {p.brand && <span className="text-xs text-gray-400">{p.brand}</span>}
                  <Badge label={p.category} color={PRODUCT_CATEGORY_COLORS[p.category]} />
                  <Badge label={p.status} color={PRODUCT_STATUS_COLORS[p.status]} />
                  {p.rating && (
                    <span className="flex items-center gap-0.5 text-amber-500 text-xs">
                      <Star className="w-3 h-3 fill-current" />{p.rating}
                    </span>
                  )}
                </div>
                {p.notes && <p className="text-xs text-gray-500 mt-0.5 truncate">{p.notes}</p>}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {p.url && (
                  <a href={p.url} target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-blue-500 transition-colors">
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
                <select
                  className="text-xs border-none bg-transparent text-gray-400 cursor-pointer"
                  value={p.status}
                  onChange={e => updateProduct(p.id, { status: e.target.value as ProductStatus })}
                >
                  <option value="active">Active</option>
                  <option value="wishlist">Wishlist</option>
                  <option value="finished">Finished</option>
                </select>
                <DeleteBtn onDelete={() => deleteProduct(p.id)} />
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

// ── Routines ─────────────────────────────────────────────────────

const ROUTINE_COLORS: Record<RoutineTimeOfDay, string> = {
  morning: 'bg-yellow-100 text-yellow-700',
  evening: 'bg-indigo-100 text-indigo-700',
  weekly: 'bg-teal-100 text-teal-700',
  other: 'bg-gray-100 text-gray-600',
}

function RoutineForm({ onSave, onCancel }: {
  onSave: (data: Omit<GroomingRoutine, 'id' | 'createdAt' | 'updatedAt'>) => void
  onCancel: () => void
}) {
  const [name, setName] = useState('')
  const [timeOfDay, setTimeOfDay] = useState<RoutineTimeOfDay>('morning')
  const [steps, setSteps] = useState('')
  const [notes, setNotes] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    onSave({
      name: name.trim(),
      timeOfDay,
      steps: steps.split('\n').map(s => s.trim()).filter(Boolean),
      notes: notes.trim() || undefined,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="bg-gray-50 rounded-lg p-4 space-y-3 mb-4 border border-gray-200">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Name *</label>
          <input className="text-sm border border-gray-200 rounded px-2 py-1.5 outline-none focus:border-blue-400 w-full" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Morning Skincare" autoFocus />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Time of Day</label>
          <select className="text-sm border border-gray-200 rounded px-2 py-1.5 outline-none focus:border-blue-400 w-full" value={timeOfDay} onChange={e => setTimeOfDay(e.target.value as RoutineTimeOfDay)}>
            <option value="morning">Morning</option>
            <option value="evening">Evening</option>
            <option value="weekly">Weekly</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>
      <div>
        <label className="text-xs text-gray-500 mb-1 block">Steps (one per line)</label>
        <textarea className="text-sm border border-gray-200 rounded px-2 py-1.5 outline-none focus:border-blue-400 w-full resize-none" rows={4} value={steps} onChange={e => setSteps(e.target.value)} placeholder={"Cleanse\nTone\nMoisturize"} />
      </div>
      <div>
        <label className="text-xs text-gray-500 mb-1 block">Notes</label>
        <textarea className="text-sm border border-gray-200 rounded px-2 py-1.5 outline-none focus:border-blue-400 w-full resize-none" rows={2} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notes…" />
      </div>
      <div className="flex gap-2 justify-end">
        <button type="button" onClick={onCancel} className="px-4 py-1.5 text-sm text-gray-600 hover:text-gray-900 transition-colors">Cancel</button>
        <button type="submit" className="px-4 py-1.5 bg-gray-900 text-white text-sm rounded hover:bg-gray-700 transition-colors">Save</button>
      </div>
    </form>
  )
}

function RoutinesSection() {
  const { routines, createRoutine, deleteRoutine } = useAesthetics()
  const [showForm, setShowForm] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)

  async function handleSave(data: Omit<GroomingRoutine, 'id' | 'createdAt' | 'updatedAt'>) {
    await createRoutine(data)
    setShowForm(false)
  }

  return (
    <section className="mb-8">
      <SectionHeader title="Routines" onAdd={() => setShowForm(true)} />
      {showForm && <RoutineForm onSave={handleSave} onCancel={() => setShowForm(false)} />}
      {routines.length === 0 ? (
        <p className="text-sm text-gray-400 italic">No routines yet.</p>
      ) : (
        <div className="space-y-2">
          {routines.map(r => (
            <div key={r.id} className="bg-white border border-gray-100 rounded-lg overflow-hidden">
              <div
                className="flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-gray-50"
                onClick={() => setExpanded(expanded === r.id ? null : r.id)}
              >
                <div className="flex-1 flex items-center gap-2">
                  <span className="font-medium text-sm text-gray-900">{r.name}</span>
                  <Badge label={r.timeOfDay} color={ROUTINE_COLORS[r.timeOfDay]} />
                  <span className="text-xs text-gray-400">{r.steps.length} steps</span>
                </div>
                <div className="flex items-center gap-2">
                  {expanded === r.id ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                  <DeleteBtn onDelete={() => deleteRoutine(r.id)} />
                </div>
              </div>
              {expanded === r.id && (
                <div className="px-4 pb-3 border-t border-gray-100">
                  <ol className="mt-2 space-y-1">
                    {r.steps.map((step, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                        <span className="text-xs text-gray-400 w-5 text-right shrink-0 mt-0.5">{i + 1}.</span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ol>
                  {r.notes && <p className="mt-2 text-xs text-gray-500 italic">{r.notes}</p>}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

// ── Schedules ────────────────────────────────────────────────────

function ScheduleForm({ onSave, onCancel }: {
  onSave: (data: Omit<GroomingSchedule, 'id' | 'createdAt'>) => void
  onCancel: () => void
}) {
  const [name, setName] = useState('')
  const [frequencyDays, setFrequencyDays] = useState('28')
  const [lastDoneAt, setLastDoneAt] = useState('')
  const [notes, setNotes] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !frequencyDays) return
    onSave({
      name: name.trim(),
      frequencyDays: parseInt(frequencyDays),
      lastDoneAt: lastDoneAt || undefined,
      notes: notes.trim() || undefined,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="bg-gray-50 rounded-lg p-4 space-y-3 mb-4 border border-gray-200">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Name *</label>
          <input className="text-sm border border-gray-200 rounded px-2 py-1.5 outline-none focus:border-blue-400 w-full" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Haircut" autoFocus />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Every (days) *</label>
          <input className="text-sm border border-gray-200 rounded px-2 py-1.5 outline-none focus:border-blue-400 w-full" type="number" min={1} value={frequencyDays} onChange={e => setFrequencyDays(e.target.value)} />
        </div>
      </div>
      <div>
        <label className="text-xs text-gray-500 mb-1 block">Last done</label>
        <input className="text-sm border border-gray-200 rounded px-2 py-1.5 outline-none focus:border-blue-400 w-full" type="date" value={lastDoneAt} onChange={e => setLastDoneAt(e.target.value)} />
      </div>
      <div>
        <label className="text-xs text-gray-500 mb-1 block">Notes</label>
        <input className="text-sm border border-gray-200 rounded px-2 py-1.5 outline-none focus:border-blue-400 w-full" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notes…" />
      </div>
      <div className="flex gap-2 justify-end">
        <button type="button" onClick={onCancel} className="px-4 py-1.5 text-sm text-gray-600 hover:text-gray-900 transition-colors">Cancel</button>
        <button type="submit" className="px-4 py-1.5 bg-gray-900 text-white text-sm rounded hover:bg-gray-700 transition-colors">Save</button>
      </div>
    </form>
  )
}

function SchedulesSection() {
  const { schedules, createSchedule, markScheduleDone, deleteSchedule } = useAesthetics()
  const [showForm, setShowForm] = useState(false)

  async function handleSave(data: Omit<GroomingSchedule, 'id' | 'createdAt'>) {
    await createSchedule(data)
    setShowForm(false)
  }

  return (
    <section className="mb-8">
      <SectionHeader title="Grooming Schedule" onAdd={() => setShowForm(true)} />
      {showForm && <ScheduleForm onSave={handleSave} onCancel={() => setShowForm(false)} />}
      {schedules.length === 0 ? (
        <p className="text-sm text-gray-400 italic">No schedules yet.</p>
      ) : (
        <div className="space-y-2">
          {schedules.map(sc => {
            const days = daysUntilDue(sc.frequencyDays, sc.lastDoneAt)
            const isOverdue = days !== null && days < 0
            const isDueSoon = days !== null && days >= 0 && days <= 3
            const isNeverDone = days === null

            let statusBadge: { label: string; color: string }
            if (isNeverDone) statusBadge = { label: 'Never done', color: 'bg-gray-100 text-gray-500' }
            else if (isOverdue) statusBadge = { label: `${Math.abs(days!)} days overdue`, color: 'bg-red-100 text-red-700' }
            else if (isDueSoon) statusBadge = { label: days === 0 ? 'Due today' : `Due in ${days}d`, color: 'bg-orange-100 text-orange-700' }
            else statusBadge = { label: `Due in ${days}d`, color: 'bg-green-100 text-green-700' }

            return (
              <div key={sc.id} className="flex items-center gap-3 bg-white border border-gray-100 rounded-lg px-4 py-2.5">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm text-gray-900">{sc.name}</span>
                    <span className="text-xs text-gray-400">every {sc.frequencyDays}d</span>
                    <Badge label={statusBadge.label} color={statusBadge.color} />
                  </div>
                  {sc.lastDoneAt && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      Last done: {new Date(sc.lastDoneAt).toLocaleDateString()}
                    </p>
                  )}
                  {sc.notes && <p className="text-xs text-gray-500 mt-0.5">{sc.notes}</p>}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => markScheduleDone(sc.id)}
                    className="flex items-center gap-1 text-xs text-green-600 hover:text-green-800 font-medium border border-green-200 rounded px-2 py-0.5 hover:bg-green-50 transition-colors"
                    title="Mark as done today"
                  >
                    <Check className="w-3.5 h-3.5" /> Done
                  </button>
                  <DeleteBtn onDelete={() => deleteSchedule(sc.id)} />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}

// ── Wardrobe ─────────────────────────────────────────────────────

const WARDROBE_CATEGORY_COLORS: Record<WardrobeCategory, string> = {
  tops: 'bg-blue-100 text-blue-700',
  bottoms: 'bg-indigo-100 text-indigo-700',
  outerwear: 'bg-slate-100 text-slate-700',
  shoes: 'bg-amber-100 text-amber-700',
  accessories: 'bg-pink-100 text-pink-700',
  formal: 'bg-purple-100 text-purple-700',
  other: 'bg-gray-100 text-gray-600',
}

function WardrobeForm({ onSave, onCancel }: {
  onSave: (data: Omit<WardrobeItem, 'id' | 'createdAt'>) => void
  onCancel: () => void
}) {
  const [name, setName] = useState('')
  const [category, setCategory] = useState<WardrobeCategory>('tops')
  const [color, setColor] = useState('')
  const [brand, setBrand] = useState('')
  const [status, setStatus] = useState<WardrobeStatus>('owned')
  const [notes, setNotes] = useState('')
  const [imageUrl, setImageUrl] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    onSave({
      name: name.trim(),
      category,
      color: color.trim() || undefined,
      brand: brand.trim() || undefined,
      status,
      notes: notes.trim() || undefined,
      imageUrl: imageUrl.trim() || undefined,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="bg-gray-50 rounded-lg p-4 space-y-3 mb-4 border border-gray-200">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Name *</label>
          <input className="text-sm border border-gray-200 rounded px-2 py-1.5 outline-none focus:border-blue-400 w-full" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Navy chinos" autoFocus />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Brand</label>
          <input className="text-sm border border-gray-200 rounded px-2 py-1.5 outline-none focus:border-blue-400 w-full" value={brand} onChange={e => setBrand(e.target.value)} placeholder="Brand" />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Category</label>
          <select className="text-sm border border-gray-200 rounded px-2 py-1.5 outline-none focus:border-blue-400 w-full" value={category} onChange={e => setCategory(e.target.value as WardrobeCategory)}>
            <option value="tops">Tops</option>
            <option value="bottoms">Bottoms</option>
            <option value="outerwear">Outerwear</option>
            <option value="shoes">Shoes</option>
            <option value="accessories">Accessories</option>
            <option value="formal">Formal</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Color</label>
          <input className="text-sm border border-gray-200 rounded px-2 py-1.5 outline-none focus:border-blue-400 w-full" value={color} onChange={e => setColor(e.target.value)} placeholder="e.g. Navy" />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Status</label>
          <select className="text-sm border border-gray-200 rounded px-2 py-1.5 outline-none focus:border-blue-400 w-full" value={status} onChange={e => setStatus(e.target.value as WardrobeStatus)}>
            <option value="owned">Owned</option>
            <option value="wishlist">Wishlist</option>
          </select>
        </div>
      </div>
      <div>
        <label className="text-xs text-gray-500 mb-1 block">Image URL</label>
        <input className="text-sm border border-gray-200 rounded px-2 py-1.5 outline-none focus:border-blue-400 w-full" value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="https://…" />
      </div>
      <div>
        <label className="text-xs text-gray-500 mb-1 block">Notes</label>
        <textarea className="text-sm border border-gray-200 rounded px-2 py-1.5 outline-none focus:border-blue-400 w-full resize-none" rows={2} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notes…" />
      </div>
      <div className="flex gap-2 justify-end">
        <button type="button" onClick={onCancel} className="px-4 py-1.5 text-sm text-gray-600 hover:text-gray-900 transition-colors">Cancel</button>
        <button type="submit" className="px-4 py-1.5 bg-gray-900 text-white text-sm rounded hover:bg-gray-700 transition-colors">Save</button>
      </div>
    </form>
  )
}

function WardrobeSection() {
  const { wardrobe, createWardrobeItem, updateWardrobeItem, deleteWardrobeItem } = useAesthetics()
  const [showForm, setShowForm] = useState(false)
  const [categoryFilter, setCategoryFilter] = useState<WardrobeCategory | 'all'>('all')
  const [statusFilter, setStatusFilter] = useState<WardrobeStatus | 'all'>('all')

  const filtered = wardrobe
    .filter(w => categoryFilter === 'all' || w.category === categoryFilter)
    .filter(w => statusFilter === 'all' || w.status === statusFilter)
  const sorted = [...filtered].sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name))

  async function handleSave(data: Omit<WardrobeItem, 'id' | 'createdAt'>) {
    await createWardrobeItem(data)
    setShowForm(false)
  }

  const categories: Array<WardrobeCategory | 'all'> = ['all', 'tops', 'bottoms', 'outerwear', 'shoes', 'accessories', 'formal', 'other']

  return (
    <section className="mb-8">
      <SectionHeader title="Wardrobe" onAdd={() => setShowForm(true)} />
      <div className="flex flex-wrap gap-2 mb-3">
        {categories.map(c => (
          <button
            key={c}
            onClick={() => setCategoryFilter(c)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${categoryFilter === c ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            {c === 'all' ? 'All' : c.charAt(0).toUpperCase() + c.slice(1)}
          </button>
        ))}
        <div className="w-px h-5 bg-gray-200 mx-1 self-center" />
        {(['all', 'owned', 'wishlist'] as const).map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${statusFilter === s ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            {s === 'all' ? 'Any status' : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>
      {showForm && <WardrobeForm onSave={handleSave} onCancel={() => setShowForm(false)} />}
      {sorted.length === 0 ? (
        <p className="text-sm text-gray-400 italic">No items yet.</p>
      ) : (
        <div className="space-y-2">
          {sorted.map(w => (
            <div key={w.id} className="flex items-center gap-3 bg-white border border-gray-100 rounded-lg px-4 py-2.5 hover:border-gray-200 transition-colors">
              {w.imageUrl && (
                <img src={w.imageUrl} alt={w.name} className="w-10 h-10 rounded object-cover shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-sm text-gray-900">{w.name}</span>
                  {w.brand && <span className="text-xs text-gray-400">{w.brand}</span>}
                  {w.color && <span className="text-xs text-gray-400">{w.color}</span>}
                  <Badge label={w.category} color={WARDROBE_CATEGORY_COLORS[w.category]} />
                  {w.status === 'wishlist' && <Badge label="Wishlist" color="bg-indigo-100 text-indigo-700" />}
                </div>
                {w.notes && <p className="text-xs text-gray-500 mt-0.5 truncate">{w.notes}</p>}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {w.status === 'wishlist' && (
                  <button
                    onClick={() => updateWardrobeItem(w.id, { status: 'owned' })}
                    className="flex items-center gap-1 text-xs text-green-600 hover:text-green-800 font-medium border border-green-200 rounded px-2 py-0.5 hover:bg-green-50 transition-colors"
                  >
                    <Check className="w-3.5 h-3.5" /> Own
                  </button>
                )}
                <DeleteBtn onDelete={() => deleteWardrobeItem(w.id)} />
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

// ── Outfits ──────────────────────────────────────────────────────

const SEASON_COLORS: Record<Season, string> = {
  spring: 'bg-green-100 text-green-700',
  summer: 'bg-yellow-100 text-yellow-700',
  fall: 'bg-orange-100 text-orange-700',
  winter: 'bg-blue-100 text-blue-700',
  all: 'bg-gray-100 text-gray-600',
}

function OutfitForm({ onSave, onCancel }: {
  onSave: (data: Omit<OutfitIdea, 'id' | 'createdAt'>) => void
  onCancel: () => void
}) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [occasion, setOccasion] = useState('')
  const [season, setSeason] = useState<Season>('all')
  const [notes, setNotes] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    onSave({
      name: name.trim(),
      description: description.trim() || undefined,
      occasion: occasion.trim() || undefined,
      season,
      notes: notes.trim() || undefined,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="bg-gray-50 rounded-lg p-4 space-y-3 mb-4 border border-gray-200">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Name *</label>
          <input className="text-sm border border-gray-200 rounded px-2 py-1.5 outline-none focus:border-blue-400 w-full" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Smart casual Friday" autoFocus />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Season</label>
          <select className="text-sm border border-gray-200 rounded px-2 py-1.5 outline-none focus:border-blue-400 w-full" value={season} onChange={e => setSeason(e.target.value as Season)}>
            <option value="all">All seasons</option>
            <option value="spring">Spring</option>
            <option value="summer">Summer</option>
            <option value="fall">Fall</option>
            <option value="winter">Winter</option>
          </select>
        </div>
      </div>
      <div>
        <label className="text-xs text-gray-500 mb-1 block">Occasion</label>
        <input className="text-sm border border-gray-200 rounded px-2 py-1.5 outline-none focus:border-blue-400 w-full" value={occasion} onChange={e => setOccasion(e.target.value)} placeholder="e.g. Work, date night, casual" />
      </div>
      <div>
        <label className="text-xs text-gray-500 mb-1 block">Description</label>
        <textarea className="text-sm border border-gray-200 rounded px-2 py-1.5 outline-none focus:border-blue-400 w-full resize-none" rows={2} value={description} onChange={e => setDescription(e.target.value)} placeholder="Describe the outfit…" />
      </div>
      <div>
        <label className="text-xs text-gray-500 mb-1 block">Notes</label>
        <input className="text-sm border border-gray-200 rounded px-2 py-1.5 outline-none focus:border-blue-400 w-full" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notes…" />
      </div>
      <div className="flex gap-2 justify-end">
        <button type="button" onClick={onCancel} className="px-4 py-1.5 text-sm text-gray-600 hover:text-gray-900 transition-colors">Cancel</button>
        <button type="submit" className="px-4 py-1.5 bg-gray-900 text-white text-sm rounded hover:bg-gray-700 transition-colors">Save</button>
      </div>
    </form>
  )
}

function OutfitsSection() {
  const { outfits, createOutfit, deleteOutfit } = useAesthetics()
  const [showForm, setShowForm] = useState(false)
  const [seasonFilter, setSeasonFilter] = useState<Season | 'all'>('all')

  const filtered = seasonFilter === 'all' ? outfits : outfits.filter(o => o.season === seasonFilter || o.season === 'all')
  const sorted = [...filtered].sort((a, b) => a.name.localeCompare(b.name))

  async function handleSave(data: Omit<OutfitIdea, 'id' | 'createdAt'>) {
    await createOutfit(data)
    setShowForm(false)
  }

  return (
    <section className="mb-8">
      <SectionHeader title="Outfit Ideas" onAdd={() => setShowForm(true)} />
      <div className="flex gap-2 mb-3">
        {(['all', 'spring', 'summer', 'fall', 'winter'] as const).map(s => (
          <button
            key={s}
            onClick={() => setSeasonFilter(s)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${seasonFilter === s ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>
      {showForm && <OutfitForm onSave={handleSave} onCancel={() => setShowForm(false)} />}
      {sorted.length === 0 ? (
        <p className="text-sm text-gray-400 italic">No outfit ideas yet.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {sorted.map(o => (
            <div key={o.id} className="bg-white border border-gray-100 rounded-lg p-4 hover:border-gray-200 transition-colors">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm text-gray-900">{o.name}</span>
                    <Badge label={o.season} color={SEASON_COLORS[o.season]} />
                  </div>
                  {o.occasion && <p className="text-xs text-gray-400 mt-0.5">{o.occasion}</p>}
                  {o.description && <p className="text-sm text-gray-600 mt-1">{o.description}</p>}
                  {o.notes && <p className="text-xs text-gray-500 mt-1 italic">{o.notes}</p>}
                </div>
                <DeleteBtn onDelete={() => deleteOutfit(o.id)} />
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

// ── Inspiration ──────────────────────────────────────────────────

const INSPIRATION_COLORS: Record<InspirationCategory, string> = {
  outfit: 'bg-purple-100 text-purple-700',
  grooming: 'bg-blue-100 text-blue-700',
  hair: 'bg-teal-100 text-teal-700',
  general: 'bg-gray-100 text-gray-600',
}

function InspirationForm({ onSave, onCancel }: {
  onSave: (data: Omit<InspirationItem, 'id' | 'createdAt'>) => void
  onCancel: () => void
}) {
  const [title, setTitle] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [sourceUrl, setSourceUrl] = useState('')
  const [category, setCategory] = useState<InspirationCategory>('general')
  const [notes, setNotes] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    onSave({
      title: title.trim(),
      imageUrl: imageUrl.trim() || undefined,
      sourceUrl: sourceUrl.trim() || undefined,
      category,
      notes: notes.trim() || undefined,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="bg-gray-50 rounded-lg p-4 space-y-3 mb-4 border border-gray-200">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Title *</label>
          <input className="text-sm border border-gray-200 rounded px-2 py-1.5 outline-none focus:border-blue-400 w-full" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Clean skincare look" autoFocus />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Category</label>
          <select className="text-sm border border-gray-200 rounded px-2 py-1.5 outline-none focus:border-blue-400 w-full" value={category} onChange={e => setCategory(e.target.value as InspirationCategory)}>
            <option value="general">General</option>
            <option value="outfit">Outfit</option>
            <option value="grooming">Grooming</option>
            <option value="hair">Hair</option>
          </select>
        </div>
      </div>
      <div>
        <label className="text-xs text-gray-500 mb-1 block">Image URL</label>
        <input className="text-sm border border-gray-200 rounded px-2 py-1.5 outline-none focus:border-blue-400 w-full" value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="https://…" />
      </div>
      <div>
        <label className="text-xs text-gray-500 mb-1 block">Source URL</label>
        <input className="text-sm border border-gray-200 rounded px-2 py-1.5 outline-none focus:border-blue-400 w-full" value={sourceUrl} onChange={e => setSourceUrl(e.target.value)} placeholder="https://…" />
      </div>
      <div>
        <label className="text-xs text-gray-500 mb-1 block">Notes</label>
        <textarea className="text-sm border border-gray-200 rounded px-2 py-1.5 outline-none focus:border-blue-400 w-full resize-none" rows={2} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notes…" />
      </div>
      <div className="flex gap-2 justify-end">
        <button type="button" onClick={onCancel} className="px-4 py-1.5 text-sm text-gray-600 hover:text-gray-900 transition-colors">Cancel</button>
        <button type="submit" className="px-4 py-1.5 bg-gray-900 text-white text-sm rounded hover:bg-gray-700 transition-colors">Save</button>
      </div>
    </form>
  )
}

function InspirationBoard() {
  const { inspiration, createInspirationItem, deleteInspirationItem } = useAesthetics()
  const [showForm, setShowForm] = useState(false)
  const [filter, setFilter] = useState<InspirationCategory | 'all'>('all')

  const filtered = filter === 'all' ? inspiration : inspiration.filter(i => i.category === filter)

  async function handleSave(data: Omit<InspirationItem, 'id' | 'createdAt'>) {
    await createInspirationItem(data)
    setShowForm(false)
  }

  return (
    <section>
      <SectionHeader title="Board" onAdd={() => setShowForm(true)} />
      <div className="flex gap-2 mb-3">
        {(['all', 'outfit', 'grooming', 'hair', 'general'] as const).map(c => (
          <button
            key={c}
            onClick={() => setFilter(c)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${filter === c ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            {c === 'all' ? 'All' : c.charAt(0).toUpperCase() + c.slice(1)}
          </button>
        ))}
      </div>
      {showForm && <InspirationForm onSave={handleSave} onCancel={() => setShowForm(false)} />}
      {filtered.length === 0 ? (
        <p className="text-sm text-gray-400 italic">No inspiration yet.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {filtered.map(item => (
            <div key={item.id} className="bg-white border border-gray-100 rounded-lg overflow-hidden hover:border-gray-200 transition-colors group">
              {item.imageUrl ? (
                <div className="relative">
                  <img src={item.imageUrl} alt={item.title} className="w-full h-40 object-cover" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                </div>
              ) : (
                <div className="w-full h-24 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                  <span className="text-3xl">✦</span>
                </div>
              )}
              <div className="p-3">
                <div className="flex items-start justify-between gap-1">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{item.title}</p>
                    <div className="flex items-center gap-1 mt-1 flex-wrap">
                      <Badge label={item.category} color={INSPIRATION_COLORS[item.category]} />
                    </div>
                    {item.notes && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{item.notes}</p>}
                  </div>
                  <div className="flex flex-col gap-1 shrink-0">
                    {item.sourceUrl && (
                      <a href={item.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-blue-500 transition-colors">
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                    <DeleteBtn onDelete={() => deleteInspirationItem(item.id)} />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

// ── Root ─────────────────────────────────────────────────────────

export function AestheticsModule() {
  const { load } = useAesthetics()
  const [tab, setTab] = useState<Tab>('grooming')

  useEffect(() => { load() }, [load])

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Aesthetics</h1>
        <p className="text-sm text-gray-500">Grooming routines, wardrobe, and style inspiration.</p>
      </div>

      <PhilosophyBox moduleId="aesthetics" />

      {/* Sub-navigation */}
      <div className="flex gap-1 mb-8 border-b border-gray-200">
        {([
          { id: 'grooming', label: 'Grooming' },
          { id: 'wardrobe', label: 'Wardrobe' },
          { id: 'inspiration', label: 'Inspiration' },
        ] as const).map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-5 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${tab === t.id ? 'border-gray-900 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'grooming' && (
        <>
          <ProductsSection />
          <RoutinesSection />
          <SchedulesSection />
        </>
      )}

      {tab === 'wardrobe' && (
        <>
          <WardrobeSection />
          <OutfitsSection />
        </>
      )}

      {tab === 'inspiration' && (
        <InspirationBoard />
      )}
    </div>
  )
}
