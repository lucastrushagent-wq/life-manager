import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, X, TrendingUp, TrendingDown, DollarSign, Target, Check } from 'lucide-react'
import { PhilosophyBox } from '../../../core/PhilosophyBox'
import { useFinanceStore } from '../store'
import type { AccountCategory, AccountType, FinanceAccount, NetWorthTarget } from '../types'
import { NetWorthChart } from './NetWorthChart'
import { ExpensesTab } from './ExpensesTab'

type InnerTab = 'net_worth' | 'expenses'

const CATEGORY_LABELS: Record<AccountCategory, string> = {
  '401k': '401(k)',
  stocks: 'Stocks',
  property: 'Property',
  savings_account: 'Savings Account',
  debit_account: 'Debit Account',
  cash: 'Cash',
  crypto: 'Crypto',
  vehicle: 'Vehicle',
  bonds: 'Bonds',
  business: 'Business',
  misc_asset: 'Misc Assets',
  credit_card: 'Credit Cards',
  personal_loan: 'Personal Loan',
  mortgage: 'Mortgage',
  hecs_debt: 'HECS Debt',
  student_loan: 'Student Loan',
  other_debt: 'Other Debt',
}

const CATEGORY_TYPE: Record<AccountCategory, AccountType> = {
  '401k': 'asset',
  stocks: 'asset',
  property: 'asset',
  savings_account: 'asset',
  debit_account: 'asset',
  cash: 'asset',
  crypto: 'asset',
  vehicle: 'asset',
  bonds: 'asset',
  business: 'asset',
  misc_asset: 'asset',
  credit_card: 'liability',
  personal_loan: 'liability',
  mortgage: 'liability',
  hecs_debt: 'liability',
  student_loan: 'liability',
  other_debt: 'liability',
}

const ASSET_CATEGORIES: AccountCategory[] = [
  '401k', 'stocks', 'property', 'savings_account', 'debit_account',
  'cash', 'crypto', 'vehicle', 'bonds', 'business', 'misc_asset',
]
const LIABILITY_CATEGORIES: AccountCategory[] = [
  'credit_card', 'personal_loan', 'mortgage', 'hecs_debt', 'student_loan', 'other_debt',
]

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

interface TargetFormState {
  label: string
  targetAmount: string
  targetDate: string
  notes: string
}

const DEFAULT_TARGET_FORM: TargetFormState = { label: '', targetAmount: '', targetDate: '', notes: '' }

function daysUntil(dateStr: string): number {
  const target = new Date(dateStr + 'T00:00:00').getTime()
  return Math.round((target - Date.now()) / 86_400_000)
}

