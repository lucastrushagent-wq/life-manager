import { useState } from 'react'
import { Plus, Pencil, Trash2, X, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react'
import { PhilosophyBox } from '../../../core/PhilosophyBox'
import { useInvestmentsStore } from '../store'
import type { AssetClass, Holding } from '../types'

// ── Constants ─────────────────────────────────────────────────────────────────

const ASSET_CLASS_LABELS: Record<AssetClass, string> = {
  us_stocks: 'US Stocks',
  intl_stocks: 'Intl Stocks',
  etf: 'ETF / Index Fund',
  bonds: 'Bonds',
  crypto: 'Crypto',
  real_estate: 'Real Estate',
  cash: 'Cash / Money Market',
  other: 'Other',
}

const ASSET_CLASS_COLORS: Record<AssetClass, string> = {
  us_stocks: 'bg-blue-400',
  intl_stocks: 'bg-sky-400',
  etf: 'bg-indigo-400',
  bonds: 'bg-green-400',
  crypto: 'bg-orange-400',
  real_estate: 'bg-teal-400',
  cash: 'bg-gray-300',
  other: 'bg-purple-300',
}

const ASSET_CLASSES = Object.keys(ASSET_CLASS_LABELS) as AssetClass[]

// ── Formatting ────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
}

function fmtExact(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)
}

function fmtPct(n: number) {
  const sign = n >= 0 ? '+' : ''
  return `${sign}${n.toFixed(2)}%`
}

function todayStr() {
  return new Date().toISOString().split('T')[0]
}

// ── Form state ─────────────────────────────────────────────────────────────────

interface FormState {
  ticker: string
  name: string
  assetClass: AssetClass
  account: string
  shares: string
  avgCost: string
  currentPrice: string
  lastUpdated: string
  notes: string
}

const EMPTY_FORM: FormState = {
  ticker: '', name: '', assetClass: 'us_stocks', account: '',
  shares: '', avgCost: '', currentPrice: '', lastUpdated: todayStr(), notes: '',
}

// ── Main component ─────────────────────────────────────────────────────────────

