import { useRef, useState } from 'react'
import { useGoogleLogin } from '@react-oauth/google'

type ShareStatus = 'idle' | 'sending' | 'sent' | 'error'

async function buildRawEmail(accessToken: string, subject: string, body: string): Promise<string> {
  const profileRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  const profile = await profileRes.json() as { email: string }

  const message = [
    `To: ${profile.email}`,
    `Subject: ${subject}`,
    'Content-Type: text/plain; charset=utf-8',
    'MIME-Version: 1.0',
    '',
    body,
  ].join('\r\n')

  return btoa(unescape(encodeURIComponent(message)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

async function sendViaGmailApi(accessToken: string, raw: string): Promise<void> {
  const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ raw }),
  })
  if (!res.ok) throw new Error(`Gmail API error: ${res.status}`)
}

export function useGmailShare() {
  const [status, setStatus] = useState<ShareStatus>('idle')
  const pending = useRef<{ subject: string; body: string } | null>(null)

  const login = useGoogleLogin({
    scope: 'https://www.googleapis.com/auth/gmail.send',
    onSuccess: async (tokenResponse) => {
      if (!pending.current) return
      const { subject, body } = pending.current
      pending.current = null
      setStatus('sending')
      try {
        const raw = await buildRawEmail(tokenResponse.access_token, subject, body)
        await sendViaGmailApi(tokenResponse.access_token, raw)
        setStatus('sent')
        setTimeout(() => setStatus('idle'), 3000)
      } catch {
        setStatus('error')
        setTimeout(() => setStatus('idle'), 3000)
      }
    },
    onError: () => {
      setStatus('error')
      setTimeout(() => setStatus('idle'), 3000)
    },
  })

  function shareToGmail(subject: string, body: string) {
    pending.current = { subject, body }
    login()
  }

  return { shareToGmail, status }
}
