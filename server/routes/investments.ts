import { Router } from 'express'
import { db } from '../db.js'

const router = Router()

interface HoldingRow {
  id: string
  ticker: string
  name: string
  assetClass: string
  account: string
  shares: number
  avgCost: number
  currentPrice: number
  lastUpdated: string
  notes: string | null
  createdAt: string
}

function toHolding(row: HoldingRow) {
  return { ...row, notes: row.notes ?? undefined }
}

router.get('/holdings', (_req, res) => {
  const rows = db.prepare('SELECT * FROM investmentHoldings ORDER BY currentPrice * shares DESC').all() as HoldingRow[]
  res.json(rows.map(toHolding))
})

router.post('/holdings', (req, res) => {
  const { ticker, name, assetClass, account, shares, avgCost, currentPrice, lastUpdated, notes } = req.body
  if (!ticker || !name || !assetClass || shares == null || avgCost == null || currentPrice == null || !lastUpdated) {
    return res.status(400).json({ error: 'Missing required fields' })
  }
  const id = crypto.randomUUID()
  const createdAt = new Date().toISOString()
  db.prepare(`
    INSERT INTO investmentHoldings (id, ticker, name, assetClass, account, shares, avgCost, currentPrice, lastUpdated, notes, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, ticker, name, assetClass, account ?? '', shares, avgCost, currentPrice, lastUpdated, notes ?? null, createdAt)
  res.status(201).json(toHolding(db.prepare('SELECT * FROM investmentHoldings WHERE id = ?').get(id) as HoldingRow))
})

router.put('/holdings/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM investmentHoldings WHERE id = ?').get(req.params.id) as HoldingRow | undefined
  if (!row) return res.status(404).json({ error: 'Not found' })
  const { ticker, name, assetClass, account, shares, avgCost, currentPrice, lastUpdated, notes } = req.body
  db.prepare(`
    UPDATE investmentHoldings SET
      ticker=?, name=?, assetClass=?, account=?, shares=?, avgCost=?, currentPrice=?, lastUpdated=?, notes=?
    WHERE id=?
  `).run(
    ticker ?? row.ticker,
    name ?? row.name,
    assetClass ?? row.assetClass,
    account !== undefined ? account : row.account,
    shares ?? row.shares,
    avgCost ?? row.avgCost,
    currentPrice ?? row.currentPrice,
    lastUpdated ?? row.lastUpdated,
    notes !== undefined ? (notes ?? null) : row.notes,
    req.params.id
  )
  res.json(toHolding(db.prepare('SELECT * FROM investmentHoldings WHERE id = ?').get(req.params.id) as HoldingRow))
})

router.delete('/holdings/:id', (req, res) => {
  db.prepare('DELETE FROM investmentHoldings WHERE id = ?').run(req.params.id)
  res.status(204).end()
})

export default router
