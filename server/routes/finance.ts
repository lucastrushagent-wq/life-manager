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
  excluded: number
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
    excluded: row.excluded === 1,
    createdAt: row.createdAt,
  }
}

function saveSnapshot() {
  // Snapshots use only included accounts so the chart reflects the same view as the UI totals
  const accounts = (db.prepare('SELECT * FROM financeAccounts WHERE excluded=0').all() as AccountRow[])
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
    'INSERT INTO financeAccounts (id, name, category, type, value, lastUpdated, notes, excluded, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(id, name, category, type, value, lastUpdated, notes ?? null, 0, createdAt)
  saveSnapshot()
  const row = db.prepare('SELECT * FROM financeAccounts WHERE id = ?').get(id) as AccountRow
  res.status(201).json(toAccount(row))
})

router.put('/:id', (req, res) => {
  const { id } = req.params
  const row = db.prepare('SELECT * FROM financeAccounts WHERE id = ?').get(id) as AccountRow | undefined
  if (!row) return res.status(404).json({ error: 'Not found' })
  const { name, category, type, value, lastUpdated, notes, excluded } = req.body
  db.prepare(
    'UPDATE financeAccounts SET name=?, category=?, type=?, value=?, lastUpdated=?, notes=?, excluded=? WHERE id=?'
  ).run(
    name ?? row.name,
    category ?? row.category,
    type ?? row.type,
    value ?? row.value,
    lastUpdated ?? row.lastUpdated,
    notes !== undefined ? (notes ?? null) : row.notes,
    excluded !== undefined ? (excluded ? 1 : 0) : row.excluded,
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

// Targets
interface TargetRow {
  id: string
  label: string
  targetAmount: number
  targetDate: string | null
  notes: string | null
  showOnChart: number
  createdAt: string
}

function toTarget(r: TargetRow) {
  return {
    id: r.id,
    label: r.label,
    targetAmount: r.targetAmount,
    targetDate: r.targetDate ?? undefined,
    notes: r.notes ?? undefined,
    showOnChart: r.showOnChart === 1,
    createdAt: r.createdAt,
  }
}

router.get('/targets', (_req, res) => {
  const rows = db.prepare('SELECT * FROM netWorthTargets ORDER BY targetDate ASC, createdAt ASC').all() as TargetRow[]
  res.json(rows.map(toTarget))
})

router.post('/targets', (req, res) => {
  const { label, targetAmount, targetDate, notes } = req.body
  if (!label?.trim()) return res.status(400).json({ error: 'Label required' })
  if (targetAmount === undefined || isNaN(Number(targetAmount))) return res.status(400).json({ error: 'targetAmount required' })
  const id = crypto.randomUUID()
  db.prepare(
    'INSERT INTO netWorthTargets (id, label, targetAmount, targetDate, notes, showOnChart, createdAt) VALUES (?, ?, ?, ?, ?, 0, ?)'
  ).run(id, label.trim(), Number(targetAmount), targetDate || null, notes?.trim() || null, new Date().toISOString())
  res.status(201).json(toTarget(db.prepare('SELECT * FROM netWorthTargets WHERE id=?').get(id) as TargetRow))
})

router.patch('/targets/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM netWorthTargets WHERE id=?').get(req.params.id) as TargetRow | undefined
  if (!row) return res.status(404).json({ error: 'Not found' })
  const { label, targetAmount, targetDate, notes, showOnChart } = req.body
  db.prepare(
    'UPDATE netWorthTargets SET label=?, targetAmount=?, targetDate=?, notes=?, showOnChart=? WHERE id=?'
  ).run(
    label ?? row.label,
    targetAmount !== undefined ? Number(targetAmount) : row.targetAmount,
    targetDate !== undefined ? (targetDate || null) : row.targetDate,
    notes !== undefined ? (notes?.trim() || null) : row.notes,
    showOnChart !== undefined ? (showOnChart ? 1 : 0) : row.showOnChart,
    req.params.id
  )
  res.json(toTarget(db.prepare('SELECT * FROM netWorthTargets WHERE id=?').get(req.params.id) as TargetRow))
})

router.delete('/targets/:id', (req, res) => {
  db.prepare('DELETE FROM netWorthTargets WHERE id=?').run(req.params.id)
  res.status(204).end()
})

export default router
