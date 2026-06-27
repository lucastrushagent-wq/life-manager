import { db } from './db.js'

const YNAB_BASE = 'https://api.ynab.com/v1'

// ── Type mappings ─────────────────────────────────────────────────────────────

type AccountCategory =
  | '401k' | 'stocks' | 'property' | 'savings_account' | 'debit_account'
  | 'cash' | 'crypto' | 'vehicle' | 'bonds' | 'business' | 'misc_asset'
  | 'credit_card' | 'personal_loan' | 'mortgage' | 'hecs_debt' | 'student_loan' | 'other_debt'

type ExpenseCategory =
  | 'food_dining' | 'groceries' | 'transport' | 'shopping' | 'entertainment'
  | 'health_fitness' | 'utilities' | 'travel' | 'subscriptions' | 'other'

const LIABILITY_CATEGORIES: AccountCategory[] = [
  'credit_card', 'personal_loan', 'mortgage', 'hecs_debt', 'student_loan', 'other_debt',
]

// YNAB account type → local AccountCategory
const ACCOUNT_TYPE_MAP: Record<string, AccountCategory> = {
  checking:          'debit_account',
  savings:           'savings_account',
  creditCard:        'credit_card',
  lineOfCredit:      'other_debt',
  otherAsset:        'misc_asset',
  otherLiability:    'other_debt',
  cash:              'cash',
  mortgage:          'mortgage',
  autoLoan:          'personal_loan',
  studentLoan:       'student_loan',
  personalLoan:      'personal_loan',
  medicalDebt:       'other_debt',
  investmentAccount: 'stocks',
}

function mapAccountType(ynabType: string): AccountCategory {
  return ACCOUNT_TYPE_MAP[ynabType] ?? 'misc_asset'
}

// YNAB category name → local ExpenseCategory (keyword match on semantic category names)
function mapCategory(categoryName: string): ExpenseCategory {
  const n = categoryName.toLowerCase()
  if (/groceri|grocery|supermarket|fresh market/.test(n)) return 'groceries'
  if (/dining|restaurant|food|lunch|dinner|breakfast|cafe|coffee|takeout|delivery|fast.food|eating/.test(n)) return 'food_dining'
  if (/gas.fuel|gas &|fuel|transport|transit|parking|uber|lyft|auto|vehicle|commut|toll|rideshare/.test(n)) return 'transport'
  if (/subscription|streaming|software|saas|membership|annual fee/.test(n)) return 'subscriptions'
  if (/entertainment|movie|music|concert|game|sport|recreation|fun|hobby/.test(n)) return 'entertainment'
  if (/health|medical|doctor|pharmacy|dental|vision|gym|fitness|wellness|therapy/.test(n)) return 'health_fitness'
  if (/utilit|electric|water bill|internet|phone|mobile|cable|sewer|trash/.test(n)) return 'utilities'
  if (/travel|hotel|flight|airbnb|vacation|trip|lodging|accommodation/.test(n)) return 'travel'
  if (/shopping|clothing|apparel|fashion|amazon|retail|purchase/.test(n)) return 'shopping'
  return 'other'
}

// ── YNAB API types ────────────────────────────────────────────────────────────

interface YnabAccount {
  id: string
  name: string
  type: string
  on_budget: boolean
  closed: boolean
  balance: number        // milliunits
  deleted: boolean
  transfer_payee_id: string | null
}

interface YnabSubtransaction {
  id: string
  amount: number         // milliunits, negative = outflow
  payee_name: string | null
  category_name: string | null
  memo: string | null
}

interface YnabTransaction {
  id: string
  date: string           // YYYY-MM-DD
  amount: number         // milliunits, negative = outflow
  payee_name: string | null
  category_name: string | null
  memo: string | null
  cleared: string
  approved: boolean
  deleted: boolean
  account_name: string
  transfer_account_id: string | null
  subtransactions: YnabSubtransaction[]
}

// ── Helpers ───────────────────────────────────────────────────────────────────

async function ynabFetch(path: string, apiKey: string) {
  const res = await fetch(`${YNAB_BASE}${path}`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`YNAB API ${res.status}: ${text}`)
  }
  return res.json() as Promise<any>
}

async function resolveBudgetId(apiKey: string): Promise<string> {
  if (process.env.YNAB_BUDGET_ID) return process.env.YNAB_BUDGET_ID
  const data = await ynabFetch('/budgets', apiKey)
  const budgets = data.data.budgets as { id: string; last_modified_on: string }[]
  if (!budgets.length) throw new Error('No YNAB budgets found')
  budgets.sort((a, b) => b.last_modified_on.localeCompare(a.last_modified_on))
  return budgets[0].id
}

// ── Main sync function ────────────────────────────────────────────────────────

