import { api } from '../../lib/api'
import type {
  CreateRestDayInput,
  CreateTrainingRecordInput,
  CreateTrainingRecordResult,
  HomeSummary,
  LatestWeightResult,
  MonthRecordsResult,
  RestDay,
  TrainingRecord,
  UpdateTrainingRecordInput
} from './training.types'

function appendTrainingRecordFormData(
  formData: FormData,
  payload: CreateTrainingRecordInput | UpdateTrainingRecordInput,
  photos: File[],
  keptPhotoIds?: string[]
) {
  formData.append(
    'payload',
    new Blob([JSON.stringify(payload)], {
      type: 'application/json'
    })
  )

  keptPhotoIds?.forEach((photoId) => {
    formData.append('keptPhotoIds', photoId)
  })

  photos.forEach((photo) => {
    formData.append('photos', photo)
  })
}

export function getHomeSummary() {
  return api.get<HomeSummary>('/home/summary')
}

export function createTrainingRecord(payload: CreateTrainingRecordInput, photos: File[] = []) {
  const formData = new FormData()
  appendTrainingRecordFormData(formData, payload, photos)
  return api.post<CreateTrainingRecordResult>('/training-records', formData)
}

export function updateTrainingRecord(
  recordId: string,
  payload: UpdateTrainingRecordInput,
  options?: {
    keptPhotoIds?: string[]
    newPhotos?: File[]
  }
) {
  const formData = new FormData()
  appendTrainingRecordFormData(
    formData,
    payload,
    options?.newPhotos ?? [],
    options?.keptPhotoIds ?? []
  )
  return api.put<TrainingRecord>(`/training-records/${recordId}`, formData)
}

export function createRestDay(payload: CreateRestDayInput) {
  return api.post<RestDay>('/training-records/rest-days', payload)
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
