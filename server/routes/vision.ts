import { Router } from 'express'
import { db } from '../db.js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const uploadsDir = path.join(__dirname, '..', '..', 'data', 'uploads')
fs.mkdirSync(uploadsDir, { recursive: true })

const router = Router()

// ── Vision Statement ──────────────────────────────────────────────────────────

router.get('/statement', (_req, res) => {
  const row = db.prepare("SELECT * FROM visionStatement WHERE id = 'singleton'").get()
  res.json(row ?? null)
})

router.put('/statement', (req, res) => {
  const { content } = req.body
  if (!content && content !== '') return res.status(400).json({ error: 'content required' })
  const updatedAt = new Date().toISOString()
  db.prepare(`
    INSERT INTO visionStatement (id, content, updatedAt) VALUES ('singleton', ?, ?)
    ON CONFLICT(id) DO UPDATE SET content = excluded.content, updatedAt = excluded.updatedAt
  `).run(content, updatedAt)
  res.json(db.prepare("SELECT * FROM visionStatement WHERE id = 'singleton'").get())
})

// ── Core Values ───────────────────────────────────────────────────────────────

router.get('/values', (_req, res) => {
  res.json(db.prepare('SELECT * FROM visionValues ORDER BY sortOrder ASC, createdAt ASC').all())
})

router.post('/values', (req, res) => {
  const { name, description } = req.body
  if (!name) return res.status(400).json({ error: 'name required' })
  const id = crypto.randomUUID()
  const createdAt = new Date().toISOString()
  const maxOrder = (db.prepare('SELECT MAX(sortOrder) as m FROM visionValues').get() as { m: number | null }).m ?? -1
  db.prepare('INSERT INTO visionValues (id, name, description, sortOrder, createdAt) VALUES (?, ?, ?, ?, ?)')
    .run(id, name, description ?? null, maxOrder + 1, createdAt)
  res.json(db.prepare('SELECT * FROM visionValues WHERE id = ?').get(id))
})

router.put('/values/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM visionValues WHERE id = ?').get(req.params.id) as Record<string, unknown> | undefined
  if (!existing) return res.status(404).json({ error: 'Not found' })
  const { name, description, sortOrder } = req.body
  db.prepare('UPDATE visionValues SET name = ?, description = ?, sortOrder = ? WHERE id = ?').run(
    name ?? existing.name,
    description !== undefined ? description : existing.description,
    sortOrder ?? existing.sortOrder,
    req.params.id
  )
  res.json(db.prepare('SELECT * FROM visionValues WHERE id = ?').get(req.params.id))
})

router.delete('/values/:id', (req, res) => {
  db.prepare('DELETE FROM visionValues WHERE id = ?').run(req.params.id)
  res.json({ ok: true })
})

// ── Goals ─────────────────────────────────────────────────────────────────────

router.get('/goals', (_req, res) => {
  res.json(db.prepare('SELECT * FROM visionGoals ORDER BY category ASC, createdAt ASC').all())
})

router.post('/goals', (req, res) => {
  const { category, title, description, timeframe, targetDate, status } = req.body
  if (!category || !title || !timeframe) return res.status(400).json({ error: 'category, title, timeframe required' })
  const id = crypto.randomUUID()
  const createdAt = new Date().toISOString()
  db.prepare(`
    INSERT INTO visionGoals (id, category, title, description, timeframe, targetDate, status, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, category, title, description ?? null, timeframe, targetDate ?? null, status ?? 'active', createdAt)
  res.json(db.prepare('SELECT * FROM visionGoals WHERE id = ?').get(id))
})

router.put('/goals/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM visionGoals WHERE id = ?').get(req.params.id) as Record<string, unknown> | undefined
  if (!existing) return res.status(404).json({ error: 'Not found' })
  const { category, title, description, timeframe, targetDate, status } = req.body
  db.prepare(`
    UPDATE visionGoals SET category = ?, title = ?, description = ?, timeframe = ?, targetDate = ?, status = ?
    WHERE id = ?
  `).run(
    category ?? existing.category,
    title ?? existing.title,
    description !== undefined ? description : existing.description,
    timeframe ?? existing.timeframe,
    targetDate !== undefined ? targetDate : existing.targetDate,
    status ?? existing.status,
    req.params.id
  )
  res.json(db.prepare('SELECT * FROM visionGoals WHERE id = ?').get(req.params.id))
})

router.delete('/goals/:id', (req, res) => {
  db.prepare('DELETE FROM visionGoals WHERE id = ?').run(req.params.id)
  res.json({ ok: true })
})

// ── Manifesto ─────────────────────────────────────────────────────────────────

router.get('/manifesto', (_req, res) => {
  const row = db.prepare("SELECT * FROM visionManifesto WHERE id = 'singleton'").get()
  res.json(row ?? null)
})

router.put('/manifesto', (req, res) => {
  const { content } = req.body
  if (!content && content !== '') return res.status(400).json({ error: 'content required' })
  const updatedAt = new Date().toISOString()
  db.prepare(`
    INSERT INTO visionManifesto (id, content, updatedAt) VALUES ('singleton', ?, ?)
    ON CONFLICT(id) DO UPDATE SET content = excluded.content, updatedAt = excluded.updatedAt
  `).run(content, updatedAt)
  res.json(db.prepare("SELECT * FROM visionManifesto WHERE id = 'singleton'").get())
})

// ── Vision Image ──────────────────────────────────────────────────────────────

router.get('/image', (_req, res) => {
  const row = db.prepare("SELECT * FROM visionImage WHERE id = 'singleton'").get() as { filename: string } | undefined
  if (!row) return res.json({ exists: false })
  const filePath = path.join(uploadsDir, row.filename)
  if (!fs.existsSync(filePath)) return res.json({ exists: false })
  res.json({ exists: true, url: `/uploads/${row.filename}` })
})

router.post('/image', (req, res) => {
  const { dataUrl } = req.body
  if (!dataUrl || typeof dataUrl !== 'string') return res.status(400).json({ error: 'dataUrl required' })
  const match = dataUrl.match(/^data:image\/(\w+);base64,(.+)$/)
  if (!match) return res.status(400).json({ error: 'Invalid image format' })
  const ext = match[1] === 'jpeg' ? 'jpg' : match[1]
  const filename = `vision-image.${ext}`
  const filePath = path.join(uploadsDir, filename)
  // Remove old image files with different extensions
  for (const f of fs.readdirSync(uploadsDir)) {
    if (f.startsWith('vision-image.')) fs.unlinkSync(path.join(uploadsDir, f))
  }
  fs.writeFileSync(filePath, Buffer.from(match[2], 'base64'))
  db.prepare(`
    INSERT INTO visionImage (id, filename, updatedAt) VALUES ('singleton', ?, ?)
    ON CONFLICT(id) DO UPDATE SET filename = excluded.filename, updatedAt = excluded.updatedAt
  `).run(filename, new Date().toISOString())
  res.json({ exists: true, url: `/uploads/${filename}` })
})

router.delete('/image', (_req, res) => {
  const row = db.prepare("SELECT * FROM visionImage WHERE id = 'singleton'").get() as { filename: string } | undefined
  if (row) {
    const filePath = path.join(uploadsDir, row.filename)
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
    db.prepare("DELETE FROM visionImage WHERE id = 'singleton'").run()
  }
  res.json({ ok: true })
})

export default router
