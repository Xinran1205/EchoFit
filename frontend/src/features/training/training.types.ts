export type TrainingPart =
  | 'chest'
  | 'back'
  | 'shoulder'
  | 'legs'
  | 'arms'
  | 'core'
  | 'cardio'
  | 'stretch'

export type TrainingMood =
  | 'effective'
  | 'normal'
  | 'tired_but_done'
  | 'recovery'
  | 'light'

export type TrainingRecord = {
  id: string
  userId: string
  date: string
  parts: TrainingPart[]
  durationMinutes: number
  mood: TrainingMood
  weightKg?: number | null
  note?: string | null
  futureMessagePreview?: string | null
  createdAt: string
  updatedAt: string
}

export type HomeSummary = {
  today: string
  todayRecorded: boolean
  last7Days: {
    trainingDays: number
    totalDurationMinutes: number
    partCounts: Record<TrainingPart, number>
  }
}

export type TrainingOption<T extends string> = {
  label: string
  value: T
}

export type CreateTrainingRecordInput = {
  date: string
  parts: TrainingPart[]
  durationMinutes: number
  mood: TrainingMood
  weightKg?: number
  note?: string
}

export type UpdateTrainingRecordInput = {
  parts: TrainingPart[]
  durationMinutes: number
  mood: TrainingMood
  weightKg?: number
  note?: string
}

export type CreateTrainingRecordResult = {
  recordId: string
  echoId: string
}

export type MonthRecordsResult = {
  month: string
  records: TrainingRecord[]
}

export type LatestWeightResult = {
  weightKg: number | null
}
