import { api } from '../../lib/api'
import type { AuthSession, UserProfile } from './auth.types'

type AuthPayload = {
  email: string
  password: string
}

export function login(payload: AuthPayload) {
  return api.post<AuthSession>('/auth/login', payload)
}

export function register(payload: AuthPayload) {
  return api.post<AuthSession>('/auth/register', payload)
}

export function fetchCurrentUser() {
  return api.get<UserProfile>('/auth/me')
}