export interface YnabSyncResult {
  budgetId: string
  accountsCreated: number
  accountsUpdated: number
  transactionsAdded: number
}

export async function syncYnab(): Promise<YnabSyncResult> {
  const apiKey = process.env.YNAB_API_KEY
  if (!apiKey) throw new Error('YNAB_API_KEY not set in .env')

  const budgetId = await resolveBudgetId(apiKey)
  const today = new Date().toISOString().slice(0, 10)
  const since = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)

  // ── 1. Sync account balances ───────────────────────────────────────────────
  const accountsData = await ynabFetch(`/budgets/${budgetId}/accounts`, apiKey)
  const ynabAccounts = (accountsData.data.accounts as YnabAccount[]).filter(
    a => !a.deleted && !a.closed
  )

  let accountsCreated = 0
  let accountsUpdated = 0

  for (const acct of ynabAccounts) {
    const category = mapAccountType(acct.type)
    const accountType = LIABILITY_CATEGORIES.includes(category) ? 'liability' : 'asset'
    // YNAB milliunits → dollars; liabilities come in as negative, store as positive
    const value = Math.abs(acct.balance / 1000)

    const existing = db.prepare('SELECT id FROM financeAccounts WHERE ynabAccountId = ?').get(acct.id) as { id: string } | undefined

    if (existing) {
      db.prepare('UPDATE financeAccounts SET value = ?, lastUpdated = ? WHERE id = ?')
        .run(value, today, existing.id)
      accountsUpdated++
    } else {
      db.prepare(
        `INSERT INTO financeAccounts
          (id, name, category, type, value, lastUpdated, notes, excluded, createdAt, ynabAccountId)
         VALUES (?, ?, ?, ?, ?, ?, 'Synced from YNAB', 0, ?, ?)`
      ).run(crypto.randomUUID(), acct.name, category, accountType, value, today, new Date().toISOString(), acct.id)
      accountsCreated++
    }
  }

  // ── 2. Sync transactions (last 90 days, outflows only, no transfers) ───────
  const txData = await ynabFetch(
    `/budgets/${budgetId}/transactions?since_date=${since}`,
    apiKey
  )
  const rawTransactions = (txData.data.transactions as YnabTransaction[]).filter(
    t => !t.deleted && t.approved && t.transfer_account_id === null && t.amount < 0
  )

  let transactionsAdded = 0
  const importedAt = new Date().toISOString()

  const insertTx = db.prepare(`
    INSERT OR IGNORE INTO expenses
      (id, date, description, amount, category, source, notes, importedAt, ynabTransactionId)
    VALUES (?, ?, ?, ?, ?, 'ynab', ?, ?, ?)
  `)

  const doImport = db.transaction(() => {
    for (const tx of rawTransactions) {
      if (tx.subtransactions && tx.subtransactions.length > 0) {
        // Split transaction — import each sub-line individually
        for (const sub of tx.subtransactions) {
          if (sub.amount >= 0) continue
          const amt = Math.abs(sub.amount / 1000)
          const desc = sub.payee_name ?? tx.payee_name ?? sub.memo ?? tx.memo ?? 'Unknown'
          const cat = mapCategory(sub.category_name ?? '')
          const notes = [sub.memo, tx.memo].filter(Boolean).join(' · ') || null
          const result = insertTx.run(
            crypto.randomUUID(), tx.date, desc, amt, cat, notes, importedAt, `${tx.id}::${sub.id}`
          )
          if ((result as any).changes > 0) transactionsAdded++
        }
      } else {
        const amt = Math.abs(tx.amount / 1000)
        const desc = tx.payee_name ?? tx.memo ?? 'Unknown'
        const cat = mapCategory(tx.category_name ?? '')
        const notes = tx.memo ?? null
        const result = insertTx.run(
          crypto.randomUUID(), tx.date, desc, amt, cat, notes, importedAt, tx.id
        )
        if ((result as any).changes > 0) transactionsAdded++
      }
    }
  })
  doImport()

  // ── 3. Log the sync ───────────────────────────────────────────────────────
  db.prepare(
    `INSERT INTO ynabSyncLog (id, syncedAt, budgetId, accountsUpdated, accountsCreated, transactionsAdded)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run(crypto.randomUUID(), new Date().toISOString(), budgetId, accountsUpdated, accountsCreated, transactionsAdded)

  return { budgetId, accountsCreated, accountsUpdated, transactionsAdded }
}

export function getLastYnabSync() {
  return db.prepare(
    'SELECT * FROM ynabSyncLog ORDER BY syncedAt DESC LIMIT 1'
  ).get() as {
    id: string; syncedAt: string; budgetId: string | null;
    accountsUpdated: number; accountsCreated: number; transactionsAdded: number; error: string | null
  } | undefined
}
