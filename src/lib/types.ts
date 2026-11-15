export type IndicatorId =
  | 'sleep'
  | 'mood'
  | 'rhr'
  | 'sys'
  | 'dia'
  | 'temp'
  | 'glucose'
  | 'exercise'

export type SystemId = 'mind' | 'heart' | 'immune' | 'metabolism' | 'bone'

export type Status = 'steady' | 'drifting' | 'off'

export type Values = Partial<Record<IndicatorId, number>>

export interface Entry {
  day: number
  values: Values
}

export interface Baseline {
  mean: number
  sd: number
}

export type SourceId =
  | 'hazards'
  | 'barger'
  | 'stahn'
  | 'crucian'
  | 'hughson'
  | 'lang'
  | 'zeitlin'
  | 'hassler'
  | 'zhang'
  | 'std3001'

export interface IndicatorDef {
  id: IndicatorId
  name: string
  short: string
  unit: string
  decimals: number
  step: number
  min: number
  max: number
  /** Which direction of drift is a concern. */
  concern: 'low' | 'high' | 'both'
  /** Judge on the latest reading, or on the average of the last three. */
  basis: 'latest' | 'avg3'
  /** Fixed limits that apply to anyone, whatever their baseline. */
  limits: { driftLow?: number; offLow?: number; driftHigh?: number; offHigh?: number }
  why: string
  measure: string
  low: string[]
  high: string[]
  sources: SourceId[]
}

export interface SystemDef {
  id: SystemId
  name: string
  indicators: IndicatorId[]
  hazard: string
  about: string
  /** Position on the body figure, in percent of its box. */
  spot: { x: number; y: number }
}

export interface Mission {
  id: 'iss' | 'moon' | 'transit' | 'mars'
  name: string
  dayLabel: string
  gravity: string
  /** One-way signal delay in seconds: nominal, and the range over the mission. */
  delay: number
  delayRange: string
  /** Average dose rate in mSv per day, and dose already taken before this phase. */
  doseRate: number
  priorDose: number
  doseSource: SourceId
  note: string
}
