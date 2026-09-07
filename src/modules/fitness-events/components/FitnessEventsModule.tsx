import { useState } from 'react'
import {
  Plus, Bell, BellOff, ExternalLink, Pencil, Trash2, Check,
  CalendarDays, Star, Repeat, ClipboardCheck, Trophy, Timer,
} from 'lucide-react'
import { PhilosophyBox } from '../../../core/PhilosophyBox'
import { FITNESS_EVENT_CATEGORIES, FITNESS_EVENT_STATUSES } from '../schema'
import { useFitnessEvents, registrationInfo, registrationLabel, daysUntil } from '../hooks/useFitnessEvents'
import type { FitnessEvent, FitnessEventCategory, FitnessEventStatus, FitnessEventType } from '../types'

type View = 'upcoming' | 'goal'

const CATEGORY_LABELS: Record<FitnessEventCategory, string> = {
  running:    'Running',
  trail:      'Trail',
  cycling:    'Cycling',
  swimming:   'Swimming',
  triathlon:  'Triathlon',
  obstacle:   'Obstacle',
  hyrox:      'Hyrox',
  strength:   'Strength',
  team_sport: 'Team Sport',
  other:      'Other',
}

const CATEGORY_COLORS: Record<FitnessEventCategory, string> = {
  running:    'bg-blue-100 text-blue-700',
  trail:      'bg-emerald-100 text-emerald-700',
  cycling:    'bg-orange-100 text-orange-700',
  swimming:   'bg-cyan-100 text-cyan-700',
  triathlon:  'bg-violet-100 text-violet-700',
  obstacle:   'bg-amber-100 text-amber-700',
  hyrox:      'bg-rose-100 text-rose-700',
  strength:   'bg-red-100 text-red-700',
  team_sport: 'bg-teal-100 text-teal-700',
  other:      'bg-gray-100 text-gray-600',
}

const STATUS_LABELS: Record<FitnessEventStatus, string> = {
  registered: 'Registered',
  interested: 'Interested',
  sold_out:   'Sold Out',
  completed:  'Completed',
  alert_set:  'Alert Set',
}

const STATUS_COLORS: Record<FitnessEventStatus, string> = {
  registered: 'bg-emerald-100 text-emerald-700',
  interested: 'bg-blue-100 text-blue-700',
  sold_out:   'bg-red-100 text-red-600',
  completed:  'bg-gray-200 text-gray-700',
  alert_set:  'bg-violet-100 text-violet-700',
}

function formatDate(date?: string, endDate?: string): string {
  if (!date) return 'TBC'
  const d = new Date(date + 'T00:00:00')
  const formatted = d.toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
  if (!endDate || endDate === date) return formatted
  const d2 = new Date(endDate + 'T00:00:00')
  return `${formatted} – ${d2.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}`
}

function isPast(date?: string): boolean {
  if (!date) return false
  return date < new Date().toISOString().slice(0, 10)
}

// ── Blank form state ──────────────────────────────────────────────────────────

