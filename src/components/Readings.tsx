import { ChevronRight } from 'lucide-react'
import { deltaText, worst, type Plan, type Reading } from '../lib/engine'
import { MOOD_WORDS, fmt } from '../lib/indicators'
import { StatusMark } from './bits'

/** One line per thing the crew member thinks of as a measurement (blood pressure is one). */
export function ReadingRows({ readings }: { readings: Reading[] }) {
  const sys = readings.find((r) => r.id === 'sys')
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
                <span className="row-name">
                  <span>{bp ? 'Blood pressure' : r.def.name}</span>
                  <span className="row-sub">
                    {r.def.basis === 'avg3' ? '3-day average' : 'Latest reading'}
                    {r.id === 'mood' ? ` · ${MOOD_WORDS[Math.round(r.value)]}` : ''}
                  </span>
                </span>
                <span className="row-value">
                  <span className="num">
                    {r.id === 'mood' ? r.value.toFixed(1) : fmt(r.id, r.value)}
                    {bp && sys ? `/${fmt('dia', bp.value)}` : ''}
                  </span>
                  <span className="unit">{r.def.unit}</span>
                </span>
                <span className="row-state">
                  <StatusMark status={status} word />
                  <span className="row-sub">{deltaText(flagged)}</span>
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

export function PlanBlock({ plan }: { plan: Plan }) {
  return (
    <div className={`plan status-${plan.status}`}>
      <div className="plan-head">
        <StatusMark status={plan.status} size={16} />
        <h2>{plan.title}</h2>
      </div>
      <p className="plan-reason">{plan.reason}</p>
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
