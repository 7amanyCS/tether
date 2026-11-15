import { INDICATORS, SYSTEMS, fmt, getIndicator } from './indicators'
import { roundTripText } from './missions'
import type { Baseline, Entry, IndicatorDef, IndicatorId, Mission, Status, SystemId } from './types'

const DRIFT_Z = 1.75
const OFF_Z = 3

const RANK: Record<Status, number> = { steady: 0, drifting: 1, off: 2 }
export const worst = (a: Status, b: Status): Status => (RANK[a] >= RANK[b] ? a : b)

export const STATUS_WORD: Record<Status, string> = {
  steady: 'Steady',
  drifting: 'Drifting',
  off: 'Off baseline',
}

export interface Reading {
  id: IndicatorId
  def: IndicatorDef
  /** The number being judged: latest reading or three-day average. */
  value: number
  latest: number
  delta: number
  z: number
  direction: 'low' | 'high'
  status: Status
  score: number
  /** Consecutive days this indicator has been off steady. */
  days: number
}

export interface SystemState {
  id: SystemId
  status: Status
  score: number
  readings: Reading[]
}

export interface Assessment {
  day: number | null
  score: number
  status: Status
  readings: Reading[]
  systems: SystemState[]
  flagged: Reading[]
}

function valueFor(def: IndicatorDef, entries: Entry[]): { value: number; latest: number } | null {
  const seen: number[] = []
  for (let i = entries.length - 1; i >= 0 && seen.length < 3; i--) {
    const v = entries[i].values[def.id]
    if (typeof v === 'number') seen.push(v)
  }
  if (!seen.length) return null
  const latest = seen[0]
  const value = def.basis === 'avg3' ? seen.reduce((a, b) => a + b, 0) / seen.length : latest
  return { value, latest }
}

function judge(def: IndicatorDef, base: Baseline, entries: Entry[]): Omit<Reading, 'days'> | null {
  const got = valueFor(def, entries)
  if (!got) return null
  const { value, latest } = got
  const z = (value - base.mean) / base.sd
  const direction = z < 0 ? 'low' : 'high'
  const matters = def.concern === 'both' || def.concern === direction
  const badZ = matters ? Math.abs(z) : 0

  let status: Status = badZ >= OFF_Z ? 'off' : badZ >= DRIFT_Z ? 'drifting' : 'steady'
  const l = def.limits
  if ((l.offLow !== undefined && value <= l.offLow) || (l.offHigh !== undefined && value >= l.offHigh)) {
    status = 'off'
  } else if (
    (l.driftLow !== undefined && value <= l.driftLow) ||
    (l.driftHigh !== undefined && value >= l.driftHigh)
  ) {
    status = worst(status, 'drifting')
  }

  let score = 100 - Math.min(1, Math.max(0, (badZ - 1) / 2.5)) * 100
  if (status === 'off') score = Math.min(score, 30)
  else if (status === 'drifting') score = Math.min(score, 68)

  return { id: def.id, def, value, latest, delta: value - base.mean, z, direction, status, score }
}

/** Assess the crew member's state from the log, as of its last entry. */
export function assess(entries: Entry[], baseline: Record<IndicatorId, Baseline>): Assessment {
  const readings: Reading[] = []
  for (const def of INDICATORS) {
    const r = judge(def, baseline[def.id], entries)
    if (!r) continue
    let days = 0
    if (r.status !== 'steady') {
      days = 1
      for (let end = entries.length - 1; end > 0 && days < 30; end--) {
        const past = judge(def, baseline[def.id], entries.slice(0, end))
        if (!past || past.status === 'steady') break
        days++
      }
    }
    readings.push({ ...r, days })
  }

  const systems: SystemState[] = SYSTEMS.map((s) => {
    const rs = readings.filter((r) => s.indicators.includes(r.id))
    return {
      id: s.id,
      readings: rs,
      status: rs.reduce<Status>((acc, r) => worst(acc, r.status), 'steady'),
      score: rs.length ? Math.min(...rs.map((r) => r.score)) : 100,
    }
  })

  const scores = systems.map((s) => s.score)
  const mean = scores.reduce((a, b) => a + b, 0) / scores.length
  const score = Math.round(0.5 * mean + 0.5 * Math.min(...scores))
  const flagged = readings
    .filter((r) => r.status !== 'steady')
    .sort((a, b) => RANK[b.status] - RANK[a.status] || Math.abs(b.z) - Math.abs(a.z))

  return {
    day: entries.length ? entries[entries.length - 1].day : null,
    score,
    status: readings.reduce<Status>((acc, r) => worst(acc, r.status), 'steady'),
    readings,
    systems,
    flagged,
  }
}

