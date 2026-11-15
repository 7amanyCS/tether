import { Bluetooth } from 'lucide-react'
import { INDICATORS, fmt } from '../lib/indicators'
import { MISSIONS } from '../lib/missions'
import { useSensor } from '../lib/sensor'
import { SOURCES } from '../lib/sources'
import { useStore } from '../lib/store'
import type { ReactNode } from 'react'
import { Disclosure } from '../components/bits'

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="section">
      <h2>{title}</h2>
      {children}
    </section>
  )
}

export function Mission() {
  const { mission, setMission, baseline, reset } = useStore()
  const sensor = useSensor()

  return (
    <div className="mission">
      <header className="page-head">
        <h1>Mission</h1>
        <p>Where you are changes how far away help is and how much radiation you take each day.</p>
      </header>

      <Section title="Environment">
        <fieldset className="choices">
          <legend className="sr-only">Mission environment</legend>
          {MISSIONS.map((m) => (
            <label key={m.id} className="choice">
              <input type="radio" name="mission" checked={mission.id === m.id} onChange={() => setMission(m.id)} />
              <span className="choice-name">{m.name}</span>
              <span className="choice-facts">
                {m.gravity} · {m.delayRange} · {m.doseRate} mSv a day
              </span>
            </label>
          ))}
        </fieldset>
        <p className="note">{mission.note}</p>
      </Section>

      <Section title="Wearable sensor">
        {sensor.state === 'live' ? (
          <div className="sensor">
            <p className="sensor-reading">
              <span className="live-dot" aria-hidden="true" />
              <span className="num">{sensor.bpm ?? '–'}</span>
              <span className="unit">bpm · {sensor.name}</span>
            </p>
            {sensor.simulated && <p className="note">These numbers are generated for the demo, not measured.</p>}
            <button type="button" className="btn btn-secondary" onClick={sensor.disconnect}>
              Disconnect
            </button>
          </div>
        ) : (
          <div className="sensor">
            <p className="note">
              Connect any band, watch, or chest strap that broadcasts heart rate over Bluetooth. Your live reading then
              fills in the resting heart rate step of the check-in.
            </p>
            <div className="btn-row">
              <button type="button" className="btn btn-primary" onClick={sensor.connect} disabled={!sensor.supported || sensor.state === 'connecting'}>
                <Bluetooth size={18} aria-hidden="true" />
                {sensor.state === 'connecting' ? 'Looking for sensors…' : 'Connect a sensor'}
              </button>
              <button type="button" className="btn btn-secondary" onClick={sensor.simulate}>
                Use a simulated sensor
              </button>
            </div>
            {!sensor.supported && (
              <p className="note">This browser cannot use Bluetooth. Open Tether in Chrome or Edge to connect a real sensor.</p>
            )}
            {sensor.error && (
              <p className="field-error" role="alert">
                {sensor.error}
              </p>
            )}
          </div>
        )}
      </Section>

      <div className="disc-group">
        <Disclosure summary={<span>Your baseline</span>}>
          <div className="disc-text">
            <p className="note">Measured on the ground before launch. Every reading is judged against these, not against an average person.</p>
        <table className="table">
          <thead>
            <tr>
              <th scope="col">Indicator</th>
              <th scope="col">Baseline</th>
              <th scope="col">Normal swing</th>
            </tr>
          </thead>
          <tbody>
            {INDICATORS.map((d) => (
              <tr key={d.id}>
                <th scope="row">{d.name}</th>
                <td className="num">
                  {fmt(d.id, baseline[d.id].mean)} <span className="unit">{d.unit}</span>
                </td>
                <td className="num">± {baseline[d.id].sd}</td>
              </tr>
            ))}
          </tbody>
        </table>
          </div>
        </Disclosure>
        <Disclosure summary={<span>Evidence</span>}>
          <div className="disc-text">
        <ul className="sources">
          {SOURCES.map((s) => (
            <li key={s.id}>
              {s.finding}{' '}
              <a href={s.url} target="_blank" rel="noreferrer">
                {s.cite}
              </a>
            </li>
          ))}
        </ul>
            <p className="note">
              Tether is a hackathon prototype built on simulated data. Its thresholds illustrate the approach and are not
              medical advice.
            </p>
          </div>
        </Disclosure>
        <Disclosure summary={<span>Demo data</span>}>
          <div className="disc-text">
            <p className="note">Clear today’s check-in and return to Mars transit.</p>
            <button type="button" className="btn btn-secondary" onClick={reset}>
              Reset the demo
            </button>
          </div>
        </Disclosure>
      </div>
    </div>
  )
}
