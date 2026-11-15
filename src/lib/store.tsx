import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { assess, plan, type Assessment, type Plan } from './engine'
import { DEFAULT_BASELINE } from './indicators'
import { MISSION_DAY, getMission } from './missions'
import { seedEntries } from './seed'
import type { Baseline, Entry, IndicatorId, Mission, Values } from './types'

const KEY = 'tether.v1'

interface Saved {
  missionId: string
  today: Values | null
}

interface Store {
  mission: Mission
  setMission: (id: string) => void
  day: number
  entries: Entry[]
  baseline: Record<IndicatorId, Baseline>
  today: Values | null
  saveToday: (v: Values) => void
  reset: () => void
  assessment: Assessment
  plan: Plan
}

const Ctx = createContext<Store | null>(null)

function load(): Saved {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return { missionId: 'transit', today: null, ...JSON.parse(raw) }
  } catch {
    // Storage is unavailable or corrupt: fall back to the demo defaults.
  }
  return { missionId: 'transit', today: null }
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [saved, setSaved] = useState<Saved>(load)
  const history = useMemo(() => seedEntries(), [])

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(saved))
    } catch {
      // Nothing to do: the app still works for this session.
    }
  }, [saved])

  const entries = useMemo(
    () => (saved.today ? [...history, { day: MISSION_DAY, values: saved.today }] : history),
    [history, saved.today],
  )
  const mission = getMission(saved.missionId)
  const assessment = useMemo(() => assess(entries, DEFAULT_BASELINE), [entries])
  const thePlan = useMemo(() => plan(assessment, mission), [assessment, mission])

  const setMission = useCallback((id: string) => setSaved((s) => ({ ...s, missionId: id })), [])
  const saveToday = useCallback((v: Values) => setSaved((s) => ({ ...s, today: v })), [])
  const reset = useCallback(() => setSaved({ missionId: 'transit', today: null }), [])

  const value: Store = {
    mission,
    setMission,
    day: MISSION_DAY,
    entries,
    baseline: DEFAULT_BASELINE,
    today: saved.today,
    saveToday,
    reset,
    assessment,
    plan: thePlan,
  }
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useStore(): Store {
  const s = useContext(Ctx)
  if (!s) throw new Error('useStore must be used inside StoreProvider')
  return s
}
