import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, X, TrendingUp, TrendingDown, DollarSign } from 'lucide-react'
import { useFinanceStore } from '../store'
import type { AccountCategory, AccountType, FinanceAccount } from '../types'

const CATEGORY_LABELS: Record<AccountCategory, string> = {
  '401k': '401(k)',
  stocks: 'Stocks',
  property: 'Property',
  misc_asset: 'Misc Assets',
  credit_card: 'Credit Cards',
  personal_loan: 'Personal Loans',
}

const CATEGORY_TYPE: Record<AccountCategory, AccountType> = {
  '401k': 'asset',
  stocks: 'asset',
  property: 'asset',
  misc_asset: 'asset',
  credit_card: 'liability',
  personal_loan: 'liability',
}

const ASSET_CATEGORIES: AccountCategory[] = ['401k', 'stocks', 'property', 'misc_asset']
const LIABILITY_CATEGORIES: AccountCategory[] = ['credit_card', 'personal_loan']

function formatCurrency(n: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
}

function todayStr(): string {
  return new Date().toISOString().split('T')[0]
}

interface FormState {
  name: string
  category: AccountCategory
  value: string
  lastUpdated: string
  notes: string
}

const DEFAULT_FORM: FormState = {
  name: '',
  category: '401k',
  value: '',
  lastUpdated: todayStr(),
  notes: '',
}

