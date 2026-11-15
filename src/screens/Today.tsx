import { Check } from 'lucide-react'
import { PlanDetail, ReadingRows, summaryOf } from '../components/Readings'
import { Disclosure, ScoreRing, StatusMark } from '../components/bits'
import { streak } from '../lib/engine'
import { SYSTEMS } from '../lib/indicators'
import { useStore } from '../lib/store'

export function Today() {
  const { assessment: a, plan, today, day, mission, entries, crew } = useStore()
  const run = streak(entries)

  if (!a.readings.length) {
    return (
      <div className="today today-empty">
        <div className="today-main">
          <div className="ring ring-empty" aria-hidden="true">
            <svg viewBox="0 0 240 240">
              <circle cx="120" cy="120" r="106" className="ring-track" />
            </svg>
            <div className="ring-center">
              <span className="ring-score">–</span>
            </div>
          </div>
          <div className="headline">
            <h1>Welcome aboard, {crew.name.split(' ')[0]}</h1>
            <p>
              Your first check-in sets today’s score. Each one after that shows how far you have moved from your
              baseline.
            </p>
          </div>
          <div className="checkin-due">
            <a className="btn btn-primary" href="#/checkin">
              Start your first check-in
            </a>
            <p>
              About a minute · {mission.name}, {mission.dayLabel.toLowerCase()} {day}
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="today">
      <div className="today-main">
        <ScoreRing score={a.score} status={a.status} />

        <div className="headline">
          <h1>{plan.title}</h1>
          <p>{plan.reason}</p>
        </div>

        {today ? (
          <p className="checkin-done">
            <Check size={18} aria-hidden="true" />
            <span>
              Checked in · {run}-day streak · <a href="#/checkin">Edit</a>
            </span>
          </p>
        ) : (
          <div className="checkin-due">
            <a className="btn btn-primary" href="#/checkin">
              Start today’s check-in
            </a>
            <p>
              About a minute · {run}-day streak · showing {mission.dayLabel.toLowerCase()} {a.day}
            </p>
          </div>
        )}

        {plan.tier > 0 && (
          <Disclosure
            key={plan.tier}
            className="disc-plan"
            defaultOpen={plan.tier === 3}
            summary={
              <>
                <span>What to do</span>
                <span className="disc-aside">{plan.steps.length} steps</span>
              </>
            }
          >
            <PlanDetail plan={plan} />
          </Disclosure>
        )}
      </div>

      <div className="today-side">
        <h2 className="list-title">
          {mission.dayLabel} {day}
        </h2>
        {SYSTEMS.map((s) => {
          const state = a.systems.find((x) => x.id === s.id)!
          return (
            <Disclosure
              key={s.id}
              summary={
                <>
                  <StatusMark status={state.status} />
                  <span>{s.name}</span>
                  <span className="disc-aside num">{summaryOf(state)}</span>
                </>
              }
            >
              <ReadingRows readings={state.readings} />
            </Disclosure>
          )
        })}
      </div>
    </div>
  )
}
