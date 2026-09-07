import { Router } from 'express'
import { db } from '../db.js'

const router = Router()

// Both the care profile and the insurance policy are single-row tables.
const SINGLETON = 'main'

// ── Care profile ──────────────────────────────────────────────────────────────

const PROFILE_FIELDS = [
  'breed', 'dateOfBirth', 'weightKg', 'colour', 'microchipNumber', 'desexed',
  'foodBrand', 'foodAmount', 'foodLocation', 'feedingNotes', 'treats',
  'allergies', 'currentMedications',
  'toys', 'walkRoutine', 'toiletRoutine', 'sleepRoutine',
  'behaviourNotes', 'commands', 'houseRules',
  'emergencyContactName', 'emergencyContactPhone',
  'vetName', 'vetPhone', 'vetAddress', 'afterHoursVetName', 'afterHoursVetPhone',
] as const

type ProfileRow = Record<string, unknown> & { id: string; updatedAt: string }

function readProfile(): Record<string, unknown> {
  const row = db.prepare('SELECT * FROM tweedProfile WHERE id=?').get(SINGLETON) as ProfileRow | undefined
  if (!row) return { desexed: false }
  const out: Record<string, unknown> = { updatedAt: row.updatedAt }
  for (const f of PROFILE_FIELDS) {
    out[f] = f === 'desexed' ? row[f] === 1 : (row[f] ?? undefined)
  }
  return out
}

router.get('/profile', (_req, res) => res.json(readProfile()))

router.put('/profile', (req, res) => {
  const b = req.body ?? {}
  const existing = db.prepare('SELECT * FROM tweedProfile WHERE id=?').get(SINGLETON) as ProfileRow | undefined
  const now = new Date().toISOString()

  // Only overwrite fields actually present in the body, so a partial save keeps the rest.
  const value = (f: string): unknown => {
    if (!(f in b)) return existing ? (existing[f] ?? null) : null
    if (f === 'desexed') return b[f] ? 1 : 0
    if (f === 'weightKg') return b[f] === null || b[f] === '' ? null : Number(b[f])
    const v = b[f]
    return typeof v === 'string' && v.trim() ? v.trim() : null
  }

  const cols = PROFILE_FIELDS.join(', ')
  const placeholders = PROFILE_FIELDS.map(() => '?').join(', ')
  const values = PROFILE_FIELDS.map(value)

  if (existing) {
    const assignments = PROFILE_FIELDS.map(f => `${f}=?`).join(', ')
    db.prepare(`UPDATE tweedProfile SET ${assignments}, updatedAt=? WHERE id=?`).run(...values, now, SINGLETON)
  } else {
    db.prepare(`INSERT INTO tweedProfile (id, ${cols}, updatedAt) VALUES (?, ${placeholders}, ?)`)
      .run(SINGLETON, ...values, now)
  }
  res.json(readProfile())
})

// ── Daily schedule ────────────────────────────────────────────────────────────

interface ScheduleRow {
  id: string; time: string; activity: string
  title: string; details: string | null; createdAt: string
}

function toScheduleItem(r: ScheduleRow) {
  return {
    id: r.id, time: r.time, activity: r.activity,
    title: r.title, details: r.details ?? undefined, createdAt: r.createdAt,
  }
}

router.get('/schedule', (_req, res) => {
  const rows = db.prepare('SELECT * FROM tweedSchedule ORDER BY time ASC').all() as ScheduleRow[]
  res.json(rows.map(toScheduleItem))
})

router.post('/schedule', (req, res) => {
  const b = req.body
  if (!b.title?.trim()) return res.status(400).json({ error: 'Title required' })
  if (!b.time?.trim()) return res.status(400).json({ error: 'Time required' })
  const id = crypto.randomUUID()
  db.prepare('INSERT INTO tweedSchedule (id, time, activity, title, details, createdAt) VALUES (?,?,?,?,?,?)')
    .run(id, b.time.trim(), b.activity ?? 'other', b.title.trim(), b.details?.trim() || null, new Date().toISOString())
  res.status(201).json(toScheduleItem(db.prepare('SELECT * FROM tweedSchedule WHERE id=?').get(id) as ScheduleRow))
})

