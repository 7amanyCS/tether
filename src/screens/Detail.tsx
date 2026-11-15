import { ArrowLeft } from 'lucide-react'
import { useState } from 'react'
import { TrendChart } from '../components/TrendChart'
import { Segmented, StatusMark } from '../components/bits'
import { bandFor, deltaText, series } from '../lib/engine'
import { fmt, systemOf } from '../lib/indicators'
import { getSource } from '../lib/sources'
import { useStore } from '../lib/store'
import type { IndicatorId } from '../lib/types'
import { RANGES } from './Trends'

export function Detail({ id }: { id: IndicatorId }) {
  const { assessment: a, entries, baseline, mission } = useStore()
  const [range, setRange] = useState(30)
  const r = a.readings.find((x) => x.id === id)
  if (!r) {
    return (
      <div className="page-head">
        <h1>No readings yet</h1>
        <p>
          This indicator has not been logged. <a href="#/checkin">Start a check-in</a> to record it.
        </p>
      </div>
    )
  }
  const base = baseline[id]
  const system = systemOf(id)
  const guidance = [
    { title: r.def.concern === 'low' ? 'What to do when it drops' : 'If it runs low', steps: r.def.low, on: r.status !== 'steady' && r.direction === 'low' },
    { title: 'If it runs high', steps: r.def.high, on: r.status !== 'steady' && r.direction === 'high' },
  ].filter((g) => g.steps.length)

  return (
    <article className="detail">
      <a className="btn-quiet" href="#/today">
        <ArrowLeft size={18} aria-hidden="true" /> Today
      </a>
      <header className="page-head page-head-row">
        <div>
          <h1>{r.def.name}</h1>
          <p>
            {system.name} · {system.hazard}
          </p>
        </div>
        <StatusMark status={r.status} word size={14} />
      </header>

      <div className="detail-stats">
        <div>
          <span className="stat-label">{r.def.basis === 'avg3' ? '3-day average' : 'Latest reading'}</span>
          <p className="stat">
            <span className="num">{id === 'mood' ? r.value.toFixed(1) : fmt(id, r.value)}</span>
            <span className="unit">{r.def.unit}</span>
          </p>
        </div>
        <div>
          <span className="stat-label">Your baseline</span>
          <p className="stat">
            <span className="num">{fmt(id, base.mean)}</span>
            <span className="unit">{r.def.unit}</span>
          </p>
        </div>
        <div>
          <span className="stat-label">Difference</span>
          <p className="stat stat-text">{deltaText(r).replace(' vs baseline', '')}</p>
        </div>
      </div>

      <div className="detail-chart">
        <Segmented label="Time range" options={RANGES} value={range} onChange={setRange} />
        <TrendChart
          points={series(entries, id, range)}
          base={base}
          band={bandFor(id, base)}
          status={r.status}
          decimals={r.def.decimals}
          dayLabel={mission.dayLabel}
          height={220}
          label={`${r.def.name} over the last ${range} days`}
        />
      </div>

      <div className="prose">
        <h2>Why it matters</h2>
        <p>{r.def.why}</p>
        <h2>How to measure</h2>
        <p>{r.def.measure}</p>
        {guidance.map((g) => (
          <div key={g.title} className={g.on ? 'guidance guidance-on' : 'guidance'}>
            <h2>{g.on ? 'What to do now' : g.title}</h2>
            <ol className="steps">
              {g.steps.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ol>
          </div>
        ))}
        <h2>Evidence</h2>
        <ul className="sources">
          {r.def.sources.map((s) => {
            const src = getSource(s)
            return (
              <li key={s}>
                {src.finding}{' '}
                <a href={src.url} target="_blank" rel="noreferrer">
                  {src.cite}
                </a>
              </li>
            )
          })}
        </ul>
      </div>
    </article>
  )
}
