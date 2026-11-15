import { STATUS_WORD, stepsFor, type Assessment, type Plan, type Reading } from './engine'
import { fmt } from './indicators'
import { CAREER_LIMIT_MSV, cumulativeDose, roundTripText } from './missions'
import type { IndicatorId, Mission } from './types'

export interface Msg {
  role: 'user' | 'coach'
  text: string
  /** Answered from the on-board rules, without a link to the ground model. */
  onboard?: boolean
}

interface State {
  a: Assessment
  plan: Plan
  mission: Mission
  day: number
  checkedIn: boolean
}

const shown = (r: Reading) => `${r.id === 'mood' ? r.value.toFixed(1) : fmt(r.id, r.value)} ${r.def.unit}`
const base = (r: Reading) => fmt(r.id, r.value - r.delta)
const lower = (r: Reading) => r.def.name.toLowerCase()

function list(names: string[]): string {
  if (names.length <= 1) return names.join('')
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`
}

const numbered = (steps: string[]) => steps.map((s, i) => `${i + 1}. ${s}`).join('\n')

const PROMPT: Record<IndicatorId, (r: Reading) => string> = {
  sleep: () => 'How do I get my sleep back?',
  mood: () => 'What helps with low mood out here?',
  rhr: (r) => `Why is my resting heart rate ${r.direction === 'high' ? 'up' : 'down'}?`,
  sys: () => 'What does my blood pressure mean?',
  dia: () => 'What does my blood pressure mean?',
  temp: (r) => (r.direction === 'high' ? 'What do I do about this temperature?' : 'Why is my temperature low?'),
  glucose: (r) => (r.direction === 'low' ? 'My glucose is low. What now?' : 'What should I do about my glucose?'),
  weight: () => 'How do I stop losing mass?',
  exercise: () => 'How do I catch up on exercise?',
}

/** Questions worth asking right now, most useful first. */
export function suggestions({ a, plan, checkedIn }: State): string[] {
  if (!a.readings.length) return ['What do you track?', 'How much radiation have I taken?']
  const out: string[] = []
  if (plan.tier === 3) out.push('What do I do while I wait for the ground?')
  out.push(`Why is my score ${a.score}?`)
  for (const r of a.flagged.slice(0, 2)) out.push(PROMPT[r.id](r))
  if (plan.tier === 2) out.push('What do I tell the medical officer?')
  if (!a.flagged.length) out.push('What should I keep doing?', 'How much radiation have I taken?')
  if (!checkedIn) out.push('What should I do today?')
  return [...new Set(out)].slice(0, 4)
}

export function greeting({ a, plan }: State): string {
  if (!a.readings.length) return 'No readings yet. Log your first check-in and I can talk you through what they mean.'
  if (!a.flagged.length) return 'Everything is inside your normal range today. Ask me about any reading or what to keep doing.'
  const names = list(a.flagged.slice(0, 3).map(lower))
  return `${plan.status === 'off' ? 'You are off baseline' : 'You are drifting'}: ${names} ${a.flagged.length > 1 ? 'are' : 'is'} outside your normal range. Ask me what it means or what to do.`
}

/** Everything the ground model is allowed to know, as plain text. */
export function buildContext({ a, plan, mission, day, checkedIn }: State): string {
  const wait = roundTripText(mission)
  const lines = [
    `Mission: ${mission.name}, ${mission.dayLabel.toLowerCase()} ${day}. Gravity: ${mission.gravity}.`,
    `Link to Earth: ${wait ? `${mission.delayRange}; a reply takes about ${wait}` : 'live, no delay'}.`,
    `Tether score: ${a.score} of 100 (${STATUS_WORD[a.status]}). Today's check-in: ${checkedIn ? 'done' : `not done yet, readings are from ${mission.dayLabel.toLowerCase()} ${a.day}`}.`,
    `Radiation: ${cumulativeDose(mission, day)} of ${CAREER_LIMIT_MSV} mSv career limit, about ${mission.doseRate} mSv a day.`,
    '',
    a.readings.length ? 'Readings:' : 'Readings: none logged yet.',
    ...a.readings.map(
      (r) =>
        `- ${r.def.name}: ${shown(r)} (${r.def.basis === 'avg3' ? '3-day average' : 'latest'}), personal baseline ${base(r)}, ${STATUS_WORD[r.status]}${r.days ? ` for ${r.days} day${r.days > 1 ? 's' : ''}` : ''}.`,
    ),
    '',
    `Plan decided by the on-board rules: ${plan.title}. ${plan.reason}`,
    ...(plan.steps.length ? ['Steps:', numbered(plan.steps)] : []),
    ...(plan.link ? [`Ground: ${plan.link}`] : []),
  ]
  if (a.flagged.length) {
    lines.push('', 'Background for flagged readings:')
    for (const r of a.flagged) lines.push(`- ${r.def.name}: ${r.def.why} Advice: ${stepsFor(r).join(' ')}`)
  }
  return lines.join('\n')
}

