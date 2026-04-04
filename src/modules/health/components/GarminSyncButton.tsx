import { useState, useEffect } from 'react'
import { RefreshCw, WifiOff } from 'lucide-react'

interface SyncStatus {
  configured: boolean
  last: {
    syncedAt: string
    activitiesAdded: number
    metricsAdded: number
    error: string | null
  } | null
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  const hrs = Math.floor(mins / 60)
  const days = Math.floor(hrs / 24)
  if (days > 0) return `${days}d ago`
  if (hrs > 0) return `${hrs}h ago`
  if (mins > 0) return `${mins}m ago`
  return 'just now'
}

export function GarminSyncButton({ onSyncComplete }: { onSyncComplete?: () => void }) {
  const [status, setStatus] = useState<SyncStatus | null>(null)
  const [syncing, setSyncing] = useState(false)
  const [result, setResult] = useState<{ ok: boolean; error?: string; activitiesAdded?: number; metricsAdded?: number } | null>(null)

  useEffect(() => {
    fetch('/api/garmin/status').then(r => r.json()).then(setStatus)
  }, [])

  const handleSync = async () => {
    setSyncing(true)
    setResult(null)
    try {
      const r = await fetch('/api/garmin/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ daysBack: 30 })
      })
      const data = await r.json()
      setResult(data)
      // Refresh status
      fetch('/api/garmin/status').then(r => r.json()).then(setStatus)
      if (data.ok && onSyncComplete) onSyncComplete()
    } catch {
      setResult({ ok: false, error: 'Network error' })
    }
    setSyncing(false)
  }

  if (!status) return null

  if (!status.configured) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-gray-400">
        <WifiOff className="w-3.5 h-3.5" />
        <span>Add GARMIN_EMAIL + GARMIN_PASSWORD to .env to enable auto-sync</span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      {status.last && (
        <span className="text-xs text-gray-400">
          {status.last.error
            ? <span className="text-red-400">Last sync had errors</span>
            : `Synced ${timeAgo(status.last.syncedAt)}`
          }
        </span>
      )}
      {result && (
        <span className={`text-xs ${result.ok ? 'text-green-600' : 'text-red-500'}`}>
          {result.ok
            ? `+${result.activitiesAdded} sessions, +${result.metricsAdded} metrics`
            : result.error
          }
        </span>
      )}
      <button
        onClick={handleSync}
        disabled={syncing}
        className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-200 text-gray-600 rounded-md hover:bg-gray-50 disabled:opacity-50"
        title="Sync last 30 days from Garmin Connect"
      >
        <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
        {syncing ? 'Syncing…' : 'Sync Garmin'}
      </button>
    </div>
  )
}
