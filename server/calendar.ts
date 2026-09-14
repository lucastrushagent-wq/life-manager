import nodemailer from 'nodemailer'
import { db } from './db.js'
import { buildIcs, type IcsMethod } from './ics.js'

/**
 * Calendar invitations, sent as email with an iCalendar attachment.
 *
 * This is iMIP — how calendar invitations actually travel between systems — so it
 * works whether the recipient's calendar is Google, iCloud or Outlook, and needs
 * no calendar credentials at all: it reuses the SMTP account already configured
 * for the morning briefing.
 *
 * It also keeps the permission model intact. The agent never writes to a personal
 * calendar; it sends an invitation from its own address, which the recipient
 * accepts. Read-only on their side stays read-only.
 */

export interface InviteInput {
  summary: string
  startsAt: string
  endsAt: string
  description?: string
  location?: string
  allDay?: boolean
  /** Defaults to EMAIL_TO. */
  attendee?: string
}

export interface InviteRow {
  id: string
  uid: string
  sequence: number
  summary: string
  description: string | null
  location: string | null
  startsAt: string
  endsAt: string
  allDay: number
  attendee: string
  organizer: string
  status: string
  error: string | null
  createdAt: string
  updatedAt: string
}

export function toInvite(r: InviteRow) {
  return {
    id: r.id,
    uid: r.uid,
    sequence: r.sequence,
    summary: r.summary,
    description: r.description ?? undefined,
    location: r.location ?? undefined,
    startsAt: r.startsAt,
    endsAt: r.endsAt,
    allDay: r.allDay === 1,
    attendee: r.attendee,
    organizer: r.organizer,
    status: r.status,
    error: r.error ?? undefined,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  }
}

function config() {
  const user = process.env.EMAIL_USER
  const pass = process.env.EMAIL_PASS
  const to = process.env.EMAIL_TO
  if (!user || !pass) return null
  return { user, pass, to }
}

export function isCalendarConfigured(): boolean {
  return config() !== null
}

function assertValidRange(startsAt: string, endsAt: string): void {
  const s = new Date(startsAt).getTime()
  const e = new Date(endsAt).getTime()
  if (isNaN(s)) throw new Error(`Invalid startsAt: ${startsAt}`)
  if (isNaN(e)) throw new Error(`Invalid endsAt: ${endsAt}`)
  if (e <= s) throw new Error('endsAt must be after startsAt')
}

async function deliver(ics: string, method: IcsMethod, row: InviteRow, dryRun: boolean): Promise<void> {
  if (dryRun) return
  const cfg = config()
  if (!cfg) throw new Error('Email not configured. Set EMAIL_USER, EMAIL_PASS, EMAIL_TO in .env')

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: cfg.user, pass: cfg.pass },
  })

  const verb = method === 'CANCEL' ? 'Cancelled' : row.sequence > 0 ? 'Updated' : 'Invitation'

  await transporter.sendMail({
    from: `"Life Manager" <${cfg.user}>`,
    to: row.attendee,
    subject: `${verb}: ${row.summary}`,
    text: [
      row.summary,
      `When: ${row.startsAt}${row.allDay ? '' : ` – ${row.endsAt}`}`,
      row.location ? `Where: ${row.location}` : '',
      row.description ?? '',
    ].filter(Boolean).join('\n'),
    // nodemailer sets text/calendar with the right method parameter, which is
    // what makes a mail client render this as an invitation rather than a file.
    icalEvent: { method, content: ics, filename: 'invite.ics' },
  })
}

export async function sendInvite(
  input: InviteInput,
  opts: { dryRun?: boolean } = {},
): Promise<{ invite: ReturnType<typeof toInvite>; ics: string }> {
  assertValidRange(input.startsAt, input.endsAt)

  const cfg = config()
  const attendee = input.attendee ?? cfg?.to
  if (!attendee) throw new Error('No attendee — pass one, or set EMAIL_TO in .env')
  const organizer = cfg?.user ?? 'life-manager@localhost'

  const id = crypto.randomUUID()
  const uid = `${id}@life-manager`
  const now = new Date().toISOString()

  const ics = buildIcs({
    uid, sequence: 0,
    summary: input.summary,
    description: input.description,
    location: input.location,
    startsAt: input.startsAt,
    endsAt: input.endsAt,
    allDay: input.allDay,
    organizer, attendee,
  }, 'REQUEST')

  // A preview must not persist. Writing first and skipping only the send would
  // leave a phantom invitation behind and, worse, let repeated previews advance
  // the sequence — so a later real update could be ignored by the client as
  // stale.
  if (opts.dryRun) {
    return {
      invite: {
        id, uid, sequence: 0, summary: input.summary,
        description: input.description, location: input.location,
        startsAt: input.startsAt, endsAt: input.endsAt,
        allDay: input.allDay === true, attendee, organizer,
        status: 'draft', error: undefined, createdAt: now, updatedAt: now,
      },
      ics,
    }
  }

  db.prepare(`INSERT INTO calendarInvites
    (id, uid, sequence, summary, description, location, startsAt, endsAt, allDay,
     attendee, organizer, status, createdAt, updatedAt)
    VALUES (?,?,0,?,?,?,?,?,?,?,?,?,?,?)`)
    .run(id, uid, input.summary, input.description ?? null, input.location ?? null,
      input.startsAt, input.endsAt, input.allDay ? 1 : 0,
      attendee, organizer, 'sent', now, now)

  const read = () => db.prepare('SELECT * FROM calendarInvites WHERE id=?').get(id) as InviteRow

  try {
    await deliver(ics, 'REQUEST', read(), false)
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e)
    db.prepare('UPDATE calendarInvites SET status=?, error=?, updatedAt=? WHERE id=?')
      .run('failed', message, new Date().toISOString(), id)
    throw new Error(`Invitation not sent: ${message}`)
  }

  return { invite: toInvite(read()), ics }
}

