import { useState, useEffect, useRef } from 'react'
import { Upload, Trash2, ChevronDown, X, Pencil, Check } from 'lucide-react'
import type { Expense, ExpenseCategory } from '../types'

// ── Categories ──────────────────────────────────────────────────────────────

export const CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  food_dining: 'Food & Dining',
  groceries: 'Groceries',
  transport: 'Transport',
  shopping: 'Shopping',
  entertainment: 'Entertainment',
  health_fitness: 'Health & Fitness',
  utilities: 'Utilities',
  travel: 'Travel',
  subscriptions: 'Subscriptions',
  other: 'Other',
}

const CATEGORY_COLORS: Record<ExpenseCategory, string> = {
  food_dining: 'bg-orange-100 text-orange-700',
  groceries: 'bg-green-100 text-green-700',
  transport: 'bg-blue-100 text-blue-700',
  shopping: 'bg-purple-100 text-purple-700',
  entertainment: 'bg-pink-100 text-pink-700',
  health_fitness: 'bg-teal-100 text-teal-700',
  utilities: 'bg-yellow-100 text-yellow-700',
  travel: 'bg-sky-100 text-sky-700',
  subscriptions: 'bg-indigo-100 text-indigo-700',
  other: 'bg-gray-100 text-gray-600',
}

const CATEGORY_BAR_COLORS: Record<ExpenseCategory, string> = {
  food_dining: 'bg-orange-400',
  groceries: 'bg-green-400',
  transport: 'bg-blue-400',
  shopping: 'bg-purple-400',
  entertainment: 'bg-pink-400',
  health_fitness: 'bg-teal-400',
  utilities: 'bg-yellow-400',
  travel: 'bg-sky-400',
  subscriptions: 'bg-indigo-400',
  other: 'bg-gray-300',
}

const CATEGORY_KEYWORDS: Record<ExpenseCategory, string[]> = {
  food_dining: [
    'starbucks', 'mcdonald', 'subway', 'chipotle', 'doordash', 'uber eat', 'grubhub',
    'postmates', 'restaurant', 'cafe', 'coffee', 'pizza', 'sushi', 'burger', 'taco',
    'diner', 'grill', 'kitchen', 'bakery', 'dunkin', 'panera', 'chick-fil', 'wendy',
    'domino', 'papa john', 'five guys', 'in-n-out', 'shake shack', 'sweetgreen',
    'bar ', 'pub ', 'tavern', 'boba', 'smoothie', 'juice bar', 'noodle', 'ramen',
    'poke', 'thai', 'indian', 'chinese', 'mexican', 'italian', 'steakhouse',
  ],
  groceries: [
    'whole foods', 'trader joe', 'safeway', 'kroger', 'albertsons', 'publix',
    'costco', 'walmart', 'target', 'aldi', 'sprouts', 'wegmans', 'grocery',
    'supermarket', 'market', 'fresh market', 'food lion', 'harris teeter', 'heb ',
    'meijer', 'stop & shop', 'giant', 'vons', 'pavilions', 'ralphs',
  ],
  transport: [
    'uber', 'lyft', 'taxi', 'gas station', 'shell ', 'bp ', 'chevron', 'exxon',
    'mobil', 'speedway', 'circle k', 'wawa', 'parkway', 'parking', 'metro',
    'transit', 'mta ', 'bart ', 'caltrain', 'clipper', 'toll', 'autozone',
    'jiffy lube', 'valvoline', 'firestone', 'midas', 'pep boys', 'car wash',
  ],
  shopping: [
    'amazon', 'ebay', 'etsy', "macy's", 'macy', 'nordstrom', 'gap ', 'h&m',
    'zara', 'old navy', 'best buy', 'apple.com/bill', 'apple store', 'ikea',
    'home depot', 'lowes', 'wayfair', 'chewy', 'shopify', 'tj maxx', 'marshalls',
    'ross ', 'kohls', 'jcpenney', 'sephora', 'ulta', 'bath & body', 'victoria',
  ],
  entertainment: [
    'netflix', 'spotify', 'hulu', 'disney', 'hbo ', 'apple tv', 'youtube',
    'movie', 'cinema', 'theater', 'concert', 'ticketmaster', 'stubhub',
    'steam', 'playstation', 'xbox', 'nintendo', 'twitch', 'patreon',
    'audible', 'kindle', 'amazon prime', 'peacock', 'paramount',
  ],
  health_fitness: [
    'pharmacy', 'cvs ', 'walgreens', 'rite aid', 'doctor', 'hospital',
    'dental', 'vision', 'gym', 'planet fitness', 'equinox', 'crossfit',
    'medical', 'health', 'clinic', 'urgent care', 'lab ', 'quest diagnostics',
    'optometrist', 'chiropractor', 'massage', 'spa ', 'peloton',
  ],
  utilities: [
    'at&t', 'verizon', 't-mobile', 'comcast', 'spectrum', 'xfinity',
    'electric', 'utility', 'water ', 'internet', 'cox ', 'centurylink',
    'lumen', 'frontier', 'directv', 'dish network', 'google fi',
    'pg&e', 'con edison', 'duke energy', 'pge ',
  ],
  travel: [
    'hotel', 'hilton', 'marriott', 'hyatt', 'sheraton', 'westin', 'airbnb',
    'vrbo', 'expedia', 'booking.com', 'kayak', 'priceline', 'hotels.com',
    'delta', 'united', 'american air', 'southwest', 'jetblue', 'spirit air',
    'frontier air', 'enterprise rent', 'hertz', 'avis ', 'budget rent',
  ],
  subscriptions: [
    'icloud', 'google one', 'google storage', 'microsoft 365', 'office 365',
    'adobe', 'dropbox', 'slack ', 'zoom ', 'notion', 'github', 'figma',
    'canva', 'grammarly', '1password', 'lastpass', 'nordvpn', 'expressvpn',
    'duolingo', 'masterclass',
  ],
  other: [],
}

