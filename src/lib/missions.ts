import type { Mission } from './types'

export const MISSION_DAY = 142

/** NASA career limit for space radiation exposure (NASA-STD-3001, 2022 revision). */
export const CAREER_LIMIT_MSV = 600

export const MISSIONS: Mission[] = [
  {
    id: 'iss',
    name: 'Space station',
    dayLabel: 'Flight day',
    gravity: 'Microgravity',
    delay: 0,
    delayRange: 'Real time',
    doseRate: 0.6,
    priorDose: 0,
    doseSource: 'hazards',
    note: 'Low Earth orbit. A flight surgeon is on console and can answer right away.',
  },
  {
    id: 'moon',
    name: 'Lunar surface',
    dayLabel: 'Mission day',
    gravity: '1/6 g',
    delay: 1.3,
    delayRange: '1.3 s each way',
    doseRate: 1.37,
    priorDose: 0,
    doseSource: 'zhang',
    note: 'Partial gravity and no magnetic shielding. Ground can still talk you through a problem.',
  },
  {
    id: 'transit',
    name: 'Mars transit',
    dayLabel: 'Flight day',
    gravity: 'Microgravity',
    delay: 600,
    delayRange: '4 to 24 min each way',
    doseRate: 1.8,
    priorDose: 0,
    doseSource: 'zeitlin',
    note: 'Deep space. Every answer from Earth arrives late, so the first response is yours.',
  },
  {
    id: 'mars',
    name: 'Mars surface',
    dayLabel: 'Sol',
    gravity: '3/8 g',
    delay: 840,
    delayRange: '4 to 24 min each way',
    doseRate: 0.67,
    priorDose: 324,
    doseSource: 'hassler',
    note: 'Dose includes a 180-day outbound transit. Earth is too far away for a live conversation.',
  },
]

export function getMission(id: string): Mission {
  return MISSIONS.find((m) => m.id === id) ?? MISSIONS[2]
}

export function cumulativeDose(m: Mission, day: number): number {
  return Math.round(m.priorDose + m.doseRate * day)
}

/** "28 min", "3 s", or null when the link is live. */
export function roundTripText(m: Mission): string | null {
  if (m.delay === 0) return null
  const s = m.delay * 2
  if (s < 60) return `${Math.round(s)} s`
  return `${Math.round(s / 60)} min`
}
