import type { ReactNode } from 'react'
import { STATUS_WORD } from '../lib/engine'
import type { Status } from '../lib/types'

/** Brand mark: a body held on a line to the point it started from. */
export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <span className="logo">
      <svg viewBox="0 0 28 28" width="26" height="26" aria-hidden="true">
        <circle cx="11" cy="17" r="8" fill="none" stroke="currentColor" strokeWidth="2.4" />
        <path d="M16.7 11.3 22 6" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
        <circle cx="23.2" cy="4.8" r="2.6" fill="currentColor" />
      </svg>
      {!compact && <span className="logo-word">Tether</span>}
    </span>
  )
}

/** Status is never colour alone: each state has its own shape and word. */
export function StatusMark({ status, word = false, size = 12 }: { status: Status; word?: boolean; size?: number }) {
  const shape =
    status === 'steady' ? (
      <circle cx="8" cy="8" r="6" />
    ) : status === 'drifting' ? (
      <path d="M8 1.6 15 14H1Z" />
    ) : (
      <path d="M8 0.8 15.2 8 8 15.2 0.8 8Z" />
    )
  return (
    <span className={`status status-${status}`}>
      <svg viewBox="0 0 16 16" width={size} height={size} aria-hidden="true" fill="currentColor">
        {shape}
      </svg>
      {word ? <span>{STATUS_WORD[status]}</span> : <span className="sr-only">{STATUS_WORD[status]}</span>}
    </span>
  )
}

export function ScoreRing({ score, status }: { score: number; status: Status }) {
  const r = 104
  const c = 2 * Math.PI * r
  return (
    <div className={`ring status-${status}`} role="img" aria-label={`Tether score ${score} out of 100. ${STATUS_WORD[status]}.`}>
      <svg viewBox="0 0 240 240" aria-hidden="true">
        <circle cx="120" cy="120" r={r} className="ring-track" />
        <circle
          cx="120"
          cy="120"
          r={r}
          className="ring-value"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - score / 100)}
          transform="rotate(-90 120 120)"
        />
      </svg>
      <div className="ring-center" aria-hidden="true">
        <span className="ring-score">{score}</span>
        <StatusMark status={status} word />
      </div>
    </div>
  )
}

export function Segmented<T extends string | number>({
  label,
  options,
  value,
  onChange,
}: {
  label: string
  options: { value: T; label: string }[]
  value: T
  onChange: (v: T) => void
}) {
  return (
    <div className="segmented" role="group" aria-label={label}>
      {options.map((o) => (
        <button key={o.value} type="button" aria-pressed={o.value === value} onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function Section({ title, aside, children }: { title: string; aside?: ReactNode; children: ReactNode }) {
  return (
    <section className="section">
      <div className="section-head">
        <h2>{title}</h2>
        {aside}
      </div>
      {children}
    </section>
  )
}
