import { useState } from 'react'
import { BodyFigure } from '../components/BodyFigure'
import { ReadingRows } from '../components/Readings'
import { StatusMark } from '../components/bits'
import { stepsFor } from '../lib/engine'
import { SYSTEMS } from '../lib/indicators'
import { CAREER_LIMIT_MSV, cumulativeDose } from '../lib/missions'
import { getSource } from '../lib/sources'
import { useStore } from '../lib/store'
import type { SystemId } from '../lib/types'

export function Body() {
  const { assessment: a, mission, day } = useStore()
  const first = [...a.systems].sort((x, y) => x.score - y.score)[0].id
  const [selected, setSelected] = useState<SystemId>(first)
  const def = SYSTEMS.find((s) => s.id === selected)!
  const state = a.systems.find((s) => s.id === selected)!
  const flagged = state.readings.filter((r) => r.status !== 'steady')
  const steps = [...new Set(flagged.flatMap(stepsFor))]
  const dose = cumulativeDose(mission, day)
  const src = getSource(mission.doseSource)

  return (
    <div className="body-screen">
      <header className="page-head">
        <h1>Body</h1>
        <p>Select a marker to see how it is holding up.</p>
      </header>

      <div className="body-layout">
        <div className="body-figure">
          <BodyFigure systems={a.systems} selected={selected} onSelect={setSelected} />
          <ul className="system-list">
            {SYSTEMS.map((s) => {
              const st = a.systems.find((x) => x.id === s.id)!
              return (
                <li key={s.id}>
                  <button type="button" aria-pressed={selected === s.id} onClick={() => setSelected(s.id)}>
                    <StatusMark status={st.status} />
                    <span>{s.name}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        </div>

        <div className="body-panel" aria-live="polite" key={selected}>
          <div className="group-head">
            <h2 className="panel-title">{def.name}</h2>
            <StatusMark status={state.status} word />
          </div>
          <p className="lede">{def.about}</p>
          <p className="hazard">
            <span>Spaceflight hazard</span> {def.hazard}
          </p>
          <ReadingRows readings={state.readings} />
          {steps.length > 0 && (
            <>
              <h3>What to do</h3>
              <ol className="steps">
                {steps.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ol>
            </>
          )}

          <div className="dose">
            <div className="group-head">
              <h3>Radiation dose</h3>
              <span className="row-sub">Whole body · estimated</span>
            </div>
            <p className="dose-value">
              <span className="num">{dose}</span>
              <span className="unit">of {CAREER_LIMIT_MSV} mSv career limit</span>
            </p>
            <div className="bar" role="img" aria-label={`${Math.round((dose / CAREER_LIMIT_MSV) * 100)} percent of career limit`}>
              <span style={{ width: `${Math.min(100, (dose / CAREER_LIMIT_MSV) * 100)}%` }} />
            </div>
            <p className="row-sub">
              About {mission.doseRate} mSv a day on this mission. {mission.priorDose > 0 ? `Includes ${mission.priorDose} mSv from the outbound transit. ` : ''}
              <a href={src.url} target="_blank" rel="noreferrer">
                Source
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