function autoCategory(description: string): ExpenseCategory {
  const desc = description.toLowerCase()
  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS) as [ExpenseCategory, string[]][]) {
    if (cat === 'other') continue
    if (keywords.some(k => desc.includes(k))) return cat
  }
  return 'other'
}

// ── CSV parsing ──────────────────────────────────────────────────────────────

function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  for (const char of line) {
    if (char === '"') { inQuotes = !inQuotes }
    else if (char === ',' && !inQuotes) { result.push(current.trim().replace(/^"|"$/g, '')); current = '' }
    else { current += char }
  }
  result.push(current.trim().replace(/^"|"$/g, ''))
  return result
}

function parseCSV(text: string): { headers: string[]; rows: string[][] } {
  const lines = text.trim().split(/\r?\n/).filter(l => l.trim())
  const headers = parseCSVLine(lines[0])
  const rows = lines.slice(1).map(parseCSVLine).filter(r => r.some(c => c.trim()))
  return { headers, rows }
}

function detectColumns(headers: string[]): { dateCol: number; descCol: number; amountCol: number; creditCol: number } {
  const h = headers.map(h => h.toLowerCase().replace(/[\s_-]/g, ''))
  const find = (...terms: string[]) => h.findIndex(col => terms.some(t => col.includes(t)))

  const dateCol = find('transactiondate', 'date', 'postdate')
  const descCol = find('description', 'merchant', 'payee', 'name', 'memo')
  const amountCol = find('amount', 'debit', 'charge', 'transaction')
  const creditCol = find('credit', 'payment')

  return {
    dateCol: dateCol >= 0 ? dateCol : 0,
    descCol: descCol >= 0 ? descCol : 1,
    amountCol: amountCol >= 0 ? amountCol : 2,
    creditCol: creditCol >= 0 && creditCol !== amountCol ? creditCol : -1,
  }
}

function parseAmount(str: string): number | null {
  if (!str || !str.trim()) return null
  const cleaned = str.replace(/[$,\s]/g, '').replace(/^\((.+)\)$/, '-$1')
  const num = parseFloat(cleaned)
  return isNaN(num) ? null : num
}

function parseDate(str: string): string | null {
  if (!str) return null
  // Try MM/DD/YYYY or MM/DD/YY
  const mdy = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/)
  if (mdy) {
    const y = mdy[3].length === 2 ? `20${mdy[3]}` : mdy[3]
    return `${y}-${mdy[1].padStart(2, '0')}-${mdy[2].padStart(2, '0')}`
  }
  // Try YYYY-MM-DD (already ISO)
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str
  // Try to parse generically
  const d = new Date(str)
  if (!isNaN(d.getTime())) return d.toISOString().split('T')[0]
  return null
}

