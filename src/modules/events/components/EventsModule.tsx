import { useEffect, useState } from 'react'
import { Plus, Bell, BellOff, ExternalLink, Pencil, Trash2, X, Check, CalendarDays, Star } from 'lucide-react'
import { PhilosophyBox } from '../../../core/PhilosophyBox'
import { useEventsStore } from '../store'
import { EVENT_CATEGORIES, EVENT_STATUSES } from '../schema'
import type { CalendarEvent, EventCategory, EventStatus, EventType } from '../types'
import type { z } from 'zod'
import type { CreateEventSchema } from '../schema'

type View = 'upcoming' | 'goal'

// ── Helpers ──────────────────────────────────────────────────────────────────

const CATEGORY_COLORS: Record<EventCategory, string> = {
  music:      'bg-pink-100 text-pink-700',
  sports:     'bg-green-100 text-green-700',
  conference: 'bg-blue-100 text-blue-700',
  festival:   'bg-yellow-100 text-yellow-700',
  theatre:    'bg-purple-100 text-purple-700',
  comedy:     'bg-orange-100 text-orange-700',
  art:        'bg-rose-100 text-rose-700',
  food:       'bg-amber-100 text-amber-700',
  film:       'bg-cyan-100 text-cyan-700',
  other:      'bg-gray-100 text-gray-600',
}

const STATUS_COLORS: Record<EventStatus, string> = {
  confirmed:  'bg-emerald-100 text-emerald-700',
  interested: 'bg-blue-100 text-blue-700',
  sold_out:   'bg-red-100 text-red-600',
  alert_set:  'bg-violet-100 text-violet-700',
}

const STATUS_LABELS: Record<EventStatus, string> = {
  confirmed:  'Confirmed',
  interested: 'Interested',
  sold_out:   'Sold Out',
  alert_set:  'Alert Set',
}

function formatDate(date?: string, endDate?: string): string {
  if (!date) return 'TBC'
  const d = new Date(date + 'T00:00:00')
  const formatted = d.toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
  if (!endDate || endDate === date) return formatted
  const d2 = new Date(endDate + 'T00:00:00')
  const formatted2 = d2.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })
  return `${formatted} – ${formatted2}`
}

function isPast(date?: string): boolean {
  if (!date) return false
  return date < new Date().toISOString().slice(0, 10)
}

function daysUntil(date?: string): string {
  if (!date) return ''
  const today = new Date().toISOString().slice(0, 10)
  if (date < today) {
    const days = Math.floor((new Date(today + 'T00:00:00').getTime() - new Date(date + 'T00:00:00').getTime()) / 86400000)
    return `${days}d ago`
  }
  const days = Math.floor((new Date(date + 'T00:00:00').getTime() - new Date(today + 'T00:00:00').getTime()) / 86400000)
  if (days === 0) return 'Today!'
  if (days === 1) return 'Tomorrow'
  return `In ${days}d`
}

// ── Blank form state ──────────────────────────────────────────────────────────

function blankForm(type: EventType) {
  return {
    name: '',
    type,
    date: '',
    endDate: '',
    venue: '',
    location: '',
    category: 'other' as EventCategory,
    status: (type === 'upcoming' ? 'interested' : 'interested') as EventStatus,
    url: '',
    price: '',
    alertEnabled: false,
    notes: '',
  }
}

type FormState = ReturnType<typeof blankForm>

// ── Add / Edit form ───────────────────────────────────────────────────────────

