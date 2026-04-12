import { useState } from 'react'
import type { NetWorthSnapshot, NetWorthTarget } from '../types'

type Range = '3M' | '6M' | '1Y' | '2Y' | 'All'
const RANGES: Range[] = ['3M', '6M', '1Y', '2Y', 'All']

// Distinct colors for up to 5 target lines
const TARGET_COLORS = ['#8b5cf6', '#f97316', '#14b8a6', '#ec4899', '#eab308']

interface Props {
  snapshots: NetWorthSnapshot[]
  targets?: NetWorthTarget[]
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

function getCutoff(range: Range): string | null {
  if (range === 'All') return null
  const months = range === '3M' ? 3 : range === '6M' ? 6 : range === '1Y' ? 12 : 24
  const d = new Date()
  d.setMonth(d.getMonth() - months)
  return d.toISOString().split('T')[0]
}

export function NetWorthChart({ snapshots, targets = [] }: Props) {
  const [range, setRange] = useState<Range>('All')

  const cutoff = getCutoff(range)
  const filtered = cutoff ? snapshots.filter(s => s.date >= cutoff) : snapshots

  const W = 640
  const H = 200
  const PAD = { top: 16, right: 16, bottom: 32, left: 64 }
  const innerW = W - PAD.left - PAD.right
  const innerH = H - PAD.top - PAD.bottom

  const rangeButtons = (
    <div className="flex items-center gap-1">
      {RANGES.map(r => (
        <button
          key={r}
          onClick={() => setRange(r)}
          className={`text-xs px-2 py-0.5 rounded font-medium transition-colors ${
            range === r
              ? 'bg-gray-800 text-white'
              : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
          }`}
        >
          {r}
        </button>
      ))}
    </div>
  )

  if (filtered.length < 2) {
    return (
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1.5"><span className="inline-block w-5 h-0.5 bg-blue-500 rounded" />Net worth</span>
            <span className="flex items-center gap-1.5"><span className="inline-block w-5 border-t border-dashed border-green-500" />Assets</span>
            <span className="flex items-center gap-1.5"><span className="inline-block w-5 border-t border-dashed border-red-400" />Liabilities</span>
          </div>
          {rangeButtons}
        </div>
        <div className="flex items-center justify-center h-32 text-gray-400 text-sm">
          {snapshots.length < 2 ? 'Chart will appear after 2+ monthly updates' : 'Not enough data in this range'}
        </div>
      </div>
    )
  }

  // Y range includes target amounts so reference lines always appear
  const snapshotValues = filtered.flatMap(s => [s.netWorth, s.totalAssets, s.totalLiabilities])
  const targetValues = targets.map(t => t.targetAmount)
  const allValues = [...snapshotValues, ...targetValues]
  const minVal = Math.min(...allValues)
  const maxVal = Math.max(...allValues)
  const rawRange = maxVal - minVal || 1
  const padded = rawRange * 0.12
  const yMin = minVal - padded
  const yMax = maxVal + padded

  function xPos(i: number) {
    return PAD.left + (i / (filtered.length - 1)) * innerW
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
    return { v, y: yPos(v) }
  })

  // X-axis labels
  const maxLabels = 6
  const step = Math.ceil(filtered.length / maxLabels)
  const xLabels = filtered
    .map((s, i) => ({ s, i }))
    .filter(({ i }) => i % step === 0 || i === filtered.length - 1)

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-4 text-xs text-gray-500 flex-wrap">
          <span className="flex items-center gap-1.5"><span className="inline-block w-5 h-0.5 bg-blue-500 rounded" />Net worth</span>
          <span className="flex items-center gap-1.5"><span className="inline-block w-5 border-t border-dashed border-green-500" />Assets</span>
          <span className="flex items-center gap-1.5"><span className="inline-block w-5 border-t border-dashed border-red-400" />Liabilities</span>
          {targets.map((t, idx) => (
            <span key={t.id} className="flex items-center gap-1.5">
              <span className="inline-block w-5 border-t-2 border-dashed" style={{ borderColor: TARGET_COLORS[idx % TARGET_COLORS.length] }} />
              <span style={{ color: TARGET_COLORS[idx % TARGET_COLORS.length] }}>{t.label}</span>
            </span>
          ))}
        </div>
        {rangeButtons}
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: H }}>
        {/* Grid lines */}
        {gridLines.map(({ v, y }, i) => (
          <g key={i}>
            <line x1={PAD.left} y1={y} x2={W - PAD.right} y2={y} stroke="#e5e7eb" strokeWidth={1} />
            <text x={PAD.left - 6} y={y + 4} textAnchor="end" fontSize={10} fill="#9ca3af">
              {formatCurrency(v)}
            </text>
          </g>
        ))}

        {/* Zero line */}
        {yMin < 0 && yMax > 0 && (
          <line
            x1={PAD.left} y1={yPos(0)}
            x2={W - PAD.right} y2={yPos(0)}
            stroke="#d1d5db" strokeWidth={1.5} strokeDasharray="2 2"
          />
        )}

        {/* Target reference lines */}
        {targets.map((t, idx) => {
          const color = TARGET_COLORS[idx % TARGET_COLORS.length]
          const y = yPos(t.targetAmount)
          const label = t.label.length > 14 ? t.label.slice(0, 13) + '…' : t.label
          return (
            <g key={t.id}>
              <line
                x1={PAD.left} y1={y}
                x2={W - PAD.right} y2={y}
                stroke={color} strokeWidth={1.5} strokeDasharray="5 4"
                opacity={0.8}
              />
              <text
                x={W - PAD.right - 3} y={y - 3}
                textAnchor="end" fontSize={9} fill={color} fontWeight={500}
              >
                {label} {formatCurrency(t.targetAmount)}
              </text>
            </g>
          )
        })}

        {/* Data lines */}
        {polyline(filtered.map(s => s.totalAssets), '#22c55e', true)}
        {polyline(filtered.map(s => s.totalLiabilities), '#f87171', true)}
        {polyline(filtered.map(s => s.netWorth), '#3b82f6')}

        {/* Net worth dots */}
        {filtered.map((s, i) => (
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
