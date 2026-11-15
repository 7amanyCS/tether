import { ArrowLeft } from 'lucide-react'
import { useState } from 'react'
import { Logo } from '../components/bits'
import { DEFAULT_BASELINE, INDICATORS, WEIGHT_SWING } from '../lib/indicators'
import { MISSIONS } from '../lib/missions'
import { go } from '../lib/router'
import { useSensor } from '../lib/sensor'
import { isoDate, useStore } from '../lib/store'
import type { Baseline, IndicatorId, Mission, ReadingSource } from '../lib/types'

const STEPS = ['You', 'Mission', 'Baseline', 'Readings'] as const

const SOURCES: { id: ReadingSource; name: string; facts: string }[] = [
  { id: 'band', name: 'Tether band', facts: 'Demo band. Sends simulated heart rate so you can see how a wearable fits in.' },
  { id: 'bluetooth', name: 'Bluetooth heart-rate band', facts: 'Any strap or watch that broadcasts heart rate. Needs Chrome or Edge.' },
  { id: 'manual', name: 'Enter readings myself', facts: 'Type every reading at check-in. You can connect a band later.' },
]

export function Welcome() {
  const { startDemo, createProfile, profile, leave } = useStore()
  const sensor = useSensor()
  const [step, setStep] = useState(-1)
  const [dir, setDir] = useState<'fwd' | 'back'>('fwd')
  const [name, setName] = useState('')
  const [role, setRole] = useState('')
  const [missionId, setMissionId] = useState<Mission['id']>('transit')
  const [dayText, setDayText] = useState('1')
  const [base, setBase] = useState<Record<IndicatorId, string>>(() => {
    const b = {} as Record<IndicatorId, string>
    for (const d of INDICATORS) b[d.id] = DEFAULT_BASELINE[d.id].mean.toFixed(d.decimals)
    return b
  })
  const [source, setSource] = useState<ReadingSource>('band')
  const [error, setError] = useState<string | null>(null)

  const move = (to: number) => {
    setError(null)
    setDir(to > step ? 'fwd' : 'back')
    setStep(to)
  }

  function check(): string | null {
    if (step === 0 && !name.trim()) return 'Enter your name to continue.'
    if (step === 1) {
      const d = Number(dayText)
      if (!Number.isInteger(d) || d < 1 || d > 1500) return 'Enter the mission day as a whole number from 1 to 1500.'
    }
    if (step === 2) {
      for (const d of INDICATORS) {
        const v = Number(base[d.id].replace(',', '.'))
        if (base[d.id].trim() === '' || Number.isNaN(v) || v < d.min || v > d.max)
          return `${d.name} should be between ${d.min} and ${d.max} ${d.unit}.`
      }
    }
    return null
  }

  function next() {
    const problem = check()
    if (problem) {
      setError(problem)
      return
    }
    if (step < STEPS.length - 1) {
      move(step + 1)
      return
    }
    const baseline = {} as Record<IndicatorId, Baseline>
    for (const d of INDICATORS) {
      const mean = Number(base[d.id].replace(',', '.'))
      baseline[d.id] = { mean, sd: d.id === 'weight' ? mean * WEIGHT_SWING : DEFAULT_BASELINE[d.id].sd }
    }
    createProfile(
      { name: name.trim(), role: role.trim() || 'Crew member', missionId, startDay: Number(dayText), startedOn: isoDate(), baseline, source, entries: [] },
    )
    // Started from this click, so the browser allows the Bluetooth chooser.
    if (source === 'band') sensor.simulate('Tether band (demo)')
    else if (source === 'bluetooth' && sensor.supported) void sensor.connect()
    go('today')
  }

  if (step === -1) {
    return (
      <main className="welcome">
        <div className="welcome-inner screen">
          <Logo />
          <h1>Know when you are drifting.</h1>
          <p>
            A one-minute daily check that compares you with your own pre-flight baseline, and tells you what to do when
            something moves.
          </p>
          <div className="welcome-actions">
            <button type="button" className="btn btn-primary" onClick={() => move(0)}>
              Set up my profile
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                startDemo()
                go('today')
              }}
            >
              Explore a demo crew member
            </button>
          </div>
          {profile && (
            <p className="welcome-saved">
              Saved profile: {profile.name}.{' '}
              <button type="button" className="link" onClick={() => createProfile(profile)}>
                Continue
              </button>{' '}
              ·{' '}
              <button type="button" className="link" onClick={() => leave(true)}>
                Delete it
              </button>
            </p>
          )}
          <p className="welcome-note">The demo opens on day 142 of a Mars transit, with 141 days of simulated readings.</p>
        </div>
      </main>
    )
  }

  return (
    <main className="welcome">
      <form
        className="checkin setup"
        onSubmit={(e) => {
          e.preventDefault()
          next()
        }}
      >
        <div className="checkin-top">
          <button type="button" className="btn-quiet" onClick={() => move(step - 1)}>
            <ArrowLeft size={18} aria-hidden="true" /> Back
          </button>
          <span className="checkin-count">
            {STEPS[step]} · {step + 1} of {STEPS.length}
          </span>
        </div>
        <div className="progress" role="progressbar" aria-valuemin={1} aria-valuemax={STEPS.length} aria-valuenow={step + 1} aria-label="Setup progress">
          <span style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} />
        </div>

        <div className={`step step-${dir}`} key={step}>
          {step === 0 && (
            <>
              <h1>Who is this for?</h1>
              <div className="fields">
                <div className="text-field">
                  <label htmlFor="s-name">Name</label>
                  <input id="s-name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" maxLength={40} autoFocus />
                </div>
                <div className="text-field">
                  <label htmlFor="s-role">Role on the crew (optional)</label>
                  <input id="s-role" value={role} onChange={(e) => setRole(e.target.value)} placeholder="Flight engineer" autoComplete="off" maxLength={40} />
                </div>
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <h1>Where are you?</h1>
              <fieldset className="choices">
                <legend className="sr-only">Mission environment</legend>
                {MISSIONS.map((m) => (
                  <label key={m.id} className="choice">
                    <input type="radio" name="mission" checked={missionId === m.id} onChange={() => setMissionId(m.id)} />
                    <span className="choice-name">{m.name}</span>
                    <span className="choice-facts">
                      {m.gravity} · {m.delayRange}
                    </span>
                  </label>
                ))}
              </fieldset>
              <div className="text-field text-field-short">
                <label htmlFor="s-day">Mission day today</label>
                <input id="s-day" inputMode="numeric" value={dayText} onChange={(e) => setDayText(e.target.value)} autoComplete="off" />
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <h1>What is normal for you?</h1>
              <p className="setup-lede">
                Your pre-flight numbers. Typical values are filled in. Change any you know, and leave the rest.
              </p>
              <ul className="base-list">
                {INDICATORS.map((d) => (
                  <li key={d.id}>
                    <label htmlFor={`b-${d.id}`}>{d.id === 'exercise' ? 'Daily exercise' : d.name}</label>
                    <span className="base-input">
                      <input
                        id={`b-${d.id}`}
                        inputMode="decimal"
                        autoComplete="off"
                        value={base[d.id]}
                        onChange={(e) => setBase((b) => ({ ...b, [d.id]: e.target.value }))}
                      />
                      <span className="unit">{d.unit}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )}

          {step === 3 && (
            <>
              <h1>How will you log readings?</h1>
              <fieldset className="choices choices-stack">
                <legend className="sr-only">Readings source</legend>
                {SOURCES.map((s) => (
                  <label key={s.id} className="choice">
                    <input type="radio" name="source" checked={source === s.id} onChange={() => setSource(s.id)} />
                    <span className="choice-name">{s.name}</span>
                    <span className="choice-facts">{s.facts}</span>
                  </label>
                ))}
              </fieldset>
              {source === 'bluetooth' && !sensor.supported && (
                <p className="note">This browser cannot use Bluetooth, so you will start with manual entry.</p>
              )}
            </>
          )}

          {error && (
            <p className="field-error" role="alert">
              {error}
            </p>
          )}
        </div>

        <div className="checkin-actions">
          <button type="submit" className="btn btn-primary">
            {step < STEPS.length - 1 ? 'Next' : source === 'bluetooth' && sensor.supported ? 'Connect and start' : 'Start'}
          </button>
        </div>
      </form>
    </main>
  )
}
