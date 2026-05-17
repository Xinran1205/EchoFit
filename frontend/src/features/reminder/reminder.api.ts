import { api } from '../../lib/api'
import type {
  ReminderConfig,
  UpdateReminderConfigInput
} from './reminder.types'

export function getReminderConfig() {
  return api.get<ReminderConfig>('/reminder/config')
}

export function updateReminderConfig(payload: UpdateReminderConfigInput) {
  return api.put<ReminderConfig>('/reminder/config', payload)
}
