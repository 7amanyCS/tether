import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { assess, plan, type Assessment, type Plan } from './engine'
import { DEFAULT_BASELINE } from './indicators'
import { MISSION_DAY, getMission } from './missions'
import { seedEntries } from './seed'
import type { Baseline, Entry, IndicatorId, Mission, Profile, Values } from './types'

const KEY = 'tether.v2'

interface Saved {
  /** null until the visitor chooses the demo or sets up a profile. */
  mode: 'demo' | 'own' | null
  missionId: string
  /** Today's check-in for the demo crew member. */
  today: Values | null
  profile: Profile | null
}

const EMPTY: Saved = { mode: null, missionId: 'transit', today: null, profile: null }

interface Store {
  mode: Saved['mode']
  crew: { name: string; role: string }
  profile: Profile | null
  mission: Mission
  setMission: (id: string) => void
  day: number
  entries: Entry[]
  baseline: Record<IndicatorId, Baseline>
  today: Values | null
  saveToday: (v: Values) => void
  startDemo: () => void
  createProfile: (p: Profile) => void
  /** Back to the welcome screen. Keeps a saved profile unless `erase` is set. */
  leave: (erase?: boolean) => void
  resetDemo: () => void
  assessment: Assessment
  plan: Plan
}

const Ctx = createContext<Store | null>(null)

function load(): Saved {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return { ...EMPTY, ...JSON.parse(raw) }
  } catch {
    // Storage is unavailable or corrupt: start from the welcome screen.
  }
  return EMPTY
}

export function isoDate(d = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function daysSince(iso: string): number {
  const [y, m, d] = iso.split('-').map(Number)
  const then = new Date(y, m - 1, d).getTime()
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  return Math.max(0, Math.round((today - then) / 86400000))
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

  const own = saved.mode === 'own' && saved.profile ? saved.profile : null
  const day = own ? own.startDay + daysSince(own.startedOn) : MISSION_DAY
  const baseline = own ? own.baseline : DEFAULT_BASELINE

  const entries = useMemo(() => {
    if (own) return own.entries
    return saved.today ? [...history, { day: MISSION_DAY, values: saved.today }] : history
  }, [own, history, saved.today])

  const today = own ? (own.entries.find((e) => e.day === day)?.values ?? null) : saved.today
  const mission = getMission(saved.missionId)
  const assessment = useMemo(() => assess(entries, baseline), [entries, baseline])
  const thePlan = useMemo(() => plan(assessment, mission), [assessment, mission])

  const setMission = useCallback(
    (id: string) =>
      setSaved((s) => ({
        ...s,
        missionId: id,
        profile: s.mode === 'own' && s.profile ? { ...s.profile, missionId: getMission(id).id } : s.profile,
      })),
    [],
  )

  const saveToday = useCallback(
    (v: Values) =>
      setSaved((s) => {
        if (s.mode !== 'own' || !s.profile) return { ...s, today: v }
        const d = s.profile.startDay + daysSince(s.profile.startedOn)
        const rest = s.profile.entries.filter((e) => e.day !== d)
        return { ...s, profile: { ...s.profile, entries: [...rest, { day: d, values: v }].sort((a, b) => a.day - b.day) } }
      }),
    [],
  )

  const startDemo = useCallback(() => setSaved((s) => ({ ...s, mode: 'demo', missionId: 'transit', today: null })), [])
  const createProfile = useCallback(
    (p: Profile) => setSaved((s) => ({ ...s, mode: 'own', missionId: p.missionId, profile: p })),
    [],
  )
  const leave = useCallback(
    (erase = false) => setSaved((s) => ({ ...s, mode: null, profile: erase ? null : s.profile })),
    [],
  )
  const resetDemo = useCallback(() => setSaved((s) => ({ ...s, missionId: 'transit', today: null })), [])

  const value: Store = {
    mode: saved.mode,
    crew: own ? { name: own.name, role: own.role } : { name: 'N. Haddad', role: 'Flight engineer' },
    profile: saved.profile,
    mission,
    setMission,
    day,
    entries,
    baseline,
    today,
    saveToday,
    startDemo,
    createProfile,
    leave,
    resetDemo,
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