export function InvestmentsModule() {
  const { holdings, addHolding, updateHolding, deleteHolding } = useInvestmentsStore()
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [priceEditId, setPriceEditId] = useState<string | null>(null)
  const [priceInput, setPriceInput] = useState('')
  const [groupBy, setGroupBy] = useState<'none' | 'assetClass' | 'account'>('assetClass')

  // ── Computed ────────────────────────────────────────────────────────────────

  const enriched = holdings.map(h => {
    const value = h.shares * h.currentPrice
    const costBasis = h.shares * h.avgCost
    const gainLoss = value - costBasis
    const gainLossPct = costBasis > 0 ? (gainLoss / costBasis) * 100 : 0
    return { ...h, value, costBasis, gainLoss, gainLossPct }
  }).sort((a, b) => b.value - a.value)

  const totalValue = enriched.reduce((s, h) => s + h.value, 0)
  const totalCost = enriched.reduce((s, h) => s + h.costBasis, 0)
  const totalGainLoss = totalValue - totalCost
  const totalGainLossPct = totalCost > 0 ? (totalGainLoss / totalCost) * 100 : 0

  // Allocation by asset class
  const byClass = ASSET_CLASSES
    .map(cls => ({
      cls,
      value: enriched.filter(h => h.assetClass === cls).reduce((s, h) => s + h.value, 0),
    }))
    .filter(g => g.value > 0)
    .sort((a, b) => b.value - a.value)

  const maxClassValue = byClass[0]?.value ?? 1

  // ── Handlers ────────────────────────────────────────────────────────────────

  function startAdd() {
    setForm(EMPTY_FORM)
    setEditingId(null)
    setShowForm(true)
  }

  function startEdit(h: Holding) {
    setForm({
      ticker: h.ticker,
      name: h.name,
      assetClass: h.assetClass,
      account: h.account,
      shares: String(h.shares),
      avgCost: String(h.avgCost),
      currentPrice: String(h.currentPrice),
      lastUpdated: h.lastUpdated,
      notes: h.notes ?? '',
    })
    setEditingId(h.id)
    setShowForm(true)
  }

  async function handleSubmit() {
    const shares = parseFloat(form.shares)
    const avgCost = parseFloat(form.avgCost)
    const currentPrice = parseFloat(form.currentPrice)
    if (!form.ticker.trim() || !form.name.trim() || isNaN(shares) || isNaN(avgCost) || isNaN(currentPrice)) return
    const payload = {
      ticker: form.ticker.trim().toUpperCase(),
      name: form.name.trim(),
      assetClass: form.assetClass,
      account: form.account.trim(),
      shares,
      avgCost,
      currentPrice,
      lastUpdated: form.lastUpdated || todayStr(),
      notes: form.notes.trim() || undefined,
    }
    if (editingId) {
      await updateHolding(editingId, payload)
    } else {
      await addHolding(payload)
    }
    setShowForm(false)
    setEditingId(null)
  }

  async function savePrice(id: string) {
    const p = parseFloat(priceInput)
    if (isNaN(p) || p < 0) return
    await updateHolding(id, { currentPrice: p, lastUpdated: todayStr() })
    setPriceEditId(null)
  }

  const set = (k: keyof FormState, v: string) => setForm(f => ({ ...f, [k]: v }))
  const inputCls = 'text-sm border border-gray-200 rounded px-2 py-1.5 outline-none focus:border-blue-400 w-full'

  // ── Groups for table ────────────────────────────────────────────────────────

  type GroupKey = string
  let groups: { key: GroupKey; label: string; items: typeof enriched }[] = []

  if (groupBy === 'none') {
    groups = [{ key: 'all', label: '', items: enriched }]
  } else if (groupBy === 'assetClass') {
    groups = ASSET_CLASSES
      .map(cls => ({ key: cls, label: ASSET_CLASS_LABELS[cls], items: enriched.filter(h => h.assetClass === cls) }))
      .filter(g => g.items.length > 0)
  } else {
    const accounts = [...new Set(enriched.map(h => h.account || 'Unspecified'))]
    groups = accounts.map(acct => ({ key: acct, label: acct, items: enriched.filter(h => (h.account || 'Unspecified') === acct) }))
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Investments</h1>
        {!showForm && (
          <button onClick={startAdd} className="flex items-center gap-1.5 text-sm px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700">
            <Plus className="w-4 h-4" /> Add holding
          </button>
        )}
      </div>

      <PhilosophyBox moduleId="investments" />

      {/* Summary cards */}
      {holdings.length > 0 && (
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="rounded-xl border border-gray-200 bg-white px-5 py-4">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Portfolio Value</p>
            <p className="text-2xl font-bold text-gray-900">{fmt(totalValue)}</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white px-5 py-4">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Cost Basis</p>
            <p className="text-2xl font-bold text-gray-700">{fmt(totalCost)}</p>
          </div>
          <div className={`rounded-xl border px-5 py-4 ${totalGainLoss >= 0 ? 'border-green-100 bg-green-50' : 'border-red-100 bg-red-50'}`}>
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Total Gain / Loss</p>
            <p className={`text-2xl font-bold ${totalGainLoss >= 0 ? 'text-green-700' : 'text-red-600'}`}>{fmt(totalGainLoss)}</p>
          </div>
          <div className={`rounded-xl border px-5 py-4 ${totalGainLossPct >= 0 ? 'border-green-100 bg-green-50' : 'border-red-100 bg-red-50'}`}>
            <div className="flex items-center gap-1.5 mb-1">
              {totalGainLossPct >= 0
                ? <TrendingUp className="w-3.5 h-3.5 text-green-500" />
                : <TrendingDown className="w-3.5 h-3.5 text-red-400" />}
              <p className="text-xs text-gray-400 uppercase tracking-wide">Return</p>
            </div>
            <p className={`text-2xl font-bold ${totalGainLossPct >= 0 ? 'text-green-700' : 'text-red-600'}`}>
              {fmtPct(totalGainLossPct)}
            </p>
          </div>
        </div>
      )}

      {/* Allocation chart */}
      {byClass.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-5 mb-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-4">Allocation</p>
          <div className="space-y-2.5">
            {byClass.map(({ cls, value }) => (
              <div key={cls}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-gray-600 font-medium">{ASSET_CLASS_LABELS[cls]}</span>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-gray-800">{fmt(value)}</span>
                    <span className="text-gray-400 w-10 text-right">{Math.round((value / totalValue) * 100)}%</span>
                  </div>
                </div>
                <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                  <div className={`h-full rounded-full ${ASSET_CLASS_COLORS[cls]}`} style={{ width: `${(value / maxClassValue) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add / Edit form */}
      {showForm && (
        <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-800">{editingId ? 'Edit holding' : 'Add holding'}</h2>
            <button onClick={() => { setShowForm(false); setEditingId(null) }} className="text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-gray-500 block mb-1">Ticker / Symbol</label>
              <input className={inputCls} placeholder="AAPL" value={form.ticker} onChange={e => set('ticker', e.target.value)} autoFocus />
            </div>
            <div className="col-span-2">
              <label className="text-xs text-gray-500 block mb-1">Name</label>
              <input className={inputCls} placeholder="Apple Inc." value={form.name} onChange={e => set('name', e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Asset class</label>
              <select className={`${inputCls} bg-white`} value={form.assetClass} onChange={e => set('assetClass', e.target.value)}>
                {ASSET_CLASSES.map(c => <option key={c} value={c}>{ASSET_CLASS_LABELS[c]}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="text-xs text-gray-500 block mb-1">Account (optional)</label>
              <input className={inputCls} placeholder="e.g. Fidelity Roth IRA" value={form.account} onChange={e => set('account', e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Shares / Units</label>
              <input type="number" step="any" min="0" className={inputCls} placeholder="10" value={form.shares} onChange={e => set('shares', e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Avg cost per share ($)</label>
              <input type="number" step="any" min="0" className={inputCls} placeholder="150.00" value={form.avgCost} onChange={e => set('avgCost', e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Current price ($)</label>
              <input type="number" step="any" min="0" className={inputCls} placeholder="185.00" value={form.currentPrice} onChange={e => set('currentPrice', e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Price as of</label>
              <input type="date" className={inputCls} value={form.lastUpdated} onChange={e => set('lastUpdated', e.target.value)} />
            </div>
            <div className="col-span-2">
              <label className="text-xs text-gray-500 block mb-1">Notes (optional)</label>
              <input className={inputCls} placeholder="e.g. Long-term hold" value={form.notes} onChange={e => set('notes', e.target.value)} />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-3">
            <button onClick={() => { setShowForm(false); setEditingId(null) }} className="text-xs px-3 py-1.5 text-gray-500 hover:text-gray-700">Cancel</button>
            <button
              onClick={handleSubmit}
              disabled={!form.ticker || !form.name || !form.shares || !form.avgCost || !form.currentPrice}
              className="text-xs px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-40"
            >
              {editingId ? 'Save changes' : 'Add holding'}
            </button>
          </div>
        </div>
      )}

      {/* Holdings table */}
      {holdings.length === 0 ? (
        <p className="text-center text-gray-400 text-sm py-16">No holdings yet. Add one to start tracking your portfolio.</p>
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{enriched.length} position{enriched.length !== 1 ? 's' : ''}</p>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-gray-400">Group by</span>
              <select
                value={groupBy}
                onChange={e => setGroupBy(e.target.value as typeof groupBy)}
                className="text-xs border border-gray-200 rounded px-2 py-1 bg-white"
              >
                <option value="assetClass">Asset class</option>
                <option value="account">Account</option>
                <option value="none">None</option>
              </select>
            </div>
          </div>

          {/* Column headers */}
          <div className="grid grid-cols-[1fr_1.5fr_1fr_1fr_1fr_1fr_1fr_auto] gap-2 px-4 py-2 bg-gray-50 border-b border-gray-100 text-xs font-medium text-gray-400 uppercase tracking-wide">
            <span>Ticker</span>
            <span>Name</span>
            <span className="text-right">Shares</span>
            <span className="text-right">Avg Cost</span>
            <span className="text-right">Price</span>
            <span className="text-right">Value</span>
            <span className="text-right">Gain / Loss</span>
            <span />
          </div>

          {groups.map(({ key, label, items }) => {
            const groupValue = items.reduce((s, h) => s + h.value, 0)
            const groupGain = items.reduce((s, h) => s + h.gainLoss, 0)
            const groupCost = items.reduce((s, h) => s + h.costBasis, 0)
            const groupPct = groupCost > 0 ? (groupGain / groupCost) * 100 : 0
            return (
              <div key={key}>
                {label && (
                  <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b border-t border-gray-100">
                    <span className="text-xs font-semibold text-gray-600">{label}</span>
                    <div className="flex items-center gap-4 text-xs">
                      <span className="font-semibold text-gray-700">{fmt(groupValue)}</span>
                      <span className={groupGain >= 0 ? 'text-green-600' : 'text-red-500'}>{fmt(groupGain)} ({fmtPct(groupPct)})</span>
                    </div>
                  </div>
                )}
                {items.map(h => (
                  <div key={h.id} className="grid grid-cols-[1fr_1.5fr_1fr_1fr_1fr_1fr_1fr_auto] gap-2 px-4 py-3 border-b border-gray-100 last:border-0 hover:bg-gray-50 items-center group text-sm">
                    <span className="font-mono font-semibold text-gray-800">{h.ticker}</span>
                    <div className="min-w-0">
                      <div className="truncate text-gray-700">{h.name}</div>
                      {h.account && <div className="text-xs text-gray-400 truncate">{h.account}</div>}
                    </div>
                    <span className="text-right text-gray-600">{h.shares.toLocaleString(undefined, { maximumFractionDigits: 4 })}</span>
                    <span className="text-right text-gray-500">{fmtExact(h.avgCost)}</span>

                    {/* Price — clickable to quick-update */}
                    {priceEditId === h.id ? (
                      <div className="flex justify-end gap-1 items-center">
                        <input
                          type="number" step="any" min="0" autoFocus
                          className="w-20 text-xs text-right border border-blue-300 rounded px-1.5 py-1"
                          value={priceInput}
                          onChange={e => setPriceInput(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') savePrice(h.id); if (e.key === 'Escape') setPriceEditId(null) }}
                        />
                        <button onClick={() => savePrice(h.id)} className="text-green-600 hover:text-green-800 text-xs">✓</button>
                        <button onClick={() => setPriceEditId(null)} className="text-gray-400 hover:text-gray-600 text-xs">✕</button>
                      </div>
                    ) : (
                      <button
                        className="text-right text-gray-600 w-full flex items-center justify-end gap-1 group/price"
                        onClick={() => { setPriceEditId(h.id); setPriceInput(String(h.currentPrice)) }}
                        title="Click to update price"
                      >
                        {fmtExact(h.currentPrice)}
                        <RefreshCw className="w-3 h-3 text-gray-300 group-hover/price:text-blue-400 opacity-0 group-hover:opacity-100" />
                      </button>
                    )}

                    <span className="text-right font-semibold text-gray-900">{fmt(h.value)}</span>
                    <div className="text-right">
                      <div className={`font-medium ${h.gainLoss >= 0 ? 'text-green-600' : 'text-red-500'}`}>{fmt(h.gainLoss)}</div>
                      <div className={`text-xs ${h.gainLoss >= 0 ? 'text-green-500' : 'text-red-400'}`}>{fmtPct(h.gainLossPct)}</div>
                    </div>
                    <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100">
                      <button onClick={() => startEdit(h)} className="text-gray-300 hover:text-blue-400">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      {confirmDelete === h.id ? (
                        <span className="flex items-center gap-1 text-xs">
                          <button onClick={() => { deleteHolding(h.id); setConfirmDelete(null) }} className="text-red-500 hover:text-red-700 font-medium">Yes</button>
                          <button onClick={() => setConfirmDelete(null)} className="text-gray-400">No</button>
                        </span>
                      ) : (
                        <button onClick={() => setConfirmDelete(h.id)} className="text-gray-300 hover:text-red-400">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )
          })}

          {/* Footer total */}
          <div className="grid grid-cols-[1fr_1.5fr_1fr_1fr_1fr_1fr_1fr_auto] gap-2 px-4 py-3 bg-gray-50 border-t border-gray-200 text-sm font-semibold">
            <span className="col-span-5 text-gray-500 text-xs uppercase tracking-wide flex items-end">Total</span>
            <span className="text-right text-gray-900">{fmt(totalValue)}</span>
            <div className="text-right">
              <div className={totalGainLoss >= 0 ? 'text-green-600' : 'text-red-500'}>{fmt(totalGainLoss)}</div>
              <div className={`text-xs font-normal ${totalGainLoss >= 0 ? 'text-green-500' : 'text-red-400'}`}>{fmtPct(totalGainLossPct)}</div>
            </div>
            <span />
          </div>
        </div>
      )}
    </div>
  )
}
