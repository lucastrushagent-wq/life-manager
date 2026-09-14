import { randomUUID } from 'crypto'
import { db } from './db.js'

/**
 * Materialises todos from other modules — a service provider past its visit
 * cadence, a vet follow-up that has come due.
 *
 * The risk this design carries is drift: ticking off "Book dentist" is not the
 * same fact as having been to the dentist, so without care the source record
 * stays due and the todo regenerates forever. Two mechanisms prevent that:
 *
 *   1. Generation is deduped on (sourceType, sourceId) against any OPEN todo, so
 *      an outstanding item is never duplicated.
 *   2. Completing a generated todo writes back to the source — a provider visit
 *      is logged, a follow-up is marked handled — so the source stops being due.
 *      `completeSource` is called from the todo PATCH handler.
 *
 * Both halves are required. Either alone leaves the loop open.
 */

export type SourceType = 'provider' | 'tweed_followup'

export interface GeneratedTodo {
  id: string
  title: string
  sourceType: SourceType
  sourceId: string
}

const todayISO = () => new Date().toISOString().slice(0, 10)

/** An open, undeleted todo already exists for this source. */
function hasOpenTodo(sourceType: SourceType, sourceId: string): boolean {
  return !!db.prepare(
    'SELECT id FROM todos WHERE sourceType = ? AND sourceId = ? AND completed = 0 AND deletedAt IS NULL'
  ).get(sourceType, sourceId)
}

function insertTodo(title: string, description: string | null, sourceType: SourceType, sourceId: string): string {
  const id = randomUUID()
  db.prepare(`
    INSERT INTO todos (id, title, description, completed, dueDate, priority, tags, createdAt, sourceType, sourceId)
    VALUES (?, ?, ?, 0, ?, 'high', '[]', ?, ?, ?)
  `).run(id, title, description, todayISO(), new Date().toISOString(), sourceType, sourceId)
  return id
}

interface ProviderRow {
  id: string; name: string; category: string; specialty: string | null
  lastVisit: string | null; frequencyDays: number | null; archived: number
}

interface FollowUpRow {
  id: string; title: string; followUpDate: string | null
  followUpCompletedAt: string | null; vet: string | null
}

/**
 * Create todos for anything now due. Idempotent — safe to call repeatedly, which
 * matters because it runs both on a schedule and on demand.
 */
export function generateSourcedTodos(): GeneratedTodo[] {
  const created: GeneratedTodo[] = []
  const today = todayISO()

  // ── Service providers past their cadence ──────────────────────────────────
  const providers = db.prepare(
    'SELECT * FROM serviceProviders WHERE archived = 0 AND frequencyDays IS NOT NULL'
  ).all() as ProviderRow[]

  for (const p of providers) {
    // No recorded visit but a cadence set — treat as due now.
    let due = true
    if (p.lastVisit) {
      const next = new Date(p.lastVisit + 'T00:00:00')
      next.setDate(next.getDate() + (p.frequencyDays as number))
      due = next.toISOString().slice(0, 10) <= today
    }
    if (!due || hasOpenTodo('provider', p.id)) continue

    const title = `Book ${p.name}`
    const detail = [p.specialty, p.lastVisit ? `last visit ${p.lastVisit}` : 'no visit recorded']
      .filter(Boolean).join(' · ')
    insertTodo(title, detail || null, 'provider', p.id)
    created.push({ id: p.id, title, sourceType: 'provider', sourceId: p.id })
  }

  // ── Tweed vet follow-ups that have come due ───────────────────────────────
  const followUps = db.prepare(`
    SELECT * FROM tweedMedical
    WHERE followUpDate IS NOT NULL AND followUpCompletedAt IS NULL AND followUpDate <= ?
  `).all(today) as FollowUpRow[]

  for (const f of followUps) {
    if (hasOpenTodo('tweed_followup', f.id)) continue
    const title = `Tweed follow-up: ${f.title}`
    const detail = [f.vet, f.followUpDate ? `due ${f.followUpDate}` : ''].filter(Boolean).join(' · ')
    insertTodo(title, detail || null, 'tweed_followup', f.id)
    created.push({ id: f.id, title, sourceType: 'tweed_followup', sourceId: f.id })
  }

  return created
}

/**
 * Write back to the source when a generated todo is completed.
 *
 * This is the half that stops "Book dentist" reappearing the moment it is ticked
 * off: logging the visit moves the provider's cadence forward, so it is no longer
 * due. Returns a description of what was updated, or null if nothing was.
 */
export function completeSource(sourceType: string | null, sourceId: string | null): string | null {
  if (!sourceType || !sourceId) return null
  const today = todayISO()

  if (sourceType === 'provider') {
    const row = db.prepare('SELECT id, name FROM serviceProviders WHERE id = ?').get(sourceId) as
      { id: string; name: string } | undefined
    if (!row) return null
    db.prepare('UPDATE serviceProviders SET lastVisit = ? WHERE id = ?').run(today, sourceId)
    return `logged a visit to ${row.name}`
  }

  if (sourceType === 'tweed_followup') {
    const row = db.prepare('SELECT id, title FROM tweedMedical WHERE id = ?').get(sourceId) as
      { id: string; title: string } | undefined
    if (!row) return null
    db.prepare('UPDATE tweedMedical SET followUpCompletedAt = ? WHERE id = ?')
      .run(new Date().toISOString(), sourceId)
    return `marked follow-up handled: ${row.title}`
  }

  return null
}

/** Undo the write-back when a completed generated todo is re-opened. */
export function reopenSource(sourceType: string | null, sourceId: string | null): string | null {
  if (!sourceType || !sourceId) return null
  if (sourceType === 'tweed_followup') {
    db.prepare('UPDATE tweedMedical SET followUpCompletedAt = NULL WHERE id = ?').run(sourceId)
    return 'follow-up reopened'
  }
  // A provider visit is deliberately NOT unwound: lastVisit may have been the
  // real date of a real appointment, and guessing the previous value would be
  // worse than leaving it. Un-ticking simply reopens the task.
  return null
}
