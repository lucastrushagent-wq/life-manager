import { useEffect, useState } from 'react'

type Status = 'idle' | 'sending' | 'sent' | 'error' | 'unconfigured'

export function useMorningEmail() {
  const [status, setStatus] = useState<Status>('idle')
  const [schedule, setSchedule] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/email/status')
      .then(r => r.json())
      .then(data => {
        if (!data.configured) setStatus('unconfigured')
        setSchedule(data.schedule ?? null)
      })
      .catch(() => {})
  }, [])

  async function sendNow() {
    if (status === 'sending') return
    setStatus('sending')
    try {
      const res = await fetch('/api/email/send-now', { method: 'POST' })
      const data = await res.json()
      setStatus(data.ok ? 'sent' : 'error')
      if (data.ok) setTimeout(() => setStatus('idle'), 3000)
    } catch {
      setStatus('error')
    }
  }

  return { status, schedule, sendNow }
}
