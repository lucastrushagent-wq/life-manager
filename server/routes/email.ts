import { Router } from 'express'
import { sendMorningEmail, isEmailConfigured } from '../emailService.js'
import { generateDailyEmail } from '../emailContent.js'

const router = Router()

// Manual trigger — send now
router.post('/send-now', async (_req, res) => {
  const result = await sendMorningEmail(true) // force=true bypasses the once-per-day guard
  if (result.ok) {
    res.json({ ok: true })
  } else {
    res.status(500).json({ ok: false, error: result.error })
  }
})

// Preview — returns the plain text email body
router.get('/preview', (_req, res) => {
  const { text } = generateDailyEmail()
  res.setHeader('Content-Type', 'text/plain')
  res.send(text)
})

// Status — is email configured?
router.get('/status', (_req, res) => {
  res.json({
    configured: isEmailConfigured(),
    to: process.env.EMAIL_TO ?? null,
    schedule: process.env.EMAIL_SEND_TIME ?? '0 6 * * *',
  })
})

export default router
