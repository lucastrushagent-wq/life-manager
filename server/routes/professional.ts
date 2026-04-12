import { Router } from 'express'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'
import { db } from '../db.js'

const router = Router()
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const uploadsDir = path.join(__dirname, '..', '..', 'data', 'uploads')
fs.mkdirSync(uploadsDir, { recursive: true })

// ── Types ────────────────────────────────────────────────────────

interface ResumeRow { id: string; originalName: string; storedName: string; mimeType: string; uploadedAt: string }
interface ReviewRow { id: string; date: string; period: string | null; company: string | null; role: string | null; rating: string | null; summary: string | null; strengths: string | null; improvements: string | null; notes: string | null; createdAt: string }
interface WorkRow { id: string; company: string; title: string; startDate: string; endDate: string | null; location: string | null; description: string | null; createdAt: string }
interface SkillRow { id: string; name: string; category: string; level: string | null; notes: string | null; createdAt: string }
interface CertRow { id: string; name: string; issuer: string | null; dateEarned: string | null; expiryDate: string | null; notes: string | null; createdAt: string }

const toResume = (r: ResumeRow) => ({ id: r.id, originalName: r.originalName, storedName: r.storedName, mimeType: r.mimeType, uploadedAt: r.uploadedAt })
const toReview = (r: ReviewRow) => ({ id: r.id, date: r.date, period: r.period ?? undefined, company: r.company ?? undefined, role: r.role ?? undefined, rating: r.rating ?? undefined, summary: r.summary ?? undefined, strengths: r.strengths ?? undefined, improvements: r.improvements ?? undefined, notes: r.notes ?? undefined, createdAt: r.createdAt })
const toWork = (r: WorkRow) => ({ id: r.id, company: r.company, title: r.title, startDate: r.startDate, endDate: r.endDate ?? undefined, location: r.location ?? undefined, description: r.description ?? undefined, createdAt: r.createdAt })
const toSkill = (r: SkillRow) => ({ id: r.id, name: r.name, category: r.category, level: r.level ?? undefined, notes: r.notes ?? undefined, createdAt: r.createdAt })
const toCert = (r: CertRow) => ({ id: r.id, name: r.name, issuer: r.issuer ?? undefined, dateEarned: r.dateEarned ?? undefined, expiryDate: r.expiryDate ?? undefined, notes: r.notes ?? undefined, createdAt: r.createdAt })

// ── Resume (file upload via base64) ──────────────────────────────

router.get('/resumes', (_req, res) => {
  const rows = db.prepare('SELECT * FROM professionalResumes ORDER BY uploadedAt DESC').all() as ResumeRow[]
  res.json(rows.map(toResume))
})

router.post('/resumes', (req, res) => {
  const { dataUrl, originalName } = req.body
  if (!dataUrl || !originalName) return res.status(400).json({ error: 'dataUrl and originalName required' })

  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/)
  if (!match) return res.status(400).json({ error: 'Invalid dataUrl format' })
  const mimeType = match[1]
  const ext = originalName.split('.').pop()?.toLowerCase() ?? 'bin'

  if (!['pdf', 'doc', 'docx'].includes(ext)) {
    return res.status(400).json({ error: 'Only PDF and Word documents are supported' })
  }

  const id = crypto.randomUUID()
  const storedName = `resume-${id}.${ext}`
  const filePath = path.join(uploadsDir, storedName)

  fs.writeFileSync(filePath, Buffer.from(match[2], 'base64'))
  db.prepare(
    'INSERT INTO professionalResumes (id, originalName, storedName, mimeType, uploadedAt) VALUES (?, ?, ?, ?, ?)'
  ).run(id, originalName, storedName, mimeType, new Date().toISOString())

  res.status(201).json(toResume(db.prepare('SELECT * FROM professionalResumes WHERE id=?').get(id) as ResumeRow))
})

