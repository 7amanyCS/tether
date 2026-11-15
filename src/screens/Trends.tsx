import { useState } from 'react'
import { TrendChart } from '../components/TrendChart'
import { Segmented, StatusMark } from '../components/bits'
import { bandFor, series } from '../lib/engine'
import { fmt } from '../lib/indicators'
import { useStore } from '../lib/store'

export const RANGES = [
  { value: 14, label: '14 days' },
  { value: 30, label: '30 days' },
  { value: 90, label: '90 days' },
]

export function Trends() {
  const { assessment: a, entries, baseline, mission } = useStore()
  const [range, setRange] = useState(30)

  return (
    <div>
      <header className="page-head page-head-row">
        <div>
          <h1>Trends</h1>
          <p>The shaded band is your own normal range, set before launch.</p>
        </div>
        <Segmented label="Time range" options={RANGES} value={range} onChange={setRange} />
      </header>

      <div className="trend-grid">
        {a.readings.map((r) => (
          <a className="trend" key={r.id} href={`#/i/${r.id}`}>
            <div className="trend-head">
              <h2>{r.def.name}</h2>
              <StatusMark status={r.status} />
            </div>
            <p className="trend-value">
              <span className="num">{fmt(r.id, r.latest)}</span>
              <span className="unit">{r.def.unit}</span>
            </p>
            <TrendChart
              points={series(entries, r.id, range)}
              base={baseline[r.id]}
              band={bandFor(r.id, baseline[r.id])}
              status={r.status}
              decimals={r.def.decimals}
              dayLabel={mission.dayLabel}
              height={130}
              label={`${r.def.name} over the last ${range} days`}
            />
          </a>
        ))}
      </div>
    </div>
  )
}
