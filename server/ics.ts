/**
 * Minimal RFC 5545 iCalendar writer for invitations.
 *
 * Deliberately hand-rolled and dependency-free — the subset needed for an
 * invitation is small, but the details that matter are easy to get wrong, so they
 * are implemented explicitly here and unit-checked:
 *
 *   - CRLF line endings (§3.1). Bare \n is rejected by strict parsers.
 *   - Folding at 75 octets, counted in UTF-8 bytes rather than characters, so a
 *     multi-byte character is never split across the fold (§3.1).
 *   - TEXT escaping of backslash, semicolon, comma and newline (§3.3.11).
 *   - UTC timestamps, which sidesteps VTIMEZONE entirely — the receiving client
 *     renders in the viewer's own zone.
 */

export type IcsMethod = 'REQUEST' | 'CANCEL'

export interface IcsEvent {
  uid: string
  sequence: number
  summary: string
  description?: string
  location?: string
  /** ISO 8601. For all-day events only the date part is used. */
  startsAt: string
  endsAt: string
  allDay?: boolean
  organizer: string
  organizerName?: string
  attendee: string
}

/** Escape a TEXT value per §3.3.11. Order matters: backslash first. */
function escapeText(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r\n|\r|\n/g, '\\n')
}

/**
 * Fold to 75 octets per line, continuing with CRLF + one space.
 *
 * The limit is octets, not characters, and a multi-byte sequence must not be
 * split — so this measures encoded length and breaks on character boundaries.
 */
export function foldLine(line: string): string {
  const LIMIT = 75
  if (Buffer.byteLength(line, 'utf8') <= LIMIT) return line

  const out: string[] = []
  let current = ''
  let currentBytes = 0
  let first = true

  for (const char of line) {
    const size = Buffer.byteLength(char, 'utf8')
    // Continuation lines carry a leading space, which counts toward the limit.
    const max = first ? LIMIT : LIMIT - 1
    if (currentBytes + size > max) {
      out.push(first ? current : ` ${current}`)
      first = false
      current = ''
      currentBytes = 0
    }
    current += char
    currentBytes += size
  }
  if (current) out.push(first ? current : ` ${current}`)
  return out.join('\r\n')
}

/** YYYYMMDDTHHMMSSZ, or YYYYMMDD for all-day. */
export function formatDate(iso: string, allDay: boolean): string {
  const d = new Date(iso)
  if (isNaN(d.getTime())) throw new Error(`Invalid date: ${iso}`)
  const pad = (n: number) => String(n).padStart(2, '0')
  const date = `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}`
  if (allDay) return date
  return `${date}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`
}

export function buildIcs(event: IcsEvent, method: IcsMethod): string {
  const allDay = event.allDay === true
  const dtStart = formatDate(event.startsAt, allDay)
  const dtEnd = formatDate(event.endsAt, allDay)
  const stamp = formatDate(new Date().toISOString(), false)

  const organizerName = event.organizerName ?? 'Life Manager'

  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Life Manager//EN',
    'CALSCALE:GREGORIAN',
    `METHOD:${method}`,
    'BEGIN:VEVENT',
    `UID:${event.uid}`,
    `SEQUENCE:${event.sequence}`,
    `DTSTAMP:${stamp}`,
    allDay ? `DTSTART;VALUE=DATE:${dtStart}` : `DTSTART:${dtStart}`,
    allDay ? `DTEND;VALUE=DATE:${dtEnd}` : `DTEND:${dtEnd}`,
    `SUMMARY:${escapeText(event.summary)}`,
    `ORGANIZER;CN=${escapeText(organizerName)}:mailto:${event.organizer}`,
    // RSVP=TRUE is what makes a mail client render accept/decline buttons.
    `ATTENDEE;CUTYPE=INDIVIDUAL;ROLE=REQ-PARTICIPANT;PARTSTAT=NEEDS-ACTION;RSVP=TRUE:mailto:${event.attendee}`,
    // CANCEL must also carry STATUS:CANCELLED, or clients may ignore it.
    `STATUS:${method === 'CANCEL' ? 'CANCELLED' : 'CONFIRMED'}`,
  ]

  if (event.description) lines.push(`DESCRIPTION:${escapeText(event.description)}`)
  if (event.location) lines.push(`LOCATION:${escapeText(event.location)}`)

  lines.push('END:VEVENT', 'END:VCALENDAR')

  return lines.map(foldLine).join('\r\n') + '\r\n'
}
