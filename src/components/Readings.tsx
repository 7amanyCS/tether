import { ChevronRight } from 'lucide-react'
import { deltaText, worst, type Plan, type Reading, type SystemState } from '../lib/engine'
import { fmt } from '../lib/indicators'
import { StatusMark } from './bits'

const valueOf = (r: Reading) => (r.id === 'mood' ? r.value.toFixed(1) : fmt(r.id, r.value))

/** "5.8 h · 2.3 / 5": a system's numbers on one quiet line. */
export function summaryOf(state: SystemState): string {
  const dia = state.readings.find((r) => r.id === 'dia')
  return state.readings
    .filter((r) => r.id !== 'dia')
    .map((r) => `${valueOf(r)}${r.id === 'sys' && dia ? `/${valueOf(dia)}` : ` ${r.def.unit}`}`)
    .join(' · ')
}

/** One line per thing the crew member thinks of as a measurement (blood pressure is one). */
export function ReadingRows({ readings }: { readings: Reading[] }) {
  const dia = readings.find((r) => r.id === 'dia')
  return (
    <ul className="rows">
      {readings
        .filter((r) => r.id !== 'dia')
        .map((r) => {
          const bp = r.id === 'sys' && dia ? dia : null
          const status = bp ? worst(r.status, bp.status) : r.status
          const flagged = bp && bp.status !== 'steady' && r.status === 'steady' ? bp : r
          return (
            <li key={r.id}>
              <a className="row" href={`#/i/${r.id}`}>
                <StatusMark status={status} />
                <span className="row-name">
                  <span>{bp ? 'Blood pressure' : r.def.name}</span>
                  <span className="row-sub">{deltaText(flagged)}</span>
                </span>
                <span className="row-value">
                  <span className="num">
                    {valueOf(r)}
                    {bp ? `/${valueOf(bp)}` : ''}
                  </span>
                  <span className="unit">{r.def.unit}</span>
                </span>
                <ChevronRight size={18} aria-hidden="true" className="row-chev" />
              </a>
            </li>
          )
        })}
    </ul>
  )
}

const TIER_WHO = ['No one needs to act', 'You', 'You and your crew medical officer', 'You, your crew medical officer, and the ground']

export function PlanDetail({ plan }: { plan: Plan }) {
  return (
    <div className="plan-detail">
      {plan.steps.length > 0 && (
        <ol className="steps">
          {plan.steps.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ol>
      )}
      <dl className="plan-meta">
        <div>
          <dt>Who acts</dt>
          <dd>{TIER_WHO[plan.tier]}</dd>
        </div>
        {plan.link && (
          <div>
            <dt>Ground</dt>
            <dd>{plan.link}</dd>
          </div>
        )}
      </dl>
    </div>
  )
}
