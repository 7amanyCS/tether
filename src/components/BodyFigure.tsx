import { SYSTEMS } from '../lib/indicators'
import { STATUS_WORD, type SystemState } from '../lib/engine'
import type { SystemId } from '../lib/types'

interface Props {
  systems: SystemState[]
  selected: SystemId
  onSelect: (id: SystemId) => void
}

export function BodyFigure({ systems, selected, onSelect }: Props) {
  return (
    <div className="figure">
      <svg viewBox="0 0 200 400" aria-hidden="true">
        <g className="figure-body">
          <circle cx="100" cy="34" r="22" />
          <path d="M72 68h56q14 0 14 14l-8 110q-1 10-12 10H78q-11 0-12-10L58 82q0-14 14-14Z" />
          <path d="M46 86 35 196M154 86l11 110" className="figure-limb figure-arm" />
          <path d="M84 216 80 372M116 216l4 156" className="figure-limb figure-leg" />
        </g>
      </svg>
      {SYSTEMS.map((s) => {
        const state = systems.find((x) => x.id === s.id)!
        return (
          <button
            key={s.id}
            type="button"
            className={`spot status-${state.status}`}
            style={{ left: `${s.spot.x}%`, top: `${s.spot.y}%` }}
            aria-pressed={selected === s.id}
            aria-label={`${s.name}: ${STATUS_WORD[state.status]}`}
            onClick={() => onSelect(s.id)}
          >
            <span className="spot-dot" />
          </button>
        )
      })}
    </div>
  )
}