router.patch('/schedule/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM tweedSchedule WHERE id=?').get(req.params.id) as ScheduleRow | undefined
  if (!row) return res.status(404).json({ error: 'Not found' })
  const b = req.body
  db.prepare('UPDATE tweedSchedule SET time=?, activity=?, title=?, details=? WHERE id=?')
    .run(
      b.time?.trim() || row.time,
      b.activity ?? row.activity,
      b.title?.trim() || row.title,
      b.details !== undefined ? (b.details?.trim() || null) : row.details,
      req.params.id,
    )
  res.json(toScheduleItem(db.prepare('SELECT * FROM tweedSchedule WHERE id=?').get(req.params.id) as ScheduleRow))
})

router.delete('/schedule/:id', (req, res) => {
  db.prepare('DELETE FROM tweedSchedule WHERE id=?').run(req.params.id)
  res.status(204).end()
})

// ── Medical history (with insurance claim tracking per event) ─────────────────

interface MedicalRow {
  id: string; date: string; type: string; title: string
  description: string | null; vet: string | null; cost: number | null
  followUpDate: string | null
  claimStatus: string; amountClaimed: number | null; amountReimbursed: number | null
  claimSubmittedDate: string | null; claimNotes: string | null
  notes: string | null; createdAt: string
}

function toMedical(r: MedicalRow) {
  return {
    id: r.id, date: r.date, type: r.type, title: r.title,
    description: r.description ?? undefined,
    vet: r.vet ?? undefined,
    cost: r.cost ?? undefined,
    followUpDate: r.followUpDate ?? undefined,
    claimStatus: r.claimStatus,
    amountClaimed: r.amountClaimed ?? undefined,
    amountReimbursed: r.amountReimbursed ?? undefined,
    claimSubmittedDate: r.claimSubmittedDate ?? undefined,
    claimNotes: r.claimNotes ?? undefined,
    notes: r.notes ?? undefined,
    createdAt: r.createdAt,
  }
}

router.get('/medical', (req, res) => {
  const { type, claimStatus } = req.query as Record<string, string>
  let sql = 'SELECT * FROM tweedMedical WHERE 1=1'
  const params: string[] = []
  if (type) { sql += ' AND type = ?'; params.push(type) }
  if (claimStatus) { sql += ' AND claimStatus = ?'; params.push(claimStatus) }
  sql += ' ORDER BY date DESC, createdAt DESC'
  res.json((db.prepare(sql).all(...params) as MedicalRow[]).map(toMedical))
})

const num = (v: unknown) => (v === undefined || v === null || v === '' ? null : Number(v))

router.post('/medical', (req, res) => {
  const b = req.body
  if (!b.title?.trim()) return res.status(400).json({ error: 'Title required' })
  if (!b.date) return res.status(400).json({ error: 'Date required' })
  const id = crypto.randomUUID()
  db.prepare(`INSERT INTO tweedMedical
    (id, date, type, title, description, vet, cost, followUpDate,
     claimStatus, amountClaimed, amountReimbursed, claimSubmittedDate, claimNotes, notes, createdAt)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`)
    .run(
      id, b.date, b.type ?? 'checkup', b.title.trim(),
      b.description?.trim() || null, b.vet?.trim() || null, num(b.cost), b.followUpDate || null,
      b.claimStatus ?? 'not_submitted', num(b.amountClaimed), num(b.amountReimbursed),
      b.claimSubmittedDate || null, b.claimNotes?.trim() || null, b.notes?.trim() || null,
      new Date().toISOString(),
    )
  res.status(201).json(toMedical(db.prepare('SELECT * FROM tweedMedical WHERE id=?').get(id) as MedicalRow))
})

router.patch('/medical/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM tweedMedical WHERE id=?').get(req.params.id) as MedicalRow | undefined
  if (!row) return res.status(404).json({ error: 'Not found' })
  const b = req.body
  const text = (k: keyof MedicalRow, v: unknown) =>
    v !== undefined ? (typeof v === 'string' && v.trim() ? v.trim() : null) : row[k]
  const money = (k: keyof MedicalRow, v: unknown) => (v !== undefined ? num(v) : row[k])

  db.prepare(`UPDATE tweedMedical SET
    date=?, type=?, title=?, description=?, vet=?, cost=?, followUpDate=?,
    claimStatus=?, amountClaimed=?, amountReimbursed=?, claimSubmittedDate=?, claimNotes=?, notes=?
    WHERE id=?`)
    .run(
      b.date || row.date,
      b.type ?? row.type,
      b.title?.trim() || row.title,
      text('description', b.description),
      text('vet', b.vet),
      money('cost', b.cost),
      text('followUpDate', b.followUpDate),
      b.claimStatus ?? row.claimStatus,
      money('amountClaimed', b.amountClaimed),
      money('amountReimbursed', b.amountReimbursed),
      text('claimSubmittedDate', b.claimSubmittedDate),
      text('claimNotes', b.claimNotes),
      text('notes', b.notes),
      req.params.id,
    )
  res.json(toMedical(db.prepare('SELECT * FROM tweedMedical WHERE id=?').get(req.params.id) as MedicalRow))
})