function blankForm(type: FitnessEventType) {
  return {
    name: '',
    type,
    date: '',
    endDate: '',
    venue: '',
    location: '',
    category: 'running' as FitnessEventCategory,
    status: 'interested' as FitnessEventStatus,
    url: '',
    price: '',
    distance: '',
    goalTime: '',
    resultTime: '',
    alertEnabled: false,
    annual: false,
    registrationOpensDate: '',
    registrationClosesDate: '',
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
  const field = 'w-full text-sm border border-gray-200 rounded px-2 py-1.5 outline-none focus:border-blue-400 text-gray-600 placeholder-gray-400'

  return (
    <div className="bg-white border border-blue-200 rounded-lg p-4 mb-4 shadow-sm space-y-3">
      <input
        autoFocus
        type="text"
        placeholder="Race name * (e.g. Melbourne Marathon)"
        value={f.name}
        onChange={e => set('name', e.target.value)}
        className="w-full text-sm font-medium outline-none placeholder-gray-400 text-gray-800"
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Discipline</label>
          <select value={f.category} onChange={e => set('category', e.target.value as FitnessEventCategory)} className={field}>
            {FITNESS_EVENT_CATEGORIES.map(c => <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Status</label>
          <select value={f.status} onChange={e => set('status', e.target.value as FitnessEventStatus)} className={field}>
            {FITNESS_EVENT_STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Distance</label>
          <input type="text" placeholder="42.2km / 70.3 / 5k" value={f.distance} onChange={e => set('distance', e.target.value)} className={field} />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Race date</label>
          <input type="date" value={f.date} onChange={e => set('date', e.target.value)} className={field} />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">End date (multi-day)</label>
          <input type="date" value={f.endDate} onChange={e => set('endDate', e.target.value)} className={field} />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Registration opens</label>
          <input type="date" value={f.registrationOpensDate} onChange={e => set('registrationOpensDate', e.target.value)} className={field} />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Registration closes</label>
          <input type="date" value={f.registrationClosesDate} onChange={e => set('registrationClosesDate', e.target.value)} className={field} />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Venue / Course</label>
          <input type="text" placeholder="e.g. Botanic Gardens" value={f.venue} onChange={e => set('venue', e.target.value)} className={field} />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Location / City</label>
          <input type="text" placeholder="e.g. Melbourne, AU" value={f.location} onChange={e => set('location', e.target.value)} className={field} />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Registration / Info URL</label>
          <input type="url" placeholder="https://..." value={f.url} onChange={e => set('url', e.target.value)} className={field} />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Entry fee ($)</label>
          <input type="number" placeholder="0" value={f.price} onChange={e => set('price', e.target.value)} className={field} />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Goal time</label>
          <input type="text" placeholder="e.g. 3:30:00" value={f.goalTime} onChange={e => set('goalTime', e.target.value)} className={field} />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Result time (once done)</label>
          <input type="text" placeholder="e.g. 3:24:11" value={f.resultTime} onChange={e => set('resultTime', e.target.value)} className={field} />
        </div>
      </div>

      <textarea
        placeholder="Notes — course profile, kit, travel, pacing plan"
        value={f.notes}
        onChange={e => set('notes', e.target.value)}
        rows={2}
        className={`${field} resize-none`}
      />

      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input type="checkbox" checked={f.alertEnabled} onChange={e => set('alertEnabled', e.target.checked)} className="rounded" />
          <Bell className="w-4 h-4 text-violet-500" />
          <span className="text-sm text-gray-700">Alert me when registration opens</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input type="checkbox" checked={f.annual} onChange={e => set('annual', e.target.checked)} className="rounded" />
          <Repeat className="w-4 h-4 text-teal-500" />
          <span className="text-sm text-gray-700">Runs annually</span>
        </label>
      </div>

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

// ── Goal card ─────────────────────────────────────────────────────────────────

function GoalCard({ event, onEdit, onDelete, onToggleAlert }: {
  event: FitnessEvent
  onEdit: () => void
  onDelete: () => void
  onToggleAlert: () => void
}) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const reg = registrationInfo(event)

  return (
    <div className={`bg-white border rounded-lg p-4 space-y-2 transition-colors ${
      event.status === 'sold_out' ? 'opacity-60 border-gray-200' : 'border-gray-200 hover:border-blue-200'
    }`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-gray-800 text-sm">{event.name}</span>
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${CATEGORY_COLORS[event.category]}`}>
              {CATEGORY_LABELS[event.category]}
            </span>
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${STATUS_COLORS[event.status]}`}>
              {STATUS_LABELS[event.status]}
            </span>
            {event.annual && (
              <span className="flex items-center gap-0.5 text-xs px-1.5 py-0.5 rounded-full bg-teal-50 text-teal-700">
                <Repeat className="w-2.5 h-2.5" /> Annual
              </span>
            )}
          </div>
          {(event.venue || event.location) && (
            <p className="text-xs text-gray-400 mt-0.5">{[event.venue, event.location].filter(Boolean).join(' · ')}</p>
          )}
          {event.date && <p className="text-xs text-gray-400">{formatDate(event.date, event.endDate)}</p>}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={onToggleAlert}
            title={event.alertEnabled ? 'Disable registration alert' : 'Enable registration alert'}
            className={`p-1.5 rounded-md transition-colors ${
              event.alertEnabled ? 'text-violet-600 bg-violet-50 hover:bg-violet-100' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
            }`}
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

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
        {event.distance && <span className="font-medium text-gray-700">{event.distance}</span>}
        {event.goalTime && <span className="flex items-center gap-1"><Timer className="w-3 h-3" />Goal {event.goalTime}</span>}
        {event.resultTime && <span className="flex items-center gap-1 text-emerald-600 font-medium"><Trophy className="w-3 h-3" />{event.resultTime}</span>}
        {event.price !== undefined && <span>${event.price.toLocaleString()}</span>}
      </div>

      {reg && (
        <div className={`flex items-center gap-1.5 text-xs rounded px-2 py-1 ${
          reg.closed ? 'bg-gray-100 text-gray-500'
            : reg.openNow ? 'bg-emerald-50 text-emerald-700 font-medium'
            : reg.days <= 14 ? 'bg-amber-50 text-amber-700'
            : 'bg-gray-50 text-gray-500'
        }`}>
          <ClipboardCheck className="w-3 h-3 shrink-0" />
          {registrationLabel(reg.days, reg.closed)}
          <span className="text-gray-400 ml-auto">
            {new Date(event.registrationOpensDate + 'T00:00:00').toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}
          </span>
        </div>
      )}

      {event.notes && <p className="text-xs text-gray-500 italic">{event.notes}</p>}
    </div>
  )
}

// ── Upcoming row ──────────────────────────────────────────────────────────────

function UpcomingRow({ event, onEdit, onDelete }: {
  event: FitnessEvent
  onEdit: () => void
  onDelete: () => void
}) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const past = isPast(event.date)
  const countdown = daysUntil(event.date)

  return (
    <tr className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${past ? 'opacity-50' : ''}`}>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="font-medium text-gray-800 text-sm">{event.name}</span>
          {event.annual && (
            <span className="flex items-center gap-0.5 text-xs px-1.5 py-0.5 rounded-full bg-teal-50 text-teal-700">
              <Repeat className="w-2.5 h-2.5" /> Annual
            </span>
          )}
        </div>
        {event.venue && <div className="text-xs text-gray-400">{event.venue}</div>}
      </td>
      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
        {formatDate(event.date, event.endDate)}
        {countdown && (
          <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${
            countdown === 'Today!' ? 'bg-emerald-100 text-emerald-700'
              : countdown.includes('ago') ? 'bg-gray-100 text-gray-500'
              : 'bg-blue-50 text-blue-600'
          }`}>{countdown}</span>
        )}
      </td>
      <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
        {event.distance ?? <span className="text-gray-300">—</span>}
      </td>
      <td className="px-4 py-3 text-sm whitespace-nowrap">
        {event.resultTime
          ? <span className="text-emerald-600 font-medium">{event.resultTime}</span>
          : event.goalTime
            ? <span className="text-gray-500">Goal {event.goalTime}</span>
            : <span className="text-gray-300">—</span>}
      </td>
      <td className="px-4 py-3">
        <span className={`text-xs px-1.5 py-0.5 rounded-full ${CATEGORY_COLORS[event.category]}`}>
          {CATEGORY_LABELS[event.category]}
        </span>
      </td>
      <td className="px-4 py-3">
        <span className={`text-xs px-1.5 py-0.5 rounded-full ${STATUS_COLORS[event.status]}`}>
          {STATUS_LABELS[event.status]}
        </span>
      </td>
      <td className="px-4 py-3 text-right whitespace-nowrap" onClick={e => e.stopPropagation()}>
        <span className="inline-flex items-center gap-2">
          {event.url && (
            <a href={event.url} target="_blank" rel="noopener noreferrer"
              className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-0.5">
              Entry <ExternalLink className="w-3 h-3" />
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

export function FitnessEventsModule() {
  const {
    upcoming, goals, alertCount, registrationSoon, results,
    filterCategory, setFilterCategory, create, update, remove,
  } = useFitnessEvents()

  const [view, setView] = useState<View>('upcoming')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

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
      distance: f.distance.trim() || undefined,
      goalTime: f.goalTime.trim() || undefined,
      resultTime: f.resultTime.trim() || undefined,
      alertEnabled: f.alertEnabled,
      annual: f.annual,
      registrationOpensDate: f.registrationOpensDate || undefined,
      registrationClosesDate: f.registrationClosesDate || undefined,
      notes: f.notes.trim() || undefined,
    }
    if (editingId) {
      await update(editingId, payload)
      setEditingId(null)
    } else {
      await create(payload)
      setShowForm(false)
    }
  }

  function formInitialFromEvent(event: FitnessEvent): FormState {
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
      distance: event.distance ?? '',
      goalTime: event.goalTime ?? '',
      resultTime: event.resultTime ?? '',
      alertEnabled: event.alertEnabled,
      annual: event.annual,
      registrationOpensDate: event.registrationOpensDate ?? '',
      registrationClosesDate: event.registrationClosesDate ?? '',
      notes: event.notes ?? '',
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 sm:py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 gap-3">
        <h1 className="text-xl font-semibold text-gray-900">Fitness Events</h1>
        {!showForm && !editingId && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 text-sm px-2.5 py-2 sm:px-3 sm:py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" /> <span className="hidden sm:inline">Add race</span>
          </button>
        )}
      </div>

      {/* Sub-tabs */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="flex rounded-md border border-gray-200 overflow-hidden text-sm">
          <button
            onClick={() => { setView('upcoming'); setShowForm(false); setEditingId(null) }}
            className={`px-3 py-2 sm:py-1.5 flex items-center gap-1.5 ${view === 'upcoming' ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
          >
            <CalendarDays className="w-3.5 h-3.5" /> Upcoming
            {upcoming.length > 0 && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${view === 'upcoming' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}`}>
                {upcoming.length}
              </span>
            )}
          </button>
          <button
            onClick={() => { setView('goal'); setShowForm(false); setEditingId(null) }}
            className={`px-3 py-2 sm:py-1.5 border-l border-gray-200 flex items-center gap-1.5 ${view === 'goal' ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
          >
            <Star className="w-3.5 h-3.5" /> Goal Races
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
        {results.length > 0 && (
          <span className="flex items-center gap-1 text-xs text-emerald-700 bg-emerald-50 px-2 py-1 rounded-full">
            <Trophy className="w-3 h-3" /> {results.length} completed
          </span>
        )}
      </div>

      <PhilosophyBox moduleId="fitness-events" />

      {/* Registration open / opening soon */}
      {registrationSoon.length > 0 && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
          <div className="flex items-center gap-2 mb-2">
            <ClipboardCheck className="w-4 h-4 text-amber-500" />
            <span className="text-sm font-semibold text-amber-800">Registration</span>
          </div>
          <div className="space-y-1">
            {registrationSoon.map(({ event, days, openNow }) => (
              <div key={event.id} className="flex items-center justify-between gap-3 text-sm">
                <span className="text-gray-700 truncate">
                  {event.name}
                  {event.distance && <span className="text-gray-400 ml-2 text-xs">{event.distance}</span>}
                </span>
                <span className="flex items-center gap-2 shrink-0">
                  <span className={`text-xs ${openNow ? 'text-emerald-600 font-medium' : 'text-amber-600'}`}>
                    {registrationLabel(days, false)}
                  </span>
                  {event.url && (
                    <a href={event.url} target="_blank" rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-0.5">
                      Enter <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add form */}
      {showForm && (
        <EventForm initial={blankForm(view)} onSave={handleSave} onCancel={() => setShowForm(false)} />
      )}

      {/* ── Upcoming view ── */}
      {view === 'upcoming' && (
        upcoming.length === 0 && !showForm ? (
          <p className="text-center text-gray-400 text-sm py-16">No upcoming races. Add one above.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-left">
                  <th className="px-4 py-3 font-medium text-gray-600">Race</th>
                  <th className="px-4 py-3 font-medium text-gray-600">Date</th>
                  <th className="px-4 py-3 font-medium text-gray-600">Distance</th>
                  <th className="px-4 py-3 font-medium text-gray-600">Time</th>
                  <th className="px-4 py-3 font-medium text-gray-600">Discipline</th>
                  <th className="px-4 py-3 font-medium text-gray-600">Status</th>
                  <th className="px-4 py-3 font-medium text-gray-600 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {upcoming.map(event =>
                  editingId === event.id ? (
                    <tr key={event.id}>
                      <td colSpan={7} className="px-4 py-3">
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
                      onEdit={() => { setEditingId(event.id); setShowForm(false) }}
                      onDelete={() => remove(event.id)}
                    />
                  )
                )}
              </tbody>
            </table>
          </div>
        )
      )}

      {/* ── Goal races view ── */}
      {view === 'goal' && (
        <>
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <select
              value={filterCategory}
              onChange={e => setFilterCategory(e.target.value as FitnessEventCategory | '')}
              className="text-sm border border-gray-200 rounded px-2 py-2 sm:py-1.5 outline-none focus:border-blue-400 text-gray-600 bg-white"
            >
              <option value="">All disciplines</option>
              {FITNESS_EVENT_CATEGORIES.map(c => <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>)}
            </select>
            <span className="text-xs text-gray-400">
              Toggle <Bell className="inline w-3 h-3" /> to let the agent watch for registration
            </span>
          </div>

          {goals.length === 0 && !showForm ? (
            <p className="text-center text-gray-400 text-sm py-16">No goal races yet. Add races you want to do.</p>
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
                    onEdit={() => { setEditingId(event.id); setShowForm(false) }}
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
