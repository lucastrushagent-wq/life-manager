import { Router } from 'express'
import { db } from '../db.js'

const router = Router()

// ── Sessions ──────────────────────────────────────────────────────────────────

router.get('/sessions', (_req, res) => {
  const rows = db.prepare('SELECT * FROM fitnessSessions ORDER BY date DESC, createdAt DESC').all()
  res.json(rows)
})

router.post('/sessions', (req, res) => {
  const { date, type, durationMins, distanceKm, calories, avgHr, maxHr, notes } = req.body
  if (!date || !type || !durationMins) return res.status(400).json({ error: 'date, type, durationMins required' })
  const id = crypto.randomUUID()
  const createdAt = new Date().toISOString()
  db.prepare(`
    INSERT INTO fitnessSessions (id, date, type, durationMins, distanceKm, calories, avgHr, maxHr, notes, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, date, type, durationMins, distanceKm ?? null, calories ?? null, avgHr ?? null, maxHr ?? null, notes ?? null, createdAt)
  res.json(db.prepare('SELECT * FROM fitnessSessions WHERE id = ?').get(id))
})

router.delete('/sessions/:id', (req, res) => {
  db.prepare('DELETE FROM fitnessSessions WHERE id = ?').run(req.params.id)
  res.json({ ok: true })
})

// ── Strength Sets ─────────────────────────────────────────────────────────────

router.get('/sets', (req, res) => {
  const { exercise, limit } = req.query as Record<string, string>
  let sql = 'SELECT * FROM fitnessSets'
  const params: (string | number)[] = []
  if (exercise) { sql += ' WHERE exercise = ?'; params.push(exercise) }
  sql += ' ORDER BY date DESC, createdAt DESC'
  if (limit) { sql += ' LIMIT ?'; params.push(Number(limit)) }
  res.json(db.prepare(sql).all(...params))
})

router.post('/sets', (req, res) => {
  const { date, exercise, sets, reps, weightKg, notes } = req.body
  if (!date || !exercise || sets == null || reps == null) return res.status(400).json({ error: 'date, exercise, sets, reps required' })
  const id = crypto.randomUUID()
  const createdAt = new Date().toISOString()
  db.prepare(`
    INSERT INTO fitnessSets (id, date, exercise, sets, reps, weightKg, notes, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, date, exercise, sets, reps, weightKg ?? null, notes ?? null, createdAt)
  res.json(db.prepare('SELECT * FROM fitnessSets WHERE id = ?').get(id))
})

router.delete('/sets/:id', (req, res) => {
  db.prepare('DELETE FROM fitnessSets WHERE id = ?').run(req.params.id)
  res.json({ ok: true })
})

// ── Personal Records ──────────────────────────────────────────────────────────

router.get('/records', (_req, res) => {
  res.json(db.prepare('SELECT * FROM fitnessRecords ORDER BY category, name').all())
})

router.post('/records', (req, res) => {
  const { category, name, value, unit, date, notes } = req.body
  if (!category || !name || value == null || !unit || !date) return res.status(400).json({ error: 'category, name, value, unit, date required' })
  const id = crypto.randomUUID()
  const createdAt = new Date().toISOString()
  db.prepare(`
    INSERT INTO fitnessRecords (id, category, name, value, unit, date, notes, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, category, name, value, unit, date, notes ?? null, createdAt)
  res.json(db.prepare('SELECT * FROM fitnessRecords WHERE id = ?').get(id))
})

router.put('/records/:id', (req, res) => {
  const { category, name, value, unit, date, notes } = req.body
  const existing = db.prepare('SELECT * FROM fitnessRecords WHERE id = ?').get(req.params.id) as Record<string, unknown> | undefined
  if (!existing) return res.status(404).json({ error: 'Not found' })
  db.prepare(`
    UPDATE fitnessRecords SET
      category = ?, name = ?, value = ?, unit = ?, date = ?, notes = ?
    WHERE id = ?
  `).run(
    category ?? existing.category,
    name ?? existing.name,
    value ?? existing.value,
    unit ?? existing.unit,
    date ?? existing.date,
    notes !== undefined ? notes : existing.notes,
    req.params.id
  )
  res.json(db.prepare('SELECT * FROM fitnessRecords WHERE id = ?').get(req.params.id))
})

router.delete('/records/:id', (req, res) => {
  db.prepare('DELETE FROM fitnessRecords WHERE id = ?').run(req.params.id)
  res.json({ ok: true })
})

export default router
