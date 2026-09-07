import { useState } from 'react'
import {
  Plus, X, Pencil, Trash2, Phone, Globe, MapPin, CalendarCheck,
  Archive, RotateCcw, Star, AlertCircle,
} from 'lucide-react'
import { PhilosophyBox } from '../../../core/PhilosophyBox'
import { useServiceProviders, daysUntilDue } from '../hooks/useServiceProviders'
import type { ProviderCategory, ServiceProvider } from '../types'

const CATEGORY_LABELS: Record<ProviderCategory, string> = {
  medical: 'Medical',
  dental: 'Dental',
  vision: 'Vision',
  mental_health: 'Mental Health',
  hair: 'Hair',
  massage: 'Massage & Bodywork',
  fitness: 'Fitness',
  beauty: 'Beauty & Grooming',
  home: 'Home & Trades',
  auto: 'Auto',
  financial: 'Financial',
  legal: 'Legal',
  pet: 'Pet',
  other: 'Other',
}

const CATEGORY_ORDER = Object.keys(CATEGORY_LABELS) as ProviderCategory[]

interface FormState {
  name: string
  category: ProviderCategory
  specialty: string
  phone: string
  email: string
  website: string
  bookingUrl: string
  address: string
  preferences: string
  lastVisit: string
  frequencyDays: string
  typicalCost: string
  rating: string
  notes: string
}

const EMPTY_FORM: FormState = {
  name: '', category: 'medical', specialty: '', phone: '', email: '', website: '',
  bookingUrl: '', address: '', preferences: '', lastVisit: '', frequencyDays: '',
  typicalCost: '', rating: '', notes: '',
}

function providerToForm(p: ServiceProvider): FormState {
  return {
    name: p.name,
    category: p.category,
    specialty: p.specialty ?? '',
    phone: p.phone ?? '',
    email: p.email ?? '',
    website: p.website ?? '',
    bookingUrl: p.bookingUrl ?? '',
    address: p.address ?? '',
    preferences: p.preferences ?? '',
    lastVisit: p.lastVisit ?? '',
    frequencyDays: p.frequencyDays != null ? String(p.frequencyDays) : '',
    typicalCost: p.typicalCost != null ? String(p.typicalCost) : '',
    rating: p.rating != null ? String(p.rating) : '',
    notes: p.notes ?? '',
  }
}

const FREQUENCY_PRESETS: { label: string; days: number }[] = [
  { label: 'Monthly', days: 30 },
  { label: 'Every 6 weeks', days: 42 },
  { label: 'Quarterly', days: 90 },
  { label: 'Twice a year', days: 182 },
  { label: 'Yearly', days: 365 },
]

