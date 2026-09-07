import { useState } from 'react'
import {
  Plus, X, Pencil, Trash2, ExternalLink, ShieldCheck, RefreshCw,
  Laptop, CreditCard, AlertCircle, MapPin, User,
} from 'lucide-react'
import { PhilosophyBox } from '../../../core/PhilosophyBox'
import { useTechnology, daysUntil, annualCost } from '../hooks/useTechnology'
import {
  DEVICE_CATEGORIES, DEVICE_STATUSES,
  SUBSCRIPTION_CATEGORIES, BILLING_CYCLES, SUBSCRIPTION_STATUSES,
} from '../schema'
import type {
  Device, DeviceCategory, DeviceStatus,
  TechSubscription, SubscriptionCategory, BillingCycle, SubscriptionStatus,
} from '../types'

type View = 'devices' | 'subscriptions'

const CATEGORY_LABELS: Record<DeviceCategory, string> = {
  computer: 'Computers', phone: 'Phones', tablet: 'Tablets', wearable: 'Wearables',
  display: 'Displays & TVs', audio: 'Audio', camera: 'Cameras', gaming: 'Gaming',
  network: 'Network', smart_home: 'Smart Home', peripheral: 'Peripherals',
  storage: 'Storage', other: 'Other',
}

const STATUS_COLORS: Record<DeviceStatus, string> = {
  active: 'bg-emerald-100 text-emerald-700',
  backup: 'bg-blue-100 text-blue-700',
  storage: 'bg-gray-100 text-gray-600',
  sold: 'bg-gray-200 text-gray-500',
  retired: 'bg-gray-200 text-gray-500',
  broken: 'bg-red-100 text-red-600',
}

const SUB_CATEGORY_LABELS: Record<SubscriptionCategory, string> = {
  cloud_storage: 'Cloud Storage', software: 'Software', streaming: 'Streaming',
  security: 'Security', domain_hosting: 'Domain & Hosting', ai: 'AI',
  connectivity: 'Connectivity', other: 'Other',
}

const CYCLE_LABELS: Record<BillingCycle, string> = {
  monthly: '/mo', quarterly: '/qtr', annual: '/yr',
}

const money = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, ' ')

// ── Device form ───────────────────────────────────────────────────────────────

interface DeviceForm {
  name: string; category: DeviceCategory; brand: string; model: string
  serialNumber: string; purchaseDate: string; purchasePrice: string
  warrantyExpiry: string; status: DeviceStatus; assignedTo: string
  location: string; url: string; notes: string
}

const EMPTY_DEVICE: DeviceForm = {
  name: '', category: 'computer', brand: '', model: '', serialNumber: '',
  purchaseDate: '', purchasePrice: '', warrantyExpiry: '', status: 'active',
  assignedTo: '', location: '', url: '', notes: '',
}

function deviceToForm(d: Device): DeviceForm {
  return {
    name: d.name, category: d.category, brand: d.brand ?? '', model: d.model ?? '',
    serialNumber: d.serialNumber ?? '', purchaseDate: d.purchaseDate ?? '',
    purchasePrice: d.purchasePrice != null ? String(d.purchasePrice) : '',
    warrantyExpiry: d.warrantyExpiry ?? '', status: d.status,
    assignedTo: d.assignedTo ?? '', location: d.location ?? '',
    url: d.url ?? '', notes: d.notes ?? '',
  }
}

// ── Subscription form ─────────────────────────────────────────────────────────

interface SubForm {
  name: string; provider: string; category: SubscriptionCategory
  cost: string; billingCycle: BillingCycle; renewalDate: string
  status: SubscriptionStatus; url: string; notes: string
}

const EMPTY_SUB: SubForm = {
  name: '', provider: '', category: 'software', cost: '',
  billingCycle: 'monthly', renewalDate: '', status: 'active', url: '', notes: '',
}

function subToForm(s: TechSubscription): SubForm {
  return {
    name: s.name, provider: s.provider ?? '', category: s.category,
    cost: s.cost != null ? String(s.cost) : '', billingCycle: s.billingCycle,
    renewalDate: s.renewalDate ?? '', status: s.status,
    url: s.url ?? '', notes: s.notes ?? '',
  }
}

