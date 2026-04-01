import type { NetWorthSnapshot } from '../types'

interface Props {
  snapshots: NetWorthSnapshot[]
}

function formatCurrency(n: number): string {
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (Math.abs(n) >= 1_000) return `$${(n / 1_000).toFixed(0)}k`
  return `$${n.toFixed(0)}`
}

function formatDate(dateStr: string): string {
  const [y, m] = dateStr.split('-')
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  return `${months[parseInt(m) - 1]} ${y}`
}

export function NetWorthChart({ snapshots }: Props) {
  if (snapshots.length < 2) {
    return (
      <div className="flex items-center justify-center h-32 text-gray-400 text-sm">
        Chart will appear after 2+ monthly updates
      </div>
    )
  }

  const W = 640
  const H = 180
  const PAD = { top: 16, right: 16, bottom: 32, left: 64 }
  const innerW = W - PAD.left - PAD.right
  const innerH = H - PAD.top - PAD.bottom

  const allValues = snapshots.flatMap(s => [s.netWorth, s.totalAssets, s.totalLiabilities])
  const minVal = Math.min(...allValues)
  const maxVal = Math.max(...allValues)
  const range = maxVal - minVal || 1
  const padded = range * 0.12

  const yMin = minVal - padded
  const yMax = maxVal + padded

  function xPos(i: number) {
    return PAD.left + (i / (snapshots.length - 1)) * innerW
  }
  function yPos(v: number) {
    return PAD.top + innerH - ((v - yMin) / (yMax - yMin)) * innerH
  }

  function polyline(values: number[], color: string, dashed = false) {
    const points = values.map((v, i) => `${xPos(i)},${yPos(v)}`).join(' ')
    return (
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeDasharray={dashed ? '4 3' : undefined}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    )
  }

  // Y-axis gridlines
  const yTicks = 4
  const gridLines = Array.from({ length: yTicks + 1 }, (_, i) => {
    const v = yMin + (i / yTicks) * (yMax - yMin)
    const y = yPos(v)
    return { v, y }
  })

  // X-axis labels — show at most 6, evenly spaced
  const maxLabels = 6
  const step = Math.ceil(snapshots.length / maxLabels)
  const xLabels = snapshots
    .map((s, i) => ({ s, i }))
    .filter(({ i }) => i % step === 0 || i === snapshots.length - 1)

  // Tooltip state handled via SVG title tags (native hover)
  return (
    <div className="w-full">
      <div className="flex items-center gap-4 mb-3 text-xs text-gray-500">
        <span className="flex items-center gap-1.5"><span className="inline-block w-5 h-0.5 bg-blue-500 rounded" />Net worth</span>
        <span className="flex items-center gap-1.5"><span className="inline-block w-5 border-t border-dashed border-green-500" />Assets</span>
        <span className="flex items-center gap-1.5"><span className="inline-block w-5 border-t border-dashed border-red-400" />Liabilities</span>
      </div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        style={{ height: H }}
      >
        {/* Grid lines */}
        {gridLines.map(({ v, y }, i) => (
          <g key={i}>
            <line x1={PAD.left} y1={y} x2={W - PAD.right} y2={y} stroke="#e5e7eb" strokeWidth={1} />
            <text x={PAD.left - 6} y={y + 4} textAnchor="end" fontSize={10} fill="#9ca3af">
              {formatCurrency(v)}
            </text>
          </g>
        ))}

        {/* Zero line if visible */}
        {yMin < 0 && yMax > 0 && (
          <line
            x1={PAD.left} y1={yPos(0)}
            x2={W - PAD.right} y2={yPos(0)}
            stroke="#d1d5db" strokeWidth={1.5} strokeDasharray="2 2"
          />
        )}

        {/* Lines */}
        {polyline(snapshots.map(s => s.totalAssets), '#22c55e', true)}
        {polyline(snapshots.map(s => s.totalLiabilities), '#f87171', true)}
        {polyline(snapshots.map(s => s.netWorth), '#3b82f6')}

        {/* Net worth dots with tooltips */}
        {snapshots.map((s, i) => (
          <circle key={s.id} cx={xPos(i)} cy={yPos(s.netWorth)} r={3} fill="#3b82f6">
            <title>{formatDate(s.date)}: {formatCurrency(s.netWorth)}</title>
          </circle>
        ))}

        {/* X axis labels */}
        {xLabels.map(({ s, i }) => (
          <text key={s.id} x={xPos(i)} y={H - 6} textAnchor="middle" fontSize={10} fill="#9ca3af">
            {formatDate(s.date)}
          </text>
        ))}
      </svg>
    </div>
  )
}