export function FinanceModule() {
  const { accounts, load, create, update, remove } = useFinanceStore()
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setFormState] = useState<FormState>(DEFAULT_FORM)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  useEffect(() => { load() }, [load])

  const totalAssets = accounts.filter(a => a.type === 'asset').reduce((s, a) => s + a.value, 0)
  const totalLiabilities = accounts.filter(a => a.type === 'liability').reduce((s, a) => s + a.value, 0)
  const netWorth = totalAssets - totalLiabilities

  function startAdd() {
    setFormState(DEFAULT_FORM)
    setEditingId(null)
    setShowForm(true)
  }

  function startEdit(account: FinanceAccount) {
    setFormState({
      name: account.name,
      category: account.category,
      value: String(account.value),
      lastUpdated: account.lastUpdated,
      notes: account.notes ?? '',
    })
    setEditingId(account.id)
    setShowForm(true)
  }

  async function handleSubmit() {
    const value = parseFloat(form.value)
    if (!form.name.trim() || isNaN(value) || value < 0) return
    const payload = {
      name: form.name.trim(),
      category: form.category,
      type: CATEGORY_TYPE[form.category],
      value,
      lastUpdated: form.lastUpdated || todayStr(),
      notes: form.notes.trim() || undefined,
    }
    if (editingId) {
      await update(editingId, payload)
    } else {
      await create(payload)
    }
    setShowForm(false)
    setEditingId(null)
  }

  function patchForm(patch: Partial<FormState>) {
    setFormState(f => ({ ...f, ...patch }))
  }

  const inputCls = 'text-sm border border-gray-200 rounded px-2 py-1.5 outline-none focus:border-blue-400 w-full'

  function renderGroup(categories: AccountCategory[], title: string, colorClass: string) {
    const grouped = categories
      .map(cat => ({ cat, items: accounts.filter(a => a.category === cat) }))
      .filter(g => g.items.length > 0)

    if (grouped.length === 0) return null

    return (
      <div>
        <h2 className={`text-xs font-semibold uppercase tracking-wide mb-3 ${colorClass}`}>{title}</h2>
        <div className="flex flex-col gap-4">
          {grouped.map(({ cat, items }) => (
            <div key={cat} className="rounded-lg border border-gray-200 overflow-hidden">
              <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">{CATEGORY_LABELS[cat]}</span>
                <span className="text-sm font-semibold text-gray-800">
                  {formatCurrency(items.reduce((s, a) => s + a.value, 0))}
                </span>
              </div>
              {items.map((account, i) => (
                <div
                  key={account.id}
                  className={`flex items-center justify-between px-4 py-3 bg-white text-sm ${i < items.length - 1 ? 'border-b border-gray-100' : ''}`}
                >
                  <div className="flex-1 min-w-0">
                    <span className="font-medium text-gray-800">{account.name}</span>
                    {account.notes && <span className="ml-2 text-xs text-gray-400">{account.notes}</span>}
                    <div className="text-xs text-gray-400 mt-0.5">
                      Updated {new Date(account.lastUpdated + 'T00:00:00').toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 ml-4">
                    <span className="font-semibold text-gray-800 whitespace-nowrap">{formatCurrency(account.value)}</span>
                    <div className="flex items-center gap-2">
                      <button onClick={() => startEdit(account)} className="text-gray-300 hover:text-blue-400 transition-colors">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      {confirmDelete === account.id ? (
                        <span className="flex items-center gap-1 text-xs">
                          <button
                            onClick={() => { remove(account.id); setConfirmDelete(null) }}
                            className="text-red-500 hover:text-red-700 font-medium"
                          >Yes</button>
                          <button onClick={() => setConfirmDelete(null)} className="text-gray-400 hover:text-gray-600">No</button>
                        </span>
                      ) : (
                        <button onClick={() => setConfirmDelete(account.id)} className="text-gray-300 hover:text-red-400 transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Net Worth</h1>
        {!showForm && (
          <button
            onClick={startAdd}
            className="flex items-center gap-1.5 text-sm px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            Add account
          </button>
        )}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="rounded-xl border border-green-100 bg-green-50 px-5 py-4">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-green-500" />
            <span className="text-xs font-medium text-green-700 uppercase tracking-wide">Total Assets</span>
          </div>
          <div className="text-2xl font-bold text-green-800">{formatCurrency(totalAssets)}</div>
        </div>
        <div className="rounded-xl border border-red-100 bg-red-50 px-5 py-4">
          <div className="flex items-center gap-2 mb-1">
            <TrendingDown className="w-4 h-4 text-red-400" />
            <span className="text-xs font-medium text-red-700 uppercase tracking-wide">Total Liabilities</span>
          </div>
          <div className="text-2xl font-bold text-red-700">{formatCurrency(totalLiabilities)}</div>
        </div>
        <div className={`rounded-xl border px-5 py-4 ${netWorth >= 0 ? 'border-blue-100 bg-blue-50' : 'border-orange-100 bg-orange-50'}`}>
          <div className="flex items-center gap-2 mb-1">
            <DollarSign className="w-4 h-4 text-blue-500" />
            <span className="text-xs font-medium text-blue-700 uppercase tracking-wide">Net Worth</span>
          </div>
          <div className={`text-2xl font-bold ${netWorth >= 0 ? 'text-blue-800' : 'text-orange-700'}`}>
            {formatCurrency(netWorth)}
          </div>
        </div>
      </div>

      {/* Add / Edit form */}
      {showForm && (
        <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-800">{editingId ? 'Edit account' : 'Add account'}</h2>
            <button onClick={() => { setShowForm(false); setEditingId(null) }} className="text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <input
                className={inputCls}
                placeholder="Account name (e.g. Fidelity 401k, Chase Sapphire)"
                value={form.name}
                onChange={e => patchForm({ name: e.target.value })}
                autoFocus
              />
            </div>
            <select
              className={`${inputCls} bg-white text-gray-700`}
              value={form.category}
              onChange={e => patchForm({ category: e.target.value as AccountCategory })}
            >
              <optgroup label="Assets">
                <option value="401k">401(k)</option>
                <option value="stocks">Stocks</option>
                <option value="property">Property</option>
                <option value="misc_asset">Misc Asset</option>
              </optgroup>
              <optgroup label="Liabilities">
                <option value="credit_card">Credit Card</option>
                <option value="personal_loan">Personal Loan</option>
              </optgroup>
            </select>
            <input
              type="number"
              className={inputCls}
              placeholder="Current value ($)"
              value={form.value}
              min={0}
              step={1}
              onChange={e => patchForm({ value: e.target.value })}
            />
            <div>
              <label className="text-xs text-gray-500 block mb-1">Last updated</label>
              <input
                type="date"
                className={inputCls}
                value={form.lastUpdated}
                onChange={e => patchForm({ lastUpdated: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Notes (optional)</label>
              <input
                className={inputCls}
                placeholder="e.g. Traditional, vested"
                value={form.notes}
                onChange={e => patchForm({ notes: e.target.value })}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-3">
            <button
              onClick={() => { setShowForm(false); setEditingId(null) }}
              className="text-xs px-3 py-1.5 text-gray-500 hover:text-gray-700"
            >Cancel</button>
            <button
              onClick={handleSubmit}
              disabled={!form.name.trim() || !form.value}
              className="text-xs px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-40"
            >
              {editingId ? 'Save changes' : 'Add account'}
            </button>
          </div>
        </div>
      )}

      {/* Account groups */}
      {accounts.length === 0 ? (
        <p className="text-center text-gray-400 text-sm py-16">
          No accounts yet. Add one to start tracking your net worth.
        </p>
      ) : (
        <div className="flex flex-col gap-8">
          {renderGroup(ASSET_CATEGORIES, 'Assets', 'text-green-600')}
          {renderGroup(LIABILITY_CATEGORIES, 'Liabilities', 'text-red-500')}
        </div>
      )}
    </div>
  )
}