router.delete('/medical/:id', (req, res) => {
  db.prepare('DELETE FROM tweedMedical WHERE id=?').run(req.params.id)
  res.status(204).end()
})

// ── Insurance policy ──────────────────────────────────────────────────────────

const INSURANCE_FIELDS = [
  'provider', 'policyNumber', 'annualPremium', 'excess', 'reimbursementRate',
  'annualLimit', 'renewalDate', 'contactPhone', 'portalUrl', 'coverageNotes',
] as const

const NUMERIC_INSURANCE = new Set(['annualPremium', 'excess', 'reimbursementRate', 'annualLimit'])

type InsuranceRow = Record<string, unknown> & { id: string; updatedAt: string }

function readInsurance(): Record<string, unknown> {
  const row = db.prepare('SELECT * FROM tweedInsurance WHERE id=?').get(SINGLETON) as InsuranceRow | undefined
  if (!row) return {}
  const out: Record<string, unknown> = { updatedAt: row.updatedAt }
  for (const f of INSURANCE_FIELDS) out[f] = row[f] ?? undefined
  return out
}

router.get('/insurance', (_req, res) => res.json(readInsurance()))

router.put('/insurance', (req, res) => {
  const b = req.body ?? {}
  const existing = db.prepare('SELECT * FROM tweedInsurance WHERE id=?').get(SINGLETON) as InsuranceRow | undefined
  const now = new Date().toISOString()

  const value = (f: string): unknown => {
    if (!(f in b)) return existing ? (existing[f] ?? null) : null
    if (NUMERIC_INSURANCE.has(f)) return num(b[f])
    const v = b[f]
    return typeof v === 'string' && v.trim() ? v.trim() : null
  }
  const values = INSURANCE_FIELDS.map(value)

  if (existing) {
    const assignments = INSURANCE_FIELDS.map(f => `${f}=?`).join(', ')
    db.prepare(`UPDATE tweedInsurance SET ${assignments}, updatedAt=? WHERE id=?`).run(...values, now, SINGLETON)
  } else {
    const cols = INSURANCE_FIELDS.join(', ')
    const placeholders = INSURANCE_FIELDS.map(() => '?').join(', ')
    db.prepare(`INSERT INTO tweedInsurance (id, ${cols}, updatedAt) VALUES (?, ${placeholders}, ?)`)
      .run(SINGLETON, ...values, now)
  }
  res.json(readInsurance())
})

// ── Aggregates ────────────────────────────────────────────────────────────────

// GET /api/tweed/claims/summary — vet spend vs. what insurance has actually paid back.
router.get('/claims/summary', (_req, res) => {
  const rows = db.prepare('SELECT * FROM tweedMedical').all() as MedicalRow[]
  const totalCost = rows.reduce((s, r) => s + (r.cost ?? 0), 0)
  const totalReimbursed = rows.reduce((s, r) => s + (r.amountReimbursed ?? 0), 0)
  // Submitted but not yet paid — money still owed to us
  const outstanding = rows
    .filter(r => r.claimStatus === 'submitted')
    .reduce((s, r) => s + (r.amountClaimed ?? 0), 0)
  // Has a cost, is claimable, but has not been sent yet
  const unclaimed = rows
    .filter(r => r.claimStatus === 'not_submitted' && (r.cost ?? 0) > 0)
    .reduce((s, r) => s + (r.cost ?? 0), 0)
  res.json({
    totalCost,
    totalReimbursed,
    outstanding,
    unclaimed,
    netCost: totalCost - totalReimbursed,
    claimCount: rows.filter(r => r.claimStatus !== 'not_claimable').length,
  })
})

// GET /api/tweed/handover — everything a sitter needs, in one call.
router.get('/handover', (_req, res) => {
  const profile = readProfile()
  const schedule = (db.prepare('SELECT * FROM tweedSchedule ORDER BY time ASC').all() as ScheduleRow[])
    .map(toScheduleItem)
  res.json({ profile, schedule })
})

export default router