router.delete('/resumes/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM professionalResumes WHERE id=?').get(req.params.id) as ResumeRow | undefined
  if (row) {
    const filePath = path.join(uploadsDir, row.storedName)
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
    db.prepare('DELETE FROM professionalResumes WHERE id=?').run(req.params.id)
  }
  res.status(204).end()
})

// ── Performance Reviews ──────────────────────────────────────────

router.get('/reviews', (_req, res) => {
  const rows = db.prepare('SELECT * FROM performanceReviews ORDER BY date DESC').all() as ReviewRow[]
  res.json(rows.map(toReview))
})

router.post('/reviews', (req, res) => {
  const { date, period, company, role, rating, summary, strengths, improvements, notes } = req.body
  if (!date) return res.status(400).json({ error: 'date required' })
  const id = crypto.randomUUID()
  db.prepare(
    'INSERT INTO performanceReviews (id, date, period, company, role, rating, summary, strengths, improvements, notes, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(id, date, period || null, company || null, role || null, rating || null, summary || null, strengths || null, improvements || null, notes || null, new Date().toISOString())
  res.status(201).json(toReview(db.prepare('SELECT * FROM performanceReviews WHERE id=?').get(id) as ReviewRow))
})

router.patch('/reviews/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM performanceReviews WHERE id=?').get(req.params.id) as ReviewRow | undefined
  if (!row) return res.status(404).json({ error: 'Not found' })
  const { date, period, company, role, rating, summary, strengths, improvements, notes } = req.body
  db.prepare(
    'UPDATE performanceReviews SET date=?, period=?, company=?, role=?, rating=?, summary=?, strengths=?, improvements=?, notes=? WHERE id=?'
  ).run(
    date ?? row.date,
    period !== undefined ? (period || null) : row.period,
    company !== undefined ? (company || null) : row.company,
    role !== undefined ? (role || null) : row.role,
    rating !== undefined ? (rating || null) : row.rating,
    summary !== undefined ? (summary || null) : row.summary,
    strengths !== undefined ? (strengths || null) : row.strengths,
    improvements !== undefined ? (improvements || null) : row.improvements,
    notes !== undefined ? (notes || null) : row.notes,
    req.params.id
  )
  res.json(toReview(db.prepare('SELECT * FROM performanceReviews WHERE id=?').get(req.params.id) as ReviewRow))
})

router.delete('/reviews/:id', (req, res) => {
  db.prepare('DELETE FROM performanceReviews WHERE id=?').run(req.params.id)
  res.status(204).end()
})

// ── Work History ─────────────────────────────────────────────────

router.get('/work', (_req, res) => {
  const rows = db.prepare('SELECT * FROM workHistory ORDER BY startDate DESC').all() as WorkRow[]
  res.json(rows.map(toWork))
})

router.post('/work', (req, res) => {
  const { company, title, startDate, endDate, location, description } = req.body
  if (!company || !title || !startDate) return res.status(400).json({ error: 'company, title, startDate required' })
  const id = crypto.randomUUID()
  db.prepare(
    'INSERT INTO workHistory (id, company, title, startDate, endDate, location, description, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(id, company, title, startDate, endDate || null, location || null, description || null, new Date().toISOString())
  res.status(201).json(toWork(db.prepare('SELECT * FROM workHistory WHERE id=?').get(id) as WorkRow))
})

router.patch('/work/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM workHistory WHERE id=?').get(req.params.id) as WorkRow | undefined
  if (!row) return res.status(404).json({ error: 'Not found' })
  const { company, title, startDate, endDate, location, description } = req.body
  db.prepare(
    'UPDATE workHistory SET company=?, title=?, startDate=?, endDate=?, location=?, description=? WHERE id=?'
  ).run(
    company ?? row.company,
    title ?? row.title,
    startDate ?? row.startDate,
    endDate !== undefined ? (endDate || null) : row.endDate,
    location !== undefined ? (location || null) : row.location,
    description !== undefined ? (description || null) : row.description,
    req.params.id
  )
  res.json(toWork(db.prepare('SELECT * FROM workHistory WHERE id=?').get(req.params.id) as WorkRow))
})