// ── Main component ────────────────────────────────────────────────────────────

export function TechnologyModule() {
  const {
    groupedDevices, filteredDevices, subscriptions, activeSubscriptions,
    totalAnnualCost, warrantiesExpiring, renewalsSoon, loading,
    search, setSearch, filterCategory, setFilterCategory,
    showRetired, setShowRetired,
    createDevice, updateDevice, removeDevice,
    createSubscription, updateSubscription, removeSubscription,
  } = useTechnology()

  const [view, setView] = useState<View>('devices')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deviceForm, setDeviceForm] = useState<DeviceForm>(EMPTY_DEVICE)
  const [subForm, setSubForm] = useState<SubForm>(EMPTY_SUB)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const input = 'text-sm border border-gray-200 rounded px-3 py-2 outline-none focus:border-blue-400 w-full'

  function closeForm() {
    setShowForm(false); setEditingId(null)
    setDeviceForm(EMPTY_DEVICE); setSubForm(EMPTY_SUB)
  }

  async function saveDevice() {
    if (!deviceForm.name.trim()) return
    const payload = {
      name: deviceForm.name.trim(),
      category: deviceForm.category,
      brand: deviceForm.brand.trim() || undefined,
      model: deviceForm.model.trim() || undefined,
      serialNumber: deviceForm.serialNumber.trim() || undefined,
      purchaseDate: deviceForm.purchaseDate || undefined,
      purchasePrice: deviceForm.purchasePrice ? Number(deviceForm.purchasePrice) : undefined,
      warrantyExpiry: deviceForm.warrantyExpiry || undefined,
      status: deviceForm.status,
      assignedTo: deviceForm.assignedTo.trim() || undefined,
      location: deviceForm.location.trim() || undefined,
      url: deviceForm.url.trim() || undefined,
      notes: deviceForm.notes.trim() || undefined,
    }
    if (editingId) await updateDevice(editingId, payload)
    else await createDevice(payload)
    closeForm()
  }

  async function saveSub() {
    if (!subForm.name.trim()) return
    const payload = {
      name: subForm.name.trim(),
      provider: subForm.provider.trim() || undefined,
      category: subForm.category,
      cost: subForm.cost ? Number(subForm.cost) : undefined,
      billingCycle: subForm.billingCycle,
      renewalDate: subForm.renewalDate || undefined,
      status: subForm.status,
      url: subForm.url.trim() || undefined,
      notes: subForm.notes.trim() || undefined,
    }
    if (editingId) await updateSubscription(editingId, payload)
    else await createSubscription(payload)
    closeForm()
  }

  const alertCount = warrantiesExpiring.length + renewalsSoon.length

  return (
    <div className="max-w-5xl mx-auto px-4 py-4 sm:px-6 sm:py-8">
      <div className="flex items-center justify-between mb-4 gap-3">
        <h1 className="text-xl font-semibold text-gray-900">Technology</h1>
        {!showForm && (
          <button
            onClick={() => { setShowForm(true); setEditingId(null) }}
            className="flex items-center gap-1.5 text-sm px-2.5 py-2 sm:px-3 sm:py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">{view === 'devices' ? 'Add device' : 'Add subscription'}</span>
          </button>
        )}
      </div>

      {/* Sub-tabs */}
      <div className="flex rounded-md border border-gray-200 overflow-hidden text-sm mb-4 sm:w-fit">
        <button
          onClick={() => { setView('devices'); closeForm() }}
          className={`flex-1 sm:flex-none px-3 py-2.5 sm:py-1.5 flex items-center justify-center gap-1.5 ${view === 'devices' ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
        >
          <Laptop className="w-3.5 h-3.5" /> Devices
          {filteredDevices.length > 0 && (
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${view === 'devices' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}`}>
              {filteredDevices.length}
            </span>
          )}
        </button>
        <button
          onClick={() => { setView('subscriptions'); closeForm() }}
          className={`flex-1 sm:flex-none px-3 py-2.5 sm:py-1.5 border-l border-gray-200 flex items-center justify-center gap-1.5 ${view === 'subscriptions' ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
        >
          <CreditCard className="w-3.5 h-3.5" /> Subscriptions
          {activeSubscriptions.length > 0 && (
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${view === 'subscriptions' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}`}>
              {activeSubscriptions.length}
            </span>
          )}
        </button>
      </div>

      <PhilosophyBox moduleId="technology" />

      {/* Alerts */}
      {alertCount > 0 && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-4 h-4 text-amber-500" />
            <span className="text-sm font-semibold text-amber-800">Coming up</span>
          </div>
          <div className="space-y-1">
            {warrantiesExpiring.map(({ device, days }) => (
              <div key={device.id} className="flex items-center justify-between gap-3 text-sm">
                <span className="text-gray-700 truncate flex items-center gap-1.5">
                  <ShieldCheck className="w-3 h-3 text-gray-400 shrink-0" />
                  {device.name} <span className="text-gray-400 text-xs">warranty</span>
                </span>
                <span className={`text-xs shrink-0 ${days <= 14 ? 'text-red-500 font-medium' : 'text-amber-600'}`}>
                  {days === 0 ? 'expires today' : `${days}d left`}
                </span>
              </div>
            ))}
            {renewalsSoon.map(({ sub, days }) => (
              <div key={sub.id} className="flex items-center justify-between gap-3 text-sm">
                <span className="text-gray-700 truncate flex items-center gap-1.5">
                  <RefreshCw className="w-3 h-3 text-gray-400 shrink-0" />
                  {sub.name} <span className="text-gray-400 text-xs">renews</span>
                </span>
                <span className={`text-xs shrink-0 ${days < 0 ? 'text-gray-400' : days <= 7 ? 'text-red-500 font-medium' : 'text-amber-600'}`}>
                  {sub.cost != null && <span className="text-gray-400 mr-2">{money(sub.cost)}</span>}
                  {days < 0 ? `${Math.abs(days)}d ago — update date` : days === 0 ? 'today' : `in ${days}d`}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Devices ── */}
      {view === 'devices' && (
        <>
          <div className="flex flex-col sm:flex-row gap-2 mb-4">
            <input
              type="text" placeholder="Search devices…" value={search}
              onChange={e => setSearch(e.target.value)}
              className="text-sm border border-gray-200 rounded px-3 py-2.5 sm:py-1.5 outline-none focus:border-blue-400 flex-1"
            />
            <select
              value={filterCategory}
              onChange={e => setFilterCategory(e.target.value as DeviceCategory | 'all')}
              className="text-sm border border-gray-200 rounded px-3 py-2.5 sm:py-1.5 text-gray-600 outline-none focus:border-blue-400 bg-white"
            >
              <option value="all">All categories</option>
              {DEVICE_CATEGORIES.map(c => <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>)}
            </select>
            <button
              onClick={() => setShowRetired(!showRetired)}
              className={`text-sm px-3 py-2.5 sm:py-1.5 rounded border transition-colors ${
                showRetired ? 'border-gray-300 bg-gray-100 text-gray-700' : 'border-gray-200 text-gray-500 hover:bg-gray-50'
              }`}
            >
              {showRetired ? 'Incl. retired' : 'In use'}
            </button>
          </div>

          {showForm && (
            <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-gray-800">{editingId ? 'Edit device' : 'Add device'}</h2>
                <button onClick={closeForm} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input className={input} placeholder="Name (e.g. MacBook Pro 16)" value={deviceForm.name} autoFocus
                  onChange={e => setDeviceForm(f => ({ ...f, name: e.target.value }))} />
                <select className={`${input} bg-white`} value={deviceForm.category}
                  onChange={e => setDeviceForm(f => ({ ...f, category: e.target.value as DeviceCategory }))}>
                  {DEVICE_CATEGORIES.map(c => <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>)}
                </select>
                <input className={input} placeholder="Brand" value={deviceForm.brand}
                  onChange={e => setDeviceForm(f => ({ ...f, brand: e.target.value }))} />
                <input className={input} placeholder="Model" value={deviceForm.model}
                  onChange={e => setDeviceForm(f => ({ ...f, model: e.target.value }))} />
                <input className={input} placeholder="Serial number (for warranty claims)" value={deviceForm.serialNumber}
                  onChange={e => setDeviceForm(f => ({ ...f, serialNumber: e.target.value }))} />
                <select className={`${input} bg-white`} value={deviceForm.status}
                  onChange={e => setDeviceForm(f => ({ ...f, status: e.target.value as DeviceStatus }))}>
                  {DEVICE_STATUSES.map(s => <option key={s} value={s}>{cap(s)}</option>)}
                </select>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Purchased</label>
                  <input type="date" className={input} value={deviceForm.purchaseDate}
                    onChange={e => setDeviceForm(f => ({ ...f, purchaseDate: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Price ($)</label>
                  <input type="number" min={0} className={input} value={deviceForm.purchasePrice}
                    onChange={e => setDeviceForm(f => ({ ...f, purchasePrice: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Warranty expires</label>
                  <input type="date" className={input} value={deviceForm.warrantyExpiry}
                    onChange={e => setDeviceForm(f => ({ ...f, warrantyExpiry: e.target.value }))} />
                </div>
                <input className={input} placeholder="Used by" value={deviceForm.assignedTo}
                  onChange={e => setDeviceForm(f => ({ ...f, assignedTo: e.target.value }))} />
                <input className={input} placeholder="Location (e.g. Office)" value={deviceForm.location}
                  onChange={e => setDeviceForm(f => ({ ...f, location: e.target.value }))} />
                <input className={input} placeholder="Support / product URL" value={deviceForm.url}
                  onChange={e => setDeviceForm(f => ({ ...f, url: e.target.value }))} />
                <input className={`${input} sm:col-span-2`} placeholder="Notes" value={deviceForm.notes}
                  onChange={e => setDeviceForm(f => ({ ...f, notes: e.target.value }))} />
              </div>
              <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 mt-3">
                <button onClick={closeForm} className="text-sm px-3 py-2.5 sm:py-1.5 text-gray-500 hover:text-gray-700">Cancel</button>
                <button onClick={saveDevice} disabled={!deviceForm.name.trim()}
                  className="text-sm px-3 py-2.5 sm:py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-40">
                  {editingId ? 'Save changes' : 'Add device'}
                </button>
              </div>
            </div>
          )}

          {loading ? (
            <p className="text-sm text-gray-400 text-center py-12">Loading…</p>
          ) : filteredDevices.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-16">
              No devices yet. Add your laptop, phone, router and the rest.
            </p>
          ) : (
            <div className="space-y-6">
              {DEVICE_CATEGORIES.filter(c => groupedDevices.has(c)).map(category => (
                <div key={category}>
                  <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
                    {CATEGORY_LABELS[category]}
                  </h2>
                  <div className="space-y-2">
                    {(groupedDevices.get(category) ?? []).map(d => {
                      const warrantyDays = daysUntil(d.warrantyExpiry)
                      return (
                        <div key={d.id} className="rounded-lg border border-gray-200 bg-white p-4">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-sm font-semibold text-gray-800">{d.name}</span>
                                <span className={`text-xs px-1.5 py-0.5 rounded-full ${STATUS_COLORS[d.status]}`}>
                                  {cap(d.status)}
                                </span>
                                {warrantyDays !== null && (
                                  <span className={`flex items-center gap-0.5 text-xs px-1.5 py-0.5 rounded-full ${
                                    warrantyDays < 0 ? 'bg-gray-100 text-gray-500'
                                      : warrantyDays <= 60 ? 'bg-amber-50 text-amber-700'
                                      : 'bg-emerald-50 text-emerald-700'
                                  }`}>
                                    <ShieldCheck className="w-2.5 h-2.5" />
                                    {warrantyDays < 0 ? 'Out of warranty' : `${warrantyDays}d warranty`}
                                  </span>
                                )}
                              </div>
                              {(d.brand || d.model) && (
                                <div className="text-xs text-gray-500 mt-0.5">
                                  {[d.brand, d.model].filter(Boolean).join(' ')}
                                </div>
                              )}
                              <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-400">
                                {d.assignedTo && <span className="flex items-center gap-1"><User className="w-3 h-3" />{d.assignedTo}</span>}
                                {d.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{d.location}</span>}
                                {d.serialNumber && <span className="font-mono">{d.serialNumber}</span>}
                                {d.purchasePrice != null && <span>{money(d.purchasePrice)}</span>}
                                {d.purchaseDate && <span>bought {new Date(d.purchaseDate + 'T00:00:00').toLocaleDateString()}</span>}
                                {d.url && (
                                  <a href={d.url} target="_blank" rel="noopener noreferrer"
                                    className="flex items-center gap-0.5 text-blue-500 hover:text-blue-700">
                                    <ExternalLink className="w-3 h-3" />Support
                                  </a>
                                )}
                              </div>
                              {d.notes && <div className="text-xs text-gray-400 italic mt-1">{d.notes}</div>}
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <button onClick={() => { setDeviceForm(deviceToForm(d)); setEditingId(d.id); setShowForm(true) }}
                                className="p-2 rounded-md text-gray-300 hover:text-blue-500 hover:bg-blue-50">
                                <Pencil className="w-4 h-4" />
                              </button>
                              {confirmDelete === d.id ? (
                                <span className="flex items-center gap-1 text-xs px-1">
                                  <button onClick={() => { removeDevice(d.id); setConfirmDelete(null) }}
                                    className="text-red-500 hover:text-red-700 font-medium">Yes</button>
                                  <button onClick={() => setConfirmDelete(null)} className="text-gray-400 hover:text-gray-600">No</button>
                                </span>
                              ) : (
                                <button onClick={() => setConfirmDelete(d.id)}
                                  className="p-2 rounded-md text-gray-300 hover:text-red-500 hover:bg-red-50">
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
        </>
      )}

      {/* ── Subscriptions ── */}
      {view === 'subscriptions' && (
        <>
          {activeSubscriptions.length > 0 && (
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="rounded-xl border border-gray-200 bg-white px-5 py-4">
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Annual cost</p>
                <p className="text-2xl font-bold text-gray-900">{money(totalAnnualCost)}</p>
              </div>
              <div className="rounded-xl border border-gray-200 bg-white px-5 py-4">
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Monthly average</p>
                <p className="text-2xl font-bold text-gray-900">{money(totalAnnualCost / 12)}</p>
              </div>
            </div>
          )}

          {showForm && (
            <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-gray-800">{editingId ? 'Edit subscription' : 'Add subscription'}</h2>
                <button onClick={closeForm} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input className={input} placeholder="Name (e.g. iCloud+ 2TB)" value={subForm.name} autoFocus
                  onChange={e => setSubForm(f => ({ ...f, name: e.target.value }))} />
                <input className={input} placeholder="Provider (e.g. Apple)" value={subForm.provider}
                  onChange={e => setSubForm(f => ({ ...f, provider: e.target.value }))} />
                <select className={`${input} bg-white`} value={subForm.category}
                  onChange={e => setSubForm(f => ({ ...f, category: e.target.value as SubscriptionCategory }))}>
                  {SUBSCRIPTION_CATEGORIES.map(c => <option key={c} value={c}>{SUB_CATEGORY_LABELS[c]}</option>)}
                </select>
                <select className={`${input} bg-white`} value={subForm.status}
                  onChange={e => setSubForm(f => ({ ...f, status: e.target.value as SubscriptionStatus }))}>
                  {SUBSCRIPTION_STATUSES.map(s => <option key={s} value={s}>{cap(s)}</option>)}
                </select>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Cost ($)</label>
                  <input type="number" min={0} step="0.01" className={input} value={subForm.cost}
                    onChange={e => setSubForm(f => ({ ...f, cost: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Billing cycle</label>
                  <select className={`${input} bg-white`} value={subForm.billingCycle}
                    onChange={e => setSubForm(f => ({ ...f, billingCycle: e.target.value as BillingCycle }))}>
                    {BILLING_CYCLES.map(c => <option key={c} value={c}>{cap(c)}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Next renewal</label>
                  <input type="date" className={input} value={subForm.renewalDate}
                    onChange={e => setSubForm(f => ({ ...f, renewalDate: e.target.value }))} />
                </div>
                <input className={input} placeholder="Manage / billing URL" value={subForm.url}
                  onChange={e => setSubForm(f => ({ ...f, url: e.target.value }))} />
                <input className={`${input} sm:col-span-2`} placeholder="Notes" value={subForm.notes}
                  onChange={e => setSubForm(f => ({ ...f, notes: e.target.value }))} />
              </div>
              <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 mt-3">
                <button onClick={closeForm} className="text-sm px-3 py-2.5 sm:py-1.5 text-gray-500 hover:text-gray-700">Cancel</button>
                <button onClick={saveSub} disabled={!subForm.name.trim()}
                  className="text-sm px-3 py-2.5 sm:py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-40">
                  {editingId ? 'Save changes' : 'Add subscription'}
                </button>
              </div>
            </div>
          )}

          {loading ? (
            <p className="text-sm text-gray-400 text-center py-12">Loading…</p>
          ) : subscriptions.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-16">
              No subscriptions yet. Add the recurring services you pay for.
            </p>
          ) : (
            <div className="space-y-2">
              {subscriptions.map(s => {
                const days = daysUntil(s.renewalDate)
                const cancelled = s.status === 'cancelled'
                return (
                  <div key={s.id} className={`rounded-lg border border-gray-200 bg-white p-4 ${cancelled ? 'opacity-50' : ''}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-sm font-semibold ${cancelled ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
                            {s.name}
                          </span>
                          <span className="text-xs px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-600">
                            {SUB_CATEGORY_LABELS[s.category]}
                          </span>
                          {s.status === 'trial' && (
                            <span className="text-xs px-1.5 py-0.5 rounded-full bg-violet-100 text-violet-700">Trial</span>
                          )}
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-400">
                          {s.provider && <span>{s.provider}</span>}
                          {s.cost != null && (
                            <span className="text-gray-700 font-medium">
                              {money(s.cost)}<span className="text-gray-400">{CYCLE_LABELS[s.billingCycle]}</span>
                              {s.billingCycle !== 'annual' && (
                                <span className="text-gray-400 ml-1.5">({money(annualCost(s))}/yr)</span>
                              )}
                            </span>
                          )}
                          {days !== null && !cancelled && (
                            <span className={days < 0 ? 'text-gray-400' : days <= 7 ? 'text-red-500 font-medium' : days <= 30 ? 'text-amber-600' : ''}>
                              {days < 0 ? `renewed ${Math.abs(days)}d ago` : days === 0 ? 'renews today' : `renews in ${days}d`}
                            </span>
                          )}
                          {s.url && (
                            <a href={s.url} target="_blank" rel="noopener noreferrer"
                              className="flex items-center gap-0.5 text-blue-500 hover:text-blue-700">
                              <ExternalLink className="w-3 h-3" />Manage
                            </a>
                          )}
                        </div>
                        {s.notes && <div className="text-xs text-gray-400 italic mt-1">{s.notes}</div>}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button onClick={() => { setSubForm(subToForm(s)); setEditingId(s.id); setShowForm(true) }}
                          className="p-2 rounded-md text-gray-300 hover:text-blue-500 hover:bg-blue-50">
                          <Pencil className="w-4 h-4" />
                        </button>
                        {confirmDelete === s.id ? (
                          <span className="flex items-center gap-1 text-xs px-1">
                            <button onClick={() => { removeSubscription(s.id); setConfirmDelete(null) }}
                              className="text-red-500 hover:text-red-700 font-medium">Yes</button>
                            <button onClick={() => setConfirmDelete(null)} className="text-gray-400 hover:text-gray-600">No</button>
                          </span>
                        ) : (
                          <button onClick={() => setConfirmDelete(s.id)}
                            className="p-2 rounded-md text-gray-300 hover:text-red-500 hover:bg-red-50">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}
    </div>
  )
}