interface ParsedTransaction {
  date: string
  description: string
  amount: number
  category: ExpenseCategory
}

function parseTransactions(
  rows: string[][],
  dateCol: number,
  descCol: number,
  amountCol: number,
  creditCol: number,
): { transactions: ParsedTransaction[]; skipped: number } {
  const transactions: ParsedTransaction[] = []
  let skipped = 0

  for (const row of rows) {
    const rawDate = row[dateCol] ?? ''
    const rawDesc = row[descCol] ?? ''
    const rawAmount = row[amountCol] ?? ''
    const rawCredit = creditCol >= 0 ? (row[creditCol] ?? '') : ''

    const date = parseDate(rawDate)
    if (!date) { skipped++; continue }

    const desc = rawDesc.trim()
    if (!desc) { skipped++; continue }

    let amount: number | null = null

    // Citi-style: separate debit/credit columns
    if (creditCol >= 0) {
      const debit = parseAmount(rawAmount)
      const credit = parseAmount(rawCredit)
      if (debit && debit > 0) amount = debit
      else if (credit && credit > 0) amount = null // skip payments
      else { skipped++; continue }
    } else {
      const raw = parseAmount(rawAmount)
      if (raw === null) { skipped++; continue }
      // Chase uses negative for expenses
      amount = raw < 0 ? Math.abs(raw) : raw
    }

    if (!amount || amount <= 0) { skipped++; continue }

    transactions.push({ date, description: desc, amount: Math.round(amount * 100) / 100, category: autoCategory(desc) })
  }

  return { transactions, skipped }
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(n: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
}

function formatCurrencyExact(n: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)
}

const CATEGORIES = Object.keys(CATEGORY_LABELS) as ExpenseCategory[]

const PERIOD_OPTIONS = [
  { value: 'this_month', label: 'This month' },
  { value: 'last_month', label: 'Last month' },
  { value: 'last_3', label: 'Last 3 months' },
  { value: 'this_year', label: 'This year' },
  { value: 'all', label: 'All time' },
]

function periodRange(period: string): { from: string; to: string } {
  const now = new Date()
  const y = now.getFullYear()
  const m = now.getMonth()
  const pad = (n: number) => String(n).padStart(2, '0')
  const isoDate = (d: Date) => d.toISOString().split('T')[0]

  if (period === 'this_month') {
    return { from: `${y}-${pad(m + 1)}-01`, to: isoDate(now) }
  }
  if (period === 'last_month') {
    const first = new Date(y, m - 1, 1)
    const last = new Date(y, m, 0)
    return { from: isoDate(first), to: isoDate(last) }
  }
  if (period === 'last_3') {
    const from = new Date(y, m - 2, 1)
    return { from: isoDate(from), to: isoDate(now) }
  }
  if (period === 'this_year') {
    return { from: `${y}-01-01`, to: isoDate(now) }
  }
  return { from: '2000-01-01', to: '2099-12-31' }
}

// ── Main component ────────────────────────────────────────────────────────────