router.delete('/work/:id', (req, res) => {
  db.prepare('DELETE FROM workHistory WHERE id=?').run(req.params.id)
  res.status(204).end()
})

// ── Skills ───────────────────────────────────────────────────────

router.get('/skills', (_req, res) => {
  const rows = db.prepare('SELECT * FROM professionalSkills ORDER BY category, name').all() as SkillRow[]
  res.json(rows.map(toSkill))
})

router.post('/skills', (req, res) => {
  const { name, category, level, notes } = req.body
  if (!name?.trim()) return res.status(400).json({ error: 'name required' })
  const id = crypto.randomUUID()
  db.prepare(
    'INSERT INTO professionalSkills (id, name, category, level, notes, createdAt) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(id, name.trim(), category || 'technical', level || null, notes || null, new Date().toISOString())
  res.status(201).json(toSkill(db.prepare('SELECT * FROM professionalSkills WHERE id=?').get(id) as SkillRow))
})

router.patch('/skills/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM professionalSkills WHERE id=?').get(req.params.id) as SkillRow | undefined
  if (!row) return res.status(404).json({ error: 'Not found' })
  const { name, category, level, notes } = req.body
  db.prepare('UPDATE professionalSkills SET name=?, category=?, level=?, notes=? WHERE id=?')
    .run(name ?? row.name, category ?? row.category, level !== undefined ? (level || null) : row.level, notes !== undefined ? (notes || null) : row.notes, req.params.id)
  res.json(toSkill(db.prepare('SELECT * FROM professionalSkills WHERE id=?').get(req.params.id) as SkillRow))
})

router.delete('/skills/:id', (req, res) => {
  db.prepare('DELETE FROM professionalSkills WHERE id=?').run(req.params.id)
  res.status(204).end()
})

// ── Certifications ───────────────────────────────────────────────

router.get('/certs', (_req, res) => {
  const rows = db.prepare('SELECT * FROM professionalCerts ORDER BY dateEarned DESC, name').all() as CertRow[]
  res.json(rows.map(toCert))
})

router.post('/certs', (req, res) => {
  const { name, issuer, dateEarned, expiryDate, notes } = req.body
  if (!name?.trim()) return res.status(400).json({ error: 'name required' })
  const id = crypto.randomUUID()
  db.prepare(
    'INSERT INTO professionalCerts (id, name, issuer, dateEarned, expiryDate, notes, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(id, name.trim(), issuer || null, dateEarned || null, expiryDate || null, notes || null, new Date().toISOString())
  res.status(201).json(toCert(db.prepare('SELECT * FROM professionalCerts WHERE id=?').get(id) as CertRow))
})

router.patch('/certs/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM professionalCerts WHERE id=?').get(req.params.id) as CertRow | undefined
  if (!row) return res.status(404).json({ error: 'Not found' })
  const { name, issuer, dateEarned, expiryDate, notes } = req.body
  db.prepare('UPDATE professionalCerts SET name=?, issuer=?, dateEarned=?, expiryDate=?, notes=? WHERE id=?')
    .run(name ?? row.name, issuer !== undefined ? (issuer || null) : row.issuer, dateEarned !== undefined ? (dateEarned || null) : row.dateEarned, expiryDate !== undefined ? (expiryDate || null) : row.expiryDate, notes !== undefined ? (notes || null) : row.notes, req.params.id)
  res.json(toCert(db.prepare('SELECT * FROM professionalCerts WHERE id=?').get(req.params.id) as CertRow))
})

router.delete('/certs/:id', (req, res) => {
  db.prepare('DELETE FROM professionalCerts WHERE id=?').run(req.params.id)
  res.status(204).end()
})

export default router