const TOPICS: { ids: IndicatorId[]; words: RegExp }[] = [
  { ids: ['sleep'], words: /sleep|tired|rest\b|insomnia|awake/ },
  { ids: ['mood'], words: /mood|sad|lonely|stress|anxious|feel/ },
  { ids: ['rhr'], words: /heart|pulse|bpm|hr\b/ },
  { ids: ['sys', 'dia'], words: /pressure|bp\b|systolic|diastolic/ },
  { ids: ['temp'], words: /temp|fever|hot|cold|sick|infect/ },
  { ids: ['glucose'], words: /glucose|sugar|eat|food|meal|diet/ },
  { ids: ['weight'], words: /weight|mass|\bkg\b|appetite|calorie/ },
  { ids: ['exercise'], words: /exercise|workout|train|bone|muscle|treadmill/ },
]

function aboutReading(r: Reading): string {
  const head =
    r.status === 'steady'
      ? `Your ${lower(r)} is ${shown(r)}, inside your normal range (baseline ${base(r)}).`
      : `Your ${lower(r)} is ${shown(r)} against a baseline of ${base(r)}${r.days > 1 ? `, and has been off for ${r.days} days` : ''}.`
  const steps = r.status === 'steady' ? [] : stepsFor(r)
  return [head, r.def.why, steps.length ? numbered(steps) : ''].filter(Boolean).join('\n\n')
}

/** Answer from the rules alone. Used when there is no link to the ground model. */
export function localAnswer(question: string, s: State): string {
  const q = question.toLowerCase()
  const { a, plan, mission, day } = s

  if (/radiation|dose|msv/.test(q)) {
    const dose = cumulativeDose(mission, day)
    return `You have taken about ${dose} mSv, ${Math.round((dose / CAREER_LIMIT_MSV) * 100)} percent of the ${CAREER_LIMIT_MSV} mSv career limit. This mission adds roughly ${mission.doseRate} mSv a day. Nothing to do today beyond following shelter calls during solar storms.`
  }
  if (!a.readings.length) {
    return 'I follow eight readings: sleep, mood, resting heart rate, blood pressure, temperature, blood glucose, body mass, and exercise. Each is compared with your own pre-flight baseline. Log your first check-in to get a score.'
  }
  if (/wait|ground|surgeon|officer|tell|call|who\b|report/.test(q)) {
    return [`${plan.title}. ${plan.reason}`, plan.link ?? '', plan.steps.length ? numbered(plan.steps) : ''].filter(Boolean).join('\n\n')
  }
  if (/score|why|drift|baseline/.test(q) && !TOPICS.some((t) => t.words.test(q))) {
    if (!a.flagged.length) return `Your score is ${a.score} because every reading is inside your own normal range.`
    const parts = a.flagged.map((r) => `${lower(r)} at ${shown(r)} against ${base(r)}`)
    return `Your score is ${a.score} because ${list(parts)}. The score falls as readings move away from your own baseline, and the furthest one counts most.\n\n${plan.title}.`
  }
  for (const t of TOPICS) {
    if (!t.words.test(q)) continue
    const rs = a.readings.filter((r) => t.ids.includes(r.id))
    const pick = rs.find((r) => r.status !== 'steady') ?? rs[0]
    if (pick) return aboutReading(pick)
  }
  if (!a.flagged.length) return 'Nothing needs fixing today. Keep your sleep schedule, finish your exercise session, and log tomorrow’s check-in.'
  return [`${plan.title}. ${plan.reason}`, numbered(plan.steps)].join('\n\n')
}

/** Ask the ground model. Throws when there is no link, so the caller can fall back. */
export async function askGround(messages: Msg[], context: string): Promise<string> {
  const res = await fetch('/api/coach', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ context, messages: messages.slice(-12).map(({ role, text }) => ({ role, text })) }),
    signal: AbortSignal.timeout(16000),
  })
  if (!res.ok) throw new Error(`coach ${res.status}`)
  const data = (await res.json()) as { text?: string }
  if (!data.text) throw new Error('coach empty')
  return data.text
}
