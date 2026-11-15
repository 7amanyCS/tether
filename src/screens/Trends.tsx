import { useState } from 'react'
import { TrendChart } from '../components/TrendChart'
import { Segmented, StatusMark } from '../components/bits'
import { bandFor, deltaText, series } from '../lib/engine'
import { fmt } from '../lib/indicators'
import { RANGES } from '../lib/ranges'
import { useStore } from '../lib/store'

export function Trends() {
  const { assessment: a, entries, baseline, mission } = useStore()
  const [range, setRange] = useState(30)

  return (
    <div>
      <header className="page-head page-head-row">
        <div>
          <h1>Trends</h1>
          <p>The shaded band is your own normal range.</p>
        </div>
        <Segmented label="Time range" options={RANGES} value={range} onChange={setRange} />
      </header>

      <div className="trend-grid">
        {a.readings.map((r) => (
          <a className="trend" key={r.id} href={`#/i/${r.id}`}>
            <div className="trend-head">
              <span className="trend-name">
                <StatusMark status={r.status} />
                {r.def.name}
              </span>
              <span className="trend-value">
                <span className="num">{fmt(r.id, r.latest)}</span>
                <span className="unit">{r.def.unit}</span>
              </span>
            </div>
            <TrendChart
              points={series(entries, r.id, range)}
              base={baseline[r.id]}
              band={bandFor(r.id, baseline[r.id])}
              status={r.status}
              decimals={r.def.decimals}
              dayLabel={mission.dayLabel}
              height={72}
              compact
              label={`${r.def.name} over the last ${range} days`}
            />
            <span className="row-sub">{deltaText(r)}</span>
          </a>
        ))}
      </div>
    </div>
  )
}
