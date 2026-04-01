import { Router } from 'express'
import { db } from '../db.js'

const router = Router()

interface AccountRow {
  id: string
  name: string
  category: string
  type: string
  value: number
  lastUpdated: string
  notes: string | null
  createdAt: string
}

interface SnapshotRow {
  id: string
  date: string
  totalAssets: number
  totalLiabilities: number
  netWorth: number
  createdAt: string
}

function toAccount(row: AccountRow) {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    type: row.type,
    value: row.value,
    lastUpdated: row.lastUpdated,
    notes: row.notes ?? undefined,
    createdAt: row.createdAt,
  }
}

function saveSnapshot() {
  const accounts = db.prepare('SELECT * FROM financeAccounts').all() as AccountRow[]
  const totalAssets = accounts.filter(a => a.type === 'asset').reduce((s, a) => s + a.value, 0)
  const totalLiabilities = accounts.filter(a => a.type === 'liability').reduce((s, a) => s + a.value, 0)
  const netWorth = totalAssets - totalLiabilities
  const date = new Date().toISOString().split('T')[0]
  const now = new Date().toISOString()
  db.prepare(`
    INSERT INTO netWorthSnapshots (id, date, totalAssets, totalLiabilities, netWorth, createdAt)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(date) DO UPDATE SET
      totalAssets=excluded.totalAssets,
      totalLiabilities=excluded.totalLiabilities,
      netWorth=excluded.netWorth
  `).run(crypto.randomUUID(), date, totalAssets, totalLiabilities, netWorth, now)
}

// Accounts
router.get('/', (_req, res) => {
  const rows = db.prepare('SELECT * FROM financeAccounts ORDER BY category, name').all() as AccountRow[]
  res.json(rows.map(toAccount))
})

router.post('/', (req, res) => {
  const { name, category, type, value, lastUpdated, notes } = req.body
  if (!name || !category || !type || value === undefined || !lastUpdated) {
    return res.status(400).json({ error: 'Missing required fields' })
  }
  const id = crypto.randomUUID()
  const createdAt = new Date().toISOString()
  db.prepare(
    'INSERT INTO financeAccounts (id, name, category, type, value, lastUpdated, notes, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(id, name, category, type, value, lastUpdated, notes ?? null, createdAt)
  saveSnapshot()
  const row = db.prepare('SELECT * FROM financeAccounts WHERE id = ?').get(id) as AccountRow
  res.status(201).json(toAccount(row))
})

router.put('/:id', (req, res) => {
  const { id } = req.params
  const row = db.prepare('SELECT * FROM financeAccounts WHERE id = ?').get(id) as AccountRow | undefined
  if (!row) return res.status(404).json({ error: 'Not found' })
  const { name, category, type, value, lastUpdated, notes } = req.body
  db.prepare(
    'UPDATE financeAccounts SET name=?, category=?, type=?, value=?, lastUpdated=?, notes=? WHERE id=?'
  ).run(
    name ?? row.name,
    category ?? row.category,
    type ?? row.type,
    value ?? row.value,
    lastUpdated ?? row.lastUpdated,
    notes !== undefined ? (notes ?? null) : row.notes,
    id
  )
  saveSnapshot()
  const updated = db.prepare('SELECT * FROM financeAccounts WHERE id = ?').get(id) as AccountRow
  res.json(toAccount(updated))
})

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM financeAccounts WHERE id = ?').run(req.params.id)
  saveSnapshot()
  res.status(204).end()
})

// Snapshots
router.get('/snapshots', (_req, res) => {
  const rows = db.prepare('SELECT * FROM netWorthSnapshots ORDER BY date ASC').all() as SnapshotRow[]
  res.json(rows)
})

export default router