export function ExpensesTab() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [sources, setSources] = useState<string[]>([])
  const [period, setPeriod] = useState('this_month')
  const [filterCategory, setFilterCategory] = useState<ExpenseCategory | 'all'>('all')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editCategory, setEditCategory] = useState<ExpenseCategory>('other')
  const [showImport, setShowImport] = useState(false)
  const [showSources, setShowSources] = useState(false)

  const { from, to } = periodRange(period)

  async function loadExpenses() {
    const r = await fetch(`/api/expenses?from=${from}&to=${to}`)
    const data: Expense[] = await r.json()
    setExpenses(data)
  }

  async function loadSources() {
    const r = await fetch('/api/expenses/sources')
    setSources(await r.json())
  }

  useEffect(() => { loadExpenses() }, [from, to])
  useEffect(() => { loadSources() }, [])

  async function updateCategory(id: string, category: ExpenseCategory) {
    await fetch(`/api/expenses/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ category }) })
    setExpenses(prev => prev.map(e => e.id === id ? { ...e, category } : e))
    setEditingId(null)
  }

  async function deleteExpense(id: string) {
    await fetch(`/api/expenses/${id}`, { method: 'DELETE' })
    setExpenses(prev => prev.filter(e => e.id !== id))
  }

  async function deleteSource(source: string) {
    await fetch(`/api/expenses/source/${encodeURIComponent(source)}`, { method: 'DELETE' })
    loadExpenses()
    loadSources()
  }

  const filtered = filterCategory === 'all' ? expenses : expenses.filter(e => e.category === filterCategory)
  const totalSpend = filtered.reduce((s, e) => s + e.amount, 0)

  // Category breakdown
  const byCategory = CATEGORIES
    .map(cat => ({
      cat,
      total: filtered.filter(e => e.category === cat).reduce((s, e) => s + e.amount, 0),
      count: filtered.filter(e => e.category === cat).length,
    }))
    .filter(g => g.total > 0)
    .sort((a, b) => b.total - a.total)

  const maxCategoryTotal = byCategory[0]?.total ?? 1

  return (
    <div>
      {/* Header row */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <select
            value={period}
            onChange={e => { setPeriod(e.target.value); setFilterCategory('all') }}
            className="text-sm border border-gray-200 rounded px-2 py-1.5 bg-white"
          >
            {PERIOD_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <button
            onClick={() => setShowSources(v => !v)}
            className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-0.5"
          >
            {sources.length} source{sources.length !== 1 ? 's' : ''} <ChevronDown className="w-3 h-3" />
          </button>
        </div>
        <button
          onClick={() => setShowImport(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <Upload className="w-3.5 h-3.5" /> Import CSV
        </button>
      </div>

      {/* Source manager */}
      {showSources && (
        <div className="mb-6 p-3 border border-gray-200 rounded-lg bg-gray-50">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Imported sources</p>
          {sources.length === 0 ? (
            <p className="text-sm text-gray-400">No sources imported yet.</p>
          ) : (
            <div className="space-y-1">
              {sources.map(s => (
                <div key={s} className="flex items-center justify-between text-sm">
                  <span className="text-gray-700">{s}</span>
                  <button onClick={() => deleteSource(s)} className="text-gray-300 hover:text-red-400 ml-4">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Import modal */}
      {showImport && (
        <ImportPanel
          onImported={() => { loadExpenses(); loadSources(); setShowImport(false) }}
          onClose={() => setShowImport(false)}
        />
      )}

      {expenses.length === 0 && !showImport ? (
        <div className="text-center py-16">
          <Upload className="w-8 h-8 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium mb-1">No expense data</p>
          <p className="text-sm text-gray-400 mb-4">Import a CSV credit card statement to get started.</p>
          <button
            onClick={() => setShowImport(true)}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Import CSV
          </button>
        </div>
      ) : (
        <>
          {/* Summary */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="rounded-xl border border-gray-200 bg-white px-5 py-4">
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Total Spend</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalSpend)}</p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white px-5 py-4">
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Transactions</p>
              <p className="text-2xl font-bold text-gray-900">{filtered.length}</p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white px-5 py-4">
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Categories</p>
              <p className="text-2xl font-bold text-gray-900">{byCategory.length}</p>
            </div>
          </div>

          {/* Category breakdown */}
          {byCategory.length > 0 && (
            <div className="rounded-xl border border-gray-200 bg-white p-5 mb-6">
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Spend by Category</p>
                {filterCategory !== 'all' && (
                  <button onClick={() => setFilterCategory('all')} className="text-xs text-blue-600 hover:underline flex items-center gap-0.5">
                    <X className="w-3 h-3" /> Clear filter
                  </button>
                )}
              </div>
              <div className="space-y-3">
                {byCategory.map(({ cat, total, count }) => (
                  <button
                    key={cat}
                    onClick={() => setFilterCategory(filterCategory === cat ? 'all' : cat)}
                    className={`w-full text-left group ${filterCategory === cat ? 'opacity-100' : filterCategory !== 'all' ? 'opacity-40' : 'opacity-100'}`}
                  >
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className={`font-medium ${filterCategory === cat ? 'text-gray-900' : 'text-gray-600 group-hover:text-gray-900'}`}>
                        {CATEGORY_LABELS[cat]}
                      </span>
                      <div className="flex items-center gap-3">
                        <span className="text-gray-400">{count} tx</span>
                        <span className="font-semibold text-gray-800 w-16 text-right">{formatCurrency(total)}</span>
                        <span className="text-gray-400 w-8 text-right">{Math.round((total / totalSpend) * 100)}%</span>
                      </div>
                    </div>
                    <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${CATEGORY_BAR_COLORS[cat]}`}
                        style={{ width: `${(total / maxCategoryTotal) * 100}%` }}
                      />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Transaction list */}
          <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Transactions{filterCategory !== 'all' ? ` — ${CATEGORY_LABELS[filterCategory]}` : ''}
              </p>
              <p className="text-xs text-gray-400">{filtered.length} shown</p>
            </div>
            <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
              {filtered.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">No transactions in this period.</p>
              ) : (
                filtered.map(e => (
                  <div key={e.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 group">
                    <span className="text-xs text-gray-400 w-20 flex-shrink-0">{e.date.slice(5).replace('-', '/')}</span>
                    <span className="flex-1 text-sm text-gray-700 truncate">{e.description}</span>

                    {/* Category pill / editor */}
                    {editingId === e.id ? (
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <select
                          autoFocus
                          value={editCategory}
                          onChange={ev => setEditCategory(ev.target.value as ExpenseCategory)}
                          className="text-xs border border-gray-300 rounded px-1.5 py-0.5 bg-white"
                        >
                          {CATEGORIES.map(c => <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>)}
                        </select>
                        <button onClick={() => updateCategory(e.id, editCategory)} className="text-green-600 hover:text-green-800">
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => setEditingId(null)} className="text-gray-400 hover:text-gray-600">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => { setEditingId(e.id); setEditCategory(e.category) }}
                        className={`flex-shrink-0 px-2 py-0.5 rounded text-xs font-medium ${CATEGORY_COLORS[e.category]} flex items-center gap-1 opacity-80 hover:opacity-100`}
                      >
                        {CATEGORY_LABELS[e.category]}
                        <Pencil className="w-2.5 h-2.5 opacity-0 group-hover:opacity-60" />
                      </button>
                    )}

                    <span className="text-sm font-semibold text-gray-800 w-16 text-right flex-shrink-0">
                      {formatCurrencyExact(e.amount)}
                    </span>
                    <button
                      onClick={() => deleteExpense(e.id)}
                      className="text-gray-200 hover:text-red-400 opacity-0 group-hover:opacity-100 flex-shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// ── Import Panel ──────────────────────────────────────────────────────────────

interface ParsedPreview {
  transactions: ParsedTransaction[]
  skipped: number
  headers: string[]
  dateCol: number
  descCol: number
  amountCol: number
  creditCol: number
}

function ImportPanel({ onImported, onClose }: { onImported: () => void; onClose: () => void }) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<ParsedPreview | null>(null)
  const [rawData, setRawData] = useState<{ headers: string[]; rows: string[][] } | null>(null)
  const [cols, setCols] = useState({ dateCol: 0, descCol: 1, amountCol: 2, creditCol: -1 })
  const [sourceName, setSourceName] = useState('')
  const [importing, setImporting] = useState(false)
  const [error, setError] = useState('')

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setSourceName(file.name.replace(/\.[^.]+$/, ''))
    const reader = new FileReader()
    reader.onload = ev => {
      const text = ev.target?.result as string
      try {
        const parsed = parseCSV(text)
        setRawData(parsed)
        const detected = detectColumns(parsed.headers)
        setCols(detected)
        applyParse(parsed, detected)
        setError('')
      } catch (err: any) {
        setError('Could not parse this file. Make sure it is a valid CSV.')
      }
    }
    reader.readAsText(file)
  }

  function applyParse(data: { headers: string[]; rows: string[][] }, c: typeof cols) {
    const { transactions, skipped } = parseTransactions(data.rows, c.dateCol, c.descCol, c.amountCol, c.creditCol)
    setPreview({ transactions, skipped, headers: data.headers, ...c })
  }

  function handleColChange(patch: Partial<typeof cols>) {
    const next = { ...cols, ...patch }
    setCols(next)
    if (rawData) applyParse(rawData, next)
  }

  async function handleImport() {
    if (!preview || !sourceName.trim()) return
    setImporting(true)
    try {
      const r = await fetch('/api/expenses/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source: sourceName.trim(), transactions: preview.transactions }),
      })
      if (!r.ok) throw new Error('Import failed')
      onImported()
    } catch (err: any) {
      setError(err.message)
    }
    setImporting(false)
  }

  const colSelect = (label: string, value: number, key: keyof typeof cols) => (
    <div>
      <label className="block text-xs text-gray-500 mb-1">{label}</label>
      <select
        value={value}
        onChange={e => handleColChange({ [key]: Number(e.target.value) })}
        className="text-xs border border-gray-300 rounded px-2 py-1.5 bg-white w-full"
      >
        {(rawData?.headers ?? []).map((h, i) => <option key={i} value={i}>{h || `Column ${i + 1}`}</option>)}
        {key === 'creditCol' && <option value={-1}>None</option>}
      </select>
    </div>
  )

  return (
    <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-800">Import credit card statement</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
      </div>

      {!rawData ? (
        <div>
          <p className="text-xs text-gray-500 mb-3">
            Upload a CSV export from your credit card (Chase, Amex, Citi, Capital One, etc.)
          </p>
          <input ref={fileRef} type="file" accept=".csv" onChange={handleFile} className="hidden" />
          <button
            onClick={() => fileRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-blue-300 rounded-lg text-sm text-blue-600 hover:border-blue-500 hover:bg-blue-100 transition-colors"
          >
            <Upload className="w-4 h-4" /> Choose CSV file
          </button>
          {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
        </div>
      ) : (
        <div className="space-y-4">
          {/* Column mapping */}
          <div>
            <p className="text-xs font-medium text-gray-600 mb-2">Column mapping — adjust if auto-detection is wrong</p>
            <div className="grid grid-cols-4 gap-2">
              {colSelect('Date column', cols.dateCol, 'dateCol')}
              {colSelect('Description column', cols.descCol, 'descCol')}
              {colSelect('Amount column', cols.amountCol, 'amountCol')}
              {colSelect('Credit/Payment column', cols.creditCol, 'creditCol')}
            </div>
          </div>

          {/* Source name */}
          <div>
            <label className="block text-xs text-gray-500 mb-1">Source name</label>
            <input
              className="text-sm border border-gray-300 rounded px-2 py-1.5 w-full bg-white"
              value={sourceName}
              onChange={e => setSourceName(e.target.value)}
              placeholder="e.g. Chase Sapphire — March 2025"
            />
          </div>

          {/* Preview */}
          {preview && (
            <div>
              <p className="text-xs font-medium text-gray-600 mb-2">
                Preview — {preview.transactions.length} transactions found
                {preview.skipped > 0 && <span className="text-gray-400 ml-1">({preview.skipped} skipped — payments/credits/invalid)</span>}
              </p>
              <div className="rounded border border-gray-200 bg-white overflow-hidden">
                <div className="divide-y divide-gray-100 max-h-48 overflow-y-auto">
                  {preview.transactions.slice(0, 20).map((t, i) => (
                    <div key={i} className="flex items-center gap-3 px-3 py-2 text-xs">
                      <span className="text-gray-400 w-20 flex-shrink-0">{t.date}</span>
                      <span className="flex-1 text-gray-700 truncate">{t.description}</span>
                      <span className={`px-1.5 py-0.5 rounded flex-shrink-0 ${CATEGORY_COLORS[t.category]}`}>
                        {CATEGORY_LABELS[t.category]}
                      </span>
                      <span className="font-semibold text-gray-800 flex-shrink-0">${t.amount.toFixed(2)}</span>
                    </div>
                  ))}
                  {preview.transactions.length > 20 && (
                    <div className="px-3 py-2 text-xs text-gray-400 text-center">
                      …and {preview.transactions.length - 20} more
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {error && <p className="text-red-500 text-xs">{error}</p>}

          <div className="flex items-center gap-2">
            <button
              onClick={handleImport}
              disabled={importing || !preview || preview.transactions.length === 0 || !sourceName.trim()}
              className="px-4 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-40"
            >
              {importing ? 'Importing…' : `Import ${preview?.transactions.length ?? 0} transactions`}
            </button>
            <button
              onClick={() => { setRawData(null); setPreview(null); setError('') }}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              ← Choose different file
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
