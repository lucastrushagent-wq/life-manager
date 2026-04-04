import { useState, useEffect } from 'react'
import { RefreshCw, WifiOff, ChevronDown, ChevronUp } from 'lucide-react'

interface SyncLog {
  syncedAt: string
  daysBack: number
  activitiesAdded: number
  metricsAdded: number
  error: string | null
}

interface SyncStatus {
  configured: boolean
  logs: SyncLog[]
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

function formatDate(iso: string) {
  const d = new Date(iso)
  return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`
}

export function GarminSyncButton({ onSyncComplete }: { onSyncComplete?: () => void }) {
  const [status, setStatus] = useState<SyncStatus | null>(null)
  const [syncing, setSyncing] = useState(false)
  const [syncResult, setSyncResult] = useState<{ ok: boolean; error?: string; errors?: string[]; activitiesAdded?: number; metricsAdded?: number } | null>(null)
  const [showLogs, setShowLogs] = useState(false)

  const fetchStatus = () =>
    fetch('/api/garmin/status').then(r => r.json()).then(setStatus).catch(() => {})

  useEffect(() => { fetchStatus() }, [])

  const handleSync = async () => {
    setSyncing(true)
    setSyncResult(null)
    try {
      const r = await fetch('/api/garmin/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ daysBack: 30 }),
      })
      const data = await r.json()
      setSyncResult(data)
      fetchStatus()
      if (data.ok && onSyncComplete) onSyncComplete()
    } catch {
      setSyncResult({ ok: false, error: 'Network error' })
    }
    setSyncing(false)
  }

  if (!status) return null

  if (!status.configured) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-gray-400">
        <WifiOff className="w-3.5 h-3.5" />
        <span>Add GARMIN_EMAIL + GARMIN_PASSWORD to .env to enable sync</span>
      </div>
    )
  }

  const last = status.logs[0] ?? null

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center gap-2">
        {/* Last sync result from this session */}
        {syncResult && (
          <span className={`text-xs ${syncResult.ok ? 'text-green-600' : 'text-red-500'}`}>
            {syncResult.ok
              ? `+${syncResult.activitiesAdded} sessions, +${syncResult.metricsAdded} metrics`
              : syncResult.error}
          </span>
        )}

        {/* Persistent status from DB */}
        {!syncResult && last && (
          <button
            onClick={() => setShowLogs(v => !v)}
            className={`text-xs flex items-center gap-0.5 ${last.error ? 'text-red-400 hover:text-red-600' : 'text-gray-400 hover:text-gray-600'}`}
          >
            {last.error ? `Error ${timeAgo(last.syncedAt)}` : `Synced ${timeAgo(last.syncedAt)}`}
            {showLogs ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
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

      {/* Expanded error/log panel */}
      {showLogs && status.logs.length > 0 && (
        <div className="w-96 bg-white border border-gray-200 rounded-lg shadow-lg text-xs overflow-hidden">
          <div className="px-3 py-2 bg-gray-50 border-b border-gray-100 font-medium text-gray-600">
            Recent sync logs
          </div>
          <div className="divide-y divide-gray-100 max-h-64 overflow-y-auto">
            {status.logs.map((log, i) => (
              <div key={i} className="px-3 py-2 space-y-1">
                <div className="flex justify-between text-gray-500">
                  <span>{formatDate(log.syncedAt)}</span>
                  <span className="text-gray-400">{log.daysBack}d back</span>
                </div>
                <div className="flex gap-3 text-gray-600">
                  <span>{log.activitiesAdded} sessions</span>
                  <span>{log.metricsAdded} metrics</span>
                </div>
                {log.error && (
                  <div className="text-red-500 break-words font-mono text-xs bg-red-50 rounded p-1.5">
                    {log.error}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
