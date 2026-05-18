import { api } from '../../lib/api'
import type {
  AuthSession,
  LoginInput,
  RegisterInput,
  UpdatePasswordInput,
  UpdateUserProfileInput,
  UserProfile
} from './auth.types'

export function login(payload: LoginInput) {
  return api.post<AuthSession>('/auth/login', payload)
}

export function sendRegisterVerificationCode(email: string) {
  return api.post<void>('/auth/register/code', { email })
}

export function register(payload: RegisterInput) {
  return api.post<AuthSession>('/auth/register', payload)
}

export function fetchCurrentUser() {
  return api.get<UserProfile>('/auth/me')
}

export function updateUserProfile(payload: UpdateUserProfileInput) {
  return api.put<UserProfile>('/user/profile', payload)
}

export function sendPasswordChangeVerificationCode() {
  return api.post<void>('/user/password/code')
}

export function updatePassword(payload: UpdatePasswordInput) {
  return api.put<void>('/user/password', payload)
}
