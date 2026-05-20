import type { TrainingPart } from '../training/training.types'

export type InsightRangeType = 'week' | 'month' | 'custom'

export type InsightRangeInput = {
  rangeType: InsightRangeType
  startDate?: string
  endDate?: string
}

export type InsightEchoExcerpt = {
  id: string
  date: string
  content: string
}

export type InsightSummary = {
  rangeType: InsightRangeType
  startDate: string
  endDate: string
  overview: {
    trainingDays: number
    totalDurationMinutes: number
  }
  partCounts: Record<TrainingPart, number>
  echoPreview: {
    totalMessages: number
    excerpts: InsightEchoExcerpt[]
  }
}

export type InsightEchoPageResult = {
  rangeType: InsightRangeType
  startDate: string
  endDate: string
  totalMessages: number
  page: number
  pageSize: number
  totalPages: number
  items: InsightEchoExcerpt[]
}
