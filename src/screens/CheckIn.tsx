import { ArrowLeft, Minus, Plus } from 'lucide-react'
import { useState } from 'react'
import { MOOD_WORDS, getIndicator } from '../lib/indicators'
import { go } from '../lib/router'
import { Disclosure } from '../components/bits'
import { useSensor } from '../lib/sensor'
import { useStore } from '../lib/store'
import type { IndicatorId } from '../lib/types'

interface Step {
  title: string
  ids: IndicatorId[]
}

const STEPS: Step[] = [
  { title: 'How long did you sleep?', ids: ['sleep'] },
  { title: 'How has your mood been today?', ids: ['mood'] },
  { title: 'What is your resting heart rate?', ids: ['rhr'] },
  { title: 'What is your blood pressure?', ids: ['sys', 'dia'] },
  { title: 'What is your temperature?', ids: ['temp'] },
  { title: 'What is your fasting blood glucose?', ids: ['glucose'] },
  { title: 'What is your body mass?', ids: ['weight'] },
  { title: 'How long did you exercise?', ids: ['exercise'] },
]

type Draft = Record<IndicatorId, string>

function problem(id: IndicatorId, raw: string): string | null {
  const def = getIndicator(id)
  const v = Number(raw.replace(',', '.'))
  if (raw.trim() === '' || Number.isNaN(v)) return `Enter ${def.name.toLowerCase()} as a number.`
  if (v < def.min || v > def.max)
    return `${def.name} should be between ${def.min} and ${def.max} ${def.unit}. Check the reading and enter it again.`
  return null
}

function NumberField({ id, value, onChange, error }: { id: IndicatorId; value: string; onChange: (v: string) => void; error: string | null }) {
  const def = getIndicator(id)
  const bump = (dir: 1 | -1) => {
    const n = Number(value.replace(',', '.'))
    const next = Math.min(def.max, Math.max(def.min, (Number.isNaN(n) ? def.min : n) + dir * def.step))
    onChange(next.toFixed(def.decimals))
  }
  return (
    <div className="field">
      <label htmlFor={`f-${id}`}>{def.name}</label>
      <div className="stepper">
        <button type="button" onClick={() => bump(-1)} aria-label={`Lower ${def.name.toLowerCase()}`}>
          <Minus size={22} aria-hidden="true" />
        </button>
        <div className="stepper-value">
          <input
            id={`f-${id}`}
            inputMode="decimal"
            autoComplete="off"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? `e-${id}` : undefined}
          />
          <span className="unit">{def.unit}</span>
        </div>
        <button type="button" onClick={() => bump(1)} aria-label={`Raise ${def.name.toLowerCase()}`}>
          <Plus size={22} aria-hidden="true" />
        </button>
      </div>
      {error && (
        <p className="field-error" id={`e-${id}`} role="alert">
          {error}
        </p>
      )}
    </div>
  )
}

export function CheckIn() {
  const { entries, baseline, today, saveToday, mission, day } = useStore()
  const sensor = useSensor()
  const [draft, setDraft] = useState<Draft>(() => {
    const from = today ?? entries[entries.length - 1]?.values ?? {}
    const d = {} as Draft
    for (const s of STEPS) for (const id of s.ids) d[id] = (from[id] ?? baseline[id].mean).toFixed(getIndicator(id).decimals)
    return d
  })
  const [i, setI] = useState(0)
  const [dir, setDir] = useState<'fwd' | 'back'>('fwd')
  const [errors, setErrors] = useState<Partial<Record<IndicatorId, string>>>({})
  const step = STEPS[i]
  const def = getIndicator(step.ids[0])
  const set = (id: IndicatorId, v: string) => {
    setDraft((d) => ({ ...d, [id]: v }))
    setErrors((e) => ({ ...e, [id]: undefined }))
  }

  const next = () => {
    const found: Partial<Record<IndicatorId, string>> = {}
    for (const id of step.ids) {
      const p = problem(id, draft[id])
      if (p) found[id] = p
    }
    setErrors(found)
    if (Object.keys(found).length) return
    if (i < STEPS.length - 1) {
      setDir('fwd')
      setI(i + 1)
      return
    }
    const values = Object.fromEntries(
      Object.entries(draft).map(([id, raw]) => [id, Number(raw.replace(',', '.'))]),
    )
    saveToday(values)
    go('today')
  }

  return (
    <form
      className="checkin"
      onSubmit={(e) => {
        e.preventDefault()
        next()
      }}
    >
      <div className="checkin-top">
        {i === 0 ? (
          <a className="btn-quiet" href="#/today">
            <ArrowLeft size={18} aria-hidden="true" /> Cancel
          </a>
        ) : (
          <button type="button" className="btn-quiet" onClick={() => {
              setDir('back')
              setI(i - 1)
            }}>
            <ArrowLeft size={18} aria-hidden="true" /> Back
          </button>
        )}
        <span className="checkin-count">
          {mission.dayLabel} {day} · {i + 1} of {STEPS.length}
        </span>
      </div>
      <div className="progress" role="progressbar" aria-valuemin={1} aria-valuemax={STEPS.length} aria-valuenow={i + 1} aria-label="Check-in progress">
        <span style={{ width: `${((i + 1) / STEPS.length) * 100}%` }} />
      </div>

      <div className={`step step-${dir}`} key={i}>
        <h1>{step.title}</h1>

        {step.ids[0] === 'mood' ? (
          <fieldset className="mood">
            <legend className="sr-only">Mood</legend>
            {[1, 2, 3, 4, 5].map((n) => (
              <label key={n}>
                <input type="radio" name="mood" checked={Number(draft.mood) === n} onChange={() => set('mood', String(n))} />
                <span className="num">{n}</span>
                <span>{MOOD_WORDS[n]}</span>
              </label>
            ))}
          </fieldset>
        ) : (
          <div className="fields">
            {step.ids.map((id) => (
              <NumberField key={id} id={id} value={draft[id]} onChange={(v) => set(id, v)} error={errors[id] ?? null} />
            ))}
          </div>
        )}

        {step.ids[0] === 'rhr' && (
          <div className="sensor-inline">
            {sensor.state === 'live' && sensor.bpm !== null ? (
              <>
                <p>
                  <span className="live-dot" aria-hidden="true" />
                  {sensor.name}: <strong className="num">{sensor.bpm}</strong> bpm
                </p>
                <button type="button" className="btn btn-secondary" onClick={() => set('rhr', String(sensor.bpm))}>
                  Use this reading
                </button>
              </>
            ) : (
              <p>
                No sensor connected. Type your reading, or <a href="#/mission">connect a wearable</a> to fill it in.
              </p>
            )}
          </div>
        )}

        <Disclosure className="disc-hint" summary={<span>How do I measure this?</span>}>
          <div className="hint">
            <p>{def.measure}</p>
            <h2>Why it matters</h2>
            <p>{def.why}</p>
          </div>
        </Disclosure>
      </div>

      <div className="checkin-actions">
        <button type="submit" className="btn btn-primary">
          {i < STEPS.length - 1 ? 'Next' : 'Save check-in'}
        </button>
      </div>
    </form>
  )
}
