import { Router } from 'express'
import { sendMorningEmail, isEmailConfigured } from '../emailService.js'
import { generateMorningEmail } from '../emailContent.js'

const router = Router()

// Manual trigger — send now
router.post('/send-now', async (_req, res) => {
  const result = await sendMorningEmail()
  if (result.ok) {
    res.json({ ok: true })
  } else {
    res.status(500).json({ ok: false, error: result.error })
  }
})

// Preview — returns the email body as HTML (for testing)
router.get('/preview', (_req, res) => {
  const { html } = generateMorningEmail()
  res.setHeader('Content-Type', 'text/html')
  res.send(html)
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