function EventForm({ initial, onSave, onCancel }: {
  initial: FormState
  onSave: (f: FormState) => void
  onCancel: () => void
}) {
  const [f, setF] = useState(initial)
  const set = (k: keyof FormState, v: FormState[keyof FormState]) => setF(prev => ({ ...prev, [k]: v }))

  return (
    <div className="bg-white border border-blue-200 rounded-lg p-4 mb-4 shadow-sm space-y-3">
      <input
        autoFocus
        type="text"
        placeholder="Event name *"
        value={f.name}
        onChange={e => set('name', e.target.value)}
        className="w-full text-sm font-medium outline-none placeholder-gray-400 text-gray-800"
      />

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Category</label>
          <select value={f.category} onChange={e => set('category', e.target.value as EventCategory)}
            className="w-full text-sm border border-gray-200 rounded px-2 py-1.5 outline-none focus:border-blue-400">
            {EVENT_CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Status</label>
          <select value={f.status} onChange={e => set('status', e.target.value as EventStatus)}
            className="w-full text-sm border border-gray-200 rounded px-2 py-1.5 outline-none focus:border-blue-400">
            {EVENT_STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Date</label>
          <input type="date" value={f.date} onChange={e => set('date', e.target.value)}
            className="w-full text-sm border border-gray-200 rounded px-2 py-1.5 outline-none focus:border-blue-400 text-gray-600" />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">End Date (multi-day)</label>
          <input type="date" value={f.endDate} onChange={e => set('endDate', e.target.value)}
            className="w-full text-sm border border-gray-200 rounded px-2 py-1.5 outline-none focus:border-blue-400 text-gray-600" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Venue</label>
          <input type="text" placeholder="e.g. Madison Square Garden" value={f.venue} onChange={e => set('venue', e.target.value)}
            className="w-full text-sm border border-gray-200 rounded px-2 py-1.5 outline-none focus:border-blue-400 text-gray-600 placeholder-gray-400" />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Location / City</label>
          <input type="text" placeholder="e.g. New York, USA" value={f.location} onChange={e => set('location', e.target.value)}
            className="w-full text-sm border border-gray-200 rounded px-2 py-1.5 outline-none focus:border-blue-400 text-gray-600 placeholder-gray-400" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Ticket / Info URL</label>
          <input type="url" placeholder="https://..." value={f.url} onChange={e => set('url', e.target.value)}
            className="w-full text-sm border border-gray-200 rounded px-2 py-1.5 outline-none focus:border-blue-400 text-gray-600 placeholder-gray-400" />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Expected Price ($)</label>
          <input type="number" placeholder="0" value={f.price} onChange={e => set('price', e.target.value)}
            className="w-full text-sm border border-gray-200 rounded px-2 py-1.5 outline-none focus:border-blue-400 text-gray-600 placeholder-gray-400" />
        </div>
      </div>

      <textarea
        placeholder="Notes"
        value={f.notes}
        onChange={e => set('notes', e.target.value)}
        rows={2}
        className="w-full text-sm border border-gray-200 rounded px-2 py-1.5 outline-none focus:border-blue-400 text-gray-600 resize-none placeholder-gray-400"
      />

      <label className="flex items-center gap-2 cursor-pointer select-none">
        <input type="checkbox" checked={f.alertEnabled} onChange={e => set('alertEnabled', e.target.checked)}
          className="rounded" />
        <Bell className="w-4 h-4 text-violet-500" />
        <span className="text-sm text-gray-700">Alert me when tickets become available</span>
      </label>

      <div className="flex justify-end gap-2 pt-1">
        <button onClick={onCancel} className="text-sm px-3 py-1.5 text-gray-500 hover:text-gray-700">Cancel</button>
        <button
          onClick={() => f.name.trim() && onSave(f)}
          disabled={!f.name.trim()}
          className="flex items-center gap-1.5 text-sm px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-40"
        >
          <Check className="w-3.5 h-3.5" /> Save
        </button>
      </div>
    </div>
  )
}

// ── Event card (goal list) ────────────────────────────────────────────────────

function GoalCard({ event, onEdit, onDelete, onToggleAlert }: {
  event: CalendarEvent
  onEdit: () => void
  onDelete: () => void
  onToggleAlert: () => void
}) {
  const [confirmDelete, setConfirmDelete] = useState(false)

  return (
    <div className={`bg-white border rounded-lg p-4 space-y-2 ${event.status === 'sold_out' ? 'opacity-60 border-gray-200' : 'border-gray-200 hover:border-blue-200'} transition-colors`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-gray-800 text-sm">{event.name}</span>
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${CATEGORY_COLORS[event.category]}`}>
              {event.category}
            </span>
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${STATUS_COLORS[event.status]}`}>
              {STATUS_LABELS[event.status]}
            </span>
          </div>
          {(event.venue || event.location) && (
            <p className="text-xs text-gray-400 mt-0.5">
              {[event.venue, event.location].filter(Boolean).join(' · ')}
            </p>
          )}
          {event.date && (
            <p className="text-xs text-gray-400">{formatDate(event.date, event.endDate)}</p>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={onToggleAlert}
            title={event.alertEnabled ? 'Disable ticket alert' : 'Enable ticket alert'}
            className={`p-1.5 rounded-md transition-colors ${event.alertEnabled ? 'text-violet-600 bg-violet-50 hover:bg-violet-100' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'}`}
          >
            {event.alertEnabled ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
          </button>
          {event.url && (
            <a href={event.url} target="_blank" rel="noopener noreferrer"
              className="p-1.5 rounded-md text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
          <button onClick={onEdit} className="p-1.5 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-50">
            <Pencil className="w-3.5 h-3.5" />
          </button>
          {confirmDelete ? (
            <span className="flex items-center gap-1">
              <button onClick={onDelete} className="text-xs px-1.5 py-0.5 bg-red-500 text-white rounded hover:bg-red-600">Yes</button>
              <button onClick={() => setConfirmDelete(false)} className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded hover:bg-gray-200">No</button>
            </span>
          ) : (
            <button onClick={() => setConfirmDelete(true)} className="p-1.5 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
      {event.price !== undefined && (
        <p className="text-xs text-gray-500">Expected: ${event.price.toLocaleString()}</p>
      )}
      {event.notes && <p className="text-xs text-gray-500 italic">{event.notes}</p>}
      {event.alertEnabled && (
        <div className="flex items-center gap-1.5 text-xs text-violet-600 bg-violet-50 rounded px-2 py-1">
          <Bell className="w-3 h-3" /> Agent will alert when tickets become available
        </div>
      )}
    </div>
  )
}

// ── Upcoming row ──────────────────────────────────────────────────────────────

function UpcomingRow({ event, onEdit, onDelete }: {
  event: CalendarEvent
  onEdit: () => void
  onDelete: () => void
}) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const past = isPast(event.date)
  const countdown = daysUntil(event.date)

  return (
    <tr className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${past ? 'opacity-50' : ''}`}>
      <td className="px-4 py-3">
        <div className="font-medium text-gray-800 text-sm">{event.name}</div>
        {event.venue && <div className="text-xs text-gray-400">{event.venue}</div>}
      </td>
      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
        {formatDate(event.date, event.endDate)}
        {countdown && (
          <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${
            countdown === 'Today!' ? 'bg-emerald-100 text-emerald-700' :
            countdown.includes('ago') ? 'bg-gray-100 text-gray-500' :
            'bg-blue-50 text-blue-600'
          }`}>{countdown}</span>
        )}
      </td>
      <td className="px-4 py-3 text-sm text-gray-500">{event.location ?? <span className="text-gray-300">—</span>}</td>
      <td className="px-4 py-3">
        <span className={`text-xs px-1.5 py-0.5 rounded-full ${CATEGORY_COLORS[event.category]}`}>{event.category}</span>
      </td>
      <td className="px-4 py-3">
        <span className={`text-xs px-1.5 py-0.5 rounded-full ${STATUS_COLORS[event.status]}`}>{STATUS_LABELS[event.status]}</span>
      </td>
      <td className="px-4 py-3 text-right whitespace-nowrap" onClick={e => e.stopPropagation()}>
        <span className="inline-flex items-center gap-2">
          {event.url && (
            <a href={event.url} target="_blank" rel="noopener noreferrer"
              className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-0.5">
              Tickets <ExternalLink className="w-3 h-3" />
            </a>
          )}
          <button onClick={onEdit} className="text-xs text-gray-500 hover:text-gray-700">Edit</button>
          {confirmDelete ? (
            <span className="flex items-center gap-1">
              <button onClick={onDelete} className="text-xs px-1.5 py-0.5 bg-red-500 text-white rounded hover:bg-red-600">Yes</button>
              <button onClick={() => setConfirmDelete(false)} className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded hover:bg-gray-200">No</button>
            </span>
          ) : (
            <button onClick={() => setConfirmDelete(true)} className="text-xs text-red-400 hover:text-red-600">Delete</button>
          )}
        </span>
      </td>
    </tr>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function EventsModule() {
  const { events, load, create, update, remove } = useEventsStore()
  const [view, setView] = useState<View>('upcoming')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [filterCategory, setFilterCategory] = useState<EventCategory | ''>('')

  useEffect(() => { load() }, [load])

  const upcoming = events
    .filter(e => e.type === 'upcoming')
    .sort((a, b) => (a.date ?? 'z') < (b.date ?? 'z') ? -1 : 1)

  const goals = events
    .filter(e => e.type === 'goal')
    .filter(e => !filterCategory || e.category === filterCategory)
    .sort((a, b) => {
      // alert-enabled first, then by name
      if (a.alertEnabled !== b.alertEnabled) return a.alertEnabled ? -1 : 1
      return a.name.localeCompare(b.name)
    })

  const alertCount = events.filter(e => e.type === 'goal' && e.alertEnabled).length

  async function handleSave(f: FormState) {
    const payload = {
      name: f.name.trim(),
      type: f.type,
      date: f.date || undefined,
      endDate: f.endDate || undefined,
      venue: f.venue.trim() || undefined,
      location: f.location.trim() || undefined,
      category: f.category,
      status: f.status,
      url: f.url.trim() || undefined,
      price: f.price !== '' ? Number(f.price) : undefined,
      alertEnabled: f.alertEnabled,
      notes: f.notes.trim() || undefined,
    }
    if (editingId) {
      await update(editingId, payload)
      setEditingId(null)
    } else {
      await create(payload as z.infer<typeof CreateEventSchema>)
      setShowForm(false)
    }
  }

  function startEdit(event: CalendarEvent) {
    setEditingId(event.id)
    setShowForm(false)
  }

  function formInitialFromEvent(event: CalendarEvent): FormState {
    return {
      name: event.name,
      type: event.type,
      date: event.date ?? '',
      endDate: event.endDate ?? '',
      venue: event.venue ?? '',
      location: event.location ?? '',
      category: event.category,
      status: event.status,
      url: event.url ?? '',
      price: event.price !== undefined ? String(event.price) : '',
      alertEnabled: event.alertEnabled,
      notes: event.notes ?? '',
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-semibold text-gray-900">Events</h1>
          <div className="flex rounded-md border border-gray-200 overflow-hidden text-sm">
            <button
              onClick={() => { setView('upcoming'); setShowForm(false); setEditingId(null) }}
              className={`px-3 py-1.5 flex items-center gap-1.5 ${view === 'upcoming' ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              Upcoming
              {upcoming.length > 0 && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${view === 'upcoming' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}`}>
                  {upcoming.length}
                </span>
              )}
            </button>
            <button
              onClick={() => { setView('goal'); setShowForm(false); setEditingId(null) }}
              className={`px-3 py-1.5 border-l border-gray-200 flex items-center gap-1.5 ${view === 'goal' ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
            >
              <Star className="w-3.5 h-3.5" />
              Goal List
              {goals.length > 0 && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${view === 'goal' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}`}>
                  {goals.length}
                </span>
              )}
            </button>
          </div>
          {alertCount > 0 && (
            <span className="flex items-center gap-1 text-xs text-violet-600 bg-violet-50 px-2 py-1 rounded-full">
              <Bell className="w-3 h-3" /> {alertCount} alert{alertCount !== 1 ? 's' : ''} active
            </span>
          )}
        </div>
        {!showForm && !editingId && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 text-sm px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" /> Add event
          </button>
        )}
      </div>

      <PhilosophyBox moduleId="events" />

      {/* Add form */}
      {showForm && (
        <EventForm
          initial={blankForm(view)}
          onSave={handleSave}
          onCancel={() => setShowForm(false)}
        />
      )}

      {/* ── Upcoming view ── */}
      {view === 'upcoming' && (
        <>
          {upcoming.length === 0 && !showForm ? (
            <p className="text-center text-gray-400 text-sm py-16">No upcoming events. Add one above.</p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-left">
                    <th className="px-4 py-3 font-medium text-gray-600">Event</th>
                    <th className="px-4 py-3 font-medium text-gray-600">Date</th>
                    <th className="px-4 py-3 font-medium text-gray-600">Location</th>
                    <th className="px-4 py-3 font-medium text-gray-600">Category</th>
                    <th className="px-4 py-3 font-medium text-gray-600">Status</th>
                    <th className="px-4 py-3 font-medium text-gray-600 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {upcoming.map(event =>
                    editingId === event.id ? (
                      <tr key={event.id}>
                        <td colSpan={6} className="px-4 py-3">
                          <EventForm
                            initial={formInitialFromEvent(event)}
                            onSave={handleSave}
                            onCancel={() => setEditingId(null)}
                          />
                        </td>
                      </tr>
                    ) : (
                      <UpcomingRow
                        key={event.id}
                        event={event}
                        onEdit={() => startEdit(event)}
                        onDelete={() => remove(event.id)}
                      />
                    )
                  )}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* ── Goal list view ── */}
      {view === 'goal' && (
        <>
          <div className="flex items-center gap-3 mb-4">
            <select
              value={filterCategory}
              onChange={e => setFilterCategory(e.target.value as EventCategory | '')}
              className="text-sm border border-gray-200 rounded px-2 py-1.5 outline-none focus:border-blue-400 text-gray-600"
            >
              <option value="">All categories</option>
              {EVENT_CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
            </select>
            <span className="text-xs text-gray-400">
              Toggle <Bell className="inline w-3 h-3" /> to let the agent monitor for tickets
            </span>
          </div>

          {goals.length === 0 && !showForm ? (
            <p className="text-center text-gray-400 text-sm py-16">No goal events yet. Add events you want to attend.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {goals.map(event =>
                editingId === event.id ? (
                  <div key={event.id} className="col-span-full">
                    <EventForm
                      initial={formInitialFromEvent(event)}
                      onSave={handleSave}
                      onCancel={() => setEditingId(null)}
                    />
                  </div>
                ) : (
                  <GoalCard
                    key={event.id}
                    event={event}
                    onEdit={() => startEdit(event)}
                    onDelete={() => remove(event.id)}
                    onToggleAlert={() => update(event.id, { alertEnabled: !event.alertEnabled })}
                  />
                )
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
