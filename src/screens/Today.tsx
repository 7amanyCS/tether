import { Check } from 'lucide-react'
import { PlanBlock, ReadingRows } from '../components/Readings'
import { ScoreRing, StatusMark } from '../components/bits'
import { streak } from '../lib/engine'
import { SYSTEMS } from '../lib/indicators'
import { useStore } from '../lib/store'

export function Today() {
  const { assessment: a, plan, today, day, mission, entries } = useStore()
  const run = streak(entries)

  return (
    <div className="today">
      <div className="today-main">
        <header className="page-head">
          <h1>
            {mission.dayLabel} {day}
          </h1>
          <p>N. Haddad, flight engineer · {mission.name}</p>
        </header>

        <ScoreRing score={a.score} status={a.status} />

        {today ? (
          <p className="checkin-done">
            <Check size={18} aria-hidden="true" />
            <span>
              Checked in today · {run}-day streak · <a href="#/checkin">Edit</a>
            </span>
          </p>
        ) : (
          <div className="checkin-due">
            <a className="btn btn-primary" href="#/checkin">
              Start today’s check-in
            </a>
            <p>
              Seven readings, about a minute. Showing {mission.dayLabel.toLowerCase()} {a.day} until you do. {run}-day
              streak.
            </p>
          </div>
        )}

        <PlanBlock plan={plan} />
      </div>

      <div className="today-side">
        {SYSTEMS.map((s) => {
          const state = a.systems.find((x) => x.id === s.id)!
          return (
            <section className="group" key={s.id}>
              <div className="group-head">
                <h2>{s.name}</h2>
                <StatusMark status={state.status} />
              </div>
              <ReadingRows readings={state.readings} />
            </section>
          )
        })}
      </div>
    </div>
  )
}
