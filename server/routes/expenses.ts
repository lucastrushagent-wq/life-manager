import { Router } from 'express'
import { db } from '../db.js'

const router = Router()

interface ExpenseRow {
  id: string
  date: string
  description: string
  amount: number
  category: string
  source: string
  notes: string | null
  importedAt: string
}

function toExpense(row: ExpenseRow) {
  return { ...row, notes: row.notes ?? undefined }
}

// List expenses — optional filters: source, category, from, to
router.get('/', (req, res) => {
  const { source, category, from, to } = req.query as Record<string, string>
  let sql = 'SELECT * FROM expenses WHERE 1=1'
  const params: string[] = []
  if (source) { sql += ' AND source = ?'; params.push(source) }
  if (category) { sql += ' AND category = ?'; params.push(category) }
  if (from) { sql += ' AND date >= ?'; params.push(from) }
  if (to) { sql += ' AND date <= ?'; params.push(to) }
  sql += ' ORDER BY date DESC, importedAt DESC'
  const rows = db.prepare(sql).all(...params) as ExpenseRow[]
  res.json(rows.map(toExpense))
})

// List unique sources
router.get('/sources', (_req, res) => {
  const rows = db.prepare('SELECT DISTINCT source FROM expenses ORDER BY source').all() as { source: string }[]
  res.json(rows.map(r => r.source))
})

// Bulk import
router.post('/import', (req, res) => {
  const { source, transactions } = req.body as {
    source: string
    transactions: { date: string; description: string; amount: number; category: string }[]
  }
  if (!source || !Array.isArray(transactions) || transactions.length === 0) {
    return res.status(400).json({ error: 'source and transactions[] required' })
  }
  const importedAt = new Date().toISOString()
  const insert = db.prepare(
    'INSERT INTO expenses (id, date, description, amount, category, source, importedAt) VALUES (?, ?, ?, ?, ?, ?, ?)'
  )
  const importAll = db.transaction(() => {
    for (const t of transactions) {
      insert.run(crypto.randomUUID(), t.date, t.description, t.amount, t.category ?? 'other', source, importedAt)
    }
  })
  importAll()
  res.json({ ok: true, imported: transactions.length })
})

// Update category
router.patch('/:id', (req, res) => {
  const { category, notes } = req.body
  const row = db.prepare('SELECT id FROM expenses WHERE id = ?').get(req.params.id)
  if (!row) return res.status(404).json({ error: 'Not found' })
  if (category) db.prepare('UPDATE expenses SET category = ? WHERE id = ?').run(category, req.params.id)
  if (notes !== undefined) db.prepare('UPDATE expenses SET notes = ? WHERE id = ?').run(notes ?? null, req.params.id)
  res.json(db.prepare('SELECT * FROM expenses WHERE id = ?').get(req.params.id))
})

// Delete one
router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM expenses WHERE id = ?').run(req.params.id)
  res.json({ ok: true })
})

// Delete entire source
router.delete('/source/:source', (req, res) => {
  db.prepare('DELETE FROM expenses WHERE source = ?').run(req.params.source)
  res.json({ ok: true })
})

export default router
