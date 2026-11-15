import { useEffect, useRef, useState } from 'react'
import type { Baseline, Status } from '../lib/types'

interface Props {
  points: { day: number; v: number }[]
  base: Baseline
  band: { lo: number; hi: number }
  status: Status
  decimals: number
  dayLabel: string
  height?: number
  label: string
  /** Line and band only, for small previews. */
  compact?: boolean
}

/** Line of daily readings over the shaded band that counts as normal for this person. */
export function TrendChart({ points, base, band, status, decimals, dayLabel, height = 150, label, compact = false }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const [w, setW] = useState(0)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => setW(Math.floor(e.contentRect.width)))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const pad = compact ? { l: 0, r: 6, t: 6, b: 6 } : { l: 40, r: 10, t: 10, b: 22 }
  const vs = points.map((p) => p.v)
  let lo = Math.min(...vs, base.mean - 2 * base.sd)
  let hi = Math.max(...vs, base.mean + 2 * base.sd)
  const span = hi - lo || 1
  lo -= span * 0.08
  hi += span * 0.08
  const iw = Math.max(0, w - pad.l - pad.r)
  const ih = height - pad.t - pad.b
  const x = (i: number) => pad.l + (points.length > 1 ? (i / (points.length - 1)) * iw : iw / 2)
  const y = (v: number) => pad.t + (1 - (v - lo) / (hi - lo)) * ih
  const bandTop = y(Math.min(hi, band.hi))
  const bandBottom = y(Math.max(lo, band.lo))
  const last = points[points.length - 1]

  return (
    <div ref={ref} className={`chart status-${status}`} style={{ height }}>
      {w > 0 && points.length > 0 && (
        // Keyed on the range so the line redraws when the range changes.
        <svg key={points.length} width={w} height={height} role="img" aria-label={label}>
          <rect x={pad.l} y={bandTop} width={iw} height={Math.max(0, bandBottom - bandTop)} className="chart-band" />
          <line x1={pad.l} x2={pad.l + iw} y1={y(base.mean)} y2={y(base.mean)} className="chart-base" />
          <path
            d={`M${points.map((p, i) => `${x(i).toFixed(1)} ${y(p.v).toFixed(1)}`).join('L')}`}
            pathLength={1}
            className="chart-line"
          />
          <circle cx={x(points.length - 1)} cy={y(last.v)} r="4.5" className="chart-dot" />
          {!compact && (
            <>
              <text x={pad.l - 8} y={y(hi) + 10} textAnchor="end" className="chart-tick">
                {hi.toFixed(decimals)}
              </text>
              <text x={pad.l - 8} y={y(base.mean) + 4} textAnchor="end" className="chart-tick chart-tick-base">
                {base.mean.toFixed(decimals)}
              </text>
              <text x={pad.l - 8} y={y(lo)} textAnchor="end" className="chart-tick">
                {lo.toFixed(decimals)}
              </text>
              <text x={pad.l} y={height - 4} className="chart-tick">
                {dayLabel} {points[0].day}
              </text>
              <text x={pad.l + iw} y={height - 4} textAnchor="end" className="chart-tick">
                {dayLabel} {last.day}
              </text>
            </>
          )}
        </svg>
      )}
    </div>
  )
}