/**
 * Re-send an existing invitation with changes.
 *
 * The uid stays the same and sequence increments — that pairing is what makes a
 * calendar client treat this as an amendment to the event already on the
 * calendar rather than a second, duplicate event.
 */
export async function updateInvite(
  id: string,
  patch: Partial<InviteInput>,
  opts: { dryRun?: boolean } = {},
): Promise<{ invite: ReturnType<typeof toInvite>; ics: string }> {
  const row = db.prepare('SELECT * FROM calendarInvites WHERE id=?').get(id) as InviteRow | undefined
  if (!row) throw new Error(`No invitation with id ${id}`)
  if (row.status === 'cancelled') throw new Error('Invitation is already cancelled')

  const next = {
    summary: patch.summary ?? row.summary,
    description: patch.description !== undefined ? patch.description : (row.description ?? undefined),
    location: patch.location !== undefined ? patch.location : (row.location ?? undefined),
    startsAt: patch.startsAt ?? row.startsAt,
    endsAt: patch.endsAt ?? row.endsAt,
    allDay: patch.allDay !== undefined ? patch.allDay : row.allDay === 1,
  }
  assertValidRange(next.startsAt, next.endsAt)

  const sequence = row.sequence + 1
  const ics = buildIcs({
    uid: row.uid, sequence, ...next,
    organizer: row.organizer, attendee: row.attendee,
  }, 'REQUEST')

  const now = new Date().toISOString()

  if (opts.dryRun) {
    return {
      invite: { ...toInvite(row), sequence, ...next, status: 'draft', updatedAt: now },
      ics,
    }
  }

  db.prepare(`UPDATE calendarInvites SET
    sequence=?, summary=?, description=?, location=?, startsAt=?, endsAt=?, allDay=?,
    status=?, error=NULL, updatedAt=? WHERE id=?`)
    .run(sequence, next.summary, next.description ?? null, next.location ?? null,
      next.startsAt, next.endsAt, next.allDay ? 1 : 0,
      'updated', now, id)

  const read = () => db.prepare('SELECT * FROM calendarInvites WHERE id=?').get(id) as InviteRow

  try {
    await deliver(ics, 'REQUEST', read(), false)
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e)
    db.prepare('UPDATE calendarInvites SET status=?, error=?, updatedAt=? WHERE id=?')
      .run('failed', message, new Date().toISOString(), id)
    throw new Error(`Update not sent: ${message}`)
  }

  return { invite: toInvite(read()), ics }
}

export async function cancelInvite(
  id: string,
  opts: { dryRun?: boolean } = {},
): Promise<{ invite: ReturnType<typeof toInvite>; ics: string }> {
  const row = db.prepare('SELECT * FROM calendarInvites WHERE id=?').get(id) as InviteRow | undefined
  if (!row) throw new Error(`No invitation with id ${id}`)
  if (row.status === 'cancelled') throw new Error('Invitation is already cancelled')

  const sequence = row.sequence + 1
  const ics = buildIcs({
    uid: row.uid, sequence,
    summary: row.summary,
    description: row.description ?? undefined,
    location: row.location ?? undefined,
    startsAt: row.startsAt, endsAt: row.endsAt, allDay: row.allDay === 1,
    organizer: row.organizer, attendee: row.attendee,
  }, 'CANCEL')

  const now = new Date().toISOString()

  if (opts.dryRun) {
    return { invite: { ...toInvite(row), sequence, status: 'draft', updatedAt: now }, ics }
  }

  db.prepare('UPDATE calendarInvites SET sequence=?, status=?, error=NULL, updatedAt=? WHERE id=?')
    .run(sequence, 'cancelled', now, id)

  const read = () => db.prepare('SELECT * FROM calendarInvites WHERE id=?').get(id) as InviteRow

  try {
    await deliver(ics, 'CANCEL', read(), false)
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e)
    db.prepare('UPDATE calendarInvites SET status=?, error=?, updatedAt=? WHERE id=?')
      .run('failed', message, new Date().toISOString(), id)
    throw new Error(`Cancellation not sent: ${message}`)
  }

  return { invite: toInvite(read()), ics }
}

export function listInvites(opts: { upcomingOnly?: boolean } = {}) {
  let sql = 'SELECT * FROM calendarInvites'
  const params: string[] = []
  if (opts.upcomingOnly) {
    sql += " WHERE endsAt >= ? AND status != 'cancelled'"
    params.push(new Date().toISOString())
  }
  sql += ' ORDER BY startsAt DESC'
  return (db.prepare(sql).all(...params) as InviteRow[]).map(toInvite)
}