export interface Plan {
  tier: 0 | 1 | 2 | 3
  status: Status
  title: string
  reason: string
  steps: string[]
  /** How and when help from the ground arrives, when it is needed. */
  link: string | null
}

function list(names: string[]): string {
  if (names.length <= 1) return names.join('')
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`
}

export function stepsFor(r: Reading): string[] {
  return r.direction === 'low' ? r.def.low : r.def.high
}

/** Turn an assessment into one decision: who needs to know, and what to do now. */
export function plan(a: Assessment, mission: Mission): Plan {
  const off = a.flagged.filter((r) => r.status === 'off')
  const drifting = a.flagged.filter((r) => r.status === 'drifting')
  const driftingSystems = a.systems.filter((s) => s.status === 'drifting').length
  const longest = Math.max(0, ...drifting.map((r) => r.days))
  const names = (rs: Reading[]) => list(rs.map((r) => r.def.name.toLowerCase()))
  const steps = (rs: Reading[]) => [...new Set(rs.flatMap(stepsFor))].slice(0, 4)
  const wait = roundTripText(mission)

  if (off.length) {
    const r = off[0]
    return {
      tier: 3,
      status: 'off',
      title: 'Contact the flight surgeon',
      reason: `${cap(names(off))} ${off.length > 1 ? 'are' : 'is'} outside your safe range: ${fmt(r.id, r.value)} ${r.def.unit} against a baseline of ${fmt(r.id, r.value - r.delta)}.`,
      steps: ['Tell your crew medical officer now.', ...steps(off)].slice(0, 5),
      link: wait
        ? mission.delay >= 60
          ? `Send your readings now. A reply takes about ${wait}, so start the steps above while you wait.`
          : `Voice link to the ground has a ${wait} round trip. Call now.`
        : 'The flight surgeon is on a live link. Call now.',
    }
  }
  if (driftingSystems >= 2 || longest >= 3) {
    return {
      tier: 2,
      status: 'drifting',
      title: 'Tell your crew medical officer',
      reason:
        longest >= 3
          ? `${cap(names(drifting))} ${drifting.length > 1 ? 'have' : 'has'} been off your baseline for ${longest} days. That is a trend, not a bad night.`
          : `${cap(names(drifting))} are off your baseline at the same time.`,
      steps: steps(drifting),
      link: 'No call to the ground needed yet. Your readings go out with the next routine medical downlink.',
    }
  }
  if (drifting.length) {
    return {
      tier: 1,
      status: 'drifting',
      title: 'Handle it yourself today',
      reason: `${cap(names(drifting))} ${drifting.length > 1 ? 'are' : 'is'} a little off your baseline. One day like this is normal.`,
      steps: steps(drifting),
      link: null,
    }
  }
  return {
    tier: 0,
    status: 'steady',
    title: 'Nothing to act on',
    reason: 'Every indicator is inside your own normal range. Keep the routine that is working.',
    steps: [],
    link: null,
  }
}

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

/** Signed difference from baseline, e.g. "+7" or "−1.4". */
export function deltaText(r: Reading): string {
  const d = r.delta
  const text = Math.abs(d).toFixed(r.def.decimals === 0 && r.def.basis === 'avg3' ? 1 : r.def.decimals)
  if (Number(text) === 0) return 'At baseline'
  return `${d < 0 ? '−' : '+'}${text} vs baseline`
}

/** Consecutive days logged, counting back from the latest entry. */
export function streak(entries: Entry[]): number {
  let n = 0
  for (let i = entries.length - 1; i >= 0; i--) {
    if (i < entries.length - 1 && entries[i + 1].day - entries[i].day !== 1) break
    n++
  }
  return n
}

export function series(entries: Entry[], id: IndicatorId, days: number): { day: number; v: number }[] {
  const out: { day: number; v: number }[] = []
  for (const e of entries.slice(-days)) {
    const v = e.values[id]
    if (typeof v === 'number') out.push({ day: e.day, v })
  }
  return out
}

export function bandFor(id: IndicatorId, base: Baseline): { lo: number; hi: number } {
  const def = getIndicator(id)
  return {
    lo: def.concern === 'high' ? -Infinity : base.mean - DRIFT_Z * base.sd,
    hi: def.concern === 'low' ? Infinity : base.mean + DRIFT_Z * base.sd,
  }
}
