import nodemailer from 'nodemailer'
import { db } from './db.js'
import { generateDailyEmail } from './emailContent.js'

export interface EmailConfig {
  smtpUser: string
  smtpPass: string
  toEmail: string
}

function getConfig(): EmailConfig | null {
  const smtpUser = process.env.EMAIL_USER
  const smtpPass = process.env.EMAIL_PASS
  const toEmail = process.env.EMAIL_TO
  if (!smtpUser || !smtpPass || !toEmail) return null
  return { smtpUser, smtpPass, toEmail }
}

export function isEmailConfigured(): boolean {
  return getConfig() !== null
}

function todayDateStr(): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

// Atomically claim the send slot for today. Returns true only if this caller
// is the first to claim it — preventing duplicate sends when two cron firings
// race (e.g. two processes or a hot-reload that registered the job twice).
function claimSend(): boolean {
  const result = db.prepare('INSERT OR IGNORE INTO emailLog (id, sentDate, sentAt) VALUES (?, ?, ?)')
    .run(crypto.randomUUID(), todayDateStr(), new Date().toISOString())
  return result.changes > 0
}

function alreadySentToday(): boolean {
  const row = db.prepare('SELECT id FROM emailLog WHERE sentDate = ?').get(todayDateStr())
  return !!row
}

export async function sendMorningEmail(force = false): Promise<{ ok: boolean; skipped?: boolean; error?: string }> {
  if (force) {
    if (alreadySentToday()) {
      console.log('[email] Already sent today, skipping.')
      return { ok: true, skipped: true }
    }
  } else {
    if (!claimSend()) {
      console.log('[email] Already sent today, skipping.')
      return { ok: true, skipped: true }
    }
  }

  const config = getConfig()
  if (!config) {
    return { ok: false, error: 'Email not configured. Set EMAIL_USER, EMAIL_PASS, EMAIL_TO in .env' }
  }

  const { subject, text } = generateDailyEmail()

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: config.smtpUser, pass: config.smtpPass },
  })

  try {
    await transporter.sendMail({
      from: `"Life Manager" <${config.smtpUser}>`,
      to: config.toEmail,
      subject,
      text,
    })
    return { ok: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return { ok: false, error: message }
  }
}
