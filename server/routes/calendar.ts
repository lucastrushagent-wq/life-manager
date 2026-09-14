import { Router } from 'express'
import {
  sendInvite, updateInvite, cancelInvite, listInvites, isCalendarConfigured,
} from '../calendar.js'

const router = Router()

const fail = (e: unknown) => (e instanceof Error ? e.message : String(e))

router.get('/status', (_req, res) => {
  res.json({
    configured: isCalendarConfigured(),
    organizer: process.env.EMAIL_USER ?? null,
    defaultAttendee: process.env.EMAIL_TO ?? null,
  })
})

router.get('/invites', (req, res) => {
  const upcomingOnly = (req.query as Record<string, string>).upcoming === 'true'
  res.json(listInvites({ upcomingOnly }))
})

// POST /api/calendar/invites?dryRun=true returns the generated .ics without sending
router.post('/invites', async (req, res) => {
  const dryRun = (req.query as Record<string, string>).dryRun === 'true'
  const { summary, startsAt, endsAt, description, location, allDay, attendee } = req.body ?? {}
  if (!summary?.trim()) return res.status(400).json({ error: 'summary required' })
  if (!startsAt || !endsAt) return res.status(400).json({ error: 'startsAt and endsAt required' })
  try {
    const r = await sendInvite(
      { summary: summary.trim(), startsAt, endsAt, description, location, allDay, attendee },
      { dryRun },
    )
    res.status(201).json({ ...r.invite, ...(dryRun ? { ics: r.ics } : {}) })
  } catch (e) {
    res.status(500).json({ error: fail(e) })
  }
})

router.patch('/invites/:id', async (req, res) => {
  const dryRun = (req.query as Record<string, string>).dryRun === 'true'
  try {
    const r = await updateInvite(req.params.id, req.body ?? {}, { dryRun })
    res.json({ ...r.invite, ...(dryRun ? { ics: r.ics } : {}) })
  } catch (e) {
    const message = fail(e)
    res.status(/^No invitation/.test(message) ? 404 : 500).json({ error: message })
  }
})

router.post('/invites/:id/cancel', async (req, res) => {
  const dryRun = (req.query as Record<string, string>).dryRun === 'true'
  try {
    const r = await cancelInvite(req.params.id, { dryRun })
    res.json({ ...r.invite, ...(dryRun ? { ics: r.ics } : {}) })
  } catch (e) {
    const message = fail(e)
    res.status(/^No invitation/.test(message) ? 404 : 500).json({ error: message })
  }
})

export default router
