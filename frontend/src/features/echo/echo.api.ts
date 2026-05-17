import { api } from '../../lib/api'
import type {
  EchoResponse,
  FutureMessageSavedResult,
  SaveFutureMessageInput
} from './echo.types'

export function getEchoByRecord(recordId: string) {
  return api.get<EchoResponse>(`/echo/by-record/${recordId}`)
}

export function saveFutureMessage(payload: SaveFutureMessageInput) {
  return api.post<FutureMessageSavedResult>('/echo/future-message', payload)
}