export function FinanceModule() {
  const { accounts, snapshots, targets, load, create, update, remove, createTarget, updateTarget, removeTarget } = useFinanceStore()
  const [activeTab, setActiveTab] = useState<InnerTab>('net_worth')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setFormState] = useState<FormState>(DEFAULT_FORM)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const [showTargetForm, setShowTargetForm] = useState(false)
  const [editingTargetId, setEditingTargetId] = useState<string | null>(null)
  const [targetForm, setTargetForm] = useState<TargetFormState>(DEFAULT_TARGET_FORM)
  const [confirmDeleteTarget, setConfirmDeleteTarget] = useState<string | null>(null)

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

  function startAddTarget() {
    setTargetForm(DEFAULT_TARGET_FORM)
    setEditingTargetId(null)
    setShowTargetForm(true)
  }

  function startEditTarget(t: NetWorthTarget) {
    setTargetForm({
      label: t.label,
      targetAmount: String(t.targetAmount),
      targetDate: t.targetDate ?? '',
      notes: t.notes ?? '',
    })
    setEditingTargetId(t.id)
    setShowTargetForm(true)
  }

  async function handleTargetSubmit() {
    const amount = parseFloat(targetForm.targetAmount)
    if (!targetForm.label.trim() || isNaN(amount)) return
    const payload = {
      label: targetForm.label.trim(),
      targetAmount: amount,
      targetDate: targetForm.targetDate || undefined,
      notes: targetForm.notes.trim() || undefined,
    }
    if (editingTargetId) {
      await updateTarget(editingTargetId, payload)
    } else {
      await createTarget(payload)
    }
    setShowTargetForm(false)
    setEditingTargetId(null)
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
        <h1 className="text-xl font-semibold text-gray-900">Finance</h1>
        {activeTab === 'net_worth' && !showForm && (
          <button
            onClick={startAdd}
            className="flex items-center gap-1.5 text-sm px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            Add account
          </button>
        )}
      </div>

      <PhilosophyBox moduleId="finance" />

      {/* Inner tabs */}
      <div className="flex gap-1 mb-6 border-b border-gray-200">
        {([['net_worth', 'Net Worth'], ['expenses', 'Expenses']] as [InnerTab, string][]).map(([id, label]) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              activeTab === id ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {activeTab === 'expenses' && <ExpensesTab />}
      {activeTab !== 'expenses' && <>


      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
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

      {/* Chart */}
      {snapshots.length > 0 && (
        <div className="mb-8 rounded-xl border border-gray-200 bg-white px-5 py-4">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-4">History</h2>
          <NetWorthChart snapshots={snapshots} />
        </div>
      )}

      {/* Targets */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500 flex items-center gap-1.5">
            <Target className="w-3.5 h-3.5" /> Targets
          </h2>
          {!showTargetForm && (
            <button
              onClick={startAddTarget}
              className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium"
            >
              <Plus className="w-3.5 h-3.5" /> Add target
            </button>
          )}
        </div>

        {showTargetForm && (
          <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-800">{editingTargetId ? 'Edit target' : 'Add target'}</h3>
              <button onClick={() => { setShowTargetForm(false); setEditingTargetId(null) }} className="text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <input
                  className={inputCls}
                  placeholder='Label (e.g. "End of 2026", "Financial Freedom")'
                  value={targetForm.label}
                  onChange={e => setTargetForm(f => ({ ...f, label: e.target.value }))}
                  autoFocus
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Target net worth ($)</label>
                <input
                  type="number"
                  className={inputCls}
                  placeholder="e.g. 500000"
                  value={targetForm.targetAmount}
                  min={0}
                  step={1000}
                  onChange={e => setTargetForm(f => ({ ...f, targetAmount: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Target date (optional)</label>
                <input
                  type="date"
                  className={inputCls}
                  value={targetForm.targetDate}
                  onChange={e => setTargetForm(f => ({ ...f, targetDate: e.target.value }))}
                />
              </div>
              <div className="col-span-2">
                <input
                  className={inputCls}
                  placeholder="Notes (optional)"
                  value={targetForm.notes}
                  onChange={e => setTargetForm(f => ({ ...f, notes: e.target.value }))}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-3">
              <button
                onClick={() => { setShowTargetForm(false); setEditingTargetId(null) }}
                className="text-xs px-3 py-1.5 text-gray-500 hover:text-gray-700"
              >Cancel</button>
              <button
                onClick={handleTargetSubmit}
                disabled={!targetForm.label.trim() || !targetForm.targetAmount}
                className="text-xs px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-40"
              >
                {editingTargetId ? 'Save changes' : 'Add target'}
              </button>
            </div>
          </div>
        )}

        {targets.length === 0 && !showTargetForm ? (
          <p className="text-sm text-gray-400 text-center py-6 rounded-lg border border-dashed border-gray-200">
            No targets yet. Add an end-of-year or financial freedom goal.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {targets.map(t => {
              const pct = t.targetAmount > 0 ? Math.min(100, Math.max(0, (netWorth / t.targetAmount) * 100)) : 0
              const achieved = netWorth >= t.targetAmount
              const remaining = t.targetAmount - netWorth
              const days = t.targetDate ? daysUntil(t.targetDate) : null

              return (
                <div key={t.id} className="rounded-xl border border-gray-200 bg-white px-5 py-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-gray-800">{t.label}</span>
                        {achieved && <span className="flex items-center gap-0.5 text-xs font-medium text-green-600 bg-green-50 border border-green-200 rounded-full px-2 py-0.5"><Check className="w-3 h-3" /> Achieved</span>}
                      </div>
                      {t.notes && <p className="text-xs text-gray-400 mt-0.5">{t.notes}</p>}
                    </div>
                    <div className="flex items-center gap-2 ml-4 shrink-0">
                      <button onClick={() => startEditTarget(t)} className="text-gray-300 hover:text-blue-400 transition-colors">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      {confirmDeleteTarget === t.id ? (
                        <span className="flex items-center gap-1 text-xs">
                          <button onClick={() => { removeTarget(t.id); setConfirmDeleteTarget(null) }} className="text-red-500 hover:text-red-700 font-medium">Yes</button>
                          <button onClick={() => setConfirmDeleteTarget(null)} className="text-gray-400 hover:text-gray-600">No</button>
                        </span>
                      ) : (
                        <button onClick={() => setConfirmDeleteTarget(t.id)} className="text-gray-300 hover:text-red-400 transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-gray-100 rounded-full h-2 mb-2 overflow-hidden">
                    <div
                      className={`h-2 rounded-full transition-all ${achieved ? 'bg-green-500' : 'bg-blue-500'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>

                  {/* Stats row */}
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <div className="flex items-center gap-3">
                      <span>
                        <span className={`font-semibold ${achieved ? 'text-green-600' : 'text-gray-800'}`}>
                          {pct.toFixed(1)}%
                        </span>
                        {' '}of {formatCurrency(t.targetAmount)}
                      </span>
                      {!achieved && (
                        <span className="text-gray-400">{formatCurrency(remaining)} to go</span>
                      )}
                    </div>
                    {days !== null && (
                      <span className={days < 0 ? 'text-red-400 font-medium' : days <= 30 ? 'text-orange-500 font-medium' : 'text-gray-400'}>
                        {days < 0
                          ? `${Math.abs(days)}d overdue`
                          : days === 0
                          ? 'Due today'
                          : `${days}d remaining`}
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
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
                <option value="savings_account">Savings Account</option>
                <option value="debit_account">Debit Account</option>
                <option value="cash">Cash</option>
                <option value="crypto">Crypto</option>
                <option value="vehicle">Vehicle</option>
                <option value="bonds">Bonds</option>
                <option value="business">Business</option>
                <option value="misc_asset">Misc Asset</option>
              </optgroup>
              <optgroup label="Liabilities">
                <option value="credit_card">Credit Card</option>
                <option value="personal_loan">Personal Loan</option>
                <option value="mortgage">Mortgage</option>
                <option value="hecs_debt">HECS Debt</option>
                <option value="student_loan">Student Loan</option>
                <option value="other_debt">Other Debt</option>
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
      </>}
    </div>
  )
}
