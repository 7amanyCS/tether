import type { Entry } from './types'
import { MISSION_DAY } from './missions'

function mulberry32(seed: number) {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const round = (v: number, d = 0) => {
  const f = 10 ** d
  return Math.round(v * f) / f
}

/**
 * Simulated log for the demo crew member, up to yesterday.
 * The last six days carry the story: sleep shortens, mood drops,
 * and resting heart rate creeps up while everything else holds.
 */
export function seedEntries(): Entry[] {
  const rand = mulberry32(20261114)
  // Sum of three uniforms: a cheap bell curve in [-1, 1].
  const noise = () => (rand() + rand() + rand()) / 1.5 - 1

  const slide = {
    sleep: [6.5, 6.3, 6.0, 5.9, 5.8, 5.7],
    mood: [3, 3, 3, 2, 3, 2],
    rhr: [59, 60, 61, 62, 63, 63],
  }
  const first = MISSION_DAY - slide.sleep.length
  const entries: Entry[] = []

  for (let day = 1; day < MISSION_DAY; day++) {
    // One missed day, so the streak is believable.
    if (day === 128) continue
    const k = day - first
    const sliding = k >= 0
    entries.push({
      day,
      values: {
        sleep: sliding ? slide.sleep[k] : round(6.9 + noise() * 0.7, 1),
        mood: sliding ? slide.mood[k] : Math.min(5, Math.max(3, Math.round(4 + noise() * 1.1))),
        rhr: sliding ? slide.rhr[k] : round(58 + noise() * 3.5),
        sys: round(117 + noise() * 7),
        dia: round(75 + noise() * 5),
        temp: round(36.8 + noise() * 0.25, 1),
        glucose: round(90 + noise() * 9),
        // A slow loss that levels off about 1.5 kg under the pre-flight mass.
        weight: round(72 - 1.5 * (1 - Math.exp(-day / 45)) + noise() * 0.25, 1),
        exercise: round((112 + noise() * 28) / 5) * 5,
      },
    })
  }
  return entries
}
