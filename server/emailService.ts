import nodemailer from 'nodemailer'
import { generateMorningEmail } from './emailContent.js'

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

export async function sendMorningEmail(): Promise<{ ok: boolean; error?: string }> {
  const config = getConfig()
  if (!config) {
    return { ok: false, error: 'Email not configured. Set EMAIL_USER, EMAIL_PASS, EMAIL_TO in .env' }
  }

  const { subject, html, text } = generateMorningEmail()

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: config.smtpUser,
      pass: config.smtpPass,
    },
  })

  try {
    await transporter.sendMail({
      from: `"Life Manager" <${config.smtpUser}>`,
      to: config.toEmail,
      subject,
      text,
      html,
    })
    return { ok: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return { ok: false, error: message }
  }
}
