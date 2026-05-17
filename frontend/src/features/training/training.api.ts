import { api } from '../../lib/api'
import type {
  CreateTrainingRecordInput,
  CreateTrainingRecordResult,
  HomeSummary,
  LatestWeightResult,
  MonthRecordsResult,
  TrainingRecord,
  UpdateTrainingRecordInput
} from './training.types'

export function getHomeSummary() {
  return api.get<HomeSummary>('/home/summary')
}

export function createTrainingRecord(payload: CreateTrainingRecordInput) {
  return api.post<CreateTrainingRecordResult>('/training-records', payload)
}

export function updateTrainingRecord(recordId: string, payload: UpdateTrainingRecordInput) {
  return api.put<TrainingRecord>(`/training-records/${recordId}`, payload)
}

export function getTrainingRecordByDate(date: string) {
  return api.get<TrainingRecord | null>(`/training-records/by-date?date=${date}`)
}

export function getTrainingRecordById(recordId: string) {
  return api.get<TrainingRecord>(`/training-records/${recordId}`)
}

export function getMonthRecords(month: string) {
  return api.get<MonthRecordsResult>(`/training-records/month?month=${month}`)
}

export function getLatestWeight() {
  return api.get<LatestWeightResult>('/training-records/latest-weight')
}