export function ServiceProvidersModule() {
  const {
    filtered, grouped, dueSoon, loading,
    search, setSearch, filterCategory, setFilterCategory,
    showArchived, setShowArchived,
    create, update, remove, logVisit,
  } = useServiceProviders()

  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  function patch(p: Partial<FormState>) { setForm(f => ({ ...f, ...p })) }

  function startAdd() {
    setForm(EMPTY_FORM)
    setEditingId(null)
    setShowForm(true)
  }

  function startEdit(p: ServiceProvider) {
    setForm(providerToForm(p))
    setEditingId(p.id)
    setShowForm(true)
  }

  function closeForm() {
    setShowForm(false)
    setEditingId(null)
    setForm(EMPTY_FORM)
  }

  async function handleSubmit() {
    if (!form.name.trim()) return
    const payload = {
      name: form.name.trim(),
      category: form.category,
      specialty: form.specialty.trim() || undefined,
      phone: form.phone.trim() || undefined,
      email: form.email.trim() || undefined,
      website: form.website.trim() || undefined,
      bookingUrl: form.bookingUrl.trim() || undefined,
      address: form.address.trim() || undefined,
      preferences: form.preferences.trim() || undefined,
      lastVisit: form.lastVisit || undefined,
      frequencyDays: form.frequencyDays ? Number(form.frequencyDays) : undefined,
      typicalCost: form.typicalCost ? Number(form.typicalCost) : undefined,
      rating: form.rating ? Number(form.rating) : undefined,
      notes: form.notes.trim() || undefined,
    }
    if (editingId) await update(editingId, payload)
    else await create(payload)
    closeForm()
  }

  const inputCls = 'text-sm border border-gray-200 rounded px-3 py-2 outline-none focus:border-blue-400 w-full'

  return (
    <div className="max-w-4xl mx-auto px-4 py-4 sm:px-6 sm:py-8">
      <div className="flex items-center justify-between mb-4 gap-3">
        <h1 className="text-xl font-semibold text-gray-900">Service Providers</h1>
        {!showForm && (
          <button
            onClick={startAdd}
            className="flex items-center gap-1.5 text-sm px-2.5 py-2 sm:px-3 sm:py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add provider</span>
          </button>
        )}
      </div>

      <PhilosophyBox moduleId="service-providers" />

      {/* Due soon */}
      {!showArchived && dueSoon.length > 0 && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-4 h-4 text-amber-500" />
            <span className="text-sm font-semibold text-amber-800">Due soon</span>
          </div>
          <div className="space-y-1">
            {dueSoon.map(({ provider, days }) => (
              <div key={provider.id} className="flex items-center justify-between text-sm">
                <span className="text-gray-700">
                  {provider.name}
                  <span className="text-gray-400 ml-2 text-xs">{CATEGORY_LABELS[provider.category]}</span>
                </span>
                <span className={days < 0 ? 'text-red-500 font-medium text-xs' : 'text-amber-600 text-xs'}>
                  {days < 0 ? `${Math.abs(days)}d overdue` : days === 0 ? 'Due now' : `in ${days}d`}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <input
          type="text"
          placeholder="Search providers, specialties, preferences…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="text-sm border border-gray-200 rounded px-3 py-2.5 sm:py-1.5 outline-none focus:border-blue-400 flex-1"
        />
        <select
          value={filterCategory}
          onChange={e => setFilterCategory(e.target.value as ProviderCategory | 'all')}
          className="text-sm border border-gray-200 rounded px-3 py-2.5 sm:py-1.5 text-gray-600 outline-none focus:border-blue-400 bg-white"
        >
          <option value="all">All categories</option>
          {CATEGORY_ORDER.map(c => <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>)}
        </select>
        <button
          onClick={() => setShowArchived(!showArchived)}
          className={`text-sm px-3 py-2.5 sm:py-1.5 rounded border transition-colors ${
            showArchived ? 'border-gray-300 bg-gray-100 text-gray-700' : 'border-gray-200 text-gray-500 hover:bg-gray-50'
          }`}
        >
          {showArchived ? 'Archived' : 'Active'}
        </button>
      </div>

      {/* Add / edit form */}
      {showForm && (
        <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-800">{editingId ? 'Edit provider' : 'Add provider'}</h2>
            <button onClick={closeForm} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <input className={inputCls} placeholder="Name (e.g. Zen Wellness Spa)" value={form.name} onChange={e => patch({ name: e.target.value })} autoFocus />
            <select className={`${inputCls} bg-white`} value={form.category} onChange={e => patch({ category: e.target.value as ProviderCategory })}>
              {CATEGORY_ORDER.map(c => <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>)}
            </select>
            <input className={inputCls} placeholder="Specialty / practitioner (e.g. Dr. Chen — GP)" value={form.specialty} onChange={e => patch({ specialty: e.target.value })} />
            <input className={inputCls} placeholder="Phone" value={form.phone} onChange={e => patch({ phone: e.target.value })} />
            <input className={inputCls} placeholder="Address" value={form.address} onChange={e => patch({ address: e.target.value })} />
            <input className={inputCls} placeholder="Email" value={form.email} onChange={e => patch({ email: e.target.value })} />
            <input className={inputCls} placeholder="Website" value={form.website} onChange={e => patch({ website: e.target.value })} />
            <input className={inputCls} placeholder="Booking URL" value={form.bookingUrl} onChange={e => patch({ bookingUrl: e.target.value })} />

            <div className="sm:col-span-2">
              <label className="text-xs text-gray-500 block mb-1">
                My usual — what an agent needs to book correctly
              </label>
              <textarea
                className={`${inputCls} resize-none`}
                rows={3}
                placeholder="e.g. 60min deep tissue with Maria, firm pressure, arrive 10 min early, they validate parking"
                value={form.preferences}
                onChange={e => patch({ preferences: e.target.value })}
              />
            </div>

            <div>
              <label className="text-xs text-gray-500 block mb-1">Last visit</label>
              <input type="date" className={inputCls} value={form.lastVisit} onChange={e => patch({ lastVisit: e.target.value })} />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Go every (days)</label>
              <div className="flex gap-2">
                <input type="number" min={1} className={inputCls} placeholder="e.g. 90" value={form.frequencyDays} onChange={e => patch({ frequencyDays: e.target.value })} />
                <select
                  className="text-sm border border-gray-200 rounded px-2 py-2 outline-none focus:border-blue-400 bg-white text-gray-500 shrink-0"
                  value=""
                  onChange={e => e.target.value && patch({ frequencyDays: e.target.value })}
                >
                  <option value="">Preset</option>
                  {FREQUENCY_PRESETS.map(p => <option key={p.days} value={p.days}>{p.label}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Typical cost ($)</label>
              <input type="number" min={0} className={inputCls} placeholder="e.g. 120" value={form.typicalCost} onChange={e => patch({ typicalCost: e.target.value })} />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Rating (1–5)</label>
              <input type="number" min={1} max={5} className={inputCls} placeholder="e.g. 5" value={form.rating} onChange={e => patch({ rating: e.target.value })} />
            </div>
            <input className={`${inputCls} sm:col-span-2`} placeholder="Notes" value={form.notes} onChange={e => patch({ notes: e.target.value })} />
          </div>
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 mt-3">
            <button onClick={closeForm} className="text-sm px-3 py-2.5 sm:py-1.5 text-gray-500 hover:text-gray-700">Cancel</button>
            <button
              onClick={handleSubmit}
              disabled={!form.name.trim()}
              className="text-sm px-3 py-2.5 sm:py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-40"
            >
              {editingId ? 'Save changes' : 'Add provider'}
            </button>
          </div>
        </div>
      )}

      {/* List */}
      {loading ? (
        <p className="text-sm text-gray-400 text-center py-12">Loading…</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-16">
          {showArchived ? 'No archived providers.' : 'No providers yet. Add your doctor, dentist, hairdresser and the rest.'}
        </p>
      ) : (
        <div className="space-y-6">
          {CATEGORY_ORDER.filter(c => grouped.has(c)).map(category => (
            <div key={category}>
              <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
                {CATEGORY_LABELS[category]}
              </h2>
              <div className="space-y-2">
                {(grouped.get(category) ?? []).map(p => {
                  const due = daysUntilDue(p)
                  return (
                    <div key={p.id} className="rounded-lg border border-gray-200 bg-white p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-semibold text-gray-800">{p.name}</span>
                            {p.rating != null && (
                              <span className="flex items-center gap-0.5 text-xs text-amber-600">
                                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />{p.rating}
                              </span>
                            )}
                            {due !== null && (
                              <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                                due < 0 ? 'bg-red-50 text-red-600' :
                                due <= 14 ? 'bg-amber-50 text-amber-700' : 'bg-gray-100 text-gray-500'
                              }`}>
                                {due < 0 ? `${Math.abs(due)}d overdue` : due === 0 ? 'Due now' : `Due in ${due}d`}
                              </span>
                            )}
                          </div>
                          {p.specialty && <div className="text-xs text-gray-500 mt-0.5">{p.specialty}</div>}
                          {p.preferences && (
                            <div className="mt-2 text-sm text-gray-600 bg-gray-50 border border-gray-100 rounded px-3 py-2">
                              {p.preferences}
                            </div>
                          )}
                          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-400">
                            {p.phone && (
                              <a href={`tel:${p.phone}`} className="flex items-center gap-1 hover:text-blue-600">
                                <Phone className="w-3 h-3" />{p.phone}
                              </a>
                            )}
                            {p.address && (
                              <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{p.address}</span>
                            )}
                            {p.bookingUrl && (
                              <a href={p.bookingUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-blue-500 hover:text-blue-700">
                                <Globe className="w-3 h-3" />Book
                              </a>
                            )}
                            {p.typicalCost != null && <span>~${p.typicalCost}</span>}
                            {p.lastVisit && <span>Last: {new Date(p.lastVisit + 'T00:00:00').toLocaleDateString()}</span>}
                          </div>
                          {p.notes && <div className="text-xs text-gray-400 italic mt-1">{p.notes}</div>}
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          {!showArchived && (
                            <button onClick={() => logVisit(p.id)} title="Log a visit today" className="p-2 rounded-md text-gray-300 hover:text-green-600 hover:bg-green-50">
                              <CalendarCheck className="w-4 h-4" />
                            </button>
                          )}
                          <button onClick={() => startEdit(p)} title="Edit" className="p-2 rounded-md text-gray-300 hover:text-blue-500 hover:bg-blue-50">
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => update(p.id, { archived: !p.archived })}
                            title={p.archived ? 'Unarchive' : 'Archive'}
                            className="p-2 rounded-md text-gray-300 hover:text-amber-600 hover:bg-amber-50"
                          >
                            {p.archived ? <RotateCcw className="w-4 h-4" /> : <Archive className="w-4 h-4" />}
                          </button>
                          {confirmDelete === p.id ? (
                            <span className="flex items-center gap-1 text-xs px-1">
                              <button onClick={() => { remove(p.id); setConfirmDelete(null) }} className="text-red-500 hover:text-red-700 font-medium">Yes</button>
                              <button onClick={() => setConfirmDelete(null)} className="text-gray-400 hover:text-gray-600">No</button>
                            </span>
                          ) : (
                            <button onClick={() => setConfirmDelete(p.id)} title="Delete" className="p-2 rounded-md text-gray-300 hover:text-red-500 hover:bg-red-50">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
