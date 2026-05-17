import type { TrainingMood, TrainingPart } from '../training/training.types'

export type EchoMessage = {
  source: 'future_message' | 'fact' | 'system'
  content: string
}

export type EchoRecordSummary = {
  id: string
  date: string
  parts: TrainingPart[]
  durationMinutes: number
  mood: TrainingMood
  weightKg?: number | null
}

export type EchoResponse = {
  record: EchoRecordSummary
  echo: EchoMessage
}

export type SaveFutureMessageInput = {
  recordId: string
  content: string
}

export type FutureMessageSavedResult = {
  echoMessageId: string
}
